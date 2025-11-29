# Migration Scripts

## add-duty-fields-to-messages.js

**Adds duty fields to messages collection**

This script adds two new optional fields to the `messages` collection:
- `isDuty` (Boolean) - Flag to mark a message as a duty
- `dutyStatus` (Enum: 'active' | 'completed') - Status of the duty

### Quick Start

```bash
node scripts/add-duty-fields-to-messages.js
```

### Prerequisites

- API Key with "Databases" scope
- Messages collection must already exist

See `scripts/ADD_DUTY_FIELDS.md` for detailed instructions.

---

## migrate-membership-emails.ts (Server-Side - RECOMMENDED)

**Use this for full migration of all memberships**

This script uses Appwrite Server SDK to access the Users API and get emails for all users.

### Prerequisites

1. Install Node.js Appwrite SDK:
```bash
npm install node-appwrite
```

2. Get API Key from Appwrite Console:
   - Go to Appwrite Console → Settings → API Keys
   - Create a new API Key with the following scopes:
     - `users.read` - To read user email addresses
     - `databases.read` - To read membership documents
     - `databases.write` - To update membership documents

### Setup Environment Variables

Create a `.env` file in the project root or set environment variables:

```env
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key  # Service account API key
APPWRITE_DATABASE_ID=your_database_id
```

### Run the Script

Option 1: Using ts-node
```bash
npx ts-node scripts/migrate-membership-emails.ts
```

Option 2: Convert to JavaScript and run
```bash
tsc scripts/migrate-membership-emails.ts
node scripts/migrate-membership-emails.js
```

### What It Does

1. Gets all membership documents from the `memberships` collection
2. For each membership:
   - Checks if `userEmail` already exists (skips if it does)
   - Gets user's email from Appwrite Users API using `userId`
   - Updates the membership document with the email
3. Logs progress and summary

---

## migrate-membership-emails-client.ts (Client-Side - LIMITED)

**Use this only for the current logged-in user**

This script can only update memberships for the currently logged-in user because client-side SDK cannot access other users' emails.

### How to Use in Your App

1. Import the function:
```typescript
import { migrateCurrentUserMembershipEmails } from '@/scripts/migrate-membership-emails-client';
```

2. Call it when user is logged in:
```typescript
// In your component or screen
const handleMigrate = async () => {
  try {
    await migrateCurrentUserMembershipEmails();
    alert('Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
};
```

3. Or use the teamService function:
```typescript
import { teamService } from '@/lib/appwrite/teams';

const handleMigrate = async () => {
  const result = await teamService.migrateMembershipEmailsForCurrentUser();
  console.log(`Updated: ${result.updated}, Skipped: ${result.skipped}, Errors: ${result.errors}`);
};
```

---

## migrate-membership-emails.ts as Appwrite Cloud Function (BEST OPTION)

For production, create this as an Appwrite Cloud Function:

1. Go to Appwrite Console → Functions
2. Create a new function
3. Copy the code from `scripts/migrate-membership-emails.ts`
4. Install dependencies: `npm install node-appwrite`
5. Deploy the function
6. Set environment variables in the function settings
7. Run the function manually or schedule it

### Benefits of Cloud Function:
- ✅ Server-side access to Users API
- ✅ Can run on schedule
- ✅ No need to share API keys
- ✅ Secure and scalable

---

## Manual Migration (Quick Fix)

If you just need to update a few memberships manually:

1. Go to Appwrite Console → Databases → `memberships` collection
2. Find the membership document by `userId`
3. Click Edit
4. Add `userEmail` field with the user's email
5. Save

To find the user's email:
- Go to Auth → Users
- Find user by `userId`
- Copy their email

---

## Troubleshooting

### "Missing required environment variables"
- Make sure all environment variables are set
- Check that `.env` file exists in project root

### "Could not get user"
- User might not exist in Appwrite
- Check that `userId` in membership matches a real user

### "User has no email address"
- Some users might not have email set in their account
- You'll need to manually add the email or skip these users

### Permission Errors
- Make sure API key has correct scopes
- Check collection permissions allow updates

---

## Important Notes

⚠️ **Client-Side Limitation**: React Native client SDK cannot access other users' email addresses. This is a security feature. For full migration, you must use:
- Server-side script (Node.js)
- Appwrite Cloud Function
- Manual updates in console

✅ **Best Practice**: Always store `userEmail` when creating new memberships (we already do this in `createMembership`)

✅ **Future Prevention**: The auto-sync code in `listMemberships` will ensure new memberships get email automatically

