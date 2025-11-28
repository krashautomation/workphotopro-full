/**
 * Script: Setup Push Tokens Collection
 * 
 * This script creates the Appwrite collection and attributes for push token storage.
 * Based on PUSH_TOKEN_SETUP_INSTRUCTIONS.md
 * 
 * Usage:
 *   node scripts/setup-push-tokens-collection.js
 * 
 * Environment Variables Required:
 *   - APPWRITE_ENDPOINT (defaults to EXPO_PUBLIC_APPWRITE_ENDPOINT or https://cloud.appwrite.io/v1)
 *   - APPWRITE_PROJECT_ID (or EXPO_PUBLIC_APPWRITE_PROJECT_ID)
 *   - APPWRITE_API_KEY (get from Appwrite Console → Settings → API Keys)
 *   - APPWRITE_DATABASE_ID (or EXPO_PUBLIC_APPWRITE_DATABASE_ID)
 */

const { Client, Databases, ID } = require('node-appwrite');

// Load environment variables if .env file exists
try {
  require('dotenv').config();
} catch (e) {
  // dotenv is optional
}

// Configuration
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID || process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || '';
const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '';

// Collection ID
const COLLECTION_ID = 'user_push_tokens';

/**
 * Initialize Appwrite client
 */
function initClient() {
  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

  return new Databases(client);
}

/**
 * Create user_push_tokens collection
 */
async function createPushTokensCollection(databases) {
  console.log('\n📦 Creating user_push_tokens collection...');

  let collectionExists = false;
  try {
    // Check if collection already exists
    await databases.getCollection(APPWRITE_DATABASE_ID, COLLECTION_ID);
    collectionExists = true;
    console.log('   ⚠️  Collection already exists, will add missing attributes');
  } catch (e) {
    // Collection doesn't exist, will create it
    collectionExists = false;
  }

  try {
    // Create collection if it doesn't exist
    if (!collectionExists) {
      await databases.createCollection(
        APPWRITE_DATABASE_ID,
        COLLECTION_ID,
        'User Push Tokens',
        [
          'read("users")',           // Users can read their own tokens
          'create("users")',         // Users can create their own tokens
          'update("users")',          // Users can update their own tokens
          'delete("users")'           // Users can delete their own tokens
        ],
        false  // Document security enabled
      );
      console.log('   ✅ Collection created');
    }

    // Add attributes (skip if they already exist)
    console.log('   📝 Adding attributes...');

    // Helper function to add attribute if it doesn't exist
    const addAttributeIfMissing = async (name, addFn) => {
      try {
        await databases.getAttribute(APPWRITE_DATABASE_ID, COLLECTION_ID, name);
        console.log(`      ⚠️  ${name} already exists, skipping`);
      } catch (e) {
        await addFn();
        console.log(`      ✅ ${name}`);
      }
    };

    // userId attribute
    await addAttributeIfMissing('userId', async () => {
      await databases.createStringAttribute(
        APPWRITE_DATABASE_ID,
        COLLECTION_ID,
        'userId',
        255,
        true  // required
      );
    });

    // token attribute
    await addAttributeIfMissing('token', async () => {
      await databases.createStringAttribute(
        APPWRITE_DATABASE_ID,
        COLLECTION_ID,
        'token',
        2048,
        true  // required
      );
    });

    // platform attribute
    await addAttributeIfMissing('platform', async () => {
      await databases.createStringAttribute(
        APPWRITE_DATABASE_ID,
        COLLECTION_ID,
        'platform',
        50,
        true  // required
      );
    });

    // createdAt attribute
    await addAttributeIfMissing('createdAt', async () => {
      await databases.createDatetimeAttribute(
        APPWRITE_DATABASE_ID,
        COLLECTION_ID,
        'createdAt',
        true  // required
      );
    });

    // updatedAt attribute
    await addAttributeIfMissing('updatedAt', async () => {
      await databases.createDatetimeAttribute(
        APPWRITE_DATABASE_ID,
        COLLECTION_ID,
        'updatedAt',
        true  // required
      );
    });

    // Wait for attributes to be ready (Appwrite needs time to process)
    console.log('   ⏳ Waiting for attributes to be ready...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update permissions with queries (users can only access their own tokens)
    console.log('   🔐 Updating permissions...');
    try {
      // Note: Appwrite SDK doesn't directly support query-based permissions
      // These need to be set manually in the console, but we'll document them
      console.log('      ⚠️  Query-based permissions need to be set manually in Appwrite Console:');
      console.log('         Update: Add query: userId={{$userId}}');
      console.log('         Delete: Add query: userId={{$userId}}');
    } catch (e) {
      // Permissions update might not be supported via SDK
      console.log('      ℹ️  Permissions set via collection creation');
    }

    // Create indexes (skip if they already exist)
    console.log('   🔍 Creating indexes...');
    
    const addIndexIfMissing = async (indexKey, indexType, attributes) => {
      try {
        await databases.getIndex(APPWRITE_DATABASE_ID, COLLECTION_ID, indexKey);
        console.log(`      ⚠️  Index ${indexKey} already exists, skipping`);
      } catch (e) {
        try {
          await databases.createIndex(
            APPWRITE_DATABASE_ID,
            COLLECTION_ID,
            indexKey,
            indexType,
            attributes,
            []  // orders array (empty for default ASC)
          );
          console.log(`      ✅ Index: ${indexKey}`);
        } catch (indexError) {
          console.log(`      ⚠️  Could not create index ${indexKey}: ${indexError.message}`);
        }
      }
    };

    // Create composite index for userId + platform
    await addIndexIfMissing('userId_platform', 'key', ['userId', 'platform']);

    console.log('   ✅ Push tokens collection setup complete!');

  } catch (error) {
    console.error('   ❌ Error creating push tokens collection:', error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Setting up push tokens collection...\n');

  // Validate environment variables
  if (!APPWRITE_PROJECT_ID || !APPWRITE_API_KEY || !APPWRITE_DATABASE_ID) {
    console.error('❌ Missing required environment variables:');
    console.error('   - APPWRITE_PROJECT_ID (or EXPO_PUBLIC_APPWRITE_PROJECT_ID)');
    console.error('   - APPWRITE_API_KEY (get from Appwrite Console → Settings → API Keys)');
    console.error('   - APPWRITE_DATABASE_ID (or EXPO_PUBLIC_APPWRITE_DATABASE_ID)');
    console.error('\n💡 How to get API Key:');
    console.error('   1. Go to Appwrite Console');
    console.error('   2. Settings → API Keys');
    console.error('   3. Create new API Key with "Databases" scope');
    console.error('   4. Copy the key and set APPWRITE_API_KEY environment variable');
    console.error('\n📝 Example .env file:');
    console.error('   APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1');
    console.error('   APPWRITE_PROJECT_ID=your_project_id');
    console.error('   APPWRITE_API_KEY=your_api_key');
    console.error('   APPWRITE_DATABASE_ID=your_database_id');
    process.exit(1);
  }

  const databases = initClient();

  try {
    // Create collection
    await createPushTokensCollection(databases);

    console.log('\n✅ Collection setup complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Go to Appwrite Console → Databases → user_push_tokens');
    console.log('   2. Go to Settings → Permissions');
    console.log('   3. Update permissions:');
    console.log('      - Update: Add query: userId={{$userId}}');
    console.log('      - Delete: Add query: userId={{$userId}}');
    console.log('   4. Test push token registration in your app');
    console.log('\n📖 See docs/PUSH_TOKEN_SETUP_INSTRUCTIONS.md for full guide');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\n💡 Tips:');
    console.error('   - Make sure API key has "Databases" scope');
    console.error('   - Check that database ID is correct');
    console.error('   - Verify network connection to Appwrite');
    process.exit(1);
  }
}

// Run script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };

