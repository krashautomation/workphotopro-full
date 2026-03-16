# Universal Deep Link Invite System - Testing Guide

## Overview

This guide covers testing the new universal deep link invite system alongside the legacy QR code invite flow.

## Supported Invite Link Formats

### 1. Universal Deep Links (NEW)
```
https://workphotopro.com/invite/{shortId}
```
- **iOS**: Uses Universal Links (applinks:workphotopro.com)
- **Android**: Uses Intent Filters with autoVerify
- **Flow**: GET details → Claim → Accept → Navigate to team

### 2. Legacy QR/Short Links (PRESERVED)
```
https://web.workphotopro.com/links/{shortId}
```
- Resolves to full invite URL
- Backwards compatible with existing QR codes

### 3. Legacy Token Links (PRESERVED)
```
https://web.workphotopro.com/invite/{teamId}?token={token}&orgId={orgId}
```
- Direct team invitation
- Uses existing teamService.acceptInvitation()

---

## Pre-Testing Setup

### 1. Environment Variables
Ensure these are set in your `.env` file:
```bash
EXPO_PUBLIC_WEB_API_URL=https://workphotopro.com
EXPO_PUBLIC_APP_URL=https://workphotopro.com
```

### 2. Build Configuration
The app config has been updated. You need to rebuild the app:

```bash
# For iOS
eas build --profile development --platform ios

# For Android
eas build --profile development --platform android

# Or run locally
npx expo run:ios
npx expo run:android
```

### 3. Backend API Endpoints
Ensure the backend implements these endpoints:

```
GET  /api/invites/details?shortId={shortId}
POST /api/invites/claim
POST /api/invites/accept
```

---

## Testing Scenarios

### Scenario 1: Universal Link - Cold Start (App Closed)

**Steps:**
1. Kill the app completely
2. Tap a universal invite link: `https://workphotopro.com/invite/AbC123`
3. App should open and show accept-invite screen

**Expected:**
- ✅ App launches
- ✅ Shows inviter name and organization
- ✅ Shows loading state initially
- ✅ Displays sign in/up form
- ✅ No errors in console

**Console Output:**
```
🔗 Deep link received: https://workphotopro.com/invite/AbC123
🔗 Universal invite link detected! Short ID: AbC123
[InviteService] Fetching invite details for: AbC123
[AcceptInvite] Loaded universal invite: Team Name by Inviter Name
```

---

### Scenario 2: Universal Link - App Running

**Steps:**
1. Open app to any screen
2. Background the app
3. Tap universal invite link
4. App should come to foreground and navigate to invite screen

**Expected:**
- ✅ App navigates to accept-invite screen
- ✅ Existing navigation stack preserved
- ✅ Invite details loaded

---

### Scenario 3: Complete Universal Flow - New User

**Steps:**
1. Tap universal link `https://workphotopro.com/invite/AbC123`
2. Tap "Sign Up" toggle
3. Enter new email and password
4. Complete sign up
5. Verify email (if required)
6. App should automatically claim and accept invite

**Expected:**
- ✅ User account created
- ✅ Email verification screen shown (if enabled)
- ✅ After verification, invite claimed successfully
- ✅ Membership created on backend
- ✅ Navigated to team dashboard
- ✅ Console shows: `[AcceptInvite] Successfully joined team: {teamId}`

---

### Scenario 4: Complete Universal Flow - Existing User

**Steps:**
1. Tap universal link
2. Enter existing user credentials
3. Sign in
4. App should automatically claim and accept invite

**Expected:**
- ✅ User signed in
- ✅ Invite claimed (POST /api/invites/claim)
- ✅ Invite accepted (POST /api/invites/accept)
- ✅ Membership created
- ✅ Alert: "Welcome! You've successfully joined..."
- ✅ Navigated to team dashboard

---

### Scenario 5: Error States - Universal Flow

#### 5a. Expired Invite
**Steps:**
1. Tap link to expired invite

**Expected:**
- ✅ Shows error: "This invitation has expired"
- ✅ Shows "Go to Sign In" button
- ✅ Form is not displayed

#### 5b. Already Claimed
**Steps:**
1. User A taps link and claims invite
2. User B taps same link

**Expected:**
- ✅ User B sees: "This invitation has already been claimed by someone else"
- ✅ Buttons disabled

#### 5c. Invalid Short ID
**Steps:**
1. Tap link with non-existent shortId: `https://workphotopro.com/invite/INVALID`

**Expected:**
- ✅ Shows error: "Invite not found or invalid"
- ✅ Form not displayed

#### 5d. Already Member
**Steps:**
1. User is already member of team
2. Tap invite link for same team

**Expected:**
- ✅ Error: "You are already a member of this team"
- ✅ Auto-redirect to team dashboard after 2 seconds

---

### Scenario 6: Legacy QR Code Flow (Backwards Compatibility)

**Steps:**
1. Scan existing QR code with format: `https://web.workphotopro.com/links/AbC123`
2. App should resolve short link
3. Navigate to invite screen with teamId and token

**Expected:**
- ✅ Short link resolved
- ✅ Legacy accept-invite flow works
- ✅ teamService.acceptInvitation() called
- ✅ Membership created
- ✅ Navigated to team dashboard

**Console Output:**
```
🔗 Short link detected! Short ID: AbC123
🔗 Short link resolved! Team ID: xxx Token: yyy
```

---

### Scenario 7: Legacy Token Flow (Backwards Compatibility)

**Steps:**
1. Tap direct token link: `https://web.workphotopro.com/invite/{teamId}?token=xxx&orgId=yyy`
2. Sign in or sign up

**Expected:**
- ✅ Legacy flow triggered
- ✅ teamService.acceptInvitation() works
- ✅ Membership created
- ✅ Success navigation

---

### Scenario 8: iOS Universal Links

**Steps:**
1. Install app from App Store or TestFlight
2. Tap universal link in Safari, Messages, or Mail
3. iOS should show "Open in WorkPhotoPro" banner

**Expected:**
- ✅ iOS shows app banner/confirmation
- ✅ Tapping opens app directly (not browser)
- ✅ Invite screen displayed

**Note:** Requires AASA (Apple App Site Association) file on server at:
`https://workphotopro.com/.well-known/apple-app-site-association`

---

### Scenario 9: Android App Links

**Steps:**
1. Install app from Play Store
2. Tap universal link in Chrome, Gmail, or Messages
3. Android should open app directly

**Expected:**
- ✅ App opens directly (not browser)
- ✅ "Open with WorkPhotoPro" may appear once
- ✅ Invite screen displayed
- ✅ "Always open with" option remembered

**Note:** Requires assetlinks.json on server at:
`https://workphotopro.com/.well-known/assetlinks.json`

---

## API Endpoint Testing

### Test GET /api/invites/details

```bash
curl "https://workphotopro.com/api/invites/details?shortId=AbC123"
```

**Expected Response (200):**
```json
{
  "shortId": "AbC123",
  "inviterName": "John Doe",
  "inviterEmail": "john@example.com",
  "organizationName": "Acme Corp",
  "organizationId": "org_xxx",
  "teamName": "Engineering Team",
  "teamId": "team_xxx",
  "role": "member",
  "status": "pending",
  "expiresAt": "2026-03-22T00:00:00Z",
  "createdAt": "2026-03-15T00:00:00Z"
}
```

**Expected Response (404):**
```json
{
  "success": false,
  "error": "Invite not found",
  "errorCode": "INVITE_NOT_FOUND"
}
```

### Test POST /api/invites/claim

```bash
curl -X POST "https://workphotopro.com/api/invites/claim" \
  -H "Content-Type: application/json" \
  -d '{"shortId": "AbC123", "userId": "user_xxx"}'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Invite claimed successfully",
  "claimedAt": "2026-03-15T12:00:00Z",
  "shortId": "AbC123"
}
```

### Test POST /api/invites/accept

```bash
curl -X POST "https://workphotopro.com/api/invites/accept" \
  -H "Content-Type: application/json" \
  -d '{"shortId": "AbC123", "userId": "user_xxx"}'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Successfully joined team",
  "membershipId": "membership_xxx",
  "teamId": "team_xxx",
  "organizationId": "org_xxx",
  "acceptedAt": "2026-03-15T12:00:00Z"
}
```

---

## Debugging

### Enable Console Logging

The invite system logs extensively. Look for these prefixes in console:

```
[InviteService]    - API calls
[AcceptInvite]     - Screen logic
🔗                 - Deep link handling
```

### Common Issues

#### Issue: Universal link opens browser instead of app
**Solutions:**
1. Check AASA file is valid: `https://workphotopro.com/.well-known/apple-app-site-association`
2. Check assetlinks.json: `https://workphotopro.com/.well-known/assetlinks.json`
3. Ensure domain matches exactly (no www. vs non-www mismatch)
4. Rebuild app after config changes

#### Issue: "Invite not found" error
**Solutions:**
1. Verify `EXPO_PUBLIC_WEB_API_URL` env var
2. Check backend endpoint is live: `GET /api/invites/details`
3. Verify shortId exists in database

#### Issue: Claim fails with "Already claimed"
**Solutions:**
1. This is expected behavior - invite was already claimed
2. Check backend logic allows re-claiming by same user
3. Frontend handles this gracefully (continues to accept)

---

## Performance Benchmarks

**Target Times:**
- Invite details fetch: < 500ms
- Claim API call: < 500ms
- Accept API call: < 500ms
- Total flow (sign in + claim + accept): < 3 seconds

---

## Production Checklist

Before releasing to production:

- [ ] AASA file deployed at `/.well-known/apple-app-site-association`
- [ ] assetlinks.json deployed at `/.well-known/assetlinks.json`
- [ ] Backend API endpoints implemented and tested
- [ ] All three invite formats tested on iOS
- [ ] All three invite formats tested on Android
- [ ] Error states tested
- [ ] Analytics added to track invite conversions
- [ ] Rate limiting on claim/accept endpoints
- [ ] Invite expiration logic working
- [ ] Email notifications configured

---

## Quick Test Commands

```bash
# iOS Simulator - Test universal link
xcrun simctl openurl booted "https://workphotopro.com/invite/test123"

# Android Emulator - Test universal link
adb shell am start -W -a android.intent.action.VIEW -d "https://workphotopro.com/invite/test123" com.workphotopro.app

# Test with local dev server
# In development, use ngrok or similar to get HTTPS URL
npx expo start --tunnel
```

---

## Files Modified

1. `app.config.js` - Added universal link support
2. `services/inviteService.ts` - NEW: Universal invite API
3. `utils/types.ts` - Added UniversalInviteDetails type
4. `app/_layout.tsx` - Added universal link handler
5. `app/(auth)/accept-invite.tsx` - Enhanced for dual flow support

---

## Support

For issues or questions about the invite system:
1. Check console logs for `[InviteService]` and `[AcceptInvite]` messages
2. Verify backend API endpoints are responding
3. Test with a simple curl command first
4. Check that environment variables are set correctly
