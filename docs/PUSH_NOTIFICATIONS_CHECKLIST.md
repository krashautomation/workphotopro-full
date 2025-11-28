# 🔔 Push Notifications Setup Checklist

## ✅ What's Already Done

1. ✅ **Push Token Registration Hook** (`hooks/useFCMToken.ts`)
   - Gets Expo push tokens
   - Saves tokens to Appwrite Database
   - Handles permissions

2. ✅ **Push Token Service** (`lib/appwrite/pushTokens.ts`)
   - Saves/updates tokens
   - Retrieves tokens by user/platform
   - Deletes tokens

3. ✅ **Integration** (`app/_layout.tsx`)
   - Automatically registers tokens on login
   - Notification listeners for foreground/background
   - Notification tap handling with navigation

4. ✅ **Messaging Service** (`lib/appwrite/messaging.ts`)
   - Methods to send push notifications
   - Support for single user and team notifications
   - Multiple approaches (Expo Push API, Appwrite Messaging, Functions)

5. ✅ **App Config** (`app.config.js`)
   - `expo-notifications` plugin configured

6. ✅ **Dependencies**
   - `expo-notifications` installed

---

## ⏳ What Still Needs to Be Done

### Step 1: Create Appwrite Collection (5 minutes) ⚠️ REQUIRED

**Create `user_push_tokens` collection in Appwrite:**

1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Select your project
3. Go to **Databases** → Your Database
4. Click **"Create Collection"**
5. Name: `user_push_tokens`
6. Click **"Create"**

**Add Attributes:**

| Attribute ID | Type | Size | Required | Array |
|-------------|------|------|----------|-------|
| `userId` | string | 255 | ✅ Yes | ❌ No |
| `token` | string | 2048 | ✅ Yes | ❌ No |
| `platform` | string | 50 | ✅ Yes | ❌ No |
| `createdAt` | datetime | - | ✅ Yes | ❌ No |
| `updatedAt` | datetime | - | ✅ Yes | ❌ No |

**Set Permissions:**

- **Read:** `users` (users can read their own tokens)
- **Create:** `users` (users can create their own tokens)
- **Update:** `users` + query: `userId={{$userId}}` (users can only update their own)
- **Delete:** `users` + query: `userId={{$userId}}` (users can only delete their own)

**Create Index (Optional but Recommended):**

- **Key:** `userId_platform`
- **Type:** `key`
- **Attributes:** `userId`, `platform`
- **Orders:** `ASC`, `ASC`

---

### Step 2: Choose Your Push Notification Approach

You have **3 options** for sending push notifications:

#### Option A: Expo Push API (Simplest) ✅ Recommended for Quick Start

**Pros:**
- ✅ Works immediately with Expo push tokens
- ✅ No additional setup needed
- ✅ Works in development (Expo Go)

**Cons:**
- ⚠️ Requires Expo Push Notification service
- ⚠️ Rate limits apply

**Status:** ✅ Already implemented in `lib/appwrite/messaging.ts`

**Usage:**
```typescript
import { messagingService } from '@/lib/appwrite/messaging';

// Send to single user
await messagingService.sendPushNotification(
  userId,
  'New Task',
  'You have a new task assigned',
  { type: 'task_created', jobId: '...' }
);

// Send to team
await messagingService.sendPushToTeam(
  userIds,
  'New Message',
  'New message in job chat',
  { type: 'message', jobId: '...' }
);
```

---

#### Option B: Appwrite Messaging (Recommended for Production)

**Pros:**
- ✅ Integrated with Appwrite
- ✅ Better for production
- ✅ Uses Firebase Cloud Messaging directly

**Cons:**
- ⚠️ Requires FCM provider setup
- ⚠️ Requires Service Account Key

**Setup Steps:**

1. **Download Service Account Key from Firebase**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save the JSON file

2. **Store Service Account Key in Appwrite**
   - Go to Appwrite Console → Settings → Variables
   - Add variable: `FIREBASE_SERVICE_ACCOUNT_KEY`
   - Paste entire JSON content
   - Scope: All Functions

3. **Configure FCM Provider in Appwrite**
   - Go to **Messaging** → **Providers**
   - Click **"Create Provider"**
   - Select **"Push with FCM"**
   - Paste Service Account JSON or reference secret
   - Click **"Create"**

4. **Update Code** (if needed)
   - Use `messagingService.sendPushViaAppwriteMessaging()` instead
   - Or update `messagingService.sendPushNotification()` to use Appwrite API

**See:** `docs/APPWRITE_MESSAGING_SETUP.md` for detailed instructions

---

#### Option C: Custom Appwrite Function

**Pros:**
- ✅ Full control over notification logic
- ✅ Can add custom business logic

**Cons:**
- ⚠️ More code to write and maintain
- ⚠️ Requires Function setup

**Setup Steps:**

1. **Create Appwrite Function**
   - Go to Functions → Create Function
   - Name: `send-push-notification`
   - Runtime: Node.js 18.0

2. **Add Function Code**
   - See `docs/APPWRITE_FUNCTION_CODE.md` for example code

3. **Store Service Account Key**
   - Add as Function variable: `FIREBASE_SERVICE_ACCOUNT_KEY`

4. **Use in Code**
   - Call `messagingService.sendPushViaFunction()` (needs implementation)

**See:** `docs/BACKEND_PUSH_NOTIFICATIONS_SETUP.md` for detailed instructions

---

### Step 3: Test Push Token Registration

1. **Run your app:**
   ```bash
   npm start
   ```

2. **Sign in with a user account**

3. **Check console logs:**
   - Should see: `✅ Push token registered: ExponentPushToken[...`

4. **Verify in Appwrite:**
   - Go to Databases → `user_push_tokens` collection
   - Should see a document with your user ID and token

---

### Step 4: Test Sending a Push Notification

**Option A: Using Expo Push Notification Tool**

1. Get your Expo push token from Appwrite Database
2. Go to https://expo.dev/notifications
3. Paste your token
4. Enter title and message
5. Click "Send a Notification"
6. Check your device!

**Option B: Using Code**

Add this to a test screen or button:

```typescript
import { messagingService } from '@/lib/appwrite/messaging';
import { useAuth } from '@/context/AuthContext';

const { user } = useAuth();

const testNotification = async () => {
  if (!user) return;
  
  await messagingService.sendPushNotification(
    user.$id,
    'Test Notification',
    'This is a test push notification!',
    { type: 'test' }
  );
};
```

---

### Step 5: Set Up Automatic Notifications (Optional)

**When to send notifications:**

1. **New task created** → Notify team members
2. **New message in chat** → Notify other team members
3. **Job assigned** → Notify assigned user
4. **Team invite** → Notify invited user
5. **Photo uploaded** → Notify team members

**Example: Send notification when task is created**

```typescript
// In your task creation code
import { messagingService } from '@/lib/appwrite/messaging';
import { teamService } from '@/lib/appwrite/teams';

async function createTask(jobId: string, taskTitle: string) {
  // 1. Create task
  const task = await databaseService.createDocument('tasks', {
    jobId,
    title: taskTitle,
    // ...
  });

  // 2. Get team members
  const team = await teamService.getTeamByJobId(jobId);
  const memberIds = team.members.map(m => m.userId);

  // 3. Send push notifications
  await messagingService.sendPushToTeam(
    memberIds,
    'New Task Created',
    `${taskTitle} in ${jobName}`,
    {
      type: 'task_created',
      taskId: task.$id,
      jobId: jobId,
    }
  );
}
```

**Better Approach: Use Appwrite Database Events**

Set up an Appwrite Function trigger:
- Event: `databases.tasks.documents.create`
- Function automatically runs when task is created
- Function sends push notifications

See `docs/BACKEND_PUSH_NOTIFICATIONS_SETUP.md` for details.

---

## 📋 Complete Checklist

- [ ] **Step 1:** Create `user_push_tokens` collection in Appwrite
- [ ] **Step 2:** Choose push notification approach (A, B, or C)
- [ ] **Step 2A (if using Appwrite Messaging):** Configure FCM provider
- [ ] **Step 2B (if using Functions):** Create Appwrite Function
- [ ] **Step 3:** Test push token registration
- [ ] **Step 4:** Test sending a push notification
- [ ] **Step 5:** Set up automatic notifications for your events
- [ ] **Production:** Configure EAS credentials for production builds

---

## 🐛 Troubleshooting

### "Collection not found" Error
- ✅ Make sure you created the `user_push_tokens` collection
- ✅ Verify collection ID matches exactly (case-sensitive)

### "Permission denied" Error
- ✅ Check collection permissions
- ✅ Make sure `users` have Create permission
- ✅ Verify user is authenticated

### Token Not Saving
- ✅ Check console logs for errors
- ✅ Verify user is logged in
- ✅ Check network connection
- ✅ Verify Appwrite endpoint is correct

### Token is null
- ✅ Check notification permissions are granted
- ✅ Verify `expo-notifications` is installed
- ✅ Check EAS project ID is correct in `.env`

### Notification Not Received
- ✅ Check device notification permissions
- ✅ Verify token is saved in Appwrite
- ✅ Test with Expo Push Notification Tool
- ✅ Check notification isn't being blocked

### "Invalid token" Error
- ✅ Make sure you're using Expo push tokens (not FCM tokens)
- ✅ Verify token format is correct
- ✅ Check token hasn't expired

---

## 📚 Related Documentation

- `docs/PUSH_TOKEN_SETUP_INSTRUCTIONS.md` - Token registration setup
- `docs/APPWRITE_MESSAGING_SETUP.md` - Appwrite Messaging setup
- `docs/BACKEND_PUSH_NOTIFICATIONS_SETUP.md` - Custom Function setup
- `docs/NOTIFICATIONS_IMPLEMENTATION_GUIDE.md` - Full implementation guide

---

## 🎯 Next Steps After Setup

1. ✅ Test push notifications work end-to-end
2. ✅ Set up automatic notifications for key events
3. ✅ Add notification preferences (users can opt out)
4. ✅ Create in-app notifications screen (optional)
5. ✅ Set up notification badges/counts
6. ✅ Test on production build (EAS Build)

---

## 💡 Tips

- **Development:** Use Expo Push API (Option A) - works immediately
- **Production:** Consider Appwrite Messaging (Option B) for better reliability
- **Testing:** Use Expo Push Notification Tool for quick tests
- **Permissions:** Always request notification permissions gracefully
- **Tokens:** Tokens can change - handle token updates automatically
- **Rate Limits:** Be mindful of Expo Push API rate limits in production

