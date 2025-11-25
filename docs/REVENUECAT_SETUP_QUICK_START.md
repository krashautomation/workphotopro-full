# RevenueCat Setup - Quick Start

This guide helps you quickly set up the database collections for RevenueCat integration.

## ⚠️ Important: Appwrite is NoSQL

**Appwrite does NOT use SQL scripts.** Instead, we use a Node.js script with the Appwrite SDK to create collections programmatically.

## Prerequisites

1. **Appwrite API Key** with "Databases" scope
   - Go to Appwrite Console → Settings → API Keys
   - Create new API Key
   - Select "Databases" scope
   - Copy the key

2. **Environment Variables** in `.env` file:
   ```env
   APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   APPWRITE_PROJECT_ID=your_project_id
   APPWRITE_REVCAT_API_KEY=your_api_key_here
   APPWRITE_DATABASE_ID=your_database_id
   ```

   Or use existing `EXPO_PUBLIC_*` variables:
   ```env
   EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
   APPWRITE_REVCAT_API_KEY=your_api_key_here
   EXPO_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
   ```

## Quick Setup

### Option 1: Using npm script (Recommended)

```bash
npm run setup-revenuecat
```

### Option 2: Direct node command

```bash
node scripts/setup-revenuecat-collections.js
```

## What the Script Does

The script creates/updates:

### 1. **subscriptions** Collection
- Creates collection with all required fields
- Adds indexes for fast queries
- Sets up permissions

### 2. **revenuecat_events** Collection
- Creates collection for webhook events
- Adds retry logic fields
- Sets up unique index on eventId

### 3. **organizations** Collection (Updates)
- Adds `currentProductId` field
- Adds `subscriptionId` field
- Adds `subscriptionExpiryDate` field
- Adds `revenueCatCustomerId` field

## Expected Output

```
🚀 Setting up RevenueCat collections...

📦 Creating subscriptions collection...
   ✅ Collection created
   📝 Adding attributes...
      ✅ userId
      ✅ orgId
      ✅ revenueCatCustomerId
      ✅ productId
      ✅ status
      ✅ startDate
      ✅ expiryDate
      ✅ autoRenewing
      ✅ canceledAt
      ✅ lastSyncedAt
      ✅ trialEndDate (optional)
      ✅ packageId (optional)
   ⏳ Waiting for attributes to be ready...
   🔍 Creating indexes...
      ✅ Index: userId
      ✅ Index: orgId
      ✅ Index: revenueCatCustomerId
      ✅ Index: status
      ✅ Index: expiryDate
   ✅ Subscriptions collection setup complete!

📦 Creating revenuecat_events collection...
   ✅ Collection created
   📝 Adding attributes...
      ✅ eventId
      ✅ eventType
      ✅ eventCategory
      ✅ customerId
      ✅ userId (optional)
      ✅ orgId (optional)
      ✅ productId (optional)
      ✅ eventData (JSON)
      ✅ attemptNumber
      ✅ processedStatus
      ✅ processedAt (optional)
      ✅ errorMessage (optional)
   ⏳ Waiting for attributes to be ready...
   🔍 Creating indexes...
      ✅ Unique Index: eventId
      ✅ Index: processedStatus
      ✅ Index: customerId
      ✅ Index: createdAt
   ✅ RevenueCat Events collection setup complete!

📦 Updating organizations collection...
   ✅ Collection exists
   📝 Adding/updating attributes...
      ✅ currentProductId
      ✅ subscriptionId
      ✅ subscriptionExpiryDate
      ✅ revenueCatCustomerId
   ✅ Organizations collection updated!

✅ All collections setup complete!

📋 Next steps:
   1. Verify collections in Appwrite Console
   2. Set up RevenueCat account and products
   3. Configure webhook endpoint
   4. Install RevenueCat SDK: npm install react-native-purchases

📖 See docs/REVENUECAT_INTEGRATION_GUIDE.md for full integration guide
```

## Troubleshooting

### Error: "Missing required environment variables"
- Make sure `.env` file exists in project root
- Check that all required variables are set
- Make sure `APPWRITE_REVCAT_API_KEY` is set (not `APPWRITE_API_KEY`)
- API key must have "Databases" scope

### Error: "Collection already exists"
- This is normal if you run the script multiple times
- The script will skip creating existing collections
- It will still add missing attributes

### Error: "Attribute already exists"
- This is normal if attributes were already added
- The script will skip existing attributes
- Safe to run multiple times

### Error: "API Key doesn't have required scope"
- Go to Appwrite Console → Settings → API Keys
- Edit your API key
- Make sure "Databases" scope is checked
- Regenerate if needed

### Error: "Database not found"
- Verify `APPWRITE_DATABASE_ID` is correct
- Check database exists in Appwrite Console
- Make sure you're using the right project

## Manual Setup (Alternative)

If the script doesn't work, you can create collections manually in Appwrite Console:

1. Go to Appwrite Console → Databases → Your Database
2. Click "Create Collection"
3. Follow the schema from `docs/REVENUECAT_INTEGRATION_GUIDE.md`
4. Add each attribute one by one
5. Create indexes manually

**Note:** Manual setup is more time-consuming and error-prone. Use the script if possible.

## Verification

After running the script, verify in Appwrite Console:

1. **Collections Created:**
   - ✅ `subscriptions`
   - ✅ `revenuecat_events`

2. **Organizations Collection Updated:**
   - ✅ `currentProductId` field exists
   - ✅ `subscriptionId` field exists
   - ✅ `subscriptionExpiryDate` field exists
   - ✅ `revenueCatCustomerId` field exists

3. **Indexes Created:**
   - Check that indexes are created for each collection
   - Verify unique index on `revenuecat_events.eventId`

## Next Steps

After collections are set up:

1. ✅ **Database schema ready** ← You are here
2. Create RevenueCat account
3. Configure products in RevenueCat dashboard
4. Create products in Google Play Console
5. Install RevenueCat SDK
6. Implement purchase flow
7. Set up webhook endpoint

See `docs/REVENUECAT_INTEGRATION_GUIDE.md` for complete integration steps.

