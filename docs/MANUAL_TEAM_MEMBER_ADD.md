# Manual Team Member Addition Guide

This guide explains how to manually add a user as a member of a team in Appwrite without using the "Invite Members" button in `team.tsx`.

## Understanding the Invite Flow

When you use the "Invite Members" button in `team.tsx`:

1. It calls `teamService.createMembership()` which:
   - Creates an Appwrite team membership (sends email invitation)
   - Creates a membership record in your `memberships` database collection

2. The user receives an email and must accept the invitation

The code is located in:
- **Frontend**: `app/(jobs)/team.tsx` (line 49-50) → `app/(jobs)/invite.tsx`
- **Service**: `lib/appwrite/teams.ts` → `createMembership()` function (lines 512-539)

## Manual Methods to Add Users to Teams

### Option 1: Using Appwrite Console (Recommended for Testing)

This is the easiest method for manual testing.

#### Step 1: Access Appwrite Console
1. Go to your Appwrite Console (https://cloud.appwrite.io)
2. Sign in and select your project
3. Navigate to **Auth** → **Teams**

#### Step 2: Find Your Team
1. Locate the team you want to add a member to (by ID or name)
2. Click on the team to open details
3. Copy the **Team ID** (you'll need this later)

#### Step 3: Create Appwrite Membership
1. In the team details page, go to the **Memberships** tab
2. Click **Create Membership** or **Create Invitation**
3. Choose one of these methods:
   - **By Email**: Enter the user's email address
   - **By User ID**: Enter the user's Appwrite user ID directly
4. Select the **roles**: `owner`, `admin`, or `member`
5. Set the invite URL (can be a placeholder if not using email invites)
6. Click **Create**

This creates the Appwrite team membership, but you **also need** to create a record in your database.

#### Step 4: Create Database Membership Record
1. Go to **Databases** → your database → **memberships** collection
2. Click **Create Document**
3. Fill in these required fields:
   ```
   userId: "USER_ID_TO_ADD"      // The user's Appwrite user ID
   teamId: "TEAM_ID"              // The team's Appwrite team ID
   role: "member"                 // or "owner" or "admin"
   invitedBy: "YOUR_USER_ID"      // Who invited them (your user ID)
   joinedAt: (current timestamp)  // Use current date/time
   isActive: true                  // Must be true
   ```
4. Click **Create**

**Important**: Both steps are required! The Appwrite membership and the database record must both exist.

---

### Option 2: Using Server-Side Code (For Production/Automation)

If you have server-side access (Node.js backend), you can use Appwrite's Server SDK to create memberships directly without email invitations.

#### Prerequisites
- Node.js server with Appwrite Server SDK
- Server API key (not client key) for authentication

#### Example Code

```javascript
import { Client, Teams, Databases, ID } from 'appwrite';

// Initialize server client (uses API key, not session)
const serverClient = new Client()
  .setEndpoint('YOUR_APPWRITE_ENDPOINT')  // e.g., https://cloud.appwrite.io/v1
  .setProject('YOUR_PROJECT_ID')
  .setKey('YOUR_SERVER_API_KEY'); // Use server API key, not client key

const serverTeams = new Teams(serverClient);
const databases = new Databases(serverClient);

// Create membership directly (bypasses email invitation)
async function addUserToTeam(teamId, userId, role = 'member', inviterUserId) {
  try {
    // Step 1: Create Appwrite team membership
    // Note: Server SDK may allow direct creation without invitation
    // If not available, you may need to use createMembership with email
    const membership = await serverTeams.createMembership(
      teamId,
      [role],        // Array of roles
      undefined,     // email (optional if using userId)
      userId,        // userId to add directly
      undefined      // optional phone number
    );

    // Step 2: Create membership record in database
    await databases.createDocument(
      'DATABASE_ID',
      'memberships',
      ID.unique(),
      {
        userId: userId,
        teamId: teamId,
        role: role,
        invitedBy: inviterUserId,
        joinedAt: new Date().toISOString(),
        isActive: true
      }
    );

    return { success: true, membership };
  } catch (error) {
    console.error('Error adding user to team:', error);
    throw error;
  }
}

// Usage
await addUserToTeam(
  'TEAM_ID',
  'USER_ID_TO_ADD',
  'member',
  'INVITER_USER_ID'
);
```

**Note**: Check Appwrite Server SDK documentation for the exact method signature, as it may vary by version.

---

### Option 3: Direct Database Insertion (Testing Only)

⚠️ **Warning**: This method is incomplete and should only be used for quick testing. You still need an Appwrite team membership for the system to work properly.

#### Quick Test Method

1. **Get Required IDs**:
   - **User ID**: Appwrite Console → **Auth** → **Users** → find user → copy ID
   - **Team ID**: Appwrite Console → **Auth** → **Teams** → find team → copy ID
   - **Inviter ID**: Your user ID (who is adding the member)

2. **Create Database Record Only**:
   - Appwrite Console → **Databases** → **memberships** collection
   - Click **Create Document**
   - Fill in the fields as described in Option 1, Step 4

3. **Still Need Appwrite Membership**:
   - You must also create the Appwrite team membership (see Option 1, Step 3)
   - The database record alone is not sufficient

---

## Finding Required IDs

### User ID
- **Method 1**: Appwrite Console → **Auth** → **Users** → open user → copy ID from details
- **Method 2**: In your app code, when user is logged in: `user.$id`

### Team ID
- **Method 1**: Appwrite Console → **Auth** → **Teams** → open team → copy ID from details
- **Method 2**: In your app code, when team is selected: `currentTeam.$id`

### Team Name
- Can be found in the Teams list in Appwrite Console
- Or from your app: `currentTeam.name`

---

## Complete Workflow Example

Here's a complete example of manually adding a user to a team:

### Scenario
You want to add user `testuser@example.com` (User ID: `abc123`) to team "Development Team" (Team ID: `xyz789`) as a `member`, and you're adding them (your User ID: `owner123`).

### Steps

1. **Appwrite Console → Auth → Teams**
   - Find "Development Team"
   - Copy Team ID: `xyz789`

2. **Appwrite Console → Auth → Teams → Development Team → Memberships**
   - Click "Create Membership"
   - Enter: Email `testuser@example.com` OR User ID `abc123`
   - Role: `member`
   - URL: (any placeholder URL)
   - Click "Create"

3. **Appwrite Console → Databases → memberships collection**
   - Click "Create Document"
   - Enter:
     ```
     userId: abc123
     teamId: xyz789
     role: member
     invitedBy: owner123
     joinedAt: 2024-01-15T10:30:00.000Z (current timestamp)
     isActive: true
     ```
   - Click "Create"

4. **Verify**
   - In your app, log in as `testuser@example.com`
   - Navigate to Teams tab
   - The team should appear in their team list

---

## Important Notes

### Why Both Are Needed

1. **Appwrite Team Membership**: 
   - Provides authentication and authorization
   - Allows user to access team resources
   - Required for Appwrite's team-based permissions

2. **Database Membership Record**:
   - Stores custom membership metadata (role, invitedBy, joinedAt)
   - Used by your app to display membership information
   - Syncs with Appwrite membership for consistency

### Common Issues

**User doesn't appear in team:**
- Check both Appwrite membership AND database record exist
- Verify `isActive: true` in database record
- Check user is logged in with correct account

**Permission errors:**
- Verify Appwrite membership exists (this controls permissions)
- Check roles are correctly set in both places

**Database record missing:**
- The app may still work but won't show custom metadata
- User may not appear in team members list properly

---

## Quick Reference

| What You Need | Where to Find It |
|--------------|------------------|
| User ID | Appwrite Console → Auth → Users |
| Team ID | Appwrite Console → Auth → Teams |
| Inviter ID | Your logged-in user ID (`user.$id` in app) |
| Role options | `owner`, `admin`, `member` |
| Database Collection | `memberships` |

---

## Related Files

- **Frontend**: `app/(jobs)/team.tsx` - Team screen with invite button
- **Invite Screen**: `app/(jobs)/invite.tsx` - Invite UI
- **Service**: `lib/appwrite/teams.ts` - Team service with `createMembership()`
- **Client**: `lib/appwrite/client.ts` - Appwrite client configuration

---

## Testing Checklist

After manually adding a user to a team:

- [ ] User appears in team members list when viewing the team
- [ ] User can see the team when logged in
- [ ] User has correct role/permissions
- [ ] Database record exists with correct fields
- [ ] Appwrite membership exists and is active
- [ ] User can access team resources (if permissions are set up)

---

## Need Help?

If you encounter issues:

1. Check Appwrite Console for errors
2. Verify both Appwrite membership AND database record exist
3. Check the console logs in your app
4. Review `lib/appwrite/teams.ts` for membership creation logic
5. See related guide: `docs/ADD_TEAM_MEMBER_GUIDE.md` for script-based testing

