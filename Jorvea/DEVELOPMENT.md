# Jorvea Development Documentation

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Key Components](#key-components)
4. [Services](#services)
5. [Database Schema](#database-schema)
6. [API Integration](#api-integration)
7. [Development Guidelines](#development-guidelines)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

## 🎯 Project Overview

Jorvea is a comprehensive social media mobile application built with React Native and Expo. The application focuses on providing a seamless content creation and sharing experience with professional-grade video processing capabilities.

### Core Technologies
- **Frontend**: React Native + Expo SDK 53
- **Language**: TypeScript for type safety
- **Backend**: Firebase (Firestore, Authentication, Cloud Functions)
- **Video Processing**: MUX Video API
- **Navigation**: React Navigation v6
- **State Management**: React Context + Hooks

## 🏗️ Architecture

### Application Structure
```
├── App Entry Point
├── Navigation Layer (React Navigation)
├── Screen Components (UI Screens)
├── Service Layer (Business Logic)
├── Data Layer (Firebase/MUX)
└── Utility Layer (Helpers/Utils)
```

### Key Architectural Patterns
- **Service-Oriented Architecture**: Modular services for different functionalities
- **Component-Based Design**: Reusable UI components
- **Context-Based State Management**: React Context for global state
- **Hook-Based Logic**: Custom hooks for reusable logic

## 🧩 Key Components

### Authentication System
```typescript
// AuthContext.tsx - Global authentication state
- User session management
- Authentication state persistence
- Token refresh handling
- Profile data synchronization
```

### Content Creation Pipeline
```typescript
// CreateContentScreen.tsx - Main content creation interface
- Media selection (camera/gallery)
- Content type management (posts/reels/stories)
- Upload progress tracking
- Caption and hashtag management
```

### Media Processing System
```typescript
// MediaUploadService.ts - Core media handling
- Image/video selection and validation
- MUX integration for video processing
- Progress tracking with stage indicators
- Error handling and retry logic
```

## 🔧 Services

### Core Services

#### 1. MediaUploadService
**Purpose**: Handles all media upload operations
```typescript
Key Methods:
- pickImage(): Select image from gallery
- pickVideo(): Select video from gallery
- takePhoto(): Capture photo with camera
- recordVideo(): Record video with camera
- uploadMedia(): Process and upload media
```

#### 2. FirebaseContentService
**Purpose**: Manages all content operations in Firestore
```typescript
Key Methods:
- createPost(): Create new post
- createReel(): Create new reel
- getUserFeed(): Fetch user content feed
- updateContent(): Update existing content
- deleteContent(): Remove content
```

#### 3. MuxService
**Purpose**: Professional video processing and streaming
```typescript
Key Methods:
- uploadVideo(): Upload video to MUX
- getPlaybackUrl(): Get streaming URL
- getAssetIdFromUpload(): Convert upload ID to asset ID
- deleteAsset(): Remove video from MUX
```

#### 4. AuthService
**Purpose**: User authentication and session management
```typescript
Key Methods:
- signInWithEmail(): Email/password login
- signInWithGoogle(): Google OAuth login
- signUp(): User registration
- signOut(): Logout user
```

## 🗄️ Database Schema

### Firestore Collections

#### Users Collection
```typescript
{
  uid: string,              // Firebase Auth UID
  email: string,            // User email
  username: string,         // Unique username
  displayName: string,      // Display name
  profilePicture?: string,  // Profile image URL
  bio?: string,            // User biography
  isVerified: boolean,     // Verification status
  isPrivate: boolean,      // Account privacy
  followerCount: number,   // Total followers
  followingCount: number,  // Total following
  postCount: number,       // Total posts
  createdAt: Timestamp,    // Account creation
  updatedAt: Timestamp     // Last update
}
```

#### Posts Collection
```typescript
{
  id: string,              // Unique post ID
  userId: string,          // Author's UID
  username: string,        // Author's username
  caption: string,         // Post caption
  imageUrl?: string,       // Image URL (for image posts)
  videoUrl?: string,       // Video URL (for video posts)
  muxAssetId?: string,     // MUX asset ID
  muxPlaybackId?: string,  // MUX playback ID
  tags: string[],          // Hashtags
  likes: number,           // Like count
  likedBy: string[],       // User IDs who liked
  commentsCount: number,   // Comment count
  shares: number,          // Share count
  views: number,           // View count
  createdAt: Timestamp,    // Creation time
  isPrivate: boolean       // Privacy setting
}
```

#### Reels Collection
```typescript
{
  id: string,              // Unique reel ID
  userId: string,          // Creator's UID
  username: string,        // Creator's username
  caption: string,         // Reel caption
  videoUrl: string,        // Video URL (required)
  muxAssetId: string,      // MUX asset ID (required)
  muxPlaybackId: string,   // MUX playback ID (required)
  thumbnailUrl?: string,   // Video thumbnail
  duration: number,        // Video duration
  tags: string[],          // Hashtags
  likes: number,           // Like count
  likedBy: string[],       // User IDs who liked
  commentsCount: number,   // Comment count
  shares: number,          // Share count
  views: number,           // View count
  createdAt: Timestamp     // Creation time
}
```

## 🔌 API Integration

### MUX Video API Integration

#### Upload Flow
1. **Create Direct Upload**: Generate secure upload URL
2. **Client Upload**: Upload video directly to MUX
3. **Asset Processing**: MUX processes video
4. **Asset ID Retrieval**: Get permanent asset ID
5. **Playback URL Generation**: Create streaming URLs

#### Error Handling
- Network timeout handling
- Upload retry logic
- Asset processing status monitoring
- Playback URL validation

### Firebase Integration

#### Authentication Flow
1. **Email/Password**: Standard Firebase Auth
2. **Google OAuth**: Google Sign-In integration
3. **Session Management**: Automatic token refresh
4. **Profile Sync**: User data synchronization

#### Data Operations
- **Real-time Updates**: Firestore listeners for live data
- **Offline Support**: Automatic caching and sync
- **Security Rules**: Server-side data validation
- **Indexes**: Optimized queries for performance

## 👨‍💻 Development Guidelines

### Code Standards
- **TypeScript**: Strict mode enabled for type safety
- **ESLint**: Code linting with React Native rules
- **Prettier**: Automatic code formatting
- **Comments**: Comprehensive inline documentation

### Naming Conventions
- **Files**: PascalCase for components, camelCase for utilities
- **Functions**: camelCase with descriptive names
- **Constants**: UPPER_SNAKE_CASE
- **Interfaces**: PascalCase with descriptive names

### Error Handling
- **Try-Catch Blocks**: Comprehensive error catching
- **User-Friendly Messages**: Clear error communication
- **Logging**: Detailed error logging for debugging
- **Fallback Mechanisms**: Graceful degradation

### Performance Optimization
- **Lazy Loading**: Component and image lazy loading
- **Memory Management**: Proper cleanup and disposal
- **Caching**: Strategic caching for improved performance
- **Bundle Optimization**: Code splitting and tree shaking

## 🚀 Deployment

### Development Environment
```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on specific platforms
npm run android
npm run ios
npm run web
```

### Production Build
```bash
# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production

# Preview builds
eas build --platform all --profile preview
```

### Environment Configuration
```env
# Firebase Configuration
FIREBASE_API_KEY=your_api_key
FIREBASE_PROJECT_ID=your_project_id

# MUX Configuration
MUX_TOKEN_ID=your_token_id
MUX_TOKEN_SECRET=your_token_secret

# Google OAuth
WEB_CLIENT_ID=your_web_client_id
ANDROID_CLIENT_ID=your_android_client_id
IOS_CLIENT_ID=your_ios_client_id
```

## 🐛 Troubleshooting

### Common Issues

#### Video Upload Problems
**Issue**: Videos not playing after upload
**Solution**: Check MUX asset ID conversion and playback URL generation

#### Authentication Issues
**Issue**: Users getting signed out unexpectedly
**Solution**: Verify Firebase token refresh configuration

#### Performance Issues
**Issue**: Slow app performance on older devices
**Solution**: Implement lazy loading and optimize image/video processing

### Debugging Tools
- **React Native Debugger**: Advanced debugging capabilities
- **Flipper**: Network inspection and state debugging
- **Firebase Console**: Backend data and analytics
- **MUX Dashboard**: Video processing and analytics

### Logging
- **Console Logging**: Detailed logging throughout the application
- **Error Tracking**: Comprehensive error capture and reporting
- **Performance Monitoring**: Real-time performance metrics
- **User Analytics**: User behavior and engagement tracking

---

## 📞 Support

For technical questions or issues:
- **GitHub Issues**: [Project Issues](https://github.com/jawad-star/Jorvea/issues)
- **Documentation**: [Wiki](https://github.com/jawad-star/Jorvea/wiki)
- **Email**: dev@jorvea.com

---

*This documentation is continuously updated as the project evolves.*
