/**
 * Test Katya Status Script
 * 
 * This script performs comprehensive checks on Katya's setup and provides
 * verbose output for debugging and verification.
 * 
 * Usage:
 *   node Droid/scripts/test-katya-status.js
 * 
 * Requirements:
 *   - .env file with Appwrite credentials
 *   - node-appwrite package installed
 */

require('dotenv').config();
const { Client, Databases, Users, Query } = require('node-appwrite');

// Configuration from environment variables
const APPWRITE_ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
const APPWRITE_DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_DROID_API_KEY || process.env.APPWRITE_API_KEY;

// Katya user details
const KATYA_EMAIL = 'katya@workphotopro.ai';
const KATYA_USER_ID = process.env.EXPO_PUBLIC_KATYA_USER_ID || process.env.KATYA_USER_ID || '692d284d000f7e24c7e4';

/**
 * Print a section header
 */
function printSection(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`🤖 ${title}`);
  console.log('='.repeat(60));
}

/**
 * Print a check result
 */
function printCheck(name, status, details = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  const statusText = status === 'pass' ? 'PASS' : status === 'fail' ? 'FAIL' : 'WARN';
  console.log(`${icon} ${name}: ${statusText}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

/**
 * Find Katya's user ID by email
 */
async function findKatyaUserId(users) {
  try {
    console.log('   🔍 Searching for Katya user by email...');
    const usersList = await users.list();
    const katyaUser = usersList.users.find(user => user.email === KATYA_EMAIL);
    
    if (katyaUser) {
      console.log(`   ✅ Found Katya user: ${katyaUser.$id}`);
      return katyaUser.$id;
    } else {
      console.log('   ⚠️  Katya user not found by email');
      return null;
    }
  } catch (error) {
    console.log(`   ❌ Error searching for user: ${error.message}`);
    return null;
  }
}

/**
 * Main test function
 */
async function testKatyaStatus() {
  const results = {
    environment: { pass: 0, fail: 0, warn: 0 },
    user: { pass: 0, fail: 0, warn: 0 },
    profilePicture: { pass: 0, fail: 0, warn: 0 },
    memberships: { pass: 0, fail: 0, warn: 0 },
    messages: { pass: 0, fail: 0, warn: 0 },
    function: { pass: 0, fail: 0, warn: 0 }
  };

  try {
    printSection('ENVIRONMENT CHECK');
    
    // Check environment variables
    if (!APPWRITE_ENDPOINT) {
      printCheck('APPWRITE_ENDPOINT', 'fail', 'Missing from environment');
      results.environment.fail++;
    } else {
      printCheck('APPWRITE_ENDPOINT', 'pass', APPWRITE_ENDPOINT);
      results.environment.pass++;
    }
    
    if (!APPWRITE_PROJECT_ID) {
      printCheck('APPWRITE_PROJECT_ID', 'fail', 'Missing from environment');
      results.environment.fail++;
    } else {
      printCheck('APPWRITE_PROJECT_ID', 'pass', APPWRITE_PROJECT_ID);
      results.environment.pass++;
    }
    
    if (!APPWRITE_DATABASE_ID) {
      printCheck('APPWRITE_DATABASE_ID', 'warn', 'Missing - some checks will be skipped');
      results.environment.warn++;
    } else {
      printCheck('APPWRITE_DATABASE_ID', 'pass', APPWRITE_DATABASE_ID);
      results.environment.pass++;
    }
    
    if (!APPWRITE_API_KEY) {
      printCheck('APPWRITE_API_KEY', 'fail', 'Missing from environment');
      results.environment.fail++;
      console.log('\n❌ Cannot continue without API key. Exiting...');
      process.exit(1);
    } else {
      printCheck('APPWRITE_API_KEY', 'pass', `${APPWRITE_API_KEY.substring(0, 20)}...`);
      results.environment.pass++;
    }
    
    printCheck('KATYA_USER_ID', KATYA_USER_ID ? 'pass' : 'warn', 
      KATYA_USER_ID || 'Using default from code');
    if (KATYA_USER_ID) results.environment.pass++;
    else results.environment.warn++;

    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID)
      .setKey(APPWRITE_API_KEY);
    
    const users = new Users(client);
    const databases = APPWRITE_DATABASE_ID ? new Databases(client) : null;

    printSection('USER EXISTENCE CHECK');
    
    // Check if Katya user exists
    let katyaUserId = KATYA_USER_ID;
    let katyaUser = null;
    
    try {
      console.log(`   🔍 Checking user with ID: ${katyaUserId}`);
      katyaUser = await users.get(katyaUserId);
      
      if (katyaUser) {
        printCheck('User Exists', 'pass', `ID: ${katyaUser.$id}`);
        printCheck('User Email', 'pass', katyaUser.email || 'Not set');
        printCheck('User Name', 'pass', katyaUser.name || 'Not set');
        printCheck('User Created', 'pass', katyaUser.$createdAt || 'Unknown');
        results.user.pass += 4;
      }
    } catch (error) {
      if (error.code === 404) {
        printCheck('User Exists (by ID)', 'fail', `User ${katyaUserId} not found`);
        results.user.fail++;
        
        // Try to find by email
        console.log('\n   🔄 Trying to find user by email...');
        const foundUserId = await findKatyaUserId(users);
        if (foundUserId) {
          katyaUserId = foundUserId;
          katyaUser = await users.get(katyaUserId);
          printCheck('User Found (by email)', 'pass', `ID: ${katyaUserId}`);
          results.user.pass++;
        } else {
          printCheck('User Found (by email)', 'fail', 'Could not find Katya user');
          results.user.fail++;
        }
      } else {
        printCheck('User Check', 'fail', `Error: ${error.message}`);
        results.user.fail++;
      }
    }

    if (!katyaUser) {
      console.log('\n❌ Cannot continue without Katya user. Please run create-katya-user.js first.');
      process.exit(1);
    }

    printSection('PROFILE PICTURE CHECK');
    
    // Check profile picture
    if (katyaUser.prefs && katyaUser.prefs.profilePicture) {
      const profilePic = katyaUser.prefs.profilePicture;
      printCheck('Profile Picture in Preferences', 'pass', 'Found');
      printCheck('Profile Picture URL', 'pass', profilePic.substring(0, 80) + '...');
      results.profilePicture.pass += 2;
      
      // Check if URL is accessible (basic check)
      if (profilePic.startsWith('http')) {
        printCheck('Profile Picture URL Format', 'pass', 'Valid HTTP URL');
        results.profilePicture.pass++;
      } else {
        printCheck('Profile Picture URL Format', 'warn', 'Not a standard HTTP URL');
        results.profilePicture.warn++;
      }
    } else {
      printCheck('Profile Picture in Preferences', 'fail', 'Not set');
      printCheck('Action Required', 'warn', 'Run: node Droid/scripts/set-katya-profile-photo.js --url <IMAGE_URL>');
      results.profilePicture.fail++;
      results.profilePicture.warn++;
    }

    // Check membership data for profile picture
    if (databases) {
      try {
        const memberships = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          'memberships',
          [
            Query.equal('userId', katyaUserId),
            Query.limit(5)
          ]
        );
        
        if (memberships.documents && memberships.documents.length > 0) {
          const hasProfilePicInMembership = memberships.documents.some(
            m => m.profilePicture && m.profilePicture.trim()
          );
          
          if (hasProfilePicInMembership) {
            printCheck('Profile Picture in Membership Data', 'pass', 
              `Found in ${memberships.documents.filter(m => m.profilePicture).length} membership(s)`);
            results.profilePicture.pass++;
          } else {
            printCheck('Profile Picture in Membership Data', 'warn', 
              'Not synced to membership records');
            results.profilePicture.warn++;
          }
        }
      } catch (error) {
        printCheck('Profile Picture in Membership Data', 'warn', 
          `Could not check: ${error.message}`);
        results.profilePicture.warn++;
      }
    }

    printSection('TEAM MEMBERSHIPS CHECK');
    
    // Check team memberships
    if (databases) {
      try {
        const memberships = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          'memberships',
          [
            Query.equal('userId', katyaUserId)
          ]
        );
        
        const membershipCount = memberships.documents ? memberships.documents.length : 0;
        
        if (membershipCount > 0) {
          printCheck('Team Memberships (Database)', 'pass', `${membershipCount} membership(s) found`);
          results.memberships.pass++;
          
          // Show details
          console.log('\n   📋 Membership Details:');
          memberships.documents.slice(0, 5).forEach((m, i) => {
            console.log(`   ${i + 1}. Team ID: ${m.teamId || 'N/A'}`);
            console.log(`      Role: ${m.role || 'N/A'}`);
            console.log(`      Active: ${m.isActive !== false ? 'Yes' : 'No'}`);
            console.log(`      Joined: ${m.joinedAt || m.$createdAt || 'Unknown'}`);
            console.log('');
          });
          
          if (membershipCount > 5) {
            console.log(`   ... and ${membershipCount - 5} more membership(s)`);
          }
        } else {
          printCheck('Team Memberships (Database)', 'warn', 'No memberships found');
          printCheck('Action Required', 'warn', 'Run: node Droid/scripts/add-katya-to-all-teams.js');
          results.memberships.warn += 2;
        }
      } catch (error) {
        printCheck('Team Memberships (Database)', 'fail', `Error: ${error.message}`);
        results.memberships.fail++;
      }
    } else {
      printCheck('Team Memberships (Database)', 'warn', 'Cannot check - APPWRITE_DATABASE_ID not set');
      results.memberships.warn++;
    }

    printSection('MESSAGE ACTIVITY CHECK');
    
    // Check if Katya has posted messages
    if (databases) {
      try {
        const messages = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          'messages',
          [
            Query.equal('senderId', katyaUserId),
            Query.orderDesc('$createdAt'),
            Query.limit(5)
          ]
        );
        
        const messageCount = messages.documents ? messages.documents.length : 0;
        
        if (messageCount > 0) {
          printCheck('Messages Posted', 'pass', `${messageCount} recent message(s) found`);
          results.messages.pass++;
          
          // Show recent messages
          console.log('\n   📝 Recent Messages:');
          messages.documents.forEach((msg, i) => {
            const content = msg.content ? msg.content.substring(0, 50) + '...' : 'No content';
            const date = msg.$createdAt ? new Date(msg.$createdAt).toLocaleString() : 'Unknown';
            console.log(`   ${i + 1}. ${date}: ${content}`);
          });
        } else {
          printCheck('Messages Posted', 'warn', 'No messages found yet');
          printCheck('Note', 'warn', 'Katya will post messages when triggered by webhook');
          results.messages.warn += 2;
        }
      } catch (error) {
        printCheck('Messages Posted', 'fail', `Error: ${error.message}`);
        results.messages.fail++;
      }
    } else {
      printCheck('Messages Posted', 'warn', 'Cannot check - APPWRITE_DATABASE_ID not set');
      results.messages.warn++;
    }

    printSection('CLOUD FUNCTION CHECK');
    
    // Note: We can't directly check Cloud Function deployment status from here
    // But we can infer it from message activity
    if (databases) {
      try {
        const recentMessages = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          'messages',
          [
            Query.equal('senderId', katyaUserId),
            Query.orderDesc('$createdAt'),
            Query.limit(1)
          ]
        );
        
        if (recentMessages.documents && recentMessages.documents.length > 0) {
          const lastMessage = recentMessages.documents[0];
          const lastMessageDate = new Date(lastMessage.$createdAt);
          const hoursAgo = (Date.now() - lastMessageDate.getTime()) / (1000 * 60 * 60);
          
          if (hoursAgo < 24) {
            printCheck('Function Activity', 'pass', 
              `Last message ${hoursAgo.toFixed(1)} hours ago`);
            results.function.pass++;
          } else {
            printCheck('Function Activity', 'warn', 
              `Last message ${hoursAgo.toFixed(1)} hours ago (may be inactive)`);
            results.function.warn++;
          }
        } else {
          printCheck('Function Activity', 'warn', 'No messages yet - function may not be deployed');
          printCheck('Action Required', 'warn', 'Deploy Cloud Function and configure webhook');
          results.function.warn += 2;
        }
      } catch (error) {
        printCheck('Function Activity', 'warn', `Could not check: ${error.message}`);
        results.function.warn++;
      }
    } else {
      printCheck('Function Activity', 'warn', 'Cannot check - APPWRITE_DATABASE_ID not set');
      results.function.warn++;
    }

    printSection('SUMMARY');
    
    const totalPass = Object.values(results).reduce((sum, cat) => sum + cat.pass, 0);
    const totalFail = Object.values(results).reduce((sum, cat) => sum + cat.fail, 0);
    const totalWarn = Object.values(results).reduce((sum, cat) => sum + cat.warn, 0);
    
    console.log(`\n📊 Test Results:`);
    console.log(`   ✅ Passed: ${totalPass}`);
    console.log(`   ❌ Failed: ${totalFail}`);
    console.log(`   ⚠️  Warnings: ${totalWarn}`);
    
    console.log(`\n📋 Category Breakdown:`);
    console.log(`   Environment: ${results.environment.pass} pass, ${results.environment.fail} fail, ${results.environment.warn} warn`);
    console.log(`   User: ${results.user.pass} pass, ${results.user.fail} fail, ${results.user.warn} warn`);
    console.log(`   Profile Picture: ${results.profilePicture.pass} pass, ${results.profilePicture.fail} fail, ${results.profilePicture.warn} warn`);
    console.log(`   Memberships: ${results.memberships.pass} pass, ${results.memberships.fail} fail, ${results.memberships.warn} warn`);
    console.log(`   Messages: ${results.messages.pass} pass, ${results.messages.fail} fail, ${results.messages.warn} warn`);
    console.log(`   Function: ${results.function.pass} pass, ${results.function.fail} fail, ${results.function.warn} warn`);
    
    if (totalFail === 0 && totalWarn === 0) {
      console.log('\n🎉 All checks passed! Katya is fully configured and ready to go!');
      process.exit(0);
    } else if (totalFail === 0) {
      console.log('\n⚠️  Some warnings found, but Katya should be functional.');
      process.exit(0);
    } else {
      console.log('\n❌ Some checks failed. Please review the errors above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run script
if (require.main === module) {
  testKatyaStatus()
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { testKatyaStatus };

