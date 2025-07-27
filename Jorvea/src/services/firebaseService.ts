import {
    collection,
    doc,
    getDoc,
    getDocs,
    increment,
    limit,
    orderBy,
    query,
    QueryDocumentSnapshot,
    serverTimestamp,
    setDoc,
    startAfter,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from '../types/auth';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  username: string;
  photoURL?: string;
  bio?: string;
  website?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  reelsCount: number;
  storiesCount: number;
  isVerified: boolean;
  isPrivate: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Post {
  id: string;
  userId: string;
  type: 'image' | 'video';
  mediaUrl: string;
  caption: string;
  tags: string[];
  location?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  assetId?: string; // For videos stored in MUX
  playbackId?: string; // For MUX video playback
  createdAt: any;
  updatedAt: any;
}

export interface Reel {
  id: string;
  userId: string;
  assetId: string; // MUX asset ID
  playbackId?: string; // MUX playback ID
  mediaUrl: string; // MUX playback URL
  caption: string;
  tags: string[];
  music?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  duration: number;
  createdAt: any;
  updatedAt: any;
}

export interface Story {
  id: string;
  userId: string;
  type: 'image' | 'video';
  mediaUrl: string;
  assetId?: string; // For videos in MUX
  duration?: number; // For videos
  viewsCount: number;
  createdAt: any;
  expiresAt: any; // Stories expire after 24 hours
}

class FirebaseService {
  // User Profile Management
  async createUserProfile(user: User, additionalData: Partial<UserProfile> = {}): Promise<void> {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userRef);
      
      if (!userSnapshot.exists()) {
        const userData: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          username: additionalData.username || user.displayName?.toLowerCase().replace(/\s+/g, '') || `user${Date.now()}`,
          photoURL: user.photoURL || '',
          bio: additionalData.bio || '',
          website: additionalData.website || '',
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          reelsCount: 0,
          storiesCount: 0,
          isVerified: false,
          isPrivate: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ...additionalData,
        };
        
        await setDoc(userRef, userData);
        console.log('User profile created successfully');
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnapshot = await getDoc(userRef);
      
      if (userSnapshot.exists()) {
        return { id: userSnapshot.id, ...userSnapshot.data() } as UserProfile;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      
      // Check if document exists first
      const userSnapshot = await getDoc(userRef);
      
      if (!userSnapshot.exists()) {
        // Document doesn't exist, create it with basic profile data
        const basicProfile: UserProfile = {
          uid: userId,
          email: updates.email || '',
          displayName: updates.displayName || '',
          username: updates.username || `user${Date.now()}`,
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          reelsCount: 0,
          storiesCount: 0,
          isVerified: false,
          isPrivate: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ...updates
        };
        
        await setDoc(userRef, basicProfile);
        console.log('User profile created during update');
      } else {
        // Document exists, update it
        await updateDoc(userRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });
        console.log('User profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Post Management
  async createPost(postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const postRef = doc(collection(db, 'posts'));
      const post: Post = {
        id: postRef.id,
        ...postData,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      await setDoc(postRef, post);
      
      // Update user's posts count
      await this.updateUserStats(postData.userId, { postsCount: increment(1) });
      
      console.log('Post created successfully:', postRef.id);
      return postRef.id;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  async getPosts(userId?: string, lastDoc?: QueryDocumentSnapshot, limitCount = 20): Promise<{ posts: Post[]; lastDoc?: QueryDocumentSnapshot }> {
    try {
      let q = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      if (userId) {
        q = query(
          collection(db, 'posts'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }
      
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      
      const querySnapshot = await getDocs(q);
      const posts: Post[] = [];
      
      querySnapshot.forEach((doc) => {
        posts.push({ id: doc.id, ...doc.data() } as Post);
      });
      
      const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      
      return { posts, lastDoc: newLastDoc };
    } catch (error) {
      console.error('Error getting posts:', error);
      throw error;
    }
  }

  // Reel Management
  async createReel(reelData: Omit<Reel, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const reelRef = doc(collection(db, 'reels'));
      const reel: Reel = {
        id: reelRef.id,
        ...reelData,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        viewsCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      await setDoc(reelRef, reel);
      
      // Update user's reels count
      await this.updateUserStats(reelData.userId, { reelsCount: increment(1) });
      
      console.log('Reel created successfully:', reelRef.id);
      return reelRef.id;
    } catch (error) {
      console.error('Error creating reel:', error);
      throw error;
    }
  }

  async getReels(userId?: string, lastDoc?: QueryDocumentSnapshot, limitCount = 20): Promise<{ reels: Reel[]; lastDoc?: QueryDocumentSnapshot }> {
    try {
      let q = query(
        collection(db, 'reels'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      if (userId) {
        q = query(
          collection(db, 'reels'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }
      
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      
      const querySnapshot = await getDocs(q);
      const reels: Reel[] = [];
      
      querySnapshot.forEach((doc) => {
        reels.push({ id: doc.id, ...doc.data() } as Reel);
      });
      
      const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      
      return { reels, lastDoc: newLastDoc };
    } catch (error) {
      console.error('Error getting reels:', error);
      throw error;
    }
  }

  // Story Management
  async createStory(storyData: Omit<Story, 'id' | 'createdAt' | 'expiresAt'>): Promise<string> {
    try {
      const storyRef = doc(collection(db, 'stories'));
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      const story: Story = {
        id: storyRef.id,
        ...storyData,
        viewsCount: 0,
        createdAt: serverTimestamp(),
        expiresAt: expiresAt,
      };
      
      await setDoc(storyRef, story);
      
      // Update user's stories count
      await this.updateUserStats(storyData.userId, { storiesCount: increment(1) });
      
      console.log('Story created successfully:', storyRef.id);
      return storyRef.id;
    } catch (error) {
      console.error('Error creating story:', error);
      throw error;
    }
  }

  // Update user statistics
  private async updateUserStats(userId: string, updates: Record<string, any>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating user stats:', error);
      // Don't throw error as this is not critical
    }
  }

  // Search functionality
  async searchUsers(searchTerm: string, limitCount = 20): Promise<UserProfile[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('username', '>=', searchTerm.toLowerCase()),
        where('username', '<=', searchTerm.toLowerCase() + '\uf8ff'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const users: UserProfile[] = [];
      
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() } as UserProfile);
      });
      
      return users;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  // Clean up expired stories
  async cleanupExpiredStories(): Promise<void> {
    try {
      const now = new Date();
      const q = query(
        collection(db, 'stories'),
        where('expiresAt', '<=', now)
      );
      
      const querySnapshot = await getDocs(q);
      const batch = [];
      
      querySnapshot.forEach((doc) => {
        batch.push(doc.ref.delete());
      });
      
      await Promise.all(batch);
      console.log(`Cleaned up ${batch.length} expired stories`);
    } catch (error) {
      console.error('Error cleaning up expired stories:', error);
    }
  }
}

export const firebaseService = new FirebaseService();
