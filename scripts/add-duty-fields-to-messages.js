/**
 * Script: Add Duty Fields to Messages Collection
 * 
 * This script adds the duty-related fields (isDuty and dutyStatus) to the existing
 * messages collection in Appwrite. These fields are similar to the task fields
 * (isTask and taskStatus) and allow messages to be marked as duties.
 * 
 * Usage:
 *   node scripts/add-duty-fields-to-messages.js
 * 
 * Environment Variables Required:
 *   - APPWRITE_ENDPOINT (defaults to EXPO_PUBLIC_APPWRITE_ENDPOINT or https://cloud.appwrite.io/v1)
 *   - APPWRITE_PROJECT_ID (or EXPO_PUBLIC_APPWRITE_PROJECT_ID)
 *   - APPWRITE_API_KEY (get from Appwrite Console → Settings → API Keys)
 *   - APPWRITE_DATABASE_ID (or EXPO_PUBLIC_APPWRITE_DATABASE_ID)
 */

const { Client, Databases } = require('node-appwrite');

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
const COLLECTION_ID = 'messages';

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
 * Add duty fields to messages collection
 */
async function addDutyFieldsToMessages(databases) {
  console.log('\n📦 Adding duty fields to messages collection...');

  // Check if collection exists
  try {
    await databases.getCollection(APPWRITE_DATABASE_ID, COLLECTION_ID);
    console.log('   ✅ Collection found');
  } catch (e) {
    console.error('   ❌ Collection "messages" not found!');
    console.error('   Please create the messages collection first.');
    throw new Error('Messages collection does not exist');
  }

  try {
    console.log('   📝 Adding attributes...');

    // Helper function to add attribute if it doesn't exist
    const addAttributeIfMissing = async (name, addFn) => {
      try {
        await databases.getAttribute(APPWRITE_DATABASE_ID, COLLECTION_ID, name);
        console.log(`      ⚠️  ${name} already exists, skipping`);
        return false; // Attribute already exists
      } catch (e) {
        await addFn();
        console.log(`      ✅ ${name} added`);
        return true; // Attribute was added
      }
    };

    let attributesAdded = false;

    // Add isDuty attribute (Boolean, optional)
    const isDutyAdded = await addAttributeIfMissing('isDuty', async () => {
      await databases.createBooleanAttribute(
        APPWRITE_DATABASE_ID,
        COLLECTION_ID,
        'isDuty',
        false, // not required (optional)
        false  // default: false
      );
    });
    if (isDutyAdded) attributesAdded = true;

    // Add dutyStatus attribute (String enum, optional)
    const dutyStatusAdded = await addAttributeIfMissing('dutyStatus', async () => {
      await databases.createEnumAttribute(
        APPWRITE_DATABASE_ID,
        COLLECTION_ID,
        'dutyStatus',
        ['active', 'completed'],
        false // not required (optional)
      );
    });
    if (dutyStatusAdded) attributesAdded = true;

    // Wait for attributes to be ready (Appwrite needs time to process)
    if (attributesAdded) {
      console.log('   ⏳ Waiting for attributes to be ready...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Create indexes for better query performance (optional but recommended)
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

    // Create index for querying active duties (similar to tasks)
    await addIndexIfMissing('idx_isDuty_dutyStatus', 'key', ['isDuty', 'dutyStatus']);
    await addIndexIfMissing('idx_jobId_isDuty', 'key', ['jobId', 'isDuty']);

    console.log('   ✅ Duty fields setup complete!');

  } catch (error) {
    console.error('   ❌ Error adding duty fields:', error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Adding duty fields to messages collection...\n');

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
    // Add duty fields
    await addDutyFieldsToMessages(databases);

    console.log('\n✅ Duty fields added successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Added isDuty (Boolean, optional)');
    console.log('   ✅ Added dutyStatus (Enum: active|completed, optional)');
    console.log('   ✅ Created indexes for better query performance');
    console.log('\n📝 Next steps:');
    console.log('   1. Update TypeScript types in utils/types.ts (if not already done)');
    console.log('   2. Implement duty creation UI in app/(jobs)/[job].tsx');
    console.log('   3. Implement duty display with red outline styling');
    console.log('   4. Test creating and completing duties');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\n💡 Tips:');
    console.error('   - Make sure API key has "Databases" scope');
    console.error('   - Check that database ID is correct');
    console.error('   - Verify that messages collection exists');
    console.error('   - Verify network connection to Appwrite');
    process.exit(1);
  }
}

// Run script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };

