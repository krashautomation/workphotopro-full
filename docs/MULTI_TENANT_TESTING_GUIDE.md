# Multi-Tenant Testing Guide

This guide will help you test the multi-tenant implementation in WorkPhotoPro.

## Prerequisites

1. **Database Collections Created**: Follow the `DATABASE_COLLECTIONS_SETUP.md` guide first
2. **Appwrite Teams Enabled**: Ensure Teams feature is enabled in your Appwrite project
3. **Environment Variables**: Make sure your `.env` file is properly configured

## Testing Steps

### Step 1: Create Your First Organization

1. **Sign in to your app**
2. **Navigate to the Jobs screen**
3. **You should see organization and team selectors**
4. **If no organization exists, you'll need to create one programmatically** (we'll add UI for this later)

### Step 2: Test Organization Creation (Programmatic)

You can test organization creation by adding this temporary code to your app:

```typescript
// Add this to any screen for testing
import { useOrganization } from '@/context/OrganizationContext';

const { createOrganization } = useOrganization();

const testCreateOrg = async () => {
  try {
    const org = await createOrganization('Test Company', 'A test organization');
    console.log('Created organization:', org);
  } catch (error) {
    console.error('Error creating organization:', error);
  }
};
```

### Step 3: Test Team Creation

```typescript
const { createTeam, currentOrganization } = useOrganization();

const testCreateTeam = async () => {
  if (!currentOrganization) {
    console.log('No organization selected');
    return;
  }
  
  try {
    const team = await createTeam('Development Team', 'Our main development team');
    console.log('Created team:', team);
  } catch (error) {
    console.error('Error creating team:', error);
  }
};
```

### Step 4: Test Job Creation with Multi-Tenancy

```typescript
import { jobChatService } from '@/lib/appwrite/database';
import { useOrganization } from '@/context/OrganizationContext';

const { currentTeam, currentOrganization } = useOrganization();

const testCreateJob = async () => {
  if (!currentTeam || !currentOrganization) {
    console.log('No team or organization selected');
    return;
  }
  
  try {
    const job = await jobChatService.createJobChat(
      {
        title: 'Test Job',
        description: 'A test job for multi-tenancy',
        createdBy: 'user_id_here',
        createdByName: 'Test User'
      },
      currentTeam.$id,
      currentOrganization.$id
    );
    console.log('Created job:', job);
  } catch (error) {
    console.error('Error creating job:', error);
  }
};
```

### Step 5: Test Data Isolation

1. **Create multiple organizations and teams**
2. **Create jobs in different teams**
3. **Verify that jobs are only visible within their respective teams**
4. **Switch between teams and verify data isolation**

## Expected Behavior

### ✅ What Should Work

1. **Organization Selection**: Users can switch between organizations they own
2. **Team Selection**: Users can switch between teams they're members of
3. **Data Isolation**: Jobs are only visible within their team context
4. **Context Persistence**: Selected organization/team persists across app sessions
5. **Loading States**: Proper loading indicators while fetching data

### ❌ What Might Not Work Yet

1. **Organization Creation UI**: No UI for creating organizations yet
2. **Team Management UI**: No UI for inviting members or managing teams
3. **Error Handling**: Some error states might not be fully handled
4. **Data Migration**: Existing jobs won't have team/org data until migrated

## Troubleshooting

### Common Issues

1. **"No team selected" error**
   - **Cause**: User hasn't been added to any teams yet
   - **Solution**: Create a team programmatically or add user to existing team

2. **Jobs not loading**
   - **Cause**: Jobs don't have teamId/orgId fields
   - **Solution**: Migrate existing jobs or create new ones with proper team context

3. **Permission errors**
   - **Cause**: Database permissions not set correctly
   - **Solution**: Check Appwrite console permissions for collections

4. **Context not loading**
   - **Cause**: OrganizationProvider not wrapping the app
   - **Solution**: Ensure OrganizationProvider is in the component tree

### Debug Commands

Add these to your app for debugging:

```typescript
// Debug current state
const debugState = () => {
  console.log('Current Organization:', currentOrganization);
  console.log('Current Team:', currentTeam);
  console.log('User Organizations:', userOrganizations);
  console.log('User Teams:', userTeams);
};

// Debug database collections
const debugCollections = async () => {
  try {
    const orgs = await organizationService.listUserOrganizations('your_user_id');
    console.log('Organizations:', orgs);
    
    const teams = await teamService.listTeams();
    console.log('Teams:', teams);
  } catch (error) {
    console.error('Debug error:', error);
  }
};
```

## Next Steps

After basic testing works:

1. **Add Organization Creation UI**
2. **Add Team Management UI**
3. **Add Member Invitation Flow**
4. **Add Data Migration Script**
5. **Add Error Boundaries**
6. **Add Loading States**
7. **Add Offline Support**

## Database Migration

To migrate existing jobs to multi-tenant:

```typescript
// Run this once to migrate existing jobs
const migrateExistingJobs = async () => {
  const jobs = await jobChatService.listJobChats();
  
  for (const job of jobs.documents) {
    if (!job.teamId || !job.orgId) {
      // Assign to default team/org
      await jobChatService.updateJobChat(job.$id, {
        teamId: 'default_team_id',
        orgId: 'default_org_id'
      });
    }
  }
};
```

## Support

If you encounter issues:

1. Check the console for error messages
2. Verify database collections are created correctly
3. Check Appwrite console for permission errors
4. Ensure environment variables are set correctly
5. Check that the OrganizationProvider is properly wrapping your app
