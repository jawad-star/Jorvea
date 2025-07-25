# Jorvea Project Structure

This document outlines the organized structure of the Jorvea React Native/Expo application.

## 📁 Project Structure

```
Jorvea/
├── app/                          # Expo Router pages (routes)
│   ├── _layout.tsx              # Root layout
│   ├── index.tsx                # Home page (/)
│   ├── sign-in.tsx              # Sign in page (/sign-in)
│   └── sign-up.tsx              # Sign up page (/sign-up)
├── src/                         # Source code
│   ├── components/              # Reusable UI components
│   ├── screens/                 # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── SignInScreen.tsx
│   │   ├── SignUpScreen.tsx
│   │   └── index.ts
│   ├── services/                # API and external service integrations
│   │   └── authService.ts       # Firebase authentication services
│   ├── hooks/                   # Custom React hooks
│   │   └── useGoogleAuth.ts     # Google authentication hook
│   ├── config/                  # Configuration files
│   │   └── firebase.ts          # Firebase configuration
│   ├── utils/                   # Utility functions
│   │   ├── validation.ts        # Validation helpers
│   │   └── index.ts
│   ├── constants/               # App-wide constants
│   │   └── index.ts
│   ├── types/                   # TypeScript type definitions
│   │   ├── auth.ts
│   │   └── index.ts
│   └── index.ts                 # Main exports
├── assets/                      # Static assets (images, fonts)
├── android/                     # Android native code
├── .env                         # Environment variables
├── app.config.js               # Expo configuration
├── package.json
└── tsconfig.json
```

## 📋 Folder Descriptions

### `/app` - Expo Router Pages
Contains the actual route pages that Expo Router uses for navigation. Each file here becomes a route in your app.

### `/src` - Source Code
Main application source code organized by feature and responsibility.

#### `/src/components` - Reusable Components
Shared UI components that can be used across multiple screens.

#### `/src/screens` - Screen Components
Individual screen components that represent full pages in your app.

#### `/src/services` - Services
Business logic and external API integrations (Firebase, REST APIs, etc.).

#### `/src/hooks` - Custom Hooks
Reusable React hooks for state management and side effects.

#### `/src/config` - Configuration
App configuration files (Firebase, API endpoints, etc.).

#### `/src/utils` - Utilities
Helper functions and utility modules.

#### `/src/constants` - Constants
App-wide constants and enums.

#### `/src/types` - TypeScript Types
Type definitions and interfaces.

## 🚀 Benefits of This Structure

1. **Separation of Concerns**: Clear separation between routing (app/), business logic (src/), and assets
2. **Scalability**: Easy to add new features and components
3. **Maintainability**: Clear organization makes code easier to find and modify
4. **Reusability**: Components and utilities can be easily shared
5. **Type Safety**: Centralized TypeScript types improve development experience
6. **Testability**: Organized structure makes testing easier

## 🔧 Development Workflow

1. **Routes**: Add new pages in `/app` directory
2. **Screens**: Create screen components in `/src/screens`
3. **Components**: Build reusable components in `/src/components`
4. **Services**: Add business logic in `/src/services`
5. **Types**: Define TypeScript types in `/src/types`
6. **Utils**: Add helper functions in `/src/utils`

## 📦 Import Examples

```typescript
// Importing screens
import { HomeScreen, SignInScreen } from '../src/screens';

// Importing services
import { loginWithEmail, signUpWithEmail } from '../src/services/authService';

// Importing hooks
import { useGoogleAuth } from '../src/hooks/useGoogleAuth';

// Importing types
import { AuthUser, LoginCredentials } from '../src/types';

// Importing utils
import { isValidEmail, formatErrorMessage } from '../src/utils';
```
