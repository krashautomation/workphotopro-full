/**
 * Katya Bot Account Cleanup
 * 
 * Cleans up Katya bot data and code references.
 * 
 * Usage: npx tsx scripts/cleanup-katya-bot.ts
 */

import 'dotenv/config';
import { Client, Databases, Query } from 'node-appwrite';

const CONFIG = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || '',
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '',
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '',
  apiKey: process.env.APPWRITE_API_KEY || '',
};

const KATYA_USER_ID = '692d284d000f7e24c7e4';

if (!CONFIG.endpoint || !CONFIG.projectId || !CONFIG.databaseId || !CONFIG.apiKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(CONFIG.endpoint)
  .setProject(CONFIG.projectId)
  .setKey(CONFIG.apiKey);

const databases = new Databases(client);

async function paginatedList(collectionId: string, queries: string[] = []): Promise<any[]> {
  const all: any[] = [];
  let offset = 0;
  let hasMore = true;
  
  while (hasMore) {
    const result = await databases.listDocuments(CONFIG.databaseId, collectionId, [
      ...queries,
      Query.limit(100),
      Query.offset(offset)
    ]);
    all.push(...result.documents);
    offset += result.documents.length;
    hasMore = result.documents.length === 100;
  }
  
  return all;
}

async function cleanupKatya() {
  console.log('\n🤖 Katya Bot Account Cleanup\n');
  console.log(`User ID: ${KATYA_USER_ID}\n`);
  
  // 1. Query current status
  console.log('📊 Step 1: Querying current status...\n');
  
  const memberships = await paginatedList('memberships', [Query.equal('userId', KATYA_USER_ID)]);
  const messages = await paginatedList('messages', [Query.equal('senderId', KATYA_USER_ID)]);
  const jobs = await paginatedList('jobchat', [Query.equal('createdBy', KATYA_USER_ID)]);
  
  console.log(`   👥 Memberships: ${memberships.length}`);
  console.log(`   💬 Messages: ${messages.length}`);
  console.log(`   📁 Jobs: ${jobs.length}\n`);
  
  // 2. Soft delete memberships
  if (memberships.length > 0) {
    console.log('🗑️  Step 2: Soft-deleting memberships...\n');
    
    for (const membership of memberships) {
      try {
        await databases.updateDocument(CONFIG.databaseId, 'memberships', membership.$id, {
          isActive: false
        });
        console.log(`   ✅ Deactivated membership: ${membership.$id} (team: ${membership.teamId})`);
      } catch (err: any) {
        console.error(`   ❌ Failed: ${membership.$id} - ${err.message}`);
      }
    }
    console.log('');
  }
  
  // 3. Report messages (don't delete)
  if (messages.length > 0) {
    console.log('💬 Step 3: Message count report\n');
    console.log(`   Katya sent ${messages.length} messages total.`);
    console.log('   ⚠️  Messages NOT deleted - decide separately on chat history purge\n');
  }
  
  // 4. Report jobs
  if (jobs.length > 0) {
    console.log('📁 Step 4: Job count report\n');
    console.log(`   Katya created ${jobs.length} jobs total.\n`);
  }
  
  console.log('✅ Database cleanup complete!\n');
  console.log('👉 Next: Remove Katya code files and references\n');
}

cleanupKatya().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
