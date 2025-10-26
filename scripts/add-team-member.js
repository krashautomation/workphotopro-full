/**
 * Script to manually add a user as a team member for testing
 * 
 * Usage: node scripts/add-team-member.js
 * 
 * This script will:
 * 1. Sign in with the first account (team owner)
 * 2. List all teams for that account
 * 3. Pick the first team
 * 4. Add the second account as a member to that team
 */

require('dotenv').config();
const { Client, Account, Databases, Teams, ID, Query } = require('node-appwrite');

if (!process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT) {
  throw new Error('Missing EXPO_PUBLIC_APPWRITE_ENDPOINT in .env file');
}

if (!process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID) {
  throw new Error('Missing EXPO_PUBLIC_APPWRITE_PROJECT_ID in .env file');
}

if (!process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID) {
  throw new Error('Missing EXPO_PUBLIC_APPWRITE_DATABASE_ID in .env file');
}

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;

// Appwrite client setup
const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);
const teams = new Teams(client);

// Your two test accounts (UPDATE THESE WITH YOUR ACTUAL ACCOUNTS)
const ACCOUNTS = {
  owner: {
    email: 'testuser1@example.com',
    password: 'Test123456!'
  },
  member: {
    email: 'testuser2@example.com',
    password: 'Test123456!'
  }
};

async function getUserIdByEmail(email) {
  try {
    console.log(`🔍 Searching for user with email: ${email}`);
    
    // We'll get user by trying to create a session first
    // Actually, we need to use the Admin API for this, but we can work around it
    // by creating a session with the user's credentials
    const session = await account.createEmailPasswordSession(email, ACCOUNTS.member.password);
    
    if (session && session.userId) {
      return session.userId;
    }
    
    throw new Error('Could not find user ID');
  } catch (error) {
    console.error('❌ Error getting user ID:', error);
    throw error;
  }
}

async function addTeamMember() {
  try {
    console.log('🚀 Starting team member addition process...\n');

    // Step 1: Sign in as team owner
    console.log('📝 Step 1: Signing in as team owner...');
    await account.createEmailPasswordSession(ACCOUNTS.owner.email, ACCOUNTS.owner.password);
    const ownerUser = await account.get();
    console.log(`✅ Signed in as: ${ownerUser.name} (${ownerUser.email})`);
    console.log(`   User ID: ${ownerUser.$id}\n`);

    // Step 2: Get the team owner's ID
    const ownerId = ownerUser.$id;

    // Step 3: List all teams for the owner
    console.log('📋 Step 2: Fetching teams...');
    const allTeams = await teams.list();
    console.log(`✅ Found ${allTeams.teams.length} teams\n`);

    if (allTeams.teams.length === 0) {
      console.log('❌ No teams found. Please create a team first.');
      return;
    }

    // Display teams
    console.log('📦 Available teams:');
    allTeams.teams.forEach((team, index) => {
      console.log(`   ${index + 1}. ${team.name} (ID: ${team.$id})`);
    });
    
    // Pick the first team
    const selectedTeam = allTeams.teams[0];
    console.log(`\n✅ Selected team: ${selectedTeam.name} (${selectedTeam.$id})\n`);

    // Step 4: Sign out and sign in as the second user to get their ID
    console.log('👤 Step 3: Getting member user ID...');
    await account.deleteSessions();
    
    try {
      await account.createEmailPasswordSession(ACCOUNTS.member.email, ACCOUNTS.member.password);
      const memberUser = await account.get();
      const memberUserId = memberUser.$id;
      console.log(`✅ Member user ID: ${memberUserId}`);
      console.log(`   Email: ${memberUser.email}\n`);
      
      await account.deleteSessions();
    } catch (error) {
      console.log('ℹ️  Could not sign in as member (they might not exist yet)');
      console.log('   We will create a membership invitation instead\n');
    }

    // Step 5: Sign back in as owner
    console.log('🔐 Step 4: Signing back in as owner...');
    await account.createEmailPasswordSession(ACCOUNTS.owner.email, ACCOUNTS.owner.password);
    const ownerUser2 = await account.get();
    console.log(`✅ Signed in as: ${ownerUser2.name}\n`);

    // Step 6: Add member to team (using team membership API)
    console.log('➕ Step 5: Adding member to team...');
    const memberEmail = ACCOUNTS.member.email;
    
    try {
      // Try to create membership invitation
      const inviteUrl = 'workphotopro://team-invite'; // Dummy URL for testing
      const roles = ['member']; // Role for the new member
      
      console.log(`   Inviting: ${memberEmail}`);
      console.log(`   Team: ${selectedTeam.name}`);
      console.log(`   Role: ${roles[0]}`);
      
      const membership = await teams.createMembership(
        selectedTeam.$id,
        roles,
        memberEmail,
        inviteUrl
      );
      
      console.log('\n✅ SUCCESS! Membership invitation created');
      console.log(`   Membership ID: ${membership.$id}`);
      console.log(`   Status: ${membership.confirm ? 'Confirmed' : 'Pending'}\n`);

      // Step 7: Create membership record in our database
      console.log('💾 Step 6: Creating membership record in database...');
      try {
        const membershipData = {
          userId: membership.userId,
          teamId: selectedTeam.$id,
          role: roles[0],
          invitedBy: ownerId,
          joinedAt: new Date().toISOString(),
          isActive: true
        };

        await databases.createDocument(
          DATABASE_ID,
          'memberships',
          ID.unique(),
          membershipData
        );
        console.log('✅ Membership record created in database\n');
      } catch (dbError) {
        console.log('⚠️  Could not create membership record in database:');
        console.log(`   ${dbError.message}\n`);
      }

      // Summary
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ COMPLETE! Team member added successfully');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Team: ${selectedTeam.name}`);
      console.log(`Member: ${memberEmail}`);
      console.log(`Role: ${roles[0]}`);
      console.log(`Status: ${membership.confirm ? 'Active' : 'Pending Invitation'}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      console.log('📱 Next steps:');
      console.log('   1. Log in to the app with the second account');
      console.log('   2. Go to the Teams tab');
      console.log('   3. You should see "My Memberships" with this team');
      console.log('   4. The team owner should see it in "My Teams"\n');

    } catch (membershipError) {
      console.error('❌ Error creating membership:', membershipError);
      console.error('\n📋 Error details:');
      console.error(`   ${membershipError.message}\n`);
      
      // Check if user already exists
      if (membershipError.message.includes('already')) {
        console.log('💡 Tip: The user might already be a member of this team');
        console.log('   Try checking the existing memberships:\n');
        
        try {
          const memberships = await teams.listMemberships(selectedTeam.$id);
          console.log('Current members:');
          memberships.memberships.forEach((m) => {
            console.log(`   - ${m.userEmail} (${m.roles.join(', ')})`);
          });
        } catch (listError) {
          console.log('   Could not list members');
        }
      }
    }

    // Clean up
    await account.deleteSessions();

  } catch (error) {
    console.error('❌ Fatal error:', error);
    console.error('\n📋 Error details:');
    console.error(`   ${error.message}`);
    
    // Try to clean up sessions
    try {
      await account.deleteSessions();
    } catch (e) {
      // Ignore cleanup errors
    }
    
    process.exit(1);
  }
}

// Run the script
console.log('╔════════════════════════════════════════════╗');
console.log('║  Add Team Member Script                   ║');
console.log('╚════════════════════════════════════════════╝\n');

addTeamMember().then(() => {
  console.log('✨ Script completed successfully!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
