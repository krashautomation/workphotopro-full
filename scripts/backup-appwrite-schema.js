/**
 * Script: Backup Appwrite Schema
 *
 * Snapshots all collection schemas (attributes + indexes, no data) to a JSON
 * file in backups/. Useful for auditing schema changes and disaster recovery.
 *
 * Usage:
 *   node scripts/backup-appwrite-schema.js
 *   npm run backup:schema
 *
 * Environment Variables Required:
 *   - APPWRITE_ENDPOINT (defaults to EXPO_PUBLIC_APPWRITE_ENDPOINT or https://cloud.appwrite.io/v1)
 *   - APPWRITE_PROJECT_ID (or EXPO_PUBLIC_APPWRITE_PROJECT_ID)
 *   - APPWRITE_API_KEY (get from Appwrite Console → Settings → API Keys)
 *   - APPWRITE_DATABASE_ID (or EXPO_PUBLIC_APPWRITE_DATABASE_ID)
 */

const { Client, Databases, Query } = require('node-appwrite');
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
 * Fetch all collections with cursor-based pagination
 */
async function fetchAllCollections(databases) {
  const collections = [];
  let cursor = null;

  while (true) {
    const queries = [Query.limit(100)];
    if (cursor) queries.push(Query.cursorAfter(cursor));

    const response = await databases.listCollections(APPWRITE_DATABASE_ID, queries);
    collections.push(...response.collections);

    if (response.collections.length < 100) break;
    cursor = response.collections[response.collections.length - 1].$id;
  }

  return collections;
}

/**
 * Main backup function
 */
async function main() {
  console.log('[SchemaBackup] Starting Appwrite schema backup...\n');

  // Validate environment variables
  if (!APPWRITE_PROJECT_ID || !APPWRITE_API_KEY || !APPWRITE_DATABASE_ID) {
    console.error('[SchemaBackup] ❌ Missing required environment variables:');
    console.error('   - APPWRITE_PROJECT_ID (or EXPO_PUBLIC_APPWRITE_PROJECT_ID)');
    console.error('   - APPWRITE_API_KEY (get from Appwrite Console → Settings → API Keys)');
    console.error('   - APPWRITE_DATABASE_ID (or EXPO_PUBLIC_APPWRITE_DATABASE_ID)');
    process.exit(1);
  }

  const databases = initClient();

  try {
    console.log('[SchemaBackup] Fetching collections...');
    const collections = await fetchAllCollections(databases);
    console.log(`[SchemaBackup] Found ${collections.length} collections`);

    const result = {
      timestamp: new Date().toISOString(),
      collections: [],
    };

    for (const collection of collections) {
      console.log(`[SchemaBackup]   Processing: ${collection.name} (${collection.$id})`);

      const [attributesResponse, indexesResponse] = await Promise.all([
        databases.listAttributes(APPWRITE_DATABASE_ID, collection.$id),
        databases.listIndexes(APPWRITE_DATABASE_ID, collection.$id),
      ]);

      result.collections.push({
        id: collection.$id,
        name: collection.name,
        permissions: collection.$permissions,
        attributes: attributesResponse.attributes,
        indexes: indexesResponse.indexes,
      });
    }

    const outputPath = path.join(__dirname, '..', 'backups', 'appwrite-schema.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

    console.log(`\n[SchemaBackup] ✅ Schema backup saved to backups/appwrite-schema.json`);
    console.log(`[SchemaBackup]    Timestamp: ${result.timestamp}`);
    console.log(`[SchemaBackup]    Collections: ${result.collections.length}`);

  } catch (error) {
    console.error('[SchemaBackup] ❌ Backup failed:', error.message);
    process.exit(1);
  }
}

// Run script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
