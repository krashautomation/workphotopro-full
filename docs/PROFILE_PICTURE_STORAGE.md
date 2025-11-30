# Profile Picture Storage Guide

## Where Profile Pictures Are Stored

When you upload a profile picture from `profile-settings.tsx`, here's what happens:

### 1. **File Storage Location**

The actual image file is stored in **Appwrite Storage**:

- **Storage Service**: Appwrite Cloud Storage
- **Bucket ID**: Configured via `EXPO_PUBLIC_APPWRITE_BUCKET_ID` environment variable
- **File Location**: `storage/buckets/{BUCKET_ID}/files/{FILE_ID}`

### 2. **File Upload Process**

When you upload a profile picture:

1. **File Creation**:
   - A unique file ID is generated: `ID.unique()`
   - Filename format: `avatar-{userId}-{timestamp}.jpg`
   - Example: `avatar-68edb64900262f8c728a-1704067200000.jpg`

2. **Upload to Storage**:
   ```typescript
   storage.createFile(
     appwriteConfig.bucket,  // Your bucket ID
     fileId,                 // Unique file ID
     file                    // File object with URI, name, type, size
   )
   ```

3. **URL Generation**:
   ```typescript
   const fileUrl = `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`
   ```

### 3. **URL Storage Location**

The profile picture URL is stored in **Appwrite User Preferences**:

- **Location**: `user.prefs.profilePicture`
- **Updated via**: `account.updatePrefs({ profilePicture: fileUrl })`
- **Additional metadata**: `user.prefs.profilePictureUpdated` (ISO timestamp)

## How to Find Your Profile Picture URL

### Option 1: Check Console Logs

After uploading, check your console for these logs:
```
🔄 Generated public file URL: https://sfo.cloud.appwrite.io/v1/storage/buckets/{BUCKET_ID}/files/{FILE_ID}/view?project={PROJECT_ID}
✅ Updated profile picture: {URL}
```

### Option 2: Check Appwrite Console

1. Go to **Appwrite Console** → **Storage** → Your Bucket
2. Find files with name pattern: `avatar-{userId}-*.jpg`
3. Click on the file to see details
4. Copy the **View URL** or **Download URL**

### Option 3: Check User Preferences in Appwrite Console

**Important**: Appwrite Auth does NOT have a built-in "profile picture" field. Profile pictures are stored in **User Preferences** (a JSON object).

To view preferences:

1. Go to **Appwrite Console** → **Auth** → **Users**
2. Find your user account
3. Click on the user to view details
4. Look for the **Preferences** field (it's a JSON object)
5. Click to expand or view the JSON - you'll see:
   ```json
   {
     "profilePicture": "https://sfo.cloud.appwrite.io/v1/storage/buckets/.../files/.../view?project=...",
     "profilePictureUpdated": "2024-01-01T12:00:00.000Z",
     "googleName": "...",
     "googleEmail": "..."
   }
   ```
6. The `profilePicture` field contains the full URL

**Note**: If you don't see a Preferences section, it means no preferences have been set yet. Preferences are only created when you call `account.updatePrefs()`.

### Option 4: Programmatically Retrieve

In your code, you can get the URL using:

```typescript
import { useAuth } from '@/context/AuthContext';

const { getUserProfilePicture } = useAuth();
const profilePictureUrl = await getUserProfilePicture();
console.log('Profile picture URL:', profilePictureUrl);
```

Or directly from user object:

```typescript
const { user } = useAuth();
const profilePictureUrl = user?.prefs?.profilePicture;
console.log('Profile picture URL:', profilePictureUrl);
```

## URL Format

The profile picture URL follows this format:

```
{ENDPOINT}/storage/buckets/{BUCKET_ID}/files/{FILE_ID}/view?project={PROJECT_ID}
```

**Example**:
```
https://sfo.cloud.appwrite.io/v1/storage/buckets/68edb74a002eee1e2eb0/files/68edb64900262f8c728a/view?project=68edb64900262f8c728a
```

Where:
- `{ENDPOINT}` = Your Appwrite endpoint (e.g., `https://sfo.cloud.appwrite.io/v1`)
- `{BUCKET_ID}` = Your storage bucket ID (from `EXPO_PUBLIC_APPWRITE_BUCKET_ID`)
- `{FILE_ID}` = Unique file ID generated during upload
- `{PROJECT_ID}` = Your Appwrite project ID (from `EXPO_PUBLIC_APPWRITE_PROJECT_ID`)

## Storage Bucket Configuration

Your bucket is configured via environment variable:

```env
EXPO_PUBLIC_APPWRITE_BUCKET_ID=your_bucket_id_here
```

To verify your bucket ID:
1. Check `.env` file in project root
2. Or check `utils/appwrite.ts` → `appwriteConfig.bucket`

## File Permissions

Make sure your storage bucket has these permissions:

- **Read**: Users (all authenticated users) or Public
- **Create**: Users (all authenticated users)
- **Update**: Users (all authenticated users) - if you want to allow updates
- **Delete**: Users (all authenticated users) - if you want to allow deletion

## Troubleshooting

### Profile picture not displaying?

1. **Check URL format**: Make sure the URL is complete and includes `?project={PROJECT_ID}`
2. **Check permissions**: Verify bucket has read permissions for authenticated users
3. **Check console logs**: Look for upload errors or invalid URL messages
4. **Verify storage**: Check Appwrite Console → Storage to confirm file exists

### How to view uploaded files?

1. Go to **Appwrite Console** → **Storage**
2. Click on your bucket name
3. You'll see all uploaded files including profile pictures
4. Files are named: `avatar-{userId}-{timestamp}.jpg`

### How to delete a profile picture?

The profile picture can be removed by:
1. Using the "Remove Photo" option in the app (sets `profilePicture` to empty string)
2. Or manually deleting the file from Appwrite Console → Storage

## Important: Appwrite Auth Limitations

According to the [Appwrite Auth documentation](https://appwrite.io/docs/products/auth), **Appwrite Auth does NOT natively support profile pictures**. 

### Why This Approach?

Appwrite recommends:
1. **Upload images to Storage** ✅ (We do this)
2. **Store the URL in User Preferences** ✅ (We do this via `account.updatePrefs()`)
3. **Retrieve from preferences when needed** ✅ (We do this via `getUserProfilePicture()`)

### What Appwrite Auth Provides

- **Accounts API**: For managing user accounts
- **Users API**: For user management
- **Preferences**: JSON object for storing custom user data (this is where we store the profile picture URL)
- **Avatars Service**: For generating initials-based avatars (fallback when no picture exists)

### Our Implementation

Our implementation follows Appwrite's recommended pattern:
- ✅ Upload to Storage bucket
- ✅ Store URL in `user.prefs.profilePicture`
- ✅ Retrieve via `getUserProfilePicture()`

This is the **correct** way to handle profile pictures in Appwrite!

## Related Files

- **Upload Logic**: `components/UserProfile.tsx` → `uploadAvatar()`
- **Storage Config**: `utils/appwrite.ts` → `appwriteConfig.bucket`
- **Auth Service**: `lib/appwrite/auth.ts` → `updateUserProfilePicture()`
- **Retrieval**: `lib/appwrite/auth.ts` → `getUserProfilePicture()`

