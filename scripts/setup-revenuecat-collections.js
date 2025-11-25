/**
 * Script: Setup RevenueCat Collections
 * 
 * This script creates the necessary Appwrite collections and attributes for RevenueCat integration.
 * Based on the refined schema from REVENUECAT_INTEGRATION_GUIDE.md
 * 
 * Usage:
 *   node scripts/setup-revenuecat-collections.js
 * 
 * Environment Variables Required:
 *   - APPWRITE_ENDPOINT (defaults to EXPO_PUBLIC_APPWRITE_ENDPOINT or https://cloud.appwrite.io/v1)
 *   - APPWRITE_PROJECT_ID (or EXPO_PUBLIC_APPWRITE_PROJECT_ID)
 *   - APPWRITE_REVCAT_API_KEY (get from Appwrite Console → Settings → API Keys)
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
const APPWRITE_REVCAT_API_KEY = process.env.APPWRITE_REVCAT_API_KEY || '';
const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '';

// Collection IDs
const SUBSCRIPTIONS_COLLECTION_ID = 'subscriptions';
const REVENUECAT_EVENTS_COLLECTION_ID = 'revenuecat_events';
const ORGANIZATIONS_COLLECTION_ID = 'organizations';

/**
 * Initialize Appwrite client
 */
function initClient() {
  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_REVCAT_API_KEY);

  return new Databases(client);
}

/**
 * Create subscriptions collection
 */
async function createSubscriptionsCollection(databases) {
  console.log('\n📦 Creating subscriptions collection...');

  let collectionExists = false;
  try {
    // Check if collection already exists
    await databases.getCollection(APPWRITE_DATABASE_ID, SUBSCRIPTIONS_COLLECTION_ID);
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
        SUBSCRIPTIONS_COLLECTION_ID,
        'Subscriptions',
        [
          'read("any")',  // Anyone can read (for authenticated users)
          'create("users")',  // Authenticated users can create
          'update("users")',  // Authenticated users can update
          'delete("users")'   // Authenticated users can delete
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
        await databases.getAttribute(APPWRITE_DATABASE_ID, SUBSCRIPTIONS_COLLECTION_ID, name);
        console.log(`      ⚠️  ${name} already exists, skipping`);
      } catch (e) {
        await addFn();
        console.log(`      ✅ ${name}`);
      }
    };

    // Core required fields
    await addAttributeIfMissing('userId', async () => {
      await databases.createStringAttribute(
        APPWRITE_DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        'userId',
        36,
        true  // required
      );
    });

    await addAttributeIfMissing('orgId', async () => {
      await databases.createStringAttribute(
        APPWRITE_DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        'orgId',
        36,
        true  // required
      );
    });

    await addAttributeIfMissing('revenueCatCustomerId', async () => {
      await databases.createStringAttribute(
        APPWRITE_DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        'revenueCatCustomerId',
        255,
        true  // required
      );
    });

    await addAttributeIfMissing('productId', async () => {
      await databases.createStringAttribute(
        APPWRITE_DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        'productId',
        255,
        true  // required
      );
    });

    await addAttributeIfMissing('status', async () => {
      await databases.createStringAttribute(
        APPWRITE_DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        'status',
        50,
        true  // required
      );
    });

    await addAttributeIfMissing('startDate', async () => {
      await databases.createDatetimeAttribute(
        APPWRITE_DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        'startDate',
        true  // required
      );
    });

    await addAttributeIfMissing('expiryDate', async () => {
      await databases.createDatetimeAttribute(
        APPWRITE_DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        'expiryDate',
        true  // required
      );
    });

    await addAttributeIfMissing('autoRenewing', async () => {
      await databases.createBooleanAttribute(
        APPWRITE_DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        'autoRenewing',
        false,  // not required (allows default value)
        true    // default: true
      );
    });

    await addAttributeIfMissing('canceledAt', async () => {
      await databases.createDatetimeAttribute(
        APPWRITE_DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        'canceledAt',
        false  // optional
      );
    });

    await addAttributeIfMissing('lastSyncedAt', async () => {
      await databases.createDatetimeAttribute(
        APPWRITE_DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        'lastSyncedAt',
        true  // required
      );
    });

    // Optional fields
    await addAttributeIfMissing('trialEndDate', async () => {
      await databases.createDatetimeAttribute(
        APPWRITE_DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        'trialEndDate',
        false  // optional
      );
    });

    await addAttributeIfMissing('packageId', async () => {
      await databases.createStringAttribute(
        APPWRITE_DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        'packageId',
        50,
        false  // optional
      );
    });

    // Wait for attributes to be ready (Appwrite needs time to process)
    console.log('   ⏳ Waiting for attributes to be ready...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create indexes (skip if they already exist)
    console.log('   🔍 Creating indexes...');
    
    const addIndexIfMissing = async (indexKey, indexType, attributes) => {
      try {
        await databases.getIndex(APPWRITE_DATABASE_ID, SUBSCRIPTIONS_COLLECTION_ID, indexKey);
        console.log(`      ⚠️  Index ${indexKey} already exists, skipping`);
      } catch (e) {
        try {
          await databases.createIndex(
            APPWRITE_DATABASE_ID,
            SUBSCRIPTIONS_COLLECTION_ID,
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
    await addIndexIfMissing('idx_orgId', 'key', ['orgId']);
    await addIndexIfMissing('idx_revenueCatCustomerId', 'key', ['revenueCatCustomerId']);
    await addIndexIfMissing('idx_status', 'key', ['status']);
    await addIndexIfMissing('idx_expiryDate', 'key', ['expiryDate']);

    console.log('   ✅ Subscriptions collection setup complete!');

  } catch (error) {
    console.error('   ❌ Error creating subscriptions collection:', error.message);
    throw error;
  }
}

/**
 * Create revenuecat_events collection
 */
async function createRevenueCatEventsCollection(databases) {
  console.log('\n📦 Creating revenuecat_events collection...');

  try {
    // Check if collection already exists
    try {
      await databases.getCollection(APPWRITE_DATABASE_ID, REVENUECAT_EVENTS_COLLECTION_ID);
      console.log('   ⚠️  Collection already exists, skipping creation');
      return;
    } catch (e) {
      // Collection doesn't exist, create it
    }

    // Create collection
    await databases.createCollection(
      APPWRITE_DATABASE_ID,
      REVENUECAT_EVENTS_COLLECTION_ID,
      'RevenueCat Events',
      [
        'read("any")',
        'create("any")',  // Webhooks can create
        'update("any")',  // Webhook processor can update
        'delete("users")'
      ],
      false
    );

    console.log('   ✅ Collection created');

    // Add attributes
    console.log('   📝 Adding attributes...');

    await databases.createStringAttribute(
      APPWRITE_DATABASE_ID,
      REVENUECAT_EVENTS_COLLECTION_ID,
      'eventId',
      255,
      true  // required, unique
    );
    console.log('      ✅ eventId');

    await databases.createStringAttribute(
      APPWRITE_DATABASE_ID,
      REVENUECAT_EVENTS_COLLECTION_ID,
      'eventType',
      100,
      true  // required
    );
    console.log('      ✅ eventType');

    await databases.createStringAttribute(
      APPWRITE_DATABASE_ID,
      REVENUECAT_EVENTS_COLLECTION_ID,
      'eventCategory',
      50,
      true  // required
    );
    console.log('      ✅ eventCategory');

    await databases.createStringAttribute(
      APPWRITE_DATABASE_ID,
      REVENUECAT_EVENTS_COLLECTION_ID,
      'customerId',
      255,
      true  // required
    );
    console.log('      ✅ customerId');

    await databases.createStringAttribute(
      APPWRITE_DATABASE_ID,
      REVENUECAT_EVENTS_COLLECTION_ID,
      'userId',
      36,
      false  // optional
    );
    console.log('      ✅ userId (optional)');

    await databases.createStringAttribute(
      APPWRITE_DATABASE_ID,
      REVENUECAT_EVENTS_COLLECTION_ID,
      'orgId',
      36,
      false  // optional
    );
    console.log('      ✅ orgId (optional)');

    await databases.createStringAttribute(
      APPWRITE_DATABASE_ID,
      REVENUECAT_EVENTS_COLLECTION_ID,
      'productId',
      255,
      false  // optional
    );
    console.log('      ✅ productId (optional)');

    await databases.createStringAttribute(
      APPWRITE_DATABASE_ID,
      REVENUECAT_EVENTS_COLLECTION_ID,
      'eventData',
      10000,  // Large enough for JSON
      false  // optional
    );
    console.log('      ✅ eventData (JSON)');

    await databases.createIntegerAttribute(
      APPWRITE_DATABASE_ID,
      REVENUECAT_EVENTS_COLLECTION_ID,
      'attemptNumber',
      true,   // required
      null,   // no min
      null,   // no max
      0       // default: 0
    );
    console.log('      ✅ attemptNumber');

    await databases.createStringAttribute(
      APPWRITE_DATABASE_ID,
      REVENUECAT_EVENTS_COLLECTION_ID,
      'processedStatus',
      50,
      true  // required
    );
    console.log('      ✅ processedStatus');

    await databases.createDatetimeAttribute(
      APPWRITE_DATABASE_ID,
      REVENUECAT_EVENTS_COLLECTION_ID,
      'processedAt',
      false  // optional
    );
    console.log('      ✅ processedAt (optional)');

    await databases.createStringAttribute(
      APPWRITE_DATABASE_ID,
      REVENUECAT_EVENTS_COLLECTION_ID,
      'errorMessage',
      1000,
      false  // optional
    );
    console.log('      ✅ errorMessage (optional)');

    // Wait for attributes to be ready
    console.log('   ⏳ Waiting for attributes to be ready...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create indexes
    console.log('   🔍 Creating indexes...');

    await databases.createIndex(
      APPWRITE_DATABASE_ID,
      REVENUECAT_EVENTS_COLLECTION_ID,
      'idx_eventId',
      'unique',
      ['eventId'],
      []
    );
    console.log('      ✅ Unique Index: eventId');

    await databases.createIndex(
      APPWRITE_DATABASE_ID,
      REVENUECAT_EVENTS_COLLECTION_ID,
      'idx_processedStatus',
      'key',
      ['processedStatus'],
      []
    );
    console.log('      ✅ Index: processedStatus');

    await databases.createIndex(
      APPWRITE_DATABASE_ID,
      REVENUECAT_EVENTS_COLLECTION_ID,
      'idx_customerId',
      'key',
      ['customerId'],
      []
    );
    console.log('      ✅ Index: customerId');

    await databases.createIndex(
      APPWRITE_DATABASE_ID,
      REVENUECAT_EVENTS_COLLECTION_ID,
      'idx_createdAt',
      'key',
      ['$createdAt'],
      []
    );
    console.log('      ✅ Index: createdAt');

    console.log('   ✅ RevenueCat Events collection setup complete!');

  } catch (error) {
    console.error('   ❌ Error creating revenuecat_events collection:', error.message);
    throw error;
  }
}

/**
 * Update organizations collection with new fields
 */
async function updateOrganizationsCollection(databases) {
  console.log('\n📦 Updating organizations collection...');

  try {
    // Check if collection exists
    let collection;
    try {
      collection = await databases.getCollection(APPWRITE_DATABASE_ID, ORGANIZATIONS_COLLECTION_ID);
      console.log('   ✅ Collection exists');
    } catch (e) {
      console.log('   ⚠️  Organizations collection does not exist. Please create it first.');
      return;
    }

    // Add new attributes (skip if they already exist)
    console.log('   📝 Adding/updating attributes...');

    const attributesToAdd = [
      { name: 'currentProductId', type: 'string', size: 255, required: false },
      { name: 'subscriptionId', type: 'string', size: 36, required: false },
      { name: 'subscriptionExpiryDate', type: 'datetime', required: false },
      { name: 'revenueCatCustomerId', type: 'string', size: 255, required: false }
    ];

    for (const attr of attributesToAdd) {
      try {
        // Try to get attribute to check if it exists
        await databases.getAttribute(APPWRITE_DATABASE_ID, ORGANIZATIONS_COLLECTION_ID, attr.name);
        console.log(`      ⚠️  ${attr.name} already exists, skipping`);
      } catch (e) {
        // Attribute doesn't exist, create it
        if (attr.type === 'string') {
          await databases.createStringAttribute(
            APPWRITE_DATABASE_ID,
            ORGANIZATIONS_COLLECTION_ID,
            attr.name,
            attr.size,
            attr.required
          );
        } else if (attr.type === 'datetime') {
          await databases.createDatetimeAttribute(
            APPWRITE_DATABASE_ID,
            ORGANIZATIONS_COLLECTION_ID,
            attr.name,
            attr.required
          );
        }
        console.log(`      ✅ ${attr.name}`);
      }
    }

    console.log('   ✅ Organizations collection updated!');

  } catch (error) {
    console.error('   ❌ Error updating organizations collection:', error.message);
    // Don't throw - this is optional if collection doesn't exist yet
    console.log('   ⚠️  Continuing...');
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Setting up RevenueCat collections...\n');

  // Validate environment variables
  if (!APPWRITE_PROJECT_ID || !APPWRITE_REVCAT_API_KEY || !APPWRITE_DATABASE_ID) {
    console.error('❌ Missing required environment variables:');
    console.error('   - APPWRITE_PROJECT_ID (or EXPO_PUBLIC_APPWRITE_PROJECT_ID)');
    console.error('   - APPWRITE_REVCAT_API_KEY (get from Appwrite Console → Settings → API Keys)');
    console.error('   - APPWRITE_DATABASE_ID (or EXPO_PUBLIC_APPWRITE_DATABASE_ID)');
    console.error('\n💡 How to get API Key:');
    console.error('   1. Go to Appwrite Console');
    console.error('   2. Settings → API Keys');
    console.error('   3. Create new API Key with "Databases" scope');
    console.error('   4. Copy the key and set APPWRITE_REVCAT_API_KEY environment variable');
    console.error('\n📝 Example .env file:');
    console.error('   APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1');
    console.error('   APPWRITE_PROJECT_ID=your_project_id');
    console.error('   APPWRITE_REVCAT_API_KEY=your_api_key');
    console.error('   APPWRITE_DATABASE_ID=your_database_id');
    process.exit(1);
  }

  const databases = initClient();

  try {
    // Create collections
    await createSubscriptionsCollection(databases);
    await createRevenueCatEventsCollection(databases);
    await updateOrganizationsCollection(databases);

    console.log('\n✅ All collections setup complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Verify collections in Appwrite Console');
    console.log('   2. Set up RevenueCat account and products');
    console.log('   3. Configure webhook endpoint');
    console.log('   4. Install RevenueCat SDK: npm install react-native-purchases');
    console.log('\n📖 See docs/REVENUECAT_INTEGRATION_GUIDE.md for full integration guide');

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

