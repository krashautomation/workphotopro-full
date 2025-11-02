/**
 * Migration Script: Update membership documents with userEmail, userName, and profilePicture from Appwrite Users
 * 
 * This script fetches user data from Appwrite Users API (server-side only) and caches it in our memberships table.
 * This allows the client-side app to display member names and avatars without needing server-side API calls.
 * 
 * Run this script with: node scripts/migrate-membership-emails.js
 * 
 * Make sure to set these environment variables:
 * - APPWRITE_ENDPOINT (defaults to https://cloud.appwrite.io/v1)
 * - APPWRITE_PROJECT_ID
 * - APPWRITE_API_KEY (Service account API key from Appwrite Console)
 * - APPWRITE_DATABASE_ID
 * 
 * BEFORE RUNNING:
 * 1. Add these fields to your memberships collection in Appwrite Console:
 *    - userName (String, optional, size 255)
 *    - profilePicture (String, optional, size 1000)
 */

const { Client, Databases, Users, Query } = require('node-appwrite');

// Load environment variables if .env file exists
try {
  require('dotenv').config();
} catch (e) {
  // dotenv is optional
}

// Configuration - Get these from Appwrite Console
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID || process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || '';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '';
const MEMBERSHIPS_COLLECTION_ID = 'memberships';

/**
 * Main migration function
 */
async function migrateMembershipEmails() {
  if (!APPWRITE_PROJECT_ID || !APPWRITE_API_KEY || !DATABASE_ID) {
    console.error('❌ Missing required environment variables:');
    console.error('   - APPWRITE_PROJECT_ID (or EXPO_PUBLIC_APPWRITE_PROJECT_ID)');
    console.error('   - APPWRITE_API_KEY (get this from Appwrite Console → Settings → API Keys)');
    console.error('   - APPWRITE_DATABASE_ID (or EXPO_PUBLIC_APPWRITE_DATABASE_ID)');
    console.error('\n💡 How to get API Key:');
    console.error('   1. Go to Appwrite Console');
    console.error('   2. Settings → API Keys');
    console.error('   3. Create new key with scopes: users.read, databases.read, databases.write');
    console.error('   4. Copy the key and set as APPWRITE_API_KEY environment variable');
    console.error('\n💡 You can also create a .env file in the project root with these variables.');
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
    console.log(`📋 Endpoint: ${APPWRITE_ENDPOINT}`);
    console.log(`📋 Project ID: ${APPWRITE_PROJECT_ID}`);
    console.log(`📋 Database ID: ${DATABASE_ID}`);
    console.log(`📋 Collection: ${MEMBERSHIPS_COLLECTION_ID}`);
    console.log(`📋 API Key: ${APPWRITE_API_KEY ? APPWRITE_API_KEY.substring(0, 10) + '...' : 'NOT SET'}\n`);
    
    // Test the API key by trying to list users first
    console.log('🔍 Testing API key permissions...');
    try {
      const testUsers = await users.list([Query.limit(1)]);
      console.log('✅ API key has users.read permission');
    } catch (testError) {
      console.error('❌ API key test failed:', testError.message);
      console.error('\n💡 This usually means:');
      console.error('   1. API key is incorrect or missing');
      console.error('   2. API key doesn\'t have the required scopes:');
      console.error('      - users.read');
      console.error('      - documents.read');
      console.error('      - documents.write');
      console.error('   3. API key is for a different project');
      console.error('\n💡 How to fix:');
      console.error('   1. Go to Appwrite Console → Settings → API Keys');
      console.error('   2. Edit your existing API key or create a new one');
      console.error('   3. Make sure ALL these scopes are selected:');
      console.error('      ✅ users.read (to read user emails)');
      console.error('      ✅ documents.read (to read membership documents)');
      console.error('      ✅ documents.write (to update membership documents)');
      console.error('   4. Save and update .env with the key');
      console.error('\n⚠️  NOTE: In Appwrite, you need "documents.read/write" not "databases.read/write"');
      throw testError;
    }
    
    // Test document read permission
    try {
      console.log('🔍 Testing document read permission...');
      await databases.listDocuments(DATABASE_ID, MEMBERSHIPS_COLLECTION_ID, [Query.limit(1)]);
      console.log('✅ API key has documents.read permission\n');
    } catch (docError) {
      console.error('❌ Document read test failed:', docError.message);
      console.error('\n💡 Your API key is missing the "documents.read" scope!');
      console.error('   1. Go to Appwrite Console → Settings → API Keys');
      console.error('   2. Edit your API key');
      console.error('   3. Make sure "documents.read" scope is CHECKED');
      console.error('   4. Save and try again\n');
      throw docError;
    }
    
    // Get all membership documents
    console.log('📋 Fetching membership documents...');
    const memberships = await databases.listDocuments(
      DATABASE_ID,
      MEMBERSHIPS_COLLECTION_ID,
      [Query.limit(100)] // Adjust limit as needed
    );

    console.log(`📋 Found ${memberships.total} membership documents\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Process each membership
    for (const membership of memberships.documents) {
      try {
        const userId = membership.userId;
        
        // Get user info from Appwrite Users API
        let userEmail = null;
        let userName = null;
        let profilePicture = null;
        
        try {
          const user = await users.get(userId);
          userEmail = user.email || null;
          userName = user.name || null;
          // Profile picture is stored in preferences
          profilePicture = user.prefs?.profilePicture || null;
        } catch (userError) {
          console.warn(`⚠️  Could not get user ${userId}:`, userError.message);
          errors++;
          continue;
        }

        // Prepare update data - only update fields that need updating
        const updateData = {};
        
        // Update email if missing or different
        if (userEmail && membership.userEmail !== userEmail) {
          updateData.userEmail = userEmail;
        }
        
        // Update name if missing or different (and user has a name)
        if (userName && userName.trim() && membership.userName !== userName) {
          updateData.userName = userName.trim();
        }
        
        // Update profile picture if missing or different
        if (profilePicture && membership.profilePicture !== profilePicture) {
          updateData.profilePicture = profilePicture;
        }

        // Skip if nothing to update
        if (Object.keys(updateData).length === 0) {
          const skipReason = [];
          if (membership.userEmail) skipReason.push('email exists');
          if (membership.userName) skipReason.push('name exists');
          if (membership.profilePicture) skipReason.push('profilePicture exists');
          console.log(`⏭️  Skipping ${membership.$id} - ${skipReason.join(', ')}`);
          skipped++;
          continue;
        }

        if (!userEmail) {
          console.warn(`⚠️  User ${userId} has no email address - skipping`);
          errors++;
          continue;
        }

        // Update membership document with user data
        await databases.updateDocument(
          DATABASE_ID,
          MEMBERSHIPS_COLLECTION_ID,
          membership.$id,
          updateData
        );

        const updates = [];
        if (updateData.userEmail) updates.push(`email: ${updateData.userEmail}`);
        if (updateData.userName) updates.push(`name: ${updateData.userName}`);
        if (updateData.profilePicture) updates.push(`profilePicture: yes`);
        
        console.log(`✅ Updated ${membership.$id} - ${updates.join(', ')}`);
        updated++;

      } catch (error) {
        console.error(`❌ Error processing membership ${membership.$id}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('🎉 Migration complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateMembershipEmails()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

