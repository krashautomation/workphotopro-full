/**
 * Cleanup Orphaned DB Team
 * 
 * Deletes the "donee Team" database record since the Appwrite team
 * was already deleted manually. This removes the orphaned DB reference.
 * 
 * Usage: npx tsx scripts/cleanup-orphaned-team.ts
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

// Orphaned team from audit
const ORPHANED_TEAM_ID = '692b7983001b9c473f5a';

async function cleanupOrphanedTeam() {
  console.log('\n🧹 Cleaning Up Orphaned DB Team Record\n');
  
  try {
    // Get team details before deletion
    console.log(`   Fetching team ${ORPHANED_TEAM_ID}...`);
    const team = await databases.getDocument(
      CONFIG.databaseId,
      'teams',
      ORPHANED_TEAM_ID
    );
    
    console.log(`   Team: ${team.teamName} (${team.$id})`);
    console.log(`   Appwrite Team ID: ${team.appwriteTeamId}`);
    console.log(`   Org ID: ${team.orgId}`);
    
    // Delete the orphaned team record
    console.log(`\n   Deleting orphaned team record...`);
    await databases.deleteDocument(
      CONFIG.databaseId,
      'teams',
      ORPHANED_TEAM_ID
    );
    
    console.log('   ✅ Deleted successfully\n');
    
  } catch (err: any) {
    if (err.code === 404) {
      console.log('   ℹ️  Team already deleted or not found\n');
    } else {
      console.error('   ❌ Error:', err.message);
      process.exit(1);
    }
  }
  
  console.log('👉 Next step: Re-run pre-migration audit to verify');
  console.log('   npx tsx scripts/pre-migration-audit.ts\n');
}

// Run cleanup
cleanupOrphanedTeam().catch(err => {
  console.error('❌ Cleanup failed:', err);
  process.exit(1);
});
