/**
 * Check User Details
 * 
 * Query Appwrite Users API for email and activity info
 * for users with orphaned memberships.
 * 
 * Usage: npx tsx scripts/check-user-details.ts
 */

import 'dotenv/config';
import { Client, Users } from 'node-appwrite';

// Configuration
const CONFIG = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || '',
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '',
  apiKey: process.env.APPWRITE_API_KEY || '',
};

// Validate config
if (!CONFIG.endpoint || !CONFIG.projectId || !CONFIG.apiKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(CONFIG.endpoint)
  .setProject(CONFIG.projectId)
  .setKey(CONFIG.apiKey);

const users = new Users(client);

// UserIds to check
const USER_IDS = [
  '68f0dc7f002427e257f5',
  '68f43803a43077657a06',
  '692d284d000f7e24c7e4'
];

async function getUserDetails(userId: string) {
  try {
    const user = await users.get(userId);
    return {
      userId: user.$id,
      email: user.email,
      createdAt: user.$createdAt,
      lastLoginAt: user.accessedAt || 'Never'
    };
  } catch (err: any) {
    return {
      userId,
      email: 'ERROR: ' + err.message,
      createdAt: 'N/A',
      lastLoginAt: 'N/A'
    };
  }
}

async function main() {
  console.log('\n👤 User Details from Appwrite\n');
  console.log('─'.repeat(80));
  console.log('userId                           | email                    | createdAt           | lastLoginAt');
  console.log('─'.repeat(80));
  
  for (const userId of USER_IDS) {
    const details = await getUserDetails(userId);
    console.log(
      `${details.userId} | ${details.email.padEnd(24)} | ${details.createdAt.padEnd(19)} | ${details.lastLoginAt}`
    );
  }
  
  console.log('─'.repeat(80));
  console.log('');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
