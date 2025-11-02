/**
 * Migration Script: Add appwriteTeamId to existing teams
 * 
 * This script updates existing team documents in the database to include the appwriteTeamId field.
 * It matches teams by name to find the corresponding Appwrite Team.
 * 
 * Run this script with: node scripts/migrate-team-appwrite-ids.js
 * 
 * Make sure to set these environment variables:
 * - APPWRITE_ENDPOINT (defaults to https://cloud.appwrite.io/v1)
 * - APPWRITE_PROJECT_ID
 * - APPWRITE_API_KEY (Service account API key from Appwrite Console)
 * - APPWRITE_DATABASE_ID
 */

const { Client, Databases, Teams, Query } = require('node-appwrite');

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
const TEAMS_COLLECTION_ID = 'teams';

/**
 * Main migration function
 */
async function migrateTeamAppwriteIds() {
  if (!APPWRITE_PROJECT_ID || !APPWRITE_API_KEY || !APPWRITE_DATABASE_ID) {
    console.error('❌ Missing required environment variables:');
    console.error('   - APPWRITE_PROJECT_ID (or EXPO_PUBLIC_APPWRITE_PROJECT_ID)');
    console.error('   - APPWRITE_API_KEY (get from Appwrite Console → Settings → API Keys)');
    console.error('   - APPWRITE_DATABASE_ID (or EXPO_PUBLIC_APPWRITE_DATABASE_ID)');
    console.error('\n💡 How to get API Key:');
    console.error('   1. Go to Appwrite Console');
    console.error('   2. Settings → API Keys');
    console.error('   3. Create new key with scopes: teams.read, documents.read, documents.write');
    console.error('   4. Copy the key and set as APPWRITE_API_KEY in .env file');
    process.exit(1);
  }

  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

  const databases = new Databases(client);
  const teams = new Teams(client);

  console.log('🚀 Starting team Appwrite ID migration...');
  console.log(`📋 Endpoint: ${APPWRITE_ENDPOINT}`);
  console.log(`📋 Project ID: ${APPWRITE_PROJECT_ID}`);
  console.log(`📋 Database ID: ${APPWRITE_DATABASE_ID}\n`);

  try {
    // Step 1: Get all Appwrite Teams
    console.log('🔍 Step 1: Fetching Appwrite Teams...');
    const appwriteTeams = await teams.list();
    console.log(`✅ Found ${appwriteTeams.total} Appwrite Teams`);

    // Step 2: Get all database teams
    console.log('🔍 Step 2: Fetching database teams...');
    const dbTeams = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      TEAMS_COLLECTION_ID,
      []
    );
    console.log(`✅ Found ${dbTeams.total} database teams\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Step 3: Match and update teams
    console.log('🔍 Step 3: Matching and updating teams...\n');

    for (const dbTeam of dbTeams.documents) {
      try {
        // Skip if already has appwriteTeamId
        if (dbTeam.appwriteTeamId) {
          console.log(`⏭️  Skipping ${dbTeam.teamName} - already has appwriteTeamId: ${dbTeam.appwriteTeamId}`);
          skipped++;
          continue;
        }

        // Try to find matching Appwrite Team by name
        const matchingAppwriteTeam = appwriteTeams.teams.find(
          (t) => t.name === dbTeam.teamName
        );

        if (!matchingAppwriteTeam) {
          console.warn(`⚠️  No matching Appwrite Team found for: ${dbTeam.teamName}`);
          errors++;
          continue;
        }

        // Update database team with Appwrite Team ID
        await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          TEAMS_COLLECTION_ID,
          dbTeam.$id,
          {
            appwriteTeamId: matchingAppwriteTeam.$id
          }
        );

        console.log(`✅ Updated ${dbTeam.teamName}`);
        console.log(`   Database ID: ${dbTeam.$id}`);
        console.log(`   Appwrite Team ID: ${matchingAppwriteTeam.$id}\n`);
        updated++;

      } catch (error) {
        console.error(`❌ Error updating team ${dbTeam.teamName}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);

    if (errors > 0) {
      console.log('\n⚠️  Some teams could not be updated.');
      console.log('   Make sure the team names match exactly between Appwrite and database.');
      console.log('   Or manually update teams that failed.');
    }

    if (updated > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('   All updated teams now have appwriteTeamId field.');
    } else {
      console.log('\n✅ Migration completed - no updates needed.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the migration
migrateTeamAppwriteIds().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

