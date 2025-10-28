# Add Team Member Guide - Testing My Memberships & My Teams

This guide will help you add a user as a team member to test the "My Memberships" and "My Teams" tabs in `teams.tsx`.

## Prerequisites

✅ Two test accounts created in your app
✅ At least one team created (by one of the accounts)
✅ Node.js installed
✅ Appwrite configured with your `.env` file

## Quick Start (Using Script - EASIEST)

### Step 1: Update the Script with Your Test Accounts

Edit `scripts/add-team-member.js` and update these lines (around line 41):

```javascript
const ACCOUNTS = {
  owner: {
    email: 'your-first-account@example.com',  // UPDATE THIS
    password: 'YourPassword123!'               // UPDATE THIS
  },
  member: {
    email: 'your-second-account@example.com', // UPDATE THIS
    password: 'YourPassword123!'               // UPDATE THIS
  }
};
```

### Step 2: Run the Script

```bash
node scripts/add-team-member.js
```

### Step 3: Check the Output

The script will:
1. ✅ Sign in as the first account (team owner)
2. ✅ List all teams
3. ✅ Add the second account as a member to the first team
4. ✅ Create the membership record in Appwrite

### Step 4: Test in the App

1. **Log in with the second account** (the member account)
2. **Navigate to the Teams tab**
3. **You should see:**
   - "My Memberships" tab should show the team you just added them to
   - This tests the "My Memberships" functionality

4. **Log in with the first account** (the owner account)
5. **Navigate to the Teams tab**
6. **You should see:**
   - "My Teams" tab should show the team (because they own it)
   - This tests the "My Teams" functionality

---

## Alternative: Manual Method Using Appwrite Console

If you prefer to do this manually through the Appwrite console:

### Step 1: Sign in to Appwrite Console

1. Go to https://cloud.appwrite.io
2. Sign in with your account
3. Select your project

### Step 2: Find Your Team

1. Go to **Auth** → **Teams**
2. Find the team you want to add a member to
3. Click on the team to view details
4. Copy the Team ID

### Step 3: Add Team Member

1. Still in the team details page
2. Go to the **Memberships** tab
3. Click **Create Invitation**
4. Enter the second account's email address
5. Select role: **Member**
6. Set the invite URL to: `workphotopro://team-invite`
7. Click **Create**

### Step 4: Accept the Invitation (Optional)

If you want the member to be immediately active:
1. The second account user should receive an email invitation
2. They can accept it through the app
3. Or you can manually activate it in Appwrite Console

### Step 5: Create Membership Record in Database

To make it work properly with your app:

1. Go to **Databases** → **memberships** collection
2. Click **Create Document**
3. Fill in these fields:
   - `userId`: The second account's user ID
   - `teamId`: The team ID from Step 2
   - `role`: `member`
   - `invitedBy`: The first account's user ID
   - `joinedAt`: Current date/time
   - `isActive`: `true`
4. Click **Create**

### Step 6: Get User IDs

To find the user IDs:

1. Go to **Auth** → **Users**
2. Find each user
3. Copy their User ID from the details

---

## Troubleshooting

### "User not found" error

- Make sure both accounts exist in Appwrite
- Check that you're using the correct email addresses
- Verify the accounts have been activated

### "Team not found" error

- Make sure at least one team exists
- Run the app and create a team first
- Check that the owner account has teams

### "Already a member" error

- The user is already a member of that team
- Try a different team or a different user
- Or remove the existing membership first

### Can't see "My Memberships" in app

- Make sure you're logged in with the second account (member)
- Refresh the Teams tab
- Check that the membership was created with `isActive: true`
- Verify the role is not "owner" (memberships only shows non-owners)

### Can't see "My Teams" in app

- Make sure you're logged in with the first account (owner)
- Refresh the Teams tab
- Check that the team belongs to an organization owned by the user

### Script fails with "Missing EXPO_PUBLIC_APPWRITE_DATABASE_ID"

- Make sure your `.env` file exists in the project root
- Check that it contains:
  ```
  EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
  EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
  EXPO_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
  ```

---

## What the Script Does

The script (`scripts/add-team-member.js`) performs these steps:

1. **Signs in** as the team owner account
2. **Lists all teams** for that account
3. **Selects the first team** (you can modify the script to select a different one)
4. **Creates a team membership** in Appwrite
5. **Creates a membership record** in your database
6. **Provides feedback** on what was created

This is much easier than doing it manually!

---

## Understanding the Tabs

### "My Memberships" Tab

Shows teams where the user is a **member** but **not** an owner, and the team is **not** from an organization they own.

This is what you'll see when you log in with the second account (the member).

### "My Teams" Tab

Shows teams from organizations that the user **owns**.

This is what you'll see when you log in with the first account (the owner).

---

## Next Steps After Testing

Once you've verified both tabs work:

1. Test with different roles (admin, member, etc.)
2. Test with multiple teams
3. Test switching between teams
4. Test the team details page
5. Test removing/leaving teams

---

## Need Help?

If you run into issues:

1. Check the console output from the script
2. Check the Appwrite Console for errors
3. Review the team service code in `lib/appwrite/teams.ts`
4. Check the teams page logic in `app/(jobs)/teams.tsx`
