/**
 * Set Katya Profile Photo Script
 * 
 * This script sets Katya's profile picture by either:
 * 1. Uploading an image file to Appwrite Storage
 * 2. Using a publicly accessible image URL
 * 
 * Usage:
 *   # Upload from file:
 *   node set-katya-profile-photo.js --file path/to/image.jpg
 * 
 *   # Use URL:
 *   node set-katya-profile-photo.js --url https://example.com/katya.jpg
 * 
 * Requirements:
 *   - .env file with Appwrite credentials
 *   - node-appwrite package installed
 *   - For file upload: EXPO_PUBLIC_APPWRITE_BUCKET_ID in .env
 */

require('dotenv').config();
const { Client, Account, Storage, ID, Users, InputFile, Databases, Query } = require('node-appwrite');
const fs = require('fs');
const path = require('path');

// Configuration from environment variables
const APPWRITE_ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
const APPWRITE_BUCKET_ID = process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID || process.env.APPWRITE_BUCKET_ID;
const APPWRITE_DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_DROID_API_KEY || process.env.APPWRITE_API_KEY;

// Katya user details
const KATYA_EMAIL = 'katya@workphotopro.ai';
const KATYA_PASSWORD = process.env.KATYA_PASSWORD; // Should be in .env or katya-credentials.json

/**
 * Get Katya's user ID and password from credentials file or environment
 */
function getKatyaCredentials() {
  // Try to read from katya-credentials.json first
  try {
    const credentialsPath = path.join(__dirname, '..', '..', 'katya-credentials.json');
    if (fs.existsSync(credentialsPath)) {
      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      return {
        userId: credentials.userId,
        password: credentials.password
      };
    }
  } catch (error) {
    console.log('⚠️  Could not read katya-credentials.json, trying environment variables...');
  }
  
  // Fallback to environment variables
  if (KATYA_PASSWORD) {
    // We'll need to find the user ID - try to get it from Users API
    return {
      userId: null, // Will be fetched
      password: KATYA_PASSWORD
    };
  }
  
  throw new Error('Could not find Katya credentials. Please ensure KATYA_PASSWORD is in .env or katya-credentials.json exists.');
}

/**
 * Upload image file to Appwrite Storage
 */
async function uploadImageToStorage(storage, filePath) {
  console.log('📤 Uploading image to Appwrite Storage...');
  console.log('   File:', filePath);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  if (!APPWRITE_BUCKET_ID) {
    throw new Error('APPWRITE_BUCKET_ID not configured. Please add EXPO_PUBLIC_APPWRITE_BUCKET_ID to your .env file.');
  }
  
  const fileName = path.basename(filePath);
  const fileId = ID.unique();
  
  // Create InputFile from file path (node-appwrite way)
  const file = InputFile.fromPath(filePath, fileName);
  
  // Upload to storage
  const uploadResponse = await storage.createFile(
    APPWRITE_BUCKET_ID,
    fileId,
    file
  );
  
  console.log('✅ Image uploaded successfully!');
  console.log('   File ID:', uploadResponse.$id);
  
  // Generate file URL
  const fileUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BUCKET_ID}/files/${uploadResponse.$id}/view?project=${APPWRITE_PROJECT_ID}`;
  
  console.log('   File URL:', fileUrl);
  
  return fileUrl;
}


/**
 * Find Katya's user ID by email
 */
async function findKatyaUserId(users) {
  console.log('🔍 Finding Katya user by email...');
  
  try {
    // List users and find Katya
    const usersList = await users.list();
    const katyaUser = usersList.users.find(user => user.email === KATYA_EMAIL);
    
    if (!katyaUser) {
      throw new Error(`User with email ${KATYA_EMAIL} not found. Please run create-katya-user.js first.`);
    }
    
    console.log('✅ Found Katya user:', katyaUser.$id);
    return katyaUser.$id;
  } catch (error) {
    console.error('❌ Error finding Katya user:', error.message);
    throw error;
  }
}

/**
 * Update Katya's profile picture
 */
async function updateKatyaProfilePicture(profilePictureUrl) {
  try {
    console.log('🤖 Setting Katya profile picture...\n');
    
    // Validate environment variables
    if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
      throw new Error('Missing required environment variables. Please check your .env file.');
    }
    
    // Initialize Appwrite client (admin)
    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID)
      .setKey(APPWRITE_API_KEY);
    
    const users = new Users(client);
    const storage = new Storage(client);
    
    // Get Katya credentials
    let credentials = null;
    try {
      credentials = getKatyaCredentials();
    } catch (error) {
      console.log('⚠️  Could not get credentials, will find user ID...');
    }
    
    // Find Katya's user ID
    const katyaUserId = credentials?.userId || await findKatyaUserId(users);
    
    // Get current user to check preferences
    const katyaUser = await users.get(katyaUserId);
    console.log('📋 Current user preferences:', katyaUser.prefs || 'None');
    
    // Update user preferences with profile picture
    const updatedPrefs = {
      ...(katyaUser.prefs || {}),
      profilePicture: profilePictureUrl,
      profilePictureUpdated: new Date().toISOString()
    };
    
    console.log('🔄 Updating user preferences...');
    await users.updatePrefs(katyaUserId, updatedPrefs);
    
    // Also update membership data to sync profile picture
    if (APPWRITE_DATABASE_ID) {
      try {
        console.log('🔄 Syncing profile picture to membership data...');
        const databases = new Databases(client);
        
        // Find all memberships for Katya
        const memberships = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          'memberships',
          [Query.equal('userId', katyaUserId)]
        );
        
        if (memberships.documents && memberships.documents.length > 0) {
          // Update all memberships with Katya's profile picture
          const updatePromises = memberships.documents.map((membership) =>
            databases.updateDocument(
              APPWRITE_DATABASE_ID,
              'memberships',
              membership.$id,
              { profilePicture: profilePictureUrl }
            )
          );
          
          await Promise.all(updatePromises);
          console.log(`✅ Updated ${memberships.documents.length} membership record(s) with profile picture`);
        } else {
          console.log('⚠️  No membership records found for Katya (she may not be added to any teams yet)');
        }
      } catch (error) {
        console.warn('⚠️  Could not sync profile picture to membership data:', error.message);
        console.warn('   Profile picture is set in user preferences, but may not appear in team views until synced');
      }
    } else {
      console.log('⚠️  APPWRITE_DATABASE_ID not set - skipping membership data sync');
    }
    
    console.log('✅ Profile picture updated successfully!\n');
    console.log('📋 Profile Picture URL:', profilePictureUrl);
    console.log('\n✨ Katya now has a profile picture!');
    
  } catch (error) {
    console.error('❌ Error setting profile picture:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check your .env file has correct Appwrite credentials');
    console.error('2. Ensure APPWRITE_API_KEY has users.write and storage.write permissions');
    console.error('3. Verify Katya user exists (run create-katya-user.js first)');
    console.error('4. For file upload: Ensure EXPO_PUBLIC_APPWRITE_BUCKET_ID is set\n');
    process.exit(1);
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  let filePath = null;
  let imageUrl = null;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && args[i + 1]) {
      filePath = args[i + 1];
      i++;
    } else if (args[i] === '--url' && args[i + 1]) {
      imageUrl = args[i + 1];
      i++;
    }
  }
  
  if (!filePath && !imageUrl) {
    console.error('❌ Error: Please provide either --file or --url option\n');
    console.log('Usage:');
    console.log('  node set-katya-profile-photo.js --file path/to/image.jpg');
    console.log('  node set-katya-profile-photo.js --url https://example.com/katya.jpg\n');
    process.exit(1);
  }
  
  // Initialize Appwrite client
  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);
  
  const storage = new Storage(client);
  
  // Get profile picture URL
  let profilePictureUrl;
  
  if (filePath) {
    // Upload file to storage
    profilePictureUrl = await uploadImageToStorage(storage, filePath);
  } else {
    // Use provided URL
    profilePictureUrl = imageUrl;
    console.log('📋 Using provided URL:', profilePictureUrl);
  }
  
  // Update Katya's profile picture
  await updateKatyaProfilePicture(profilePictureUrl);
}

// Run script
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✨ Done!\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { updateKatyaProfilePicture, uploadImageToStorage };

