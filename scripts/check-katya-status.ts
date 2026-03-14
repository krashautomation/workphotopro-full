/**
 * Check Katya (Droid) Account Status
 * 
 * Analyzes the AI assistant account's current data footprint
 * before cleanup.
 * 
 * Usage: npx tsx scripts/check-katya-status.ts
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

const KATYA_USER_ID = '692d284d000f7e24c7e4';

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

// Paginated list helper
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

async function checkKatyaStatus() {
  console.log('\n🤖 Checking Katya (Droid) Account Status\n');
  console.log(`User ID: ${KATYA_USER_ID}\n`);
  console.log('─'.repeat(70));

  // 1. Check memberships
  console.log('\n📊 1. Active Memberships\n');
  const memberships = await paginatedList('memberships', [
    Query.equal('userId', KATYA_USER_ID)
  ]);

  console.log(`   Total memberships: ${memberships.length}`);
  
  if (memberships.length > 0) {
    console.log('\n   Team memberships:');
    for (const m of memberships.slice(0, 5)) {
      try {
        const team = await databases.getDocument(CONFIG.databaseId, 'teams', m.teamId);
        console.log(`      • ${team.teamName} (${m.teamId}) - Role: ${m.role} - Active: ${m.isActive}`);
      } catch {
        console.log(`      • [Deleted Team] (${m.teamId}) - Role: ${m.role} - Active: ${m.isActive}`);
      }
    }
    if (memberships.length > 5) {
      console.log(`      ... and ${memberships.length - 5} more`);
    }
  }

  // 2. Check messages
  console.log('\n📊 2. Messages Sent\n');
  const messages = await paginatedList('messages', [
    Query.equal('senderId', KATYA_USER_ID)
  ]);

  console.log(`   Total messages: ${messages.length}`);
  
  if (messages.length > 0) {
    console.log('\n   Sample messages:');
    for (const msg of messages.slice(0, 3)) {
      const preview = msg.content?.substring(0, 50) || '[No content]';
      const date = new Date(msg.$createdAt).toLocaleDateString();
      console.log(`      • [${date}] ${preview}${msg.content?.length > 50 ? '...' : ''}`);
      console.log(`        Job: ${msg.jobId}`);
    }
    if (messages.length > 3) {
      console.log(`      ... and ${messages.length - 3} more messages`);
    }
  }

  // 3. Check jobs created
  console.log('\n📊 3. Jobs Created\n');
  const jobs = await paginatedList('jobchat', [
    Query.equal('createdBy', KATYA_USER_ID)
  ]);

  console.log(`   Total jobs created: ${jobs.length}`);
  
  if (jobs.length > 0) {
    console.log('\n   Sample jobs:');
    for (const job of jobs.slice(0, 3)) {
      const date = new Date(job.$createdAt).toLocaleDateString();
      console.log(`      • [${date}] ${job.title}`);
      console.log(`        ID: ${job.$id}`);
    }
    if (jobs.length > 3) {
      console.log(`      ... and ${jobs.length - 3} more jobs`);
    }
  }

  // Summary
  console.log('\n' + '─'.repeat(70));
  console.log('\n📋 Summary:\n');
  console.log(`   👥 Memberships: ${memberships.length}`);
  console.log(`   💬 Messages: ${messages.length}`);
  console.log(`   📁 Jobs: ${jobs.length}`);
  
  const hasData = memberships.length > 0 || messages.length > 0 || jobs.length > 0;
  
  if (hasData) {
    console.log('\n⚠️  Katya has data that will need cleanup before account deletion');
  } else {
    console.log('\n✅ Katya has no data - safe to delete account');
  }
  
  console.log('');
  
  return {
    userId: KATYA_USER_ID,
    memberships: memberships.length,
    messages: messages.length,
    jobs: jobs.length,
    hasData
  };
}

// Run check
checkKatyaStatus().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
