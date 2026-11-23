# Schema SQL files

`whatsapp_panel.sql`, `sms_panel.sql`, and `bulkmail_panel.sql` are generated snapshots of
the current Sequelize models — `CREATE TABLE`/`ALTER TABLE ... ADD INDEX` statements only,
nothing else.

## When to use these
Creating a **fresh** database (new server, new environment, disaster recovery). Each file
is idempotent on an *empty* target: `CREATE DATABASE IF NOT EXISTS`, `CREATE TABLE IF NOT
EXISTS`, then the secondary/composite indexes.

```bash
mysql -u USER -p < database/schema/whatsapp_panel.sql
mysql -u USER -p < database/schema/sms_panel.sql
mysql -u USER -p < database/schema/bulkmail_panel.sql
```

## When NOT to use these
Against a database that **already has these tables** — the `ALTER TABLE ... ADD INDEX`
statements aren't guarded with `IF NOT EXISTS` (MySQL's support for that is inconsistent
across versions), so they'll error with "Duplicate key name" on a second run. That's fine
for a one-time fresh creation, but don't replay a file against a server that already ran it.

For an already-running server, just start the app — `backend/server.js` calls
`sequelize.sync()` (no `alter`) on boot, which only creates tables that don't exist yet and
never touches existing ones.

## Regenerating after a model change
```bash
cd backend
node scripts/generateSchemaSql.js all        # all three
node scripts/generateSchemaSql.js whatsapp   # or just one
```
This spins up a throwaway empty database per target, runs `sync()` against it to capture
the exact DDL, then drops the scratch database. Requires the same DB connection env vars
as the app itself (`.env`).

## Why this exists
`sequelize.sync({ alter: true })` running on every boot caused an incident where a
crash-restart loop (pm2) re-ran `ALTER TABLE ... ADD UNIQUE` on columns that already had
the index, 60+ times, until MySQL's 64-index-per-table ceiling was hit. `alter: true` is
now opt-in via `DB_AUTO_ALTER=true` in `.env` (useful for local development, where picking
up new model fields automatically is convenient) and is off by default everywhere else.
