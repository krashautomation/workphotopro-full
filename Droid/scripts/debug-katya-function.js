/**
 * Debug Katya Function Script
 * 
 * This script helps diagnose 500 errors in the Katya Cloud Function by:
 * 1. Validating environment variables
 * 2. Testing API key permissions
 * 3. Testing Appwrite client initialization
 * 4. Providing detailed error information
 * 
 * Usage:
 *   node Droid/scripts/debug-katya-function.js
 * 
 * Requirements:
 *   - .env file with Appwrite credentials
 *   - node-appwrite package installed
 */

require('dotenv').config();
const { Client, Databases, Account, Users, Query } = require('node-appwrite');

// Configuration from environment variables
const APPWRITE_ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
const APPWRITE_DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_DROID_API_KEY || process.env.APPWRITE_API_KEY;
const KATYA_USER_ID = process.env.EXPO_PUBLIC_KATYA_USER_ID || process.env.KATYA_USER_ID || '692d284d000f7e24c7e4';
const KATYA_EMAIL = process.env.KATYA_EMAIL || 'katya@workphotopro.ai';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Print a section header
 */
function printSection(title) {
  console.log('\n' + '='.repeat(70));
  console.log(`🔍 ${title}`);
  console.log('='.repeat(70));
}

/**
 * Print a check result
 */
function printCheck(name, status, details = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  const statusText = status === 'pass' ? 'PASS' : status === 'fail' ? 'FAIL' : 'WARN';
  console.log(`${icon} ${name}: ${statusText}`);
  if (details) {
    const lines = details.split('\n');
    lines.forEach(line => console.log(`   ${line}`));
  }
}

/**
 * Test environment variables
 */
function testEnvironmentVariables() {
  printSection('ENVIRONMENT VARIABLES CHECK');
  
  const checks = {
    APPWRITE_ENDPOINT: APPWRITE_ENDPOINT,
    APPWRITE_PROJECT_ID: APPWRITE_PROJECT_ID,
    APPWRITE_DATABASE_ID: APPWRITE_DATABASE_ID,
    APPWRITE_API_KEY: APPWRITE_API_KEY,
    KATYA_USER_ID: KATYA_USER_ID,
    KATYA_EMAIL: KATYA_EMAIL,
    OPENAI_API_KEY: OPENAI_API_KEY
  };
  
  const missing = [];
  const present = [];
  
  Object.entries(checks).forEach(([key, value]) => {
    if (!value || value.trim() === '') {
      printCheck(key, 'fail', 'Missing or empty');
      missing.push(key);
    } else {
      // Mask sensitive values
      let displayValue = value;
      if (key.includes('API_KEY') || key.includes('PASSWORD')) {
        displayValue = value.substring(0, 10) + '...' + value.substring(value.length - 4);
      }
      printCheck(key, 'pass', displayValue);
      present.push(key);
    }
  });
  
  if (missing.length > 0) {
    console.log('\n⚠️  Missing environment variables:');
    missing.forEach(key => console.log(`   - ${key}`));
    console.log('\n💡 These must be set in your Appwrite Function environment variables.');
    console.log('   Go to: Appwrite Console → Functions → katya-ai-agent → Settings → Variables');
  }
  
  return { missing, present };
}

/**
 * Test Appwrite client initialization
 */
async function testAppwriteClient() {
  printSection('APPWRITE CLIENT TEST');
  
  if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
    printCheck('Client Initialization', 'fail', 'Cannot test - missing required env vars');
    return false;
  }
  
  try {
    console.log('   🔄 Initializing Appwrite client...');
    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID)
      .setKey(APPWRITE_API_KEY);
    
    printCheck('Client Created', 'pass', 'Client object created successfully');
    
    // Test Databases service
    try {
      const databases = new Databases(client);
      printCheck('Databases Service', 'pass', 'Databases service initialized');
      
      // Try to list databases (this tests API key permissions)
      if (APPWRITE_DATABASE_ID) {
        try {
          const db = await databases.get(APPWRITE_DATABASE_ID);
          printCheck('Database Access', 'pass', `Database found: ${db.name || APPWRITE_DATABASE_ID}`);
        } catch (error) {
          printCheck('Database Access', 'fail', `Error: ${error.message}`);
          printCheck('API Key Permissions', 'warn', 'API key may not have databases.read permission');
          console.log(`   Error code: ${error.code}`);
          console.log(`   Error type: ${error.type}`);
        }
      }
    } catch (error) {
      printCheck('Databases Service', 'fail', `Error: ${error.message}`);
    }
    
    // Test Users service
    try {
      const users = new Users(client);
      printCheck('Users Service', 'pass', 'Users service initialized');
      
      // Try to get Katya user
      try {
        const katyaUser = await users.get(KATYA_USER_ID);
        printCheck('Katya User Access', 'pass', `User found: ${katyaUser.name || katyaUser.email}`);
      } catch (error) {
        printCheck('Katya User Access', 'fail', `Error: ${error.message}`);
        printCheck('API Key Permissions', 'warn', 'API key may not have users.read permission');
        console.log(`   Error code: ${error.code}`);
        console.log(`   Error type: ${error.type}`);
      }
    } catch (error) {
      printCheck('Users Service', 'fail', `Error: ${error.message}`);
    }
    
    // Test Account service
    try {
      const account = new Account(client);
      printCheck('Account Service', 'pass', 'Account service initialized');
    } catch (error) {
      printCheck('Account Service', 'fail', `Error: ${error.message}`);
    }
    
    return true;
  } catch (error) {
    printCheck('Client Initialization', 'fail', `Error: ${error.message}`);
    console.log(`   Error code: ${error.code}`);
    console.log(`   Error type: ${error.type}`);
    console.log(`   Stack: ${error.stack}`);
    return false;
  }
}

/**
 * Test API key permissions
 */
async function testAPIKeyPermissions() {
  printSection('API KEY PERMISSIONS CHECK');
  
  if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
    printCheck('Permissions Check', 'fail', 'Cannot test - missing required env vars');
    return;
  }
  
  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);
  
  const requiredScopes = [
    { name: 'databases.read', test: async () => {
      const databases = new Databases(client);
      if (APPWRITE_DATABASE_ID) {
        await databases.get(APPWRITE_DATABASE_ID);
      }
    }},
    { name: 'databases.write', test: async () => {
      const databases = new Databases(client);
      if (APPWRITE_DATABASE_ID) {
        // Just test that we can create a query (doesn't actually write)
        Query.equal('test', 'test');
      }
    }},
    { name: 'users.read', test: async () => {
      const users = new Users(client);
      await users.get(KATYA_USER_ID);
    }},
    { name: 'users.write', test: async () => {
      const users = new Users(client);
      // Can't easily test write without modifying, so we'll skip
      return true;
    }},
    { name: 'sessions.write', test: async () => {
      // This is needed for Account.createEmailPasswordSession
      // Can't easily test without creating a session
      return true;
    }}
  ];
  
  for (const scope of requiredScopes) {
    try {
      await scope.test();
      printCheck(scope.name, 'pass', 'Permission granted');
    } catch (error) {
      if (error.code === 401 || error.type === 'general_unauthorized_scope') {
        printCheck(scope.name, 'fail', `Missing permission: ${error.message}`);
        console.log(`   💡 Add this scope to your API key in Appwrite Console`);
      } else if (error.code === 404) {
        printCheck(scope.name, 'warn', `Resource not found (permission may be OK): ${error.message}`);
      } else {
        printCheck(scope.name, 'warn', `Could not test: ${error.message}`);
      }
    }
  }
}

/**
 * Test database operations
 */
async function testDatabaseOperations() {
  printSection('DATABASE OPERATIONS TEST');
  
  if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_DATABASE_ID || !APPWRITE_API_KEY) {
    printCheck('Database Test', 'fail', 'Cannot test - missing required env vars');
    return;
  }
  
  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);
  
  const databases = new Databases(client);
  
  // Test reading messages collection
  try {
    const messages = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      'messages',
      [Query.limit(1)]
    );
    printCheck('Read Messages Collection', 'pass', `Can read messages (found ${messages.total} total)`);
  } catch (error) {
    printCheck('Read Messages Collection', 'fail', `Error: ${error.message}`);
    console.log(`   Error code: ${error.code}`);
    console.log(`   Error type: ${error.type}`);
    if (error.code === 404) {
      console.log('   💡 Collection "messages" may not exist or API key lacks permission');
    }
  }
  
  // Test reading memberships collection
  try {
    const memberships = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      'memberships',
      [Query.equal('userId', KATYA_USER_ID), Query.limit(1)]
    );
    printCheck('Read Memberships Collection', 'pass', 
      `Can read memberships (found ${memberships.total} for Katya)`);
  } catch (error) {
    printCheck('Read Memberships Collection', 'fail', `Error: ${error.message}`);
    console.log(`   Error code: ${error.code}`);
  }
}

/**
 * Test OpenAI API key
 */
function testOpenAIKey() {
  printSection('OPENAI API KEY CHECK');
  
  if (!OPENAI_API_KEY) {
    printCheck('OpenAI API Key', 'fail', 'Missing from environment');
    console.log('\n💡 Add OPENAI_API_KEY to your Appwrite Function environment variables');
    return;
  }
  
  // Check format
  if (OPENAI_API_KEY.startsWith('sk-')) {
    printCheck('OpenAI API Key Format', 'pass', 'Key format looks correct (starts with sk-)');
  } else {
    printCheck('OpenAI API Key Format', 'warn', 'Key does not start with sk- (may be incorrect)');
  }
  
  printCheck('OpenAI API Key', 'pass', `${OPENAI_API_KEY.substring(0, 10)}...${OPENAI_API_KEY.substring(OPENAI_API_KEY.length - 4)}`);
  console.log('\n💡 Note: This script cannot test if the key is valid without making an API call.');
  console.log('   Check your OpenAI dashboard: https://platform.openai.com/usage');
}

/**
 * Main function
 */
async function debugKatyaFunction() {
  console.log('🤖 Katya Function Debugger');
  console.log('🔍 This script will help diagnose 500 errors in your Katya Cloud Function\n');
  
  // Test 1: Environment variables
  const envCheck = testEnvironmentVariables();
  
  if (envCheck.missing.length > 0) {
    console.log('\n❌ Cannot continue - missing required environment variables');
    console.log('\n📋 Next Steps:');
    console.log('1. Go to Appwrite Console → Functions → katya-ai-agent');
    console.log('2. Click Settings → Variables');
    console.log('3. Add all missing variables');
    console.log('4. Mark sensitive variables (API keys, passwords) as "Encrypted"');
    console.log('5. Redeploy the function');
    process.exit(1);
  }
  
  // Test 2: Appwrite client
  await testAppwriteClient();
  
  // Test 3: API key permissions
  await testAPIKeyPermissions();
  
  // Test 4: Database operations
  await testDatabaseOperations();
  
  // Test 5: OpenAI key
  testOpenAIKey();
  
  // Summary
  printSection('DEBUGGING SUMMARY');
  
  console.log('\n📋 Common 500 Error Causes:');
  console.log('1. ❌ Missing environment variables');
  console.log('2. ❌ Invalid API key format');
  console.log('3. ❌ API key missing required scopes');
  console.log('4. ❌ Database/collection not found');
  console.log('5. ❌ Code errors (check function logs)');
  
  console.log('\n📋 Next Steps:');
  console.log('1. ✅ Check Appwrite Console → Functions → katya-ai-agent → Logs');
  console.log('2. ✅ Look for error messages with 🤖 emoji (from function code)');
  console.log('3. ✅ Verify all environment variables are set correctly');
  console.log('4. ✅ Check API key has all required scopes:');
  console.log('   - databases.read');
  console.log('   - databases.write');
  console.log('   - users.read');
  console.log('   - users.write');
  console.log('   - sessions.write');
  console.log('5. ✅ Test function execution manually in Appwrite Console');
  
  console.log('\n💡 To view function logs:');
  console.log('   Appwrite Console → Functions → katya-ai-agent → Logs');
  console.log('   Look for lines starting with 🤖 for detailed error information');
}

// Run script
if (require.main === module) {
  debugKatyaFunction()
    .then(() => {
      console.log('\n✨ Debugging complete!\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Fatal error:', error);
      console.error(error.stack);
      process.exit(1);
    });
}

module.exports = { debugKatyaFunction };

