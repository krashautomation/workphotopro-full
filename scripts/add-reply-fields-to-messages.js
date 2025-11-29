/**
 * Script: Add Reply Fields to Messages Collection
 * 
 * This script adds reply-related fields (replyToMessageId and replyCount) to the existing
 * messages collection in Appwrite. These fields enable message threading and reply tracking
 * for future reward/gamification features.
 * 
 * Usage:
 *   node scripts/add-reply-fields-to-messages.js
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
 * Add reply fields to messages collection
 */
async function addReplyFieldsToMessages(databases) {
  console.log('\n📦 Adding reply fields to messages collection...');

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

    // Add replyToMessageId attribute (String, optional)
    // This references the $id of the message being replied to
    const replyToMessageIdAdded = await addAttributeIfMissing('replyToMessageId', async () => {
      await databases.createStringAttribute(
        APPWRITE_DATABASE_ID,
        COLLECTION_ID,
        'replyToMessageId',
        255, // Max length for Appwrite document ID
        false // not required (optional)
      );
    });
    if (replyToMessageIdAdded) attributesAdded = true;

    // Add replyCount attribute (Integer, optional, default: 0)
    // This tracks how many replies a message has received (for rewards/metrics)
    const replyCountAdded = await addAttributeIfMissing('replyCount', async () => {
      await databases.createIntegerAttribute(
        APPWRITE_DATABASE_ID,
        COLLECTION_ID,
        'replyCount',
        false, // not required (optional)
        0,     // min: 0 (can't be negative)
        null,  // max: null (no upper limit)
        0      // default: 0
      );
    });
    if (replyCountAdded) attributesAdded = true;

    // Wait for attributes to be ready (Appwrite needs time to process)
    if (attributesAdded) {
      console.log('   ⏳ Waiting for attributes to be ready...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Create indexes for better query performance
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

    // Create index on replyToMessageId for efficient queries
    // This allows fast lookups of all replies to a specific message
    await addIndexIfMissing('idx_replyToMessageId', 'key', ['replyToMessageId']);

    // Create composite index for querying replies to tasks/duties
    // Useful for displaying replies in tasks/duties tab
    await addIndexIfMissing('idx_replyToMessageId_jobId', 'key', ['replyToMessageId', 'jobId']);

    // Create index for replyCount (for future reward queries)
    await addIndexIfMissing('idx_replyCount', 'key', ['replyCount']);

    console.log('   ✅ Reply fields setup complete!');

  } catch (error) {
    console.error('   ❌ Error adding reply fields:', error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Adding reply fields to messages collection...\n');

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
    // Add reply fields
    await addReplyFieldsToMessages(databases);

    console.log('\n✅ Reply fields added successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Added replyToMessageId (String, optional) - References the message being replied to');
    console.log('   ✅ Added replyCount (Integer, optional) - Tracks number of replies for rewards/metrics');
    console.log('   ✅ Created indexes for efficient querying:');
    console.log('      - idx_replyToMessageId (for finding all replies to a message)');
    console.log('      - idx_replyToMessageId_jobId (for finding replies in specific jobs)');
    console.log('      - idx_replyCount (for reward/gamification queries)');
    console.log('\n📝 Next steps:');
    console.log('   1. Update TypeScript types in utils/types.ts:');
    console.log('      - Add replyToMessageId?: string');
    console.log('      - Add replyCount?: number');
    console.log('   2. Update long press handler in app/(jobs)/[job].tsx to show "Reply" option');
    console.log('   3. Implement reply UI with original message preview');
    console.log('   4. Update sendMessage function to set replyToMessageId when replying');
    console.log('   5. Implement replyCount increment when replies are created');
    console.log('   6. Display replies in tasks/duties tab');
    console.log('   7. Implement reward system based on replyCount (future)');

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

