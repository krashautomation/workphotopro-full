/**
 * Debug: Check team memberships
 * 
 * Check what memberships exist for teams and their roles
 */

import 'dotenv/config';
import { Client, Databases, Query } from 'node-appwrite';

const CONFIG = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || '',
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '',
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '',
  apiKey: process.env.APPWRITE_API_KEY || '',
};

const client = new Client()
  .setEndpoint(CONFIG.endpoint)
  .setProject(CONFIG.projectId)
  .setKey(CONFIG.apiKey);

const databases = new Databases(client);

async function debugTeams() {
  console.log('\n🔍 Debugging Team Memberships\n');
  
  const teams = await databases.listDocuments(CONFIG.databaseId, 'teams', [Query.limit(100)]);
  
  for (const team of teams.documents) {
    console.log(`\n📊 Team: ${team.teamName} (${team.$id})`);
    console.log(`   createdBy: ${team.createdBy || 'NOT SET'}`);
    
    const memberships = await databases.listDocuments(
      CONFIG.databaseId,
      'memberships',
      [Query.equal('teamId', team.$id), Query.limit(100)]
    );
    
    // Also check for soft-deleted memberships
    const allMemberships = await databases.listDocuments(
      CONFIG.databaseId,
      'memberships',
      [Query.limit(100)]
    );
    
    console.log(`   All memberships in DB: ${allMemberships.documents.length}`);
    
    console.log(`   Total memberships: ${memberships.documents.length}`);
    
    for (const m of memberships.documents) {
      console.log(`      • User: ${m.userId}, Role: ${m.role || 'NO ROLE'}, Active: ${m.isActive}`);
    }
  }
}

debugTeams().catch(console.error);
