/**
 * Migration: Populate createdBy field on teams
 * 
 * This script finds the oldest owner membership for each team
 * and sets team.createdBy to that owner's userId.
 * 
 * Prerequisites:
 * - createdBy field added to teams collection (required: false)
 * 
 * Usage: npx tsx scripts/migrate-team-creators.ts
 */

import 'dotenv/config';
import { Client, Databases, Query } from 'node-appwrite';

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

async function migrateTeamCreators() {
  console.log('\n🚀 Starting createdBy migration for teams...\n');

  const results = {
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [] as Array<{ teamId: string; error: string }>
  };

  // Get all teams
  console.log('📊 Fetching all teams...');
  const teams = await paginatedList('teams');
  console.log(`   Found ${teams.length} total teams\n`);

  console.log('📝 Processing teams...');
  
  for (const team of teams) {
    // Skip if already has createdBy
    if (team.createdBy) {
      results.skipped++;
      continue;
    }

    try {
      // Find oldest owner membership
      const memberships = await databases.listDocuments(
        CONFIG.databaseId,
        'memberships',
        [
          Query.equal('teamId', team.$id),
          Query.equal('role', 'owner'),
          Query.orderAsc('joinedAt'),
          Query.limit(1)
        ]
      );

      if (memberships.documents.length > 0) {
        const ownerUserId = memberships.documents[0].userId;
        
        // Update team with createdBy
        await databases.updateDocument(
          CONFIG.databaseId,
          'teams',
          team.$id,
          { createdBy: ownerUserId }
        );
        
        results.updated++;
        console.log(`   ✅ Updated: ${team.teamName} (${team.$id}) - createdBy: ${ownerUserId}`);
      } else {
        console.warn(`   ⚠️  No owner found for team: ${team.teamName} (${team.$id})`);
        results.failed++;
        results.errors.push({ teamId: team.$id, error: 'No owner membership found' });
      }
    } catch (err: any) {
      console.error(`   ❌ Failed: ${team.teamName} (${team.$id}) - ${err.message}`);
      results.failed++;
      results.errors.push({ teamId: team.$id, error: err.message });
    }
  }

  console.log('\n=== MIGRATION COMPLETE ===\n');
  console.log(`✅ Updated: ${results.updated}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`❌ Failed: ${results.failed}`);
  
  if (results.failed > 0) {
    console.log('\n⚠️  Some teams failed. Review errors above.');
    console.log('Common issues:');
    console.log('  - No owner membership found (check memberships collection)');
    console.log('  - Database permissions issue');
    process.exit(1);
  }

  console.log('\n✅ All teams now have createdBy populated!\n');
  console.log('👉 Next step: Run verify-phase1.ts to confirm');
  console.log('   npx tsx scripts/verify-phase1.ts\n');

  return results;
}

migrateTeamCreators().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
