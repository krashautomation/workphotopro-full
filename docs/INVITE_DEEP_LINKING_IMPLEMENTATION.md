# Invite Deep Linking Implementation Guide - Mobile App

## Overview

This guide walks through implementing the invite deep linking flow in the mobile app, matching the competitor's implementation with Base62 short links and verification screens.

## Current State

- ✅ Deep link handling exists in `app/_layout.tsx`
- ✅ `accept-invite.tsx` screen exists
- ✅ `expo-linking` is installed
- ⚠️ Needs update for new invite flow with tokens
- ⚠️ Needs update for short links (`/links/*`)
- ⚠️ Needs verification screen matching competitor

## Implementation Steps

### Step 1: Update app.config.js
- Add `/links/*` path to intent filters
- Update associated domains

### Step 2: Update Deep Link Handling
- Handle new invite format: `workphotopro://invite?teamId={id}&token={token}`
- Handle short links: `https://web.workphotopro.com/links/{shortId}`
- Handle full links: `https://web.workphotopro.com/invite/{teamId}?token={token}`

### Step 3: Update Verification Screen
- Match competitor's design: "You've been invited" with verification form
- Support: Email/password authentication (Sign In / Sign Up)

### Step 4: Update Invite Link Generation
- Call web API to generate short links
- Display short links in invite modal

---

## Files to Update

1. `app.config.js` - Add `/links/*` path
2. `app/_layout.tsx` - Update deep link handling
3. `app/(auth)/accept-invite.tsx` - Update to verification screen
4. `utils/inviteLink.ts` - Update to call web API

---

## Testing

After implementation:
1. Test custom scheme: `workphotopro://invite?teamId=123&token=abc`
2. Test short link: `https://web.workphotopro.com/links/AbC123`
3. Test full link: `https://web.workphotopro.com/invite/123?token=abc`
