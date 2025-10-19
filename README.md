# WorkPhotoPro V2 🚀

A modern, multi-tenant work photo management app built with **Expo** and **Appwrite**.

## 📋 Features

- ✅ **Authentication** - Email OTP sign up, sign in, forgot password
- ✅ **User Profiles** - View and manage user information
- ✅ **Jobs Management** - Create and organize work photo projects
- ✅ **Real-time Chat** - Multi-user job chat with image sharing
- ✅ **Google OAuth** - Sign in with Google integration
- 🚧 **Multi-tenant** - Organizations, teams, and role-based permissions (coming soon)
- 🚧 **Photo Management** - Upload, organize, and share work photos (coming soon)

## 🛠️ Tech Stack

- **Framework**: Expo SDK 54 + React Native
- **Language**: TypeScript
- **Backend**: Appwrite (BaaS)
- **Routing**: Expo Router
- **State Management**: React Context API
- **Styling**: React Native StyleSheet
- **Real-time**: Appwrite Realtime subscriptions
- **UI Components**: Custom components with LegendList for performance

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
│   └── (jobs)/                  # Jobs management screens (authenticated)
│       ├── _layout.tsx
│       ├── index.tsx            # Jobs list
│       ├── new-job.tsx          # Create new job
│       ├── profile.tsx          # User profile
│       ├── [job].tsx            # Job chat screen
│       └── settings/
│           └── [job].tsx        # Job settings
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
│   ├── Input.tsx                # Custom text input
│   ├── BottomModal.tsx          # Animated bottom sheet
│   ├── GoogleAuthButton.tsx     # Google OAuth button
│   ├── IconSymbol.tsx           # Icon components
│   └── IconSymbol.iso.tsx       # Icon ISO components
│
├── hooks/                       # Custom hooks
│   └── useAppwrite.ts
│
├── styles/                      # Global styles
│   └── globalStyles.ts
│
├── utils/                       # Utilities
│   ├── appwrite.ts              # Appwrite configuration
│   ├── colors.ts                # Color constants
│   ├── types.ts                 # TypeScript types
│   ├── test-data.ts             # Test data
│   └── cache.ts                 # Cache utilities
│
└── docs/                        # Documentation
    ├── PROJECT_ARCHITECTURE.md  # Architecture overview
    └── DATA_MODEL_IMPLEMENTATION.md # Data models
```

## 🔐 Authentication Flow

The app uses Appwrite's authentication with Email OTP:

1. **Sign Up**: User enters email and name, receives 6-digit OTP
2. **Sign In**: User enters email and password (traditional) or uses Google OAuth
3. **Email Verification**: OTP verification for new accounts
4. **Forgot Password**: Sends recovery email with deep link
5. **Google OAuth**: Sign in with Google integration

### Deep Links Setup

The app is configured to handle these deep links:
- `workphotopro://verify-email` - Email verification
- `workphotopro://reset-password` - Password reset

## 💬 Job Chat System

The app features a real-time chat system for job collaboration:

### Features:
- **Multi-user chat**: Team members can communicate within job contexts
- **Real-time messaging**: Powered by Appwrite real-time subscriptions
- **Image sharing**: Users can upload and share photos in chat
- **Message management**: Users can delete their own messages
- **Responsive UI**: Optimized for mobile with keyboard handling

### Technical Implementation:
- **Dynamic routing**: `[job].tsx` handles individual job chats
- **Real-time updates**: Automatic message synchronization across devices
- **Image uploads**: Integrated with Appwrite Storage for photo sharing
- **Performance**: Uses LegendList for optimized list rendering

## 🎨 Styling

The app uses a dark theme with green branding:
- Primary: `#22c55e` (Green-500)
- Background: `#000` (Black)
- Surface: `#1a1a1a` (Dark Gray)

See `styles/globalStyles.ts` for the complete design system.

## 🔄 Migration from V1 (Clerk)

This is a complete rewrite of WorkPhotoPro, migrating from Clerk to Appwrite:

### What Changed:
- ❌ Removed: Clerk authentication and dependencies
- ✅ Added: Appwrite authentication with Email OTP
- ✅ Added: Real-time job chat system
- ✅ Added: Image sharing in chat
- ✅ Added: Google OAuth integration
- ✅ Clean architecture designed for multi-tenancy
- ✅ Built-in team/organization support

### What Stayed:
- ✅ UI components and styling
- ✅ File structure and routing
- ✅ Design system and branding

## 🚧 Next Steps

### Immediate (Week 1-2):
- [x] Test authentication flow thoroughly
- [x] Add image picker integration
- [x] Build job creation feature
- [x] Implement photo upload to Appwrite Storage
- [x] Real-time job chat system
- [ ] Fix chat refresh and display issues
- [ ] Improve chat performance and stability

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

