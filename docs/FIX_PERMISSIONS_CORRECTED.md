# Fix Permissions - CORRECTED Format

## The Problem
Appwrite permissions need specific format: `users` or `user:[USER_ID]` or `team:[TEAM_ID]/[ROLE]`

## Correct Steps

### 1. Navigate to Collection Settings
- Appwrite Console → Databases → Your Database → Collections → `user_preferences` → Settings

### 2. Add Read Permission
- Click **Add Permission** under Read Permission
- In the dropdown, type: `users`
- Click **Add**

### 3. Add Create Permission
- Click **Add Permission** under Create Permission
- In the dropdown, type: `users`
- Click **Add**

### 4. Add Update Permission
- Click **Add Permission** under Update Permission
- In the dropdown, type: `users`
- Click **Add**
- **For the safety rule** (optional but recommended):
  - Click **Add Rule** 
  - Field: select `userId`
  - Condition: equals (`==`)
  - Value: `$userId`
  - Click **Add**

### 5. Save
- Click **Update** button

## Exact Values to Type

Just type `users` in the permission field. That's it!

```
✓ Read Permission: users
✓ Create Permission: users  
✓ Update Permission: users
✓ Update Rule: userId == $userId
```

## Screenshot Guide

The permission field should show:
```
Enter a permission: [users]
```

Just type `users` and click Add. Don't include `role:` or anything else.

## What This Grants

- **`users`** = All authenticated users can perform this action
- The `userId == $userId` rule on Update ensures users can only update their own records

## Test

After saving:
1. Take a photo
2. Should work without black screen
3. Check Appwrite → Documents tab in `user_preferences` collection to see the created document

