# Fix Permissions - Step by Step Guide

## The Problem
Your `user_preferences` collection exists but has no permissions configured, so users can't access it.

## Solution
Configure permissions in Appwrite Console (not in database).

## Step-by-Step Instructions

### 1. Open Appwrite Console
- Go to https://cloud.appwrite.io
- Log in to your project

### 2. Navigate to Your Collection
- Click on **Databases** in the left menu
- Select your database
- Click on **Collections** tab
- Find and click on **`user_preferences`**

### 3. Go to Settings Tab
- Click on the **Settings** tab (should be at the top)

### 4. Scroll Down to Permissions Section
- You should see a section called **Permissions**
- It probably says "No permissions configured"

### 5. Add Read Permission
- Under **Read Permission**, click **Add Permission**
- Select: **Users (role: users)** OR **Any authenticated user**
- Click **Add**

### 6. Add Create Permission
- Under **Create Permission**, click **Add Permission**
- Select: **Users (role: users)** OR **Any authenticated user**
- Click **Add**

### 7. Add Update Permission
- Under **Update Permission**, click **Add Permission**
- Select: **Users (role: users)** OR **Any authenticated user**
- Click **Add**
- **Then add another permission:**
  - Click **Add Rule** (next to the permission you just added)
  - In the dropdown, select your `userId` field
  - Select the condition (equals)
  - Type: `$userId` (with the dollar sign)
  - This lets users only update their own preferences
  - Click **Add**

### 8. Save
- Click **Update** or **Save** button at the top/bottom of the page

### 9. Restart Your App
- Stop your Expo server
- Run `npx expo start --clear`
- Try taking a photo again

## Visual Guide

Your permissions should look like this:

```
Read Permission:
  ✓ Users (role: users)

Create Permission:
  ✓ Users (role: users)

Update Permission:
  ✓ Users (role: users)
  ✓ userId equals $userId

Delete Permission: (Optional)
  (leave empty or add if you want delete functionality)
```

## What This Does

- **Read**: Users can read their own preferences
- **Create**: Users can create their preferences document
- **Update**: Users can update their preferences, but ONLY their own (via the $userId rule)

## No Script Needed

You don't need to populate any data. Once permissions are set, the app will automatically create a preference document for each user the first time they take a photo.

## Testing

After setting permissions:
1. Take a photo
2. The app should automatically create a `user_preferences` document in Appwrite
3. No more black screen or errors
4. Watermark and timestamp should display correctly

