# 🚀 Quick Start: Run Migration Script

## Step 1: Get API Key from Appwrite Console

1. **Go to Appwrite Console**: https://cloud.appwrite.io
2. **Select your project**
3. **Navigate to**: Settings → API Keys
4. **Click**: "Create API Key"
5. **Name it**: `Migration Script Key` (or any name)
6. **Select scopes**:
   - ✅ `users.read`
   - ✅ `databases.read`
   - ✅ `databases.write`
7. **Click**: "Create"
8. **⚠️ IMPORTANT**: Copy the key immediately (you won't see it again!)

## Step 2: Set Environment Variables

You have 3 options:

### Option A: Add to existing `.env` file (Easiest)

If you have a `.env` file, add these lines:

```env
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_API_KEY=paste_your_api_key_here
```

**Note:** The script will automatically use:
- `EXPO_PUBLIC_APPWRITE_PROJECT_ID` if `APPWRITE_PROJECT_ID` is not set
- `EXPO_PUBLIC_APPWRITE_DATABASE_ID` if `APPWRITE_DATABASE_ID` is not set

So you might only need to add `APPWRITE_API_KEY`.

### Option B: Set in terminal (Windows PowerShell)

```powershell
$env:APPWRITE_API_KEY="your_api_key_here"
```

Then run:
```bash
npm run migrate-membership-emails
```

### Option C: Set in terminal (Windows CMD)

```cmd
set APPWRITE_API_KEY=your_api_key_here
```

Then run:
```bash
npm run migrate-membership-emails
```

## Step 3: Run the Script

```bash
npm run migrate-membership-emails
```

Or directly:
```bash
node scripts/migrate-membership-emails.js
```

## Expected Output

You should see something like:

```
🚀 Starting membership email migration...
📋 Using database: 68e9e2d9003ae650f796
📋 Collection: memberships

📋 Found 2 membership documents

✅ Updated 68fd6cac002e6bb5fe54 with email: user@example.com
⏭️  Skipping 68fd6cad15eec4389a1b - already has email: another@example.com

📊 Migration Summary:
   ✅ Updated: 1
   ⏭️  Skipped: 1
   ❌ Errors: 0
🎉 Migration complete!
```

## Troubleshooting

### Missing API Key?
- Make sure you created and copied the API key
- Check that it's set in `.env` or as environment variable

### Missing Project/Database ID?
- Check your existing `.env` file for `EXPO_PUBLIC_APPWRITE_PROJECT_ID` and `EXPO_PUBLIC_APPWRITE_DATABASE_ID`
- The script will use those automatically

### Permission Errors?
- Make sure API key has all three scopes: `users.read`, `databases.read`, `databases.write`
- Check that collection permissions allow updates

### User Not Found?
- Some memberships might have invalid `userId`
- These will be shown as errors and skipped

## Success!

After running the script, your membership documents will have `userEmail` populated, and member names should display correctly in your app! 🎉

