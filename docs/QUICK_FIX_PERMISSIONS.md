# Quick Fix: Permissions Error

## Error
"The current user is not authorized to perform the requested action"

## Solution
Update permissions for the `user_preferences` collection in Appwrite.

## Steps

1. Go to Appwrite Console → Your Database → Collections → `user_preferences`

2. Click on the **Settings** tab

3. Under **Permissions**, set:

### Read Permission
- Add: `Users (role: users)` or `Any authenticated user`

### Create Permission
- Add: `Users (role: users)` or `Any authenticated user`

### Update Permission
- Add: `Users (role: users)` or `Any authenticated user`
- **Important:** Add another rule: Users can update their own documents
  - Click "Add Rule"
  - Select "userId" equals "$userId" (this allows users to update only their own preferences)

### Delete Permission (Optional)
- Add: `Users (role: users)` or `Any authenticated user`

4. Save the changes

5. Restart your app (the permissions take effect immediately, but restart to be sure)

## Test

1. Take a photo
2. The black screen should be gone
3. You should see the photo with watermark and timestamp
4. No permission errors in console

## What Was Wrong

The collection existed but had no read permissions set, so the app couldn't access it. Even though we gracefully handle this, it was causing the freeze during the photo preview phase.

