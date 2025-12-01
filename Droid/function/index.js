/**
 * Katya AI Agent - Appwrite Cloud Function
 * 
 * This function listens to message events via webhook and generates
 * AI responses using OpenAI GPT-3.5 Turbo.
 * 
 * Setup:
 * 1. Deploy this function in Appwrite Console
 * 2. Configure environment variables (see SETUP.md)
 * 3. Set up webhook to trigger on message creation
 */

const { Client, Databases, Account, ID, Query } = require('node-appwrite');

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const KATYA_USER_ID = process.env.KATYA_USER_ID;
const KATYA_EMAIL = process.env.KATYA_EMAIL;
const KATYA_PASSWORD = process.env.KATYA_PASSWORD;
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
// Support both APPWRITE_DROID_API_KEY and APPWRITE_API_KEY
const APPWRITE_API_KEY = process.env.APPWRITE_DROID_API_KEY || process.env.APPWRITE_API_KEY;

// Rate limiting: Don't respond more than once per 3 human messages
const MIN_MESSAGES_BEFORE_RESPONSE = 3;
const MIN_TIME_BETWEEN_RESPONSES_MS = 60000; // 1 minute

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);
const account = new Account(client);

/**
 * Main function handler
 */
module.exports = async (req, res) => {
  try {
    console.log('🤖 Katya function triggered');
    
    // Parse webhook payload
    const payload = JSON.parse(req.payload || '{}');
    const event = payload.event || payload;
    
    console.log('📥 Event received:', event);
    
    // Verify this is a message creation event
    if (event.events && !event.events.includes('databases.documents.create')) {
      console.log('⏭️ Not a create event, skipping');
      return res.json({ success: true, message: 'Not a create event' }, 200);
    }
    
    // Get message data
    const message = event.payload || payload;
    
    // Skip if message is from Katya herself
    if (message.senderId === KATYA_USER_ID) {
      console.log('⏭️ Message from Katya, skipping');
      return res.json({ success: true, message: 'Message from Katya' }, 200);
    }
    
    // Extract job context
    const jobId = message.jobId;
    const teamId = message.teamId;
    const orgId = message.orgId;
    
    if (!jobId || !teamId || !orgId) {
      console.log('⏭️ Missing context, skipping');
      return res.json({ success: true, message: 'Missing context' }, 200);
    }
    
    console.log(`📋 Processing message for job: ${jobId}`);
    
    // Check rate limiting
    const shouldRespond = await checkRateLimit(jobId, teamId, orgId);
    if (!shouldRespond) {
      console.log('⏭️ Rate limit check failed, skipping');
      return res.json({ success: true, message: 'Rate limited' }, 200);
    }
    
    // Get recent messages for context
    const recentMessages = await getRecentMessages(jobId, teamId, orgId);
    
    // Generate AI response
    const aiResponse = await generateAIResponse(recentMessages, message);
    
    if (!aiResponse) {
      console.log('⏭️ No AI response generated');
      return res.json({ success: true, message: 'No response needed' }, 200);
    }
    
    // Post Katya's response
    await postKatyaMessage(jobId, teamId, orgId, aiResponse);
    
    console.log('✅ Katya responded successfully');
    return res.json({ 
      success: true, 
      message: 'Katya responded',
      response: aiResponse.substring(0, 50) + '...'
    }, 200);
    
  } catch (error) {
    console.error('❌ Error in Katya function:', error);
    return res.json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, 500);
  }
};

/**
 * Check rate limiting - don't respond too frequently
 */
async function checkRateLimit(jobId, teamId, orgId) {
  try {
    // Get recent messages in this job
    const recentMessages = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      'messages',
      [
        Query.equal('jobId', jobId),
        Query.equal('teamId', teamId),
        Query.equal('orgId', orgId),
        Query.orderDesc('$createdAt'),
        Query.limit(10)
      ]
    );
    
    // Count human messages (not from Katya)
    const humanMessages = recentMessages.documents.filter(
      msg => msg.senderId !== KATYA_USER_ID
    );
    
    // Count Katya messages
    const katyaMessages = recentMessages.documents.filter(
      msg => msg.senderId === KATYA_USER_ID
    );
    
    // Don't respond if we've responded recently
    if (katyaMessages.length > 0) {
      const lastKatyaMessage = katyaMessages[0];
      const timeSinceLastResponse = Date.now() - new Date(lastKatyaMessage.$createdAt).getTime();
      
      if (timeSinceLastResponse < MIN_TIME_BETWEEN_RESPONSES_MS) {
        console.log('⏸️ Too soon since last response');
        return false;
      }
    }
    
    // Need at least N human messages before responding
    if (humanMessages.length < MIN_MESSAGES_BEFORE_RESPONSE) {
      console.log(`⏸️ Not enough messages yet (${humanMessages.length}/${MIN_MESSAGES_BEFORE_RESPONSE})`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return false; // Fail safe - don't respond if we can't check
  }
}

/**
 * Get recent messages for context
 */
async function getRecentMessages(jobId, teamId, orgId) {
  try {
    const messages = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      'messages',
      [
        Query.equal('jobId', jobId),
        Query.equal('teamId', teamId),
        Query.equal('orgId', orgId),
        Query.orderDesc('$createdAt'),
        Query.limit(20) // Last 20 messages for context
      ]
    );
    
    // Reverse to get chronological order
    return messages.documents.reverse();
  } catch (error) {
    console.error('Error getting recent messages:', error);
    return [];
  }
}

/**
 * Generate AI response using OpenAI
 */
async function generateAIResponse(recentMessages, currentMessage) {
  try {
    // Build conversation context
    const conversationContext = recentMessages.map(msg => ({
      role: msg.senderId === KATYA_USER_ID ? 'assistant' : 'user',
      name: msg.senderName || 'User',
      content: msg.content || '[Media message]'
    }));
    
    // Add current message
    conversationContext.push({
      role: 'user',
      name: currentMessage.senderName || 'User',
      content: currentMessage.content || '[Media message]'
    });
    
    // Build system prompt
    const systemPrompt = `You are Katya, a friendly and supportive AI assistant for WorkPhotoPro, a work photo management app. Your role is to:
- Comment on photos and work updates with enthusiasm
- Ask helpful questions about project progress
- Boost team morale with encouragement and recognition
- Be concise (1-2 sentences max)
- Be professional but warm and friendly
- Use emojis sparingly (1-2 max per message)
- Don't be overly chatty - only respond when it adds value

Keep responses natural and conversational. Don't repeat yourself.`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationContext.slice(-10) // Last 10 messages for context
        ],
        max_tokens: 150, // Keep responses short
        temperature: 0.7 // Balanced creativity
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return null;
    }
    
    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content?.trim();
    
    if (!aiMessage) {
      console.log('No message from OpenAI');
      return null;
    }
    
    // Don't respond if message is too short or seems like an error
    if (aiMessage.length < 5) {
      return null;
    }
    
    return aiMessage;
    
  } catch (error) {
    console.error('Error generating AI response:', error);
    return null;
  }
}

/**
 * Post Katya's message to the chat
 */
async function postKatyaMessage(jobId, teamId, orgId, content) {
  try {
    // Create session as Katya user
    // Note: In production, you might want to use a service account or pre-authenticated session
    // For now, we'll use the API key which should have permissions to create messages
    
    // Get Katya's user info (for senderName and senderPhoto)
    let katyaName = 'Katya';
    let katyaPhoto = '';
    
    try {
      // Try to get user info - this might require different permissions
      // For now, use defaults
    } catch (error) {
      console.log('Could not fetch Katya user info, using defaults');
    }
    
    // Create message document
    const messageData = {
      content: content,
      senderId: KATYA_USER_ID,
      senderName: katyaName,
      senderPhoto: katyaPhoto,
      jobId: jobId,
      teamId: teamId,
      orgId: orgId,
      messageType: 'text'
    };
    
    const message = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      'messages',
      ID.unique(),
      messageData
    );
    
    console.log('✅ Message posted:', message.$id);
    return message;
    
  } catch (error) {
    console.error('Error posting Katya message:', error);
    throw error;
  }
}

