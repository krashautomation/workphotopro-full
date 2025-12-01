# Katya Quick Start Guide

Get Katya up and running in 15 minutes!

## Prerequisites Checklist

- [ ] Appwrite Cloud account
- [ ] OpenAI API account (get key at https://platform.openai.com)
- [ ] Access to Appwrite Console
- [ ] Node.js installed (for setup script)

## Step-by-Step Setup

### 1. Create Katya User (2 minutes)

```bash
cd Droid/scripts
npm install dotenv node-appwrite  # If not already installed
node create-katya-user.js
```

**Save the output:**
- User ID
- Email
- Password

### 2. Get OpenAI API Key (1 minute)

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-...`)

### 3. Create Cloud Function (5 minutes)

1. **Appwrite Console** → **Functions** → **Create Function**
2. Name: `katya-ai-agent`
3. Runtime: `Node.js 18.0`
4. Copy code from `Droid/function/index.js`
5. Paste into function editor
6. Save

### 4. Configure Environment Variables (3 minutes)

**Functions** → **Settings** → **Variables** → Add:

```
OPENAI_API_KEY = sk-... (your OpenAI key)
KATYA_USER_ID = ... (from step 1)
KATYA_EMAIL = katya@workphotopro.ai
KATYA_PASSWORD = ... (from step 1)
APPWRITE_ENDPOINT = https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID = ... (your project ID)
APPWRITE_DATABASE_ID = ... (your database ID)
APPWRITE_DROID_API_KEY = ... (from Settings → API Keys - copy the key value, not the name)
```

**Mark as Encrypted**: API keys and passwords

### 5. Deploy Function (1 minute)

1. Click **"Deploy"**
2. Wait for deployment
3. Copy **Function ID**

### 6. Set Up Webhook (3 minutes)

1. **Settings** → **Webhooks** → **Create Webhook**
2. Name: `katya-message-trigger`
3. Events: `databases.documents.create`
4. URL: `https://cloud.appwrite.io/v1/functions/{FUNCTION_ID}/executions`
   - Replace `{FUNCTION_ID}` with your function ID
5. Filters:
   - Collection: `messages`
   - Database: Your database ID
6. Create

### 7. Test! (1 minute)

1. Open your app
2. Go to any job chat
3. Post: "Hey team, just finished the photos!"
4. Wait 5-10 seconds
5. Katya should respond! 🎉

## Verify It's Working

### Check Function Logs

1. **Functions** → `katya-ai-agent` → **Logs**
2. Look for:
   - ✅ "Katya function triggered"
   - ✅ "Katya responded successfully"

### Common Issues

**No response?**
- Check webhook is active
- Verify function is deployed
- Check logs for errors
- Ensure Katya user ID is correct

**Rate limited?**
- Normal! Katya waits for 5+ messages before responding
- Post a few more messages

**API errors?**
- Verify OpenAI API key is correct
- Check OpenAI account has credits
- Review function logs

## Next Steps

- Customize personality: Edit `Droid/config/personality.ts`
- Adjust rate limiting: Edit `Droid/function/index.js`
- Monitor costs: Check OpenAI usage dashboard
- Enable per-team: Add `katyaEnabled` field to teams collection

## Cost Estimate

- **Setup**: Free
- **Monthly**: ~$2-5 (GPT-3.5 Turbo, moderate usage)
- **Scales with**: Number of messages/day

## Need Help?

- See `SETUP.md` for detailed instructions
- See `ARCHITECTURE.md` for technical details
- Check Appwrite function logs
- Review OpenAI API status

---

**That's it! Katya is now live and ready to boost your team's morale! 🚀**

