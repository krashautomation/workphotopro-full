/**
 * Sync Appwrite Teams memberships to custom memberships collection
 * 
 * This script pulls membership data from Appwrite Teams SDK
 * and populates the custom memberships collection.
 * 
 * Usage: npx tsx scripts/sync-appwrite-memberships.ts
 */

import 'dotenv/config';
import { Client, Databases, Teams, Query } from 'node-appwrite';

const CONFIG = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || '',
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '',
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '',
  apiKey: process.env.APPWRITE_API_KEY || '',
};

if (!CONFIG.endpoint || !CONFIG.projectId || !CONFIG.databaseId || !CONFIG.apiKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(CONFIG.endpoint)
  .setProject(CONFIG.projectId)
  .setKey(CONFIG.apiKey);

const databases = new Databases(client);
const teams = new Teams(client);

async function paginatedList(
  collectionId: string,
  queries: string[] = [],
  batchSize: number = 100
): Promise<any[]> {
  const all: any[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const result = await databases.listDocuments(
      CONFIG.databaseId,
      collectionId,
      [
        ...queries,
        Query.limit(batchSize),
        Query.offset(offset)
      ]
    );

    all.push(...result.documents);
    offset += result.documents.length;
    hasMore = result.documents.length === batchSize;
    
    if (offset > 100000) {
      console.warn(`Pagination safety limit reached for ${collectionId}`);
      break;
    }
  }

  return all;
}

async function syncAppwriteMemberships() {
  console.log('\n🔄 Syncing Appwrite Teams memberships to custom collection...\n');

  const results = {
    teamsProcessed: 0,
    membershipsSynced: 0,
    membershipsSkipped: 0,
    membershipsFailed: 0,
    errors: [] as Array<{ teamId: string; userId: string; error: string }>
  };

  // Get all teams from DB
  console.log('📊 Fetching teams from database...');
  const dbTeams = await paginatedList('teams');
  console.log(`   Found ${dbTeams.length} teams\n`);

  // Get existing memberships to avoid duplicates
  console.log('📊 Fetching existing memberships...');
  const existingMemberships = await paginatedList('memberships');
  const existingKeys = new Set(
    existingMemberships.map(m => `${m.userId}:${m.teamId}`)
  );
  console.log(`   Found ${existingMemberships.length} existing memberships\n`);

  for (const team of dbTeams) {
    if (!team.appwriteTeamId) {
      console.log(`   ⚠️  Team ${team.teamName} has no appwriteTeamId, skipping`);
      continue;
    }

    console.log(`\n📋 Processing: ${team.teamName} (${team.$id})`);
    console.log(`   Appwrite Team ID: ${team.appwriteTeamId}`);
    results.teamsProcessed++;

    try {
      // Get memberships from Appwrite Teams
      const appwriteMemberships = await teams.listMemberships(team.appwriteTeamId);
      console.log(`   Found ${appwriteMemberships.total} Appwrite memberships`);

      for (const membership of appwriteMemberships.memberships) {
        const userId = membership.userId;
        const teamId = team.$id;
        const key = `${userId}:${teamId}`;

        // Check if already exists
        if (existingKeys.has(key)) {
          console.log(`      ⏭️  Skipping ${userId} - already exists`);
          results.membershipsSkipped++;
          continue;
        }

        try {
          // Determine role
          const role = membership.roles && membership.roles.length > 0 
            ? membership.roles[0] 
            : 'member';

          // Get invitedBy (from invited field or fallback)
          let invitedBy = team.createdBy || '';
          if (membership.invited) {
            invitedBy = membership.invited;
          }

          // Create membership document (auto-generate ID)
          await databases.createDocument(
            CONFIG.databaseId,
            'memberships',
            'unique()',  // Auto-generate unique ID
            {
              userId: userId,
              teamId: teamId,
              orgId: team.orgId,
              role: role,
              userEmail: membership.userEmail || '',
              userName: membership.userName || '',
              invitedBy: invitedBy,
              joinedAt: membership.$createdAt,
              isActive: true
            }
          );

          console.log(`      ✅ Created membership for ${userId} (${role})`);
          results.membershipsSynced++;
          existingKeys.add(key);  // Mark as created

        } catch (err: any) {
          console.error(`      ❌ Failed for ${userId}: ${err.message}`);
          results.membershipsFailed++;
          results.errors.push({ teamId: team.$id, userId, error: err.message });
        }
      }

    } catch (err: any) {
      console.error(`   ❌ Failed to fetch Appwrite memberships: ${err.message}`);
      results.errors.push({ 
        teamId: team.$id, 
        userId: 'N/A', 
        error: `Failed to fetch memberships: ${err.message}` 
      });
    }
  }

  console.log('\n' + '═'.repeat(70));
  console.log('\n📊 Sync Results:\n');
  console.log(`   Teams processed: ${results.teamsProcessed}`);
  console.log(`   Memberships synced: ${results.membershipsSynced}`);
  console.log(`   Memberships skipped: ${results.membershipsSkipped}`);
  console.log(`   Memberships failed: ${results.membershipsFailed}`);

  if (results.membershipsFailed > 0) {
    console.log('\n   Errors:');
    results.errors.forEach(e => {
      console.log(`      • Team ${e.teamId}, User ${e.userId}: ${e.error}`);
    });
  }

  console.log('\n✅ Sync complete!\n');
  console.log('👉 Next steps:');
  console.log('   1. Run: npx tsx scripts/migrate-team-creators.ts');
  console.log('   2. Run: npx tsx scripts/migrate-orgId-memberships.ts');
  console.log('   3. Run: npx tsx scripts/verify-phase1.ts\n');

  return results;
}

syncAppwriteMemberships().catch(err => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});
