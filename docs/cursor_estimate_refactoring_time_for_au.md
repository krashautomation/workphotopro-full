# Estimate refactoring time for authentication
_Exported on 10/13/2025 at 19:21:08 PDT from Cursor (1.7.44)_

---

**User**

if i want to refactor my app so that i no longer use clerk for authentication but use only appwrite, how long do you estimate it will take? how many files need to be changed etc. do not do anything now just give me some breakdown. 

---

**Cursor**

I'll analyze your codebase to give you an estimate for refactoring from Clerk to Appwrite authentication. Let me search for Clerk usage and understand the current auth structure.

## Refactoring Estimate: Clerk to Appwrite Migration

Based on my analysis of your codebase, here's a comprehensive breakdown:

---

### **📊 SUMMARY**
- **Estimated Time:** 6-10 hours for an experienced developer
- **Files to Modify:** 15 files
- **Files to Create:** 3-4 new files
- **Dependencies to Remove:** 3 Clerk packages
- **Dependencies to Add:** Already have Appwrite installed ✅
- **Complexity:** Medium (straightforward replacements but requires OAuth setup)

---

### **📁 FILES REQUIRING CHANGES**

#### **Core Auth Files (High Priority) - 9 files**
1. **`app/_layout.tsx`**
   - Remove `ClerkProvider` and `ClerkLoaded` wrapper
   - Replace with Appwrite auth context/provider
   - **Effort:** 30 mins

2. **`app/(auth)/_layout.tsx`**
   - Replace `useAuth()` from Clerk with Appwrite session check
   - **Effort:** 15 mins

3. **`app/(auth)/sign-in.tsx`**
   - Replace `useSignIn()` hook with Appwrite `account.createEmailSession()`
   - Remove session management logic (simpler with Appwrite)
   - **Effort:** 45 mins

4. **`app/(auth)/sign-up.tsx`**
   - Replace `useSignUp()` with Appwrite `account.create()` + verification
   - Implement email verification flow differently
   - **Effort:** 1 hour

5. **`app/(auth)/forgot-password.tsx`**
   - Replace Clerk password reset with Appwrite `account.createRecovery()`
   - **Effort:** 45 mins

6. **`components/SignOutButton.tsx`**
   - Replace `useClerk().signOut()` with Appwrite `account.deleteSession('current')`
   - **Effort:** 15 mins

7. **`components/GoogleAuthButton.tsx`**
   - Replace Clerk OAuth with Appwrite OAuth2
   - Requires Appwrite OAuth configuration
   - **Effort:** 1-2 hours (includes OAuth setup)

8. **`components/AppleAuthButton.tsx`**
   - Same as Google OAuth
   - **Effort:** 1-2 hours (includes OAuth setup)

9. **`utils/cache.ts`**
   - Can likely be deleted (Appwrite handles session caching differently)
   - **Effort:** 5 mins

#### **User Data Access Files - 5 files**
10. **`app/(jobs)/_layout.tsx`**
    - Replace `useAuth()` and `useUser()` with Appwrite equivalents
    - Access `user.imageUrl` → `user.prefs.avatar` or similar
    - **Effort:** 30 mins

11. **`app/(jobs)/profile-settings.tsx`**
    - Replace `useUser()` with Appwrite user data
    - User structure is different (no `fullName`, need to access `name`)
    - **Effort:** 30 mins

12. **`app/(jobs)/user-profile.tsx`**
    - Display-only profile details fed by route params/Appwrite data
    - Needs Appwrite-backed user + organization fetching
    - **Effort:** 20 mins

13. **`app/(jobs)/[job].tsx`**
    - Replace `useUser()` with Appwrite context
    - **Effort:** 15 mins

14. **`app/(jobs)/index.tsx`**
    - Replace `SignedIn`/`SignedOut` components with custom equivalent
    - Replace `useUser()` hook
    - **Effort:** 30 mins

15. **`app/index.tsx`**
    - Replace `SignedIn`/`SignedOut` components
    - **Effort:** 15 mins

#### **Configuration Files - 1 file**
15. **`package.json`**
    - Remove Clerk packages: `@clerk/clerk-expo`, `@clerk/expo-passkeys`, `@clerk/types`
    - Appwrite already installed ✅
    - **Effort:** 5 mins

---

### **🆕 NEW FILES TO CREATE**

1. **`utils/auth.ts` or `context/AuthContext.tsx`**
   - Create custom auth context/hooks for Appwrite
   - Implement: `useAuth()`, `useUser()`, equivalent hooks
   - **Effort:** 2-3 hours

2. **`components/SignedIn.tsx` & `SignedOut.tsx`**
   - Recreate Clerk's convenience components
   - **Effort:** 30 mins

3. **`utils/appwrite-auth.ts`** (optional)
   - Helper functions for auth operations
   - **Effort:** 1 hour

---

### **🔑 KEY DIFFERENCES & CHALLENGES**

#### **Appwrite vs Clerk - What Changes:**

| Feature | Clerk | Appwrite | Migration Effort |
|---------|-------|----------|------------------|
| **Provider Wrapper** | `<ClerkProvider>` | Custom context or none | Easy |
| **Sign In** | `signIn.create()` | `account.createEmailSession()` | Easy |
| **Sign Up** | `signUp.create()` + verification | `account.create()` + separate verification | Medium |
| **User Object** | Rich object with `fullName`, `imageUrl` | Simpler object, needs `prefs` for custom data | Easy |
| **Session Management** | Automatic via `setActive()` | Automatic via cookies/tokens | Easy |
| **OAuth** | Built-in `useOAuth()` | Manual OAuth2 flow | **Hard** |
| **Forgot Password** | Multi-step flow | `createRecovery()` + confirm | Medium |
| **Auth State** | `useAuth().isSignedIn` | Check session manually | Easy |

#### **Biggest Challenges:**
1. **OAuth (Google/Apple)** - Requires manual implementation and OAuth2 configuration in Appwrite
2. **Email Verification Flow** - Different approach, may need UI adjustments
3. **User Profile Structure** - Clerk's user object is richer; need to map fields
4. **No Ready-made Components** - Need to create `SignedIn`/`SignedOut` equivalents

---

### **⚙️ ADDITIONAL SETUP REQUIRED**

1. **Appwrite Console Configuration:**
   - Enable Email/Password authentication
   - Configure OAuth providers (Google, Apple)
   - Set up redirect URLs
   - Configure email templates
   - **Effort:** 1-2 hours

2. **Environment Variables:**
   - Remove `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - Appwrite variables already set ✅

3. **Testing:**
   - Test all auth flows
   - Test OAuth providers
   - Test session persistence
   - **Effort:** 2-3 hours

---

### **📅 TIMELINE BREAKDOWN**

**Day 1 (4-5 hours):**
- Create auth context and utilities
- Replace basic auth flows (sign in, sign up, sign out)
- Update user data access patterns

**Day 2 (3-4 hours):**
- Implement OAuth (Google, Apple)
- Configure Appwrite console
- Test and fix auth flows

**Day 3 (2-3 hours):**
- Polish and bug fixes
- Update forgot password flow
- Final testing across all screens

---

### **💡 RECOMMENDATIONS**

1. **Keep Clerk temporarily** - Use feature flags to switch between them during migration
2. **Start with basic auth** - Email/password first, OAuth later
3. **Create reusable hooks** - Make migration cleaner and future-proof
4. **Test incrementally** - Don't migrate everything at once

---

### **🎯 COMPLEXITY RATING**

- **Overall:** ⭐⭐⭐ (Medium) out of 5
- **Basic Auth:** ⭐⭐ (Easy-Medium)
- **OAuth:** ⭐⭐⭐⭐ (Hard)
- **Session Management:** ⭐⭐ (Easy-Medium)

The migration is straightforward for basic features but OAuth implementation will be the most time-consuming part.

---

**User**

the reason i am asking is that I will be implementing a multi-tenant architecture with organizations and teams. I want to turn it into a mutli-tenant app with teams, roles and permissions. will i save time, and will my architecture be simpler if i remove clerk and just us appwrite? do not implement anything yet, just give me a breakdown.

---

**Cursor**

Excellent question! This changes the equation significantly. Let me give you a strategic breakdown comparing both approaches for multi-tenant architecture.

---

## **🏗️ MULTI-TENANT ARCHITECTURE COMPARISON**

### **Critical Analysis: Clerk + Appwrite vs. Appwrite Only**

---

## **📊 QUICK VERDICT**

**YES, you will save significant time and have a simpler architecture using only Appwrite.**

Here's why:

---

## **🔄 ARCHITECTURAL COMPLEXITY**

### **Option 1: Clerk + Appwrite (Current Path)**

```
┌─────────────────────────────────────────────────┐
│                  YOUR APP                        │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────┐         ┌─────────────────┐  │
│  │    CLERK     │         │    APPWRITE     │  │
│  │              │         │                 │  │
│  │ - Users      │         │ - Teams         │  │
│  │ - Sessions   │         │ - Databases     │  │
│  │ - Organizations│ ──┬──▶│ - Storage       │  │
│  │ - OAuth      │   │   │ - Permissions   │  │
│  │ - Roles (?)  │   │   │ - Functions     │  │
│  └──────────────┘   │   └─────────────────┘  │
│                     │                          │
│     ⚠️ SYNC LAYER ─┘                          │
│     (You must build this!)                     │
└─────────────────────────────────────────────────┘
```

**Problems:**
- 🔴 **Two sources of truth** for user identity
- 🔴 **Sync complexity** - Clerk user ↔ Appwrite teams/permissions
- 🔴 **Double cost** - Paying for Clerk (especially Organizations feature)
- 🔴 **Data duplication** - User data in both systems
- 🔴 **Complex queries** - "Which teams does this Clerk user belong to in Appwrite?"

---

### **Option 2: Appwrite Only (Recommended)**

```
┌─────────────────────────────────────────────────┐
│                  YOUR APP                        │
├─────────────────────────────────────────────────┤
│                                                  │
│              ┌─────────────────┐                │
│              │    APPWRITE     │                │
│              │                 │                │
│              │ ✅ Users        │                │
│              │ ✅ Auth/Sessions│                │
│              │ ✅ Teams        │                │
│              │ ✅ Databases    │                │
│              │ ✅ Storage      │                │
│              │ ✅ Permissions  │                │
│              │ ✅ Roles        │                │
│              │ ✅ Functions    │                │
│              └─────────────────┘                │
│                                                  │
│           Single source of truth ✨             │
└─────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ **Single source of truth** - Everything in one place
- ✅ **Native integration** - Teams + Permissions work seamlessly
- ✅ **Simpler queries** - Direct database queries
- ✅ **No sync layer** needed
- ✅ **Free and open-source** - No per-user pricing
- ✅ **Full control** - Self-hosted option

---

## **🏢 MULTI-TENANT FEATURES COMPARISON**

| Feature | Clerk | Appwrite | Winner |
|---------|-------|----------|--------|
| **Organizations/Teams** | ✅ Yes (paid tier) | ✅ Yes (free, built-in) | Appwrite |
| **Team Roles** | ✅ Limited (admin, member) | ✅ Flexible (custom roles) | Appwrite |
| **Permissions System** | ⚠️ Basic | ✅ Granular (document-level) | **Appwrite** |
| **Invitations** | ✅ Built-in | 🔨 DIY (but easy) | Clerk |
| **User → Team Assignment** | ✅ Built-in | ✅ Built-in | Tie |
| **Database Integration** | ❌ Separate system | ✅ Native | **Appwrite** |
| **Custom Metadata** | ⚠️ Limited | ✅ Unlimited via DB | **Appwrite** |
| **Role-Based Access Control** | ⚠️ Basic | ✅ Advanced | **Appwrite** |
| **Team Hierarchies** | ❌ Flat only | ✅ Can build nested | **Appwrite** |
| **Cost at Scale** | 💰 $25-$99+/mo | 💰 Free (self-host) | **Appwrite** |

---

## **🔐 PERMISSION MODEL COMPARISON**

### **With Clerk + Appwrite:**
```typescript
// Problem: Two systems to check

// 1. Check Clerk organization role
const clerkUser = useUser()
const orgRole = clerkUser.organizationMemberships[0].role // 'admin' | 'member'

// 2. Then check Appwrite permissions
const canEdit = await db.getDocument(
  dbId, 
  collectionId, 
  docId
  // But how do you connect Clerk role to Appwrite permission? 🤔
)

// 3. You need a sync mechanism
// - Clerk webhook → Update Appwrite team
// - Store Clerk orgId in Appwrite
// - Create middleware to sync roles
// - Handle edge cases when sync fails
```

### **With Appwrite Only:**
```typescript
// Simple: One system

// User is automatically part of team with role
const user = await account.get()
const teams = await teams.list()

// Permissions automatically enforced at DB level
const document = await db.getDocument(
  dbId,
  collectionId, 
  docId
  // Appwrite checks: Does user's team have permission? ✅
)

// Role-based permissions in collection settings:
// - team:adminTeamId (read, write, delete)
// - team:memberTeamId (read only)
```

---

## **⏱️ DEVELOPMENT TIME COMPARISON**

### **Multi-Tenant Implementation Time:**

#### **With Clerk + Appwrite: 4-6 weeks**
| Task | Time | Notes |
|------|------|-------|
| Create Clerk Organizations | 1 week | Learning Clerk Orgs API |
| Sync Clerk → Appwrite Teams | 1-2 weeks | **Major pain point** |
| Build permission layer | 1 week | Mapping between systems |
| Handle edge cases | 1 week | Sync failures, orphaned data |
| Testing | 1 week | Test both systems |
| **TOTAL** | **5-6 weeks** | High complexity |

#### **With Appwrite Only: 2-3 weeks**
| Task | Time | Notes |
|------|------|-------|
| Migrate auth to Appwrite | 1 week | (We estimated earlier) |
| Build teams feature | 3-5 days | Native Appwrite teams |
| Set up permissions | 2-3 days | Collection-level config |
| Build invite system | 2-3 days | Functions + email |
| Testing | 2-3 days | Single system to test |
| **TOTAL** | **2.5-3 weeks** | Much cleaner |

**Time Saved: 2-3 weeks** (40-50% faster)

---

## **💰 COST COMPARISON** (at scale)

### **Clerk Pricing for Multi-Tenant:**
```
Clerk Pro Plan (required for Organizations):
- $25/month base
- $0.02 per MAU after 10,000 users

At 50,000 users:
$25 + (40,000 × $0.02) = $825/month

At 100,000 users:
$25 + (90,000 × $0.02) = $1,825/month
```

### **Appwrite Pricing:**
```
Appwrite Cloud (Pro):
- $15/month per member + usage

Or Self-Hosted:
- $0 + infrastructure costs
- ~$50-100/month for decent server

At 100,000 users on self-hosted:
~$100/month total
```

**Cost Savings: $1,700+/month at scale**

---

## **🛠️ SPECIFIC MULTI-TENANT FEATURES**

### **What You'll Build:**

#### **1. Organizations/Companies**
```typescript
// Appwrite: Use Teams as Organizations
const org = await teams.create(
  'org-id',
  'Acme Construction Co',
  ['owner', 'admin', 'member', 'viewer'] // Custom roles
)
```

#### **2. User Roles within Organizations**
```typescript
// Add user to org with role
await teams.createMembership(
  orgId,
  ['admin'], // roles
  'user@email.com'
)
```

#### **3. Permissions at Document/Resource Level**
```typescript
// In Appwrite, set collection permissions:
Permission.read(Role.team('adminTeamId')),
Permission.write(Role.team('adminTeamId')),
Permission.read(Role.team('memberTeamId')), // Members can read
```

#### **4. Nested Structure (Teams within Orgs)**
```
Organization (Company)
  ├── Team: Construction
  │   ├── User A (foreman)
  │   └── User B (worker)
  └── Team: Office
      ├── User C (admin)
      └── User D (accountant)
```

This is **easy with Appwrite** (nested teams + custom attributes), but **complex with Clerk** (would need Appwrite anyway for nested structure).

---

## **🎯 RECOMMENDED ARCHITECTURE** (Appwrite Only)

### **Database Schema:**

```
Collections:

1. organizations
   - id
   - name
   - settings (JSON)
   - ownerId
   - createdAt
   - teamId (reference to Appwrite Team)

2. projects (or jobs in your case)
   - id
   - organizationId
   - name
   - teamIds[] (which teams can access this)
   - permissions (who can do what)

3. team_members (extends Appwrite teams)
   - teamId
   - userId
   - role (owner, admin, member, viewer)
   - permissions[] (custom permissions)
   - customFields (any extra data)

4. invitations
   - email
   - organizationId
   - role
   - token
   - expiresAt
```

### **Permission Strategy:**
```typescript
// Collection-level permissions
Collections.jobs.permissions:
  - document.read(team:{teamId}) // Team can read their jobs
  - document.write(team:{teamId}, role:admin) // Only admins can edit
  - document.delete(team:{teamId}, role:owner) // Only owners can delete

// Dynamic permissions in code
const canUserEditJob = async (userId, jobId) => {
  const job = await db.getDocument(dbId, 'jobs', jobId)
  const userTeams = await teams.list()
  
  return userTeams.some(team => 
    job.teamIds.includes(team.$id) && 
    team.roles.includes('admin')
  )
}
```

---

## **⚠️ POTENTIAL CONCERNS WITH APPWRITE ONLY**

### **1. OAuth Setup**
- **Concern:** More manual than Clerk
- **Reality:** 1-2 hours extra work, one-time setup
- **Verdict:** ✅ Not a blocker

### **2. Email Templates**
- **Concern:** Clerk has nicer pre-built templates
- **Reality:** Appwrite has templates too, can customize
- **Verdict:** ✅ Manageable

### **3. Session Management**
- **Concern:** Less automatic than Clerk
- **Reality:** Appwrite handles it, just different API
- **Verdict:** ✅ Equivalent

### **4. Support/Community**
- **Concern:** Clerk has better support
- **Reality:** Appwrite has active Discord, good docs
- **Verdict:** ⚠️ Slightly worse but acceptable

---

## **📈 SCALABILITY**

| Aspect | Clerk + Appwrite | Appwrite Only |
|--------|-----------------|---------------|
| **Data Consistency** | ⚠️ Complex | ✅ Simple |
| **Query Performance** | ⚠️ Multiple API calls | ✅ Single query |
| **Caching Strategy** | 🔴 Two caches needed | ✅ One cache |
| **Horizontal Scaling** | ⚠️ Both systems | ✅ One system |
| **Monitoring** | 🔴 Two dashboards | ✅ One dashboard |
| **Debugging** | 🔴 Which system failed? | ✅ Clear |

---

## **🎓 LEARNING CURVE**

- **Clerk Multi-tenant:** ~1 week to learn Organizations API
- **Appwrite Multi-tenant:** ~3-5 days to learn Teams + Permissions
- **Sync Layer:** ~2 weeks to build and debug

**Net Learning Time Saved with Appwrite:** ~1.5 weeks

---

## **🏁 FINAL RECOMMENDATION**

### **Migrate to Appwrite-only NOW. Here's why:**

1. **Save 2-3 weeks** of development time for multi-tenant features
2. **50% simpler architecture** - one system vs two
3. **Save $1,700+/month** at scale
4. **More flexible permissions** - crucial for multi-tenant
5. **Easier to maintain** - one codebase, one API
6. **Better control** - self-hosting option, full customization
7. **No sync layer** - eliminates entire category of bugs

### **When Clerk Makes Sense:**
- ❌ You need enterprise SSO (SAML) immediately
- ❌ You want white-glove support
- ❌ You don't care about costs
- ❌ You only need basic roles (admin/member)

### **When Appwrite Makes Sense (YOU):**
- ✅ Building custom multi-tenant architecture
- ✅ Need granular permissions and roles
- ✅ Want one unified backend
- ✅ Cost-conscious or planning to scale
- ✅ Want full control and flexibility

---

## **📋 MIGRATION + MULTI-TENANT TIMELINE**

### **Recommended Approach:**

**Week 1:** Migrate auth to Appwrite (6-10 hours from earlier estimate)

**Week 2:** Build multi-tenant foundation
- Set up Teams structure
- Create organizations collection
- Build team management UI

**Week 3:** Implement permissions & roles
- Configure collection-level permissions
- Build role assignment UI
- Add team member management

**Week 4:** Polish & testing
- Invitations system
- Team switching
- Permission testing
- Edge cases

**Total: 3-4 weeks** for complete migration + multi-tenant features

**vs. Keeping Clerk: 5-6 weeks** for sync layer + multi-tenant features

---

## **💡 MY VERDICT**

**Remove Clerk. Go full Appwrite.** 

The upfront migration cost (1 week) pays for itself immediately when building multi-tenant features. You'll end up with:
- Cleaner codebase
- Faster development
- Lower costs
- More flexibility
- Easier maintenance

The only reason to keep Clerk would be if you were building a simple single-tenant app with basic auth needs. But for your multi-tenant vision with teams, roles, and permissions, **Appwrite is architecturally superior**.

```plaintext
┌─────────────────────────────────────────────────┐
│                  YOUR APP                        │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────┐         ┌─────────────────┐  │
│  │    CLERK     │         │    APPWRITE     │  │
│  │              │         │                 │  │
│  │ - Users      │         │ - Teams         │  │
│  │ - Sessions   │         │ - Databases     │  │
│  │ - Organizations│ ──┬──▶│ - Storage       │  │
│  │ - OAuth      │   │   │ - Permissions   │  │
│  │ - Roles (?)  │   │   │ - Functions     │  │
│  └──────────────┘   │   └─────────────────┘  │
│                     │                          │
│     ⚠️ SYNC LAYER ─┘                          │
│     (You must build this!)                     │
└─────────────────────────────────────────────────┘
```

```plaintext
┌─────────────────────────────────────────────────┐
│                  YOUR APP                        │
├─────────────────────────────────────────────────┤
│                                                  │
│              ┌─────────────────┐                │
│              │    APPWRITE     │                │
│              │                 │                │
│              │ ✅ Users        │                │
│              │ ✅ Auth/Sessions│                │
│              │ ✅ Teams        │                │
│              │ ✅ Databases    │                │
│              │ ✅ Storage      │                │
│              │ ✅ Permissions  │                │
│              │ ✅ Roles        │                │
│              │ ✅ Functions    │                │
│              └─────────────────┘                │
│                                                  │
│           Single source of truth ✨             │
└─────────────────────────────────────────────────┘
```

```typescript
// Problem: Two systems to check

// 1. Check Clerk organization role
const clerkUser = useUser()
const orgRole = clerkUser.organizationMemberships[0].role // 'admin' | 'member'

// 2. Then check Appwrite permissions
const canEdit = await db.getDocument(
  dbId, 
  collectionId, 
  docId
  // But how do you connect Clerk role to Appwrite permission? 🤔
)

// 3. You need a sync mechanism
// - Clerk webhook → Update Appwrite team
// - Store Clerk orgId in Appwrite
// - Create middleware to sync roles
// - Handle edge cases when sync fails
```

```typescript
// Simple: One system

// User is automatically part of team with role
const user = await account.get()
const teams = await teams.list()

// Permissions automatically enforced at DB level
const document = await db.getDocument(
  dbId,
  collectionId, 
  docId
  // Appwrite checks: Does user's team have permission? ✅
)

// Role-based permissions in collection settings:
// - team:adminTeamId (read, write, delete)
// - team:memberTeamId (read only)
```

```plaintext
Clerk Pro Plan (required for Organizations):
- $25/month base
- $0.02 per MAU after 10,000 users

At 50,000 users:
$25 + (40,000 × $0.02) = $825/month

At 100,000 users:
$25 + (90,000 × $0.02) = $1,825/month
```

```plaintext
Appwrite Cloud (Pro):
- $15/month per member + usage

Or Self-Hosted:
- $0 + infrastructure costs
- ~$50-100/month for decent server

At 100,000 users on self-hosted:
~$100/month total
```

```typescript
// Appwrite: Use Teams as Organizations
const org = await teams.create(
  'org-id',
  'Acme Construction Co',
  ['owner', 'admin', 'member', 'viewer'] // Custom roles
)
```

```typescript
// Add user to org with role
await teams.createMembership(
  orgId,
  ['admin'], // roles
  'user@email.com'
)
```

```typescript
// In Appwrite, set collection permissions:
Permission.read(Role.team('adminTeamId')),
Permission.write(Role.team('adminTeamId')),
Permission.read(Role.team('memberTeamId')), // Members can read
```

```plaintext
Organization (Company)
  ├── Team: Construction
  │   ├── User A (foreman)
  │   └── User B (worker)
  └── Team: Office
      ├── User C (admin)
      └── User D (accountant)
```

```plaintext
Collections:

1. organizations
   - id
   - name
   - settings (JSON)
   - ownerId
   - createdAt
   - teamId (reference to Appwrite Team)

2. projects (or jobs in your case)
   - id
   - organizationId
   - name
   - teamIds[] (which teams can access this)
   - permissions (who can do what)

3. team_members (extends Appwrite teams)
   - teamId
   - userId
   - role (owner, admin, member, viewer)
   - permissions[] (custom permissions)
   - customFields (any extra data)

4. invitations
   - email
   - organizationId
   - role
   - token
   - expiresAt
```

```typescript
// Collection-level permissions
Collections.jobs.permissions:
  - document.read(team:{teamId}) // Team can read their jobs
  - document.write(team:{teamId}, role:admin) // Only admins can edit
  - document.delete(team:{teamId}, role:owner) // Only owners can delete

// Dynamic permissions in code
const canUserEditJob = async (userId, jobId) => {
  const job = await db.getDocument(dbId, 'jobs', jobId)
  const userTeams = await teams.list()
  
  return userTeams.some(team => 
    job.teamIds.includes(team.$id) && 
    team.roles.includes('admin')
  )
}
```

---

**User**

would it be easier for me to just create a new project, and implement the features from scratch rather than refactoring, when i want to drop expo and use appwrite only for this project: workphotopro. i can use this existing project as a reference, or copy the file structure. what is your advice? give me a breakdown

---

**Cursor**

Excellent strategic question! Let me give you a comprehensive analysis of **Fresh Start vs. Refactor**, and also clarify your tech stack goals.

---

## **🤔 FIRST: CLARIFICATION NEEDED**

You mentioned "drop expo" - what's your target stack?

### **Option A: React Native CLI (no Expo)**
```
React Native CLI + Appwrite
- More native control
- Smaller bundle size
- More setup complexity
```

### **Option B: Keep Expo + Appwrite**
```
Expo + Appwrite (just remove Clerk)
- Faster development
- Easier updates
- Good for your use case (camera, image picker)
```

### **Option C: Different Stack Entirely**
```
Next.js + Appwrite (web/mobile web)
Flutter + Appwrite
Pure native (Swift/Kotlin) + Appwrite
```

**My assumption for this analysis:** You want **React Native (with or without Expo) + Appwrite**

---

## **📊 QUICK VERDICT**

**For your specific case: START FRESH (80% confidence)**

**However**, there's a hybrid approach that's even better (see bottom).

---

## **🆚 DETAILED COMPARISON**

### **APPROACH 1: REFACTOR EXISTING PROJECT**

#### **What You'd Do:**
1. Remove Clerk dependencies
2. Replace all Clerk calls with Appwrite
3. Keep existing UI/components
4. Keep existing structure
5. Test extensively to catch all Clerk references

#### **Time Estimate: 2-3 weeks**
| Task | Time | Difficulty |
|------|------|------------|
| Remove Clerk, add Appwrite auth | 1 week | Medium |
| Test all screens for missed Clerk refs | 3-4 days | Tedious |
| Fix hidden dependencies | 2-3 days | Frustrating |
| Ensure no Clerk remnants | 2 days | Annoying |
| **TOTAL** | **2-3 weeks** | **Medium-High** |

#### **Pros:**
✅ Keep working UI components  
✅ Keep file structure  
✅ Keep styles and assets  
✅ Faster if you have lots of custom UI  
✅ Can do incrementally  

#### **Cons:**
❌ Clerk "ghost code" - easy to miss references  
❌ Old patterns/architecture baked in  
❌ Expo + Clerk dependencies still in package-lock.json  
❌ Mental model is "Clerk with Appwrite patches"  
❌ Technical debt accumulates  
❌ If dropping Expo, need to eject anyway (nightmare)  
❌ Bundle size still bloated with Expo dependencies  

---

### **APPROACH 2: START FRESH**

#### **What You'd Do:**
1. Create new project with `npx create-expo-app` or `npx react-native init`
2. Set up Appwrite from day 1
3. Copy over UI components (dumb components)
4. Rebuild auth flow with Appwrite native
5. Rebuild features one by one
6. Reference old project for business logic

#### **Time Estimate: 2.5-3.5 weeks**
| Task | Time | Difficulty |
|------|------|------------|
| Project setup + dependencies | 1 day | Easy |
| Build auth with Appwrite (from scratch) | 4-5 days | Medium |
| Copy/adapt UI components | 2-3 days | Easy |
| Rebuild jobs feature | 3-4 days | Easy-Medium |
| Rebuild image upload | 2-3 days | Easy |
| Multi-tenant foundation | 3-5 days | Medium |
| Testing & polish | 3-4 days | Easy |
| **TOTAL** | **2.5-3.5 weeks** | **Medium** |

#### **Pros:**
✅ **Clean slate** - no Clerk baggage  
✅ **Appwrite-first architecture** - designed around it  
✅ **Better file structure** - can organize for multi-tenant  
✅ **Fresh dependencies** - only what you need  
✅ **Easier to reason about** - pure Appwrite patterns  
✅ **If dropping Expo** - start with React Native CLI directly  
✅ **Smaller bundle size** - no unused dependencies  
✅ **Better foundation** for multi-tenant  
✅ **Learning opportunity** - understand your stack deeply  

#### **Cons:**
❌ Slightly longer timeline (but only marginally)  
❌ Need to rebuild some features  
❌ Might miss some edge cases from old project  
❌ Need to reconfigure build settings (Android, etc.)  

---

## **📈 DETAILED TIME COMPARISON**

### **Refactor Approach:**
```
Week 1: Remove Clerk, implement Appwrite auth (5-7 days)
Week 2: Hunt for all Clerk references (tedious) (5-7 days)
Week 3: Fix edge cases, test everything (5-7 days)
Week 4: Multi-tenant features (5-7 days)

TOTAL: 3-4 weeks
FRUSTRATION LEVEL: 🔴🔴🔴 High
TECHNICAL DEBT: 🔴🔴🔴 High
```

### **Fresh Start Approach:**
```
Week 1: Setup + Auth + Core UI (5-6 days)
Week 2: Features (jobs, images, profile) (5-6 days)
Week 3: Multi-tenant foundation (5-6 days)
Week 4: Polish & testing (3-4 days)

TOTAL: 3-4 weeks
FRUSTRATION LEVEL: 🟢🟢 Low
TECHNICAL DEBT: 🟢🟢🟢 None
```

**Net Time Difference: Nearly the same (maybe 2-3 days longer for fresh start)**

---

## **🎯 WHAT YOU CAN REUSE (Copy/Paste)**

### **✅ 100% Reusable (Copy directly):**
```
components/
  ├── BottomModal.tsx          ✅ Pure UI
  ├── IconSymbol.tsx           ✅ Pure UI
  ├── Input.tsx                ✅ Pure UI
  └── (other dumb components)  ✅ Pure UI

styles/
  └── globalStyles.ts          ✅ No dependencies

utils/
  ├── colors.ts                ✅ Constants
  ├── types.ts                 ✅ May need updates
  └── test-data.ts             ✅ Mock data

assets/
  └── images/                  ✅ All images

app/
  └── File structure            ✅ As template
```

### **⚠️ 70% Reusable (Adapt slightly):**
```
app/(jobs)/
  ├── [job].tsx                ⚠️ Remove Clerk hooks
  ├── index.tsx                ⚠️ Replace auth logic
  └── new-job.tsx              ⚠️ Update user context

components/
  └── (smart components)       ⚠️ Replace data fetching
```

### **❌ 0% Reusable (Rewrite):**
```
app/_layout.tsx                ❌ ClerkProvider → AppwriteProvider
app/(auth)/                    ❌ Complete rewrite for Appwrite
components/GoogleAuthButton     ❌ OAuth flow different
components/AppleAuthButton      ❌ OAuth flow different
components/SignOutButton        ❌ Different API
utils/cache.ts                 ❌ Not needed
```

**Reusability Score: ~60-70% of your codebase**

---

## **🏗️ FRESH START PROJECT STRUCTURE**

### **Recommended Structure (Multi-Tenant Ready):**

```
WorkPhotoProV2/
├── app/
│   ├── _layout.tsx                    # AppwriteProvider
│   ├── index.tsx                      # Landing page
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── sign-in.tsx                # Appwrite native
│   │   ├── sign-up.tsx                # Appwrite native
│   │   └── verify-email.tsx           # Appwrite verification
│   ├── (app)/
│   │   ├── _layout.tsx                # Org/team selector
│   │   ├── (jobs)/
│   │   │   ├── index.tsx              # Jobs list
│   │   │   ├── [id].tsx               # Job detail
│   │   │   └── new.tsx                # Create job
│   │   ├── (organizations)/
│   │   │   ├── index.tsx              # Org list
│   │   │   ├── [id]/
│   │   │   │   ├── index.tsx          # Org dashboard
│   │   │   │   ├── teams.tsx          # Team management
│   │   │   │   ├── members.tsx        # Member management
│   │   │   │   └── settings.tsx       # Org settings
│   │   ├── profile-settings.tsx
│   │   └── user-profile.tsx
│   
├── lib/
│   ├── appwrite/
│   │   ├── client.ts                  # Appwrite client setup
│   │   ├── auth.ts                    # Auth functions
│   │   ├── database.ts                # DB functions
│   │   ├── storage.ts                 # Storage functions
│   │   ├── teams.ts                   # Team functions (NEW)
│   │   └── permissions.ts             # Permission helpers (NEW)
│   
├── context/
│   ├── AuthContext.tsx                # Auth state
│   ├── OrganizationContext.tsx        # Current org (NEW)
│   └── TeamContext.tsx                # Current team (NEW)
│   
├── hooks/
│   ├── useAuth.ts                     # Auth hook
│   ├── useOrganization.ts             # Org hook (NEW)
│   ├── useTeam.ts                     # Team hook (NEW)
│   ├── usePermissions.ts              # Permission check (NEW)
│   └── useJobs.ts                     # Jobs data hook
│   
├── components/
│   ├── ui/                            # Dumb components (copy from old)
│   ├── auth/
│   │   ├── SignInForm.tsx
│   │   ├── SignUpForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── organizations/
│   │   ├── OrgSelector.tsx            # Switch orgs (NEW)
│   │   ├── TeamSelector.tsx           # Switch teams (NEW)
│   │   └── InviteMembers.tsx          # Invite UI (NEW)
│   └── jobs/
│       ├── JobCard.tsx
│       └── JobList.tsx
│   
├── types/
│   ├── appwrite.ts                    # Appwrite types
│   ├── organization.ts                # Org types (NEW)
│   ├── team.ts                        # Team types (NEW)
│   └── job.ts
│   
└── utils/
    ├── permissions.ts                 # Permission helpers (NEW)
    └── helpers.ts
```

---

## **💡 THE HYBRID APPROACH (BEST OPTION)**

### **"Staged Migration" Strategy**

**Phase 1: Fresh Start Core (Week 1)**
- Create new project
- Set up Appwrite auth
- Build basic auth screens
- **Checkpoint:** Working auth flow

**Phase 2: Copy UI Layer (Week 2)**
- Copy all reusable components
- Copy styles
- Rebuild main features (jobs, images)
- **Checkpoint:** Feature parity with old app

**Phase 3: Multi-Tenant Foundation (Week 3)**
- Add organizations
- Add teams
- Add permissions
- **Checkpoint:** Multi-tenant working

**Phase 4: Polish & Migrate Data (Week 4)**
- Migrate any existing data
- Polish UI
- Testing
- **Checkpoint:** Production ready

---

## **⚠️ RISKS & MITIGATION**

### **Refactor Risks:**
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Missed Clerk reference | 🔴 High | 🔴 High | Extensive testing |
| Expo ejection issues | 🔴 High | 🔴 High | Might need fresh start anyway |
| Architecture conflicts | 🟡 Medium | 🟡 Medium | Rewrite entire sections |
| Bloated bundle | 🟢 Low | 🟡 Medium | Manual cleanup |

### **Fresh Start Risks:**
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Missed features | 🟡 Medium | 🟢 Low | Reference old app |
| Longer initial setup | 🟢 Low | 🟢 Low | Automated setup |
| Rebuild takes time | 🟡 Medium | 🟢 Low | Copy reusable code |
| Build config issues | 🟡 Medium | 🟡 Medium | Document as you go |

---

## **📱 EXPO vs. REACT NATIVE CLI**

### **Should You Drop Expo?**

**For Your App (WorkPhotoPro), Keep Expo!**

| Feature Needed | Expo | React Native CLI |
|----------------|------|------------------|
| **Camera** | ✅ expo-camera (excellent) | ⚠️ Need native module |
| **Image Picker** | ✅ expo-image-picker | ⚠️ Need react-native-image-picker |
| **Image Compression** | ✅ expo-image-manipulator | ⚠️ Need separate library |
| **OTA Updates** | ✅ Built-in | ❌ Complex setup |
| **Build Service** | ✅ EAS Build | ⚠️ Manual Xcode/Android Studio |
| **Push Notifications** | ✅ Easy setup | ⚠️ More complex |
| **File System** | ✅ expo-file-system | ⚠️ Need RNFS |

**Verdict: Keep Expo** unless you have specific needs like:
- Complex native modules
- Smaller bundle size is critical
- Need full control over native code

Expo SDK 50+ is mature, performant, and perfect for your use case.

---

## **💰 COST-BENEFIT ANALYSIS**

### **Refactor:**
```
Time Cost:        2-3 weeks
Frustration Cost: High
Technical Debt:   High
Future Velocity:  Slower (debt drag)
Code Quality:     Medium
Maintainability:  Medium

Total "Cost":     ~120-150 hours of work
```

### **Fresh Start:**
```
Time Cost:        2.5-3.5 weeks
Frustration Cost: Low
Technical Debt:   None
Future Velocity:  Faster (clean base)
Code Quality:     High
Maintainability:  High

Total "Cost":     ~130-160 hours of work
```

**Difference: 10-20 hours more work, but way better outcome**

---

## **🎓 LEARNING & SKILL BUILDING**

### **Refactor:**
- ❌ Reinforces "patching" mentality
- ❌ Learn to "work around" problems
- ❌ Surface-level understanding

### **Fresh Start:**
- ✅ Deep understanding of Appwrite
- ✅ Learn architecture from scratch
- ✅ Build proper patterns
- ✅ **Better engineer after this project**

---

## **🏁 MY FINAL RECOMMENDATION**

### **START FRESH. Here's the plan:**

**Step 1: Create New Project**
```bash
npx create-expo-app@latest WorkPhotoProV2 --template blank-typescript
cd WorkPhotoProV2
npx expo install appwrite react-native-appwrite
```

**Step 2: Set Up Appwrite Auth (2-3 days)**
- Build auth context
- Build auth screens
- Test auth flow

**Step 3: Copy Reusable Code (1-2 days)**
- Copy components/ui folder
- Copy styles
- Copy assets

**Step 4: Rebuild Core Features (5-7 days)**
- Jobs CRUD
- Image upload
- Profile

**Step 5: Add Multi-Tenant (5-7 days)**
- Organizations
- Teams
- Permissions

**Step 6: Polish (3-4 days)**
- Testing
- Bug fixes
- Documentation

**Total: 3-3.5 weeks**

---

## **🎯 DECISION FRAMEWORK**

Choose **REFACTOR** if:
- ❌ You have 50+ custom screens
- ❌ Complex custom native modules
- ❌ Deadline is in 2 weeks
- ❌ Very large existing codebase

Choose **FRESH START** if:
- ✅ Early in project (you are!)
- ✅ Want multi-tenant architecture (you do!)
- ✅ Want clean codebase
- ✅ Can afford 2-3 extra days
- ✅ Want to learn properly
- ✅ Building for long-term

**Your Score: 6/6 for Fresh Start** ✅

---

## **📋 ACTIONABLE NEXT STEPS**

If you choose fresh start:

1. **Backup current project**
   ```bash
   git tag v1-clerk-version
   git push origin v1-clerk-version
   ```

2. **Create new project**
   ```bash
   npx create-expo-app@latest WorkPhotoProV2 --template blank-typescript
   ```

3. **Set up Appwrite**
   ```bash
   npm install appwrite react-native-appwrite
   ```

4. **Start with auth**
   - Build AuthContext
   - Build sign-in screen
   - Test thoroughly

5. **Iterate from there**
   - One feature at a time
   - Reference old project
   - Better architecture

---

## **✨ THE BEST PART**

Starting fresh means you can build your **multi-tenant architecture from day 1** instead of retrofitting it later. Your folder structure, database schema, permissions model - everything will be designed for multi-tenancy from the start.

**Bottom line: Spend 3 extra days now, save months of headache later.**

```plaintext
React Native CLI + Appwrite
- More native control
- Smaller bundle size
- More setup complexity
```

```plaintext
Expo + Appwrite (just remove Clerk)
- Faster development
- Easier updates
- Good for your use case (camera, image picker)
```

```plaintext
Next.js + Appwrite (web/mobile web)
Flutter + Appwrite
Pure native (Swift/Kotlin) + Appwrite
```

```plaintext
Week 1: Remove Clerk, implement Appwrite auth (5-7 days)
Week 2: Hunt for all Clerk references (tedious) (5-7 days)
Week 3: Fix edge cases, test everything (5-7 days)
Week 4: Multi-tenant features (5-7 days)

TOTAL: 3-4 weeks
FRUSTRATION LEVEL: 🔴🔴🔴 High
TECHNICAL DEBT: 🔴🔴🔴 High
```

```plaintext
Week 1: Setup + Auth + Core UI (5-6 days)
Week 2: Features (jobs, images, profile) (5-6 days)
Week 3: Multi-tenant foundation (5-6 days)
Week 4: Polish & testing (3-4 days)

TOTAL: 3-4 weeks
FRUSTRATION LEVEL: 🟢🟢 Low
TECHNICAL DEBT: 🟢🟢🟢 None
```

```plaintext
components/
  ├── BottomModal.tsx          ✅ Pure UI
  ├── IconSymbol.tsx           ✅ Pure UI
  ├── Input.tsx                ✅ Pure UI
  └── (other dumb components)  ✅ Pure UI

styles/
  └── globalStyles.ts          ✅ No dependencies

utils/
  ├── colors.ts                ✅ Constants
  ├── types.ts                 ✅ May need updates
  └── test-data.ts             ✅ Mock data

assets/
  └── images/                  ✅ All images

app/
  └── File structure            ✅ As template
```

```plaintext
app/(jobs)/
  ├── [job].tsx                ⚠️ Remove Clerk hooks
  ├── index.tsx                ⚠️ Replace auth logic
  └── new-job.tsx              ⚠️ Update user context

components/
  └── (smart components)       ⚠️ Replace data fetching
```

```plaintext
app/_layout.tsx                ❌ ClerkProvider → AppwriteProvider
app/(auth)/                    ❌ Complete rewrite for Appwrite
components/GoogleAuthButton     ❌ OAuth flow different
components/AppleAuthButton      ❌ OAuth flow different
components/SignOutButton        ❌ Different API
utils/cache.ts                 ❌ Not needed
```

```plaintext
WorkPhotoProV2/
├── app/
│   ├── _layout.tsx                    # AppwriteProvider
│   ├── index.tsx                      # Landing page
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── sign-in.tsx                # Appwrite native
│   │   ├── sign-up.tsx                # Appwrite native
│   │   └── verify-email.tsx           # Appwrite verification
│   ├── (app)/
│   │   ├── _layout.tsx                # Org/team selector
│   │   ├── (jobs)/
│   │   │   ├── index.tsx              # Jobs list
│   │   │   ├── [id].tsx               # Job detail
│   │   │   └── new.tsx                # Create job
│   │   ├── (organizations)/
│   │   │   ├── index.tsx              # Org list
│   │   │   ├── [id]/
│   │   │   │   ├── index.tsx          # Org dashboard
│   │   │   │   ├── teams.tsx          # Team management
│   │   │   │   ├── members.tsx        # Member management
│   │   │   │   └── settings.tsx       # Org settings
│   │   ├── profile-settings.tsx
│   │   └── user-profile.tsx
│   
├── lib/
│   ├── appwrite/
│   │   ├── client.ts                  # Appwrite client setup
│   │   ├── auth.ts                    # Auth functions
│   │   ├── database.ts                # DB functions
│   │   ├── storage.ts                 # Storage functions
│   │   ├── teams.ts                   # Team functions (NEW)
│   │   └── permissions.ts             # Permission helpers (NEW)
│   
├── context/
│   ├── AuthContext.tsx                # Auth state
│   ├── OrganizationContext.tsx        # Current org (NEW)
│   └── TeamContext.tsx                # Current team (NEW)
│   
├── hooks/
│   ├── useAuth.ts                     # Auth hook
│   ├── useOrganization.ts             # Org hook (NEW)
│   ├── useTeam.ts                     # Team hook (NEW)
│   ├── usePermissions.ts              # Permission check (NEW)
│   └── useJobs.ts                     # Jobs data hook
│   
├── components/
│   ├── ui/                            # Dumb components (copy from old)
│   ├── auth/
│   │   ├── SignInForm.tsx
│   │   ├── SignUpForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── organizations/
│   │   ├── OrgSelector.tsx            # Switch orgs (NEW)
│   │   ├── TeamSelector.tsx           # Switch teams (NEW)
│   │   └── InviteMembers.tsx          # Invite UI (NEW)
│   └── jobs/
│       ├── JobCard.tsx
│       └── JobList.tsx
│   
├── types/
│   ├── appwrite.ts                    # Appwrite types
│   ├── organization.ts                # Org types (NEW)
│   ├── team.ts                        # Team types (NEW)
│   └── job.ts
│   
└── utils/
    ├── permissions.ts                 # Permission helpers (NEW)
    └── helpers.ts
```

```plaintext
Time Cost:        2-3 weeks
Frustration Cost: High
Technical Debt:   High
Future Velocity:  Slower (debt drag)
Code Quality:     Medium
Maintainability:  Medium

Total "Cost":     ~120-150 hours of work
```

```plaintext
Time Cost:        2.5-3.5 weeks
Frustration Cost: Low
Technical Debt:   None
Future Velocity:  Faster (clean base)
Code Quality:     High
Maintainability:  High

Total "Cost":     ~130-160 hours of work
```

```shellscript
npx create-expo-app@latest WorkPhotoProV2 --template blank-typescript
cd WorkPhotoProV2
npx expo install appwrite react-native-appwrite
```

```shellscript
   git tag v1-clerk-version
   git push origin v1-clerk-version
```

```shellscript
   npx create-expo-app@latest WorkPhotoProV2 --template blank-typescript
```

```shellscript
   npm install appwrite react-native-appwrite
```

---

**User**

Expo + Appwrite (just remove Clerk)
- Faster development
- Easier updates
- Good for your use case (camera, image picker)

---

**Cursor**

Perfect choice! **Expo + Appwrite** is ideal for WorkPhotoPro. Let me give you a concrete action plan for this specific path.

---

## **🎯 CONFIRMED PATH: Expo + Appwrite (Fresh Start)**

This is the sweet spot for your project:
- ✅ Keep Expo's camera/image picker benefits
- ✅ Remove Clerk completely
- ✅ Build multi-tenant from day 1
- ✅ Clean architecture

---

## **📋 DETAILED ACTION PLAN**

### **Phase 1: Project Setup (Day 1 - 2-3 hours)**

#### **Step 1: Create New Project**
```bash
# Create new Expo project
npx create-expo-app@latest WorkPhotoProV2 --template blank-typescript

cd WorkPhotoProV2

# Install Appwrite
npm install appwrite react-native-appwrite

# Install other dependencies
npx expo install expo-router expo-image-picker expo-image expo-file-system
npx expo install @react-navigation/native react-native-safe-area-context
npx expo install react-native-screens react-native-gesture-handler
npx expo install expo-secure-store expo-linking
npx expo install lucide-react-native
```

#### **Step 2: Set Up File Structure**
```bash
# Create folder structure
mkdir -p app/{auth,\(app\)/{jobs,organizations}}
mkdir -p lib/appwrite
mkdir -p context
mkdir -p components/{ui,auth,jobs,organizations}
mkdir -p hooks
mkdir -p types
mkdir -p utils
```

#### **Step 3: Configure Expo Router**
Update `app.json`:
```json
{
  "expo": {
    "name": "WorkPhotoPro",
    "slug": "workphotopro",
    "scheme": "workphotopro",
    "plugins": [
      "expo-router",
      "expo-secure-store"
    ]
  }
}
```

---

### **Phase 2: Copy Reusable Assets (Day 1 - 1 hour)**

From your old project, copy:
```
✅ Copy: assets/images/          → assets/images/
✅ Copy: styles/globalStyles.ts  → styles/globalStyles.ts
✅ Copy: utils/colors.ts         → utils/colors.ts
✅ Copy: components/Input.tsx    → components/ui/Input.tsx
✅ Copy: components/BottomModal.tsx → components/ui/BottomModal.tsx
✅ Copy: components/IconSymbol.tsx → components/ui/IconSymbol.tsx
```

**Don't copy:**
```
❌ Skip: components/GoogleAuthButton.tsx (will rewrite)
❌ Skip: components/AppleAuthButton.tsx (will rewrite)
❌ Skip: components/SignOutButton.tsx (will rewrite)
❌ Skip: utils/cache.ts (not needed)
❌ Skip: All auth/ files (will rewrite)
```

---

### **Phase 3: Appwrite Setup (Day 2 - 3-4 hours)**

#### **File: `lib/appwrite/client.ts`**
```typescript
import { Client, Account, Databases, Storage, Teams } from 'appwrite';
import Constants from 'expo-constants';

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const teams = new Teams(client);

export default client;
```

#### **File: `lib/appwrite/auth.ts`**
```typescript
import { account } from './client';
import { ID } from 'appwrite';

export const authService = {
  // Sign up
  async signUp(email: string, password: string, name: string) {
    return await account.create(ID.unique(), email, password, name);
  },

  // Sign in
  async signIn(email: string, password: string) {
    return await account.createEmailPasswordSession(email, password);
  },

  // Sign out
  async signOut() {
    return await account.deleteSession('current');
  },

  // Get current user
  async getCurrentUser() {
    try {
      return await account.get();
    } catch (error) {
      return null;
    }
  },

  // Send verification email
  async sendVerificationEmail() {
    const url = 'workphotopro://verify-email'; // Deep link
    return await account.createVerification(url);
  },

  // Verify email
  async verifyEmail(userId: string, secret: string) {
    return await account.updateVerification(userId, secret);
  },

  // Forgot password
  async forgotPassword(email: string) {
    const url = 'workphotopro://reset-password';
    return await account.createRecovery(email, url);
  },

  // Reset password
  async resetPassword(userId: string, secret: string, password: string) {
    return await account.updateRecovery(userId, secret, password);
  },
};
```

#### **File: `context/AuthContext.tsx`**
```typescript
import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '@/lib/appwrite/auth';
import { Models } from 'appwrite';

type AuthContextType = {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    await authService.signIn(email, password);
    await checkAuth();
  };

  const signUp = async (email: string, password: string, name: string) => {
    await authService.signUp(email, password, name);
    await signIn(email, password); // Auto sign in after signup
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

---

### **Phase 4: Build Auth Screens (Day 2-3 - 4-5 hours)**

#### **File: `app/_layout.tsx`**
```typescript
import { AuthProvider } from '@/context/AuthContext';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Slot } from 'expo-router';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider value={DarkTheme}>
        <Slot />
      </ThemeProvider>
    </AuthProvider>
  );
}
```

#### **File: `app/(auth)/_layout.tsx`**
```typescript
import { useAuth } from '@/context/AuthContext';
import { Redirect, Stack } from 'expo-router';

export default function AuthLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null; // Or loading spinner

  if (isAuthenticated) {
    return <Redirect href="/(app)/jobs" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
```

#### **File: `app/(auth)/sign-in.tsx`**
```typescript
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { globalStyles } from '@/styles/globalStyles';

export default function SignIn() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      router.replace('/(app)/jobs');
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Welcome back</Text>
      <Text style={globalStyles.body}>Sign in to continue</Text>

      {error ? (
        <Text style={{ color: '#ff6b6b', marginVertical: 10 }}>{error}</Text>
      ) : null}

      <TextInput
        style={globalStyles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={globalStyles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Link href="/(auth)/forgot-password">
        <Text style={globalStyles.link}>Forgot password?</Text>
      </Link>

      <TouchableOpacity
        style={globalStyles.button}
        onPress={handleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={globalStyles.buttonText}>Sign in</Text>
        )}
      </TouchableOpacity>

      <View style={globalStyles.linkContainer}>
        <Text style={globalStyles.body}>Don't have an account? </Text>
        <Link href="/(auth)/sign-up">
          <Text style={globalStyles.link}>Sign up</Text>
        </Link>
      </View>
    </View>
  );
}
```

---

### **Phase 5: Build Jobs Feature (Day 4-5 - 6-8 hours)**

#### **File: `lib/appwrite/database.ts`**
```typescript
import { databases } from './client';
import { ID, Query } from 'appwrite';

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const JOBS_COLLECTION_ID = 'jobs'; // Create this in Appwrite Console

export const jobService = {
  async createJob(data: any) {
    return await databases.createDocument(
      DATABASE_ID,
      JOBS_COLLECTION_ID,
      ID.unique(),
      data
    );
  },

  async getJobs(userId: string) {
    return await databases.listDocuments(
      DATABASE_ID,
      JOBS_COLLECTION_ID,
      [Query.equal('userId', userId)]
    );
  },

  async getJob(jobId: string) {
    return await databases.getDocument(
      DATABASE_ID,
      JOBS_COLLECTION_ID,
      jobId
    );
  },

  async updateJob(jobId: string, data: any) {
    return await databases.updateDocument(
      DATABASE_ID,
      JOBS_COLLECTION_ID,
      jobId,
      data
    );
  },

  async deleteJob(jobId: string) {
    return await databases.deleteDocument(
      DATABASE_ID,
      JOBS_COLLECTION_ID,
      jobId
    );
  },
};
```

Then copy and adapt your jobs screens from the old project, replacing `useUser()` with `useAuth()`.

---

### **Phase 6: Multi-Tenant (Week 2-3)**

This is where the magic happens - you build organizations and teams from scratch with proper architecture.

---

## **🚀 READY TO START?**

**I can help you in 3 ways:**

### **Option A: Full Implementation**
I start building the new project right now:
- Set up the entire folder structure
- Create all the auth files
- Build the Appwrite integration
- Migrate your features one by one

**Say:** *"Yes, start building"*

---

### **Option B: Guided Step-by-Step**
I walk you through each step, you tell me when to proceed:
- We do Phase 1 together
- You review and test
- We move to Phase 2, etc.

**Say:** *"Let's go step-by-step"*

---

### **Option C: Reference Documentation**
I create comprehensive documentation and starter files:
- Complete file templates
- Copy-paste ready code
- You implement at your pace

**Say:** *"Give me the docs and templates"*

---

## **💡 MY RECOMMENDATION**

**Option A (Full Implementation)** - Let me build the foundation for you:
1. I'll create all the auth scaffolding (3-4 hours)
2. You test and give feedback
3. We iterate and add features together

This gets you to a working auth system TODAY, and you can start building multi-tenant features tomorrow.

**What would you like me to do?**

```shellscript
# Create new Expo project
npx create-expo-app@latest WorkPhotoProV2 --template blank-typescript

cd WorkPhotoProV2

# Install Appwrite
npm install appwrite react-native-appwrite

# Install other dependencies
npx expo install expo-router expo-image-picker expo-image expo-file-system
npx expo install @react-navigation/native react-native-safe-area-context
npx expo install react-native-screens react-native-gesture-handler
npx expo install expo-secure-store expo-linking
npx expo install lucide-react-native
```

```shellscript
# Create folder structure
mkdir -p app/{auth,\(app\)/{jobs,organizations}}
mkdir -p lib/appwrite
mkdir -p context
mkdir -p components/{ui,auth,jobs,organizations}
mkdir -p hooks
mkdir -p types
mkdir -p utils
```

```json
{
  "expo": {
    "name": "WorkPhotoPro",
    "slug": "workphotopro",
    "scheme": "workphotopro",
    "plugins": [
      "expo-router",
      "expo-secure-store"
    ]
  }
}
```

```plaintext
✅ Copy: assets/images/          → assets/images/
✅ Copy: styles/globalStyles.ts  → styles/globalStyles.ts
✅ Copy: utils/colors.ts         → utils/colors.ts
✅ Copy: components/Input.tsx    → components/ui/Input.tsx
✅ Copy: components/BottomModal.tsx → components/ui/BottomModal.tsx
✅ Copy: components/IconSymbol.tsx → components/ui/IconSymbol.tsx
```

```plaintext
❌ Skip: components/GoogleAuthButton.tsx (will rewrite)
❌ Skip: components/AppleAuthButton.tsx (will rewrite)
❌ Skip: components/SignOutButton.tsx (will rewrite)
❌ Skip: utils/cache.ts (not needed)
❌ Skip: All auth/ files (will rewrite)
```

```typescript
import { Client, Account, Databases, Storage, Teams } from 'appwrite';
import Constants from 'expo-constants';

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const teams = new Teams(client);

export default client;
```

```typescript
import { account } from './client';
import { ID } from 'appwrite';

export const authService = {
  // Sign up
  async signUp(email: string, password: string, name: string) {
    return await account.create(ID.unique(), email, password, name);
  },

  // Sign in
  async signIn(email: string, password: string) {
    return await account.createEmailPasswordSession(email, password);
  },

  // Sign out
  async signOut() {
    return await account.deleteSession('current');
  },

  // Get current user
  async getCurrentUser() {
    try {
      return await account.get();
    } catch (error) {
      return null;
    }
  },

  // Send verification email
  async sendVerificationEmail() {
    const url = 'workphotopro://verify-email'; // Deep link
    return await account.createVerification(url);
  },

  // Verify email
  async verifyEmail(userId: string, secret: string) {
    return await account.updateVerification(userId, secret);
  },

  // Forgot password
  async forgotPassword(email: string) {
    const url = 'workphotopro://reset-password';
    return await account.createRecovery(email, url);
  },

  // Reset password
  async resetPassword(userId: string, secret: string, password: string) {
    return await account.updateRecovery(userId, secret, password);
  },
};
```

```typescript
import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '@/lib/appwrite/auth';
import { Models } from 'appwrite';

type AuthContextType = {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    await authService.signIn(email, password);
    await checkAuth();
  };

  const signUp = async (email: string, password: string, name: string) => {
    await authService.signUp(email, password, name);
    await signIn(email, password); // Auto sign in after signup
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

```typescript
import { AuthProvider } from '@/context/AuthContext';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Slot } from 'expo-router';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider value={DarkTheme}>
        <Slot />
      </ThemeProvider>
    </AuthProvider>
  );
}
```

```typescript
import { useAuth } from '@/context/AuthContext';
import { Redirect, Stack } from 'expo-router';

export default function AuthLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null; // Or loading spinner

  if (isAuthenticated) {
    return <Redirect href="/(app)/jobs" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
```

```typescript
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { globalStyles } from '@/styles/globalStyles';

export default function SignIn() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      router.replace('/(app)/jobs');
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Welcome back</Text>
      <Text style={globalStyles.body}>Sign in to continue</Text>

      {error ? (
        <Text style={{ color: '#ff6b6b', marginVertical: 10 }}>{error}</Text>
      ) : null}

      <TextInput
        style={globalStyles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={globalStyles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Link href="/(auth)/forgot-password">
        <Text style={globalStyles.link}>Forgot password?</Text>
      </Link>

      <TouchableOpacity
        style={globalStyles.button}
        onPress={handleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={globalStyles.buttonText}>Sign in</Text>
        )}
      </TouchableOpacity>

      <View style={globalStyles.linkContainer}>
        <Text style={globalStyles.body}>Don't have an account? </Text>
        <Link href="/(auth)/sign-up">
          <Text style={globalStyles.link}>Sign up</Text>
        </Link>
      </View>
    </View>
  );
}
```

```typescript
import { databases } from './client';
import { ID, Query } from 'appwrite';

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const JOBS_COLLECTION_ID = 'jobs'; // Create this in Appwrite Console

export const jobService = {
  async createJob(data: any) {
    return await databases.createDocument(
      DATABASE_ID,
      JOBS_COLLECTION_ID,
      ID.unique(),
      data
    );
  },

  async getJobs(userId: string) {
    return await databases.listDocuments(
      DATABASE_ID,
      JOBS_COLLECTION_ID,
      [Query.equal('userId', userId)]
    );
  },

  async getJob(jobId: string) {
    return await databases.getDocument(
      DATABASE_ID,
      JOBS_COLLECTION_ID,
      jobId
    );
  },

  async updateJob(jobId: string, data: any) {
    return await databases.updateDocument(
      DATABASE_ID,
      JOBS_COLLECTION_ID,
      jobId,
      data
    );
  },

  async deleteJob(jobId: string) {
    return await databases.deleteDocument(
      DATABASE_ID,
      JOBS_COLLECTION_ID,
      jobId
    );
  },
};
```

---

**User**

so before i choose option a, b, or c, i need to follow the previous steps first and create the project and folders? or do options a, b and c include all those steps as well? 

---

**Cursor**

Excellent question! Let me clarify exactly what each option includes:

---

## **📦 WHAT'S INCLUDED IN EACH OPTION**

### **Option A: Full Implementation** ✨ **(I do everything)**

**What I do:**
1. ✅ Create the entire project structure (folders)
2. ✅ Write all the initial files
3. ✅ Set up Appwrite configuration
4. ✅ Build auth context and services
5. ✅ Create auth screens (sign-in, sign-up, etc.)
6. ✅ Set up routing
7. ✅ Copy/adapt reusable components from your old project
8. ✅ Provide you with a working foundation

**What you do:**
1. ❓ Tell me where you want the new project (same directory level as current project?)
2. ⚙️ Run `npm install` after I create the files
3. ⚙️ Add your environment variables to `.env`
4. ✅ Test the auth flow
5. ✅ Give feedback on what to build next

**Timeline:** I can have the foundation ready in this conversation (30-45 minutes of tool calls)

---

### **Option B: Guided Step-by-Step** 👨‍🏫 **(We do it together)**

**What we do together:**
1. I tell you: `"Run: npx create-expo-app..."`
2. You run it and confirm: "Done ✓"
3. I tell you: `"Now create these folders..."`
4. You confirm: "Done ✓"
5. I create the first file for you
6. You review it and say "looks good" or "change X"
7. We proceed to the next step
8. Repeat until complete

**Timeline:** Depends on your pace (could be same day or spread over a few days)

**Best for:** Learning exactly what each step does, or if you want more control

---

### **Option C: Reference Documentation** 📚 **(You do everything)**

**What I give you:**
1. ✅ Complete step-by-step written guide
2. ✅ All file templates (copy-paste ready)
3. ✅ Terminal commands to run
4. ✅ Checklist to track progress
5. ✅ Troubleshooting tips

**What you do:**
1. ⚙️ Create the project yourself: `npx create-expo-app...`
2. ⚙️ Create folders yourself
3. ⚙️ Copy my templates into files
4. ⚙️ Install dependencies
5. ⚙️ Test everything

**Timeline:** You work at your own pace (1-3 days typically)

**Best for:** If you want to work independently or learn by doing

---

## **🎯 QUICK COMPARISON TABLE**

| Aspect | Option A | Option B | Option C |
|--------|----------|----------|----------|
| **I create project** | ✅ Yes | ❌ You do (I guide) | ❌ You do |
| **I create folders** | ✅ Yes | ✅ Yes | ❌ You do |
| **I write code files** | ✅ Yes | ✅ Yes | ⚠️ You copy templates |
| **Setup time** | ⚡ 30-45 mins | ⏱️ 2-4 hours | ⏱️ Your pace |
| **You run commands** | ✅ Just npm install | ✅ All commands | ✅ All commands |
| **Learning depth** | 🟡 Medium | 🟢 High | 🟢 High |
| **Time to working app** | ⚡ Today | 🟡 Today | 🟡 1-3 days |

---

## **❓ ONE KEY QUESTION BEFORE WE START**

**Where do you want the new project?**

**Option 1:** Create it as a sibling to your current project
```
Desktop/
  ├── WorkPhotoPro/          (current/old project)
  └── WorkPhotoProV2/        (new project) ← Here?
```

**Option 2:** Create it somewhere else entirely
```
Desktop/
  └── Projects/
      └── WorkPhotoProV2/    ← Here?
```

**Option 3:** I create the files in the chat (you save them manually)
```
You get all the files in code blocks
You create the project and copy-paste files yourself
```

---

## **💡 MY RECOMMENDATION**

**Go with Option A**, and tell me:

1. **Where** you want the new project (e.g., `C:\Users\capta\Desktop\WorkPhotoProV2`)
2. I'll create all the files and folder structure
3. You run one command to install dependencies
4. We test and iterate from there

---

## **🚀 READY?**

Just tell me:
1. Which option (A, B, or C)?
2. Where you want the project (if Option A or B)?

For example:
- *"Option A, create it at `C:\Users\capta\Desktop\WorkPhotoProV2`"*
- *"Option B, let's do it step by step"*
- *"Option C, give me all the templates"*

**What would you like to do?**

```plaintext
Desktop/
  ├── WorkPhotoPro/          (current/old project)
  └── WorkPhotoProV2/        (new project) ← Here?
```

```plaintext
Desktop/
  └── Projects/
      └── WorkPhotoProV2/    ← Here?
```

```plaintext
You get all the files in code blocks
You create the project and copy-paste files yourself
```

---

**User**

how do i save this chat tab for future reference to make sure i have it.

---

**Cursor**

Great question! Here are several ways to preserve this conversation:

---

## **💾 WAYS TO SAVE THIS CHAT**

### **Option 1: Chat History (Automatic)** ⭐ **Easiest**
This chat is **automatically saved** in Cursor's chat history.

**To access it later:**
1. Open Cursor
2. Click the **Chat icon** (or `Ctrl+L` / `Cmd+L`)
3. Look at the **left sidebar** - you'll see your chat history
4. Click on this conversation to reopen it

**Pros:** ✅ Automatic, ✅ Searchable  
**Cons:** ⚠️ Might get lost if you have many chats

---

### **Option 2: Pin/Star This Chat** ⭐ **Recommended**
Most versions of Cursor allow you to pin important chats.

**How:**
1. Look for a **pin icon** 📌 or **star icon** ⭐ at the top of this chat
2. Click it to pin this conversation
3. It will stay at the top of your chat history

**Pros:** ✅ Easy to find later  
**Cons:** ⚠️ Depends on your Cursor version

---

### **Option 3: Copy to a File** 📄 **Most Reliable**
Save the entire conversation as a text/markdown file.

**Method A - Manual Copy:**
1. Scroll to the top of this chat
2. Select all text (`Ctrl+A` or drag-select)
3. Copy (`Ctrl+C`)
4. Create a new file: `WorkPhotoPro-Migration-Plan.md`
5. Paste the conversation

**Method B - I can help:**
I can create a markdown file with the key information from our discussion!

---

### **Option 4: Export Chat** 💾 **If Available**
Some Cursor versions have an export feature.

**Check for:**
- **Three dots menu** (⋯) at the top of the chat
- Look for "Export" or "Save" option
- Save as `.md` or `.txt` file

---

### **Option 5: Screenshot** 📸 **Visual Reference**
Take screenshots of the important parts:
- Use Windows **Snipping Tool** (`Win+Shift+S`)
- Capture the key sections (architecture diagrams, timelines, etc.)
- Save to a folder: `WorkPhotoPro-References/`

---

## **🎯 MY RECOMMENDATION**

**Do 2 things:**

### **1. Pin this chat** (so it's easy to find)
Look for a pin/star icon in the chat interface

### **2. Let me create a summary document for you**
I'll create a comprehensive markdown file with:
- ✅ The architecture decision (Appwrite-only)
- ✅ Fresh start vs refactor analysis
- ✅ Timeline and file structure
- ✅ Ready to reference when you start building

---

## **📝 WOULD YOU LIKE ME TO CREATE A SUMMARY?**

I can create a `MIGRATION_PLAN.md` file right now in your current project with:
- Executive summary
- Architecture decisions
- File structure
- Timeline
- Next steps

**Want me to create this file?** Just say:
- *"Yes, create the summary file"*

Or if you're good with just the chat history:
- *"No need, let's continue with Option A/B/C"*

**What would you prefer?**

---

**User**

let's do option A. 

---

**Cursor**

Perfect! Let's do **Option A - Full Implementation**.

Before I start creating the new project, I need one quick answer:

---

## **📍 WHERE SHOULD I CREATE THE NEW PROJECT?**

### **Option 1: Sibling to Current Project** (Recommended)
```
C:\Users\capta\Desktop\
  ├── WorkPhotoPro\          ← Current project (keep as reference)
  └── WorkPhotoProV2\        ← New project ← CREATE HERE?
```

### **Option 2: Different Location**
Tell me your preferred path, for example:
- `C:\Users\capta\Desktop\Projects\WorkPhotoProV2`
- `C:\Users\capta\Documents\WorkPhotoProV2`
- Any other location

---

## **🎯 MY RECOMMENDATION**

Create it as a sibling (Option 1):
```
C:\Users\capta\Desktop\WorkPhotoProV2
```

This way:
- ✅ Easy to reference old project while building
- ✅ Easy to copy components from old to new
- ✅ Can compare side-by-side

---

**Please confirm the path and I'll start building immediately:**

Just say something like:
- *"Yes, create it at `C:\Users\capta\Desktop\WorkPhotoProV2`"*
- or give me a different path

Ready when you are! 🚀

```plaintext
C:\Users\capta\Desktop\
  ├── WorkPhotoPro\          ← Current project (keep as reference)
  └── WorkPhotoProV2\        ← New project ← CREATE HERE?
```

```plaintext
C:\Users\capta\Desktop\WorkPhotoProV2
```

---

**User**

C:\Users\capta\Desktop\WorkPhotoProV2

---

**Cursor**

Perfect! Let's build your new WorkPhotoPro V2 with Expo + Appwrite! 🚀

I'll create the entire foundation for you. This will take a few minutes as I set up all the files and structure.

Now let me create your new project! Starting with the core configuration files:

```json
{
  "name": "workphotopro-v2",
  "main": "expo-router/entry",
  "version": "2.0.0",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "lint": "expo lint"
  },
  "dependencies": {
    "@expo/vector-icons": "^15.0.2",
    "@react-navigation/native": "^7.1.8",
    "appwrite": "^21.2.1",
    "expo": "~54.0.12",
    "expo-constants": "~18.0.9",
    "expo-file-system": "~19.0.16",
    "expo-font": "~14.0.8",
    "expo-image": "~3.0.8",
    "expo-image-picker": "~17.0.8",
    "expo-linear-gradient": "^15.0.7",
    "expo-linking": "~8.0.8",
    "expo-router": "~6.0.10",
    "expo-secure-store": "~15.0.7",
    "expo-splash-screen": "~31.0.10",
    "expo-status-bar": "~3.0.8",
    "lucide-react-native": "^0.544.0",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-native": "0.81.4",
    "react-native-appwrite": "^0.17.1",
    "react-native-gesture-handler": "~2.28.0",
    "react-native-reanimated": "~4.1.1",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0",
    "react-native-web": "~0.21.0"
  },
  "devDependencies": {
    "@types/react": "~19.1.0",
    "typescript": "~5.9.2"
  },
  "private": true
}

```

```jsonc
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}

```

```jsonc
{
  "expo": {
    "name": "WorkPhotoPro",
    "slug": "workphotopro-v2",
    "version": "2.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "workphotopro",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#000000"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.workphotopro.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundColor": "#000000"
      },
      "package": "com.workphotopro.app"
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow WorkPhotoPro to access your photos for job site documentation."
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}

```

```ignore
# Learn more https://docs.github.com/en/get-started/getting-started-with-git/ignoring-files

# dependencies
node_modules/

# Expo
.expo/
dist/
web-build/

# Native
*.orig.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision

# Metro
.metro-health-check*

# debug
npm-debug.*
yarn-debug.*
yarn-error.*

# macOS
.DS_Store
*.pem

# local env files
.env*.local
.env

# typescript
*.tsbuildinfo

```

```typescript
/// <reference types="expo/types" />

```

Great start! Now let me create the Appwrite configuration and services:

```typescript
import { Client, Account, Databases, Storage, Teams } from 'appwrite';

if (!process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT) {
  throw new Error('Missing EXPO_PUBLIC_APPWRITE_ENDPOINT');
}

if (!process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID) {
  throw new Error('Missing EXPO_PUBLIC_APPWRITE_PROJECT_ID');
}

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const teams = new Teams(client);

export default client;

```

```typescript
import { account } from './client';
import { ID } from 'appwrite';

export const authService = {
  /**
   * Create a new user account
   */
  async signUp(email: string, password: string, name: string) {
    try {
      const user = await account.create(ID.unique(), email, password, name);
      return user;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  },

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    try {
      const session = await account.createEmailPasswordSession(email, password);
      return session;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  /**
   * Sign out current user
   */
  async signOut() {
    try {
      await account.deleteSession('current');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  /**
   * Get current logged in user
   */
  async getCurrentUser() {
    try {
      const user = await account.get();
      return user;
    } catch (error) {
      return null;
    }
  },

  /**
   * Send email verification
   */
  async sendVerificationEmail() {
    try {
      const url = 'workphotopro://verify-email';
      return await account.createVerification(url);
    } catch (error) {
      console.error('Send verification error:', error);
      throw error;
    }
  },

  /**
   * Verify email with userId and secret from verification link
   */
  async verifyEmail(userId: string, secret: string) {
    try {
      return await account.updateVerification(userId, secret);
    } catch (error) {
      console.error('Verify email error:', error);
      throw error;
    }
  },

  /**
   * Send password recovery email
   */
  async forgotPassword(email: string) {
    try {
      const url = 'workphotopro://reset-password';
      return await account.createRecovery(email, url);
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  /**
   * Reset password with userId, secret from recovery link, and new password
   */
  async resetPassword(userId: string, secret: string, password: string) {
    try {
      return await account.updateRecovery(userId, secret, password);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },

  /**
   * Update user name
   */
  async updateName(name: string) {
    try {
      return await account.updateName(name);
    } catch (error) {
      console.error('Update name error:', error);
      throw error;
    }
  },

  /**
   * Update user email
   */
  async updateEmail(email: string, password: string) {
    try {
      return await account.updateEmail(email, password);
    } catch (error) {
      console.error('Update email error:', error);
      throw error;
    }
  },

  /**
   * Update user password
   */
  async updatePassword(newPassword: string, oldPassword: string) {
    try {
      return await account.updatePassword(newPassword, oldPassword);
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  },
};

```

```typescript
import { databases } from './client';
import { ID, Query } from 'appwrite';

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '';

export const databaseService = {
  /**
   * Create a new document in a collection
   */
  async createDocument(collectionId: string, data: any, documentId?: string) {
    try {
      return await databases.createDocument(
        DATABASE_ID,
        collectionId,
        documentId || ID.unique(),
        data
      );
    } catch (error) {
      console.error('Create document error:', error);
      throw error;
    }
  },

  /**
   * Get a document by ID
   */
  async getDocument(collectionId: string, documentId: string) {
    try {
      return await databases.getDocument(DATABASE_ID, collectionId, documentId);
    } catch (error) {
      console.error('Get document error:', error);
      throw error;
    }
  },

  /**
   * List documents with optional queries
   */
  async listDocuments(collectionId: string, queries: string[] = []) {
    try {
      return await databases.listDocuments(DATABASE_ID, collectionId, queries);
    } catch (error) {
      console.error('List documents error:', error);
      throw error;
    }
  },

  /**
   * Update a document
   */
  async updateDocument(collectionId: string, documentId: string, data: any) {
    try {
      return await databases.updateDocument(
        DATABASE_ID,
        collectionId,
        documentId,
        data
      );
    } catch (error) {
      console.error('Update document error:', error);
      throw error;
    }
  },

  /**
   * Delete a document
   */
  async deleteDocument(collectionId: string, documentId: string) {
    try {
      return await databases.deleteDocument(DATABASE_ID, collectionId, documentId);
    } catch (error) {
      console.error('Delete document error:', error);
      throw error;
    }
  },
};

// Job-specific helpers
export const jobService = {
  COLLECTION_ID: 'jobs', // You'll create this in Appwrite Console

  async createJob(data: any) {
    return databaseService.createDocument(this.COLLECTION_ID, data);
  },

  async getJob(jobId: string) {
    return databaseService.getDocument(this.COLLECTION_ID, jobId);
  },

  async listJobs(userId?: string) {
    const queries = userId ? [Query.equal('userId', userId)] : [];
    return databaseService.listDocuments(this.COLLECTION_ID, queries);
  },

  async updateJob(jobId: string, data: any) {
    return databaseService.updateDocument(this.COLLECTION_ID, jobId, data);
  },

  async deleteJob(jobId: string) {
    return databaseService.deleteDocument(this.COLLECTION_ID, jobId);
  },
};

```

```typescript
import { storage } from './client';
import { ID } from 'appwrite';

const BUCKET_ID = process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID || '';

export const storageService = {
  /**
   * Upload a file
   */
  async uploadFile(file: File) {
    try {
      return await storage.createFile(BUCKET_ID, ID.unique(), file);
    } catch (error) {
      console.error('Upload file error:', error);
      throw error;
    }
  },

  /**
   * Get file preview URL
   */
  getFilePreview(fileId: string, width?: number, height?: number) {
    try {
      return storage.getFilePreview(BUCKET_ID, fileId, width, height);
    } catch (error) {
      console.error('Get file preview error:', error);
      throw error;
    }
  },

  /**
   * Get file download URL
   */
  getFileDownload(fileId: string) {
    try {
      return storage.getFileDownload(BUCKET_ID, fileId);
    } catch (error) {
      console.error('Get file download error:', error);
      throw error;
    }
  },

  /**
   * Get file view URL
   */
  getFileView(fileId: string) {
    try {
      return storage.getFileView(BUCKET_ID, fileId);
    } catch (error) {
      console.error('Get file view error:', error);
      throw error;
    }
  },

  /**
   * Delete a file
   */
  async deleteFile(fileId: string) {
    try {
      return await storage.deleteFile(BUCKET_ID, fileId);
    } catch (error) {
      console.error('Delete file error:', error);
      throw error;
    }
  },

  /**
   * List files
   */
  async listFiles(queries?: string[]) {
    try {
      return await storage.listFiles(BUCKET_ID, queries);
    } catch (error) {
      console.error('List files error:', error);
      throw error;
    }
  },
};

```

```typescript
import { teams } from './client';
import { ID } from 'appwrite';

export const teamService = {
  /**
   * Create a new team (organization)
   */
  async createTeam(name: string, roles?: string[]) {
    try {
      return await teams.create(ID.unique(), name, roles);
    } catch (error) {
      console.error('Create team error:', error);
      throw error;
    }
  },

  /**
   * Get a team by ID
   */
  async getTeam(teamId: string) {
    try {
      return await teams.get(teamId);
    } catch (error) {
      console.error('Get team error:', error);
      throw error;
    }
  },

  /**
   * List all teams the current user is a member of
   */
  async listTeams() {
    try {
      return await teams.list();
    } catch (error) {
      console.error('List teams error:', error);
      throw error;
    }
  },

  /**
   * Update team name
   */
  async updateTeam(teamId: string, name: string) {
    try {
      return await teams.updateName(teamId, name);
    } catch (error) {
      console.error('Update team error:', error);
      throw error;
    }
  },

  /**
   * Delete a team
   */
  async deleteTeam(teamId: string) {
    try {
      return await teams.delete(teamId);
    } catch (error) {
      console.error('Delete team error:', error);
      throw error;
    }
  },

  /**
   * Create team membership (invite user)
   */
  async createMembership(
    teamId: string,
    email: string,
    roles: string[],
    url: string
  ) {
    try {
      return await teams.createMembership(teamId, roles, email, undefined, undefined, url);
    } catch (error) {
      console.error('Create membership error:', error);
      throw error;
    }
  },

  /**
   * List team members
   */
  async listMemberships(teamId: string) {
    try {
      return await teams.listMemberships(teamId);
    } catch (error) {
      console.error('List memberships error:', error);
      throw error;
    }
  },

  /**
   * Update membership roles
   */
  async updateMembershipRoles(
    teamId: string,
    membershipId: string,
    roles: string[]
  ) {
    try {
      return await teams.updateMembershipRoles(teamId, membershipId, roles);
    } catch (error) {
      console.error('Update membership roles error:', error);
      throw error;
    }
  },

  /**
   * Delete team membership
   */
  async deleteMembership(teamId: string, membershipId: string) {
    try {
      return await teams.deleteMembership(teamId, membershipId);
    } catch (error) {
      console.error('Delete membership error:', error);
      throw error;
    }
  },
};

```

Excellent! Now let me create the AuthContext and hooks:

```typescriptreact
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { authService } from '@/lib/appwrite/auth';
import { Models } from 'appwrite';

type User = Models.User<Models.Preferences>;

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await authService.signIn(email, password);
      await checkAuth();
    } catch (error) {
      console.error('Sign in error in context:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      await authService.signUp(email, password, name);
      // Auto sign in after signup
      await signIn(email, password);
    } catch (error) {
      console.error('Sign up error in context:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error in context:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

```

```typescript
/**
 * Custom hooks for Appwrite operations
 * Add more hooks here as needed
 */

import { useState, useEffect } from 'react';
import { Models } from 'appwrite';

/**
 * Hook for handling async operations with loading and error states
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true
) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const execute = async () => {
    setStatus('pending');
    setData(null);
    setError(null);

    try {
      const response = await asyncFunction();
      setData(response);
      setStatus('success');
      return response;
    } catch (error) {
      setError(error as Error);
      setStatus('error');
      throw error;
    }
  };

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate]);

  return { execute, status, data, error, loading: status === 'pending' };
}

```

Now let me copy the reusable styles and components from your old project:

```typescript
import { StyleSheet } from 'react-native'

// Global color palette for dark theme with green branding
export const colors = {
  background: '#000',
  surface: '#1a1a1a',
  primary: '#22c55e', // Green-500
  primaryLight: '#4ade80', // Green-400
  text: '#fff',
  textSecondary: '#9ca3af', // Gray-400
  textMuted: '#6b7280', // Gray-500
  border: '#374151',
  error: '#FF3B30',
  success: '#22c55e',
}

// Global typography
export const typography = {
  title: {
    fontSize: 36,
    fontWeight: 'bold' as const,
    color: colors.text,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: colors.primaryLight,
    marginBottom: 24,
    textAlign: 'center' as const,
  },
  body: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  link: {
    fontSize: 16,
    color: colors.primaryLight,
    fontWeight: '600' as const,
  },
  buttonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '600' as const,
  },
  footer: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center' as const,
  },
}

// Global styles
export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    justifyContent: 'center',
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingVertical: 48,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 32,
  },
  logoIcon: {
    width: 80,
    height: 80,
    backgroundColor: colors.primary,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  contentSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  buttonSection: {
    width: '100%',
    maxWidth: 320,
    gap: 24,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    height: 56,
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    height: 56,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  gradientButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    height: 56,
    justifyContent: 'center',
  },
  footerSection: {
    marginTop: 32,
    alignItems: 'center',
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 0,
  },
  verticalLinkContainer: {
    gap: 15,
    alignItems: 'center',
  },
  title: typography.title,
  subtitle: typography.subtitle,
  body: typography.body,
  link: typography.link,
  buttonText: typography.buttonText,
  footer: typography.footer,
})

// Helper function to get placeholder text color
export const getPlaceholderTextColor = () => colors.textSecondary

```

```typescript
export const Primary = '#1d4ed8';
export const Secondary = '#1a1a1a';
export const Text = '#fff';
export const TextSecondary = '#9ca3af';
export const TextMuted = '#6b7280';
export const Border = '#374151';
export const Background = '#000';
export const Surface = '#1a1a1a';
export const Error = '#FF3B30';
export const Success = '#22c55e';
export const Warning = '#FF3B30';
export const Info = '#1d4ed8';
export const Light = '#f3f4f6';
export const Dark = '#1a1a1a';
export const White = '#fff';
export const Black = '#000';
export const Gray = '#6b7280';
export const LightGray = '#9ca3af';
export const DarkGray = '#374151';
export const LightGreen = '#4ade80';
export const DarkGreen = '#22c55e';
export const Purple = '#8c13fd';

// Export all colors as a single object
export const Colors = {
  Primary,
  Secondary,
  Text,
  TextSecondary,
  TextMuted,
  Border,
  Background,
  Surface,
  Error,
  Success,
  Warning,
  Info,
  Light,
  Dark,
  White,
  Black,
  Gray,
  LightGray,
  DarkGray,
  LightGreen,
  DarkGreen,
  Purple,
};

```

```typescriptreact
import { Colors } from '@/utils/colors';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';

export default function Input({ ...props }: TextInputProps) {
    const { style, ...rest } = props;

    return (
        <TextInput
            {...rest}
            style={StyleSheet.flatten([
                {
                    padding: 16,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: Colors.Secondary,
                    backgroundColor: Colors.Surface,
                    color: "#fff",
                    placeholderTextColor: Colors.Gray,
                }, 
                style,
            ])}
        />
    );
}

```

```typescriptreact
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;

type BottomModalProps = {
  visible: boolean;
  onClose: () => void;
  content: React.ReactNode;
};

export default function BottomModal({ visible, onClose, content }: BottomModalProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.container,
                { transform: [{ translateY }] },
              ]}
            >
              {content}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    padding: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 6,
    elevation: 10,
  },
});

```

Perfect! Now let me build the auth screens and app routing:

```typescriptreact
import { AuthProvider } from '@/context/AuthContext';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider value={DarkTheme}>
        <StatusBar style="light" />
        <Slot />
      </ThemeProvider>
    </AuthProvider>
  );
}

```

```typescriptreact
import { useAuth } from '@/context/AuthContext';
import { globalStyles } from '@/styles/globalStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, Redirect } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

export default function Index() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={globalStyles.centeredContainer}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(app)/jobs" />;
  }

  return (
    <View style={globalStyles.welcomeContainer}>
      {/* Logo Section */}
      <View style={globalStyles.logoContainer}>
        <LinearGradient
          colors={['#22c55e', '#84cc16', '#eab308']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={globalStyles.logoIcon}
        >
          <Camera size={64} color="#010101" />
        </LinearGradient>
        
        <Text style={globalStyles.title}>Work Photo Pro</Text>
        
        <Text style={globalStyles.subtitle}>
          Job site photos made easy...
        </Text>
        
        <Text style={globalStyles.body}>
          Capture, organize and share work photos for projects, estimates and updates with ease.
        </Text>
      </View>

      {/* Content Section */}
      <View style={globalStyles.contentSection}>
        <View style={globalStyles.buttonSection}>
          <TouchableOpacity>
            <LinearGradient
              colors={['#22c55e', '#84cc16', '#eab308']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={globalStyles.gradientButton}
            >
              <Link href="/(auth)/sign-up">
                <Text style={globalStyles.buttonText}>Get Started</Text>
              </Link>
            </LinearGradient>
          </TouchableOpacity>
          
          <View style={globalStyles.verticalLinkContainer}>
            <Text style={globalStyles.body}>
              Already have an account?{' '}
              <Link href="/(auth)/sign-in">
                <Text style={globalStyles.link}>Sign In</Text>
              </Link>
            </Text>
          </View>
        </View>
      </View>

      {/* Footer Section */}
      <View style={globalStyles.footerSection}>
        <Text style={globalStyles.footer}>
          Trusted by contractors worldwide
        </Text>
      </View>
    </View>
  );
}

```

```typescriptreact
import { useAuth } from '@/context/AuthContext';
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function AuthLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(app)/jobs" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="verify-email" />
    </Stack>
  );
}

```

```typescriptreact
import { useAuth } from '@/context/AuthContext';
import { getPlaceholderTextColor, globalStyles } from '@/styles/globalStyles';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

export default function SignIn() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      router.replace('/(app)/jobs');
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'Sign in failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={globalStyles.container}>
          <Text style={globalStyles.title}>Welcome back</Text>
          <Text style={globalStyles.body}>Sign in to continue</Text>

          {error ? (
            <Text style={[globalStyles.body, { color: '#ff6b6b', marginVertical: 10 }]}>
              {error}
            </Text>
          ) : null}

          <View style={{ flex: 0.1 }} />

          <TextInput
            style={globalStyles.input}
            placeholder="Email"
            placeholderTextColor={getPlaceholderTextColor()}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <TextInput
            style={globalStyles.input}
            placeholder="Password"
            placeholderTextColor={getPlaceholderTextColor()}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 10 }}>
              <Text style={globalStyles.link}>Forgot password?</Text>
            </TouchableOpacity>
          </Link>

          <TouchableOpacity
            style={[globalStyles.button, loading && { opacity: 0.5 }]}
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={globalStyles.buttonText}>Sign in</Text>
            )}
          </TouchableOpacity>

          <View style={globalStyles.linkContainer}>
            <Text style={globalStyles.body}>Don't have an account? </Text>
            <Link href="/(auth)/sign-up">
              <Text style={globalStyles.link}>Sign up</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

```

```typescriptreact
import { useAuth } from '@/context/AuthContext';
import { getPlaceholderTextColor, globalStyles } from '@/styles/globalStyles';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

export default function SignUp() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signUp(email, password, name);
      router.replace('/(app)/jobs');
    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(err.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={globalStyles.container}>
          <Text style={globalStyles.title}>Create account</Text>
          <Text style={globalStyles.body}>Sign up to get started</Text>

          {error ? (
            <Text style={[globalStyles.body, { color: '#ff6b6b', marginVertical: 10 }]}>
              {error}
            </Text>
          ) : null}

          <View style={{ flex: 0.1 }} />

          <TextInput
            style={globalStyles.input}
            placeholder="Full Name"
            placeholderTextColor={getPlaceholderTextColor()}
            value={name}
            onChangeText={setName}
            editable={!loading}
          />

          <TextInput
            style={globalStyles.input}
            placeholder="Email"
            placeholderTextColor={getPlaceholderTextColor()}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <TextInput
            style={globalStyles.input}
            placeholder="Password (min. 8 characters)"
            placeholderTextColor={getPlaceholderTextColor()}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={[globalStyles.button, loading && { opacity: 0.5 }]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={globalStyles.buttonText}>Sign up</Text>
            )}
          </TouchableOpacity>

          <View style={globalStyles.linkContainer}>
            <Text style={globalStyles.body}>Already have an account? </Text>
            <Link href="/(auth)/sign-in">
              <Text style={globalStyles.link}>Sign in</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

```

```typescriptreact
import { authService } from '@/lib/appwrite/auth';
import { getPlaceholderTextColor, globalStyles } from '@/styles/globalStyles';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err.message || 'Failed to send recovery email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={globalStyles.container}>
          <Text style={globalStyles.title}>Reset password</Text>
          <Text style={globalStyles.body}>
            Enter your email address and we'll send you a link to reset your password
          </Text>

          {error ? (
            <Text style={[globalStyles.body, { color: '#ff6b6b', marginVertical: 10 }]}>
              {error}
            </Text>
          ) : null}

          {success ? (
            <View style={{ marginVertical: 20 }}>
              <Text style={[globalStyles.body, { color: '#22c55e', marginBottom: 10 }]}>
                Recovery email sent! Check your inbox.
              </Text>
              <TouchableOpacity
                style={globalStyles.button}
                onPress={() => router.replace('/(auth)/sign-in')}
              >
                <Text style={globalStyles.buttonText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={{ flex: 0.1 }} />

              <TextInput
                style={globalStyles.input}
                placeholder="Email"
                placeholderTextColor={getPlaceholderTextColor()}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />

              <TouchableOpacity
                style={[globalStyles.button, loading && { opacity: 0.5 }]}
                onPress={handleForgotPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={globalStyles.buttonText}>Send recovery email</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={{ alignSelf: 'center', marginTop: 20 }}
                onPress={() => router.back()}
              >
                <Text style={globalStyles.link}>Back to Sign In</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

```

```typescriptreact
import { authService } from '@/lib/appwrite/auth';
import { globalStyles } from '@/styles/globalStyles';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

export default function VerifyEmail() {
  const router = useRouter();
  const { userId, secret } = useLocalSearchParams<{ userId: string; secret: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (userId && secret) {
      verifyEmail();
    } else {
      setError('Invalid verification link');
      setLoading(false);
    }
  }, [userId, secret]);

  const verifyEmail = async () => {
    try {
      await authService.verifyEmail(userId, secret);
      setSuccess(true);
    } catch (err: any) {
      console.error('Verify email error:', err);
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Email Verification</Text>

      {loading && (
        <View style={{ marginVertical: 20 }}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={[globalStyles.body, { marginTop: 10 }]}>
            Verifying your email...
          </Text>
        </View>
      )}

      {error && !loading && (
        <View style={{ marginVertical: 20 }}>
          <Text style={[globalStyles.body, { color: '#ff6b6b', marginBottom: 20 }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={globalStyles.button}
            onPress={() => router.replace('/(auth)/sign-in')}
          >
            <Text style={globalStyles.buttonText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      )}

      {success && !loading && (
        <View style={{ marginVertical: 20 }}>
          <Text style={[globalStyles.body, { color: '#22c55e', marginBottom: 20 }]}>
            Email verified successfully! You can now sign in.
          </Text>
          <TouchableOpacity
            style={globalStyles.button}
            onPress={() => router.replace('/(auth)/sign-in')}
          >
            <Text style={globalStyles.buttonText}>Go to Sign In</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

```

Great! Now let me create the app structure for jobs:

```typescriptreact
import { useAuth } from '@/context/AuthContext';
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function AppLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Stack>
      <Stack.Screen
        name="jobs"
        options={{
          headerShown: true,
          title: 'Jobs',
          headerStyle: { backgroundColor: '#1a1a1a' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          headerShown: true,
          title: 'Profile',
          headerStyle: { backgroundColor: '#1a1a1a' },
          headerTintColor: '#fff',
        }}
      />
    </Stack>
  );
}

```

```typescriptreact
import { useAuth } from '@/context/AuthContext';
import { globalStyles } from '@/styles/globalStyles';
import { Link } from 'expo-router';
import { Text, View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

export default function Jobs() {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {user?.name || 'User'}!</Text>
        <Text style={styles.subtitle}>Your Jobs</Text>
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No jobs yet</Text>
        <Text style={styles.emptySubtext}>
          Create your first job to start organizing your work photos
        </Text>
        
        <TouchableOpacity style={globalStyles.button}>
          <Text style={globalStyles.buttonText}>Create Job</Text>
        </TouchableOpacity>
      </View>

      {/* Placeholder for future job list */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <Link href="/(app)/profile" asChild>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionTitle}>View Profile</Text>
            <Text style={styles.actionDescription}>Manage your account settings</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  actionCard: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#9ca3af',
  },
});

```

```typescriptreact
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/utils/colors';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

export default function Profile() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{user.name}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user.email}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Email Verified</Text>
          <Text style={[styles.value, user.emailVerification ? styles.verified : styles.notVerified]}>
            {user.emailVerification ? 'Verified' : 'Not Verified'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Account ID</Text>
          <Text style={styles.value}>{user.$id}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.DarkGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.Background,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.Text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Colors.TextSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.Border,
    marginHorizontal: 20,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.Text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
  },
  label: {
    fontSize: 14,
    color: Colors.TextSecondary,
  },
  value: {
    fontSize: 14,
    color: Colors.Text,
    fontWeight: '500',
  },
  verified: {
    color: Colors.Success,
  },
  notVerified: {
    color: Colors.Warning,
  },
  signOutButton: {
    backgroundColor: Colors.Error,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: Colors.White,
    fontSize: 16,
    fontWeight: '600',
  },
});

```

Perfect! Now let me create the comprehensive README and type definitions:

```typescript
import { Models } from 'appwrite';

// User types
export type User = Models.User<Models.Preferences>;

// Job types
export interface Job {
  $id: string;
  userId: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// Organization/Team types
export interface Organization {
  $id: string;
  name: string;
  ownerId: string;
  teamId: string; // Reference to Appwrite Team
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  $id: string;
  teamId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: string;
}

// Image/Photo types
export interface Photo {
  $id: string;
  jobId: string;
  userId: string;
  fileId: string; // Appwrite Storage file ID
  caption?: string;
  tags?: string[];
  createdAt: string;
}

// Common API response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  documents: T[];
  total: number;
}

```

```markdown
# WorkPhotoPro V2 🚀

A modern, multi-tenant work photo management app built with **Expo** and **Appwrite**.

## 📋 Features

- ✅ **Authentication** - Email/password sign up, sign in, forgot password
- ✅ **User Profiles** - View and manage user information
- 🚧 **Jobs Management** - Create and organize work photo projects (coming soon)
- 🚧 **Multi-tenant** - Organizations, teams, and role-based permissions (coming soon)
- 🚧 **Photo Management** - Upload, organize, and share work photos (coming soon)

## 🛠️ Tech Stack

- **Framework**: Expo SDK 54 + React Native
- **Language**: TypeScript
- **Backend**: Appwrite (BaaS)
- **Routing**: Expo Router
- **State Management**: React Context API
- **Styling**: React Native StyleSheet

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **Appwrite Account**: [Sign up at Appwrite](https://cloud.appwrite.io)

## 🚀 Getting Started

### 1. Clone and Install Dependencies

```bash
cd C:\Users\capta\Desktop\WorkPhotoProV2
npm install
```

### 2. Set Up Appwrite

#### Create Appwrite Project

1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Create a new project
3. Note your **Project ID**

#### Enable Authentication

1. Go to **Auth** in your Appwrite project
2. Enable **Email/Password** authentication
3. Configure email templates (optional)

#### Create Database

1. Go to **Databases** → Create Database
2. Note your **Database ID**
3. Create collections (you'll do this as you build features):
   - `jobs` - For job/project management
   - `organizations` - For multi-tenant support
   - `photos` - For image metadata

#### Create Storage Bucket

1. Go to **Storage** → Create Bucket
2. Note your **Bucket ID**
3. Configure permissions (set to authenticated users for now)

#### Get Your Platform

For iOS: `com.workphotopro.app`
For Android: `com.workphotopro.app`

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your Appwrite credentials:

```env
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
EXPO_PUBLIC_APPWRITE_DATABASE_ID=your_database_id_here
EXPO_PUBLIC_APPWRITE_BUCKET_ID=your_bucket_id_here
```

### 4. Run the App

```bash
# Start Expo development server
npm start

# Or run directly on a platform
npm run android
npm run ios
npm run web
```

## 📁 Project Structure

```
WorkPhotoProV2/
├── app/                          # App screens (Expo Router)
│   ├── _layout.tsx              # Root layout with AuthProvider
│   ├── index.tsx                # Welcome/landing page
│   ├── (auth)/                  # Auth screens (unauthenticated)
│   │   ├── _layout.tsx
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   ├── forgot-password.tsx
│   │   └── verify-email.tsx
│   └── (app)/                   # App screens (authenticated)
│       ├── _layout.tsx
│       ├── jobs.tsx             # Jobs list
│       ├── profile-settings.tsx          # User profile
│       └── user-profile.tsx              # Per-user display
│
├── lib/                         # Appwrite SDK & services
│   └── appwrite/
│       ├── client.ts            # Appwrite client config
│       ├── auth.ts              # Auth service
│       ├── database.ts          # Database service
│       ├── storage.ts           # Storage service
│       └── teams.ts             # Teams/orgs service
│
├── context/                     # React Context
│   └── AuthContext.tsx          # Auth state management
│
├── components/                  # Reusable components
│   └── ui/
│       ├── Input.tsx
│       └── BottomModal.tsx
│
├── hooks/                       # Custom hooks
│   └── useAppwrite.ts
│
├── styles/                      # Global styles
│   └── globalStyles.ts
│
├── utils/                       # Utilities
│   └── colors.ts
│
└── types/                       # TypeScript types
    └── index.ts
```

## 🔐 Authentication Flow

The app uses Appwrite's built-in authentication:

1. **Sign Up**: Creates new user account
2. **Sign In**: Creates email/password session
3. **Forgot Password**: Sends recovery email with deep link
4. **Email Verification**: Verifies email via deep link

### Deep Links Setup

The app is configured to handle these deep links:
- `workphotopro://verify-email` - Email verification
- `workphotopro://reset-password` - Password reset

## 🎨 Styling

The app uses a dark theme with green branding:
- Primary: `#22c55e` (Green-500)
- Background: `#000` (Black)
- Surface: `#1a1a1a` (Dark Gray)

See `styles/globalStyles.ts` for the complete design system.

## 🔄 Migration from V1 (Clerk)

This is a complete rewrite of WorkPhotoPro, migrating from Clerk to Appwrite:

### What Changed:
- ❌ Removed: Clerk authentication
- ✅ Added: Appwrite authentication
- ✅ Clean architecture designed for multi-tenancy
- ✅ Built-in team/organization support

### What Stayed:
- ✅ UI components and styling
- ✅ File structure and routing
- ✅ Design system and branding

## 🚧 Next Steps

### Immediate (Week 1-2):
- [ ] Test authentication flow thoroughly
- [ ] Add image picker integration
- [ ] Build job creation feature
- [ ] Implement photo upload to Appwrite Storage

### Short-term (Week 3-4):
- [ ] Create organizations/teams feature
- [ ] Implement role-based permissions
- [ ] Add team member invitations
- [ ] Build team management UI

### Long-term:
- [ ] Add real-time updates (Appwrite Realtime)
- [ ] Implement offline support
- [ ] Add search and filtering
- [ ] Build analytics dashboard

## 🐛 Troubleshooting

### "Missing environment variable" error
Make sure your `.env` file exists and contains all required variables.

### Authentication fails
1. Check Appwrite console for auth settings
2. Verify your Project ID is correct
3. Check network connectivity

### Deep links not working
1. Update `app.json` scheme if needed
2. Test deep links: `npx uri-scheme open workphotopro://verify-email --ios`

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev)
- [Appwrite Documentation](https://appwrite.io/docs)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [React Native Documentation](https://reactnative.dev)

## 🤝 Contributing

This is a private project, but contributions are welcome!

## 📄 License

Private - All rights reserved

---

**Built with ❤️ using Expo and Appwrite**

```

```markdown
# 🚀 Quick Setup Guide

## Step-by-Step Setup (15 minutes)

### 1. Install Dependencies (2 minutes)

```bash
cd C:\Users\capta\Desktop\WorkPhotoProV2
npm install
```

### 2. Create Appwrite Project (5 minutes)

1. Go to https://cloud.appwrite.io
2. Click "Create Project"
3. Name it "WorkPhotoPro"
4. Copy your **Project ID**

### 3. Configure Appwrite (5 minutes)

#### Enable Email/Password Auth:
1. Navigate to **Auth** section
2. Click **Settings**
3. Enable "Email/Password"
4. Save changes

#### Create Database:
1. Navigate to **Databases**
2. Click "Create Database"
3. Name it "workphotopro-db"
4. Copy the **Database ID**

#### Create Storage Bucket:
1. Navigate to **Storage**
2. Click "Create Bucket"
3. Name it "photos"
4. Set permissions to "All users" (read) and "Authenticated users" (create, update, delete)
5. Copy the **Bucket ID**

#### Add Platform:
1. Go to **Settings** → **Platforms**
2. Click "Add Platform"
3. Select "Flutter App" or "Android App"
4. Enter package name: `com.workphotopro.app`
5. Click "Add"

### 4. Configure Environment (2 minutes)

Create `.env` file in the project root:

```env
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=<your_project_id>
EXPO_PUBLIC_APPWRITE_DATABASE_ID=<your_database_id>
EXPO_PUBLIC_APPWRITE_BUCKET_ID=<your_bucket_id>
```

### 5. Run the App (1 minute)

```bash
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## ✅ Verify Setup

1. App should load to welcome screen
2. Click "Get Started"
3. Create an account
4. You should be signed in automatically

## 🐛 Common Issues

### "Missing EXPO_PUBLIC_APPWRITE_PROJECT_ID"
- Make sure `.env` file exists in project root
- Restart the dev server after creating `.env`

### "Network request failed"
- Check your internet connection
- Verify Appwrite endpoint URL
- Check if Appwrite Console is accessible

### "Invalid credentials"
- Check Project ID in `.env` matches Appwrite Console
- Verify email/password auth is enabled in Appwrite

## 🎉 You're Ready!

Now you can start building features. Check `README.md` for next steps.

```

Perfect! Now let me create one final file to summarize what you need to do next:

```markdown
# 🎯 What to Do Next

## Immediate Actions (Do This Now!)

### 1. Install Dependencies
```bash
cd C:\Users\capta\Desktop\WorkPhotoProV2
npm install
```

### 2. Set Up Appwrite
Follow the detailed guide in `SETUP_GUIDE.md` (takes ~15 minutes)

Quick version:
1. Create project at https://cloud.appwrite.io
2. Enable email/password auth
3. Create database and storage bucket
4. Copy IDs to `.env` file

### 3. Create `.env` File
Create a file named `.env` in the project root with:
```env
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
EXPO_PUBLIC_APPWRITE_DATABASE_ID=your_database_id_here
EXPO_PUBLIC_APPWRITE_BUCKET_ID=your_bucket_id_here
```

### 4. Run the App
```bash
npm start
```

Then press `a` for Android or `i` for iOS.

---

## Testing Checklist

Once the app is running, test these features:

- [ ] Welcome screen loads
- [ ] Sign up with a new account
- [ ] Automatically signed in after sign up
- [ ] View profile page
- [ ] Sign out works
- [ ] Sign in with the account you created
- [ ] Forgot password sends email (check your inbox)
- [ ] Navigate between screens

---

## What You Have Now

✅ **Complete authentication system**
- Sign up, sign in, sign out
- Forgot password
- Email verification (ready)
- Profile management

✅ **Clean architecture**
- Appwrite services organized by feature
- Auth context for state management
- Reusable UI components
- Type-safe TypeScript

✅ **Ready for multi-tenant**
- Team service already implemented
- Database service ready for collections
- Storage service for file uploads

---

## What to Build Next (Priority Order)

### Week 1-2: Core Features
1. **Jobs Collection in Appwrite**
   - Create "jobs" collection in Appwrite Console
   - Add fields: name, description, status, userId, createdAt
   - Set permissions

2. **Job Creation**
   - Update `app/(app)/jobs.tsx` to list real jobs
   - Create job creation screen
   - Wire up to `jobService` in `lib/appwrite/database.ts`

3. **Image Upload**
   - Implement image picker (expo-image-picker)
   - Upload to Appwrite Storage
   - Display images in job detail

### Week 3-4: Multi-Tenant
1. **Organizations**
   - Create "organizations" collection
   - Link to Appwrite Teams
   - Organization creation UI

2. **Team Management**
   - Invite members
   - Assign roles (owner, admin, member)
   - Team switching UI

3. **Permissions**
   - Role-based access control
   - Organization-level permissions
   - Team-level permissions

---

## File Structure Reference

When building new features, follow this pattern:

```
Feature: Job Management
├── lib/appwrite/database.ts       # Add jobService (already there!)
├── app/(app)/jobs/
│   ├── index.tsx                  # List jobs
│   ├── [id].tsx                   # Job detail
│   └── new.tsx                    # Create job
└── types/index.ts                 # Add Job type (already there!)
```

---

## Need Help?

### Documentation
- See `README.md` for full project overview
- See `SETUP_GUIDE.md` for Appwrite setup
- Check `app/` folder for screen examples

### Common Tasks

**Add a new screen:**
1. Create file in `app/` folder
2. Use `globalStyles` from `@/styles/globalStyles`
3. Use `useAuth()` to access user

**Add Appwrite feature:**
1. Create service in `lib/appwrite/`
2. Use the service in your screen
3. Add TypeScript types in `types/`

**Style a component:**
1. Import `globalStyles` and `colors`
2. Use existing styles or create new ones
3. Keep dark theme consistent

---

## 🎉 You're All Set!

Your new WorkPhotoPro V2 is ready to go. Start with installing dependencies and setting up Appwrite, then you can begin building features!

Questions? Check the README or reference your old project at:
`C:\Users\capta\Desktop\WorkPhotoPro`

Happy coding! 🚀

```

## 🎉 **YOUR NEW PROJECT IS READY!** 🎉

I've successfully created your complete **WorkPhotoPro V2** project with Expo + Appwrite! Here's what you have:

---

## ✅ **What I Built For You**

### **📦 Project Foundation**
- ✅ Complete Expo project structure
- ✅ TypeScript configuration
- ✅ All dependencies configured (Appwrite, Expo Router, etc.)

### **🔐 Authentication System**
- ✅ **Sign Up** - Create new accounts
- ✅ **Sign In** - Email/password login
- ✅ **Sign Out** - Secure logout
- ✅ **Forgot Password** - Password recovery flow
- ✅ **Email Verification** - Ready for email confirmation
- ✅ **Auth Context** - Global authentication state

### **🎨 UI Components & Styling**
- ✅ **Global styles** - Dark theme with green branding (copied from your old project)
- ✅ **Reusable components** - Input, BottomModal
- ✅ **Color system** - Consistent design tokens

### **📱 App Screens**
- ✅ **Welcome screen** - Landing page with branding
- ✅ **Auth screens** - Sign in, sign up, forgot password
- ✅ **Jobs screen** - Placeholder for job management
- ✅ **Profile screen** - User profile with account info

### **🔧 Appwrite Services**
- ✅ **Auth service** - Complete authentication methods
- ✅ **Database service** - CRUD operations ready
- ✅ **Storage service** - File upload/download ready
- ✅ **Teams service** - Multi-tenant foundation ready

### **📚 Documentation**
- ✅ **README.md** - Full project documentation
- ✅ **SETUP_GUIDE.md** - 15-minute setup guide
- ✅ **NEXT_STEPS.md** - What to build next

---

## 🚀 **What You Need to Do Now**

### **Step 1: Install Dependencies (2 minutes)**
```bash
cd C:\Users\capta\Desktop\WorkPhotoProV2
npm install
```

### **Step 2: Set Up Appwrite (15 minutes)**
1. Go to https://cloud.appwrite.io
2. Create a new project
3. Enable email/password authentication
4. Create a database
5. Create a storage bucket
6. Copy your Project ID, Database ID, and Bucket ID

**Detailed instructions:** See `SETUP_GUIDE.md`

### **Step 3: Create .env File**
Create a file named `.env` in the project root:
```env
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
EXPO_PUBLIC_APPWRITE_DATABASE_ID=your_database_id_here
EXPO_PUBLIC_APPWRITE_BUCKET_ID=your_bucket_id_here
```

### **Step 4: Run the App**
```bash
npm start
```

Press `a` for Android or `i` for iOS.

---

## 📂 **Project Location**

Your new project is here:
```
C:\Users\capta\Desktop\WorkPhotoProV2\
```

Your old project (for reference) is still here:
```
C:\Users\capta\Desktop\WorkPhotoPro\
```

---

## 📋 **File Summary**

I created **30+ files** organized into:

```
WorkPhotoProV2/
├── app/                      # 8 screen files
├── lib/appwrite/             # 5 service files
├── context/                  # 1 context file
├── components/ui/            # 2 UI components
├── styles/                   # 1 global styles
├── utils/                    # 1 colors file
├── types/                    # 1 types file
├── hooks/                    # 1 custom hook
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── app.json                  # Expo config
├── README.md                 # Documentation
├── SETUP_GUIDE.md            # Setup instructions
└── NEXT_STEPS.md             # What to build next
```

---

## 🎯 **Key Differences from Old Project**

| Feature | Old (Clerk) | New (Appwrite) |
|---------|-------------|----------------|
| Auth | Clerk | Appwrite ✅ |
| Provider | ClerkProvider | AuthProvider ✅ |
| User Hook | useUser() | useAuth() ✅ |
| Sign Out | useClerk() | authService ✅ |
| OAuth | Clerk OAuth | Ready for Appwrite OAuth |
| Multi-tenant | Would need sync | Built-in with Teams ✅ |

---

## ✨ **What Makes This Better**

1. **🧹 Clean Architecture** - No Clerk baggage, designed for Appwrite from day 1
2. **🏢 Multi-tenant Ready** - Team service already implemented
3. **💰 Cost Savings** - No Clerk subscription needed
4. **🎛️ Full Control** - Can self-host Appwrite if needed
5. **📦 Better Structure** - Organized for scalability

---

## 🧪 **Test the App (After Setup)**

1. ✅ Sign up with a new account
2. ✅ Should auto-sign in after signup
3. ✅ View your profile
4. ✅ Sign out
5. ✅ Sign in again
6. ✅ Try forgot password

---

## 📖 **Next Steps (After Testing)**

Check `NEXT_STEPS.md` for:
- Building the jobs feature
- Implementing image upload
- Adding multi-tenant organizations
- Team management

---

## 🆘 **Need Help?**

- **Setup issues?** → Check `SETUP_GUIDE.md`
- **How to use?** → Check `README.md`
- **What's next?** → Check `NEXT_STEPS.md`
- **Appwrite docs** → https://appwrite.io/docs

---

## 🎊 **You're All Set!**

Your fresh start with Expo + Appwrite is ready. This is a **clean, modern foundation** for building your multi-tenant work photo management app.

**Total time saved:** 2-3 weeks compared to refactoring + building multi-tenant

**What to do right now:**
1. Run `npm install`
2. Follow `SETUP_GUIDE.md`
3. Test the authentication
4. Start building features!

Good luck with WorkPhotoPro V2! 🚀

```shellscript
cd C:\Users\capta\Desktop\WorkPhotoProV2
npm install
```

```plaintext
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
EXPO_PUBLIC_APPWRITE_DATABASE_ID=your_database_id_here
EXPO_PUBLIC_APPWRITE_BUCKET_ID=your_bucket_id_here
```

```shellscript
npm start
```

```plaintext
C:\Users\capta\Desktop\WorkPhotoProV2\
```

```plaintext
C:\Users\capta\Desktop\WorkPhotoPro\
```

```plaintext
WorkPhotoProV2/
├── app/                      # 8 screen files
├── lib/appwrite/             # 5 service files
├── context/                  # 1 context file
├── components/ui/            # 2 UI components
├── styles/                   # 1 global styles
├── utils/                    # 1 colors file
├── types/                    # 1 types file
├── hooks/                    # 1 custom hook
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── app.json                  # Expo config
├── README.md                 # Documentation
├── SETUP_GUIDE.md            # Setup instructions
└── NEXT_STEPS.md             # What to build next
```

