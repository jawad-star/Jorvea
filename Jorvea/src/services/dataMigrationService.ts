import { profileService, contentService, followService } from './index';
import { Alert } from 'react-native';

class DataMigrationService {
  // Clear all local data is no longer needed as we've migrated to Firebase
  async clearAllLocalData(): Promise<void> {
    try {
      console.log('🗑️ Local data clearing is no longer needed - already migrated to Firebase');
      
      Alert.alert(
        'Migration Complete', 
        'Your app has already been migrated to Firebase. All data is now stored dynamically in the cloud.'
      );
    } catch (error) {
      console.error('Error clearing local data:', error);
      Alert.alert('Error', 'Failed to clear local data');
    }
  }

  // Test Firebase connection
  async testFirebaseConnection(): Promise<boolean> {
    try {
      console.log('🔥 Testing Firebase connection...');
      
      // Test Firestore by trying to get users collection
      const users = await profileService.getAllUsers();
      console.log(`✅ Firebase connected! Found ${users.length} users`);
      
      return true;
    } catch (error) {
      console.error('❌ Firebase connection failed:', error);
      Alert.alert(
        'Firebase Error', 
        'Failed to connect to Firebase. Please check your configuration.'
      );
      return false;
    }
  }

  // Initialize user profile in Firebase
  async initializeUserInFirebase(user: any): Promise<void> {
    try {
      console.log('🔥 Initializing user in Firebase:', user.uid);
      
      // Check if user already exists
      const existingProfile = await profileService.getUserProfile(user.uid);
      
      if (!existingProfile) {
        // Create new profile
        const newProfile = {
          uid: user.uid,
          username: user.displayName?.toLowerCase().replace(/\s+/g, '') || `user_${user.uid.slice(0, 8)}`,
          displayName: user.displayName || user.email || 'Unknown User',
          email: user.email || '',
          bio: '',
          profilePicture: user.photoURL || '',
          website: '',
          location: '',
          dateOfBirth: '',
          isPrivate: false,
          isVerified: false,
          postsCount: 0,
          reelsCount: 0,
          followersCount: 0,
          followingCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          totalLikes: 0,
          totalViews: 0,
        };

        await profileService.createUserProfile(newProfile);
        console.log('✅ User profile created in Firebase');
      } else {
        console.log('✅ User already exists in Firebase');
      }
    } catch (error) {
      console.error('Error initializing user in Firebase:', error);
      throw error;
    }
  }

  // Show migration status
  async showMigrationStatus(): Promise<void> {
    try {
      const users = await profileService.getAllUsers();
      const posts = await contentService.getAllPosts();
      const reels = await contentService.getAllReels();
      
      Alert.alert(
        'Firebase Status',
        `Connected to Firebase!\n\n` +
        `👥 Users: ${users.length}\n` +
        `📸 Posts: ${posts.length}\n` +
        `🎬 Reels: ${reels.length}\n\n` +
        `All data is now dynamic and real-time!`
      );
    } catch (error) {
      console.error('Error getting migration status:', error);
      Alert.alert('Error', 'Failed to get Firebase status');
    }
  }

  // Setup Firebase security rules (instructions)
  getFirebaseSecurityRulesInstructions(): string {
    return `
📋 FIREBASE SECURITY RULES SETUP:

Copy these rules to your Firestore Security Rules:

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

🔧 FIREBASE STORAGE RULES:

rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
    `;
  }
}

export const dataMigrationService = new DataMigrationService();
export default dataMigrationService;
