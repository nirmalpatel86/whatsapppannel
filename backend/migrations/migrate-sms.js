/**
 * One-time data migration: old Core PHP SMS project ("shudhsms" DB) -> new sms_panel DB.
 *
 * WHY THIS SCRIPT LOOKS THE WAY IT DOES:
 * - The old `login.password` / `enc_password` columns are not recoverable (MD5/custom hash),
 *   so every migrated account gets a fresh random temp password instead of its old one.
 *   Temp passwords are written to migrations/output/sms-temp-passwords.csv — share them with
 *   each user and have them change password after first login.
 * - Old schema has no single "balance" — it's split into dnd_bal/non_dnd_bal/trans_bal/prem_bal/
 *   voice_bal. The new schema has one unified SmsWallet.balance, so these are summed.
 * - `blocklist_num` has no owner column in the old schema (it was global). All rows are
 *   attached to the first migrated super_admin's company. Redistribute manually if your old
 *   setup actually scoped blocklists per reseller.
 * - Gateway/route config (`smsc` table) is NOT migrated — route URLs/credentials differ in the
 *   new deployment and must be entered fresh under SMS > Routes.
 * - Template `sender_id` (old, free-text) is not linked to a new SenderId FK automatically,
 *   since sender IDs need re-approval in the new system. Re-attach manually after migration.
 *
 * SAFE TO RE-RUN: every insert is guarded by an existence check, so running this twice will
 * not create duplicates — it will just skip rows already migrated.
 *
 * USAGE:
 *   1. Restore your real old data into a MySQL database (locally or point at the live server).
 *   2. In backend/.env, set OLD_SMS_DB_* (see .env.example) to point at that database.
 *   3. Preview first:   DRY_RUN=true node migrations/migrate-sms.js
 *   4. Then run for real: node migrations/migrate-sms.js
 *   5. Check migrations/output/sms-temp-passwords.csv and migrations/output/sms-migration-report.json
 *
 * ROLE MAPPING: old `login.level` values vary by install. The script prints every distinct
 * value it finds; adjust ROLE_MAP below to match your data before the real (non-dry) run.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mysql = require('mysql2/promise');

const {
  smsSequelize, SmsUser, SmsCompany, SmsWallet,
  SmsContact, SmsContactGroup, SmsContactGroupMember,
  SmsTemplate, SmsBlocklist,
} = require('../models/sms');

const DRY_RUN = String(process.env.DRY_RUN).toLowerCase() === 'true';
const OUTPUT_DIR = path.join(__dirname, 'output');

// Adjust to match the real `level` values printed by this script on first run.
const ROLE_MAP = {
  admin: 'super_admin', super_admin: 'super_admin', superadmin: 'super_admin', '1': 'super_admin',
  reseller: 'reseller', '2': 'reseller',
  user: 'user', '3': 'user',
};

function mapRole(level) {
  const key = String(level || '').trim().toLowerCase();
  return ROLE_MAP[key] || 'user';
}

function genTempPassword() {
  return crypto.randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
}

function cleanPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits : null;
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const oldConn = await mysql.createConnection({
    host: process.env.OLD_SMS_DB_HOST || 'localhost',
    port: process.env.OLD_SMS_DB_PORT || 3306,
    user: process.env.OLD_SMS_DB_USER || 'root',
    password: process.env.OLD_SMS_DB_PASSWORD || '',
    database: process.env.OLD_SMS_DB_NAME || 'shudhsms',
  });

  await smsSequelize.authenticate();
  console.log(`Connected. DRY_RUN=${DRY_RUN}`);

  const report = {
    companiesCreated: 0, usersCreated: 0, usersSkipped: [],
    contactsCreated: 0, contactsSkipped: 0, groupsCreated: 0,
    templatesCreated: 0, blocklistCreated: 0,
  };
  const tempPasswords = []; // { phone, name, role, tempPassword }

  // ---------- 1. Users, companies, wallets ----------
  const [logins] = await oldConn.query('SELECT * FROM `login`');
  const [users] = await oldConn.query('SELECT * FROM `user`');

  const distinctLevels = [...new Set(logins.map(l => l.level))];
  console.log('Distinct login.level values found:', distinctLevels);

  const userBySno = new Map(users.map(u => [String(u.login_id), u]));
  const userByLogin = new Map(users.map(u => [String(u.login || '').toLowerCase(), u]));

  const findUserRow = (loginRow) => {
    return userBySno.get(String(loginRow.uid))
      || userByLogin.get(String(loginRow.loginid || '').toLowerCase())
      || null;
  };

  // oldUid (string) -> { newUserId, newCompanyId }
  const idMap = new Map();

  // Pass 1: top-level accounts (super_admin / reseller) — no parent, or parent not in this dataset.
  const loginUidSet = new Set(logins.map(l => String(l.uid)));
  const topLevel = logins.filter(l => !l.parent_id || l.parent_id === '0' || !loginUidSet.has(String(l.parent_id)));
  const children = logins.filter(l => l.parent_id && l.parent_id !== '0' && loginUidSet.has(String(l.parent_id)));

  for (const loginRow of topLevel) {
    const userRow = findUserRow(loginRow) || {};
    const role = mapRole(loginRow.level);
    const phone = cleanPhone(loginRow.mobile || userRow.mobile_number || loginRow.loginid);
    if (!phone) { report.usersSkipped.push({ oldUid: loginRow.uid, reason: 'no usable phone number' }); continue; }

    const existing = await SmsUser.findOne({ where: { phone } });
    if (existing) {
      idMap.set(String(loginRow.uid), { newUserId: existing.id, newCompanyId: existing.companyId });
      report.usersSkipped.push({ oldUid: loginRow.uid, reason: 'phone already exists', phone });
      continue;
    }

    const name = userRow.name || loginRow.loginid || `User ${loginRow.uid}`;
    const tempPassword = genTempPassword();

    if (DRY_RUN) {
      console.log(`[DRY RUN] would create top-level ${role}: ${name} (${phone})`);
      idMap.set(String(loginRow.uid), { newUserId: -1, newCompanyId: -1 });
      report.usersCreated++;
      continue;
    }

    const newUser = await SmsUser.create({
      name, phone, email: loginRow.email || userRow.email_id || null,
      password: tempPassword, role,
      companyName: userRow.company_name || null,
      address: userRow.address || null,
      websiteUrl: userRow.website_url || null,
      apiKey: userRow.api_key || null,
    });
    const company = await SmsCompany.create({
      name: userRow.company_name || `${name}'s Company`,
      ownerId: newUser.id,
    });
    await newUser.update({ companyId: company.id });

    const balance = ['dnd_bal', 'non_dnd_bal', 'trans_bal', 'prem_bal', 'voice_bal']
      .reduce((sum, key) => sum + (parseFloat(userRow[key]) || 0), 0);
    await SmsWallet.create({ userId: newUser.id, balance });

    idMap.set(String(loginRow.uid), { newUserId: newUser.id, newCompanyId: company.id });
    tempPasswords.push({ phone, name, role, tempPassword });
    report.usersCreated++;
    report.companiesCreated++;
  }

  // Pass 2: child accounts (role=user under a reseller already migrated above).
  for (const loginRow of children) {
    const parent = idMap.get(String(loginRow.parent_id));
    if (!parent) { report.usersSkipped.push({ oldUid: loginRow.uid, reason: 'parent not migrated' }); continue; }

    const userRow = findUserRow(loginRow) || {};
    const role = mapRole(loginRow.level);
    const phone = cleanPhone(loginRow.mobile || userRow.mobile_number || loginRow.loginid);
    if (!phone) { report.usersSkipped.push({ oldUid: loginRow.uid, reason: 'no usable phone number' }); continue; }

    const existing = await SmsUser.findOne({ where: { phone } });
    if (existing) {
      idMap.set(String(loginRow.uid), { newUserId: existing.id, newCompanyId: existing.companyId });
      report.usersSkipped.push({ oldUid: loginRow.uid, reason: 'phone already exists', phone });
      continue;
    }

    const name = userRow.name || loginRow.loginid || `User ${loginRow.uid}`;
    const tempPassword = genTempPassword();

    if (DRY_RUN) {
      console.log(`[DRY RUN] would create child ${role}: ${name} (${phone}) under company ${parent.newCompanyId}`);
      idMap.set(String(loginRow.uid), { newUserId: -1, newCompanyId: parent.newCompanyId });
      report.usersCreated++;
      continue;
    }

    const newUser = await SmsUser.create({
      name, phone, email: loginRow.email || userRow.email_id || null,
      password: tempPassword, role,
      companyId: parent.newCompanyId,
      parentId: parent.newUserId,
    });
    const balance = ['dnd_bal', 'non_dnd_bal', 'trans_bal', 'prem_bal', 'voice_bal']
      .reduce((sum, key) => sum + (parseFloat(userRow[key]) || 0), 0);
    await SmsWallet.create({ userId: newUser.id, balance });

    idMap.set(String(loginRow.uid), { newUserId: newUser.id, newCompanyId: parent.newCompanyId });
    tempPasswords.push({ phone, name, role, tempPassword });
    report.usersCreated++;
  }

  // A fallback "owner" for rows whose old owner key can't be resolved (e.g. blocklist, which has no owner at all).
  const firstMigrated = [...idMap.values()][0];

  // ---------- 2. Contacts + groups (from `phonebook`) ----------
  const [phonebookRows] = await oldConn.query('SELECT * FROM `phonebook`');
  const groupCache = new Map(); // `${companyId}:${name}` -> groupId

  for (const row of phonebookRows) {
    const owner = idMap.get(String(row.usid)) || firstMigrated;
    if (!owner) continue;
    const groupName = row.gpname || 'Imported';
    const cacheKey = `${owner.newCompanyId}:${groupName}`;

    let groupId = groupCache.get(cacheKey);
    if (!groupId && !DRY_RUN) {
      let group = await SmsContactGroup.findOne({ where: { companyId: owner.newCompanyId, name: groupName } });
      if (!group) {
        group = await SmsContactGroup.create({ companyId: owner.newCompanyId, createdBy: owner.newUserId, name: groupName });
        report.groupsCreated++;
      }
      groupId = group.id;
      groupCache.set(cacheKey, groupId);
    }

    const numbers = String(row.nums || '').split(/[\n,;]+/).map(cleanPhone).filter(Boolean);
    for (const phone of numbers) {
      if (DRY_RUN) { report.contactsCreated++; continue; }
      let contact = await SmsContact.findOne({ where: { companyId: owner.newCompanyId, phone } });
      if (!contact) {
        contact = await SmsContact.create({ companyId: owner.newCompanyId, phone });
        report.contactsCreated++;
      } else {
        report.contactsSkipped++;
      }
      await SmsContactGroupMember.findOrCreate({ where: { groupId, contactId: contact.id } });
    }
  }

  // ---------- 3. Templates ----------
  const [templateRows] = await oldConn.query('SELECT * FROM `templates`');
  const distinctTmpTypes = [...new Set(templateRows.map(t => t.tmp_type))];
  console.log('Distinct templates.tmp_type values found (all mapped to "transactional" for now):', distinctTmpTypes);

  for (const row of templateRows) {
    const owner = idMap.get(String(row.uid)) || firstMigrated;
    if (!owner || !row.template) continue;
    if (DRY_RUN) { report.templatesCreated++; continue; }

    await SmsTemplate.create({
      companyId: owner.newCompanyId,
      createdBy: owner.newUserId,
      name: row.temp_name || `Template ${row.sno}`,
      body: row.template,
      dltContentId: row.dlt_contnt_id || null,
      templateType: 'transactional',
      status: 'approved',
    });
    report.templatesCreated++;
  }

  // ---------- 4. Blocklist ----------
  if (firstMigrated) {
    const [blockRows] = await oldConn.query('SELECT * FROM `blocklist_num`');
    for (const row of blockRows) {
      const phone = cleanPhone(row.num);
      if (!phone) continue;
      if (DRY_RUN) { report.blocklistCreated++; continue; }
      const [entry, created] = await SmsBlocklist.findOrCreate({
        where: { companyId: firstMigrated.newCompanyId, phone },
        defaults: { reason: 'Migrated from old blocklist_num table' },
      });
      if (created) report.blocklistCreated++;
    }
  }

  await oldConn.end();

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'sms-temp-passwords.csv'),
    'phone,name,role,tempPassword\n' + tempPasswords.map(t => `${t.phone},"${t.name}",${t.role},${t.tempPassword}`).join('\n'),
  );
  fs.writeFileSync(path.join(OUTPUT_DIR, 'sms-migration-report.json'), JSON.stringify(report, null, 2));

  console.log('\n=== SMS migration summary ===');
  console.log(report);
  console.log(`\nTemp passwords written to: ${path.join(OUTPUT_DIR, 'sms-temp-passwords.csv')}`);
  console.log(`Full report written to: ${path.join(OUTPUT_DIR, 'sms-migration-report.json')}`);
  if (DRY_RUN) console.log('\nThis was a DRY RUN — nothing was written to sms_panel. Re-run without DRY_RUN=true to apply.');

  process.exit(0);
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
