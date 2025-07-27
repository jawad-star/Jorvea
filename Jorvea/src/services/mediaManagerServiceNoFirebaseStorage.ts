import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { mediaUploadService } from './mediaUploadServiceNoFirebaseStorage';

export interface MediaContent {
  id?: string;
  type: 'image' | 'video';
  title: string;
  caption?: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  assetId?: string; // For MUX videos
  playbackId?: string; // For MUX videos
  userId: string;
  createdAt: Timestamp;
  tags?: string[];
  isPublic: boolean;
  views: number;
  likes: number;
  fileSize?: number;
  duration?: number; // For videos
  isProcessing?: boolean; // For MUX videos that are still being processed
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

class MediaManagerService {
  // Upload and save media content to Firestore only (no Firebase Storage)
  async uploadAndSaveContent(
    mediaFile: any,
    title: string,
    caption: string = '',
    userId: string,
    tags: string[] = [],
    isPublic: boolean = true,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<MediaContent> {
    try {
      console.log('Starting upload and save process...');
      
      // Step 1: Upload media file (video to MUX, image to alternative storage)
      const uploadResult = await mediaUploadService.uploadMedia(mediaFile, onProgress);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }
      
      console.log('Upload successful:', uploadResult);
      
      // Step 2: Prepare content data for Firestore
      const contentData: Omit<MediaContent, 'id'> = {
        type: mediaFile.type,
        title,
        caption,
        mediaUrl: uploadResult.mediaUrl!,
        thumbnailUrl: uploadResult.thumbnailUrl,
        assetId: uploadResult.assetId,
        playbackId: uploadResult.playbackId,
        userId,
        createdAt: serverTimestamp() as Timestamp,
        tags,
        isPublic,
        views: 0,
        likes: 0,
        fileSize: mediaFile.size,
        duration: mediaFile.duration,
        isProcessing: mediaFile.type === 'video', // Videos might still be processing on MUX
      };
      
      // Step 3: Save metadata to Firestore
      console.log('Saving content metadata to Firestore...');
      const docRef = await addDoc(collection(firestore, 'content'), contentData);
      
      console.log('Content saved to Firestore with ID:', docRef.id);
      
      return {
        id: docRef.id,
        ...contentData,
        createdAt: new Timestamp(Math.floor(Date.now() / 1000), 0)
      };
    } catch (error) {
      console.error('Error in uploadAndSaveContent:', error);
      throw error;
    }
  }

  // Pick and upload image
  async pickAndUploadImage(
    title: string,
    caption: string = '',
    userId: string,
    tags: string[] = [],
    isPublic: boolean = true,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<MediaContent> {
    try {
      console.log('Picking image...');
      const mediaFile = await mediaUploadService.pickImage();
      
      if (!mediaFile) {
        throw new Error('No image selected');
      }
      
      return await this.uploadAndSaveContent(
        mediaFile,
        title,
        caption,
        userId,
        tags,
        isPublic,
        onProgress
      );
    } catch (error) {
      console.error('Error picking and uploading image:', error);
      throw error;
    }
  }

  // Pick and upload video
  async pickAndUploadVideo(
    title: string,
    caption: string = '',
    userId: string,
    tags: string[] = [],
    isPublic: boolean = true,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<MediaContent> {
    try {
      console.log('Picking video...');
      const mediaFile = await mediaUploadService.pickVideo();
      
      if (!mediaFile) {
        throw new Error('No video selected');
      }
      
      return await this.uploadAndSaveContent(
        mediaFile,
        title,
        caption,
        userId,
        tags,
        isPublic,
        onProgress
      );
    } catch (error) {
      console.error('Error picking and uploading video:', error);
      throw error;
    }
  }

  // Take photo and upload
  async takePhotoAndUpload(
    title: string,
    caption: string = '',
    userId: string,
    tags: string[] = [],
    isPublic: boolean = true,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<MediaContent> {
    try {
      console.log('Taking photo...');
      const mediaFile = await mediaUploadService.takePhoto();
      
      if (!mediaFile) {
        throw new Error('No photo taken');
      }
      
      return await this.uploadAndSaveContent(
        mediaFile,
        title,
        caption,
        userId,
        tags,
        isPublic,
        onProgress
      );
    } catch (error) {
      console.error('Error taking and uploading photo:', error);
      throw error;
    }
  }

  // Record video and upload
  async recordVideoAndUpload(
    title: string,
    caption: string = '',
    userId: string,
    tags: string[] = [],
    isPublic: boolean = true,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<MediaContent> {
    try {
      console.log('Recording video...');
      const mediaFile = await mediaUploadService.recordVideo();
      
      if (!mediaFile) {
        throw new Error('No video recorded');
      }
      
      return await this.uploadAndSaveContent(
        mediaFile,
        title,
        caption,
        userId,
        tags,
        isPublic,
        onProgress
      );
    } catch (error) {
      console.error('Error recording and uploading video:', error);
      throw error;
    }
  }

  // Check if a video is ready for playback (for MUX videos)
  async checkVideoStatus(assetId: string): Promise<{ ready: boolean; playbackUrl?: string }> {
    return mediaUploadService.checkVideoStatus(assetId);
  }

  // Delete content and associated media
  async deleteContent(content: MediaContent): Promise<boolean> {
    try {
      // Delete from media storage (MUX for videos, nothing for base64 images)
      if (content.assetId) {
        await mediaUploadService.deleteMedia(content.assetId, content.type);
      }
      
      // Delete metadata from Firestore
      if (content.id) {
        const { deleteDoc, doc } = await import('firebase/firestore');
        await deleteDoc(doc(firestore, 'content', content.id));
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting content:', error);
      return false;
    }
  }

  // Get routing information for debugging
  getRoutingInfo(mediaType: 'image' | 'video'): string {
    if (mediaType === 'video') {
      return 'Video → MUX (streaming service)';
    } else {
      return 'Image → Base64 in Firestore (no external storage)';
    }
  }
}

export const mediaManagerService = new MediaManagerService();
