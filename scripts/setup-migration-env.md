# Quick Setup Guide for Migration Script

## Step 1: Get API Key from Appwrite Console

1. Go to https://cloud.appwrite.io
2. Select your project
3. Go to **Settings** → **API Keys**
4. Click **Create API Key**
5. Name it: `Migration Script Key`
6. Select these scopes:
   - ✅ `users.read` - To read user email addresses
   - ✅ `databases.read` - To read membership documents  
   - ✅ `databases.write` - To update membership documents
7. Click **Create**
8. **Copy the key** (you won't see it again!)

## Step 2: Set Environment Variables

### Option A: Create `.env` file (Recommended)

Create a `.env` file in the project root:

```env
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id_here
APPWRITE_API_KEY=your_api_key_here
APPWRITE_DATABASE_ID=your_database_id_here
```

**Note:** Your project ID and database ID might already be in `.env` as:
- `EXPO_PUBLIC_APPWRITE_PROJECT_ID`
- `EXPO_PUBLIC_APPWRITE_DATABASE_ID`

The script will use those if `APPWRITE_PROJECT_ID` and `APPWRITE_DATABASE_ID` are not set.

### Option B: Set environment variables in terminal

**Windows PowerShell:**
```powershell
$env:APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
$env:APPWRITE_PROJECT_ID="your_project_id"
$env:APPWRITE_API_KEY="your_api_key"
$env:APPWRITE_DATABASE_ID="your_database_id"
```

**Windows CMD:**
```cmd
set APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
set APPWRITE_PROJECT_ID=your_project_id
set APPWRITE_API_KEY=your_api_key
set APPWRITE_DATABASE_ID=your_database_id
```

**macOS/Linux:**
```bash
export APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
export APPWRITE_PROJECT_ID="your_project_id"
export APPWRITE_API_KEY="your_api_key"
export APPWRITE_DATABASE_ID="your_database_id"
```

## Step 3: Run the Script

```bash
npm run migrate-membership-emails
```

Or directly:
```bash
node scripts/migrate-membership-emails.js
```

## What the Script Does

1. ✅ Gets all membership documents
2. ✅ For each membership:
   - Checks if `userEmail` already exists (skips if yes)
   - Gets user's email from Appwrite Users API
   - Updates membership document with email
3. ✅ Shows progress and summary

## Troubleshooting

### "Missing required environment variables"
- Make sure you set all required variables
- Check `.env` file exists and has correct values

### "Could not get user"
- User might not exist in Appwrite
- Check that `userId` matches a real user

### "User has no email address"
- Some users might not have email set
- These will be skipped (shown as errors)

### Permission Errors
- Make sure API key has correct scopes
- Check collection permissions allow updates

