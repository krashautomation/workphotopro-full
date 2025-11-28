# Appwrite Function Code for Push Notifications

## Function: send-push-notification

### Step 1: Create Function in Appwrite Console

1. Go to **Functions** → **Create Function**
2. Name: `send-push-notification`
3. Runtime: **Node.js 18.0** (or latest)
4. Click **"Create"**

### Step 2: Add Function Code

Replace the default function code with this:

```javascript
const { google } = require('googleapis');

/**
 * Send push notification using Expo Push API
 * 
 * @param {Object} req - Appwrite function request
 * @param {Object} res - Appwrite function response
 */
module.exports = async (req, res) => {
  try {
    // Parse request body
    const payload = JSON.parse(req.payload || '{}');
    const { expoPushToken, title, body, data } = payload;

    // Validate required fields
    if (!expoPushToken || !title || !body) {
      return res.json({
        success: false,
        error: 'Missing required fields: expoPushToken, title, body'
      }, 400);
    }

    // Get Firebase Service Account Key from environment
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      return res.json({
        success: false,
        error: 'FIREBASE_SERVICE_ACCOUNT_KEY not configured'
      }, 500);
    }

    const serviceAccount = JSON.parse(serviceAccountKey);

    // Send via Expo Push API (Expo handles FCM conversion automatically)
    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: expoPushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data || {},
      }),
    });

    const result = await expoResponse.json();

    if (result.data && result.data.status === 'ok') {
      return res.json({
        success: true,
        messageId: result.data.id,
      });
    } else {
      return res.json({
        success: false,
        error: result.errors || 'Failed to send notification',
      }, 500);
    }

  } catch (error) {
    console.error('Push notification error:', error);
    return res.json({
      success: false,
      error: error.message,
    }, 500);
  }
};
```

### Step 3: Install Dependencies

In your Appwrite Function, you don't need to install `googleapis` for basic Expo Push API usage. The function above uses Expo Push API directly, which doesn't require Firebase authentication (Expo handles it).

However, if you want to use Firebase V1 API directly later, add to `package.json`:

```json
{
  "dependencies": {
    "googleapis": "^126.0.0"
  }
}
```

### Step 4: Deploy Function

1. Click **"Deploy"** in your function
2. Wait for deployment to complete
3. Note your **Function ID** - you'll need it to call the function

### Step 5: Test Function

You can test it by calling it with:

```bash
curl -X POST https://cloud.appwrite.io/v1/functions/{FUNCTION_ID}/executions \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: {PROJECT_ID}" \
  -d '{
    "data": "{\"expoPushToken\":\"ExponentPushToken[...]\",\"title\":\"Test\",\"body\":\"Hello World\"}"
  }'
```

Replace:
- `{FUNCTION_ID}` with your function ID
- `{PROJECT_ID}` with your Appwrite project ID
- `ExponentPushToken[...]` with a real Expo push token from your app

## Next Steps

After creating the function:
1. ✅ Install `expo-notifications` in your app
2. ✅ Create push token registration hook
3. ✅ Store push tokens in Appwrite Database
4. ✅ Call this function when events happen (new task, message, etc.)

