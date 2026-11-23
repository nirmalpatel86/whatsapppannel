/**
 * Generates a clean CREATE-TABLE schema SQL file for one of the three databases by running
 * Sequelize's sync() against a throwaway, empty database and capturing the exact DDL it issues.
 *
 * Why: sequelize.sync({ alter: true }) at boot is what caused the index-duplication incident
 * (every restart re-ran ALTER TABLE ... ADD UNIQUE on columns that already had the index,
 * piling up duplicates until MySQL's 64-key-per-table limit was hit). These generated .sql
 * files are meant to be applied once via `mysql < file.sql` to create a database from a known
 * snapshot of the models, instead of relying on repeated auto-alter at every boot.
 *
 * Usage:
 *   node scripts/generateSchemaSql.js whatsapp
 *   node scripts/generateSchemaSql.js sms
 *   node scripts/generateSchemaSql.js bulkmail
 *   node scripts/generateSchemaSql.js all
 *
 * Re-run any time models change to refresh the matching .sql file.
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const TARGETS = {
  whatsapp: {
    dbNameVar: 'DB_NAME',
    userVar: 'DB_USER',
    passVar: 'DB_PASSWORD',
    hostVar: 'DB_HOST',
    portVar: 'DB_PORT',
    configPath: '../config/database',
    modelsPath: '../models',
    outFile: 'whatsapp_panel.sql',
  },
  sms: {
    dbNameVar: 'SMS_DB_NAME',
    userVar: 'SMS_DB_USER',
    passVar: 'SMS_DB_PASSWORD',
    hostVar: 'SMS_DB_HOST',
    portVar: 'SMS_DB_PORT',
    configPath: '../config/smsDatabase',
    modelsPath: '../models/sms',
    outFile: 'sms_panel.sql',
  },
  bulkmail: {
    dbNameVar: 'BULKMAIL_DB_NAME',
    userVar: 'BULKMAIL_DB_USER',
    passVar: 'BULKMAIL_DB_PASSWORD',
    hostVar: 'BULKMAIL_DB_HOST',
    portVar: 'BULKMAIL_DB_PORT',
    configPath: '../config/bulkmailDatabase',
    modelsPath: '../models/bulkmail',
    outFile: 'bulkmail_panel.sql',
  },
};

async function generateOne(key) {
  const t = TARGETS[key];
  const user = process.env[t.userVar] || process.env.DB_USER;
  const password = process.env[t.passVar] || process.env.DB_PASSWORD;
  const host = process.env[t.hostVar] || process.env.DB_HOST || 'localhost';
  const port = process.env[t.portVar] || process.env.DB_PORT || 3306;
  const realDbName = process.env[t.dbNameVar] || key;
  const tempDbName = `schema_gen_${key}_${Date.now()}`;

  // Point this env var at a throwaway DB before requiring the config module, so the
  // Sequelize instance it constructs connects to the scratch DB instead of the real one.
  process.env[t.dbNameVar] = tempDbName;

  const admin = await mysql.createConnection({ host, port: Number(port), user, password });
  await admin.query(`CREATE DATABASE \`${tempDbName}\``);
  await admin.end();

  const statements = [];
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const sequelize = require(t.configPath);
  sequelize.options.logging = (sql) => {
    const clean = sql.replace(/^Executing \(default\):\s*/, '').trim();
    if (/^(CREATE TABLE|CREATE .*INDEX|ALTER TABLE)/i.test(clean)) {
      statements.push(clean.endsWith(';') ? clean : `${clean};`);
    }
  };

  // eslint-disable-next-line import/no-dynamic-require, global-require
  require(t.modelsPath); // registers all models + associations on this sequelize instance
  await sequelize.sync();
  await sequelize.close();

  const cleanup = await mysql.createConnection({ host, port: Number(port), user, password });
  await cleanup.query(`DROP DATABASE \`${tempDbName}\``);
  await cleanup.end();

  const header = `-- Schema for ${realDbName} -- generated from Sequelize models by scripts/generateSchemaSql.js\n` +
    `-- Generated ${new Date().toISOString()}\n` +
    `-- Apply with: mysql -u USER -p ${realDbName} < database/schema/${t.outFile}\n` +
    `-- Re-run the generator (not sequelize.sync({ alter: true })) whenever models change.\n\n` +
    `CREATE DATABASE IF NOT EXISTS \`${realDbName}\`;\n` +
    `USE \`${realDbName}\`;\n\n`;

  const outPath = path.join(__dirname, '..', 'database', 'schema', t.outFile);
  fs.writeFileSync(outPath, header + statements.join('\n\n') + '\n');
  console.log(`[${key}] wrote ${statements.length} statements to ${outPath}`);
}

async function main() {
  const arg = process.argv[2];
  const keys = arg === 'all' ? Object.keys(TARGETS) : [arg];
  if (!arg || !keys.every((k) => TARGETS[k])) {
    console.error('Usage: node scripts/generateSchemaSql.js <whatsapp|sms|bulkmail|all>');
    process.exit(1);
  }
  for (const key of keys) {
    // eslint-disable-next-line no-await-in-loop
    await generateOne(key);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
