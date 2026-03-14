# AGENTS.md - Agentic Coding Guidelines

This document provides guidelines for AI agents working in the WorkPhotoPro V2 codebase.

## Project Overview

- **Framework**: Expo SDK 54 + React Native + TypeScript
- **Backend**: Appwrite (BaaS)
- **Routing**: Expo Router (file-based)
- **State**: React Context API
- **Styling**: React Native StyleSheet (dark theme with green branding)

## Build/Lint/Test Commands

```bash
# Development
npm start                    # Start Expo development server
npm run android             # Run on Android device/emulator
npm run ios                 # Run on iOS simulator (macOS only)
npm run web                 # Run in web browser

# Code Quality
npm run lint                # Run ESLint (expo lint)
# Note: No test framework configured yet

# Build (EAS)
eas build --profile development   # Development build
eas build --profile preview       # Preview build (APK)
eas build --profile production    # Production build (AAB)
```

## Import Organization

Order imports by category with blank lines between:

1. **React/React Native** - Core framework imports
2. **Expo modules** - Expo SDK packages
3. **Third-party libraries** - External npm packages
4. **Local absolute imports** - `@/` path aliases
5. **Local relative imports** - `../` or `./` relative paths

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { Slot, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/utils/colors';

import { SomeLocalComponent } from './SomeLocalComponent';
```

## Code Style Guidelines

### TypeScript

- Enable `strict: true` in tsconfig.json
- Use explicit types for function parameters and return types
- Prefer interfaces over types for object shapes
- Use `type` for unions and complex types

### Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile`, `JobChatScreen`)
- **Functions**: camelCase (e.g., `handleSubmit`, `fetchUserData`)
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Files**: PascalCase for components, camelCase for utilities
- **Interfaces/Types**: PascalCase with descriptive names

### Component Structure

```typescript
interface ComponentProps {
  // Props with JSDoc comments for complex ones
  name: string;
  onPress: () => void;
}

export const ComponentName: React.FC<ComponentProps> = ({
  name,
  onPress,
}) => {
  // State hooks first
  const [isLoading, setIsLoading] = useState(false);
  
  // Other hooks
  const router = useRouter();
  
  // Effects
  useEffect(() => {
    // Implementation
  }, []);
  
  // Render
  return (
    <View style={styles.container}>
      {/* JSX */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Styles
  },
});
```

### Styling

- Use StyleSheet.create() for all styles
- Import colors from `@/utils/colors` or `@/styles/globalStyles`
- Primary color: `#22c55e` (green-500)
- Background: `#000` (black), Surface: `#1a1a1a`
- Follow dark theme conventions established in globalStyles.ts

### Error Handling

- Wrap async operations in try-catch blocks
- Log errors with descriptive messages (prefix with emoji for visibility)
- Use non-blocking error handling for non-critical operations
- Provide fallback UI for error states

```typescript
try {
  const result = await someAsyncOperation();
} catch (error: any) {
  console.error('[Feature] Error description:', error.message);
  // Handle gracefully
}
```

### Path Aliases

Use `@/` prefix for imports from project root:

- `@/components/*` - React components
- `@/context/*` - React context providers
- `@/lib/appwrite/*` - Appwrite services
- `@/utils/*` - Utility functions
- `@/styles/*` - Global styles
- `@/hooks/*` - Custom React hooks

### Appwrite Integration

- Services located in `@/lib/appwrite/`
- Use exported clients from `@/lib/appwrite/client.ts`
- Handle environment variables with `EXPO_PUBLIC_` prefix
- Validate environment variables at startup

### Environment Variables

Required variables (must be set in `.env`):
- `EXPO_PUBLIC_APPWRITE_ENDPOINT`
- `EXPO_PUBLIC_APPWRITE_PROJECT_ID`
- `EXPO_PUBLIC_APPWRITE_DATABASE_ID`
- `EXPO_PUBLIC_APPWRITE_BUCKET_ID`

## Project Structure

```
app/                    # Expo Router screens
  (auth)/              # Auth group (unauthenticated)
  (jobs)/              # Jobs group (authenticated)
  _layout.tsx          # Root layout

components/            # Reusable React components
  ComponentName.tsx

context/               # React Context providers
  AuthContext.tsx
  OrganizationContext.tsx

lib/appwrite/          # Appwrite SDK integration
  client.ts            # Client configuration
  auth.ts              # Auth service
  database.ts          # Database service
  storage.ts           # Storage service
  teams.ts             # Teams service

utils/                 # Utility functions
  colors.ts            # Color constants
  types.ts             # TypeScript types
  cacheManager.ts      # Cache utilities

hooks/                 # Custom React hooks
  useFCMToken.ts
  useAppwrite.ts

styles/                # Global styles
  globalStyles.ts
```

## Key Conventions

- Use functional components with hooks
- Prefer early returns for conditional rendering
- Clean up subscriptions/listeners in useEffect cleanup
- Use meaningful console logs with emojis for debugging
- Follow existing patterns in similar files
- Comment complex business logic
- Keep components focused and single-responsibility
