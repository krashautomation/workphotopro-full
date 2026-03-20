# Disaster Recovery — Appwrite Schema

This guide covers how to back up and restore the Appwrite database schema for WorkPhotoPro V2.

> **Schema only.** These scripts capture collection structure — not document data or storage files.

---

## What is captured

| Item | Backed up |
|---|---|
| Collection IDs and names | ✅ |
| Collection-level permissions | ✅ |
| All attributes (string, integer, boolean, datetime) | ✅ |
| Array attribute flag | ✅ |
| All indexes (key and unique types) | ✅ |

## What is NOT captured

| Item | Why |
|---|---|
| Document data | Schema backup only — use Appwrite's data export for this |
| Document-level security toggle | Appwrite API does not expose this setting |
| Storage bucket files | Separate from the database |

---

## Taking a backup

```bash
npm run backup:schema
```

Output: `backups/appwrite-schema.json`

Run this any time you change the schema (add attributes, create indexes, etc.). The file should be committed to git so the schema history is tracked.

---

## Restoring from a backup

### Prerequisites

1. **Create the target database** in the Appwrite Console (or via CLI). The script restores collections into an existing database — it does not create the database itself.
2. **API key** — must have `Databases` (read + write) scope. Get one from Appwrite Console → Settings → API Keys.
3. **Environment variables** — set in `.env` or as shell variables:
   ```
   APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   APPWRITE_PROJECT_ID=your_project_id
   APPWRITE_API_KEY=your_api_key_with_db_scope
   APPWRITE_DATABASE_ID=your_new_database_id
   ```

### Run the restore

```bash
npm run restore:schema
```

The script is **idempotent** — collections that already exist are skipped. Safe to re-run if it fails partway through.

### Post-restore checklist

After the script completes:

- [ ] **Re-enable document-level security** on each collection that requires it (Appwrite Console → Database → Collection → Settings → Document Security). This cannot be automated via the API.
- [ ] **Verify collection permissions** look correct (the backup captures them, but double-check sensitive collections like `memberships`, `subscriptions`, `user_push_tokens`).
- [ ] **Restore document data** if needed — use Appwrite's data export/import tools or a custom migration script.
- [ ] **Re-upload storage files** if needed — these are separate from the database.

---

## Files

| File | Purpose |
|---|---|
| `scripts/backup-appwrite-schema.js` | Exports schema to JSON |
| `scripts/restore-appwrite-schema.js` | Recreates schema from JSON |
| `backups/appwrite-schema.json` | Latest schema snapshot |
