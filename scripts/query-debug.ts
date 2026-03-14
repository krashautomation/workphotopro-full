/**
 * Query database for team debugging
 */

require('dotenv').config();
const { Client, Databases, Query } = require('node-appwrite');

// Appwrite config
const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;

async function queryDatabase() {
  try {
    console.log('🔍 Querying database...\n');
    console.log('Database ID:', DATABASE_ID);
    console.log('====================================\n');

    // 1. All teams
    console.log('📋 1. ALL TEAMS:');
    console.log('-------------------');
    const teams = await databases.listDocuments(DATABASE_ID, 'teams', [Query.limit(100)]);
    
    teams.documents.forEach((team: any) => {
      console.log({
        $id: team.$id,
        teamName: team.teamName,
        orgId: team.orgId,
        isActive: team.isActive,
        createdBy: team.createdBy
      });
    });
    console.log(`Total: ${teams.documents.length} teams\n`);

    // 2. Memberships for user 68f0dc7f002427e257f5
    console.log('👤 2. MEMBERSHIPS FOR USER 68f0dc7f002427e257f5 (Don Hest):');
    console.log('-----------------------------------------------------------');
    const memberships = await databases.listDocuments(DATABASE_ID, 'memberships', [
      Query.equal('userId', '68f0dc7f002427e257f5'),
      Query.limit(100)
    ]);
    
    memberships.documents.forEach((m: any) => {
      console.log({
        $id: m.$id,
        teamId: m.teamId,
        orgId: m.orgId,
        role: m.role,
        isActive: m.isActive,
        userEmail: m.userEmail || 'N/A'
      });
    });
    console.log(`Total: ${memberships.documents.length} memberships\n`);

    // 3. All organizations
    console.log('🏢 3. ALL ORGANIZATIONS:');
    console.log('------------------------');
    const orgs = await databases.listDocuments(DATABASE_ID, 'organizations', [Query.limit(100)]);
    
    orgs.documents.forEach((org: any) => {
      console.log({
        $id: org.$id,
        orgName: org.orgName,
        ownerId: org.ownerId
      });
    });
    console.log(`Total: ${orgs.documents.length} organizations\n`);

  } catch (error) {
    console.error('Error querying database:', error);
  }
}

queryDatabase();
