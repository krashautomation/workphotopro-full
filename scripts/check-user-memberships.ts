/**
 * Check User Memberships Status
 * 
 * Query membership status for users with orphaned memberships
 * to verify they still have valid team access elsewhere.
 * 
 * Usage: npx tsx scripts/check-user-memberships.ts
 */

import 'dotenv/config';
import { Client, Databases, Query } from 'node-appwrite';

// Configuration
const CONFIG = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || '',
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '',
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '',
  apiKey: process.env.APPWRITE_API_KEY || '',
};

// Validate config
if (!CONFIG.endpoint || !CONFIG.projectId || !CONFIG.databaseId || !CONFIG.apiKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(CONFIG.endpoint)
  .setProject(CONFIG.projectId)
  .setKey(CONFIG.apiKey);

const databases = new Databases(client);

// UserIds to check (from orphaned memberships analysis)
const USER_IDS = [
  '68f0dc7f002427e257f5',
  '68f43803a43077657a06',
  '692d284d000f7e24c7e4'
];

// Get existing team IDs
async function getExistingTeamIds(): Promise<Set<string>> {
  const allTeams: any[] = [];
  let offset = 0;
  let hasMore = true;
  
  while (hasMore) {
    const result = await databases.listDocuments(
      CONFIG.databaseId,
      'teams',
      [Query.limit(100), Query.offset(offset)]
    );
    allTeams.push(...result.documents);
    offset += result.documents.length;
    hasMore = result.documents.length === 100;
  }
  
  return new Set(allTeams.map(t => t.$id));
}

// Check memberships for a specific user
async function checkUserMemberships(userId: string, existingTeamIds: Set<string>) {
  const memberships: any[] = [];
  let offset = 0;
  let hasMore = true;
  
  while (hasMore) {
    const result = await databases.listDocuments(
      CONFIG.databaseId,
      'memberships',
      [
        Query.equal('userId', userId),
        Query.limit(100),
        Query.offset(offset)
      ]
    );
    memberships.push(...result.documents);
    offset += result.documents.length;
    hasMore = result.documents.length === 100;
  }
  
  const validMemberships = memberships.filter(m => existingTeamIds.has(m.teamId));
  const orphanedMemberships = memberships.filter(m => !existingTeamIds.has(m.teamId));
  
  return {
    totalMemberships: memberships.length,
    validMemberships,
    orphanedMemberships
  };
}

async function main() {
  console.log('\n🔍 Checking User Membership Status\n');
  console.log('Users to check:', USER_IDS.join(', '));
  console.log('');
  
  // Get existing teams
  console.log('📊 Fetching existing teams...');
  const existingTeamIds = await getExistingTeamIds();
  console.log(`   Found ${existingTeamIds.size} existing teams\n`);
  
  // Check each user
  for (const userId of USER_IDS) {
    console.log(`👤 User: ${userId}`);
    console.log('─'.repeat(60));
    
    const result = await checkUserMemberships(userId, existingTeamIds);
    
    console.log(`   Total memberships: ${result.totalMemberships}`);
    console.log(`   ✅ Valid memberships: ${result.validMemberships.length}`);
    console.log(`   ❌ Orphaned memberships: ${result.orphanedMemberships.length}`);
    
    if (result.validMemberships.length > 0) {
      console.log('\n   Valid team memberships:');
      for (const m of result.validMemberships) {
        try {
          const team = await databases.getDocument(CONFIG.databaseId, 'teams', m.teamId);
          console.log(`      • ${team.teamName} (${m.teamId}) - Role: ${m.role}`);
        } catch {
          console.log(`      • Unknown Team (${m.teamId}) - Role: ${m.role}`);
        }
      }
    }
    
    if (result.orphanedMemberships.length > 0) {
      console.log('\n   Orphaned memberships (teams don\'t exist):');
      for (const m of result.orphanedMemberships) {
        console.log(`      • Membership ${m.$id} → Team ${m.teamId}`);
      }
    }
    
    console.log('');
  }
  
  console.log('─'.repeat(60));
  console.log('\n📊 Summary:\n');
  
  let allUsersHaveValidAccess = true;
  
  for (const userId of USER_IDS) {
    const result = await checkUserMemberships(userId, existingTeamIds);
    const hasValidAccess = result.validMemberships.length > 0;
    allUsersHaveValidAccess = allUsersHaveValidAccess && hasValidAccess;
    
    console.log(`   ${hasValidAccess ? '✅' : '⚠️'}  ${userId}: ${result.validMemberships.length} valid, ${result.orphanedMemberships.length} orphaned`);
  }
  
  console.log('');
  if (allUsersHaveValidAccess) {
    console.log('✅ All users have at least one valid team membership');
    console.log('   → Safe to delete orphaned memberships\n');
  } else {
    console.log('⚠️  Some users may lose all team access if orphaned memberships are deleted');
    console.log('   → Review carefully before proceeding\n');
  }
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
