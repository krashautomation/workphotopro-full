# Appwrite Collection Permissions Setup Guide

This guide explains how to configure collection permissions in Appwrite to fix authorization errors.

## 🔴 Problem

After successful authentication (including Google OAuth), users are getting authorization errors:
- `The current user is not authorized to perform the requested action`
- Users cannot list organizations
- Users cannot create default workspace
- Users cannot access teams or memberships

## ✅ Solution

Configure proper permissions for database collections in Appwrite Console.

---

## 📋 Required Collections

The app requires these collections with proper permissions:

1. **organizations** - Multi-tenant organizations
2. **teams** - Teams within organizations
3. **memberships** - Team memberships
4. **jobchat** - Job/chat data
5. **messages** - Chat messages
6. **tag_templates** - Tag templates
7. **job_tag_assignments** - Job-tag relationships
8. **user_preferences** - User settings

---

## 🔧 Step-by-Step Setup

### Step 1: Access Appwrite Console

1. Go to [https://cloud.appwrite.io](https://cloud.appwrite.io)
2. Log in to your account
3. Select your project (WorkPhotoPro)

### Step 2: Navigate to Collections

1. Click on **Databases** in the left sidebar
2. Click on your database (e.g., "workphotopro-db")
3. You should see a list of collections

### Step 3: Configure Permissions for Each Collection

For **each collection** listed above, follow these steps:

#### A. Open Collection Settings

1. Click on the collection name (e.g., "organizations")
2. Click on **Settings** tab (or gear icon)

#### B. Navigate to Permissions Section

1. Scroll down to find **Permissions** section
2. You'll see sections for:
   - **Read Permission** - Who can read documents
   - **Create Permission** - Who can create documents
   - **Update Permission** - Who can update documents
   - **Delete Permission** - Who can delete documents

#### C. Add Permissions

For each permission type (Read, Create, Update), click **Add Permission** and type:

```
users
```

That's it! Just type `users` (this means "any authenticated user")

**Required Permissions for Each Collection:**

| Collection | Read | Create | Update | Delete |
|------------|------|--------|--------|--------|
| organizations | ✅ `users` | ✅ `users` | ✅ `users` | ✅ `users` (optional) |
| teams | ✅ `users` | ✅ `users` | ✅ `users` | ✅ `users` (optional) |
| memberships | ✅ `users` | ✅ `users` | ✅ `users` | ✅ `users` (optional) |
| jobchat | ✅ `users` | ✅ `users` | ✅ `users` | ✅ `users` (optional) |
| messages | ✅ `users` | ✅ `users` | ✅ `users` | ✅ `users` (optional) |
| tag_templates | ✅ `users` | ✅ `users` | ✅ `users` | ✅ `users` (optional) |
| job_tag_assignments | ✅ `users` | ✅ `users` | ✅ `users` | ✅ `users` (optional) |
| user_preferences | ✅ `users` | ✅ `users` | ✅ `users` | ✅ `users` (optional) |

#### D. Save Changes

1. Click **Update** or **Save** button
2. Wait for confirmation that permissions are saved

---

## 🎯 Quick Setup (All Collections)

If you want to set up permissions quickly for all collections at once:

### For Each Collection:

1. **Read Permission**: Add `users`
2. **Create Permission**: Add `users`
3. **Update Permission**: Add `users`
4. **Delete Permission**: Add `users` (optional, but recommended)

### Permissions Format

In Appwrite Console, when you click "Add Permission", you'll see a field. Simply type:
```
users
```

This grants the permission to all authenticated users.

---

## ✅ Verify Permissions

After setting up permissions:

1. **Test Authentication**: Try logging in with Google OAuth (or email/password)
2. **Check Console Logs**: Look for these messages:
   - ✅ `✅ Created organization` - Success!
   - ✅ `✅ Created team` - Success!
   - ⚠️ `⚠️ Cannot check existing organizations (permission error)` - Still needs permissions
   - ❌ `❌ Failed to create organization` - Still needs permissions

3. **Expected Behavior**:
   - User can log in successfully
   - Default workspace is created automatically (no errors)
   - User can see their organizations and teams
   - No authorization errors in console

---

## 🔍 Troubleshooting

### Error: "Collection not found"

**Problem**: Collection doesn't exist yet.

**Solution**: 
1. Create the collection first
2. Add required attributes (fields)
3. Then set permissions

### Error: "Permission denied"

**Problem**: Permissions are not set correctly.

**Solution**:
1. Double-check you typed `users` (not `user` or `Users`)
2. Verify permissions are saved (click Save/Update button)
3. Check all three permissions are set: Read, Create, Update

### Error: "Still getting authorization errors after setup"

**Problem**: Permissions might not be applied immediately.

**Solution**:
1. Wait a few seconds for permissions to propagate
2. Try logging out and logging back in
3. Restart the app
4. Clear app cache if needed

### Error: "Collections exist but can't access them"

**Problem**: Collections exist but have no permissions set.

**Solution**:
1. Go to each collection's Settings
2. Check if Permissions section shows any permissions
3. If empty, add `users` permission for Read, Create, Update

---

## 📝 Notes

### About `users` Permission

- `users` = Any authenticated user can perform this action
- This is different from:
  - `any` = Anyone (including unauthenticated users) - NOT recommended for most cases
  - `user:[USER_ID]` = Specific user only
  - `team:[TEAM_ID]` = Team members only

### Security Considerations

- Using `users` permission means any authenticated user can read/create/update documents
- For production, you may want to implement more granular permissions later
- For now, `users` is fine for getting the app working

### Optional: Delete Permission

- Delete permission is optional
- The app uses "soft deletes" (setting `isActive: false`) instead of hard deletes
- But having delete permission doesn't hurt

---

## 🚀 After Setup

Once permissions are configured:

1. ✅ Users can authenticate successfully
2. ✅ Default workspace is created automatically
3. ✅ Users can access their organizations and teams
4. ✅ No authorization errors in console logs
5. ✅ App functions normally

The app now handles permission errors gracefully, so even if some permissions are missing, users can still log in. But configuring permissions properly ensures all features work correctly.

