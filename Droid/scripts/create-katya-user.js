/**
 * Create Katya User Account Script
 * 
 * This script creates Katya's user account in Appwrite.
 * Run this before deploying the Cloud Function.
 * 
 * Usage:
 *   node create-katya-user.js
 * 
 * Requirements:
 *   - .env file with Appwrite credentials
 *   - node-appwrite package installed
 */

require('dotenv').config();
const { Client, Account, ID } = require('node-appwrite');
const crypto = require('crypto');

// Configuration from environment variables
const APPWRITE_ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
// Support both APPWRITE_DROID_API_KEY and APPWRITE_API_KEY
const APPWRITE_API_KEY = process.env.APPWRITE_DROID_API_KEY || process.env.APPWRITE_API_KEY;

// Katya user details
const KATYA_EMAIL = 'katya@workphotopro.ai';
const KATYA_NAME = 'Katya';
const KATYA_PASSWORD = generateSecurePassword();

/**
 * Generate a secure random password
 */
function generateSecurePassword(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Main function
 */
async function createKatyaUser() {
  try {
    console.log('🤖 Creating Katya user account...\n');
    
    // Validate environment variables
    if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
      throw new Error('Missing required environment variables. Please check your .env file.');
    }
    
    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID)
      .setKey(APPWRITE_API_KEY);
    
    const account = new Account(client);
    
    // Check if user already exists
    console.log('🔍 Checking if Katya user already exists...');
    try {
      // Try to create user (will fail if exists)
      const user = await account.create(
        ID.unique(),
        KATYA_EMAIL,
        KATYA_PASSWORD,
        KATYA_NAME
      );
      
      console.log('✅ Katya user created successfully!\n');
      console.log('📋 User Details:');
      console.log('   User ID:', user.$id);
      console.log('   Email:', user.email);
      console.log('   Name:', user.name);
      console.log('   Password:', KATYA_PASSWORD);
      console.log('\n⚠️  IMPORTANT: Save these credentials securely!');
      console.log('   You will need them for the Cloud Function environment variables.\n');
      
      // Save to file (optional)
      const fs = require('fs');
      const credentials = {
        userId: user.$id,
        email: user.email,
        password: KATYA_PASSWORD,
        createdAt: new Date().toISOString()
      };
      
      fs.writeFileSync(
        'katya-credentials.json',
        JSON.stringify(credentials, null, 2)
      );
      
      console.log('💾 Credentials saved to katya-credentials.json');
      console.log('   (Make sure to add this file to .gitignore!)\n');
      
      return user;
      
    } catch (error) {
      if (error.code === 409) {
        console.log('⚠️  Katya user already exists!');
        console.log('   If you need to reset the password, delete the user first in Appwrite Console.\n');
        
        // Try to get existing user
        // Note: This requires admin access or knowing the user ID
        console.log('   To get the existing user ID:');
        console.log('   1. Go to Appwrite Console → Auth → Users');
        console.log('   2. Search for:', KATYA_EMAIL);
        console.log('   3. Copy the User ID\n');
        
        return null;
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error('❌ Error creating Katya user:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check your .env file has correct Appwrite credentials');
    console.error('2. Ensure APPWRITE_API_KEY has admin permissions');
    console.error('3. Verify APPWRITE_ENDPOINT and APPWRITE_PROJECT_ID are correct\n');
    process.exit(1);
  }
}

// Run script
if (require.main === module) {
  createKatyaUser()
    .then(() => {
      console.log('✨ Done!\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { createKatyaUser };

