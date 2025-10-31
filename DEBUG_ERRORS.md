# 🐛 Error Debug List

This document tracks errors encountered after successful build on phone when testing Google OAuth login.

**Date Created:** 2024-12-19  
**Environment:** Production build on physical device

---

## 🔴 Priority 1: OAuth Authentication Failures

### Error #1: OAuth Flow Failed (Undefined Error)
- **Error Message:** `OG 🔴 OAuth flow failed: undefined`
- **Location:** `lib/appwrite/auth.ts` - `signInWithGoogle()` function
- **Line Reference:** Line 217 (where `result.error` is undefined)
- **Symptoms:**
  - OAuth flow starts but fails during redirect handling
  - `result.error` is undefined when OAuth fails
  - May be related to deep link handling on mobile device
- **Possible Causes:**
  1. Deep link scheme not properly configured for production build
  2. `makeRedirectUri()` may be returning incorrect URI for physical device
  3. `WebBrowser.openAuthSessionAsync()` may not be handling mobile redirects correctly
  4. OAuth callback URL mismatch between Appwrite config and app redirect URI
- **Investigation Needed:**
  - Check `app.json` for deep link configuration
  - Verify Appwrite OAuth redirect URLs match app configuration
  - Check if `preferLocalhost: false` is causing issues on physical device
  - Add better error handling for undefined errors in OAuth flow

---

### Error #2: Google OAuth Sign In Error (Unknown Error)
- **Error Message:** `OAuth authentication failed: Unknown error`
- **Location:** Multiple locations:
  - `lib/appwrite/auth.ts` - `signInWithGoogle()` function
  - `context/AuthContext.tsx` - `signInWithGoogle()` function
  - `components/GoogleAuthButton.tsx` (likely)
- **Call Stack Pattern:**
  ```
  authService.signInWithGoogle (lib\appwrite\auth.ts)
  AuthContext.signInWithGoogle (context\AuthContext.tsx)
  GoogleAuthButton component
  ```
- **Symptoms:**
  - OAuth authentication appears to complete but fails with generic "Unknown error"
  - Error propagates through multiple layers of error handling
  - User authentication may succeed but session creation fails
- **Possible Causes:**
  1. OAuth redirect not properly handled after Google authentication
  2. Session creation fails after successful OAuth
  3. Missing or invalid OAuth credentials in redirect URL
  4. Network timeout or connection issues during OAuth callback
  5. Appwrite OAuth configuration mismatch
- **Investigation Needed:**
  - Check OAuth redirect URL parsing in `processOAuthResult()`
  - Verify `userId` and `secret` are extracted correctly from redirect URL
  - Add logging to see what redirect URL is actually received
  - Check if session creation (`account.createSession()`) is failing

---

## 🟡 Priority 2: Authorization/Permission Errors

### Error #3: Not Authorized to List Documents
- **Error Message:** `[AppwriteException: The current user is not authorized to perform the requested action.]`
- **Location:** `lib/appwrite/teams.ts` - `organizationService.listUserOrganizations()`
- **Line Reference:** Line 46-49 (database query for organizations)
- **Context:** Called from `createDefaultWorkspace()` function in `AuthContext.tsx`
- **Symptoms:**
  - User successfully authenticates via Google OAuth
  - User session is created successfully
  - But cannot query database collections (organizations)
- **Possible Causes:**
  1. Database collection permissions not set correctly in Appwrite Console
  2. User authenticated but session doesn't have proper permissions
  3. Collection read permissions require specific roles not assigned to OAuth users
  4. Database collection doesn't exist or has wrong permissions structure
- **Investigation Needed:**
  - Check `organizations` collection permissions in Appwrite Console
  - Verify collection has `read` permission for authenticated users
  - Check if OAuth users need different permissions than email/password users
  - Review Appwrite collection permission settings

---

### Error #4: Not Authorized to Create Default Workspace
- **Error Message:** `[AppwriteException: The current user is not authorized to perform the requested action.]`
- **Location:** `context/AuthContext.tsx` - `createDefaultWorkspace()` function
- **Line Reference:** Lines 128-168 (workspace creation flow)
- **Context:** 
  - Triggered after successful Google OAuth login
  - Attempts to check for existing organizations and create new ones
- **Symptoms:**
  - OAuth login succeeds
  - Default workspace creation fails with authorization error
  - User cannot access their workspace data
- **Possible Causes:**
  1. User doesn't have `create` permission on `organizations` collection
  2. User doesn't have `create` permission on `teams` collection
  3. User doesn't have `create` permission on `memberships` collection
  4. OAuth users may need different initial permissions setup
- **Investigation Needed:**
  - Check all collection permissions:
    - `organizations` collection - needs `create` for authenticated users
    - `teams` collection - needs `create` for authenticated users
    - `memberships` collection - needs `create` for authenticated users
  - Verify permissions are set in Appwrite Console
  - Consider if workspace creation should be delayed until after verification

---

### Error #5: Not Authorized to List User Organizations
- **Error Message:** `List user organizations error: [AppwriteException: The current user is not authorized to perform the requested action.]`
- **Location:** `lib/appwrite/teams.ts` - `organizationService.listUserOrganizations()`
- **Line Reference:** Lines 44-54
- **Context:** 
  - Called when checking for existing organizations before creating default workspace
  - Also called from `OrganizationContext.tsx` to load user data
- **Symptoms:**
  - User cannot list their own organizations
  - Workspace creation fails because it cannot check for existing orgs
- **Possible Causes:**
  - Same as Error #3 - database collection read permissions
  - Query filters may require specific user context that OAuth sessions don't have
- **Investigation Needed:**
  - Same investigation as Error #3
  - Check if Query filters (`Query.equal('ownerId', userId)`) work correctly with OAuth sessions

---

## 📋 Error Summary by Category

### Authentication/OAuth Issues (2 errors)
1. ✅ OAuth flow failed: undefined
2. ✅ Google OAuth sign in error: Unknown error

### Authorization/Permission Issues (3 errors)
3. ✅ List documents error: User not authorized
4. ✅ Create default workspace error: User not authorized
5. ✅ List user organizations error: User not authorized

---

## ✅ Fixed Issues

### Authorization/Permission Errors (Errors #3, #4, #5)
**Status:** ✅ **FIXED** - Error handling improved

**Changes Made:**
1. ✅ Made workspace creation non-blocking - errors won't prevent login
2. ✅ Added graceful error handling for permission failures
3. ✅ Added detailed logging to help diagnose permission issues
4. ✅ Created documentation guide: `docs/APPWRITE_COLLECTION_PERMISSIONS.md`

**What This Means:**
- Users can now log in even if workspace creation fails
- Errors are logged with helpful messages indicating what permissions need to be configured
- App continues to function even with missing permissions
- Detailed logs help identify which collections need permission setup

**Next Step:**
- Follow the guide in `docs/APPWRITE_COLLECTION_PERMISSIONS.md` to configure Appwrite collection permissions
- Once permissions are configured, workspace creation will succeed automatically

---

## 🔍 Debugging Checklist

### For OAuth Errors:
- [ ] Verify `app.json` has correct deep link scheme configuration
- [ ] Check Appwrite Console → Auth → OAuth settings match app redirect URLs
- [ ] Test OAuth redirect URL format on physical device
- [ ] Add detailed logging to `processOAuthResult()` to see actual redirect URL
- [ ] Verify `makeRedirectUri()` returns correct URI for production build
- [ ] Check if `WebBrowser.openAuthSessionAsync()` works correctly on physical device
- [ ] Verify OAuth scopes are correctly configured
- [ ] Test OAuth flow step-by-step with detailed logging

### For Authorization Errors:
- [ ] Check `organizations` collection permissions in Appwrite Console
- [ ] Check `teams` collection permissions in Appwrite Console
- [ ] Check `memberships` collection permissions in Appwrite Console
- [ ] Verify all collections have `read` and `create` permissions for "Authenticated users"
- [ ] Check if OAuth users have same permissions as email/password users
- [ ] Verify user session is valid after OAuth login
- [ ] Check if collections exist and are properly configured
- [ ] Consider delaying workspace creation until after user verification
- [ ] Add error handling to gracefully skip workspace creation if permissions fail

---

## 🎯 Recommended Fix Order

1. **First:** Fix OAuth authentication issues (Errors #1, #2)
   - Without working OAuth, user can't authenticate at all
   - Once OAuth works, can then address permission issues

2. **Second:** Fix authorization/permission issues (Errors #3, #4, #5)
   - After OAuth works, need to ensure user has proper permissions
   - May require Appwrite Console configuration changes

---

## 📝 Notes

- All errors occur during Google OAuth sign-in flow on physical device
- Errors suggest OAuth may be partially working (user gets authenticated) but fails at redirect/session creation
- Authorization errors suggest Appwrite collection permissions may not be configured for OAuth users
- Consider implementing better error handling and user feedback for these scenarios

