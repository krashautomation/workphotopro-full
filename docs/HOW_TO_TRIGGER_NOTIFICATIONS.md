# 🔔 How to Trigger Push Notifications

This guide shows you **where and how** to add push notification triggers in your app.

## Quick Start

Import the notification helper:

```typescript
import { sendNotification, sendNotificationsToTeam } from '@/lib/appwrite/notificationHelper';
```

## Common Notification Scenarios

### 1. When a Task is Created

**Where:** In your task creation code (when a message with `isTask: true` is created)

**Example:**

```typescript
import { sendNotificationsToTeam, getTeamMemberIds } from '@/lib/appwrite/notificationHelper';

async function createTask(jobId: string, taskTitle: string, currentUserId: string) {
  // 1. Create the task (as a message)
  const task = await databaseService.createDocument('jobchat', {
    jobId,
    text: taskTitle,
    isTask: true,
    taskStatus: 'active',
    senderId: currentUserId,
    // ... other fields
  });

  // 2. Get team members (excluding the creator)
  const teamMemberIds = await getTeamMemberIds(jobId);
  const otherMembers = teamMemberIds.filter(id => id !== currentUserId);

  // 3. Send notifications to team members
  if (otherMembers.length > 0) {
    await sendNotificationsToTeam(
      otherMembers,
      'task_created',
      'New Task Created',
      `${taskTitle} in ${jobName}`,
      {
        jobId: jobId,
        taskId: task.$id,
        type: 'task_created',
      }
    );
  }

  return task;
}
```

**Where to add this:**
- In `app/(jobs)/[job].tsx` - when sending a message that's a task
- Or in your chat component where messages are created

---

### 2. When a Task is Completed

**Where:** In your task completion handler

**Example:**

```typescript
async function completeTask(taskId: string, jobId: string, currentUserId: string) {
  // 1. Update task status
  await databaseService.updateDocument('jobchat', taskId, {
    taskStatus: 'completed',
  });

  // 2. Get task details
  const task = await databaseService.getDocument('jobchat', taskId);
  
  // 3. Get team members
  const teamMemberIds = await getTeamMemberIds(jobId);
  const otherMembers = teamMemberIds.filter(id => id !== currentUserId);

  // 4. Notify team members
  if (otherMembers.length > 0) {
    await sendNotificationsToTeam(
      otherMembers,
      'task_completed',
      'Task Completed',
      `${task.text} has been completed`,
      {
        jobId: jobId,
        taskId: taskId,
        type: 'task_completed',
      }
    );
  }
}
```

**Where to add this:**
- In `app/(jobs)/job-tasks.tsx` - in the `onCompleteTask` handler

---

### 3. When a Message is Sent

**Where:** In your chat message sending code

**Example:**

```typescript
async function sendMessage(jobId: string, text: string, currentUserId: string) {
  // 1. Create message
  const message = await databaseService.createDocument('jobchat', {
    jobId,
    text,
    senderId: currentUserId,
    // ... other fields
  });

  // 2. Get team members (excluding sender)
  const teamMemberIds = await getTeamMemberIds(jobId);
  const otherMembers = teamMemberIds.filter(id => id !== currentUserId);

  // 3. Notify team members
  if (otherMembers.length > 0) {
    await sendNotificationsToTeam(
      otherMembers,
      'message',
      'New Message',
      text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      {
        jobId: jobId,
        messageId: message.$id,
        type: 'message',
      }
    );
  }

  return message;
}
```

**Where to add this:**
- In `app/(jobs)/[job].tsx` - in your message sending handler

---

### 4. When a Job is Assigned

**Where:** In your job assignment code

**Example:**

```typescript
async function assignJob(jobId: string, assignedUserId: string) {
  // 1. Update job
  await databaseService.updateDocument('jobs', jobId, {
    assignedUserId,
  });

  // 2. Get job details
  const job = await databaseService.getDocument('jobs', jobId);

  // 3. Notify assigned user
  await sendNotification(
    assignedUserId,
    'job_assigned',
    'New Job Assignment',
    `You've been assigned to: ${job.name}`,
    {
      jobId: jobId,
      type: 'job_assigned',
    }
  );
}
```

**Where to add this:**
- In job assignment screens or admin functions

---

### 5. When a Photo is Uploaded

**Where:** In your photo upload handler

**Example:**

```typescript
async function uploadPhoto(jobId: string, photoUrl: string, currentUserId: string) {
  // 1. Upload photo and create document
  const photo = await databaseService.createDocument('photos', {
    jobId,
    url: photoUrl,
    uploadedBy: currentUserId,
    // ... other fields
  });

  // 2. Get team members
  const teamMemberIds = await getTeamMemberIds(jobId);
  const otherMembers = teamMemberIds.filter(id => id !== currentUserId);

  // 3. Notify team members
  if (otherMembers.length > 0) {
    await sendNotificationsToTeam(
      otherMembers,
      'photo_uploaded',
      'New Photo Uploaded',
      `A new photo was added to the job`,
      {
        jobId: jobId,
        photoId: photo.$id,
        type: 'photo_uploaded',
      }
    );
  }

  return photo;
}
```

---

### 6. When a Team Invite is Sent

**Where:** In your team invite code

**Example:**

```typescript
async function inviteTeamMember(teamId: string, invitedUserId: string, inviterName: string) {
  // 1. Create invite
  const invite = await databaseService.createDocument('team_invites', {
    teamId,
    invitedUserId,
    status: 'pending',
    // ... other fields
  });

  // 2. Notify invited user
  await sendNotification(
    invitedUserId,
    'team_invite',
    'Team Invitation',
    `${inviterName} invited you to join a team`,
    {
      teamId: teamId,
      inviteId: invite.$id,
      type: 'team_invite',
    }
  );

  return invite;
}
```

---

## Notification Preferences

The `sendNotification` function automatically checks if the user has notifications enabled for that type. Currently, it defaults to `true` (enabled).

**To implement preferences:**

1. Create a `user_notification_preferences` collection in Appwrite
2. Store preferences like:
   ```typescript
   {
     userId: string,
     task_created: boolean,
     task_completed: boolean,
     message: boolean,
     // ... etc
   }
   ```
3. Update `isNotificationEnabled()` in `lib/appwrite/notificationHelper.ts` to check these preferences

---

## Best Practices

1. **Don't notify the creator:** Always exclude the user who triggered the event
   ```typescript
   const otherMembers = teamMemberIds.filter(id => id !== currentUserId);
   ```

2. **Handle errors gracefully:** Notifications failing shouldn't break your app
   ```typescript
   try {
     await sendNotificationsToTeam(...);
   } catch (error) {
     console.error('Failed to send notifications:', error);
     // Continue with your app logic
   }
   ```

3. **Keep messages concise:** Push notification titles/bodies should be short
   ```typescript
   body: text.substring(0, 50) + (text.length > 50 ? '...' : '')
   ```

4. **Include relevant data:** Always include IDs so navigation works
   ```typescript
   data: {
     jobId: jobId,
     taskId: taskId,
     type: 'task_created',
   }
   ```

---

## Testing

**Test a notification:**

```typescript
import { sendNotification } from '@/lib/appwrite/notificationHelper';
import { useAuth } from '@/context/AuthContext';

const { user } = useAuth();

// Send a test notification to yourself
await sendNotification(
  user.$id,
  'task_created',
  'Test Notification',
  'This is a test!',
  { test: true }
);
```

---

## Next Steps

1. ✅ Add notification triggers to your key events (tasks, messages, etc.)
2. ⏳ Implement notification preferences (optional)
3. ⏳ Add notification badges/counts (optional)
4. ⏳ Create in-app notifications screen (optional)

See `docs/PUSH_NOTIFICATIONS_CHECKLIST.md` for the complete setup guide.

