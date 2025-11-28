# 📝 TODO: Username/Password Authentication for Google Play Demo Account

## Context

Google Play Console requires a username and password for the demo/test account in the App Access section. Currently, WorkPhotoPro only supports email OTP (One-Time Password) authentication, which doesn't provide a static password for reviewers.

## Requirement

**Need to implement:** Username/password authentication option specifically for demo/test accounts to satisfy Google Play Console requirements.

## Current Status

- ✅ Email OTP authentication implemented
- ❌ Username/password authentication not implemented
- ⚠️ Google Play Console requires username/password for demo account

## Implementation Plan (Future)

### Option 1: Add Password-Based Auth Alongside OTP
- Add password field to sign-up flow
- Allow users to choose: OTP or Password
- Keep OTP as primary, password as secondary option

### Option 2: Demo Account Mode
- Create special "demo account" mode
- Demo accounts use password authentication
- Regular users continue using OTP
- Easier to manage for Google Play reviewers

### Option 3: Temporary Password for OTP Accounts
- Generate a temporary password for OTP accounts
- Allow password-based sign-in for demo accounts
- Keep OTP as primary for regular users

## Files That Will Need Changes

- `app/(auth)/sign-up.tsx` - Add password field
- `app/(auth)/sign-in.tsx` - Add password sign-in option
- `lib/appwrite/auth.ts` - Add password-based auth methods
- `context/AuthContext.tsx` - Add password sign-in function
- Google Play App Access instructions - Update with demo credentials

## Demo Account Credentials (To Be Created)

- **Email/Username:** `googleplay.reviewer@workphotopro.com`
- **Password:** `[To be set]`
- **Purpose:** Google Play Console app review

## Notes

- This is a future task - do not implement now
- Current OTP authentication works fine for users
- Only needed for Google Play Console compliance
- Can be implemented when ready to submit to Google Play

## Related Documentation

- `docs/GOOGLE_PLAY_APP_ACCESS_GUIDE.md` - Will need updating once password auth is implemented

---

**Status:** ⏳ Pending - To be implemented later

