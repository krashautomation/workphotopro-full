# Adding Team Support to Job Creation

## Summary

To enable job creation with team association, you need to:

1. **Update the Appwrite Database** - Add `teamId` and `orgId` attributes to the `jobchat` collection
2. **Code is Already Updated** - The `new-job.tsx` component now uses `jobChatService` which properly handles team association

## What Changed in the Code

### File: `app/(jobs)/new-job.tsx`

**Before:**
- Used direct Appwrite database calls
- Created jobs without `teamId` or `orgId`
- Jobs were not associated with any team

**After:**
- Uses `jobChatService.createJobChat()` which handles team association
- Gets current team and organization from `useOrganization()` context
- Validates that a team is selected before creating jobs
- Shows alerts if no team/organization is selected

### Key Changes:
1. Import `useOrganization` and `jobChatService`
2. Get `currentTeam` and `currentOrganization` from context
3. Validate team selection before creating job
4. Pass `teamId` and `orgId` to the service

## Database Changes Required

### 1. Add Attributes to `jobchat` Collection

Go to your Appwrite Console:
1. Navigate to **Databases** → Your Database → **jobchat** collection
2. Click **"Add Attribute"**
3. Add these two attributes:

#### Attribute 1: `teamId`
- **Type**: String
- **Size**: 36 characters
- **Required**: Yes
- **Array**: No

#### Attribute 2: `orgId`
- **Type**: String
- **Size**: 36 characters
- **Required**: Yes
- **Array**: No

### 2. Create Indexes

After adding the attributes, create these indexes:

1. **Click "Indexes" tab** in the jobchat collection
2. **Create Index** for `teamId`:
   - Key: `teamId`
   - Type: Key
   - Attributes: `teamId`

3. **Create Index** for `orgId`:
   - Key: `orgId`
   - Type: Key
   - Attributes: `orgId`

### 3. Update Permissions (Optional)

You can update permissions to use team-based access control:

```
Read: Role.team(teamId)
Update: Role.team(teamId)
Delete: Role.team(teamId)
```

## How It Works Now

1. User clicks "Create Job" button
2. App checks if user has selected a team
3. If no team selected, shows alert: "Please select a team before creating a job"
4. If team is selected:
   - Gets `currentTeam.$id` and `currentOrganization.$id`
   - Calls `jobChatService.createJobChat()` with:
     - Job data (title, description, creator info)
     - `teamId` from current team
     - `orgId` from current organization
5. Service creates the job with proper team/organization association
6. Job appears in the jobs list filtered by the current team

## Testing

After adding the database attributes:

1. Make sure you have a team selected
2. Go to Jobs page
3. Click "New Job" button
4. Fill in job details
5. Click "Create"
6. Job should be created and associated with your current team

## Benefits

- **Multi-tenant Support**: Jobs are isolated per team
- **Proper Filtering**: Jobs list only shows jobs for the current team
- **Security**: Team-based permissions can be applied
- **Organization Context**: Jobs are linked to both team and organization

## Notes

- Make sure users have a team selected before trying to create jobs
- The organization context automatically handles team selection
- Jobs created without a team (old data) will need to be migrated or handled separately
