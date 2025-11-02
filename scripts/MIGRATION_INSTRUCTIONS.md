# Migration Instructions: Update Memberships with User Data

## Step 1: Add Fields to Memberships Collection

Before running the migration script, you need to add these fields to your `memberships` collection in Appwrite Console:

### 1. Add `userName` field:
1. Go to Appwrite Console → Databases → `memberships` collection
2. Go to **Attributes** tab
3. Click **Create Attribute**
4. Select **String**
5. Set:
   - Attribute ID: `userName`
   - Size: `255`
   - Required: **No** (optional)
   - Default: None
   - Array: **No**
6. Click **Create**

### 2. Add `profilePicture` field:
1. Still in **Attributes** tab
2. Click **Create Attribute**
3. Select **String**
4. Set:
   - Attribute ID: `profilePicture`
   - Size: `1000` (to store URL)
   - Required: **No** (optional)
   - Default: None
   - Array: **No**
5. Click **Create**

## Step 2: Run the Migration Script

After adding the fields, run:

```bash
npm run migrate-membership-emails
```

The script will:
- ✅ Get all membership documents
- ✅ For each membership:
  - Get user's email from Appwrite Users API
  - Get user's name from Appwrite Users API
  - Get user's profile picture from Appwrite Users preferences
- ✅ Update membership documents with this data

## What Gets Updated

For each membership document, the script will update:
- `userEmail` - User's email address
- `userName` - User's display name (if they've set it in Appwrite)
- `profilePicture` - Profile picture URL (if they've set it in preferences)

## After Migration

Once the migration is complete:
1. Refresh your app
2. Member names should display correctly (using actual names instead of email prefixes)
3. Profile pictures should display correctly

## Re-running the Script

You can run this script multiple times - it will:
- ✅ Update fields that are missing
- ✅ Update fields that have changed
- ⏭️ Skip fields that already exist and match

This makes it safe to run periodically to keep user data in sync.

