# Add Duty Fields to Messages Collection

This guide explains how to add the duty-related fields to your Appwrite messages collection.

## Overview

This script adds two new optional fields to the `messages` collection:
- `isDuty` (Boolean, optional) - Flag to mark a message as a duty
- `dutyStatus` (String enum: 'active' | 'completed', optional) - Status of the duty

These fields mirror the existing task fields (`isTask` and `taskStatus`) and allow messages to be marked as duties with a red outline and "DUTIES" label.

## Prerequisites

1. Node.js installed
2. Appwrite project set up
3. Messages collection already exists
4. API key with "Databases" scope

## Setup Steps

### 1. Install Dependencies (if not already installed)

```bash
npm install node-appwrite dotenv
```

### 2. Get Your API Key

1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Navigate to **Settings** → **API Keys**
3. Create a new API Key with **Databases** scope
4. Copy the key (you'll only see it once!)

### 3. Set Environment Variables

Create a `.env` file in the project root (if it doesn't exist) or add these variables:

```env
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id_here
APPWRITE_API_KEY=your_api_key_here
APPWRITE_DATABASE_ID=your_database_id_here
```

**Note:** You can also use the `EXPO_PUBLIC_*` versions of these variables if they're already set.

### 4. Run the Script

```bash
node scripts/add-duty-fields-to-messages.js
```

The script will:
- ✅ Check if the messages collection exists
- ✅ Add `isDuty` boolean attribute (if not exists)
- ✅ Add `dutyStatus` enum attribute (if not exists)
- ✅ Create indexes for better query performance
- ✅ Provide a summary of what was done

### 5. Verify in Appwrite Console

1. Go to **Databases** → **messages** collection
2. Go to **Settings** → **Attributes**
3. Verify that `isDuty` and `dutyStatus` are listed
4. Check that indexes were created under **Settings** → **Indexes**

## TypeScript Types

The TypeScript types have been updated in `utils/types.ts`. The `Message` interface now includes:

```typescript
// Duty fields
isDuty?: boolean; // Flag to mark message as a duty
dutyStatus?: 'active' | 'completed'; // Duty status (only relevant if isDuty is true)
```

## What's Next?

After running this script, you can:

1. **Implement duty creation UI** - Wire up the "Create duties" option in the clipboard menu
2. **Add duty display styling** - Show duties with red outline and "DUTIES" label
3. **Implement duty completion** - Allow creators to mark duties as completed
4. **Test the feature** - Create and complete duties to verify everything works

## Troubleshooting

### Error: "Collection 'messages' not found"
- Make sure the messages collection exists in your Appwrite database
- Verify the database ID is correct

### Error: "Missing required environment variables"
- Check that all environment variables are set correctly
- Make sure `.env` file is in the project root
- Verify API key has "Databases" scope

### Error: "Attribute already exists"
- This is normal if you've run the script before
- The script will skip existing attributes and continue

### Attributes not showing up immediately
- Appwrite may take a few seconds to process new attributes
- Refresh the Appwrite Console after running the script
- Wait 2-3 seconds between attribute additions if running manually

## Related Files

- `scripts/add-duty-fields-to-messages.js` - The migration script
- `utils/types.ts` - TypeScript type definitions
- `app/(jobs)/[job].tsx` - Main job screen (where duties will be implemented)

