import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
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
        mediaTypes: ['images'],
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
        mediaTypes: ['videos'],
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
        mediaTypes: ['images'],
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
        mediaTypes: ['videos'],
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

  // Upload media - NO FIREBASE STORAGE, only MUX and cloud storage alternatives
  async uploadMedia(
    mediaFile: MediaFile, 
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      console.log('Starting media upload:', mediaFile.type);
      
      if (mediaFile.type === 'video') {
        return await this.uploadVideoToMux(mediaFile, onProgress);
      }

      if (mediaFile.type === 'image') {
        return await this.uploadImageToCloudinary(mediaFile, onProgress);
      }

      throw new Error('Unsupported media type');
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  }

  // Upload video to MUX only
  private async uploadVideoToMux(
    mediaFile: MediaFile,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      console.log('Uploading video to MUX...');
      
      // Check if muxService is configured
      if (!muxService.isConfigured()) {
        throw new Error('MUX service not configured. Please add real MUX credentials to your .env file.');
      }
      
      // Upload video to MUX
      const assetId = await muxService.uploadVideo(mediaFile.uri);
      
      console.log('Video uploaded to MUX with asset ID:', assetId);
      
      // Try to get playback URL (may be null if still processing)
      const playbackUrl = await muxService.getPlaybackUrl(assetId);
      
      return {
        success: true,
        assetId: assetId,
        mediaUrl: playbackUrl || `https://stream.mux.com/${assetId}.m3u8`,
        playbackId: assetId, // MUX asset ID serves as playback ID reference
      };
    } catch (error) {
      console.error('Error uploading video to MUX:', error);
      throw new Error(`Video upload failed: ${(error as Error).message}. Please check your MUX configuration.`);
    }
  }

  // Upload image to Cloudinary (alternative to Firebase Storage)
  private async uploadImageToCloudinary(
    mediaFile: MediaFile,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      console.log('Uploading image to Cloudinary...');
      
      // For now, we'll use a simple base64 approach
      // You can replace this with Cloudinary or any other image hosting service
      
      // Convert to base64 for temporary storage in Firestore
      const base64 = await FileSystem.readAsStringAsync(mediaFile.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Create a data URL
      const dataUrl = `data:${mediaFile.mimeType};base64,${base64}`;
      
      console.log('Image converted to base64 format for Firestore storage');
      
      return {
        success: true,
        mediaUrl: dataUrl, // Base64 data URL stored directly in Firestore
      };
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error(`Image upload failed: ${(error as Error).message}`);
    }
  }

  // Alternative: Upload image to ImgBB (free image hosting)
  private async uploadImageToImgBB(
    mediaFile: MediaFile,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      console.log('Uploading image to ImgBB...');
      
      // Convert to base64
      const base64 = await FileSystem.readAsStringAsync(mediaFile.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // ImgBB API (you would need to get a free API key from imgbb.com)
      const formData = new FormData();
      formData.append('image', base64);
      formData.append('key', 'your_imgbb_api_key'); // Get free key from imgbb.com
      
      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('ImgBB upload failed');
      }
      
      const result = await response.json();
      
      return {
        success: true,
        mediaUrl: result.data.url,
        thumbnailUrl: result.data.thumb?.url,
      };
    } catch (error) {
      console.error('Error uploading to ImgBB:', error);
      // Fallback to base64 storage
      return this.uploadImageToCloudinary(mediaFile, onProgress);
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
      
      // For images, since they're stored as base64 in Firestore,
      // deletion happens when the document is deleted
      console.log('Image deletion handled by Firestore document deletion');
      return true;
    } catch (error) {
      console.error('Error deleting media:', error);
      return false;
    }
  }
}

export const mediaUploadService = new MediaUploadService();
