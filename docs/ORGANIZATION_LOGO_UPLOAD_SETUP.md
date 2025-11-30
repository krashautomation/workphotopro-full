# Organization Logo Upload Setup Guide

## Overview

To enable organization logo uploads, you need to configure both the database field and storage bucket permissions in Appwrite.

---

## Step 1: Add `logoUrl` Field to Database ✅ REQUIRED

### In Appwrite Console:

1. Go to **Appwrite Console** → **Databases** → Your Database → `organizations` collection
2. Click **"Attributes"** tab
3. Click **"+ Create Attribute"**
4. Configure the field:
   - **Key:** `logoUrl`
   - **Type:** `String`
   - **Size:** `500` (to accommodate full URLs)
   - **Required:** ❌ **No** (leave unchecked - this is optional)
   - **Array:** ❌ **No**
   - **Default:** (leave empty)
5. Click **"Create"**

### Verify:
- The `logoUrl` field should now appear in your `organizations` collection attributes list

---

## Step 2: Configure Storage Bucket Permissions ✅ REQUIRED

### In Appwrite Console:

1. Go to **Appwrite Console** → **Storage** → Your Bucket
2. Click **"Settings"** tab
3. Scroll down to **"File Security"** section

### Configure Permissions:

#### Create Permission (for uploading):
- Click **"Add Permission"** under **Create** permissions
- Select: **Users** (all authenticated users)
- This allows any logged-in user to upload files

#### Read Permission (for viewing):
- Click **"Add Permission"** under **Read** permissions  
- Select: **Users** (all authenticated users)
- This allows any logged-in user to view uploaded logos

#### Update Permission (optional - for replacing):
- Click **"Add Permission"** under **Update** permissions
- Select: **Users** (all authenticated users)
- This allows users to replace their uploaded logos

#### Delete Permission (optional - for removing):
- Click **"Add Permission"** under **Delete** permissions
- Select: **Users** (all authenticated users)
- This allows users to delete their uploaded logos

### Configure Allowed File Types:

1. In the same **Settings** tab, find **"File Extensions"** or **"Allowed File Types"**
2. Make sure these image types are allowed:
   - `jpg` or `jpeg`
   - `png`
   - `gif`
   - `webp`

### Configure File Size Limit:

1. In **Settings**, find **"Maximum File Size"**
2. Set to at least **5MB** (recommended: **10MB**)
   - Logo images are typically small, but 10MB gives flexibility

---

## Step 3: Verify Environment Variables ✅

Make sure your `.env` file (or environment variables) includes:

```env
EXPO_PUBLIC_APPWRITE_BUCKET_ID=your_bucket_id_here
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://your-appwrite-instance.com/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
```

**Important:** After updating `.env`, restart your development server:
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm start
# or
npx expo start
```

---

## Step 4: Test the Upload

1. Open your app
2. Navigate to **Profile Settings** → **Your Organization** → Click **Edit** (pencil icon)
3. Click on the **Photo Icon** preview (or the Building icon placeholder)
4. Select an image from your photo library
5. Wait for upload to complete
6. Click **"Save Changes"**

### Expected Behavior:
- ✅ Image uploads successfully
- ✅ Logo preview updates immediately
- ✅ Success alert appears
- ✅ Logo is saved when you save the organization

---

## Troubleshooting

### Error: "Bucket ID not configured"
**Solution:** 
- Check that `EXPO_PUBLIC_APPWRITE_BUCKET_ID` is set in your `.env` file
- Restart your development server after adding the variable

### Error: "Permission denied" or "Unauthorized"
**Solution:**
- Verify storage bucket permissions are set correctly (Step 2)
- Make sure **Create** permission includes **Users**
- Make sure you're logged in to the app

### Error: "File type not allowed"
**Solution:**
- Check that image file extensions (jpg, png, gif, webp) are allowed in bucket settings
- Try uploading a different image format

### Error: "File too large"
**Solution:**
- Check the file size limit in bucket settings
- Try uploading a smaller image (< 5MB recommended)

### Upload succeeds but logo doesn't save
**Solution:**
- Verify `logoUrl` field exists in `organizations` collection (Step 1)
- Check browser/device console for errors
- Make sure you click **"Save Changes"** after uploading

### Logo uploads but doesn't display
**Solution:**
- Check that **Read** permission is set on the storage bucket
- Verify the file URL is correct (check console logs)
- Try refreshing the app

---

## Quick Checklist

- [ ] `logoUrl` field added to `organizations` collection
- [ ] Storage bucket **Create** permission set to **Users**
- [ ] Storage bucket **Read** permission set to **Users**
- [ ] Image file types (jpg, png, gif, webp) allowed in bucket
- [ ] File size limit set (recommended: 10MB)
- [ ] `EXPO_PUBLIC_APPWRITE_BUCKET_ID` set in `.env`
- [ ] Development server restarted after `.env` changes
- [ ] User is logged in to the app

---

## Additional Notes

- **Logo Size Recommendation:** 200x200px to 400x400px (square images work best)
- **File Format Recommendation:** PNG or JPG
- **Storage Cost:** Each logo is typically 50-200KB, so storage costs are minimal
- **Default Behavior:** If no logo is uploaded, the default Building2 icon is displayed

---

## Need Help?

If you're still experiencing issues:
1. Check the browser/device console for detailed error messages
2. Verify all steps above are completed
3. Test with a small image file (< 1MB) first
4. Check Appwrite Console logs for server-side errors

