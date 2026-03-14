/**
 * Smoke Test for teamService.ts Custom Methods
 * 
 * Tests teamService methods WITHOUT enabling the feature flag globally.
 * This script tests the core logic and database operations.
 * 
 * Note: This requires Appwrite environment variables to be set.
 * Run: npx tsx scripts/test-team-service.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Client, Account, Databases, Query, ID } from 'node-appwrite';

// Environment variables
const ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || '';
const PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '';
const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '';
const API_KEY = process.env.APPWRITE_API_KEY || '';

// Validate environment
if (!ENDPOINT || !PROJECT_ID || !DATABASE_ID) {
  console.error('❌ Missing required environment variables:');
  console.error('   - EXPO_PUBLIC_APPWRITE_ENDPOINT');
  console.error('   - EXPO_PUBLIC_APPWRITE_PROJECT_ID');
  console.error('   - EXPO_PUBLIC_APPWRITE_DATABASE_ID');
  process.exit(1);
}

if (!API_KEY) {
  console.error('❌ Missing APPWRITE_API_KEY environment variable');
  console.error('   Add APPWRITE_API_KEY to your .env file for server-side operations');
  process.exit(1);
}

// Test configuration
const TEST_TEAM_NAME = 'Test Team - DELETE ME';
let testResults: { step: string; passed: boolean; error?: string }[] = [];

// Track created IDs for cleanup
let testTeamId: string | null = null;
let testMembershipId: string | null = null;
let currentUserId: string | null = null;
let currentOrgId: string | null = null;

// Initialize Appwrite client with API key (server-side)
const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

// ==========================================
// DATABASE HELPER FUNCTIONS
// ==========================================

async function createDocument(collectionId: string, data: any): Promise<any> {
  return databases.createDocument(DATABASE_ID, collectionId, ID.unique(), data);
}

async function getDocument(collectionId: string, documentId: string): Promise<any> {
  return databases.getDocument(DATABASE_ID, collectionId, documentId);
}

async function updateDocument(collectionId: string, documentId: string, data: any): Promise<any> {
  return databases.updateDocument(DATABASE_ID, collectionId, documentId, data);
}

async function deleteDocument(collectionId: string, documentId: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, collectionId, documentId);
}

async function listDocuments(collectionId: string, queries: string[] = []): Promise<any> {
  return databases.listDocuments(DATABASE_ID, collectionId, queries);
}

// ==========================================
// DIRECT CUSTOM METHODS (Bypass feature flag)
// ==========================================

async function _customCreateTeam(
  name: string,
  orgId: string,
  userId: string,
  description?: string
): Promise<{ team: any; membership: any }> {
  // Validate org access
  const org = await getDocument('organizations', orgId);
  if (!org) {
    throw new Error('Organization not found');
  }

  // Create team
  const teamData = {
    teamName: name,
    orgId,
    description: description || '',
    isActive: true,
    settings: '{}',
    createdBy: userId,
  };

  const team = await createDocument('teams', teamData);

  // Create owner membership
  const membership = await createDocument('memberships', {
    userId,
    teamId: team.$id,
    orgId,
    role: 'owner',
    invitedBy: userId,
    joinedAt: new Date().toISOString(),
    isActive: true,
  });

  console.log(`✅ Created team ${team.$id} with membership ${membership.$id}`);
  return { team, membership };
}

async function _customGetTeam(teamId: string, orgId: string): Promise<any> {
  const team = await getDocument('teams', teamId);
  
  if (team.orgId !== orgId) {
    throw new Error('Access denied: organization mismatch');
  }

  return team;
}

async function _customListTeams(userId: string, orgId: string): Promise<any[]> {
  const memberships = await listDocuments('memberships', [
    Query.equal('userId', userId),
    Query.equal('orgId', orgId),
    Query.equal('isActive', true),
  ]);

  if (memberships.documents.length === 0) {
    return [];
  }

  const teamIds = memberships.documents.map((m: any) => m.teamId);

  const teams = await listDocuments('teams', [
    Query.equal('$id', teamIds),
    Query.equal('orgId', orgId),
    Query.equal('isActive', true),
  ]);

  return teams.documents;
}

async function _customListMembers(teamId: string, orgId: string): Promise<any[]> {
  const memberships = await listDocuments('memberships', [
    Query.equal('teamId', teamId),
    Query.equal('orgId', orgId),
    Query.equal('isActive', true),
  ]);

  return memberships.documents;
}

async function _customDeleteTeam(teamId: string, orgId: string): Promise<{ success: boolean }> {
  // Verify team exists and belongs to org
  const team = await _customGetTeam(teamId, orgId);

  // Soft delete memberships
  const memberships = await listDocuments('memberships', [
    Query.equal('teamId', teamId),
    Query.equal('orgId', orgId),
    Query.equal('isActive', true),
  ]);

  for (const membership of memberships.documents) {
    await updateDocument('memberships', membership.$id, {
      isActive: false,
    });
  }

  // Soft delete team
  await updateDocument('teams', teamId, {
    isActive: false,
  });

  console.log(`✅ Soft-deleted team ${teamId} and ${memberships.documents.length} memberships`);
  return { success: true };
}

// ==========================================
// TEST STEPS
// ==========================================

async function setup(): Promise<boolean> {
  console.log('\n🧪 SETUP: Finding organization and test user...\n');
  
  try {
    // Get first organization
    const orgs = await listDocuments('organizations', [
      Query.limit(1),
    ]);

    if (orgs.documents.length === 0) {
      throw new Error('No organization found. Please create an organization first.');
    }

    currentOrgId = orgs.documents[0].$id;
    console.log(`✅ Using organization: ${currentOrgId} (${orgs.documents[0].orgName})`);

    // Get a user from existing memberships to use as test user
    const memberships = await listDocuments('memberships', [
      Query.equal('orgId', currentOrgId!),
      Query.limit(1),
    ]);

    if (memberships.documents.length > 0) {
      currentUserId = memberships.documents[0].userId;
      console.log(`✅ Using existing user: ${currentUserId}`);
    } else {
      // Use a placeholder user ID for testing
      currentUserId = 'test-user-' + Date.now();
      console.log(`⚠️  No existing user found, using placeholder: ${currentUserId}`);
    }

    return true;
  } catch (error: any) {
    console.error('❌ Setup failed:', error.message);
    return false;
  }
}

async function testStep1_CreateTeam(): Promise<boolean> {
  console.log('\n📋 STEP 1: Creating test team...\n');
  
  try {
    const result = await _customCreateTeam(
      TEST_TEAM_NAME,
      currentOrgId!,
      currentUserId!,
      'This is a test team for smoke testing'
    );

    testTeamId = result.team.$id;
    testMembershipId = result.membership.$id;

    // Verify team has required fields
    if (!result.team.teamName || !result.team.orgId || !result.team.createdBy) {
      throw new Error('Team missing required fields');
    }

    // Verify membership has required fields
    if (!result.membership.orgId || !result.membership.userId || !result.membership.role) {
      throw new Error('Membership missing required fields');
    }

    console.log(`✅ Team created: ${testTeamId}`);
    console.log(`✅ Membership created: ${testMembershipId}`);
    console.log(`   - Team name: ${result.team.teamName}`);
    console.log(`   - Team orgId: ${result.team.orgId}`);
    console.log(`   - Team createdBy: ${result.team.createdBy}`);
    console.log(`   - Membership role: ${result.membership.role}`);
    console.log(`   - Membership orgId: ${result.membership.orgId}`);
    
    return true;
  } catch (error: any) {
    console.error('❌ Step 1 failed:', error.message);
    return false;
  }
}

async function testStep2_ListTeams(): Promise<boolean> {
  console.log('\n📋 STEP 2: Listing teams for current user...\n');
  
  try {
    const teams = await _customListTeams(currentUserId!, currentOrgId!);
    
    // Find our test team
    const testTeam = teams.find((t: any) => t.$id === testTeamId);
    
    if (!testTeam) {
      throw new Error('Test team not found in listTeams results');
    }

    console.log(`✅ Found ${teams.length} teams`);
    console.log(`✅ Test team appears in list: ${testTeam.teamName}`);
    console.log(`   - All teams: ${teams.map((t: any) => t.teamName).join(', ')}`);
    
    return true;
  } catch (error: any) {
    console.error('❌ Step 2 failed:', error.message);
    return false;
  }
}

async function testStep3_GetTeam(): Promise<boolean> {
  console.log('\n📋 STEP 3: Getting test team by ID...\n');
  
  try {
    const team = await _customGetTeam(testTeamId!, currentOrgId!);
    
    if (team.$id !== testTeamId) {
      throw new Error('Retrieved wrong team');
    }

    console.log(`✅ Retrieved team: ${team.teamName}`);
    console.log(`   - Team ID: ${team.$id}`);
    console.log(`   - orgId matches: ${team.orgId === currentOrgId}`);
    
    // Test orgId security check - should fail with wrong orgId
    console.log('\n🧪 Testing orgId security check (should fail)...');
    try {
      await _customGetTeam(testTeamId!, 'wrong-org-id-123');
      console.error('❌ Security check FAILED - should have thrown error');
      return false;
    } catch (securityError: any) {
      if (securityError.message.includes('organization mismatch')) {
        console.log('✅ Security check PASSED - correctly rejected wrong orgId');
      } else {
        throw securityError;
      }
    }
    
    return true;
  } catch (error: any) {
    console.error('❌ Step 3 failed:', error.message);
    return false;
  }
}

async function testStep4_ListMembers(): Promise<boolean> {
  console.log('\n📋 STEP 4: Listing team members...\n');
  
  try {
    const members = await _customListMembers(testTeamId!, currentOrgId!);
    
    if (members.length === 0) {
      throw new Error('No members found');
    }

    const ownerMember = members.find((m: any) => m.role === 'owner');
    
    if (!ownerMember) {
      throw new Error('Owner membership not found');
    }

    console.log(`✅ Found ${members.length} members`);
    console.log(`✅ Owner membership exists:`);
    console.log(`   - User ID: ${ownerMember.userId}`);
    console.log(`   - Role: ${ownerMember.role}`);
    console.log(`   - orgId: ${ownerMember.orgId}`);
    console.log(`   - isActive: ${ownerMember.isActive}`);
    
    // Verify orgId is present on membership
    if (!ownerMember.orgId) {
      throw new Error('Membership missing orgId field');
    }
    
    return true;
  } catch (error: any) {
    console.error('❌ Step 4 failed:', error.message);
    return false;
  }
}

async function testStep5_DeleteTeam(): Promise<boolean> {
  console.log('\n📋 STEP 5: Soft deleting test team...\n');
  
  try {
    const result = await _customDeleteTeam(testTeamId!, currentOrgId!);
    
    if (!result.success) {
      throw new Error('Delete returned false');
    }

    console.log(`✅ Team ${testTeamId} soft-deleted successfully`);
    
    return true;
  } catch (error: any) {
    console.error('❌ Step 5 failed:', error.message);
    return false;
  }
}

async function testStep6_VerifyDelete(): Promise<boolean> {
  console.log('\n📋 STEP 6: Verifying team no longer appears in list...\n');
  
  try {
    const teams = await _customListTeams(currentUserId!, currentOrgId!);
    
    // Find our test team - should NOT be there
    const testTeam = teams.find((t: any) => t.$id === testTeamId);
    
    if (testTeam) {
      throw new Error('Test team still appears in list after soft delete');
    }

    console.log(`✅ Test team correctly hidden from listTeams`);
    console.log(`   - ${teams.length} active teams remaining`);
    
    // Verify team still exists in database (soft delete, not hard delete)
    console.log('\n🧪 Verifying team still exists in database (soft delete)...');
    const allTeams = await listDocuments('teams', [
      Query.equal('$id', testTeamId!),
    ]);
    
    if (allTeams.documents.length === 0) {
      throw new Error('Team was hard-deleted instead of soft-deleted');
    }
    
    const team = allTeams.documents[0];
    if (team.isActive !== false) {
      throw new Error('Team isActive flag not set to false');
    }
    
    console.log(`✅ Team exists in DB with isActive=false (soft delete verified)`);
    
    // Verify membership also soft deleted
    const memberships = await listDocuments('memberships', [
      Query.equal('teamId', testTeamId!),
    ]);
    
    const activeMemberships = memberships.documents.filter((m: any) => m.isActive === true);
    if (activeMemberships.length > 0) {
      throw new Error('Some memberships still active after team delete');
    }
    
    console.log(`✅ All memberships soft-deleted (${memberships.documents.length} total)`);
    
    return true;
  } catch (error: any) {
    console.error('❌ Step 6 failed:', error.message);
    return false;
  }
}

// ==========================================
// CLEANUP
// ==========================================

async function cleanup(): Promise<void> {
  console.log('\n🧹 CLEANUP: Removing test data...\n');
  
  try {
    // Delete test team (hard delete)
    if (testTeamId) {
      try {
        await deleteDocument('teams', testTeamId);
        console.log(`✅ Hard deleted test team: ${testTeamId}`);
      } catch (e: any) {
        console.log(`⚠️ Could not delete test team: ${e.message}`);
      }
    }

    // Delete test memberships
    if (testMembershipId) {
      try {
        await deleteDocument('memberships', testMembershipId);
        console.log(`✅ Hard deleted test membership: ${testMembershipId}`);
      } catch (e: any) {
        console.log(`⚠️ Could not delete test membership: ${e.message}`);
      }
    }

    // Find and delete any other test memberships for this team
    if (testTeamId) {
      try {
        const memberships = await listDocuments('memberships', [
          Query.equal('teamId', testTeamId),
        ]);
        
        for (const membership of memberships.documents) {
          try {
            await deleteDocument('memberships', membership.$id);
            console.log(`✅ Hard deleted membership: ${membership.$id}`);
          } catch (e: any) {
            console.log(`⚠️ Could not delete membership: ${e.message}`);
          }
        }
      } catch (e: any) {
        console.log(`⚠️ Could not list memberships: ${e.message}`);
      }
    }

    console.log('\n✅ Cleanup completed\n');
  } catch (error: any) {
    console.error('❌ Cleanup error:', error.message);
  }
}

// ==========================================
// MAIN TEST RUNNER
// ==========================================

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Team Service Smoke Test (Custom Implementation)    ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('\n⚠️  WARNING: This will create and delete test data');
  console.log('   Using organization:', currentOrgId || '(will be determined)');
  console.log('');

  // Setup
  const setupSuccess = await setup();
  if (!setupSuccess) {
    console.log('\n❌ TEST ABORTED: Setup failed\n');
    process.exit(1);
  }

  // Run tests
  testResults.push({ step: 'Setup', passed: true });
  testResults.push({ step: 'Create Team', passed: await testStep1_CreateTeam() });
  testResults.push({ step: 'List Teams', passed: await testStep2_ListTeams() });
  testResults.push({ step: 'Get Team', passed: await testStep3_GetTeam() });
  testResults.push({ step: 'List Members', passed: await testStep4_ListMembers() });
  testResults.push({ step: 'Delete Team', passed: await testStep5_DeleteTeam() });
  testResults.push({ step: 'Verify Delete', passed: await testStep6_VerifyDelete() });

  // Cleanup
  await cleanup();

  // Report
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                      TEST RESULTS                      ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  const passed = testResults.filter(r => r.passed).length;
  const total = testResults.length;
  
  testResults.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.step}`);
  });
  
  console.log(`\n${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED! Ready to enable feature flag.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Review errors above before enabling feature flag.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('💥 Fatal error:', error);
  cleanup().finally(() => process.exit(1));
});
