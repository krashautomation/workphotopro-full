# 📱 Push Token Setup Instructions

## Step 1: Create Appwrite Collection (5 minutes)

Before the code can save push tokens, you need to create the collection in Appwrite:

### 1.1 Create Collection

1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Select your project
3. Go to **Databases** → Your Database
4. Click **"Create Collection"**
5. Name: `user_push_tokens`
6. Click **"Create"**

### 1.2 Add Attributes

Add these attributes to the collection:

| Attribute ID | Type | Size | Required | Array |
|-------------|------|------|----------|-------|
| `userId` | string | 255 | ✅ Yes | ❌ No |
| `token` | string | 2048 | ✅ Yes | ❌ No |
| `platform` | string | 50 | ✅ Yes | ❌ No |
| `createdAt` | datetime | - | ✅ Yes | ❌ No |
| `updatedAt` | datetime | - | ✅ Yes | ❌ No |

**Steps:**
1. Click **"Create Attribute"**
2. For each attribute above:
   - Select the Type
   - Enter the Attribute ID
   - Set Size (if applicable)
   - Check "Required" checkbox
   - Click **"Create"**

### 1.3 Set Permissions

Go to **Settings** → **Permissions**:

**Read:**
- Add: `users` (users can read their own tokens)

**Create:**
- Add: `users` (users can create their own tokens)

**Update:**
- Add: `users` (users can update their own tokens)
- Add query: `userId={{$userId}}` (users can only update their own)

**Delete:**
- Add: `users` (users can delete their own tokens)
- Add query: `userId={{$userId}}` (users can only delete their own)

### 1.4 Create Indexes (Optional but Recommended)

For better query performance:

1. Go to **Indexes** tab
2. Click **"Create Index"**
3. Add index:
   - **Key:** `userId_platform`
   - **Type:** `key`
   - **Attributes:** `userId`, `platform`
   - **Orders:** `ASC`, `ASC`
   - Click **"Create"**

## Step 2: Code is Already Set Up! ✅

The following files have been created:

- ✅ `hooks/useFCMToken.ts` - Hook to get and register push tokens
- ✅ `lib/appwrite/pushTokens.ts` - Service to save/retrieve tokens
- ✅ Integrated into `app/_layout.tsx` - Automatically registers tokens when user logs in

## Step 3: Test Push Token Registration

### 3.1 Run Your App

```bash
npm start
```

### 3.2 Check Console Logs

When a user signs in, you should see:
```
✅ Push token registered: ExponentPushToken[...
```

### 3.3 Verify in Appwrite

1. Go to **Databases** → `user_push_tokens` collection
2. You should see a document with:
   - `userId`: Your user ID
   - `token`: The Expo push token
   - `platform`: "android" or "ios"
   - `createdAt`: Current timestamp

## Step 4: Troubleshooting

### "Collection not found" Error

- Make sure you created the `user_push_tokens` collection
- Verify the collection ID matches exactly (case-sensitive)

### "Permission denied" Error

- Check collection permissions
- Make sure `users` have Create permission
- Verify user is authenticated

### Token Not Saving

- Check console logs for errors
- Verify user is logged in
- Check network connection
- Verify Appwrite endpoint is correct

### Token is null

- Check notification permissions are granted
- Verify `expo-notifications` is installed
- Check EAS project ID is correct in `.env`

## Next Steps

After push tokens are being saved:

1. ✅ Verify tokens are saved in Appwrite Database
2. ⏳ Set up Appwrite Messaging provider (if not done)
3. ⏳ Create messaging service to send notifications
4. ⏳ Test sending a push notification

See `APPWRITE_MESSAGING_SETUP.md` for next steps!

