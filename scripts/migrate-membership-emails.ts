/**
 * Migration Script: Update membership documents with userEmail from Appwrite Users
 * 
 * IMPORTANT LIMITATIONS:
 * - This script requires server-side access to Appwrite Users API
 * - Client-side React Native cannot access other users' email addresses
 * - You need to run this as a Cloud Function OR use Appwrite Server SDK
 * 
 * HOW TO USE:
 * 1. Option A: Create as Appwrite Cloud Function (Recommended)
 *    - Copy this script to an Appwrite Cloud Function
 *    - Use Server SDK to access Users API
 *    - Schedule or trigger manually
 * 
 * 2. Option B: Run with Node.js using Server SDK
 *    - Install: npm install node-appwrite
 *    - Run: npx ts-node scripts/migrate-membership-emails.ts
 *    - Requires API keys from Appwrite Console
 */

import { Client, Databases, Users, Query } from 'node-appwrite';

// Configuration - Get these from Appwrite Console
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || ''; // Service account API key
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '';
const MEMBERSHIPS_COLLECTION_ID = 'memberships';

/**
 * Main migration function
 */
async function migrateMembershipEmails() {
  if (!APPWRITE_PROJECT_ID || !APPWRITE_API_KEY || !DATABASE_ID) {
    console.error('❌ Missing required environment variables:');
    console.error('   - APPWRITE_PROJECT_ID');
    console.error('   - APPWRITE_API_KEY');
    console.error('   - APPWRITE_DATABASE_ID');
    process.exit(1);
  }

  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY); // Use API key for server-side access

  const databases = new Databases(client);
  const users = new Users(client);

  try {
    console.log('🚀 Starting membership email migration...');
    
    // Get all membership documents
    const memberships = await databases.listDocuments(
      DATABASE_ID,
      MEMBERSHIPS_COLLECTION_ID,
      [Query.limit(100)] // Adjust limit as needed
    );

    console.log(`📋 Found ${memberships.total} membership documents`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Process each membership
    for (const membership of memberships.documents) {
      try {
        const userId = membership.userId;
        
        // Skip if email already exists
        if (membership.userEmail) {
          console.log(`⏭️  Skipping ${membership.$id} - already has email: ${membership.userEmail}`);
          skipped++;
          continue;
        }

        // Get user info from Appwrite Users API
        let userEmail: string | null = null;
        try {
          const user = await users.get(userId);
          userEmail = user.email || null;
        } catch (userError: any) {
          console.warn(`⚠️  Could not get user ${userId}:`, userError.message);
          errors++;
          continue;
        }

        if (!userEmail) {
          console.warn(`⚠️  User ${userId} has no email address`);
          errors++;
          continue;
        }

        // Update membership document with email
        await databases.updateDocument(
          DATABASE_ID,
          MEMBERSHIPS_COLLECTION_ID,
          membership.$id,
          {
            userEmail: userEmail
          }
        );

        console.log(`✅ Updated ${membership.$id} with email: ${userEmail}`);
        updated++;

      } catch (error: any) {
        console.error(`❌ Error processing membership ${membership.$id}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('🎉 Migration complete!');

  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  migrateMembershipEmails()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { migrateMembershipEmails };

