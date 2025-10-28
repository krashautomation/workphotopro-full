# Quick Setup: Invite Page for Next.js

## Your Next.js Location
`C:\wpp\workphotopro-webapp`

## What to Add

### 1. Create the Invite Page

**If using Pages Router** (`pages/` directory):
Create: `pages/invite/[teamId].tsx`

**If using App Router** (`app/` directory):
Create: `app/invite/[teamId]/page.tsx`

### 2. Copy This Code

Use the code from `docs/SETUP_HTTPS_INVITES.md` Step 1 (the full InvitePage component).

### 3. Add iOS Universal Links File

Create: `public/.well-known/apple-app-site-association`

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "YOUR_TEAM_ID.com.workphotopro.app",
        "paths": ["/invite/*"]
      }
    ]
  }
}
```

### 4. Update next.config.js

Add headers configuration:

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

### 5. Deploy

Once these files are added to your Next.js app:
1. Deploy to `web.workphotopro.com`
2. Test by generating an invite link in the React Native app
3. Open the link in a browser

## That's It!

Your React Native app is already configured to generate HTTPS links.
Once the Next.js page is deployed, the flow will work end-to-end!

See `docs/SETUP_HTTPS_INVITES.md` for the full code.
