/**
 * Get Test IDs Script
 * 
 * This script helps you get the actual IDs needed for testing the Katya function.
 * It will output IDs you can copy into the test-execution-payload.json file.
 * 
 * Usage:
 *   node Droid/scripts/get-test-ids.js
 */

require('dotenv').config();
const { Client, Databases, Query } = require('node-appwrite');

// Configuration from environment variables
const APPWRITE_ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
const APPWRITE_DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_DROID_API_KEY || process.env.APPWRITE_API_KEY;

async function getTestIds() {
  try {
    console.log('🔍 Fetching test IDs for Katya function execution...\n');
    
    if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_DATABASE_ID || !APPWRITE_API_KEY) {
      console.error('❌ Missing required environment variables');
      console.error('   Please check your .env file\n');
      process.exit(1);
    }
    
    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID)
      .setKey(APPWRITE_API_KEY);
    
    const databases = new Databases(client);
    
    // Get a recent message (to extract jobId, teamId, orgId)
    console.log('📋 Fetching recent message...');
    const messages = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      'messages',
      [
        Query.orderDesc('$createdAt'),
        Query.limit(1)
      ]
    );
    
    if (!messages.documents || messages.documents.length === 0) {
      console.log('⚠️  No messages found in database');
      console.log('   You need to create a message first, or manually fill in the IDs\n');
      console.log('📝 Template JSON (fill in manually):');
      console.log(JSON.stringify({
        events: ["databases.documents.create"],
        payload: {
          "$id": "test-message-123",
          "$collectionId": "messages",
          "senderId": "YOUR_USER_ID",
          "senderName": "Test User",
          "content": "Test message for Katya",
          "jobId": "YOUR_JOB_ID",
          "teamId": "YOUR_TEAM_ID",
          "orgId": "YOUR_ORG_ID",
          "$createdAt": new Date().toISOString()
        }
      }, null, 2));
      process.exit(0);
    }
    
    const recentMessage = messages.documents[0];
    
    console.log('✅ Found recent message\n');
    console.log('📋 Test Execution Payload:\n');
    console.log('='.repeat(70));
    
    const testPayload = {
      events: ["databases.documents.create"],
      payload: {
        "$id": `test-message-${Date.now()}`,
        "$collectionId": "messages",
        "senderId": recentMessage.senderId || "REPLACE_WITH_USER_ID",
        "senderName": recentMessage.senderName || "Test User",
        "senderPhoto": recentMessage.senderPhoto || "",
        "content": "Hey team! Testing Katya function. This is a test message!",
        "jobId": recentMessage.jobId || "REPLACE_WITH_JOB_ID",
        "teamId": recentMessage.teamId || "REPLACE_WITH_TEAM_ID",
        "orgId": recentMessage.orgId || "REPLACE_WITH_ORG_ID",
        "messageType": recentMessage.messageType || "text",
        "imageUrl": recentMessage.imageUrl || "",
        "imageUrls": recentMessage.imageUrls || [],
        "videoUrl": recentMessage.videoUrl || "",
        "audioFileId": recentMessage.audioFileId || "",
        "fileFileId": recentMessage.fileFileId || "",
        "$createdAt": new Date().toISOString(),
        "$updatedAt": new Date().toISOString()
      }
    };
    
    console.log(JSON.stringify(testPayload, null, 2));
    console.log('='.repeat(70));
    
    console.log('\n📋 Extracted Values:');
    console.log(`   senderId: ${recentMessage.senderId || 'NOT FOUND'}`);
    console.log(`   jobId: ${recentMessage.jobId || 'NOT FOUND'}`);
    console.log(`   teamId: ${recentMessage.teamId || 'NOT FOUND'}`);
    console.log(`   orgId: ${recentMessage.orgId || 'NOT FOUND'}`);
    
    console.log('\n💡 Copy the JSON above into the Body field in Appwrite Console');
    console.log('   Make sure to use a different senderId than Katya\'s user ID\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n📝 Fallback Template JSON:');
    console.log(JSON.stringify({
      events: ["databases.documents.create"],
      payload: {
        "$id": "test-message-123",
        "$collectionId": "messages",
        "senderId": "YOUR_USER_ID",
        "senderName": "Test User",
        "content": "Test message for Katya",
        "jobId": "YOUR_JOB_ID",
        "teamId": "YOUR_TEAM_ID",
        "orgId": "YOUR_ORG_ID",
        "$createdAt": new Date().toISOString()
      }
    }, null, 2));
    process.exit(1);
  }
}

if (require.main === module) {
  getTestIds();
}

module.exports = { getTestIds };

