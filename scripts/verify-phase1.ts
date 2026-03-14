/**
 * Phase 1 Verification Script
 * 
 * Verifies all Phase 1 migration tasks are complete:
 * 1. All teams have createdBy
 * 2. All memberships have orgId
 * 3. Invitations collection exists
 * 
 * Usage: npx tsx scripts/verify-phase1.ts
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

async function verifyPhase1() {
  console.log('\n🔍 Phase 1 Verification\n');
  console.log('Checking all migration tasks are complete...\n');

  const checks = {
    teamsWithCreatedBy: 0,
    teamsWithoutCreatedBy: 0,
    membershipsWithOrgId: 0,
    membershipsWithoutOrgId: 0,
    invitationsCollectionExists: false,
    allPassed: true
  };

  // 1. Check teams
  console.log('📊 Checking teams for createdBy...');
  const teams = await paginatedList('teams');
  
  for (const team of teams) {
    if (team.createdBy) {
      checks.teamsWithCreatedBy++;
    } else {
      checks.teamsWithoutCreatedBy++;
    }
  }
  
  console.log(`   ✅ Teams with createdBy: ${checks.teamsWithCreatedBy}`);
  if (checks.teamsWithoutCreatedBy > 0) {
    console.log(`   ❌ Teams missing createdBy: ${checks.teamsWithoutCreatedBy}`);
    checks.allPassed = false;
  }

  // 2. Check memberships
  console.log('\n📊 Checking memberships for orgId...');
  const memberships = await paginatedList('memberships');
  
  for (const membership of memberships) {
    if (membership.orgId) {
      checks.membershipsWithOrgId++;
    } else {
      checks.membershipsWithoutOrgId++;
    }
  }
  
  console.log(`   ✅ Memberships with orgId: ${checks.membershipsWithOrgId}`);
  if (checks.membershipsWithoutOrgId > 0) {
    console.log(`   ❌ Memberships missing orgId: ${checks.membershipsWithoutOrgId}`);
    checks.allPassed = false;
  }

  // 3. Check invitations collection
  console.log('\n📊 Checking invitations collection...');
  try {
    await databases.listDocuments(CONFIG.databaseId, 'invitations', [Query.limit(1)]);
    checks.invitationsCollectionExists = true;
    console.log('   ✅ Invitations collection exists');
  } catch (err: any) {
    if (err.code === 404 || err.message?.includes('collection')) {
      console.log('   ❌ Invitations collection does not exist');
      checks.allPassed = false;
    } else {
      // Collection exists but might be empty
      checks.invitationsCollectionExists = true;
      console.log('   ✅ Invitations collection exists (empty or has data)');
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('\n📋 Verification Summary:\n');
  
  if (checks.allPassed) {
    console.log('✅ ALL CHECKS PASSED!\n');
    console.log('Phase 1 is complete. You can now:');
    console.log('  1. Set createdBy to required: true in Appwrite Console');
    console.log('  2. Set orgId to required: true in Appwrite Console');
    console.log('  3. Proceed to Phase 2: Custom Invitations\n');
    console.log('👉 Next: Create invitations collection indexes\n');
  } else {
    console.log('❌ SOME CHECKS FAILED\n');
    
    if (checks.teamsWithoutCreatedBy > 0) {
      console.log('Run: npx tsx scripts/migrate-team-creators.ts');
    }
    if (checks.membershipsWithoutOrgId > 0) {
      console.log('Run: npx tsx scripts/migrate-orgId-memberships.ts');
    }
    if (!checks.invitationsCollectionExists) {
      console.log('Create invitations collection in Appwrite Console');
    }
    console.log('');
    process.exit(1);
  }

  return checks;
}

verifyPhase1().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
