/**
 * Firebase Content Service
 * 
 * Comprehensive service for managing all content operations in Jorvea.
 * Handles posts, reels, stories, comments, and user interactions with Firestore.
 * 
 * Key Features:
 * - CRUD operations for posts, reels, and stories
 * - Real-time content updates and synchronization
 * - User interaction management (likes, comments, shares)
 * - Content discovery and feed generation
 * - Advanced querying with pagination support
 * - MUX video integration for streaming content
 * - Content moderation and privacy controls
 * 
 * Database Structure:
 * - posts: User posts with images/videos
 * - reels: Short-form video content
 * - stories: Temporary 24-hour content
 * - comments: Nested comment system
 * - likes: User engagement tracking
 * 
 * @author Jorvea Development Team
 * @version 3.0.0
 * @created 2024-11-20
 * @updated 2025-01-27
 */

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    increment,
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

/**
 * FirebasePost Interface
 * 
 * Defines the structure for post documents in Firestore.
 * Supports both image and video content with comprehensive metadata.
 */
export interface FirebasePost {
  id: string;                    // Unique post identifier
  userId: string;                // Author's user ID
  username: string;              // Author's username for display
  userDisplayName: string;       // Author's display name
  userAvatar?: string;          // Author's profile picture URL
  caption: string;               // Post description/caption
  imageUrl?: string;            // Image URL (for image posts)
  videoUrl?: string;            // Video URL (for video posts)
  muxAssetId?: string;          // MUX asset ID for video management
  muxPlaybackId?: string;       // MUX playback ID for streaming
  location?: string;            // Geographic location tag
  tags: string[];               // Hashtags and topic tags
  likes: number;                // Total number of likes
  likedBy: string[];            // User IDs who liked this post
  shares: number;               // Number of times shared
  views: number;                // View count for analytics
  commentsCount: number;        // Total comments count
  createdAt: any;               // Firestore timestamp of creation
  updatedAt: any;               // Firestore timestamp of last update
  isArchived: boolean;          // Whether post is archived
  isPrivate: boolean;           // Privacy setting
}

/**
 * FirebaseReel Interface
 * 
 * Defines the structure for reel documents in Firestore.
 * Specialized for short-form video content with engagement metrics.
 */
export interface FirebaseReel {
  id: string;                    // Unique reel identifier
  userId: string;                // Creator's user ID
  username: string;              // Creator's username
  userDisplayName: string;       // Creator's display name
  userAvatar?: string;          // Creator's profile picture
  caption: string;               // Reel description
  videoUrl: string; // Required for reels
  muxAssetId: string; // Required for reels
  muxPlaybackId: string; // Required for reels
  thumbnailUrl?: string;
  duration: number;
  tags: string[];
  likes: number;
  likedBy: string[];
  shares: number;
  views: number;
  commentsCount: number;
  createdAt: any;
  updatedAt: any;
  isArchived: boolean;
  isPrivate: boolean;
}

// Add Story Service
export interface FirebaseStory {
  id: string;
  userId: string;
  username: string;
  userDisplayName: string;
  userAvatar?: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  muxAssetId?: string;
  muxPlaybackId?: string;
  caption?: string;
  viewedBy: string[];
  views: number;
  createdAt: any;
  expiresAt: any;
}

export interface StoryGroup {
  userId: string;
  username: string;
  userDisplayName: string;
  userName: string; // For backward compatibility
  userAvatar?: string;
  stories: FirebaseStory[];
  hasUnseenStories: boolean;
  hasUnviewed: boolean; // For backward compatibility
}

// Add Comment Service  
export interface FirebaseComment {
  id: string;
  contentId: string;
  contentType: 'post' | 'reel';
  userId: string;
  username: string;
  userDisplayName: string;
  userAvatar?: string;
  text: string;
  likes: number;
  likedBy: string[];
  replies: FirebaseComment[];
  createdAt: any;
  updatedAt: any;
}

// Add Notification Service
export interface FirebaseNotification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'follow_request' | 'mention' | 'story_view';
  fromUserId: string;
  fromUsername: string;
  fromUserDisplayName: string;
  fromUserAvatar?: string;
  toUserId: string;
  contentId?: string;
  contentType?: 'post' | 'reel' | 'story';
  message: string;
  isRead: boolean;
  createdAt: any;
}

class FirebaseContentService {
  private postsCollection = 'posts';
  private reelsCollection = 'reels';
  private likesCollection = 'likes';
  private commentsCollection = 'comments';

  // ========== POSTS ==========
  
  // Create post
  async createPost(postData: Omit<FirebasePost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy' | 'shares' | 'views' | 'commentsCount' | 'isArchived' | 'isPrivate'>): Promise<string> {
    try {
      // Remove undefined values to prevent Firebase errors
      const cleanData = Object.fromEntries(
        Object.entries(postData).filter(([_, value]) => value !== undefined)
      );

      const docRef = await addDoc(collection(db, this.postsCollection), {
        ...cleanData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: 0,
        likedBy: [],
        shares: 0,
        views: 0,
        commentsCount: 0,
        isArchived: false,
        isPrivate: false,
      });

      // Update user's posts count
      await this.updateUserPostsCount(postData.userId, 1);
      
      console.log('Post created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  // Get all posts (Real-time feed)
  async getAllPosts(limitCount = 50): Promise<FirebasePost[]> {
    try {
      const postsQuery = query(
        collection(db, this.postsCollection),
        where('isArchived', '==', false),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(postsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirebasePost[];
    } catch (error) {
      console.error('Error getting posts:', error);
      return [];
    }
  }

  // Get user's posts
  async getUserPosts(userId: string): Promise<FirebasePost[]> {
    try {
      const postsQuery = query(
        collection(db, this.postsCollection),
        where('userId', '==', userId),
        where('isArchived', '==', false),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(postsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirebasePost[];
    } catch (error) {
      console.error('Error getting user posts:', error);
      return [];
    }
  }

  // Delete post (Enhanced with cleanup)
  async deletePost(postId: string, userId: string): Promise<void> {
    try {
      // First, get the post data to verify ownership and access media info
      const postRef = doc(db, this.postsCollection, postId);
      const postDoc = await getDoc(postRef);
      
      if (!postDoc.exists()) {
        throw new Error('Post not found');
      }
      
      const post = postDoc.data() as FirebasePost;
      
      // Verify ownership
      if (post.userId !== userId) {
        throw new Error('You can only delete your own posts');
      }
      
      // Delete from MUX if it has MUX asset (video post)
      if (post.muxAssetId) {
        try {
          const { muxService } = await import('./muxService');
          const muxDeleted = await muxService.deleteAsset(post.muxAssetId);
          if (muxDeleted) {
            console.log('MUX asset deleted successfully:', post.muxAssetId);
          } else {
            console.warn('Failed to delete MUX asset:', post.muxAssetId);
          }
        } catch (error) {
          console.error('Error deleting MUX asset:', error);
          // Continue with Firestore deletion even if MUX fails
        }
      }
      
      // Delete all comments associated with this post
      try {
        const commentsQuery = query(
          collection(db, this.commentsCollection),
          where('contentId', '==', postId),
          where('contentType', '==', 'post')
        );
        const commentsSnapshot = await getDocs(commentsQuery);
        
        if (!commentsSnapshot.empty) {
          const deleteCommentPromises = commentsSnapshot.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(deleteCommentPromises);
          console.log(`Deleted ${commentsSnapshot.size} comments for post ${postId}`);
        }
      } catch (error) {
        console.error('Error deleting comments:', error);
        // Continue with post deletion
      }
      
      // Delete all notifications related to this post
      try {
        const notificationsQuery = query(
          collection(db, 'notifications'),
          where('contentId', '==', postId),
          where('contentType', '==', 'post')
        );
        const notificationsSnapshot = await getDocs(notificationsQuery);
        
        if (!notificationsSnapshot.empty) {
          const deleteNotificationPromises = notificationsSnapshot.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(deleteNotificationPromises);
          console.log(`Deleted ${notificationsSnapshot.size} notifications for post ${postId}`);
        }
      } catch (error) {
        console.error('Error deleting notifications:', error);
        // Continue with post deletion
      }
      
      // Finally, delete the post document from Firestore
      await deleteDoc(postRef);
      
      // Update user's posts count
      await this.updateUserPostsCount(userId, -1);
      
      console.log('Post and all associated data deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  // ========== REELS ==========
  
  // Create reel
  async createReel(reelData: Omit<FirebaseReel, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy' | 'shares' | 'views' | 'commentsCount' | 'isArchived' | 'isPrivate'>): Promise<string> {
    try {
      // Remove undefined values to prevent Firebase errors
      const cleanData = Object.fromEntries(
        Object.entries(reelData).filter(([_, value]) => value !== undefined)
      );

      const docRef = await addDoc(collection(db, this.reelsCollection), {
        ...cleanData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: 0,
        likedBy: [],
        shares: 0,
        views: 0,
        commentsCount: 0,
        isArchived: false,
        isPrivate: false,
      });

      // Update user's reels count
      await this.updateUserReelsCount(reelData.userId, 1);
      
      console.log('Reel created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating reel:', error);
      throw error;
    }
  }

  // Get all reels (Real-time feed)
  async getAllReels(limitCount = 50): Promise<FirebaseReel[]> {
    try {
      const reelsQuery = query(
        collection(db, this.reelsCollection),
        where('isArchived', '==', false),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(reelsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirebaseReel[];
    } catch (error) {
      console.error('Error getting reels:', error);
      return [];
    }
  }

  // Get user's reels
  async getUserReels(userId: string): Promise<FirebaseReel[]> {
    try {
      const reelsQuery = query(
        collection(db, this.reelsCollection),
        where('userId', '==', userId),
        where('isArchived', '==', false),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(reelsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirebaseReel[];
    } catch (error) {
      console.error('Error getting user reels:', error);
      return [];
    }
  }

  // Delete reel (Enhanced with MUX cleanup)
  async deleteReel(reelId: string, userId: string): Promise<void> {
    try {
      // First, get the reel data to access MUX asset info
      const reelRef = doc(db, this.reelsCollection, reelId);
      const reelDoc = await getDoc(reelRef);
      
      if (!reelDoc.exists()) {
        throw new Error('Reel not found');
      }
      
      const reel = reelDoc.data() as FirebaseReel;
      
      // Verify ownership
      if (reel.userId !== userId) {
        throw new Error('You can only delete your own reels');
      }
      
      // Delete from MUX if it has MUX asset
      if (reel.muxAssetId) {
        try {
          const { muxService } = await import('./muxService');
          const muxDeleted = await muxService.deleteAsset(reel.muxAssetId);
          if (muxDeleted) {
            console.log('MUX asset deleted successfully:', reel.muxAssetId);
          } else {
            console.warn('Failed to delete MUX asset:', reel.muxAssetId);
          }
        } catch (error) {
          console.error('Error deleting MUX asset:', error);
          // Continue with Firestore deletion even if MUX fails
        }
      }
      
      // Delete all comments associated with this reel
      try {
        const commentsQuery = query(
          collection(db, this.commentsCollection),
          where('contentId', '==', reelId),
          where('contentType', '==', 'reel')
        );
        const commentsSnapshot = await getDocs(commentsQuery);
        
        if (!commentsSnapshot.empty) {
          const deleteCommentPromises = commentsSnapshot.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(deleteCommentPromises);
          console.log(`Deleted ${commentsSnapshot.size} comments for reel ${reelId}`);
        }
      } catch (error) {
        console.error('Error deleting comments:', error);
        // Continue with reel deletion
      }
      
      // Delete all notifications related to this reel
      try {
        const notificationsQuery = query(
          collection(db, 'notifications'),
          where('contentId', '==', reelId),
          where('contentType', '==', 'reel')
        );
        const notificationsSnapshot = await getDocs(notificationsQuery);
        
        if (!notificationsSnapshot.empty) {
          const deleteNotificationPromises = notificationsSnapshot.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(deleteNotificationPromises);
          console.log(`Deleted ${notificationsSnapshot.size} notifications for reel ${reelId}`);
        }
      } catch (error) {
        console.error('Error deleting notifications:', error);
        // Continue with reel deletion
      }
      
      // Finally, delete the reel document from Firestore
      await deleteDoc(reelRef);
      
      // Update user's reels count
      await this.updateUserReelsCount(userId, -1);
      
      console.log('Reel and all associated data deleted successfully');
    } catch (error) {
      console.error('Error deleting reel:', error);
      throw error;
    }
  }

  // ========== INTERACTIONS ==========
  
  // Like/Unlike post
  async togglePostLike(postId: string, userId: string): Promise<boolean> {
    try {
      const postRef = doc(db, this.postsCollection, postId);
      const postDoc = await getDoc(postRef);
      
      if (!postDoc.exists()) throw new Error('Post not found');
      
      const post = postDoc.data() as FirebasePost;
      const isLiked = post.likedBy.includes(userId);
      
      if (isLiked) {
        // Unlike
        await updateDoc(postRef, {
          likes: increment(-1),
          likedBy: post.likedBy.filter(id => id !== userId),
          updatedAt: serverTimestamp()
        });
        return false;
      } else {
        // Like
        await updateDoc(postRef, {
          likes: increment(1),
          likedBy: [...post.likedBy, userId],
          updatedAt: serverTimestamp()
        });
        return true;
      }
    } catch (error) {
      console.error('Error toggling post like:', error);
      throw error;
    }
  }

  // Like/Unlike reel
  async toggleReelLike(reelId: string, userId: string): Promise<boolean> {
    try {
      const reelRef = doc(db, this.reelsCollection, reelId);
      const reelDoc = await getDoc(reelRef);
      
      if (!reelDoc.exists()) throw new Error('Reel not found');
      
      const reel = reelDoc.data() as FirebaseReel;
      const isLiked = reel.likedBy.includes(userId);
      
      if (isLiked) {
        // Unlike
        await updateDoc(reelRef, {
          likes: increment(-1),
          likedBy: reel.likedBy.filter(id => id !== userId),
          updatedAt: serverTimestamp()
        });
        return false;
      } else {
        // Like
        await updateDoc(reelRef, {
          likes: increment(1),
          likedBy: [...reel.likedBy, userId],
          updatedAt: serverTimestamp()
        });
        return true;
      }
    } catch (error) {
      console.error('Error toggling reel like:', error);
      throw error;
    }
  }

  // Update view count
  async incrementViews(contentId: string, type: 'post' | 'reel'): Promise<void> {
    try {
      const collection_name = type === 'post' ? this.postsCollection : this.reelsCollection;
      const contentRef = doc(db, collection_name, contentId);
      
      await updateDoc(contentRef, {
        views: increment(1),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  }

  // ========== HELPER METHODS ==========
  
  private async updateUserPostsCount(userId: string, increment_value: number): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        postsCount: increment(increment_value),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user posts count:', error);
    }
  }

  private async updateUserReelsCount(userId: string, increment_value: number): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        reelsCount: increment(increment_value),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user reels count:', error);
    }
  }

  // Real-time feed listener
  subscribeToFeed(callback: (posts: FirebasePost[]) => void) {
    const postsQuery = query(
      collection(db, this.postsCollection),
      where('isArchived', '==', false),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(postsQuery, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirebasePost[];
      callback(posts);
    });
  }

  // Real-time reels listener
  subscribeToReels(callback: (reels: FirebaseReel[]) => void) {
    const reelsQuery = query(
      collection(db, this.reelsCollection),
      where('isArchived', '==', false),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(reelsQuery, (snapshot) => {
      const reels = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirebaseReel[];
      callback(reels);
    });
  }

  // ========== VIDEO STATUS REFRESH ==========
  
  // Refresh video status from MUX and update the reel document
  async refreshReelVideoStatus(reelId: string): Promise<boolean> {
    try {
      console.log('🔄 Refreshing video status for reel:', reelId);
      
      // Get the current reel document
      const reelDoc = await getDoc(doc(db, this.reelsCollection, reelId));
      if (!reelDoc.exists()) {
        console.error('Reel not found:', reelId);
        return false;
      }
      
      const reelData = reelDoc.data() as FirebaseReel;
      if (!reelData.muxAssetId) {
        console.error('No MUX asset ID found for reel:', reelId);
        return false;
      }
      
      // Import MUX service dynamically to avoid circular dependency
      const { muxService } = await import('./muxService');
      
      // First try to get the actual asset ID if we currently have an upload ID
      let actualAssetId = reelData.muxAssetId;
      let actualPlaybackId = reelData.muxPlaybackId;
      
      // Check if we need to convert upload ID to asset ID
      if (reelData.muxAssetId === reelData.muxPlaybackId) {
        console.log('🔄 Converting upload ID to asset ID...');
        const convertedAssetId = await muxService.getAssetIdFromUpload(reelData.muxAssetId);
        
        if (convertedAssetId && convertedAssetId !== reelData.muxAssetId) {
          actualAssetId = convertedAssetId;
          console.log('✅ Converted upload ID to asset ID:', actualAssetId);
        }
      }
      
      // Check current status from MUX using the actual asset ID
      const playbackUrl = await muxService.getPlaybackUrl(actualAssetId);
      
      if (playbackUrl) {
        // Extract playback ID from URL
        const playbackId = playbackUrl.split('/').pop()?.replace('.m3u8', '');
        
        if (playbackId) {
          // Update the reel with the proper asset ID and playback ID
          const updateData: any = {
            videoUrl: playbackUrl,
            updatedAt: serverTimestamp()
          };
          
          // Only update asset ID if it changed (upload ID -> asset ID conversion)
          if (actualAssetId !== reelData.muxAssetId) {
            updateData.muxAssetId = actualAssetId;
          }
          
          // Only update playback ID if it's different from asset ID
          if (playbackId !== actualAssetId) {
            updateData.muxPlaybackId = playbackId;
          }
          
          await updateDoc(doc(db, this.reelsCollection, reelId), updateData);
          
          console.log('✅ Updated reel video status:', reelId);
          console.log('   Asset ID:', actualAssetId);
          console.log('   Playback ID:', playbackId);
          console.log('   URL:', playbackUrl);
          return true;
        }
      }
      
      console.log('⏳ Video still processing for reel:', reelId);
      return false;
    } catch (error) {
      console.error('Error refreshing video status:', error);
      return false;
    }
  }
}

// ========== STORY SERVICE METHODS ==========

class StoryService {
  async createStory(story: Omit<FirebaseStory, 'id' | 'createdAt' | 'expiresAt' | 'views' | 'viewedBy'>): Promise<string> {
    try {
      const storyRef = doc(collection(db, 'stories'));
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      
      const storyData: FirebaseStory = {
        ...story,
        id: storyRef.id,
        views: 0,
        viewedBy: [],
        createdAt: serverTimestamp(),
        expiresAt: expiresAt,
      };

      await setDoc(storyRef, storyData);
      return storyRef.id;
    } catch (error) {
      console.error('Error creating story:', error);
      throw error;
    }
  }

  async getStoriesForUser(userId: string): Promise<StoryGroup[]> {
    try {
      // Get active stories (not expired)
      const now = new Date();
      const storiesQuery = query(
        collection(db, 'stories'),
        where('expiresAt', '>', now),
        orderBy('expiresAt'),
        orderBy('createdAt', 'desc')
      );

      const storiesSnapshot = await getDocs(storiesQuery);
      const stories = storiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirebaseStory[];

      // Group stories by user
      const storyGroups: { [userId: string]: StoryGroup } = {};
      stories.forEach(story => {
        if (!storyGroups[story.userId]) {
          storyGroups[story.userId] = {
            userId: story.userId,
            username: story.username,
            userDisplayName: story.userDisplayName,
            userName: story.username, // For backward compatibility
            userAvatar: story.userAvatar,
            stories: [],
            hasUnseenStories: false,
            hasUnviewed: false // For backward compatibility
          };
        }
        storyGroups[story.userId].stories.push(story);
        
        // Check if user has viewed this story
        if (!story.viewedBy.includes(userId)) {
          storyGroups[story.userId].hasUnseenStories = true;
          storyGroups[story.userId].hasUnviewed = true; // For backward compatibility
        }
      });

      return Object.values(storyGroups);
    } catch (error) {
      console.error('Error getting stories:', error);
      return [];
    }
  }

  async getStoriesGroupedByUser(): Promise<StoryGroup[]> {
    // For now, just return empty array - could be improved to group all stories
    return [];
  }

  async cleanupExpiredStories(): Promise<void> {
    try {
      const now = new Date();
      const expiredQuery = query(
        collection(db, 'stories'),
        where('expiresAt', '<', now)
      );

      const expiredSnapshot = await getDocs(expiredQuery);
      const deletePromises = expiredSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      console.log(`Cleaned up ${expiredSnapshot.size} expired stories`);
    } catch (error) {
      console.error('Error cleaning up expired stories:', error);
    }
  }
}

// ========== COMMENT SERVICE METHODS ==========

class CommentService {
  async addComment(comment: Omit<FirebaseComment, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy' | 'replies'>): Promise<string> {
    try {
      const commentRef = doc(collection(db, 'comments'));
      
      const commentData: FirebaseComment = {
        ...comment,
        id: commentRef.id,
        likes: 0,
        likedBy: [],
        replies: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(commentRef, commentData);
      
      // Update comment count on the content
      const contentCollection = comment.contentType === 'post' ? 'posts' : 'reels';
      const contentRef = doc(db, contentCollection, comment.contentId);
      await updateDoc(contentRef, {
        commentsCount: increment(1)
      });

      return commentRef.id;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  async getComments(contentId: string, contentType: 'post' | 'reel'): Promise<FirebaseComment[]> {
    try {
      const commentsQuery = query(
        collection(db, 'comments'),
        where('contentId', '==', contentId),
        where('contentType', '==', contentType),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(commentsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirebaseComment[];
    } catch (error) {
      console.error('Error getting comments:', error);
      return [];
    }
  }

  async getCommentCount(contentId: string, contentType: 'post' | 'reel'): Promise<number> {
    try {
      const commentsQuery = query(
        collection(db, 'comments'),
        where('contentId', '==', contentId),
        where('contentType', '==', contentType)
      );

      const snapshot = await getDocs(commentsQuery);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting comment count:', error);
      return 0;
    }
  }

  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    try {
      const commentRef = doc(db, 'comments', commentId);
      const commentDoc = await getDoc(commentRef);
      
      if (commentDoc.exists() && commentDoc.data().userId === userId) {
        await deleteDoc(commentRef);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  }

  async toggleCommentLike(commentId: string, userId: string): Promise<boolean> {
    try {
      const commentRef = doc(db, 'comments', commentId);
      const commentDoc = await getDoc(commentRef);
      
      if (commentDoc.exists()) {
        const data = commentDoc.data();
        const likedBy = data.likedBy || [];
        const isLiked = likedBy.includes(userId);
        
        if (isLiked) {
          await updateDoc(commentRef, {
            likedBy: likedBy.filter((id: string) => id !== userId),
            likes: increment(-1)
          });
          return false;
        } else {
          await updateDoc(commentRef, {
            likedBy: [...likedBy, userId],
            likes: increment(1)
          });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error toggling comment like:', error);
      return false;
    }
  }
}

// ========== NOTIFICATION SERVICE METHODS ==========

class NotificationService {
  async createNotification(notification: Omit<FirebaseNotification, 'id' | 'createdAt'>): Promise<string> {
    try {
      const notificationRef = doc(collection(db, 'notifications'));
      
      const notificationData: FirebaseNotification = {
        ...notification,
        id: notificationRef.id,
        createdAt: serverTimestamp(),
      };

      await setDoc(notificationRef, notificationData);
      return notificationRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async getUserNotifications(userId: string): Promise<FirebaseNotification[]> {
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('toUserId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(notificationsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirebaseNotification[];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        isRead: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }
}

// Export service instances
export const storyService = new StoryService();
export const commentService = new CommentService();
export const notificationService = new NotificationService();

export const firebaseContentService = new FirebaseContentService();
export default firebaseContentService;
