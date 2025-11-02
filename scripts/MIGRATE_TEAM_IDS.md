# Migration: Add appwriteTeamId to Teams Table

This migration adds the `appwriteTeamId` field to the `teams` table to properly link database teams with Appwrite Teams.

## Why This Is Needed

Currently, there are two separate IDs:
- **Appwrite Team ID** - The ID from Appwrite Teams (native feature)
- **Database Team ID** - The ID from your custom `teams` table in the database

The `memberships` table stores the Appwrite Team ID in the `teamId` field, but the `teams` table doesn't store the Appwrite Team ID, making it hard to link them together.

## Step 1: Add Field to Teams Collection

1. Go to **Appwrite Console** → **Databases** → `teams` collection
2. Go to **Attributes** tab
3. Click **Create Attribute**
4. Select **String**
5. Set:
   - Attribute ID: `appwriteTeamId`
   - Size: `255` (Appwrite Team IDs are typically 20-30 characters)
   - Required: **No** (optional, to allow existing teams without it)
   - Default: None
   - Array: **No**
6. Click **Create**

## Step 2: Run the Migration Script

After adding the field, run:

```bash
npm run migrate-team-appwrite-ids
```

The script will:
- ✅ Get all Appwrite Teams
- ✅ Get all database teams
- ✅ Match them by name
- ✅ Update database teams with `appwriteTeamId` field

## What the Script Does

For each team in your database:
1. Checks if it already has `appwriteTeamId` (skips if yes)
2. Finds the matching Appwrite Team by name
3. Updates the database team with the Appwrite Team ID

## After Migration

Once the migration is complete:
- ✅ All teams will have `appwriteTeamId` field
- ✅ The `add-team-member.js` script will work better
- ✅ You can easily link between Appwrite Teams and database teams

## Troubleshooting

### Error: "No matching Appwrite Team found"
- The team name in your database doesn't match the name in Appwrite Teams
- Check the names manually and update them if needed
- Or manually set `appwriteTeamId` in Appwrite Console

### Error: "Team already has appwriteTeamId"
- This is fine - the script will skip it
- This means the team was already updated

### Error: "Some teams could not be updated"
- Check the team names match exactly
- You can manually update failed teams in Appwrite Console
- Or re-run the script after fixing names

## Future Teams

From now on, when teams are created via `teamService.createTeam()`, the `appwriteTeamId` will be automatically stored, so this migration won't be needed for new teams.

