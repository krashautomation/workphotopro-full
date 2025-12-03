# Web Architecture Guide for WorkPhotoPro

## 🏗️ Recommended Architecture: Single Next.js Project with Subdomain Routing

**Best Practice**: Use **one Next.js project** to handle all subdomains and routes. This approach:
- ✅ Single codebase to maintain
- ✅ Shared components and utilities
- ✅ Easier deployment and CI/CD
- ✅ Cost-effective (one hosting bill)
- ✅ Better SEO and performance

## 📋 Subdomain Structure

```
web.workphotopro.com     → Marketing/Landing pages, password reset, invite handlers
app.workphotopro.com     → Web version of your React Native app
```

## 🎯 Routes Needed

### `web.workphotopro.com` (Public/Marketing Site)
- `/` - Landing page
- `/reset-password` - Password reset handler (redirects to app)
- `/invite/[teamId]` - Team invite handler (redirects to app)
- `/reports/[reportId]` - Web report viewer (public/shared reports)
- `/privacy` - Privacy policy
- `/terms` - Terms of service

### `app.workphotopro.com` (Web App)
- `/` - Web app dashboard (same as mobile app)
- `/sign-in` - Sign in page
- `/sign-up` - Sign up page
- `/jobs` - Jobs list
- `/jobs/[jobId]` - Job detail/chat
- All other routes matching your mobile app structure

## 🚀 Implementation Strategy

### Phase 1: Setup Next.js Project (Immediate)
1. Create Next.js project in a new directory (e.g., `workphotopro-web/`)
2. Configure subdomain routing with middleware
3. Create basic pages for password reset and invite handling

### Phase 2: Add Web Reports (Short-term)
1. Create report generation API routes
2. Create report viewer pages
3. Add sharing functionality

### Phase 3: Build Web App (Long-term)
1. Port React Native components to React/Next.js
2. Share business logic between mobile and web
3. Use responsive design for mobile/desktop

## 📁 Recommended Project Structure

```
workphotopro-web/
├── app/
│   ├── (web)/              # web.workphotopro.com routes
│   │   ├── layout.tsx
│   │   ├── page.tsx        # Landing page
│   │   ├── reset-password/
│   │   │   └── page.tsx    # Password reset handler
│   │   ├── invite/
│   │   │   └── [teamId]/
│   │   │       └── page.tsx
│   │   └── reports/
│   │       └── [reportId]/
│   │           └── page.tsx
│   ├── (app)/              # app.workphotopro.com routes
│   │   ├── layout.tsx
│   │   ├── page.tsx        # Dashboard
│   │   ├── sign-in/
│   │   │   └── page.tsx
│   │   └── jobs/
│   │       └── [jobId]/
│   │           └── page.tsx
│   ├── api/                # API routes
│   │   ├── reports/
│   │   │   └── [reportId]/
│   │   │       └── route.ts
│   │   └── invite/
│   │       └── route.ts
│   ├── middleware.ts       # Subdomain routing
│   └── layout.tsx          # Root layout
├── lib/
│   ├── appwrite/           # Shared Appwrite client (server-side)
│   └── utils/              # Shared utilities
├── components/             # Shared React components
├── public/
│   └── .well-known/        # Universal Links / App Links
│       ├── apple-app-site-association
│       └── assetlinks.json
└── package.json
```

## 🔧 Key Configuration Files

### `next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Handle subdomains
  async rewrites() {
    return [
      {
        source: '/reset-password',
        destination: '/reset-password',
      },
      {
        source: '/invite/:teamId',
        destination: '/invite/:teamId',
      },
    ];
  },
};

module.exports = nextConfig;
```

### `middleware.ts`
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const subdomain = hostname.split('.')[0];

  // Route based on subdomain
  if (subdomain === 'app') {
    // app.workphotopro.com routes
    return NextResponse.next();
  } else if (subdomain === 'web' || !subdomain.includes('.')) {
    // web.workphotopro.com or localhost routes
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

## 🔐 Environment Variables

```env
# Appwrite (same as mobile app)
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key  # Server-side only

# Domains
NEXT_PUBLIC_WEB_DOMAIN=web.workphotopro.com
NEXT_PUBLIC_APP_DOMAIN=app.workphotopro.com
NEXT_PUBLIC_MOBILE_SCHEME=workphotopro://
```

## 📦 Dependencies Needed

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "appwrite": "^21.0.0",
    "@appwrite.io/nodejs-sdk": "^21.0.0"
  }
}
```

## 🚢 Deployment Options

### Option 1: Vercel (Recommended)
- Automatic subdomain routing
- Easy environment variable management
- Free tier available
- Automatic HTTPS

### Option 2: Self-hosted (VPS/Cloud)
- Use Nginx for subdomain routing
- More control, more setup

## 🔄 Integration with Mobile App

### Password Reset Flow
1. User requests password reset in mobile app
2. Appwrite sends email with: `https://web.workphotopro.com/reset-password?userId=...&secret=...`
3. User clicks link → Opens in browser
4. Next.js page detects mobile → Redirects to app deep link
5. App handles reset password screen

### Invite Flow
1. User generates invite link in mobile app: `https://web.workphotopro.com/invite/{teamId}`
2. User shares link
3. Recipient clicks link → Opens in browser
4. Next.js page detects mobile → Redirects to app deep link
5. App handles invite acceptance

### Web Reports Flow
1. User creates report in mobile app
2. Report stored in Appwrite with shareable link: `https://web.workphotopro.com/reports/{reportId}`
3. Link can be shared/viewed in any browser
4. Next.js page renders report with photos/data

## ✅ Next Steps

1. **Create Next.js project** (see `docs/WEB_SETUP_GUIDE.md`)
2. **Set up subdomain routing** with middleware
3. **Create password reset handler** page
4. **Create invite handler** page
5. **Add Universal Links / App Links** configuration
6. **Deploy to Vercel** with both subdomains configured

## 📚 Additional Resources

- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Vercel Subdomain Routing](https://vercel.com/docs/concepts/projects/domains)
- [Universal Links Setup](https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app)

