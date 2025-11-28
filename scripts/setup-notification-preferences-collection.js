/**
 * Script: Setup Notification Preferences Collection
 * 
 * This script creates the Appwrite collection for storing user notification preferences.
 * 
 * Usage:
 *   node scripts/setup-notification-preferences-collection.js
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
const COLLECTION_ID = 'user_notification_preferences';

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
 * Create user_notification_preferences collection
 */
async function createNotificationPreferencesCollection(databases) {
  console.log('\n📦 Creating user_notification_preferences collection...');

  let collectionExists = false;
  try {
    await databases.getCollection(APPWRITE_DATABASE_ID, COLLECTION_ID);
    collectionExists = true;
    console.log('   ⚠️  Collection already exists, will add missing attributes');
  } catch (e) {
    collectionExists = false;
  }

  try {
    if (!collectionExists) {
      await databases.createCollection(
        APPWRITE_DATABASE_ID,
        COLLECTION_ID,
        'User Notification Preferences',
        [
          'read("users")',
          'create("users")',
          'update("users")',
          'delete("users")'
        ],
        false
      );
      console.log('   ✅ Collection created');
    }

    console.log('   📝 Adding attributes...');

    const addAttributeIfMissing = async (name, addFn) => {
      try {
        await databases.getAttribute(APPWRITE_DATABASE_ID, COLLECTION_ID, name);
        console.log(`      ⚠️  ${name} already exists, skipping`);
      } catch (e) {
        await addFn();
        console.log(`      ✅ ${name}`);
      }
    };

    // userId
    await addAttributeIfMissing('userId', async () => {
      await databases.createStringAttribute(
        APPWRITE_DATABASE_ID,
        COLLECTION_ID,
        'userId',
        255,
        true
      );
    });

    // Boolean preferences
    const booleanPreferences = [
      'push_notifications',
      'email_notifications',
      'task_created',
      'task_completed',
      'message',
      'job_assigned',
      'job_updated',
      'photo_uploaded',
      'team_invite',
      'job_status_updates',
      'weekly_summary',
    ];

    for (const pref of booleanPreferences) {
      await addAttributeIfMissing(pref, async () => {
        await databases.createBooleanAttribute(
          APPWRITE_DATABASE_ID,
          COLLECTION_ID,
          pref,
          false, // not required (will use defaults)
          true   // default: true for most, false for some
        );
      });
    }

    // updatedAt
    await addAttributeIfMissing('updatedAt', async () => {
      await databases.createDatetimeAttribute(
        APPWRITE_DATABASE_ID,
        COLLECTION_ID,
        'updatedAt',
        true
      );
    });

    // Wait for attributes to be ready
    console.log('   ⏳ Waiting for attributes to be ready...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create index
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
            []
          );
          console.log(`      ✅ Index: ${indexKey}`);
        } catch (indexError) {
          console.log(`      ⚠️  Could not create index ${indexKey}: ${indexError.message}`);
        }
      }
    };

    await addIndexIfMissing('idx_userId', 'key', ['userId']);

    console.log('   ✅ Notification preferences collection setup complete!');

  } catch (error) {
    console.error('   ❌ Error creating collection:', error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Setting up notification preferences collection...\n');

  if (!APPWRITE_PROJECT_ID || !APPWRITE_API_KEY || !APPWRITE_DATABASE_ID) {
    console.error('❌ Missing required environment variables:');
    console.error('   - APPWRITE_PROJECT_ID (or EXPO_PUBLIC_APPWRITE_PROJECT_ID)');
    console.error('   - APPWRITE_API_KEY (get from Appwrite Console → Settings → API Keys)');
    console.error('   - APPWRITE_DATABASE_ID (or EXPO_PUBLIC_APPWRITE_DATABASE_ID)');
    process.exit(1);
  }

  const databases = initClient();

  try {
    await createNotificationPreferencesCollection(databases);

    console.log('\n✅ Collection setup complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Go to Appwrite Console → Databases → user_notification_preferences');
    console.log('   2. Go to Settings → Permissions');
    console.log('   3. Update permissions:');
    console.log('      - Update: Add query: userId={{$userId}}');
    console.log('      - Delete: Add query: userId={{$userId}}');
    console.log('   4. Test notification settings in your app');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };

