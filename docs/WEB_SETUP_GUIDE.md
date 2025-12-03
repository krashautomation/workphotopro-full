# Web Setup Guide - Quick Start

This guide will help you set up the Next.js web project for WorkPhotoPro.

## 🎯 Prerequisites

- Node.js 18+ installed
- npm or yarn
- Appwrite project credentials (same as mobile app)
- Domain configured (web.workphotopro.com and app.workphotopro.com)

## 📦 Step 1: Create Next.js Project

```bash
# Create new directory for web project (sibling to WorkPhotoProV2)
cd ..
npx create-next-app@latest workphotopro-web --typescript --tailwind --app --no-src-dir

cd workphotopro-web
```

## 🔧 Step 2: Install Dependencies

```bash
npm install appwrite node-appwrite
```

**Note:** 
- `appwrite` - Client-side SDK (for browser)
- `node-appwrite` - Server-side SDK (for API routes)

## 📁 Step 3: Create Project Structure

```bash
# Create directory structure
mkdir -p app/\(web\)/reset-password
mkdir -p app/\(web\)/invite/\[teamId\]
mkdir -p app/\(web\)/reports/\[reportId\]
mkdir -p app/\(app\)/sign-in
mkdir -p app/\(app\)/sign-up
mkdir -p app/api/reports
mkdir -p lib/appwrite
mkdir -p public/.well-known
```

## 🔐 Step 4: Create Environment File

Create `.env.local`:

```env
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
APPWRITE_API_KEY=your_api_key_here

# Domain Configuration
NEXT_PUBLIC_WEB_DOMAIN=web.workphotopro.com
NEXT_PUBLIC_APP_DOMAIN=app.workphotopro.com
NEXT_PUBLIC_MOBILE_SCHEME=workphotopro://
```

## 📝 Step 5: Create Core Files

### `lib/appwrite/client.ts` (Server-side Appwrite client)

```typescript
import { Client, Account } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

export const serverAccount = new Account(client);
export { client };
```

### `lib/appwrite/client-browser.ts` (Client-side Appwrite client)

```typescript
import { Client, Account } from 'appwrite';

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

export const browserAccount = new Account(client);
export { client as browserClient };
```

### `app/middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const subdomain = hostname.split('.')[0];

  // For localhost development
  if (hostname.includes('localhost')) {
    return NextResponse.next();
  }

  // Route based on subdomain
  if (subdomain === 'app') {
    // app.workphotopro.com - Web app routes
    return NextResponse.next();
  } else if (subdomain === 'web' || hostname === 'workphotopro.com') {
    // web.workphotopro.com - Marketing/public routes
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
```

### `app/(web)/reset-password/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect if user is on mobile
    const userAgent = navigator.userAgent;
    const mobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
    setIsMobile(mobile);

    const userId = searchParams.get('userId');
    const secret = searchParams.get('secret');

    if (userId && secret) {
      // Redirect to mobile app if on mobile device
      if (mobile) {
        const deepLink = `workphotopro://reset-password?userId=${userId}&secret=${secret}`;
        
        // Try to open app
        window.location.href = deepLink;
        
        // Fallback: Show instructions after delay
        setTimeout(() => {
          // Show fallback UI
        }, 2000);
      } else {
        // Desktop: Show web-based reset form
        // TODO: Implement web reset form
      }
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Reset Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isMobile 
              ? 'Opening WorkPhotoPro app...' 
              : 'Please check your email for reset instructions'}
          </p>
        </div>
      </div>
    </div>
  );
}
```

### `app/(web)/invite/[teamId]/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function InvitePage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const mobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
    setIsMobile(mobile);

    if (teamId && mobile) {
      // Redirect to mobile app
      const deepLink = `workphotopro://team-invite?teamId=${teamId}`;
      window.location.href = deepLink;

      // Fallback to app stores after delay
      setTimeout(() => {
        if (/iPhone|iPad|iPod/i.test(userAgent)) {
          window.location.href = 'https://apps.apple.com/app/workphotopro';
        } else if (/Android/i.test(userAgent)) {
          window.location.href = 'https://play.google.com/store/apps/details?id=com.workphotopro.app';
        }
      }, 2500);
    }
  }, [teamId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">
          Join Team Invite
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {isMobile 
            ? 'Opening WorkPhotoPro app...' 
            : 'Please open this link on your mobile device'}
        </p>
        {!isMobile && (
          <div className="mt-4 space-y-2">
            <a
              href={`https://apps.apple.com/app/workphotopro`}
              className="block px-4 py-2 bg-black text-white rounded"
            >
              Download for iOS
            </a>
            <a
              href={`https://play.google.com/store/apps/details?id=com.workphotopro.app`}
              className="block px-4 py-2 bg-green-600 text-white rounded"
            >
              Download for Android
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
```

### `app/(web)/page.tsx` (Landing Page)

```typescript
export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-8">
          WorkPhotoPro
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Professional photo management for construction teams
        </p>
        <div className="text-center">
          <a
            href="https://apps.apple.com/app/workphotopro"
            className="inline-block px-6 py-3 bg-black text-white rounded mr-4"
          >
            Download for iOS
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=com.workphotopro.app"
            className="inline-block px-6 py-3 bg-green-600 text-white rounded"
          >
            Download for Android
          </a>
        </div>
      </main>
    </div>
  );
}
```

## 🔗 Step 6: Configure Universal Links / App Links

### `public/.well-known/apple-app-site-association`

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "YOUR_TEAM_ID.com.workphotopro.app",
        "paths": [
          "/invite/*",
          "/reset-password",
          "/reports/*"
        ]
      }
    ]
  }
}
```

### `public/.well-known/assetlinks.json`

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

### `next.config.js` (Update to serve .well-known files)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/.well-known/:path*',
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

module.exports = nextConfig;
```

## 🚀 Step 7: Run Development Server

```bash
npm run dev
```

Visit:
- `http://localhost:3000` (web.workphotopro.com)
- Configure hosts file for subdomain testing locally

## 📦 Step 8: Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Add custom domains:
   - `web.workphotopro.com`
   - `app.workphotopro.com`
5. Deploy!

## ✅ Testing Checklist

- [ ] Password reset link opens app on mobile
- [ ] Invite link opens app on mobile
- [ ] Links work in browser (show fallback)
- [ ] Universal Links work on iOS
- [ ] App Links work on Android
- [ ] Web reports can be viewed in browser

## 🔄 Next Steps

1. Implement web-based password reset form (for desktop users)
2. Create web report viewer pages
3. Build web app version (app.workphotopro.com)
4. Add analytics and error tracking

