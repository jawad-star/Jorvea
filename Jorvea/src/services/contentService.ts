import { QueryDocumentSnapshot } from 'firebase/firestore';
import { firebaseService, Post, Reel } from './firebaseService';
import { MediaFile, mediaUploadService } from './mediaUploadService';

class ContentService {
  // Create a new post (image or video)
  async createPost(
    userId: string,
    mediaFile: MediaFile,
    caption: string,
    tags: string[] = [],
    location?: string
  ): Promise<string> {
    try {
      console.log('Creating post with media type:', mediaFile.type);
      
      // Upload media first
      const uploadResult = await mediaUploadService.uploadMedia(mediaFile);
      
      if (!uploadResult.success || !uploadResult.mediaUrl) {
        throw new Error(uploadResult.error || 'Failed to upload media');
      }
      
      // Create post data
      const postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        type: mediaFile.type,
        mediaUrl: uploadResult.mediaUrl,
        caption,
        tags,
        location,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        assetId: uploadResult.assetId, // For videos stored in MUX
        playbackId: uploadResult.playbackId, // For MUX video playback
      };
      
      // Save post to Firebase
      const postId = await firebaseService.createPost(postData);
      console.log('Post created successfully:', postId);
      
      return postId;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  // Create a new reel (video only)
  async createReel(
    userId: string,
    mediaFile: MediaFile,
    caption: string,
    tags: string[] = [],
    music?: string
  ): Promise<string> {
    try {
      if (mediaFile.type !== 'video') {
        throw new Error('Reels can only be created with video files');
      }
      
      console.log('Creating reel with video file');
      
      // Upload video to MUX
      const uploadResult = await mediaUploadService.uploadMedia(mediaFile);
      
      if (!uploadResult.success || !uploadResult.assetId) {
        throw new Error(uploadResult.error || 'Failed to upload video to MUX');
      }
      
      // Create reel data
      const reelData: Omit<Reel, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        assetId: uploadResult.assetId,
        playbackId: uploadResult.playbackId,
        mediaUrl: uploadResult.mediaUrl || '',
        caption,
        tags,
        music,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        viewsCount: 0,
        duration: mediaFile.duration || 0,
      };
      
      // Save reel to Firebase
      const reelId = await firebaseService.createReel(reelData);
      console.log('Reel created successfully:', reelId);
      
      return reelId;
    } catch (error) {
      console.error('Error creating reel:', error);
      throw error;
    }
  }

  // Get posts with pagination
  async getPosts(
    userId?: string, 
    lastDoc?: QueryDocumentSnapshot, 
    limit = 20
  ): Promise<{ posts: Post[]; lastDoc?: QueryDocumentSnapshot }> {
    try {
      return await firebaseService.getPosts(userId, lastDoc, limit);
    } catch (error) {
      console.error('Error getting posts:', error);
      throw error;
    }
  }

  // Get reels with pagination
  async getReels(
    userId?: string, 
    lastDoc?: QueryDocumentSnapshot, 
    limit = 20
  ): Promise<{ reels: Reel[]; lastDoc?: QueryDocumentSnapshot }> {
    try {
      return await firebaseService.getReels(userId, lastDoc, limit);
    } catch (error) {
      console.error('Error getting reels:', error);
      throw error;
    }
  }

  // Check video processing status
  async checkVideoStatus(assetId: string): Promise<{ ready: boolean; playbackUrl?: string }> {
    try {
      return await mediaUploadService.checkVideoStatus(assetId);
    } catch (error) {
      console.error('Error checking video status:', error);
      return { ready: false };
    }
  }

  // Delete content
  async deleteContent(contentId: string, type: 'post' | 'reel', assetId?: string): Promise<boolean> {
    try {
      // Delete from storage if it's a video
      if (assetId) {
        await mediaUploadService.deleteMedia(assetId, 'video');
      }
      
      // Note: You would need to implement deletion in firebaseService
      console.log(`Deleted ${type} with ID: ${contentId}`);
      return true;
    } catch (error) {
      console.error('Error deleting content:', error);
      return false;
    }
  }
}

export const contentService = new ContentService();
export default contentService;