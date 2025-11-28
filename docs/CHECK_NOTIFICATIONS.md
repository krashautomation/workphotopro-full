# 🔍 How to Check if expo-notifications is Installed

## Automatic Check

When you start the app, it will automatically run a diagnostic check and log the results to the console. Look for:

```
📋 expo-notifications Diagnostic Report
=====================================
```

## Manual Check

### 1. Check if package is installed

```bash
npm list expo-notifications
```

**Expected output:**
```
workphotopro-v2@0.2.0-alpha
└── expo-notifications@0.32.13
```

If you see "npm ERR! peer dep missing", run:
```bash
npm install
```

### 2. Check package.json

The package should be listed in `package.json` dependencies:
```json
{
  "dependencies": {
    "expo-notifications": "~0.32.13"
  }
}
```

### 3. Check app.config.js

The plugin should be configured in `app.config.js`:
```javascript
plugins: [
  // ... other plugins
  [
    'expo-notifications',
    {
      icon: './assets/images/icon.png',
      color: '#22c55e',
    },
  ],
]
```

### 4. Check Native Module Availability

The diagnostic utility (`utils/notificationsCheck.ts`) checks:
- ✅ Package installed in node_modules
- ✅ Native module available
- ✅ Not running in Expo Go
- ✅ Plugin configured in app.config.js

## What the Diagnostic Shows

When the app starts, you'll see a report like:

```
📋 expo-notifications Diagnostic Report
=====================================

Package Installed: ✅ Yes
Native Module Available: ❌ No
Running in Expo Go: ⚠️ Yes

Status: ⚠️ Running in Expo Go - notifications require development build

Recommendations:
  1. Rebuild with: npx expo run:android (or npx expo run:ios)
  2. Do not use Expo Go app - use the development build instead

✅ expo-notifications plugin configured in app.config.js
=====================================
```

## Common Issues

### Issue: Package installed but native module not available

**Symptoms:**
- ✅ Package Installed: Yes
- ❌ Native Module Available: No

**Solution:**
```bash
npx expo run:android
```

This rebuilds the native app with all native modules included.

### Issue: Running in Expo Go

**Symptoms:**
- ⚠️ Running in Expo Go: Yes

**Solution:**
1. Build a development client: `npx expo run:android`
2. Use the development build app (not Expo Go)
3. The app will still connect to Metro bundler for hot reload

### Issue: Package not installed

**Symptoms:**
- ❌ Package Installed: No

**Solution:**
```bash
npm install
npx expo run:android
```

## Using the Utility in Code

You can also use the utility functions in your code:

```typescript
import { 
  checkNotificationsAvailability, 
  isNotificationsAvailable,
  logNotificationsDiagnostics 
} from '@/utils/notificationsCheck';

// Quick check
if (isNotificationsAvailable()) {
  // Notifications are ready to use
}

// Detailed check
const check = checkNotificationsAvailability();
console.log(check.status);
console.log(check.recommendations);

// Log full diagnostic report
logNotificationsDiagnostics();
```

## Summary

✅ **Package is installed** - Verified: `expo-notifications@0.32.13`  
✅ **Plugin is configured** - Found in `app.config.js`  
⚠️ **Native module** - Requires development build (not Expo Go)

To enable notifications, rebuild with: `npx expo run:android`

