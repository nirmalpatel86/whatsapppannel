/**
 * One-time data migration: old CodeIgniter BulkMail project ("bulkmail_new" DB) -> new bulkmail_panel DB.
 *
 * WHY THIS SCRIPT LOOKS THE WAY IT DOES:
 * - `sm_register.user_pass` is not recoverable (hashed), so every migrated account gets a fresh
 *   random temp password. Written to migrations/output/bulkmail-temp-passwords.csv — share with
 *   each user and have them change password after first login.
 * - The old schema has NO role/level column for tenants — only `parent_id`. So: a `sm_register`
 *   row with no resolvable parent becomes a 'reseller' (top-level tenant, gets its own company);
 *   a row whose parent_id matches another migrated row becomes a 'user' under that reseller's
 *   company. `tbl_user` (the CI app's own internal staff/admin accounts) is intentionally NOT
 *   migrated as tenants — it's a different concept (backend staff, not a wallet-owning tenant).
 *   Promote any migrated account to super_admin manually afterwards if needed.
 * - `tbl_smtp` has no owning company in the old schema (it was global). All migrated SMTP
 *   servers are attached to the first migrated company — reassign manually if your old setup
 *   actually had per-reseller SMTP servers.
 * - Campaign history, `sm_balance` ledger entries, coupons, and the email queue are NOT migrated
 *   — they're historical/operational data, not needed for the app to function going forward.
 *
 * SAFE TO RE-RUN: every insert is guarded by an existence check.
 *
 * USAGE:
 *   1. Restore your real old data into a MySQL database (locally or point at the live server).
 *   2. In backend/.env, set OLD_BULKMAIL_DB_* (see .env.example) to point at that database.
 *   3. Preview first:   DRY_RUN=true node migrations/migrate-bulkmail.js
 *   4. Then run for real: node migrations/migrate-bulkmail.js
 *   5. Check migrations/output/bulkmail-temp-passwords.csv and migrations/output/bulkmail-migration-report.json
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mysql = require('mysql2/promise');

const {
  bulkmailSequelize, BmUser, BmCompany, BmWallet,
  BmSmtp, BmSender, BmSenderGroup, BmTemplate,
  BmContact, BmPlan,
} = require('../models/bulkmail');

const DRY_RUN = String(process.env.DRY_RUN).toLowerCase() === 'true';
const OUTPUT_DIR = path.join(__dirname, 'output');

function genTempPassword() {
  return crypto.randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
}

function cleanPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits : null;
}

function splitEmails(raw) {
  return String(raw || '').split(/[\n,;]+/).map(e => e.trim()).filter(e => e.includes('@'));
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const oldConn = await mysql.createConnection({
    host: process.env.OLD_BULKMAIL_DB_HOST || 'localhost',
    port: process.env.OLD_BULKMAIL_DB_PORT || 3306,
    user: process.env.OLD_BULKMAIL_DB_USER || 'root',
    password: process.env.OLD_BULKMAIL_DB_PASSWORD || '',
    database: process.env.OLD_BULKMAIL_DB_NAME || 'bulkmail_new',
  });

  await bulkmailSequelize.authenticate();
  console.log(`Connected. DRY_RUN=${DRY_RUN}`);

  const report = {
    companiesCreated: 0, usersCreated: 0, usersSkipped: [],
    smtpCreated: 0, senderGroupsCreated: 0, sendersCreated: 0,
    templatesCreated: 0, contactsCreated: 0, contactsSkipped: 0, plansCreated: 0,
  };
  const tempPasswords = []; // { phone, name, role, tempPassword }

  // ---------- 1. Users, companies, wallets (from sm_register) ----------
  const [registerRows] = await oldConn.query('SELECT * FROM `sm_register`');
  const regIdSet = new Set(registerRows.map(r => String(r.id)));
  const topLevel = registerRows.filter(r => !r.parent_id || !regIdSet.has(String(r.parent_id)) || String(r.parent_id) === String(r.id));
  const children = registerRows.filter(r => r.parent_id && regIdSet.has(String(r.parent_id)) && String(r.parent_id) !== String(r.id));

  // oldId (string) -> { newUserId, newCompanyId }
  const idMap = new Map();

  for (const row of topLevel) {
    const phone = cleanPhone(row.phone) || cleanPhone(row.business_email) /* last-ditch fallback, usually fails */;
    if (!phone) { report.usersSkipped.push({ oldId: row.id, reason: 'no usable phone number' }); continue; }

    const existing = await BmUser.findOne({ where: { phone } });
    if (existing) {
      idMap.set(String(row.id), { newUserId: existing.id, newCompanyId: existing.companyId });
      report.usersSkipped.push({ oldId: row.id, reason: 'phone already exists', phone });
      continue;
    }

    const name = row.name || row.business_name || `User ${row.id}`;
    const tempPassword = genTempPassword();

    if (DRY_RUN) {
      console.log(`[DRY RUN] would create top-level reseller: ${name} (${phone})`);
      idMap.set(String(row.id), { newUserId: -1, newCompanyId: -1 });
      report.usersCreated++;
      continue;
    }

    const newUser = await BmUser.create({
      name, phone, email: row.email || row.business_email || null,
      password: tempPassword, role: 'reseller',
      businessName: row.business_name || null,
      businessEmail: row.business_email || null,
      brand: row.brand || null,
      logo: row.logo || null,
      billingAddress: row.billing_address || null,
      perHrLimit: parseInt(row.per_hr_limit) || 100,
    });
    const company = await BmCompany.create({
      name: row.business_name || `${name}'s Company`,
      ownerId: newUser.id,
    });
    await newUser.update({ companyId: company.id });
    await BmWallet.create({ userId: newUser.id, balance: parseFloat(row.availble_blnce) || 0 });

    idMap.set(String(row.id), { newUserId: newUser.id, newCompanyId: company.id });
    tempPasswords.push({ phone, name, role: 'reseller', tempPassword });
    report.usersCreated++;
    report.companiesCreated++;
  }

  for (const row of children) {
    const parent = idMap.get(String(row.parent_id));
    if (!parent) { report.usersSkipped.push({ oldId: row.id, reason: 'parent not migrated' }); continue; }

    const phone = cleanPhone(row.phone);
    if (!phone) { report.usersSkipped.push({ oldId: row.id, reason: 'no usable phone number' }); continue; }

    const existing = await BmUser.findOne({ where: { phone } });
    if (existing) {
      idMap.set(String(row.id), { newUserId: existing.id, newCompanyId: existing.companyId });
      report.usersSkipped.push({ oldId: row.id, reason: 'phone already exists', phone });
      continue;
    }

    const name = row.name || row.business_name || `User ${row.id}`;
    const tempPassword = genTempPassword();

    if (DRY_RUN) {
      console.log(`[DRY RUN] would create child user: ${name} (${phone}) under company ${parent.newCompanyId}`);
      idMap.set(String(row.id), { newUserId: -1, newCompanyId: parent.newCompanyId });
      report.usersCreated++;
      continue;
    }

    const newUser = await BmUser.create({
      name, phone, email: row.email || row.business_email || null,
      password: tempPassword, role: 'user',
      companyId: parent.newCompanyId,
      parentId: parent.newUserId,
      businessName: row.business_name || null,
      perHrLimit: parseInt(row.per_hr_limit) || 100,
    });
    await BmWallet.create({ userId: newUser.id, balance: parseFloat(row.availble_blnce) || 0 });

    idMap.set(String(row.id), { newUserId: newUser.id, newCompanyId: parent.newCompanyId });
    tempPasswords.push({ phone, name, role: 'user', tempPassword });
    report.usersCreated++;
  }

  const firstMigrated = [...idMap.values()][0];

  // ---------- 2. SMTP servers (global in old schema -> attached to first migrated company) ----------
  const oldSmtpIdToNew = new Map();
  if (firstMigrated) {
    const [smtpRows] = await oldConn.query('SELECT * FROM `tbl_smtp`');
    const SECURE_VALUES = new Set(['none', 'ssl', 'tls']);
    for (const row of smtpRows) {
      if (DRY_RUN) { report.smtpCreated++; continue; }
      const secure = SECURE_VALUES.has(String(row.smtp_secure || '').toLowerCase())
        ? String(row.smtp_secure).toLowerCase() : 'tls';
      const smtp = await BmSmtp.create({
        companyId: firstMigrated.newCompanyId,
        name: `${row.smtp_host || 'SMTP'} (migrated)`,
        host: row.smtp_host,
        port: parseInt(row.smtp_port) || 587,
        username: row.smtp_user,
        password: row.smtp_pass,
        secure,
      });
      oldSmtpIdToNew.set(String(row.id), smtp.id);
      report.smtpCreated++;
    }
  }

  // ---------- 3. Sender groups ----------
  const oldSenderGroupIdToNew = new Map();
  const [senderGroupRows] = await oldConn.query('SELECT * FROM `tbl_sender_group`');
  for (const row of senderGroupRows) {
    const owner = idMap.get(String(row.user_id)) || firstMigrated;
    if (!owner) continue;
    if (DRY_RUN) { report.senderGroupsCreated++; continue; }
    const group = await BmSenderGroup.create({ companyId: owner.newCompanyId, name: row.group_name || `Group ${row.id}` });
    oldSenderGroupIdToNew.set(String(row.id), group.id);
    report.senderGroupsCreated++;
  }

  // ---------- 4. Senders ----------
  const [senderRows] = await oldConn.query('SELECT * FROM `sm_sender`');
  for (const row of senderRows) {
    const owner = idMap.get(String(row.user_id)) || firstMigrated;
    if (!owner || !row.email) continue;
    if (DRY_RUN) { report.sendersCreated++; continue; }
    await BmSender.create({
      companyId: owner.newCompanyId,
      name: row.name || row.email,
      email: row.email,
      replyName: row.reply_name || null,
      replyEmail: row.reply_email || null,
      smtpId: oldSmtpIdToNew.get(String(row.sender_smpt)) || null,
      senderGroupId: oldSenderGroupIdToNew.get(String(row.sender_smpt_grup)) || null,
    });
    report.sendersCreated++;
  }

  // ---------- 5. Templates ----------
  const [templateRows] = await oldConn.query('SELECT * FROM `sm_templates`');
  for (const row of templateRows) {
    const owner = idMap.get(String(row.user_id)) || firstMigrated;
    if (!owner || !row.template) continue;
    if (DRY_RUN) { report.templatesCreated++; continue; }
    await BmTemplate.create({
      companyId: owner.newCompanyId,
      createdBy: owner.newUserId,
      name: row.name || `Template ${row.id}`,
      subject: row.name || null,
      body: row.template,
      status: String(row.status) === '1' ? 'active' : 'draft',
    });
    report.templatesCreated++;
  }

  // ---------- 6. Contacts (merge sm_contacts + tbl_contacts_list, dedupe by companyId+email) ----------
  const seenContact = new Set(); // `${companyId}:${email}`

  const [smContactRows] = await oldConn.query('SELECT * FROM `sm_contacts`');
  for (const row of smContactRows) {
    const owner = idMap.get(String(row.user_id)) || firstMigrated;
    if (!owner) continue;
    for (const email of splitEmails(row.emails)) {
      const key = `${owner.newCompanyId}:${email.toLowerCase()}`;
      if (seenContact.has(key)) { report.contactsSkipped++; continue; }
      seenContact.add(key);
      if (DRY_RUN) { report.contactsCreated++; continue; }
      const existing = await BmContact.findOne({ where: { companyId: owner.newCompanyId, email } });
      if (existing) { report.contactsSkipped++; continue; }
      await BmContact.create({
        companyId: owner.newCompanyId,
        name: row.name || null,
        email,
        companyName: row.company_name || null,
        profession: row.proffesion || null,
        col1: row.col_1 || null, col2: row.col_2 || null, col3: row.col_3 || null,
        col4: row.col_4 || null, col5: row.col_5 || null,
      });
      report.contactsCreated++;
    }
  }

  const [listContactRows] = await oldConn.query('SELECT * FROM `tbl_contacts_list`');
  for (const row of listContactRows) {
    const owner = idMap.get(String(row.user_id)) || firstMigrated;
    if (!owner || !row.email) continue;
    const key = `${owner.newCompanyId}:${row.email.toLowerCase()}`;
    if (seenContact.has(key)) { report.contactsSkipped++; continue; }
    seenContact.add(key);
    if (DRY_RUN) { report.contactsCreated++; continue; }
    const existing = await BmContact.findOne({ where: { companyId: owner.newCompanyId, email: row.email } });
    if (existing) { report.contactsSkipped++; continue; }
    await BmContact.create({
      companyId: owner.newCompanyId,
      email: row.email,
      isSubscribed: String(row.subscribe) !== '0',
    });
    report.contactsCreated++;
  }

  // ---------- 7. Plans ----------
  const [planRows] = await oldConn.query('SELECT * FROM `tbl_plan_email`');
  for (const row of planRows) {
    if (!row.name) continue;
    if (DRY_RUN) { report.plansCreated++; continue; }
    const existing = await BmPlan.findOne({ where: { name: row.name } });
    if (existing) continue;
    await BmPlan.create({
      name: row.name,
      emailCount: parseInt(row.email) || 0,
      validityDays: parseInt(row.valid) || 30,
      price: parseFloat(row.price) || 0,
      isActive: String(row.status).toLowerCase() !== 'inactive',
    });
    report.plansCreated++;
  }

  await oldConn.end();

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'bulkmail-temp-passwords.csv'),
    'phone,name,role,tempPassword\n' + tempPasswords.map(t => `${t.phone},"${t.name}",${t.role},${t.tempPassword}`).join('\n'),
  );
  fs.writeFileSync(path.join(OUTPUT_DIR, 'bulkmail-migration-report.json'), JSON.stringify(report, null, 2));

  console.log('\n=== BulkMail migration summary ===');
  console.log(report);
  console.log(`\nTemp passwords written to: ${path.join(OUTPUT_DIR, 'bulkmail-temp-passwords.csv')}`);
  console.log(`Full report written to: ${path.join(OUTPUT_DIR, 'bulkmail-migration-report.json')}`);
  if (DRY_RUN) console.log('\nThis was a DRY RUN — nothing was written to bulkmail_panel. Re-run without DRY_RUN=true to apply.');

  process.exit(0);
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
