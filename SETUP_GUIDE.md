# 🚀 Quick Setup Guide

## Step-by-Step Setup (15 minutes)

### 1. Install Dependencies (2 minutes)

```bash
cd C:\Users\capta\Desktop\WorkPhotoProV2
npm install
```

### 2. Create Appwrite Project (5 minutes)

1. Go to https://cloud.appwrite.io
2. Click "Create Project"
3. Name it "WorkPhotoPro"
4. Copy your **Project ID**

### 3. Configure Appwrite (5 minutes)

#### Enable Email/Password Auth:
1. Navigate to **Auth** section
2. Click **Settings**
3. Enable "Email/Password"
4. Save changes

#### Create Database:
1. Navigate to **Databases**
2. Click "Create Database"
3. Name it "workphotopro-db"
4. Copy the **Database ID**

#### Create Storage Bucket:
1. Navigate to **Storage**
2. Click "Create Bucket"
3. Name it "photos"
4. Set permissions to "All users" (read) and "Authenticated users" (create, update, delete)
5. Copy the **Bucket ID**

#### Add Platform:
1. Go to **Settings** → **Platforms**
2. Click "Add Platform"
3. Select "Flutter App" or "Android App"
4. Enter package name: `com.workphotopro.app`
5. Click "Add"

### 4. Configure Environment (2 minutes)

Create `.env` file in the project root:

```env
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=<your_project_id>
EXPO_PUBLIC_APPWRITE_DATABASE_ID=<your_database_id>
EXPO_PUBLIC_APPWRITE_BUCKET_ID=<your_bucket_id>
```

### 5. Run the App (1 minute)

```bash
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## ✅ Verify Setup

1. App should load to welcome screen
2. Click "Get Started"
3. Create an account
4. You should be signed in automatically

## 🐛 Common Issues

### "Missing EXPO_PUBLIC_APPWRITE_PROJECT_ID"
- Make sure `.env` file exists in project root
- Restart the dev server after creating `.env`

### "Network request failed"
- Check your internet connection
- Verify Appwrite endpoint URL
- Check if Appwrite Console is accessible

### "Invalid credentials"
- Check Project ID in `.env` matches Appwrite Console
- Verify email/password auth is enabled in Appwrite

## 🎉 You're Ready!

Now you can start building features. Check `README.md` for next steps.

