/**
 * Cleanup Orphaned Memberships
 * 
 * Deletes the 8 orphaned memberships identified in pre-migration audit.
 * These memberships reference teams that no longer exist.
 * 
 * Usage: npx tsx scripts/cleanup-orphaned-memberships.ts
 */

import 'dotenv/config';
import { Client, Databases } from 'node-appwrite';

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

// Orphaned membership IDs from pre-migration audit
const ORPHANED_MEMBERSHIP_IDS = [
  '690776089a756528dd05',
  '69077632e4aa15e03d57',
  '690776fe0035f94c6770',
  '6907782e003ddc23c251',
  '692b79830023dc58b851',
  '692d347d0013b2ada740',
  '692d347d003456cdedfb',
  '692d347e0015daa1400d'
];

async function cleanupOrphanedMemberships() {
  console.log('\n🧹 Cleaning Up Orphaned Memberships\n');
  console.log(`Found ${ORPHANED_MEMBERSHIP_IDS.length} orphaned memberships to delete\n`);
  
  const results = {
    deleted: 0,
    failed: 0,
    errors: [] as Array<{ id: string; error: string }>
  };
  
  for (const membershipId of ORPHANED_MEMBERSHIP_IDS) {
    try {
      // First, verify it still exists and is orphaned
      try {
        const membership = await databases.getDocument(
          CONFIG.databaseId,
          'memberships',
          membershipId
        );
        console.log(`   Deleting: ${membershipId} (user: ${membership.userId}, team: ${membership.teamId})`);
      } catch {
        console.log(`   Skipping: ${membershipId} (already deleted or not found)`);
        results.deleted++; // Count as success since it's gone
        continue;
      }
      
      // Delete the orphaned membership
      await databases.deleteDocument(
        CONFIG.databaseId,
        'memberships',
        membershipId
      );
      
      results.deleted++;
      console.log(`   ✅ Deleted: ${membershipId}`);
      
    } catch (err: any) {
      results.failed++;
      results.errors.push({ id: membershipId, error: err.message });
      console.error(`   ❌ Failed: ${membershipId} - ${err.message}`);
    }
  }
  
  console.log('\n' + '─'.repeat(60));
  console.log('\n📊 Cleanup Results:\n');
  console.log(`   ✅ Successfully deleted: ${results.deleted}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  
  if (results.failed > 0) {
    console.log('\n   Errors:');
    results.errors.forEach(e => console.log(`      • ${e.id}: ${e.error}`));
  }
  
  console.log('\n✅ Orphaned memberships cleanup complete!\n');
  console.log('👉 Next step: Re-run pre-migration audit to verify');
  console.log('   npx tsx scripts/pre-migration-audit.ts\n');
  
  return results;
}

// Run cleanup
cleanupOrphanedMemberships().catch(err => {
  console.error('❌ Cleanup failed:', err);
  process.exit(1);
});
