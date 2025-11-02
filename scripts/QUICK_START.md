# ⚡ Quick Start - Run Migration Now

## Your .env file already has:
✅ `EXPO_PUBLIC_APPWRITE_PROJECT_ID` - Found!
✅ `EXPO_PUBLIC_APPWRITE_DATABASE_ID` - Found!
✅ `EXPO_PUBLIC_APPWRITE_ENDPOINT` - Found!

## You just need to add:

### Step 1: Get API Key (2 minutes)

1. **Open**: https://sfo.cloud.appwrite.io (your Appwrite endpoint)
2. **Login** and select your project
3. **Go to**: Settings → API Keys
4. **Click**: "Create API Key"
5. **Name**: `Migration Script Key`
6. **Select scopes** (IMPORTANT - select all three):
   - ✅ `users.read` (to read user emails)
   - ✅ `documents.read` (to read membership documents)
   - ✅ `documents.write` (to update membership documents)
   
   **⚠️ Note:** You need `documents.read/write`, not `databases.read/write`!
7. **Click**: "Create"
8. **Copy the key** (starts with something like `secret_...`)

### Step 2: Add to .env file

Add this line to your `.env` file:
```env
APPWRITE_API_KEY=your_copied_api_key_here
```

### Step 3: Run the Script

```bash
npm run migrate-membership-emails
```

That's it! 🎉

The script will:
- ✅ Get all memberships
- ✅ Get each user's email from Appwrite
- ✅ Update membership documents with emails
- ✅ Show you a summary

