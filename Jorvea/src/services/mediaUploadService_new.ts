import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../config/firebase';
import { muxService } from './muxService';

export interface MediaFile {
  uri: string;
  type: 'image' | 'video';
  mimeType: string;
  size: number;
  duration?: number; // For videos
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  mediaUrl?: string;
  playbackId?: string;
  assetId?: string;
  thumbnailUrl?: string;
  error?: string;
}

class MediaUploadService {
  // Request camera and media library permissions
  async requestPermissions(): Promise<boolean> {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      return cameraPermission.granted && mediaLibraryPermission.granted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  // Pick image from library
  async pickImage(): Promise<MediaFile | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Camera and media library permissions are required');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1], // Square for posts, [9, 16] for stories/reels
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        
        return {
          uri: asset.uri,
          type: 'image',
          mimeType: 'image/jpeg',
          size: fileInfo.exists ? (fileInfo as any).size || 0 : 0,
        };
      }

      return null;
    } catch (error) {
      console.error('Error picking image:', error);
      throw error;
    }
  }

  // Pick video from library
  async pickVideo(): Promise<MediaFile | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Camera and media library permissions are required');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'videos',
        allowsEditing: true,
        videoMaxDuration: 60, // 60 seconds max for reels
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        
        return {
          uri: asset.uri,
          type: 'video',
          mimeType: 'video/mp4',
          size: fileInfo.exists ? (fileInfo as any).size || 0 : 0,
          duration: asset.duration || undefined,
        };
      }

      return null;
    } catch (error) {
      console.error('Error picking video:', error);
      throw error;
    }
  }

  // Take photo with camera
  async takePhoto(): Promise<MediaFile | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Camera permissions are required');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        
        return {
          uri: asset.uri,
          type: 'image',
          mimeType: 'image/jpeg',
          size: fileInfo.exists ? (fileInfo as any).size || 0 : 0,
        };
      }

      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      throw error;
    }
  }

  // Record video with camera
  async recordVideo(): Promise<MediaFile | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Camera permissions are required');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'videos',
        allowsEditing: true,
        videoMaxDuration: 60,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        
        return {
          uri: asset.uri,
          type: 'video',
          mimeType: 'video/mp4',
          size: fileInfo.exists ? (fileInfo as any).size || 0 : 0,
          duration: asset.duration || undefined,
        };
      }

      return null;
    } catch (error) {
      console.error('Error recording video:', error);
      throw error;
    }
  }

  // Upload media to appropriate service: Images -> Firebase Storage, Videos -> MUX
  async uploadMedia(
    mediaFile: MediaFile, 
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      console.log('Starting media upload:', mediaFile.type);
      
      if (mediaFile.type === 'image') {
        return await this.uploadImageToFirebase(mediaFile, onProgress);
      }

      if (mediaFile.type === 'video') {
        return await this.uploadVideoToMux(mediaFile, onProgress);
      }

      throw new Error('Unsupported media type');
    } catch (error) {
      console.error('Error uploading media:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  // Upload image to Firebase Storage
  private async uploadImageToFirebase(
    mediaFile: MediaFile,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      console.log('Uploading image to Firebase Storage...');
      
      // Read file as blob
      const response = await fetch(mediaFile.uri);
      const blob = await response.blob();
      
      // Create a unique filename
      const filename = `images/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const storageRef = ref(storage, filename);
      
      // Upload to Firebase Storage
      const uploadTask = await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(uploadTask.ref);
      
      console.log('Image uploaded successfully to Firebase');
      
      return {
        success: true,
        mediaUrl: downloadURL,
      };
    } catch (error) {
      console.error('Error uploading image to Firebase:', error);
      throw error;
    }
  }

  // Upload video to MUX
  private async uploadVideoToMux(
    mediaFile: MediaFile,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      console.log('Uploading video to Mux...');
      
      // Check if muxService is configured
      if (!muxService.isConfigured()) {
        console.error('MuxService not properly initialized - check your MUX credentials in .env');
        throw new Error('MUX service not configured');
      }
      
      // Upload video to MUX
      const assetId = await muxService.uploadVideo(mediaFile.uri);
      
      console.log('Video uploaded to MUX with asset ID:', assetId);
      
      // Try to get playback URL (may be null if still processing)
      const playbackUrl = await muxService.getPlaybackUrl(assetId);
      
      return {
        success: true,
        assetId: assetId,
        mediaUrl: playbackUrl || `processing-${assetId}`,
        playbackId: assetId, // MUX asset ID serves as playback ID reference
      };
    } catch (error) {
      console.error('Error uploading video to MUX:', error);
      throw error;
    }
  }

  // Check if video is ready for playback
  async checkVideoStatus(assetId: string): Promise<{ ready: boolean; playbackUrl?: string }> {
    try {
      const playbackUrl = await muxService.getPlaybackUrl(assetId);
      return {
        ready: playbackUrl !== null,
        playbackUrl: playbackUrl || undefined,
      };
    } catch (error) {
      console.error('Error checking video status:', error);
      return { ready: false };
    }
  }

  // Delete media from storage
  async deleteMedia(assetId: string, type: 'image' | 'video'): Promise<boolean> {
    try {
      if (type === 'video') {
        return await muxService.deleteAsset(assetId);
      }
      
      // For images stored in Firebase, you would need to implement deletion
      // This would require storing the storage path/reference
      console.log('Image deletion not implemented yet');
      return true;
    } catch (error) {
      console.error('Error deleting media:', error);
      return false;
    }
  }
}

export const mediaUploadService = new MediaUploadService();
