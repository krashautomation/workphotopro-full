# Web Architecture - Quick Answer

## ❓ Your Question

> Should I create separate projects and subdomains for each function (password reset, invite links, web reports, web app)? Or run them all out of web.workphotopro.com?

## ✅ **Answer: Single Next.js Project**

**Use ONE Next.js project** that handles all subdomains and routes. This is the industry standard and best practice.

## 🏗️ Architecture Overview

```
Single Next.js Project
├── web.workphotopro.com (Public/Marketing)
│   ├── /reset-password          → Password reset handler
│   ├── /invite/[teamId]          → Team invite handler  
│   ├── /reports/[reportId]       → Web report viewer
│   └── /                         → Landing page
│
└── app.workphotopro.com (Web App)
    ├── /                         → Web app dashboard
    ├── /sign-in                  → Sign in
    └── /jobs/[jobId]             → Job detail
```

## 🎯 Why Single Project?

### ✅ Advantages
- **One codebase** → Easier maintenance
- **Shared components** → Reuse UI/utilities
- **Single deployment** → Simpler CI/CD
- **Cost effective** → One hosting bill
- **Better performance** → Shared caching/CDN

### ❌ Why NOT Separate Projects?
- Multiple deployments to manage
- Code duplication
- Harder to share logic/components
- More expensive
- More complex setup

## 📋 What Each Route Does

### Password Reset (`/reset-password`)
- Receives: `?userId=...&secret=...` from Appwrite email
- Detects mobile → Redirects to app deep link
- Desktop → Shows web form (future)

### Invite Links (`/invite/[teamId]`)
- Receives team invite link
- Detects mobile → Redirects to app deep link
- Desktop → Shows download buttons

### Web Reports (`/reports/[reportId]`)
- Public/shared report viewer
- Works in any browser
- Shows photos, data, etc.

### Web App (`app.workphotopro.com`)
- Full web version of your mobile app
- Same features, responsive design
- Can share code/logic with mobile

## 🚀 Implementation Path

### Phase 1: Immediate (This Week)
1. ✅ Create Next.js project
2. ✅ Set up subdomain routing
3. ✅ Create password reset handler
4. ✅ Create invite handler
5. ✅ Deploy to Vercel

### Phase 2: Short-term (This Month)
1. Add web report generation
2. Create report viewer pages
3. Add Universal Links / App Links

### Phase 3: Long-term (Future)
1. Build web app version
2. Port mobile components to web
3. Share business logic

## 📦 Project Structure

```
workphotopro-web/          # New Next.js project
├── app/
│   ├── (web)/            # web.workphotopro.com routes
│   ├── (app)/            # app.workphotopro.com routes
│   ├── api/              # API routes
│   └── middleware.ts     # Subdomain routing
└── lib/
    └── appwrite/         # Shared Appwrite client
```

## 🔧 Technical Details

### Subdomain Routing
- Use Next.js middleware to detect subdomain
- Route to appropriate layout/page group
- Single codebase, multiple domains

### Shared Code
- Appwrite client (server + browser)
- Business logic utilities
- Type definitions
- Can even share React components (with React Native Web)

## 💰 Cost Estimate

**Single Project:**
- Vercel: Free tier → $20/month (Pro)
- One deployment pipeline
- One domain configuration

**Multiple Projects:**
- 3-4x the cost
- Multiple deployments
- More complex setup

## ✅ Recommendation

**Start with single Next.js project** at `web.workphotopro.com`:
1. Handles password reset ✅
2. Handles invite links ✅
3. Can add web reports later ✅
4. Can add web app later ✅

**When to split?**
- Only if you have completely different teams
- Only if you need different tech stacks
- Only if you have massive scale (unlikely)

## 📚 Next Steps

1. Read `docs/WEB_SETUP_GUIDE.md` for step-by-step setup
2. Read `docs/WEB_ARCHITECTURE.md` for detailed architecture
3. Create Next.js project
4. Deploy to Vercel
5. Configure domains

## 🎯 Bottom Line

**One Next.js project** → Handles everything → Simplest, cheapest, best practice.

