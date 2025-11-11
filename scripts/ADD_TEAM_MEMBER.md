# Add Team Member Script

This script manually adds a user to a team in your database. This is useful when invites aren't working yet or for testing purposes.

## Prerequisites

1. **Environment Variables** - Make sure your `.env` file has:
   ```env
   APPWRITE_ENDPOINT=https://sfo.cloud.appwrite.io/v1
   APPWRITE_PROJECT_ID=your_project_id
   APPWRITE_API_KEY=your_api_key_here
   APPWRITE_DATABASE_ID=your_database_id
   ```

2. **API Key Setup** - Your API key needs these scopes:
   - ✅ `users.read` (to fetch user email)
   - ✅ `documents.read` (to check existing memberships)
   - ✅ `documents.write` (to create membership)

## Usage

### Basic Usage (with role)
```bash
npm run add-team-member <teamId> <userId> [role]
```

### With Email (optional)
```bash
npm run add-team-member <teamId> <userId> [role] [email]
```

### Examples

**Add user as member:**
```bash
npm run add-team-member 68f0dc7f002427e257f5 68f43803a43077657a06 member
```

**Add user as owner:**
```bash
npm run add-team-member 68f0dc7f002427e257f5 68f43803a43077657a06 owner
```

**Add user with email:**
```bash
npm run add-team-member 68f0dc7f002427e257f5 68f43803a43077657a06 member user@example.com
```

## Arguments

| Argument | Required | Description | Example |
|----------|----------|-------------|---------|
| `teamId` | Yes | The ID of the team to add the user to | `68f0dc7f002427e257f5` |
| `userId` | Yes | The ID of the user to add | `68f43803a43077657a06` |
| `role` | No | Role: `member` or `owner` (default: `member`) | `member` |
| `email` | No | User email (will be fetched from Appwrite if not provided) | `user@example.com` |

## Valid Roles

- `member` - Regular team member (default)
- `owner` - Team owner (use with caution!)

## How to Get IDs

### Team ID (`teamId`)
1. Go to your app or Appwrite Console
2. Find the team you want to add the user to
3. Copy the team's ID (starts with something like `68f0dc7f...`)

### User ID (`userId`)
1. Go to Appwrite Console → Users
2. Find the user you want to add
3. Copy the user's ID (starts with something like `68f43803a4...`)

Or you can find it in your database's `memberships` table for existing users.

## What This Script Does

1. ✅ Verifies the team exists in your database
2. ✅ Gets user email from Appwrite Users API (if not provided)
3. ✅ Checks if user is already a member (prevents duplicates)
4. ✅ Creates membership in your custom `memberships` table
5. ✅ Sets role, email, and other membership data

## Important Notes

⚠️ **Appwrite Teams Membership**: This script creates the membership in your database only. To make it fully functional with Appwrite Teams:

- **Option 1**: Use the client SDK (when user is logged in) to create the Appwrite Teams membership
- **Option 2**: Create a Cloud Function that creates both memberships
- **Option 3**: Manually add the user via Appwrite Console → Teams → Your Team → Members

The database membership is enough for your app to display the member, but Appwrite Teams features (like invitations) require the Appwrite Teams membership as well.

## Troubleshooting

### Error: "Team not found"
- Make sure the `teamId` is correct
- Check that the team exists in your `teams` collection

### Error: "User not found"
- Make sure the `userId` is correct
- Check that the user exists in Appwrite Users

### Error: "User is already a member"
- The user is already in the team
- Check the existing membership and update it manually if needed

### Error: "Missing required environment variables"
- Check your `.env` file has all required variables
- Make sure you're using the correct API key with proper scopes

## Example Workflow

1. Get the team ID from your app or database
2. Get the user ID from Appwrite Console or your database
3. Run the script:
   ```bash
   npm run add-team-member <teamId> <userId> member
   ```
4. Verify in your app that the user appears as a team member
5. (Optional) Add them to Appwrite Teams via Console or Cloud Function

