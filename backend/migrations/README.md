# Migrating data from the old PHP projects

Two one-time scripts move real data from the legacy sites into the new panel:
- `migrate-sms.js` — old Core PHP SMS project (`shudhsms` database) → `sms_panel`
- `migrate-bulkmail.js` — old CodeIgniter BulkMail project (`bulkmail_new` database) → `bulkmail_panel`

The `.sql` files at the project root (`shudhsms.sql`, `bulkmail_new.sql`) are **schema-only** — no rows. These scripts need your actual old data, not those files.

## 1. Get your real old data into a MySQL database

Either:
- Restore your real production dump (one that has `INSERT` statements) into a local MySQL database named `shudhsms` and/or `bulkmail_new`, **or**
- Point the scripts at a live server that still has the old database, by setting the `OLD_SMS_DB_*` / `OLD_BULKMAIL_DB_*` variables in `backend/.env` (host/port/user/password/name).

## 2. Preview before touching anything

```bash
cd backend
DRY_RUN=true node migrations/migrate-sms.js
DRY_RUN=true node migrations/migrate-bulkmail.js
```

This connects to the old database, counts what *would* be created, and prints the distinct `login.level` values it found (SMS) so you can sanity-check the role mapping at the top of `migrate-sms.js` before the real run.

## 3. Run for real

```bash
node migrations/migrate-sms.js
node migrations/migrate-bulkmail.js
```

Both scripts are safe to re-run — anything already migrated (matched by phone number) is skipped, not duplicated.

## 4. After running

- `migrations/output/sms-temp-passwords.csv` and `migrations/output/bulkmail-temp-passwords.csv` — every migrated account's new temporary password (old passwords were hashed and can't be recovered). Distribute these and have users change their password after first login.
- `migrations/output/sms-migration-report.json` and `migrations/output/bulkmail-migration-report.json` — counts of what was created/skipped, and why anything was skipped.

## What is intentionally NOT migrated

- **SMS gateway routes / SMTP server infra** are not auto-migrated — the actual URLs/credentials differ in the new deployment. Set these up fresh under Routes (SMS) / SMTP Servers (BulkMail) after migration, then re-attach them to migrated senders/templates.
- **Message/campaign history** (old `trans`, `transections`, `sm_balance`, `sm_campaign*`, `email_queue`, etc.) is not migrated — it's historical data, not needed for the app to keep working. Current wallet *balances* are migrated; the transaction log starts fresh.
- **BulkMail's `tbl_user`** (the old CodeIgniter app's internal staff/admin accounts) is not migrated as a tenant — it's a different concept from `sm_register` (actual paying tenants). Create staff accounts manually if needed.

## Role mapping specifics

- **SMS**: old `login.level` is mapped to `super_admin` / `reseller` / `user` via the `ROLE_MAP` object at the top of `migrate-sms.js`. The dry run prints every distinct value found in your data — extend the map if it doesn't already cover them (anything unmapped defaults to `user`).
- **BulkMail**: `sm_register` has no role column, only `parent_id`. Top-level accounts (no resolvable parent) become `reseller`; accounts whose `parent_id` points to another migrated account become `user`. There's no automatic `super_admin` — promote an account manually after migration if needed.
