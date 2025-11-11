/**
 * Script: Add User to Team
 * 
 * This script manually adds a user to a team (both Appwrite Teams and our custom memberships table).
 * Useful when invites aren't working yet, or for testing purposes.
 * 
 * Usage:
 *   node scripts/add-team-member.js <teamId> <userId> [role] [email]
 * 
 * Examples:
 *   node scripts/add-team-member.js 68f0dc7f002427e257f5 68f43803a43077657a06 member
 *   node scripts/add-team-member.js 68f0dc7f002427e257f5 68f43803a43077657a06 owner user@example.com
 * 
 * Environment Variables Required:
 *   - APPWRITE_ENDPOINT (defaults to EXPO_PUBLIC_APPWRITE_ENDPOINT or https://cloud.appwrite.io/v1)
 *   - APPWRITE_PROJECT_ID (or EXPO_PUBLIC_APPWRITE_PROJECT_ID)
 *   - APPWRITE_API_KEY (get from Appwrite Console → Settings → API Keys)
 *   - APPWRITE_DATABASE_ID (or EXPO_PUBLIC_APPWRITE_DATABASE_ID)
 */

const { Client, Databases, Teams, Users, Query } = require('node-appwrite');

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
const MEMBERSHIPS_COLLECTION_ID = 'memberships';
const TEAMS_COLLECTION_ID = 'teams';

/**
 * Main function to add user to team
 */
async function addUserToTeam(teamId, userId, role = 'member', userEmail = null) {
  // Validate environment variables
  if (!APPWRITE_PROJECT_ID || !APPWRITE_API_KEY || !APPWRITE_DATABASE_ID) {
    console.error('❌ Missing required environment variables:');
    console.error('   - APPWRITE_PROJECT_ID (or EXPO_PUBLIC_APPWRITE_PROJECT_ID)');
    console.error('   - APPWRITE_API_KEY (get from Appwrite Console → Settings → API Keys)');
    console.error('   - APPWRITE_DATABASE_ID (or EXPO_PUBLIC_APPWRITE_DATABASE_ID)');
    console.error('\n💡 How to get API Key:');
    console.error('   1. Go to Appwrite Console');
    console.error('   2. Settings → API Keys');
    console.error('   3. Create new key with scopes: users.read, teams.write, documents.read, documents.write');
    console.error('   4. Copy the key and set as APPWRITE_API_KEY in .env file');
    process.exit(1);
  }

  // Validate arguments
  if (!teamId || !userId) {
    console.error('❌ Missing required arguments:');
    console.error('   Usage: node scripts/add-team-member.js <teamId> <userId> [role] [email]');
    console.error('   Example: node scripts/add-team-member.js 68f0dc7f002427e257f5 68f43803a43077657a06 member');
    process.exit(1);
  }

  // Validate role
  const validRoles = ['member', 'owner'];
  const normalizedRole = role.toLowerCase();
  if (!validRoles.includes(normalizedRole)) {
    console.error(`❌ Invalid role: ${role}`);
    console.error(`   Valid roles are: ${validRoles.join(', ')}`);
    process.exit(1);
  }

  console.log('🚀 Starting add user to team...');
  console.log(`📋 Endpoint: ${APPWRITE_ENDPOINT}`);
  console.log(`📋 Project ID: ${APPWRITE_PROJECT_ID}`);
  console.log(`📋 Database ID: ${APPWRITE_DATABASE_ID}`);
  console.log(`📋 Team ID: ${teamId}`);
  console.log(`📋 User ID: ${userId}`);
  console.log(`📋 Role: ${normalizedRole}`);
  console.log(`📋 API Key: ${APPWRITE_API_KEY ? APPWRITE_API_KEY.substring(0, 10) + '...' : 'NOT SET'}\n`);

  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

  const databases = new Databases(client);
  const teams = new Teams(client);
  const users = new Users(client);

  try {
    // Step 1: Determine if teamId is Appwrite Team ID or Database Team ID
    // First, check if it's an Appwrite Team ID by trying to get it from Appwrite
    console.log('🔍 Step 1: Finding team...');
    let appwriteTeamId = teamId;
    let teamData = null;
    
    // Try to get team from Appwrite first (to see if teamId is an Appwrite Team ID)
    let isAppwriteTeamId = false;
    try {
      const appwriteTeam = await teams.get(teamId);
      isAppwriteTeamId = true;
      appwriteTeamId = teamId;
      console.log(`✅ Found Appwrite Team: ${appwriteTeam.name} (ID: ${appwriteTeam.$id})`);
      
      // Now find the corresponding database team
      try {
        // Try to find database team - it might have teamId field or we need to search by name
        const dbTeamQuery = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          TEAMS_COLLECTION_ID,
          [Query.equal('teamName', appwriteTeam.name)]
        );
        
        if (dbTeamQuery.documents && dbTeamQuery.documents.length > 0) {
          teamData = dbTeamQuery.documents[0];
          console.log(`✅ Found database team: ${teamData.teamName} (ID: ${teamData.$id})`);
        } else {
          console.warn(`⚠️  Database team not found for Appwrite Team "${appwriteTeam.name}"`);
        }
      } catch (dbError) {
        console.warn(`⚠️  Could not find database team:`, dbError.message);
      }
    } catch (error) {
      // teamId is not an Appwrite Team ID, try to find it in database
      console.log(`   teamId doesn't appear to be an Appwrite Team ID, checking database...`);
      
      try {
        // Try as database document ID
        const teamQuery = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          TEAMS_COLLECTION_ID,
          [Query.equal('$id', teamId)]
        );
        
        if (teamQuery.documents && teamQuery.documents.length > 0) {
          teamData = teamQuery.documents[0];
          console.log(`✅ Found database team: ${teamData.teamName} (ID: ${teamData.$id})`);
          
          // Now we need to find the Appwrite Team ID
          // Check if database team has appwriteTeamId field (new field we're adding)
          if (teamData.appwriteTeamId) {
            appwriteTeamId = teamData.appwriteTeamId;
            console.log(`✅ Found Appwrite Team ID in database: ${appwriteTeamId}`);
            
            // Verify it exists in Appwrite
            try {
              const appwriteTeam = await teams.get(appwriteTeamId);
              console.log(`✅ Verified Appwrite Team: ${appwriteTeam.name}`);
            } catch (verifyError) {
              throw new Error(`Appwrite Team ID ${appwriteTeamId} from database doesn't exist in Appwrite Teams`);
            }
          } else if (teamData.teamId) {
            // Legacy support: check old teamId field
            appwriteTeamId = teamData.teamId;
            console.log(`✅ Found Appwrite Team ID in database (legacy field): ${appwriteTeamId}`);
            
            // Verify it exists in Appwrite
            try {
              const appwriteTeam = await teams.get(appwriteTeamId);
              console.log(`✅ Verified Appwrite Team: ${appwriteTeam.name}`);
            } catch (verifyError) {
              throw new Error(`Appwrite Team ID ${appwriteTeamId} from database doesn't exist in Appwrite Teams`);
            }
          } else {
            // Try to find by team name
            const appwriteTeams = await teams.list();
            const matchingTeam = appwriteTeams.teams.find((t) => t.name === teamData.teamName);
            
            if (matchingTeam) {
              appwriteTeamId = matchingTeam.$id;
              console.log(`✅ Found Appwrite Team by name: ${matchingTeam.name} (ID: ${appwriteTeamId})`);
            } else {
              throw new Error(`Could not find Appwrite Team for database team "${teamData.teamName}". Please provide the Appwrite Team ID.`);
            }
          }
        } else {
          // Try searching by teamId field
          const teamQuery2 = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            TEAMS_COLLECTION_ID,
            [Query.equal('teamId', teamId)]
          );
          
          if (teamQuery2.documents && teamQuery2.documents.length > 0) {
            teamData = teamQuery2.documents[0];
            appwriteTeamId = teamId; // teamId is the Appwrite Team ID
            console.log(`✅ Found database team: ${teamData.teamName} (ID: ${teamData.$id})`);
            console.log(`✅ Using provided Appwrite Team ID: ${appwriteTeamId}`);
            
            // Verify it exists
            try {
              const appwriteTeam = await teams.get(appwriteTeamId);
              console.log(`✅ Verified Appwrite Team: ${appwriteTeam.name}`);
            } catch (verifyError) {
              throw new Error(`Appwrite Team ID ${appwriteTeamId} doesn't exist in Appwrite Teams`);
            }
          } else {
            throw new Error(`Team with ID ${teamId} not found in database or Appwrite Teams. Please check the ID.`);
          }
        }
      } catch (error) {
        console.error('❌ Error finding team:', error.message);
        throw error;
      }
    }

    // Step 2: Get user email if not provided
    console.log('🔍 Step 2: Getting user information...');
    let email = userEmail;
    
    if (!email) {
      try {
        const user = await users.get(userId);
        email = user.email || null;
        console.log(`✅ User found: ${user.name || user.email || userId}`);
        if (email) {
          console.log(`✅ User email: ${email}`);
        }
      } catch (error) {
        console.warn(`⚠️  Could not get user ${userId}:`, error.message);
        console.warn('   Continuing without email - you may need to provide it manually');
      }
    }

    // Step 3: Check if user is already a member (check both database and Appwrite Teams)
    console.log('🔍 Step 3: Checking if user is already a member...');
    
    // Check database membership using Appwrite Team ID
    let existingDbMembership = null;
    try {
      const existingMemberships = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        MEMBERSHIPS_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.equal('teamId', appwriteTeamId) // Use Appwrite Team ID, not the input teamId
        ]
      );

      if (existingMemberships.documents && existingMemberships.documents.length > 0) {
        existingDbMembership = existingMemberships.documents[0];
        console.warn(`⚠️  User already has database membership!`);
        console.warn(`   Database Membership ID: ${existingDbMembership.$id}`);
        console.warn(`   Current role: ${existingDbMembership.role || 'unknown'}`);
        console.warn(`   Status: ${existingDbMembership.isActive ? 'Active' : 'Inactive'}`);
      }
    } catch (error) {
      console.warn('⚠️  Could not check database memberships:', error.message);
    }
    
    // Check Appwrite Teams membership
    let existingAppwriteMembership = null;
    try {
      const appwriteMemberships = await teams.listMemberships(appwriteTeamId);
      existingAppwriteMembership = appwriteMemberships.memberships.find((m) => m.userId === userId);
      
      if (existingAppwriteMembership) {
        console.warn(`⚠️  User already has Appwrite Teams membership!`);
        console.warn(`   Appwrite Membership ID: ${existingAppwriteMembership.$id}`);
        console.warn(`   Status: ${existingAppwriteMembership.confirm ? 'Active' : 'Pending'}`);
      }
    } catch (error) {
      console.warn('⚠️  Could not check Appwrite Teams memberships:', error.message);
    }
    
    // If both exist, warn and exit
    if (existingDbMembership && existingAppwriteMembership) {
      console.warn('\n⚠️  User is already a member of this team in both database and Appwrite Teams!');
      console.warn('   No action needed. If you want to update the role, use a different script or update manually.');
      process.exit(0);
    }
    
    // If only one exists, note it but continue
    if (existingDbMembership && !existingAppwriteMembership) {
      console.log('\n💡 Database membership exists but Appwrite Teams membership is missing.');
      console.log('   Will create Appwrite Teams membership and update database membership.');
    } else if (!existingDbMembership && existingAppwriteMembership) {
      console.log('\n💡 Appwrite Teams membership exists but database membership is missing.');
      console.log('   Will create database membership.');
    }

    // Step 4: Create or update Appwrite Teams membership
    console.log('🔍 Step 4: Creating/updating Appwrite Teams membership...');
    let appwriteMembership = existingAppwriteMembership || null;
    
    // If we already found an existing Appwrite membership, use it
    if (appwriteMembership) {
      console.log(`✅ Using existing Appwrite Teams membership (ID: ${appwriteMembership.$id})`);
    } else {
      // Need to create new Appwrite Teams membership
      if (!email) {
        console.error('❌ Email is required to create Appwrite Teams membership');
        console.error('   Appwrite Teams requires email to send invitation');
        console.error('   Please provide email as 4th argument or ensure user has email in Appwrite');
        throw new Error('Email required for Appwrite Teams membership');
      }

      try {
        // Create Appwrite Teams membership using email invitation
        // This will send an invitation email to the user
        console.log(`   Creating Appwrite Teams membership for ${email}...`);
        console.log(`   Appwrite Team ID: ${appwriteTeamId}`);
        console.log(`   Role: ${normalizedRole}`);
        console.log(`   Note: User will receive an invitation email and must accept it.`);
        
        // For server-side, we need to provide a redirect URL
        // You can use your app's deep link or a placeholder URL
        const redirectUrl = process.env.APPWRITE_REDIRECT_URL || 'app://callback';
        
        appwriteMembership = await teams.createMembership(
          appwriteTeamId,  // Use the Appwrite Team ID
          [normalizedRole], // Roles array
          email,            // User email
          [],               // Permissions (empty array)
          [],               // User IDs (empty - will be determined from email)
          redirectUrl       // Redirect URL after accepting invitation
        );
        
        console.log(`✅ Appwrite Teams membership invitation created!`);
        console.log(`   Membership ID: ${appwriteMembership.$id}`);
        console.log(`   Invitation sent to: ${email}`);
        console.log(`   Status: ${appwriteMembership.confirm ? 'Active (already confirmed)' : 'Pending invitation'}`);
        if (!appwriteMembership.confirm) {
          console.log(`   User needs to accept the invitation to complete the process.`);
        }
        
      } catch (error) {
        // Check if membership already exists (duplicate check)
        if (error.message?.includes('already') || error.code === 409) {
          console.warn(`⚠️  Membership might already exist, checking...`);
          
          try {
            // Try to find existing membership
            const memberships = await teams.listMemberships(appwriteTeamId);
            const existing = memberships.memberships.find((m) => m.userId === userId || m.email === email);
            
            if (existing) {
              appwriteMembership = existing;
              console.log(`✅ Found existing Appwrite Teams membership (ID: ${existing.$id})`);
            } else {
              throw new Error('Membership creation failed and could not find existing membership');
            }
          } catch (listError) {
            console.error('❌ Could not list memberships:', listError.message);
            throw error; // Re-throw original error
          }
        } else if (error.code === 402 || error.type?.includes('limit') || error.type?.includes('quota')) {
          // Handle quota/limit errors - these are usually rate limits or plan limits
          console.error('⚠️  Appwrite quota/limit error:', error.message);
          console.error('   Error code:', error.code);
          console.error('   Error type:', error.type);
          console.warn('\n💡 This usually means:');
          console.warn('   1. You\'ve hit a quota limit (invitations, API calls, etc.)');
          console.warn('   2. Your Appwrite plan has restrictions');
          console.warn('   3. There\'s a rate limit in place');
          console.warn('\n💡 Options to proceed:');
          console.warn('   Option 1: Wait a bit and try again');
          console.warn('   Option 2: Manually add user via Appwrite Console:');
          console.warn(`      - Go to Appwrite Console → Teams → "${teamData?.teamName || appwriteTeamId}" → Members`);
          console.warn(`      - Click "Add Member" and enter email: ${email}`);
          console.warn(`      - Set role: ${normalizedRole}`);
          console.warn('   Option 3: Continue with database membership only (will create now)');
          console.warn('   Option 4: Upgrade your Appwrite plan if needed');
          console.warn('\n⚠️  Continuing to create database membership...');
          console.warn('   You can manually add the Appwrite Teams membership later via Console.');
          // Don't throw - continue with database membership creation
          appwriteMembership = null;
        } else {
          console.error('❌ Error creating Appwrite Teams membership:', error.message);
          console.error('   Error code:', error.code);
          console.error('   Error type:', error.type);
          console.error('\n💡 Troubleshooting:');
          console.error('   1. Make sure the user email exists in Appwrite Users');
          console.error('   2. Check that the Appwrite Team ID is correct');
          console.error('   3. Verify API key has "teams.write" scope');
          console.error('   4. User might already be a member - check Appwrite Console');
          console.error('\n⚠️  Continuing to create database membership...');
          console.error('   You can manually add the Appwrite Teams membership later via Console.');
          // Don't throw - continue with database membership creation
          appwriteMembership = null;
        }
      }
    }

    // Step 5: Create or update membership in our database
    console.log('🔍 Step 5: Creating/updating membership in our database...');
    try {
      // Use the Appwrite Team ID (not database team ID) in teamId field
      const membershipData = {
        userId: userId,
        teamId: appwriteTeamId, // Use Appwrite Team ID (required for proper linking)
        role: normalizedRole,
        userEmail: email || '',
        invitedBy: 'system', // Or you could use a specific user ID
        joinedAt: appwriteMembership?.joined || new Date().toISOString(),
        isActive: appwriteMembership?.confirm || false // Set to true when user accepts invitation
      };
      
      // If Appwrite membership exists and is confirmed, mark as active
      if (appwriteMembership?.confirm) {
        membershipData.isActive = true;
        membershipData.joinedAt = appwriteMembership.joined || new Date().toISOString();
      }

      let membership;
      if (existingDbMembership) {
        // Update existing database membership
        console.log(`   Updating existing database membership (ID: ${existingDbMembership.$id})...`);
        membership = await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          MEMBERSHIPS_COLLECTION_ID,
          existingDbMembership.$id,
          membershipData
        );
        console.log(`✅ Database membership updated!`);
      } else {
        // Create new database membership
        console.log(`   Creating new database membership...`);
        membership = await databases.createDocument(
          APPWRITE_DATABASE_ID,
          MEMBERSHIPS_COLLECTION_ID,
          'unique()', // Auto-generate ID
          membershipData
        );
        console.log(`✅ Database membership created!`);
      }

      console.log(`✅ Membership created successfully!`);
      console.log(`   Membership ID: ${membership.$id}`);
      console.log(`   User ID: ${userId}`);
      console.log(`   Appwrite Team ID: ${appwriteTeamId}`);
      console.log(`   Database Team ID: ${teamData?.$id || 'N/A'}`);
      console.log(`   Role: ${normalizedRole}`);
      if (email) {
        console.log(`   Email: ${email}`);
      }

      console.log('\n✅ Summary:');
      if (appwriteMembership) {
        console.log(`   ✅ Appwrite Teams membership: ${appwriteMembership.confirm ? 'Active' : 'Pending invitation'}`);
        console.log(`   ✅ Database membership: ${existingDbMembership ? 'Updated' : 'Created'}`);
        console.log('\n📋 Next Steps:');
        if (!appwriteMembership.confirm) {
          console.log('   1. User will receive an invitation email');
          console.log('   2. User must accept the invitation');
          console.log('   3. After accepting, membership will be active in "My Memberships"');
        } else {
          console.log('   ✅ Membership is active and will appear in "My Memberships"');
        }
      } else {
        console.log(`   ⚠️  Appwrite Teams membership: NOT created (quota/limit error)`);
        console.log(`   ✅ Database membership: ${existingDbMembership ? 'Updated' : 'Created'}`);
        console.log('\n📋 Next Steps (REQUIRED for membership to show in "My Memberships"):');
        console.log('   1. Go to Appwrite Console: https://sfo.cloud.appwrite.io');
        console.log(`   2. Navigate to: Teams → "${teamData?.teamName || 'Your Team'}" → Members`);
        console.log(`   3. Click "Add Member" or "Create Membership"`);
        console.log(`   4. Enter email: ${email || userId}`);
        console.log(`   5. Set role: ${normalizedRole}`);
        console.log('   6. User will receive an invitation (or membership will be created immediately)');
        console.log('\n   After adding in Console, the membership will appear in "My Memberships"');
        console.log('   The database membership is already created and linked correctly.');
      }
      
      console.log('\n✅ Script completed successfully!');

    } catch (error) {
      console.error('❌ Error creating membership:', error.message);
      throw error;
    }

  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Missing required arguments:');
  console.error('   Usage: node scripts/add-team-member.js <teamId> <userId> [role] [email]');
  console.error('   Example: node scripts/add-team-member.js 68f0dc7f002427e257f5 68f43803a43077657a06 member');
  console.error('\n   Arguments:');
  console.error('     teamId  - The ID of the team to add the user to');
  console.error('     userId  - The ID of the user to add');
  console.error('     role    - Optional. Role: member or owner (default: member)');
  console.error('     email   - Optional. User email (will be fetched if not provided)');
  process.exit(1);
}

const teamId = args[0];
const userId = args[1];
const role = args[2] || 'member';
const userEmail = args[3] || null;

// Run the script
addUserToTeam(teamId, userId, role, userEmail).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
