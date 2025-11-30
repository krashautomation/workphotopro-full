# Logo Display Debugging Guide

## Issue
Logo uploads successfully but doesn't display in:
- `app/(jobs)/edit-organization.tsx`
- `app/(jobs)/user-profile.tsx`
- `app/(jobs)/profile-settings.tsx`

## Debugging Steps

### Step 1: Check Console Logs After Upload

After uploading a logo and clicking "Save Changes", check your console for these logs:

#### During Upload:
```
🔄 Starting logo upload...
🔄 Image URI: [should show file://...]
🔄 Bucket ID: [should show your bucket ID]
🔄 Uploading to storage bucket...
🔄 Upload response: [should show file ID]
✅ Logo uploaded successfully: [should show full URL]
```

#### During Save:
```
🔄 Updating organization with data: { orgName: "...", description: "...", logoUrl: "..." }
🔄 Current logoUrl state: [should show the uploaded URL]
🔄 Organization ID: [should show org ID]
🔄 updateOrganization - Update data: { logoUrl: "..." }
🔄 updateOrganization - Updated org response: { logoUrl: "..." }
🔄 Refreshed organization logoUrl: [should show the URL]
```

#### When Loading Organization:
```
🔄 listUserOrganizations - Raw result: X organizations
🔄 Org 1: { id: "...", name: "...", logoUrl: "...", hasLogoUrl: true/false }
🔄 OrganizationContext - Updating current organization
🔄 Previous org logoUrl: [previous value or undefined]
🔄 Updated org logoUrl: [should show the URL]
🔄 Final org logoUrl: [should show the URL]
```

### Step 2: Verify Database Field

1. Go to **Appwrite Console** → **Databases** → Your Database → `organizations` collection
2. Click on your organization document
3. Check if `logoUrl` field exists and has a value
4. The value should be a full URL like: `https://your-appwrite-instance.com/v1/storage/buckets/[bucket-id]/files/[file-id]/view?project=[project-id]`

### Step 3: Check Field Configuration

In Appwrite Console, verify the `logoUrl` field:
- **Type:** String (not Text)
- **Size:** 500 or more
- **Required:** No (should be optional)
- **Array:** No

### Step 4: Check Permissions

Verify the `organizations` collection has:
- **Read permission:** Users (all authenticated users)
- **Update permission:** Users (all authenticated users)

### Step 5: Test Direct Database Query

Add this temporary code to test if the field is being returned:

```typescript
// In edit-organization.tsx, add this after loadOrganizationData
useEffect(() => {
  if (currentOrganization?.$id) {
    organizationService.getOrganization(currentOrganization.$id).then(org => {
      console.log('🔍 DIRECT DB QUERY - Full org object:', JSON.stringify(org, null, 2));
      console.log('🔍 DIRECT DB QUERY - logoUrl:', org.logoUrl);
    });
  }
}, [currentOrganization?.$id]);
```

## Common Issues & Solutions

### Issue 1: logoUrl is `undefined` in update response
**Solution:** Check if the field exists in database schema. The field might not have been created properly.

### Issue 2: logoUrl exists in database but not in fetched org
**Solution:** Check if Appwrite is returning all fields. Some fields might need to be explicitly selected (though Appwrite usually returns all by default).

### Issue 3: logoUrl exists in context but not displaying
**Solution:** Check image URL format. The URL might be malformed or the storage bucket might not have read permissions.

### Issue 4: logoUrl is saved but context doesn't update
**Solution:** The `loadUserData()` might not be refreshing properly. Check OrganizationContext logs.

## Quick Test

Run this in your browser console or React Native debugger:

```javascript
// After saving, check what's in the context
console.log('Current org:', currentOrganization);
console.log('Logo URL:', currentOrganization?.logoUrl);
console.log('Has logo:', !!currentOrganization?.logoUrl);
```

## What to Report

If the logo still doesn't display, please provide:

1. **Console logs** from upload → save → display
2. **Database screenshot** showing the organization document with logoUrl field
3. **Field configuration** screenshot from Appwrite Console
4. **Any error messages** in console

This will help identify exactly where the logoUrl is getting lost in the data flow.

