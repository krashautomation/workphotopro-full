/**
 * Migration Script: Update default tag templates to priority colors/labels
 *
 * This script updates the existing default tag templates in Appwrite from
 * Yellow / Blue / Red to the new priority-based naming and colors.
 *
 * Run with:
 *   node scripts/update-tag-templates.js
 *
 * Required environment variables:
 *   - APPWRITE_ENDPOINT (defaults to https://cloud.appwrite.io/v1)
 *   - APPWRITE_PROJECT_ID (or EXPO_PUBLIC_APPWRITE_PROJECT_ID)
 *   - APPWRITE_API_KEY (service API key with documents.read/documents.write)
 *   - APPWRITE_DATABASE_ID (or EXPO_PUBLIC_APPWRITE_DATABASE_ID)
 */

const { Client, Databases, Query } = require('node-appwrite');

// Load environment variables if a .env file exists
try {
  require('dotenv').config();
} catch (error) {
  // dotenv is optional
}

// Configuration
const APPWRITE_ENDPOINT =
  process.env.APPWRITE_ENDPOINT ||
  process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT ||
  'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID =
  process.env.APPWRITE_PROJECT_ID ||
  process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID ||
  '';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || '';
const APPWRITE_DATABASE_ID =
  process.env.APPWRITE_DATABASE_ID ||
  process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ||
  '';
const TAG_COLLECTION_ID = 'tag_templates';

const TARGET_TAGS = [
  {
    sortOrder: 1,
    newName: 'High priority',
    newColor: '#FFD700', // Yellow
    newDescription: 'High priority tag',
    legacyNames: ['Yellow'],
  },
  {
    sortOrder: 2,
    newName: 'Awaiting info',
    newColor: '#9ACD32', // Yellow-green
    newDescription: 'Awaiting info tag',
    legacyNames: ['Blue', 'Medium priority'],
  },
  {
    sortOrder: 3,
    newName: 'Client facing',
    newColor: '#22C55E', // Green
    newDescription: 'Client facing tag',
    legacyNames: ['Red', 'Low priority'],
  },
];

async function updateTagTemplates() {
  if (!APPWRITE_PROJECT_ID || !APPWRITE_API_KEY || !APPWRITE_DATABASE_ID) {
    console.error('❌ Missing required environment variables:');
    console.error(
      '   - APPWRITE_PROJECT_ID (or EXPO_PUBLIC_APPWRITE_PROJECT_ID)'
    );
    console.error('   - APPWRITE_API_KEY');
    console.error(
      '   - APPWRITE_DATABASE_ID (or EXPO_PUBLIC_APPWRITE_DATABASE_ID)'
    );
    process.exit(1);
  }

  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

  const databases = new Databases(client);

  console.log('🚀 Starting tag template update…');
  console.log(`📋 Endpoint: ${APPWRITE_ENDPOINT}`);
  console.log(`📋 Project ID: ${APPWRITE_PROJECT_ID}`);
  console.log(`📋 Database ID: ${APPWRITE_DATABASE_ID}\n`);

  try {
    // Fetch active tag templates (covers the default ones)
    console.log('🔍 Fetching active tag templates…');
    const existing = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      TAG_COLLECTION_ID,
      [Query.equal('isActive', true)]
    );

    if (existing.total === 0) {
      console.warn('⚠️  No active tag templates found to update.');
      return;
    }

    console.log(`✅ Found ${existing.total} active tag templates\n`);

    let updated = 0;
    let skipped = 0;
    let missing = 0;

    for (const target of TARGET_TAGS) {
      const matching = existing.documents.find((doc) => {
        const name = (doc.name || '').toLowerCase();
        return (
          name === target.newName.toLowerCase() ||
          target.legacyNames.some(
            (legacy) => legacy.toLowerCase() === name
          )
        );
      });

      if (!matching) {
        console.warn(
          `⚠️  Could not find tag template for "${target.newName}" (or legacy names: ${target.legacyNames.join(
            ', '
          )})`
        );
        missing += 1;
        continue;
      }

      const needsUpdate =
        matching.name !== target.newName ||
        matching.color !== target.newColor ||
        matching.description !== target.newDescription ||
        matching.sortOrder !== target.sortOrder;

      if (!needsUpdate) {
        console.log(`⏭️  "${matching.name}" already up to date (ID: ${matching.$id})`);
        skipped += 1;
        continue;
      }

      console.log(`🛠️  Updating tag "${matching.name}" (ID: ${matching.$id})…`);
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        TAG_COLLECTION_ID,
        matching.$id,
        {
          name: target.newName,
          color: target.newColor,
          description: target.newDescription,
          sortOrder: target.sortOrder,
        }
      );

      console.log(
        `✅ Updated "${matching.name}" → "${target.newName}" (ID: ${matching.$id})\n`
      );
      updated += 1;
    }

    console.log('\n📊 Update Summary:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Already up-to-date: ${skipped}`);
    console.log(`   ⚠️  Missing: ${missing}`);

    if (missing > 0) {
      console.log(
        '\n⚠️  Some tags were not found. Create them manually or run initializeDefaultTags to seed missing templates.'
      );
    }

    console.log('\n🎉 Tag template update complete.');
  } catch (error) {
    console.error('\n❌ Tag template update failed:', error.message || error);
    if (error?.code) {
      console.error(`   Code: ${error.code}`);
    }
    process.exit(1);
  }
}

updateTagTemplates().catch((error) => {
  console.error('Unexpected failure:', error);
  process.exit(1);
});


