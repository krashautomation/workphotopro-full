# Quick Guide: Add Team Member for Testing

## 🚀 Easiest Method: Use the Script

### 1. Edit the script
Open `scripts/add-team-member.js` and update lines 41-47:

```javascript
const ACCOUNTS = {
  owner: {
    email: 'your-account@example.com',  // Change this
    password: 'YourPassword!'            // Change this
  },
  member: {
    email: 'other-account@example.com',  // Change this
    password: 'TheirPassword!'           // Change this
  }
};
```

### 2. Run the script
```bash
npm run add-team-member
```

### 3. Test in your app
- **Log in with member account** → Check "My Memberships" tab
- **Log in with owner account** → Check "My Teams" tab

---

## 📋 Manual Method (Appwrite Console)

### 1. Add Membership (Appwrite)
1. Go to https://cloud.appwrite.io → Auth → Teams
2. Click on your team → Memberships tab
3. Create Invitation:
   - Email: second account's email
   - Role: Member
   - URL: `workphotopro://team-invite`

### 2. Add Membership Record (Database)
1. Go to Databases → memberships
2. Create Document with:
   - `userId`: [member's user ID]
   - `teamId`: [team ID]
   - `role`: `member`
   - `invitedBy`: [owner's user ID]
   - `joinedAt`: [now]
   - `isActive`: `true`

---

## ✅ What to Test

### My Memberships Tab
- Log in with member account
- Navigate to Teams tab
- Click "My Memberships" tab
- Should see the team you added them to

### My Teams Tab
- Log in with owner account
- Navigate to Teams tab
- Click "My Teams" tab
- Should see teams from orgs you own

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "No teams found" | Create a team first in the app |
| "User not found" | Make sure both accounts exist |
| "Already a member" | User is already in that team |
| Can't see memberships | Check `isActive: true` in database |
| Script fails | Check `.env` file exists |

---

**Full guide:** `docs/ADD_TEAM_MEMBER_GUIDE.md`
