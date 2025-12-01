/**
 * Add Katya to All Teams Script
 * 
 * This script adds Katya (AI agent) to all existing teams so she can post messages.
 * 
 * Usage:
 *   node Droid/scripts/add-katya-to-all-teams.js
 * 
 * Environment Variables Required:
 *   - APPWRITE_ENDPOINT (defaults to EXPO_PUBLIC_APPWRITE_ENDPOINT or https://cloud.appwrite.io/v1)
 *   - APPWRITE_PROJECT_ID (or EXPO_PUBLIC_APPWRITE_PROJECT_ID)
 *   - APPWRITE_DROID_API_KEY or APPWRITE_API_KEY (get from Appwrite Console → Settings → API Keys)
 *   - APPWRITE_DATABASE_ID (or EXPO_PUBLIC_APPWRITE_DATABASE_ID)
 */

const { Client, Databases, Teams, Query, ID } = require('node-appwrite');
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
const APPWRITE_API_KEY = process.env.APPWRITE_DROID_API_KEY || process.env.APPWRITE_API_KEY || '';
const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '';
const MEMBERSHIPS_COLLECTION_ID = 'memberships';
const TEAMS_COLLECTION_ID = 'teams';

// Katya user details
const KATYA_EMAIL = 'katya@workphotopro.ai';
const KATYA_ROLE = 'member'; // Katya is a regular member, not owner

/**
 * Load Katya credentials from file
 */
function loadKatyaCredentials() {
  const credentialsPath = path.join(__dirname, '../../katya-credentials.json');
  
  try {
    if (fs.existsSync(credentialsPath)) {
      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      return {
        userId: credentials.userId,
        email: credentials.email || KATYA_EMAIL,
        password: credentials.password
      };
    }
  } catch (error) {
    console.warn('⚠️  Could not load katya-credentials.json:', error.message);
  }
  
  // Fallback: try to get from environment
  return {
    userId: process.env.KATYA_USER_ID || '',
    email: KATYA_EMAIL,
    password: process.env.KATYA_PASSWORD || ''
  };
}

/**
 * Add Katya to a single team
 */
async function addKatyaToTeam(databases, teams, katyaUserId, katyaEmail, appwriteTeamId, teamName) {
  try {
    // Check if Katya is already a member
    const existingMemberships = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      MEMBERSHIPS_COLLECTION_ID,
      [
        Query.equal('userId', katyaUserId),
        Query.equal('teamId', appwriteTeamId)
      ]
    );

    if (existingMemberships.documents && existingMemberships.documents.length > 0) {
      console.log(`   ⏭️  Already a member (membership ID: ${existingMemberships.documents[0].$id})`);
      return { added: false, reason: 'already_member' };
    }

    // Check Appwrite Teams membership
    try {
      const appwriteMemberships = await teams.listMemberships(appwriteTeamId);
      const existingAppwriteMembership = appwriteMemberships.memberships.find(
        (m) => m.userId === katyaUserId
      );

      if (existingAppwriteMembership) {
        console.log(`   ⏭️  Already has Appwrite Teams membership`);
        // Create database membership to sync
        const membershipData = {
          userId: katyaUserId,
          teamId: appwriteTeamId,
          role: KATYA_ROLE,
          userEmail: katyaEmail,
          invitedBy: 'system',
          joinedAt: existingAppwriteMembership.joined || new Date().toISOString(),
          isActive: existingAppwriteMembership.confirm || true
        };

        await databases.createDocument(
          APPWRITE_DATABASE_ID,
          MEMBERSHIPS_COLLECTION_ID,
          ID.unique(),
          membershipData
        );
        console.log(`   ✅ Synced database membership`);
        return { added: true, reason: 'synced' };
      }
    } catch (error) {
      console.warn(`   ⚠️  Could not check Appwrite Teams membership:`, error.message);
    }

    // Create Appwrite Teams membership
    try {
      // Use Appwrite callback scheme which is already registered in app.config.js
      // Format: appwrite-callback-{PROJECT_ID}://
      const projectId = APPWRITE_PROJECT_ID;
      const redirectUrl = process.env.APPWRITE_REDIRECT_URL || 
                         `appwrite-callback-${projectId}://callback`;
      
      const appwriteMembership = await teams.createMembership(
        appwriteTeamId,
        [KATYA_ROLE],
        katyaEmail,
        undefined,
        undefined,
        redirectUrl
      );

      console.log(`   ✅ Created Appwrite Teams membership (ID: ${appwriteMembership.$id})`);

      // Create database membership
      const membershipData = {
        userId: katyaUserId,
        teamId: appwriteTeamId,
        role: KATYA_ROLE,
        userEmail: katyaEmail,
        invitedBy: 'system',
        joinedAt: appwriteMembership.joined || new Date().toISOString(),
        isActive: appwriteMembership.confirm || false
      };

      const dbMembership = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        MEMBERSHIPS_COLLECTION_ID,
        ID.unique(),
        membershipData
      );

      console.log(`   ✅ Created database membership (ID: ${dbMembership.$id})`);
      return { added: true, reason: 'created' };
    } catch (error) {
      if (error.code === 409 || error.message?.includes('already')) {
        console.log(`   ⏭️  Membership already exists (skipping)`);
        return { added: false, reason: 'already_exists' };
      } else if (error.code === 402 || error.type?.includes('limit')) {
        console.warn(`   ⚠️  Quota/limit error: ${error.message}`);
        console.warn(`   💡 You may need to add Katya manually via Appwrite Console`);
        return { added: false, reason: 'quota_limit' };
      } else {
        console.error(`   ❌ Error: ${error.message}`);
        return { added: false, reason: 'error', error: error.message };
      }
    }
  } catch (error) {
    console.error(`   ❌ Failed to add Katya to team: ${error.message}`);
    return { added: false, reason: 'error', error: error.message };
  }
}

/**
 * Main function
 */
async function addKatyaToAllTeams() {
  try {
    console.log('🤖 Adding Katya to all teams...\n');

    // Validate environment variables
    if (!APPWRITE_PROJECT_ID || !APPWRITE_API_KEY || !APPWRITE_DATABASE_ID) {
      console.error('❌ Missing required environment variables:');
      console.error('   - APPWRITE_PROJECT_ID (or EXPO_PUBLIC_APPWRITE_PROJECT_ID)');
      console.error('   - APPWRITE_DROID_API_KEY or APPWRITE_API_KEY');
      console.error('   - APPWRITE_DATABASE_ID (or EXPO_PUBLIC_APPWRITE_DATABASE_ID)');
      process.exit(1);
    }

    // Load Katya credentials
    const katyaCredentials = loadKatyaCredentials();
    if (!katyaCredentials.userId) {
      console.error('❌ Katya user ID not found!');
      console.error('   Please run: node Droid/scripts/create-katya-user.js');
      console.error('   Or set KATYA_USER_ID in environment variables');
      process.exit(1);
    }

    console.log('📋 Configuration:');
    console.log(`   Endpoint: ${APPWRITE_ENDPOINT}`);
    console.log(`   Project ID: ${APPWRITE_PROJECT_ID}`);
    console.log(`   Database ID: ${APPWRITE_DATABASE_ID}`);
    console.log(`   Katya User ID: ${katyaCredentials.userId}`);
    console.log(`   Katya Email: ${katyaCredentials.email}\n`);

    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID)
      .setKey(APPWRITE_API_KEY);

    const databases = new Databases(client);
    const teams = new Teams(client);

    // Get all teams from Appwrite
    console.log('🔍 Step 1: Fetching all teams...');
    const appwriteTeams = await teams.list();
    console.log(`   Found ${appwriteTeams.teams.length} teams\n`);

    if (appwriteTeams.teams.length === 0) {
      console.log('⚠️  No teams found. Katya will be added automatically when teams are created.');
      return;
    }

    // Get database teams for reference
    const dbTeams = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      TEAMS_COLLECTION_ID,
      [Query.equal('isActive', true)]
    );

    console.log('🔍 Step 2: Adding Katya to each team...\n');

    const results = {
      total: appwriteTeams.teams.length,
      added: 0,
      alreadyMember: 0,
      errors: 0,
      skipped: 0
    };

    // Add Katya to each team
    for (const team of appwriteTeams.teams) {
      console.log(`📋 Processing: ${team.name} (${team.$id})`);
      
      const result = await addKatyaToTeam(
        databases,
        teams,
        katyaCredentials.userId,
        katyaCredentials.email,
        team.$id,
        team.name
      );

      if (result.added) {
        results.added++;
      } else if (result.reason === 'already_member' || result.reason === 'already_exists') {
        results.alreadyMember++;
      } else if (result.reason === 'quota_limit') {
        results.skipped++;
      } else {
        results.errors++;
      }

      console.log(''); // Empty line for readability
    }

    // Summary
    console.log('\n✅ Summary:');
    console.log(`   Total teams: ${results.total}`);
    console.log(`   ✅ Added: ${results.added}`);
    console.log(`   ⏭️  Already member: ${results.alreadyMember}`);
    console.log(`   ⚠️  Skipped (quota): ${results.skipped}`);
    console.log(`   ❌ Errors: ${results.errors}`);

    if (results.skipped > 0) {
      console.log('\n💡 For skipped teams due to quota limits:');
      console.log('   1. Go to Appwrite Console → Teams');
      console.log('   2. Add Katya manually to each team');
      console.log('   3. Or upgrade your Appwrite plan');
    }

    console.log('\n✨ Done! Katya is now a member of all teams.');

  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run script
if (require.main === module) {
  addKatyaToAllTeams()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { addKatyaToAllTeams };

