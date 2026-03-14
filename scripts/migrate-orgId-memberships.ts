/**
 * Migration: Populate orgId field on memberships
 * 
 * This script finds the orgId from each membership's team
 * and sets membership.orgId.
 * 
 * Prerequisites:
 * - orgId field added to memberships collection (required: false)
 * 
 * Usage: npx tsx scripts/migrate-orgId-memberships.ts
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

async function migrateOrgIdMemberships() {
  console.log('\n🚀 Starting orgId migration for memberships...\n');

  const results = {
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [] as Array<{ membershipId: string; error: string }>
  };

  // Get all memberships
  console.log('📊 Fetching all memberships...');
  const memberships = await paginatedList('memberships');
  console.log(`   Found ${memberships.length} total memberships\n`);

  console.log('📝 Processing memberships...');
  
  for (const membership of memberships) {
    // Skip if already has orgId
    if (membership.orgId) {
      results.skipped++;
      continue;
    }

    try {
      // Get team to find orgId
      const team = await databases.getDocument(
        CONFIG.databaseId,
        'teams',
        membership.teamId
      );
      
      if (!team.orgId) {
        console.warn(`   ⚠️  Team ${membership.teamId} has no orgId! Skipping membership ${membership.$id}`);
        results.failed++;
        results.errors.push({ 
          membershipId: membership.$id, 
          error: `Team ${membership.teamId} has no orgId` 
        });
        continue;
      }

      // Update membership with orgId
      await databases.updateDocument(
        CONFIG.databaseId,
        'memberships',
        membership.$id,
        { orgId: team.orgId }
      );
      
      results.updated++;
      
      // Progress update every 50 records
      if (results.updated % 50 === 0) {
        console.log(`   Progress: ${results.updated} updated, ${results.skipped} skipped, ${results.failed} failed`);
      }
    } catch (err: any) {
      console.error(`   ❌ Failed for membership ${membership.$id}:`, err.message);
      results.failed++;
      results.errors.push({ membershipId: membership.$id, error: err.message });
    }
  }

  console.log('\n=== MIGRATION COMPLETE ===\n');
  console.log(`✅ Updated: ${results.updated}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`❌ Failed: ${results.failed}`);
  
  if (results.failed > 0) {
    console.log(`\n⚠️  ${results.failed} memberships failed. Review errors above before continuing.`);
    console.log('Common issues:');
    console.log('  - Team not found (orphaned membership)');
    console.log('  - Team has no orgId (run team migration first)');
    console.log('  - Database permissions issue');
    process.exit(1);
  }

  console.log('\n✅ All memberships now have orgId populated!\n');
  console.log('👉 Next steps:');
  console.log('  1. Set orgId to required: true in Appwrite Console');
  console.log('  2. Run verify-phase1.ts to confirm');
  console.log('   npx tsx scripts/verify-phase1.ts\n');

  return results;
}

migrateOrgIdMemberships().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
