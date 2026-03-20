/**
 * Script: Restore Appwrite Schema
 *
 * Reads backups/appwrite-schema.json and recreates all collections, attributes,
 * and indexes in the target Appwrite database. Safe to run against an existing
 * database — collections that already exist are skipped.
 *
 * Usage:
 *   node scripts/restore-appwrite-schema.js
 *   npm run restore:schema
 *
 * Prerequisites:
 *   1. The target Appwrite database must already exist (create it in the Console
 *      or via the Appwrite CLI before running this script).
 *   2. API key must have "Databases" scope (read + write).
 *
 * Environment Variables Required:
 *   - APPWRITE_ENDPOINT (defaults to EXPO_PUBLIC_APPWRITE_ENDPOINT or https://cloud.appwrite.io/v1)
 *   - APPWRITE_PROJECT_ID (or EXPO_PUBLIC_APPWRITE_PROJECT_ID)
 *   - APPWRITE_API_KEY (get from Appwrite Console → Settings → API Keys)
 *   - APPWRITE_DATABASE_ID (or EXPO_PUBLIC_APPWRITE_DATABASE_ID)
 *
 * What is restored:
 *   - Collection IDs, names, and permissions
 *   - All attributes (string, integer, boolean, datetime — including arrays)
 *   - All indexes (key and unique types)
 *
 * What is NOT restored (manual steps required after):
 *   - Document data
 *   - Document-level security toggle (re-enable per collection in the Console)
 *   - Storage bucket files
 */

const { Client, Databases } = require('node-appwrite');
const fs = require('fs');
const path = require('path');

// Load environment variables if .env file exists
try {
  require('dotenv').config();
} catch (e) {
  // dotenv is optional
}

// Configuration
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID || process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || '';
const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '';

// Delay between attribute creation and index creation (ms)
const ATTRIBUTE_SETTLE_DELAY = 3000;

/**
 * Initialize Appwrite client
 */
function initClient() {
  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

  return new Databases(client);
}

/**
 * Create a single attribute based on its type
 */
async function createAttribute(databases, collectionId, attr) {
  const { key, type, required, array } = attr;

  switch (type) {
    case 'string':
      await databases.createStringAttribute(
        APPWRITE_DATABASE_ID, collectionId, key,
        attr.size, required, attr.default ?? undefined, array, attr.encrypt ?? false
      );
      break;

    case 'integer':
      await databases.createIntegerAttribute(
        APPWRITE_DATABASE_ID, collectionId, key,
        required, attr.min ?? undefined, attr.max ?? undefined, attr.default ?? undefined, array
      );
      break;

    case 'boolean':
      await databases.createBooleanAttribute(
        APPWRITE_DATABASE_ID, collectionId, key,
        required, attr.default ?? undefined, array
      );
      break;

    case 'datetime':
      await databases.createDatetimeAttribute(
        APPWRITE_DATABASE_ID, collectionId, key,
        required, attr.default ?? undefined, array
      );
      break;

    default:
      console.warn(`[SchemaRestore]     ⚠️  Unknown attribute type "${type}" for "${key}" — skipping`);
  }
}

/**
 * Restore a single collection
 */
async function restoreCollection(databases, collection) {
  const { id, name, permissions, attributes, indexes } = collection;

  // Check if collection already exists
  try {
    await databases.getCollection(APPWRITE_DATABASE_ID, id);
    console.log(`[SchemaRestore]   ⚠️  Skipping "${name}" (${id}) — already exists`);
    return;
  } catch (e) {
    // Does not exist — proceed
  }

  console.log(`[SchemaRestore]   Creating "${name}" (${id})...`);

  // Create the collection
  await databases.createCollection(
    APPWRITE_DATABASE_ID, id, name,
    permissions || []
  );

  // Add attributes
  const validAttributes = attributes.filter(a => a.status === 'available');
  for (const attr of validAttributes) {
    try {
      await createAttribute(databases, id, attr);
      console.log(`[SchemaRestore]     + attribute: ${attr.key} (${attr.type}${attr.array ? '[]' : ''})`);
    } catch (error) {
      console.warn(`[SchemaRestore]     ⚠️  Could not create attribute "${attr.key}": ${error.message}`);
    }
  }

  // Wait for Appwrite to process attributes before creating indexes
  if (validAttributes.length > 0 && indexes.length > 0) {
    console.log(`[SchemaRestore]     ⏳ Waiting ${ATTRIBUTE_SETTLE_DELAY}ms for attributes to settle...`);
    await new Promise(resolve => setTimeout(resolve, ATTRIBUTE_SETTLE_DELAY));
  }

  // Add indexes
  for (const index of indexes) {
    try {
      await databases.createIndex(
        APPWRITE_DATABASE_ID, id,
        index.key, index.type,
        index.attributes,
        index.orders || []
      );
      console.log(`[SchemaRestore]     + index: ${index.key} (${index.type})`);
    } catch (error) {
      console.warn(`[SchemaRestore]     ⚠️  Could not create index "${index.key}": ${error.message}`);
    }
  }

  console.log(`[SchemaRestore]   ✅ "${name}" restored`);
}

/**
 * Main restore function
 */
async function main() {
  console.log('[SchemaRestore] Starting Appwrite schema restore...\n');

  // Validate environment variables
  if (!APPWRITE_PROJECT_ID || !APPWRITE_API_KEY || !APPWRITE_DATABASE_ID) {
    console.error('[SchemaRestore] ❌ Missing required environment variables:');
    console.error('   - APPWRITE_PROJECT_ID (or EXPO_PUBLIC_APPWRITE_PROJECT_ID)');
    console.error('   - APPWRITE_API_KEY (get from Appwrite Console → Settings → API Keys)');
    console.error('   - APPWRITE_DATABASE_ID (or EXPO_PUBLIC_APPWRITE_DATABASE_ID)');
    process.exit(1);
  }

  const backupPath = path.join(__dirname, '..', 'backups', 'appwrite-schema.json');
  if (!fs.existsSync(backupPath)) {
    console.error('[SchemaRestore] ❌ Backup file not found: backups/appwrite-schema.json');
    console.error('   Run "npm run backup:schema" first to create it.');
    process.exit(1);
  }

  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  console.log(`[SchemaRestore] Backup timestamp: ${backup.timestamp}`);
  console.log(`[SchemaRestore] Collections to restore: ${backup.collections.length}\n`);

  const databases = initClient();

  let restored = 0;
  let skipped = 0;
  let failed = 0;

  for (const collection of backup.collections) {
    try {
      const existsBefore = await databases.getCollection(APPWRITE_DATABASE_ID, collection.id).then(() => true).catch(() => false);
      await restoreCollection(databases, collection);
      if (existsBefore) skipped++;
      else restored++;
    } catch (error) {
      console.error(`[SchemaRestore]   ❌ Failed to restore "${collection.name}": ${error.message}`);
      failed++;
    }
  }

  console.log('\n[SchemaRestore] ─────────────────────────────────');
  console.log(`[SchemaRestore] ✅ Restored:  ${restored} collections`);
  console.log(`[SchemaRestore] ⚠️  Skipped:   ${skipped} (already existed)`);
  if (failed > 0) {
    console.log(`[SchemaRestore] ❌ Failed:    ${failed} collections`);
  }
  console.log('[SchemaRestore] ─────────────────────────────────');
  console.log('\n[SchemaRestore] Post-restore checklist:');
  console.log('   1. Re-enable document-level security per collection in the Appwrite Console');
  console.log('   2. Verify collection permissions match your expectations');
  console.log('   3. See docs/DISASTER_RECOVERY.md for full instructions');

  if (failed > 0) process.exit(1);
}

// Run script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
