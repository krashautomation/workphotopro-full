# Katya AI Agent Setup Guide

Complete setup instructions for deploying Katya to your WorkPhotoPro app.

## Prerequisites

- Appwrite Cloud account (free tier works)
- OpenAI API account (or other AI provider)
- Access to Appwrite Console
- Node.js installed (for setup scripts)

---

## Step 1: Create Katya User Account

Katya needs a user account in Appwrite to post messages.

### Option A: Using Setup Script (Recommended)

```bash
cd Droid/scripts
node create-katya-user.js
```

The script will:
- Create Katya user account (`katya@workphotopro.ai`)
- Generate secure password
- Store credentials securely
- Return Katya's user ID (save this!)

### Option B: Manual Creation

1. Go to **Appwrite Console** → **Auth** → **Users**
2. Click **"Create User"**
3. Fill in:
   - **Email**: `katya@workphotopro.ai`
   - **Password**: Generate a secure password (save it!)
   - **Name**: `Katya`
4. Copy the **User ID** (you'll need this for the function)

**Save these credentials:**
- Katya User ID
- Katya Email
- Katya Password

---

## Step 2: Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign up or log in
3. Go to **API Keys** → **Create new secret key**
4. Copy the key (starts with `sk-...`)
5. **Important**: Save this key securely - you won't see it again!

---

## Step 3: Create Appwrite Cloud Function

### 3.1 Create Function in Console

1. Go to **Appwrite Console** → **Functions**
2. Click **"Create Function"**
3. Fill in:
   - **Name**: `katya-ai-agent`
   - **Runtime**: `Node.js 18.0` (or latest)
4. Click **"Create"**

### 3.2 Add Function Code

1. In your function, go to **Settings** → **Code**
2. Copy the contents of `Droid/function/index.js`
3. Paste into the function code editor
4. Save

### 3.3 Configure Environment Variables

Go to **Settings** → **Variables** and add:

| Key | Value | Description |
|-----|-------|-------------|
| `OPENAI_API_KEY` | `sk-...` | Your OpenAI API key |
| `KATYA_USER_ID` | `...` | Katya's Appwrite User ID |
| `KATYA_EMAIL` | `katya@workphotopro.ai` | Katya's email |
| `KATYA_PASSWORD` | `...` | Katya's password |
| `APPWRITE_ENDPOINT` | `https://cloud.appwrite.io/v1` | Your Appwrite endpoint |
| `APPWRITE_PROJECT_ID` | `...` | Your Appwrite project ID |
| `APPWRITE_DATABASE_ID` | `...` | Your database ID |
| `APPWRITE_DROID_API_KEY` or `APPWRITE_API_KEY` | `...` | Server API key (from Appwrite Console → Settings → API Keys). Create key named `APPWRITE_DROID_API_KEY` with scopes: **Auth** (`users.write`, `sessions.write`), **Database** (`rows.read`, `rows.write`, `tables.read`), **Functions** (`execution.write`). Use either variable name in `.env` |

**Important**: Mark sensitive variables (API keys, passwords) as **"Encrypted"**.

### 3.4 Deploy Function

1. Click **"Deploy"** button
2. Wait for deployment to complete
3. Copy the **Function ID** (you'll need this for webhook)

---

## Step 4: Configure Webhook

The webhook triggers Katya when new messages are posted.

### 4.1 Create Webhook in Appwrite

1. Go to **Appwrite Console** → **Settings** → **Webhooks**
2. Click **"Create Webhook"**
3. Fill in:
   - **Name**: `katya-message-trigger`
   - **Events**: Select `databases.documents.create`
   - **URL**: `https://cloud.appwrite.io/v1/functions/{FUNCTION_ID}/executions`
     - Replace `{FUNCTION_ID}` with your function ID
   - **Security**: Enable **"Signature"** (recommended)
4. Click **"Create"**

### 4.2 Configure Webhook Filters (Optional)

To only trigger on messages collection:

1. Edit the webhook
2. Add **Filters**:
   - **Collection**: `messages`
   - **Database**: Your database ID

---

## Step 5: Test Katya

### 5.1 Test Message Creation

1. Open your app
2. Go to any job chat
3. Post a message: "Hey team, just finished the photos!"
4. Wait 5-10 seconds
5. Katya should respond!

### 5.2 Check Function Logs

1. Go to **Appwrite Console** → **Functions** → `katya-ai-agent`
2. Click **"Logs"** tab
3. Check for errors or success messages

### 5.3 Troubleshooting

**Katya doesn't respond:**
- Check function logs for errors
- Verify webhook is configured correctly
- Ensure Katya user ID is correct
- Check OpenAI API key is valid

**Rate limit errors:**
- Katya has built-in rate limiting (1 message per 5 human messages)
- This is normal behavior

**Cost concerns:**
- Check OpenAI usage dashboard
- Consider switching to GPT-3.5 Turbo (cheaper)
- Adjust rate limiting in function code

---

## Step 6: Configure Katya Behavior (Optional)

Edit `Droid/config/personality.ts` to customize:
- Response frequency
- Personality tone
- Trigger conditions
- Response types

Then update the function code with your changes.

---

## Step 7: Enable/Disable Per Team (Optional)

To allow teams to enable/disable Katya:

1. Add `katyaEnabled` field to `teams` collection (Boolean)
2. Update function to check this field before responding
3. Add UI toggle in team settings

---

## Security Best Practices

1. ✅ **Never commit** API keys or passwords to git
2. ✅ Use **encrypted** environment variables in Appwrite
3. ✅ Rotate API keys periodically
4. ✅ Monitor function execution logs
5. ✅ Set up **rate limiting** (already included)

---

## Cost Monitoring

### Appwrite Free Tier Limits
- **Function Executions**: 25,000/month
- **Database Documents**: 50,000
- **Storage**: 5GB

### OpenAI Usage
- Monitor at: https://platform.openai.com/usage
- Set up billing alerts
- Consider usage limits

---

## Next Steps

- Customize Katya's personality (see `config/personality.ts`)
- Add team-level enable/disable
- Create custom prompts for specific scenarios
- Monitor usage and costs

---

## Support

If you encounter issues:
1. Check function logs in Appwrite Console
2. Verify all environment variables are set
3. Test webhook manually
4. Check OpenAI API status

