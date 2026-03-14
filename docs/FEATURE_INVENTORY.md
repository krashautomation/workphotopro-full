# WorkPhotoPro V2 - Feature Inventory

Comprehensive inventory of all features, screens, integrations, and database collections in the WorkPhotoPro V2 application.

---

## 1. SCREENS

### Authentication Screens (app/(auth)/)

| Screen | Route | Primary Purpose |
|--------|-------|-----------------|
| `sign-in.tsx` | `/sign-in` | Email/password login with Google OAuth capability (commented out) |
| `sign-up.tsx` | `/sign-up` | Account creation with email/password, organization setup |
| `forgot-password.tsx` | `/forgot-password` | Initiate password recovery via email |
| `reset-password.tsx` | `/reset-password` | Reset password using recovery token |
| `check-email.tsx` | `/check-email` | Check email inbox for verification message |
| `verify-email.tsx` | `/verify-email` | Email OTP verification for account confirmation |
| `accept-invite.tsx` | `/accept-invite` | Accept team/organization invitations via deep link |
| `_layout.tsx` | N/A | Auth group layout with stack navigator |

### Main App Screens (app/(jobs)/)

| Screen | Route | Primary Purpose |
|--------|-------|-----------------|
| `index.tsx` | `/` | **Dashboard** - Job/chat list with search, filters, achievements card |
| `[job].tsx` | `/[job]` | **Job Chat** - Main chat interface with messages, photos, videos, tasks, duties |
| `new-job.tsx` | `/new-job` | Create new job/chat with title, description, tags |
| `job-details.tsx` | `/job-details` | View job information and metadata |
| `job-uploads.tsx` | `/job-uploads` | Photo/video gallery for a specific job |
| `job-tasks.tsx` | `/job-tasks` | Task and duty management for jobs |
| `teams.tsx` | `/teams` | List all teams in organization |
| `team.tsx` | `/team` | View individual team details and members |
| `new-team.tsx` | `/new-team` | Create new team with name and settings |
| `edit-team.tsx` | `/edit-team` | Edit team name, photo, and contact information |
| `team-settings.tsx` | `/team-settings` | Configure team settings and permissions |
| `delete-team.tsx` | `/delete-team` | Delete team with confirmation |
| `manage-member.tsx` | `/manage-member` | Change member roles and permissions |
| `invite.tsx` | `/invite` | Invite users to team via email or username |
| `invite-contacts.tsx` | `/invite-contacts` | Invite users from phone contacts |
| `contacts.tsx` | `/contacts` | Phone contacts integration and selection |
| `archived-teams.tsx` | `/archived-teams` | View and restore archived teams |
| `profile-settings.tsx` | `/profile-settings` | Edit user profile information |
| `user-profile.tsx` | `/user-profile` | View other user profiles |
| `edit-account.tsx` | `/edit-account` | Account settings and preferences |
| `notifications.tsx` | `/notifications` | In-app notifications list and management |
| `notification-settings.tsx` | `/notification-settings` | Push notification preferences toggle |
| `filter-jobs.tsx` | `/filter-jobs` | Job filtering modal with status and date filters |
| `camera.tsx` | `/camera` | Take photos with automatic watermark overlay |
| `video-camera.tsx` | `/video-camera` | Record video with premium feature lock |
| `choose-job-for-photo.tsx` | `/choose-job-for-photo` | Select job before capturing photo/video |
| `trashed-jobs.tsx` | `/trashed-jobs` | View and restore soft-deleted jobs |
| `share-job.tsx` | `/share-job` | Share job via link or QR code |
| `share-report-modal.tsx` | `/share-report-modal` | Share generated PDF reports |
| `achievements.tsx` | `/achievements` | Gamification system with experience points and levels |
| `get-premium.tsx` | `/get-premium` | Subscription pricing page with 10 tiers ($7.99-$74.99) |
| `get-package.tsx` | `/get-package` | Package details modal for subscription tiers |
| `edit-organization.tsx` | `/edit-organization` | Organization settings and management |
| `edit-tags.tsx` | `/edit-tags` | Manage job tag templates |
| `edit-tag.tsx` | `/edit-tag` | Edit individual tag details |
| `edit-job-title.tsx` | `/edit-job-title` | Edit job title inline |
| `web-design-test.tsx` | `/web-design-test` | Web design system testing page |
| `settings/[job].tsx` | `/settings/[job]` | Job-specific settings |
| `settings/cache.tsx` | `/settings/cache` | Cache management and cleanup |
| `_layout.tsx` | N/A | Main app layout with header, tab bar, and navigation |

---

## 2. FEATURES

### Authentication

- **Email/Password Login**: Traditional authentication with email and password
- **Account Registration**: Sign up with email, password, name, and phone number
- **Email Verification**: OTP-based email verification system
- **Password Recovery**: Forgot password flow with email token
- **Password Reset**: Token-based password reset
- **Google OAuth**: Google sign-in integration (currently commented out but code exists)
- **Session Management**: Automatic token refresh and session persistence
- **Biometric Authentication**: Secure storage for credentials

### Jobs / Projects

- **Job Creation**: Create jobs with title, description, and tags
- **Job Chat**: Real-time messaging within job context
- **Job Status**: Active, completed, archived status management
- **Job Filtering**: Filter by status, date, tags, and search text
- **Job Search**: Full-text search across job titles and descriptions
- **Soft Delete**: Move jobs to trash before permanent deletion
- **Trash Management**: View and restore deleted jobs
- **Job Sharing**: Share jobs via public links or QR codes
- **Job Reports**: Generate and share PDF reports
- **Achievements**: Gamification with XP for job activities
- **Tag System**: Color-coded tags for job organization

### Photos / Media

- **Photo Capture**: In-app camera with automatic watermark overlay
- **Video Recording**: Record videos with premium feature requirement
- **Multi-Image Upload**: Upload up to 9 images simultaneously
- **HD Capture Toggle**: Switch between standard and HD quality (premium)
- **Watermark Toggle**: Enable/disable watermark overlay (premium)
- **Photo Gallery**: View all photos in a job
- **Video Player**: In-app video playback with controls
- **Full-Screen Video**: Full-screen video viewing mode
- **Image Caching**: Offline image caching for performance
- **File Uploads**: Support for documents and other files

### Chat / Messages

- **Text Messages**: Send and receive text messages
- **Image Messages**: Send photos in chat
- **Video Messages**: Send video files in chat
- **Audio Messages**: Record and send voice messages
- **Location Sharing**: Share GPS coordinates with map preview
- **File Attachments**: Send documents and files
- **Task Messages**: Create tasks within chat
- **Duty Messages**: Assign duties within chat
- **Message Status**: Delivery and read receipts
- **Typing Indicators**: Show when users are typing
- **Real-time Updates**: Live message updates (currently disabled due to WebSocket errors)
- **Message Search**: Search through chat history
- **Emoji Support**: Emoji picker for reactions

### Teams / Members

- **Team Creation**: Create teams within organization
- **Team Editing**: Update team name, photo, and contact info
- **Team Archiving**: Soft-delete teams
- **Team Restoration**: Restore archived teams
- **Member Management**: Add/remove team members
- **Role Assignment**: Owner and member roles with different permissions
- **Invitations**: Invite users via email, username, or contacts
- **Invitation Links**: Generate shareable invite links
- **Contact Integration**: Invite from phone contacts
- **Member Profiles**: View member information and activity

### Organizations

- **Multi-tenancy**: Support for multiple organizations per user
- **Organization Creation**: Create new organizations on signup
- **Organization Switching**: Switch between organizations
- **Organization Settings**: Edit org name and settings
- **Team-Organization Link**: Teams belong to organizations
- **Premium Tiers**: Organization-level subscription management
- **Organization Selector**: UI for switching contexts

### Notifications

- **Push Notifications**: Real-time push via Expo Push API
- **In-App Notifications**: Notification center within app
- **Notification Types**: Job updates, mentions, invitations, system messages
- **Notification Preferences**: Toggle different notification types
- **FCM Token Management**: Firebase Cloud Messaging token registration
- **Badge Counts**: Unread notification counters
- **Deep Linking**: Navigate to relevant screens from notifications

### Settings

- **Profile Settings**: Edit name, photo, and contact info
- **Account Settings**: Email, password, and security settings
- **Notification Settings**: Push notification preferences
- **Cache Management**: Clear app cache and storage
- **Job Settings**: Per-job configuration options
- **HD Photo Settings**: Default HD capture preference
- **Timestamp Settings**: Photo timestamp preferences
- **Organization Settings**: Organization-wide configuration

### Subscriptions / Premium

- **10 Pricing Tiers**: $7.99 to $74.99/month subscription options
- **RevenueCat Integration**: In-app purchase management
- **Premium Features**:
  - HD photo capture
  - Video recording
  - Watermark toggle
  - Unlimited job creation
  - Priority support
- **Subscription Sync**: Sync subscription status with backend
- **Trial Support**: Free trial periods
- **Upgrade/Downgrade**: Change subscription tiers
- **Billing Management**: View and manage billing

### AI / Reports

- **Katya AI Assistant**: AI agent for job assistance (partially implemented)
  - Client-side integration exists
  - Server-side via Cloud Functions (stubbed)
  - Trigger functionality has TODO comment
- **PDF Report Generation**: Generate job reports
- **Report Sharing**: Share reports via PDF
- **Watermark Reports**: Branded report output

---

## 3. INTEGRATIONS

### Active Integrations

#### Appwrite (Backend-as-a-Service)
- **Service**: Database, Authentication, Storage, Teams, Realtime
- **Endpoint**: `https://sfo.cloud.appwrite.io/v1`
- **Project ID**: `68e9d42100365e14f358`
- **Purpose**: 
  - User authentication and session management
  - NoSQL database for all app data
  - File storage for images, videos, and documents
  - Team and permission management
  - Real-time subscriptions for live updates

#### RevenueCat (In-App Purchases)
- **Service**: Subscription management and billing
- **Purpose**:
  - Handle in-app purchases across iOS and Android
  - Manage 10 subscription tiers ($7.99 - $74.99/month)
  - Track subscription status and entitlements
  - Process payments securely
- **Environment Variables**:
  - `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
  - `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`

#### Expo Push Notifications
- **Service**: Push notification delivery
- **Purpose**:
  - Send push notifications to devices
  - Manage push tokens
  - Handle notification delivery via Expo Push API
- **Components**: `useFCMToken` hook, token management

#### Google OAuth
- **Service**: Google authentication
- **Status**: Code exists but commented out
- **Purpose**: Social login via Google accounts
- **Location**: `app/(auth)/sign-in.tsx` lines 17-18, 62-74

### Partial / Stubbed Integrations

#### Appwrite Messaging API
- **Service**: Appwrite Messaging for push notifications
- **Status**: Partial implementation
- **Files**: `lib/appwrite/messaging.ts`
- **Note**: `sendPushViaFunction()` returns "Not implemented"

#### Katya AI Agent
- **Service**: AI assistant for job management
- **Status**: Client-side exists, server-side stubbed
- **Files**: 
  - `lib/appwrite/katya.ts` (client-side)
  - `Droid/lib/katya.ts` (server-side placeholder)
- **TODO**: Line 131-134 has implementation comment

#### Real-time Subscriptions
- **Service**: Appwrite Realtime for live updates
- **Status**: Disabled to prevent WebSocket errors
- **File**: `app/(jobs)/[job].tsx` lines 419-421
- **Note**: Code exists but returns early

---

## 4. DATABASE COLLECTIONS (Appwrite)

Based on code analysis across all service files:

### Core Collections

| Collection | Purpose | Key Attributes |
|------------|---------|----------------|
| `jobchat` | Job/chat rooms | `title`, `description`, `status`, `teamId`, `orgId`, `tags`, `createdAt`, `updatedAt`, `deletedAt` |
| `messages` | Chat messages | `jobchatId`, `type`, `content`, `imageUrls`, `videoUrl`, `audioUrl`, `fileUrl`, `fileName`, `location`, `tasks`, `duties`, `senderId`, `readBy`, `createdAt` |
| `organizations` | Multi-tenant orgs | `name`, `ownerId`, `premiumTier`, `settings`, `createdAt`, `updatedAt` |
| `teams` | Team data | `name`, `orgId`, `appwriteTeamId`, `photoUrl`, `phone`, `email`, `address`, `archived`, `createdAt`, `updatedAt` |
| `memberships` | Team memberships | `userId`, `teamId`, `orgId`, `role`, `permissions`, `joinedAt` |

### Feature Collections

| Collection | Purpose | Key Attributes |
|------------|---------|----------------|
| `tag_templates` | Job tag definitions | `name`, `color`, `icon`, `sortOrder`, `orgId`, `createdBy` |
| `job_tag_assignments` | Tag-to-job mappings | `jobchatId`, `tagId`, `orgId`, `assignedAt` |
| `notifications` | In-app notifications | `userId`, `title`, `message`, `type`, `data`, `read`, `readAt`, `createdAt` |
| `push_tokens` | FCM/Expo tokens | `userId`, `token`, `platform`, `deviceId`, `createdAt`, `updatedAt` |
| `notification_preferences` | User notification settings | `userId`, `pushEnabled`, `emailEnabled`, `types` |
| `subscriptions` | RevenueCat subscriptions | `userId`, `orgId`, `revenueCatId`, `productId`, `status`, `expiresAt`, `createdAt` |
| `revenuecat_events` | Webhook events | `eventType`, `eventData`, `processed`, `createdAt` |
| `user_preferences` | User settings | `userId`, `showTimestamps`, `hdCapture`, `createdAt`, `updatedAt` |
| `reports` | Generated job reports | `jobchatId`, `orgId`, `reportData`, `generatedAt`, `sharedWith` |
| `contacts` | Phone contacts | `userId`, `name`, `phoneHash`, `emailHash`, `createdAt` |

### Storage Buckets

| Bucket | Purpose |
|--------|---------|
| `68ed4194000f83f9bb42` (configured) | Image uploads, video uploads, file attachments, avatars |

---

## 5. INCOMPLETE OR STUBBED FEATURES

### TODO Comments Found

1. **Katya AI Trigger** (`lib/appwrite/katya.ts:131-134`)
   ```typescript
   // TODO: Implement if you want manual triggers
   // This could call an Appwrite Function
   ```

2. **Google OAuth Implementation** (`app/(auth)/sign-in.tsx:17-18`, `62-74`)
   - Code is commented out with markers: `// GOOGLE_AUTH: Commented out`
   - Ready to enable by uncommenting

3. **Appwrite Function Push** (`lib/appwrite/messaging.ts:228-229`)
   ```typescript
   // Not implemented
   return { success: false, error: 'Not implemented' };
   ```

4. **Real-time Subscriptions** (`app/(jobs)/[job].tsx:419-421`)
   ```typescript
   // Disable real-time subscriptions temporarily to prevent WebSocket errors
   console.log('[JobChat] Real-time subscriptions disabled');
   return;
   ```

### Stubbed / Partial Features

#### Katya AI Assistant
- **Status**: Client-side framework exists
- **Missing**: Server-side Cloud Function implementation
- **Impact**: AI features non-functional
- **Files**: 
  - Client: `lib/appwrite/katya.ts`
  - Server placeholder: `Droid/lib/katya.ts`

#### Video Recording
- **Status**: UI exists but premium-locked
- **Route**: `app/(jobs)/video-camera.tsx`
- **Note**: Requires active premium subscription

#### Users Collection Fallback
- **Status**: Gracefully handles missing optional collection
- **File**: `lib/appwrite/teams.ts:903-937`
- **Behavior**: Falls back to Appwrite Auth data when collection unavailable

#### HD Capture
- **Status**: Feature flag exists
- **Implementation**: Toggle in preferences
- **Requirement**: Premium subscription

#### Watermark Toggle
- **Status**: Premium feature flag
- **File**: Camera and photo components
- **Requirement**: Premium subscription

### Known Issues

1. **WebSocket Errors**: Real-time subscriptions disabled due to connection issues
2. **Google Auth**: OAuth integration ready but disabled
3. **Push via Function**: Appwrite Function push method not implemented
4. **AI Assistant**: Server-side components missing

---

## Summary Statistics

- **Total Screens**: 44
- **Components**: 26
- **Appwrite Services**: 17
- **Database Collections**: 16+
- **Hooks**: 5
- **Context Providers**: 3
- **Integration Points**: 5 (3 active, 2 partial)

---

*Generated on: March 13, 2026*
*Framework: Expo SDK 54 + React Native 0.81.5 + React 19.1.0*
*Backend: Appwrite*
*Payments: RevenueCat*
