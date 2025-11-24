# Contacts Feature - Required Libraries

## Summary

You need to install **1 additional library** for the contacts feature.

---

## ✅ Already Installed

These libraries are already in your `package.json`:

### 1. `expo-contacts` ✅
- **Version:** `~15.0.10`
- **Purpose:** Access device contacts
- **Status:** ✅ Already installed
- **Used in:** `app/(jobs)/contacts.tsx`

### 2. `expo-secure-store` ✅
- **Version:** `~15.0.7`
- **Purpose:** Store permission state securely
- **Status:** ✅ Already installed
- **Used in:** `app/(jobs)/contacts.tsx`

---

## ❌ Missing - Need to Install

### 1. `expo-crypto` ❌
- **Purpose:** SHA-256 hashing for contact privacy
- **Status:** ❌ **NOT INSTALLED** - You need to install this
- **Used in:** `utils/contactHashing.ts`

---

## Installation Command

Run this command to install the missing library:

```bash
npx expo install expo-crypto
```

**Why `npx expo install`?**
- Ensures compatibility with your Expo SDK version (54)
- Automatically installs the correct version
- Handles native dependencies correctly

---

## After Installation

After installing `expo-crypto`, you'll need to:

1. **Rebuild your app** (since it's a native module):
   ```bash
   # For iOS
   npx expo run:ios
   
   # For Android
   npx expo run:android
   ```

2. **Verify installation:**
   - Check that `utils/contactHashing.ts` imports work
   - No TypeScript errors for `expo-crypto`

---

## Library Usage Breakdown

### `expo-contacts`
```typescript
import * as Contacts from 'expo-contacts';

// Request permission
const { status } = await Contacts.requestPermissionsAsync();

// Get contacts
const { data } = await Contacts.getContactsAsync({
  fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
});
```

### `expo-secure-store`
```typescript
import * as SecureStore from 'expo-secure-store';

// Store permission state
await SecureStore.setItemAsync('contacts_permission_requested', 'true');

// Retrieve permission state
const requested = await SecureStore.getItemAsync('contacts_permission_requested');
```

### `expo-crypto` (NEW)
```typescript
import * as Crypto from 'expo-crypto';

// Hash a string with SHA-256
const hash = await Crypto.digestStringAsync(
  Crypto.CryptoDigestAlgorithm.SHA256,
  inputString
);
```

---

## Complete Installation Checklist

- [ ] Install `expo-crypto`: `npx expo install expo-crypto`
- [ ] Rebuild app: `npx expo run:ios` or `npx expo run:android`
- [ ] Verify no TypeScript errors
- [ ] Test contact hashing functionality

---

## Alternative: If You Can't Use expo-crypto

If for some reason `expo-crypto` doesn't work, you can use a JavaScript-only solution:

### Option 1: Use Web Crypto API (Web/React Native)
```typescript
// For web platforms
async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### Option 2: Use crypto-js (npm package)
```bash
npm install crypto-js
npm install --save-dev @types/crypto-js
```

```typescript
import CryptoJS from 'crypto-js';

function hashString(input: string): string {
  return CryptoJS.SHA256(input).toString();
}
```

**However, `expo-crypto` is recommended** because:
- ✅ Native implementation (faster)
- ✅ Works on all platforms
- ✅ Official Expo package
- ✅ Better security

---

## Summary

**Install this ONE library:**
```bash
npx expo install expo-crypto
```

Then rebuild your app. That's it! 🎉

