# Setup HTTPS Invite Links

## Overview

Instead of using deep links (`workphotopro://`), we'll use HTTPS links that:
1. Work in any browser
2. Open the app if installed (Universal Links/App Links)
3. Redirect to app stores if not installed
4. Show a web interface as fallback

## Prerequisites

- Your Next.js site at `web.workphotopro.com`
- React Native app with deep link support

## Step 1: Create the Invite Landing Page

Create a new page in your Next.js app:

**File: `pages/invite/[teamId].tsx`** (or `app/invite/[teamId]/page.tsx` for App Router)

```typescript
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function InvitePage() {
  const router = useRouter();
  const { teamId } = router.query;
  const [userAgent, setUserAgent] = useState('');
  
  useEffect(() => {
    setUserAgent(navigator.userAgent);
    
    // Try to open the app via deep link
    const timer = setTimeout(() => {
      // For iOS
      const iosDeepLink = `workphotopro://team-invite?teamId=${teamId}`;
      // For Android
      const androidDeepLink = `workphotopro://team-invite?teamId=${teamId}`;
      
      // Detect platform and redirect
      if (/iPhone|iPad|iPod/i.test(userAgent)) {
        window.location.href = iosDeepLink;
        // Fallback: Open App Store
        setTimeout(() => {
          window.location.href = 'https://apps.apple.com/app/workphotopro';
        }, 2500);
      } else if (/Android/i.test(userAgent)) {
        window.location.href = androidDeepLink;
        // Fallback: Open Play Store
        setTimeout(() => {
          window.location.href = 'https://play.google.com/store/apps/details?id=com.workphotopro.app';
        }, 2500);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [teamId, userAgent]);
  
  return (
    <>
      <Head>
        <title>Join WorkPhotoPro Team</title>
        <meta name="description" content="You've been invited to join a team on WorkPhotoPro" />
        {/* iOS Universal Links */}
        <meta name="apple-itunes-app" content="app-id=YOUR_APP_ID" />
      </Head>
      
      <div style={styles.container}>
        <div style={styles.content}>
          <h1 style={styles.title}>You've been invited!</h1>
          <p style={styles.description}>
            Opening the WorkPhotoPro app...
          </p>
          <p style={styles.fallback}>
            Don't have the app? <a href="#">Download here</a>
          </p>
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  content: {
    textAlign: 'center',
    maxWidth: '400px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '16px',
  },
  description: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '24px',
  },
  fallback: {
    fontSize: '14px',
    color: '#999',
  },
};
```

## Step 2: Update app.json for Universal Links

Add HTTPS link support to your React Native app:

**File: `app.json`**

```json
{
  "expo": {
    "ios": {
      "associatedDomains": ["applinks:web.workphotopro.com"],
      "bundleIdentifier": "com.workphotopro.app"
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "https",
              "host": "web.workphotopro.com",
              "pathPrefix": "/invite"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ],
      "package": "com.workphotopro.app"
    }
  }
}
```

## Step 3: Create Apple App Site Association (AASA) File

For iOS Universal Links, create this file on your Next.js site:

**File: `public/.well-known/apple-app-site-association`**

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.workphotopro.app",
        "paths": ["/invite/*"]
      }
    ]
  }
}
```

Replace `TEAM_ID` with your Apple Developer Team ID.

In Next.js, you need to serve this file. Add to `next.config.js`:

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/.well-known/apple-app-site-association',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
      },
    ];
  },
};
```

## Step 4: Create Android App Links (Digital Asset Links)

For Android, host this JSON file:

**File: `public/.well-known/assetlinks.json`**

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.workphotopro.app",
      "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
    }
  }
]
```

Get your SHA256 fingerprint from:
```bash
keytool -list -v -keystore your-release-key.keystore
```

## Step 5: Update Invite.tsx to Use HTTPS Links

**File: `app/(jobs)/invite.tsx`**

```typescript
// Replace the deep link generation with:
const inviteUrl = `https://web.workphotopro.com/invite/${teamId}`;
setInviteLink(inviteUrl);
```

## Step 6: Test the Flow

1. **Generate invite** from your React Native app
2. **Share the HTTPS link**: `https://web.workphotopro.com/invite/abc123`
3. **Click the link**:
   - If app installed → Opens app directly
   - If app not installed → Shows app store options
   - If browser only → Shows web interface

## Summary

✅ HTTPS links work in any browser  
✅ Automatically open the app if installed  
✅ Redirect to app stores if not installed  
✅ Works in Expo Go and production  
✅ Better user experience  

This is the standard approach used by all major apps!
