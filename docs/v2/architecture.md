# System Architecture

## Overview

WorkPhotoPro V2 is a mobile-first application for construction and contractor photo management, built with modern React Native and cloud-native backend services.

## Tech Stack

### Frontend
- **Framework**: React Native with Expo SDK 54
- **Routing**: Expo Router (file-based routing)
- **Language**: TypeScript with strict mode
- **State Management**: React Context API
- **Styling**: StyleSheet with global design tokens

### Backend
- **BaaS**: Appwrite (Database, Auth, Storage, Teams, Realtime)
- **Authentication**: Email/Password + Email OTP
- **File Storage**: Appwrite Storage for images, videos, documents
- **Push Notifications**: Expo Push API + Firebase Cloud Messaging

### Monetization
- **Subscriptions**: RevenueCat for in-app purchases
- **Tiers**: 10 pricing tiers ($7.99 - $74.99/month)

## App Structure

```
app/
├── (auth)/              # Authentication flow
│   ├── sign-in.tsx
│   ├── sign-up.tsx
│   ├── forgot-password.tsx
│   └── verify-email.tsx
├── (jobs)/              # Main application
│   ├── index.tsx        # Dashboard
│   ├── [job].tsx        # Job chat
│   ├── new-job.tsx
│   ├── teams.tsx
│   └── settings/
```

## Key Architectural Decisions

### 1. Expo Router File-Based Routing
Routes are defined by file structure, enabling intuitive navigation and type-safe routing with `typedRoutes: true`.

### 2. Service Layer Architecture
External service integrations isolated in `lib/appwrite/`:
- `client.ts` — Appwrite client configuration
- `auth.ts` — Authentication operations
- `database.ts` — Database CRUD operations
- `storage.ts` — File upload/management
- `teams.ts` — Multi-tenant team management

### 3. Context-Based State Management
React Context provides global state for:
- Authentication (`AuthContext`)
- Organization/Team selection (`OrganizationContext`)

See [Data Model](./data-model.md) for entity relationships and [Permissions](./permissions.md) for access control implementation.

## Permission Enforcement Layers

Permissions are enforced at three layers:

### 1. Collection Security (Appwrite)
- All collections require authenticated users (`role:users`)
- Access further restricted using `orgId`/`teamId` filtering
- No guest or unauthenticated access

### 2. Server Logic / Services
- Business rules enforced in service layer
- Owner/creator validation before mutations
- Team membership verification

### 3. UI Permission Hooks
- `usePermissions()` hook for centralized access control
- Buttons disable when permissions missing
- Alert dialogs for permission denied feedback

See [Permissions](./permissions.md) for detailed permission documentation and [Security Audit](./security-audit.md) for coverage verification.

## Data Hierarchy

```
Organization (ownerId)
    └── Team (orgId)
            └── JobChat (teamId, createdByUserId)
                    └── Message (jobchatId, senderId)
```

## Key Services

| Service | Purpose | Location |
|---------|---------|----------|
| `jobChatService` | Job creation, updates, search | `lib/appwrite/database.ts` |
| `teamService` | Team CRUD, membership management | `lib/appwrite/teams.ts` |
| `organizationService` | Org management, billing | `lib/appwrite/teams.ts` |
| `messageService` | Chat messages, real-time | `lib/appwrite/database.ts` |
| `authService` | Authentication, sessions | `lib/appwrite/auth.ts` |
| `inviteService` | Universal invite system | `services/inviteService.ts` |

## Invite System Architecture

### Universal Deep Link Invites

The invite system supports multiple flows for maximum compatibility:

#### 1. Universal Deep Links (Primary)
```
https://workphotopro.com/invite/{shortId}
```
- Works on iOS (Universal Links) and Android (App Links)
- Short, shareable format
- Deep link handler extracts shortId and navigates to accept-invite screen

#### 2. Legacy QR/Short Links
```
https://web.workphotopro.com/links/{shortId}
```
- Backwards compatible with existing QR codes
- Resolves to full invite URL

#### 3. Legacy Token Links
```
https://web.workphotopro.com/invite/{teamId}?token={token}&orgId={orgId}
```
- Direct token-based invites
- Maintains compatibility with existing invites

### Install-Safe Session Resume

For users who click invites before installing the app:

**Flow:**
1. User clicks invite in browser → Web creates session with device fingerprint
2. User installs app → App checks for pending sessions on launch
3. If session found (< 7 days): App resumes invite automatically
4. Auto-complete for authenticated users, invite screen for new users

**Components:**
- `utils/deviceId.ts` - Persistent device identification
- `hooks/useInviteSession.ts` - Session management hook
- `GET /api/invites/session` - Backend endpoint for session retrieval
- `POST /api/invites/session` - Backend endpoint for session creation

### Invite State Machine

```
Invite Created
    ↓
Pending → Claimed → Accepted
    ↓         ↓         ↓
  Active   Reserved  Completed
    ↓
Declined / Cancelled / Revoked / Expired
```

**States:**
- **Pending**: Invite available, not yet claimed
- **Claimed**: Reserved by a user (7-day expiration)
- **Accepted**: Membership created, user joined team
- **Declined**: User explicitly declined the invitation
- **Cancelled**: Sender cancelled the invitation before acceptance
- **Revoked**: Invitation was revoked by admin/system
- **Expired**: Past 7-day window or manually expired

### API Endpoints (Updated March 2026)

**Invitation Operations** (Require Authentication):
```
GET  /api/invitations/details?shortId={shortId}
POST /api/invitations/claim
POST /api/invitations/accept
```

**Session Operations** (No Authentication Required):
```
GET  /api/invites/session?deviceId={deviceId}
POST /api/invites/session
```

**Authentication:**
- Invitation endpoints require valid Appwrite session
- Uses `account.get()` to validate session before API calls
- Session cookies automatically included by HTTP client
- Session endpoints remain unauthenticated for install-safe resume

## Performance Optimizations

1. **Lazy Loading**: Routes loaded on-demand
2. **Image Optimization**: Built-in caching and resizing
3. **State Management**: Minimal re-renders with Context
4. **Bundle Splitting**: Automatic code splitting via Expo

## Multi-Tenant Architecture

Built with Appwrite Teams for organization isolation:
- Organizations = Appwrite Teams
- Role-based permissions (Owner, Member)
- Organization-level data isolation
- Team switching capabilities

See [Data Model](./data-model.md) for collection schema and [Permissions](./permissions.md) for role-based access control.

---

*Last Updated: March 2026*
