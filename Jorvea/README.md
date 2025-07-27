# Jorvea - Advanced Social Media Mobile Application 🚀

A cutting-edge React Native social media platform built with Expo, Firebase, and MUX. Features comprehensive content creation, real-time interactions, professional video streaming, and advanced social networking capabilities.

## ✨ Key Features

### � Content Creation & Sharing
- **Posts**: High-quality photo and video sharing with captions and hashtags
- **Reels**: Short-form video content (up to 60 seconds) with professional processing
- **Stories**: Temporary 24-hour content with advanced viewing analytics
- **Camera Integration**: Built-in camera with editing tools and filters
- **Media Gallery**: Seamless access to device media library

### 🎥 Professional Video Processing
- **MUX Integration**: Enterprise-grade video streaming and processing
- **Real-time Upload Progress**: Visual feedback with stage indicators
- **Multiple Format Support**: MP4, MOV, AVI, M4V, MKV compatibility
- **Adaptive Streaming**: Optimized playback for all network conditions
- **Video Analytics**: Comprehensive viewing and engagement metrics

### 👥 Advanced Social Features
- **User Profiles**: Rich profiles with bio, statistics, and content galleries
- **Follow System**: Sophisticated following with privacy controls and requests
- **Engagement**: Like, comment, share, and save functionality
- **Real-time Notifications**: Push notifications for all user interactions
- **Content Discovery**: Advanced algorithms for trending content and user suggestions
- **Privacy Controls**: Granular privacy settings and content moderation

### 🔐 Robust Authentication & Security
- **Firebase Authentication**: Enterprise-grade security with multiple providers
- **Google Sign-In**: Seamless one-tap authentication
- **Email Verification**: Secure account verification workflow
- **Password Recovery**: Advanced password reset with security features
- **Session Management**: Secure token handling and automatic renewal

### 🏗️ Modern Technical Architecture
- **React Native + Expo**: Latest cross-platform development framework
- **TypeScript**: Full type safety and enhanced developer experience
- **Modular Design**: Clean architecture with separation of concerns
- **Performance Optimized**: Lazy loading, caching, and memory management
- **Offline Capabilities**: Smart offline handling and sync

## 🏗️ Architecture

**Backend Services:**
- **Firebase Firestore**: User profiles, posts, reels, follows, comments
- **Firebase Storage**: Image uploads and thumbnails
- **Firebase Auth**: User authentication and session management
- **MUX Video**: Video uploads, streaming, and thumbnail generation

**Frontend:**
- **React Native + Expo**: Cross-platform mobile app
- **Real-time Listeners**: Live updates using Firestore subscriptions
- **Service Layer**: Clean architecture with Firebase and MUX services

## � Quick Setup

### Prerequisites
- Node.js 18+ and npm
- Expo CLI
- Firebase project
- MUX account

### 1. Clone and Install
```bash
git clone <repository>
cd Jorvea
npm install
```

### 2. Environment Configuration
Create `.env` file:
```env
# MUX Configuration (Required for video features)
MUX_TOKEN_ID=your_mux_token_id_here
MUX_TOKEN_SECRET=your_mux_token_secret_here

# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id

# Google OAuth (Optional)
WEB_CLIENT_ID=your_google_client_id_here
```

### 3. Firebase Setup
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password, Google)
3. Create Firestore database
4. Update `src/config/firebase.ts` with your config
5. Set up Firestore Security Rules (see below)

### 4. MUX Setup
1. Create account at https://mux.com
2. Generate API tokens in MUX Dashboard
3. Add tokens to `.env` file

### 5. Start Development
```bash
# Run setup script (Windows)
./setup.ps1

# Or manually:
npm start
```

## � Firebase Security Rules

Copy these rules to your Firestore Security Rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Posts collection
    match /posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Reels collection
    match /reels/{reelId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Stories collection
    match /stories/{storyId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Follows collection
    match /follows/{followId} {
      allow read: if true;
      allow write: if request.auth != null;
      allow create: if request.auth != null;
      allow delete: if request.auth != null;
    }
    
    // Follow requests collection
    match /follow_requests/{requestId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
      allow create: if request.auth != null;
      allow delete: if request.auth != null;
    }
    
    // Comments collection
    match /comments/{commentId} {
      allow read: if true;
      allow write: if request.auth != null;
      allow create: if request.auth != null;
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

## 📱 App Features & Screens

### Core Screens
- **Feed**: Real-time posts and stories from followed users
- **Reels**: Short-form video content with MUX streaming
- **Search**: Discover and follow new users
- **Profile**: User profiles with posts, reels, and follower counts
- **Notifications**: Follow requests and activity updates

### Social Features
- **Follow System**: Send/accept follow requests
- **Privacy**: Private accounts and follow approval
- **Stories**: 24-hour disappearing content
- **Interactions**: Like, comment, share posts and reels

### Content Creation
- **Posts**: Images with captions and hashtags
- **Reels**: Short videos with MUX upload and streaming
- **Stories**: Quick photo/video updates

## 🛠️ Development Tools

### Data Migration Screen
Access via Profile → Cloud icon for:
- Clear old AsyncStorage data
- Test Firebase connection
- Initialize user profiles
- Test data flow
- View Firebase security rules

### Debug Features
- Real-time data monitoring
- Service connection testing
- Migration status tracking
- Error logging and debugging

## 🏗️ Project Structure

```
Jorvea/
├── app/                     # Expo Router pages
│   ├── _layout.tsx         # Root layout with navigation
│   ├── index.tsx           # Home screen entry point
│   └── useGoogleAuth.js    # Google OAuth hook
├── src/                     # Source code
│   ├── components/          # Reusable UI components
│   │   ├── AppNavigator.tsx # Main app navigation
│   │   ├── TabNavigator.tsx # Bottom tab navigation
│   │   ├── AuthGuard.tsx   # Authentication protection
│   │   ├── StoriesCarousel.tsx # Stories display
│   │   ├── CommentModal.tsx # Comment interactions
│   │   └── ...             # Other UI components
│   ├── screens/            # Screen components
│   │   ├── tabs/           # Main tab screens
│   │   │   ├── FeedScreen.tsx # Posts and stories feed
│   │   │   ├── ReelsScreen.tsx # Video reels
│   │   │   ├── SearchScreen.tsx # User discovery
│   │   │   └── ProfileScreen.tsx # User profile
│   │   ├── AuthScreens/    # Authentication flows
│   │   ├── DataMigrationScreen.tsx # Firebase migration tools
│   │   └── ...             # Other screens
│   ├── services/           # Business logic & APIs
│   │   ├── firebaseProfileService.ts # User management
│   │   ├── firebaseContentService.ts # Posts/reels/stories
│   │   ├── firebaseFollowService.ts # Follow relationships
│   │   ├── muxService.ts   # Video upload/streaming
│   │   ├── dataMigrationService.ts # Migration utilities
│   │   └── index.ts        # Service exports
│   ├── context/            # React context providers
│   │   └── AuthContext.tsx # Authentication state
│   ├── config/             # App configuration
│   │   └── firebase.ts     # Firebase configuration
│   ├── types/              # TypeScript definitions
│   │   ├── media.ts        # Post/reel/story types
│   │   └── user.ts         # User profile types
│   └── utils/              # Utility functions
├── assets/                 # Images, fonts, etc.
├── android/               # Android native code
├── .env                   # Environment variables
├── setup.ps1              # Windows setup script
└── setup.sh               # Unix setup script
```

## 🔄 Data Flow

### Real-time Architecture
```
User Action → Firebase Service → Firestore → Real-time Listener → UI Update
```

### Video Upload Flow
```
Video Selection → MUX Direct Upload → Firebase Metadata Storage → Real-time Feed Update
```

### Follow System Flow
```
Follow Request → Firebase Follow Service → Real-time Notification → Accept/Decline → Update Relationships
```

## 🧪 Testing & Migration

### From AsyncStorage to Firebase
If you previously used AsyncStorage:

1. **Open Data Migration Screen**: Profile → Cloud icon
2. **Clear Local Data**: Remove old AsyncStorage data
3. **Test Firebase Connection**: Verify database connectivity
4. **Initialize User Profile**: Create Firebase profile
5. **Test Data Flow**: Verify all services work

### Testing Checklist
- [ ] Firebase authentication works
- [ ] User profiles load dynamically
- [ ] Posts appear in real-time feed
- [ ] Follow/unfollow updates immediately
- [ ] Video uploads work with MUX
- [ ] Stories display and expire properly
- [ ] Comments and likes sync in real-time
- [ ] Search finds users correctly

## 🔧 Troubleshooting

### Common Issues

**"Firebase connection failed"**
- Check `.env` file has correct Firebase config
- Verify Firebase project is active
- Ensure Firestore security rules are set

**"MUX upload failed"**
- Verify MUX credentials in `.env`
- Check MUX project is active
- Ensure MUX API tokens have upload permissions

**"Real-time updates not working"**
- Verify internet connection
- Check Firestore security rules allow reads
- Ensure user is authenticated

**"Old data still shows"**
- Use Data Migration Screen to clear AsyncStorage
- Check if services/index.ts exports Firebase services
- Restart app after clearing data

### Getting Help
1. Check the Data Migration Screen for diagnostics
2. Review console logs for specific errors
3. Verify all environment variables are set
4. Test Firebase connection independently

## 📚 API Documentation

### Firebase Services

#### Profile Service
```typescript
// Create user profile
profileService.createUserProfile(profile: UserProfile)

// Get user profile with real-time updates
profileService.subscribeToUserProfile(userId: string, callback)

// Delete user and all content
profileService.deleteUser(userId: string)
```

#### Content Service
```typescript
// Create post with image
contentService.createPost(post: Post)

// Create reel with MUX video
contentService.createReel(reel: Reel)

// Subscribe to user feed
contentService.subscribeToUserFeed(userId: string, callback)
```

#### Follow Service
```typescript
// Send follow request
followService.sendFollowRequest(fromUserId: string, toUserId: string)

// Accept follow request
followService.acceptFollowRequest(requestId: string)

// Get real-time follow stats
followService.subscribeToFollowStats(userId: string, callback)
```

### MUX Service
```typescript
// Create direct upload URL
muxService.createDirectUpload()

// Get video data for Firebase storage
muxService.getVideoDataForFirebase(uploadId: string)

// Delete video asset
muxService.deleteAsset(assetId: string)
```

## 🚀 Deployment

### Building for Production

**Android:**
```bash
npx expo build:android
```

**iOS:**
```bash
npx expo build:ios
```

### Environment Setup
- Ensure all `.env` variables are set
- Verify Firebase project is in production mode
- Check MUX project limits and billing
- Test on physical devices

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
