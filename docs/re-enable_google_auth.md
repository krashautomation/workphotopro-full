# Re-enable Google Authentication Guide

This guide provides step-by-step instructions to restore Google sign-in and sign-up functionality that was previously disabled.

## Overview

Google authentication was disabled by commenting out relevant code sections marked with `GOOGLE_AUTH:` comments. All code has been preserved and can be easily restored.

## Files Modified

- `app/(auth)/sign-in.tsx`
- `app/(auth)/sign-up.tsx`

**Note:** The `components/GoogleAuthButton.tsx` component remains intact and requires no changes.

## Step-by-Step Instructions

### 1. Re-enable Sign In Screen (`app/(auth)/sign-in.tsx`)

#### Step 1.1: Uncomment the import
Find this line (around line 17-18):
```typescript
// GOOGLE_AUTH: Commented out - uncomment to re-enable Google sign in
// import GoogleAuthButton from '@/components/GoogleAuthButton';
```

Change to:
```typescript
import GoogleAuthButton from '@/components/GoogleAuthButton';
```

#### Step 1.2: Add signInWithGoogle to useAuth()
Find this line (around line 21-23):
```typescript
const { signIn } = useAuth();
// GOOGLE_AUTH: Commented out - uncomment to re-enable Google sign in
// const { signInWithGoogle, signIn } = useAuth();
```

Change to:
```typescript
const { signInWithGoogle, signIn } = useAuth();
```

#### Step 1.3: Uncomment handler functions
Find the commented handlers (around lines 59-72):
```typescript
// GOOGLE_AUTH: Commented out - uncomment to re-enable Google sign in
// const handleGoogleSuccess = async () => {
//   try {
//     // GoogleAuthButton already calls signInWithGoogle(), so we just navigate
//     router.replace('/(jobs)');
//   } catch (error: any) {
//     setError(error.message || 'Google sign in failed. Please try again.');
//   }
// };

// const handleGoogleError = (error: Error) => {
//   console.error('Google sign in error:', error);
//   setError(error.message || 'Google sign in failed. Please try again.');
// };
```

Uncomment to:
```typescript
const handleGoogleSuccess = async () => {
  try {
    // GoogleAuthButton already calls signInWithGoogle(), so we just navigate
    router.replace('/(jobs)');
  } catch (error: any) {
    setError(error.message || 'Google sign in failed. Please try again.');
  }
};

const handleGoogleError = (error: Error) => {
  console.error('Google sign in error:', error);
  setError(error.message || 'Google sign in failed. Please try again.');
};
```

#### Step 1.4: Uncomment UI elements
Find the commented UI section (around lines 132-143):
```typescript
{/* GOOGLE_AUTH: Commented out - uncomment to re-enable Google sign in */}
{/* <View style={styles.divider}>
  <View style={styles.dividerLine} />
  <Text style={styles.dividerText}>or continue with</Text>
  <View style={styles.dividerLine} />
</View>

<GoogleAuthButton 
  onSuccess={handleGoogleSuccess}
  onError={handleGoogleError}
  mode="sign-in"
/> */}
```

Uncomment to:
```typescript
<View style={styles.divider}>
  <View style={styles.dividerLine} />
  <Text style={styles.dividerText}>or continue with</Text>
  <View style={styles.dividerLine} />
</View>

<GoogleAuthButton 
  onSuccess={handleGoogleSuccess}
  onError={handleGoogleError}
  mode="sign-in"
/>
```

### 2. Re-enable Sign Up Screen (`app/(auth)/sign-up.tsx`)

#### Step 2.1: Uncomment the import
Find this line (around line 16-17):
```typescript
// GOOGLE_AUTH: Commented out - uncomment to re-enable Google sign up
// import GoogleAuthButton from '@/components/GoogleAuthButton';
```

Change to:
```typescript
import GoogleAuthButton from '@/components/GoogleAuthButton';
```

#### Step 2.2: Add signInWithGoogle to useAuth()
Find this line (around line 30-32):
```typescript
const { signUp } = useAuth();
// GOOGLE_AUTH: Commented out - uncomment to re-enable Google sign up
// const { signUp, signInWithGoogle } = useAuth();
```

Change to:
```typescript
const { signUp, signInWithGoogle } = useAuth();
```

#### Step 2.3: Uncomment handler functions
Find the commented handlers (around lines 186-202):
```typescript
// GOOGLE_AUTH: Commented out - uncomment to re-enable Google sign up
// const handleGoogleSuccess = async () => {
//   try {
//     console.log('🟡 SignUp: handleGoogleSuccess called');
//     // GoogleAuthButton already calls signInWithGoogle(), so we just navigate
//     console.log('🟡 SignUp: OAuth successful, navigating to jobs...');
//     router.replace('/(jobs)');
//   } catch (error: any) {
//     console.error('🔴 SignUp: Google OAuth error:', error);
//     setError(error.message || 'Google sign up failed. Please try again.');
//   }
// };

// const handleGoogleError = (error: Error) => {
//   console.error('Google sign up error:', error);
//   setError(error.message || 'Google sign up failed. Please try again.');
// };
```

Uncomment to:
```typescript
const handleGoogleSuccess = async () => {
  try {
    console.log('🟡 SignUp: handleGoogleSuccess called');
    // GoogleAuthButton already calls signInWithGoogle(), so we just navigate
    console.log('🟡 SignUp: OAuth successful, navigating to jobs...');
    router.replace('/(jobs)');
  } catch (error: any) {
    console.error('🔴 SignUp: Google OAuth error:', error);
    setError(error.message || 'Google sign up failed. Please try again.');
  }
};

const handleGoogleError = (error: Error) => {
  console.error('Google sign up error:', error);
  setError(error.message || 'Google sign up failed. Please try again.');
};
```

#### Step 2.4: Uncomment UI elements
Find the commented UI section (around lines 281-297):
```typescript
{/* GOOGLE_AUTH: Commented out - uncomment to re-enable Google sign up */}
{/* Show Google auth only on first step */}
{/* {currentStep === 0 && (
  <>
    <View style={styles.divider}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>or continue with</Text>
      <View style={styles.dividerLine} />
    </View>

    <GoogleAuthButton 
      onSuccess={handleGoogleSuccess}
      onError={handleGoogleError}
      mode="sign-up"
    />
  </>
)} */}
```

Uncomment to:
```typescript
{/* Show Google auth only on first step */}
{currentStep === 0 && (
  <>
    <View style={styles.divider}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>or continue with</Text>
      <View style={styles.dividerLine} />
    </View>

    <GoogleAuthButton 
      onSuccess={handleGoogleSuccess}
      onError={handleGoogleError}
      mode="sign-up"
    />
  </>
)}
```

## Verification Steps

After making the changes:

1. **Check for linting errors:**
   ```bash
   npm run lint
   # or
   npx eslint app/(auth)/sign-in.tsx app/(auth)/sign-up.tsx
   ```

2. **Test the sign-in screen:**
   - Navigate to the sign-in page
   - Verify the "or continue with" divider appears
   - Verify the Google button appears below the divider
   - Test clicking the Google button

3. **Test the sign-up screen:**
   - Navigate to the sign-up page
   - Verify the "or continue with" divider appears on step 1 (Full Name)
   - Verify the Google button appears below the divider
   - Test clicking the Google button

4. **Verify authentication flow:**
   - Complete a Google sign-in
   - Complete a Google sign-up
   - Ensure users are redirected correctly after authentication

## Quick Search Prompts

To quickly find all Google auth related code:

**In VS Code / Cursor:**
- Search for: `GOOGLE_AUTH`
- This will highlight all commented sections

**Using grep:**
```bash
grep -r "GOOGLE_AUTH" app/(auth)/
```

## Troubleshooting

### Issue: Google button doesn't appear
- Check that all imports are uncommented
- Verify handler functions are uncommented
- Ensure UI elements are uncommented (not just the comment markers)

### Issue: TypeScript errors
- Ensure `signInWithGoogle` is included in the `useAuth()` destructuring
- Verify `GoogleAuthButton` import path is correct

### Issue: Google auth doesn't work
- Verify `GoogleAuthButton` component exists at `components/GoogleAuthButton.tsx`
- Check that `signInWithGoogle` function exists in `context/AuthContext.tsx`
- Verify Google OAuth configuration in your Appwrite settings

## Notes

- The `GoogleAuthButton` component (`components/GoogleAuthButton.tsx`) was never modified and should work as-is
- All authentication logic in `context/AuthContext.tsx` remains unchanged
- Google OAuth configuration in Appwrite backend should still be valid
- This guide assumes the backend Google OAuth setup is still configured correctly

