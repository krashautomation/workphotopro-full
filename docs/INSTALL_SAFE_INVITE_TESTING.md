# Install-Safe Invite Resume - Testing Guide

## Overview

This guide covers testing the **install-safe invite resume** system that allows users to:
1. Click an invite link in a web browser
2. Install the mobile app later
3. Have the invite automatically resume when they open the app

This solves the "cold start" problem where users click invites but don't have the app installed yet.

---

## How It Works

### Session Creation Flow (Web)
```
User clicks invite link in browser
    ↓
Web app creates invite session:
  - Generates device fingerprint
  - Stores in invite_sessions collection
  - Associates with shortId
  - Sets 7-day expiration
    ↓
Shows "Install app to accept" page
    ↓
User installs app
```

### Session Resume Flow (Mobile)
```
App launches
    ↓
Get deviceId from SecureStore (or generate new)
    ↓
Call GET /api/invites/session?deviceId=xxx
    ↓
If session found and valid (< 7 days):
    ↓
If user authenticated:
  → Auto-complete invite (claim → accept)
  → Navigate to team dashboard
    ↓
If user not authenticated:
  → Navigate to invite screen
  → Pre-fill email from session
  → Show inviter/org info
  → User signs in/up
  → Complete invite flow
```

---

## Backend Requirements

### New Collection: `invite_sessions`

```typescript
{
  sessionId: string,        // Unique session ID
  deviceId: string,         // Device fingerprint
  shortId: string,          // Associated invite
  status: 'pending' | 'claimed' | 'accepted' | 'expired',
  inviterName: string,      // Cached for display
  organizationName: string, // Cached for display
  teamName: string,         // Cached for display
  email?: string,           // If collected from web
  createdAt: Date,
  expiresAt: Date,          // 7 days from creation
  claimedBy?: string,       // User ID if claimed
  claimedAt?: Date,
  acceptedAt?: Date,
}
```

### New API Endpoints

#### 1. POST /api/invites/session (Web → Mobile)
**Purpose:** Create session when user clicks invite in browser

**Request:**
```json
{
  "shortId": "AbC123",
  "deviceId": "device-fingerprint",
  "email": "user@example.com" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "sess_xxx",
  "expiresAt": "2026-03-22T00:00:00Z"
}
```

#### 2. GET /api/invites/session (Mobile)
**Purpose:** Check for pending sessions on app launch

**Request:**
```
GET /api/invites/session?deviceId=device-fingerprint
```

**Response (Session Found):**
```json
{
  "hasSession": true,
  "session": {
    "sessionId": "sess_xxx",
    "deviceId": "device-fingerprint",
    "shortId": "AbC123",
    "status": "pending",
    "inviterName": "John Doe",
    "organizationName": "Acme Corp",
    "teamName": "Engineering",
    "email": "user@example.com",
    "createdAt": "2026-03-15T00:00:00Z",
    "expiresAt": "2026-03-22T00:00:00Z"
  }
}
```

**Response (No Session):**
```json
{
  "hasSession": false,
  "message": "No pending invite session"
}
```

---

## Testing Scenarios

### Scenario 1: New User - Install After Clicking Invite

**Setup:**
1. User does NOT have app installed
2. User clicks invite link: `https://workphotopro.com/invite/AbC123`

**Steps:**
```bash
# 1. User clicks invite link in browser
# Web app creates session with device fingerprint

# 2. User installs app
# Build and install fresh app
npx expo run:android --variant release
# or
npx expo run:ios --configuration Release

# 3. User opens app for first time
# App should:
#   - Generate deviceId
#   - Call GET /api/invites/session
#   - Find the pending session
#   - Navigate to invite screen
```

**Expected Behavior:**
- ✅ App launches
- ✅ Shows loading indicator briefly
- ✅ Navigates to invite screen automatically
- ✅ Shows inviter name and organization
- ✅ Email field pre-filled (if collected on web)
- ✅ User can sign up and complete invite flow
- ✅ After sign up, invite is claimed and accepted
- ✅ User lands on team dashboard

**Console Logs:**
```
[DeviceId] ✅ Generated and stored new device ID
[InviteSession] Checking for pending invite sessions...
[InviteSession] ✅ Found pending invite session: AbC123
[InviteSession] Navigating to invite screen with session
[AcceptInvite] Pre-filled email from session: user@example.com
[AcceptInvite] Loaded universal invite: Engineering by John Doe
```

---

### Scenario 2: Existing User - Already Logged In

**Setup:**
1. User HAS app installed and is logged in
2. User clicks invite link in browser (maybe on different device)

**Steps:**
```bash
# 1. Ensure user is logged in
# Open app and verify user is authenticated

# 2. Simulate clicking invite from web
# (Backend creates session with deviceId)

# 3. Kill and reopen app
# App should auto-complete the invite
```

**Expected Behavior:**
- ✅ App launches
- ✅ Detects pending session
- ✅ Auto-completes invite (claim → accept)
- ✅ Shows success alert: "Welcome Back! You've successfully joined..."
- ✅ Navigates to team dashboard
- ✅ User is now member of new team

**Console Logs:**
```
[InviteSession] ✅ Found pending invite session: AbC123
[InviteSession] ✅ Auto-completed invite for authenticated user
[AcceptInvite] Successfully joined team: team_xxx
```

---

### Scenario 3: Multiple Invites - Latest Wins

**Setup:**
1. User clicks invite A
2. User clicks invite B (before installing app)
3. User installs and opens app

**Expected Behavior:**
- ✅ App shows invite B (the latest one)
- ✅ Session for invite A is either ignored or overwritten

---

### Scenario 4: Expired Session (> 7 Days)

**Setup:**
1. User clicks invite
2. Wait 7+ days (or manually expire in database)
3. User installs app

**Expected Behavior:**
- ✅ App launches normally
- ✅ No invite screen shown
- ✅ No error to user
- ✅ Console shows: "Session expired (older than 7 days)"

---

### Scenario 5: Already Accepted Session

**Setup:**
1. User clicks invite in browser
2. User opens app and completes invite
3. User reinstalls app later

**Expected Behavior:**
- ✅ App launches normally
- ✅ No invite screen shown
- ✅ Console shows: "Session already accepted"

---

### Scenario 6: Deep Link Override

**Setup:**
1. User has pending session
2. User taps actual invite deep link

**Expected Behavior:**
- ✅ Deep link takes precedence
- ✅ Session check is skipped
- ✅ User goes directly to invite from deep link

**Console:**
```
[InviteSession] App opened via deep link, skipping session check
```

---

### Scenario 7: No Session - Normal Launch

**Setup:**
1. User installs app without clicking invite
2. User opens app

**Expected Behavior:**
- ✅ App launches normally
- ✅ No invite screen
- ✅ Console shows: "No pending invite sessions found"

---

## API Testing

### Test Session Creation (Web → Mobile Bridge)

```bash
# Create a session (simulating web app)
curl -X POST "https://workphotopro.com/api/invites/session" \
  -H "Content-Type: application/json" \
  -d '{
    "shortId": "AbC123",
    "deviceId": "test-device-123",
    "email": "test@example.com"
  }'

# Expected Response:
{
  "success": true,
  "sessionId": "sess_abc123",
  "expiresAt": "2026-03-22T00:00:00Z"
}
```

### Test Session Retrieval (Mobile)

```bash
# Check for session (simulating mobile app)
curl "https://workphotopro.com/api/invites/session?deviceId=test-device-123"

# Expected Response:
{
  "hasSession": true,
  "session": {
    "sessionId": "sess_abc123",
    "deviceId": "test-device-123",
    "shortId": "AbC123",
    "status": "pending",
    "inviterName": "John Doe",
    "organizationName": "Acme Corp",
    "teamName": "Engineering",
    "email": "test@example.com",
    "createdAt": "2026-03-15T00:00:00Z",
    "expiresAt": "2026-03-22T00:00:00Z"
  }
}
```

### Test Session Not Found

```bash
# Check with unknown device
curl "https://workphotopro.com/api/invites/session?deviceId=unknown-device"

# Expected Response:
{
  "hasSession": false,
  "message": "No pending invite session"
}
```

---

## Device ID Testing

### Test Device ID Persistence

```typescript
// In app, check deviceId is consistent across launches
import { getDeviceId, resetDeviceId } from '@/utils/deviceId';

// First call - should generate new
const id1 = await getDeviceId();
console.log('Device ID 1:', id1);

// Second call - should return same
const id2 = await getDeviceId();
console.log('Device ID 2:', id2);
console.log('Same?', id1 === id2); // Should be true

// After reset - should generate new
await resetDeviceId();
const id3 = await getDeviceId();
console.log('Device ID 3:', id3);
console.log('Different?', id1 !== id3); // Should be true
```

---

## Error Handling Tests

### Test Network Failure

**Steps:**
1. Enable airplane mode
2. Open app with pending session

**Expected:**
- ✅ App launches normally
- ✅ No crash
- ✅ Console shows error
- ✅ User can continue using app

### Test Invalid Session

**Steps:**
1. Manually corrupt session in database
2. Open app

**Expected:**
- ✅ App handles gracefully
- ✅ Shows error or continues normally

---

## End-to-End Test Checklist

### Pre-Test Setup
- [ ] Backend has invite_sessions collection
- [ ] Backend API endpoints implemented
- [ ] Test invite created with shortId
- [ ] Fresh app build with latest code

### Test Cases

#### New User Flow
- [ ] Click invite in browser
- [ ] Install app
- [ ] Open app
- [ ] Invite screen appears automatically
- [ ] Email pre-filled (if collected)
- [ ] Sign up successfully
- [ ] Invite claimed and accepted
- [ ] Navigated to team dashboard

#### Existing User Flow
- [ ] User logged in
- [ ] Click invite in browser
- [ ] Kill and reopen app
- [ ] Invite auto-completed
- [ ] Success alert shown
- [ ] Navigated to team dashboard
- [ ] User is now team member

#### Edge Cases
- [ ] Expired session (> 7 days) - no action
- [ ] Already accepted session - no action
- [ ] Deep link clicked - deep link wins
- [ ] No session - normal launch
- [ ] Multiple invites - latest shown
- [ ] Network failure - graceful handling

---

## Debugging

### Enable Verbose Logging

Add to `.env`:
```bash
EXPO_PUBLIC_DEBUG_INVITE_SESSIONS=true
```

### Check Device ID

```typescript
import { getDeviceId } from '@/utils/deviceId';

// Log device ID for debugging
const deviceId = await getDeviceId();
console.log('Current Device ID:', deviceId);
```

### Manual Session Check

```typescript
import { checkInviteSession } from '@/services/inviteService';
import { getDeviceId } from '@/utils/deviceId';

// Manual check
const deviceId = await getDeviceId();
const response = await checkInviteSession(deviceId);
console.log('Session response:', response);
```

### Reset Device ID (Testing)

```typescript
import { resetDeviceId } from '@/utils/deviceId';

// Reset to simulate new device
await resetDeviceId();
console.log('Device ID reset - restart app');
```

---

## Console Log Reference

### Expected Logs - Session Found
```
[DeviceId] ✅ Retrieved existing device ID
[InviteSession] Checking for pending invite sessions...
[InviteSession] ✅ Found pending invite session: AbC123
[InviteSession] ✅ Auto-completed invite for authenticated user
```

### Expected Logs - No Session
```
[DeviceId] ✅ Generated and stored new device ID
[InviteSession] Checking for pending invite sessions...
[InviteSession] No pending invite sessions found
```

### Expected Logs - Deep Link Override
```
🔗 Deep link received: https://workphotopro.com/invite/AbC123
[InviteSession] App opened via deep link, skipping session check
```

---

## Performance Targets

| Operation | Target |
|-----------|--------|
| Device ID retrieval | < 50ms |
| Session API call | < 500ms |
| Total launch check | < 1 second |
| Auto-complete (if applicable) | < 2 seconds |

---

## Files Created/Modified

### New Files
1. `utils/deviceId.ts` - Device ID generation and persistence
2. `hooks/useInviteSession.ts` - Session management hook
3. `docs/INSTALL_SAFE_INVITE_TESTING.md` - This file

### Modified Files
1. `services/inviteService.ts` - Added session API methods
2. `app/_layout.tsx` - Added session check on launch
3. `app/(auth)/accept-invite.tsx` - Added session parameter support

---

## Backend Implementation Notes

### Database Indexes
```javascript
// invite_sessions collection
{
  "deviceId": 1,
  "status": 1,
  "createdAt": -1
}
```

### Expiration Job
```javascript
// Run daily to clean up expired sessions
db.invite_sessions.deleteMany({
  expiresAt: { $lt: new Date() }
});
```

### Security Considerations
1. Device ID should be a fingerprint, not PII
2. Sessions expire after 7 days
3. Rate limit session creation per device
4. Validate deviceId format
5. Don't expose sensitive data in session response

---

## Support

For issues with install-safe invite resume:

1. Check console for `[InviteSession]` logs
2. Verify deviceId is being generated: `getDeviceId()`
3. Test API endpoint: `GET /api/invites/session?deviceId=xxx`
4. Check backend has invite_sessions collection
5. Verify session hasn't expired (> 7 days)

### Common Issues

**Issue: Session not found**
- Device ID mismatch between web and mobile
- Session expired
- Different device used

**Issue: Auto-complete fails**
- User not authenticated
- Invite already claimed by someone else
- Invite expired between check and complete

**Issue: App doesn't check for sessions**
- Ensure `_layout.tsx` has session check code
- Verify no deep link is being handled
- Check for console errors

---

## Summary

The install-safe invite resume system ensures that:
- ✅ Users can click invites before installing the app
- ✅ Invites are automatically resumed when app opens
- ✅ Works for both new and existing users
- ✅ Latest invite takes precedence
- ✅ Expired sessions are gracefully ignored
- ✅ Deep links still take priority
