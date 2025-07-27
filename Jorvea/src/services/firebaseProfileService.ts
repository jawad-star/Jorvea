import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  email: string;
  bio?: string;
  profilePicture?: string;
  website?: string;
  location?: string;
  dateOfBirth?: string;
  isPrivate: boolean;
  isVerified: boolean;
  postsCount: number;
  reelsCount: number;
  followersCount: number;
  followingCount: number;
  createdAt: any;
  updatedAt: any;
  socialLinks?: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    twitter?: string;
  };
  totalLikes: number;
  totalViews: number;
}

class FirebaseProfileService {
  private usersCollection = 'users';

  // Get user profile by ID (Real-time)
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, this.usersCollection, userId));
      if (userDoc.exists()) {
        return { uid: userId, ...userDoc.data() } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // Create user profile
  async createUserProfile(profileData: UserProfile): Promise<void> {
    try {
      await setDoc(doc(db, this.usersCollection, profileData.uid), {
        ...profileData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        postsCount: 0,
        reelsCount: 0,
        followersCount: 0,
        followingCount: 0,
        totalLikes: 0,
        totalViews: 0,
        isPrivate: false,
        isVerified: false,
      });
      console.log('User profile created successfully');
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      // Remove undefined values to prevent Firebase errors
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );

      // Check if document exists first
      const userDoc = await getDoc(doc(db, this.usersCollection, userId));
      
      if (!userDoc.exists()) {
        // Document doesn't exist, create it with basic profile data
        const basicProfile: UserProfile = {
          uid: userId,
          username: `user${Date.now()}`,
          displayName: '',
          email: '',
          isPrivate: false,
          isVerified: false,
          postsCount: 0,
          reelsCount: 0,
          followersCount: 0,
          followingCount: 0,
          totalLikes: 0,
          totalViews: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ...cleanUpdates
        };
        
        await setDoc(doc(db, this.usersCollection, userId), basicProfile);
        console.log('User profile created during update');
      } else {
        // Document exists, update it
        await updateDoc(doc(db, this.usersCollection, userId), {
          ...cleanUpdates,
          updatedAt: serverTimestamp(),
        });
        console.log('User profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Delete user and ALL their content
  async deleteUser(userId: string): Promise<void> {
    try {
      console.log('🗑️ Starting user deletion process for:', userId);
      
      // 1. Delete all user's posts
      const postsQuery = query(
        collection(db, 'posts'), 
        where('userId', '==', userId)
      );
      const postsSnapshot = await getDocs(postsQuery);
      const postDeletions = postsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(postDeletions);
      console.log(`Deleted ${postsSnapshot.size} posts`);

      // 2. Delete all user's reels
      const reelsQuery = query(
        collection(db, 'reels'), 
        where('userId', '==', userId)
      );
      const reelsSnapshot = await getDocs(reelsQuery);
      const reelDeletions = reelsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(reelDeletions);
      console.log(`Deleted ${reelsSnapshot.size} reels`);

      // 3. Delete all user's stories
      const storiesQuery = query(
        collection(db, 'stories'), 
        where('userId', '==', userId)
      );
      const storiesSnapshot = await getDocs(storiesQuery);
      const storyDeletions = storiesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(storyDeletions);
      console.log(`Deleted ${storiesSnapshot.size} stories`);

      // 4. Delete all follow relationships
      const followersQuery = query(
        collection(db, 'follows'), 
        where('followingId', '==', userId)
      );
      const followingQuery = query(
        collection(db, 'follows'), 
        where('followerId', '==', userId)
      );
      
      const [followersSnapshot, followingSnapshot] = await Promise.all([
        getDocs(followersQuery),
        getDocs(followingQuery)
      ]);
      
      const followDeletions = [
        ...followersSnapshot.docs.map(doc => deleteDoc(doc.ref)),
        ...followingSnapshot.docs.map(doc => deleteDoc(doc.ref))
      ];
      await Promise.all(followDeletions);
      console.log(`Deleted ${followDeletions.length} follow relationships`);

      // 5. Delete user profile last
      await deleteDoc(doc(db, this.usersCollection, userId));
      console.log('✅ User completely deleted');

    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Search users (Real-time)
  async searchUsers(searchTerm: string, limit_count = 20): Promise<UserProfile[]> {
    try {
      const usersQuery = query(
        collection(db, this.usersCollection),
        orderBy('displayName'),
        limit(limit_count)
      );
      
      const snapshot = await getDocs(usersQuery);
      const users = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserProfile[];

      // Filter by search term (client-side for now)
      return users.filter(user => 
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  // Get all users (for admin/debug)
  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const usersQuery = query(collection(db, this.usersCollection));
      const snapshot = await getDocs(usersQuery);
      return snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserProfile[];
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  // Real-time listener for user profile changes
  subscribeToUserProfile(userId: string, callback: (profile: UserProfile | null) => void) {
    return onSnapshot(
      doc(db, this.usersCollection, userId),
      (doc) => {
        if (doc.exists()) {
          callback({ uid: userId, ...doc.data() } as UserProfile);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error listening to user profile:', error);
        callback(null);
      }
    );
  }

  // Update user stats (posts, followers, etc.)
  async updateUserStats(userId: string, stats: {
    postsCount?: number;
    reelsCount?: number;
    followersCount?: number;
    followingCount?: number;
    totalLikes?: number;
    totalViews?: number;
  }): Promise<void> {
    try {
      await updateDoc(doc(db, this.usersCollection, userId), {
        ...stats,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  }
}

export const profileService = new FirebaseProfileService();
export default profileService;
