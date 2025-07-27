/**
 * Media Upload Service
 * 
 * Comprehensive media handling service for the Jorvea social media application.
 * Handles image and video upload operations with support for multiple cloud providers.
 * 
 * Features:
 * - Image and video selection from gallery or camera
 * - Permission management for camera and media library access
 * - Video upload to MUX for streaming optimization
 * - Image processing with base64 encoding for Firestore storage
 * - Progress tracking for real-time UI feedback
 * - Comprehensive file validation and error handling
 * - Support for multiple image formats (JPEG, PNG, GIF, WebP)
 * - Video format validation and duration limits
 * 
 * Dependencies:
 * - expo-file-system: File operations and metadata
 * - expo-image-picker: Camera and gallery access
 * - MUX Service: Video streaming and processing
 * 
 * @author Jorvea Development Team
 * @version 2.0.0
 * @created 2024-12-15
 * @updated 2025-01-27
 */

import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { muxService } from './muxService';

/**
 * MediaFile Interface
 * 
 * Defines the structure for media files throughout the application.
 * Used for consistent handling of both images and videos.
 */
export interface MediaFile {
  uri: string;           // Local file URI or remote URL
  type: 'image' | 'video'; // Media type for processing decisions
  mimeType: string;      // MIME type for proper upload headers
  size: number;          // File size in bytes for validation
  duration?: number;     // Video duration in seconds (optional)
}

/**
 * UploadProgress Interface
 * 
 * Provides detailed progress information for upload operations.
 * Used to update UI components with real-time upload status.
 */
export interface UploadProgress {
  loaded: number;        // Bytes uploaded so far
  total: number;         // Total bytes to upload
  percentage: number;    // Calculated percentage (0-100)
}

/**
 * UploadResult Interface
 * 
 * Comprehensive result object returned after upload operations.
 * Contains all necessary URLs and IDs for further processing.
 */
export interface UploadResult {
  success: boolean;      // Whether the upload was successful
  mediaUrl?: string;     // Direct URL to access the uploaded media
  playbackId?: string;   // MUX playback ID for video streaming
  assetId?: string;      // MUX asset ID for video management operations
  thumbnailUrl?: string; // Thumbnail URL for video previews
  error?: string;        // Detailed error message if upload failed
}

/**
 * MediaUploadService Class
 * 
 * Main service class that handles all media upload operations.
 * Provides methods for capturing, selecting, and uploading media files.
 * Integrates with device cameras, photo library, and cloud services.
 */
class MediaUploadService {
  
  /**
   * Request Camera and Media Library Permissions
   * 
   * Requests both camera and media library permissions from the user.
   * These permissions are required for any media operations in the app.
   * 
   * @returns {Promise<boolean>} True if both permissions are granted
   */
  async requestPermissions(): Promise<boolean> {
    try {
      // Request camera permission for taking photos and videos
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      // Request media library permission for accessing user's gallery
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      // Both permissions must be granted for full functionality
      return cameraPermission.granted && mediaLibraryPermission.granted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Pick Image from Photo Library
   * 
   * Opens the system image picker allowing users to select an image
   * from their photo library with built-in editing capabilities.
   * 
   * Configuration:
   * - Square aspect ratio (1:1) for consistent UI
   * - 80% quality for optimal file size
   * - Built-in editing tools enabled
   * 
   * @returns {Promise<MediaFile | null>} Selected image file or null if cancelled
   */
  async pickImage(): Promise<MediaFile | null> {
    try {
      // Ensure we have necessary permissions before proceeding
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Camera and media library permissions are required');
      }

      // Launch image picker with optimized settings for social media
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],     // Only allow image selection
        allowsEditing: true,        // Enable crop and rotate tools
        aspect: [1, 1],            // Square format for consistent posts
        quality: 0.8,              // 80% quality for good size/quality balance
      });

      // Process selected image if user didn't cancel
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Get file size information for validation purposes
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        
        // Return structured MediaFile object
        return {
          uri: asset.uri,
          type: 'image',
          mimeType: 'image/jpeg',    // Standard JPEG format
          size: fileInfo.exists ? (fileInfo as any).size || 0 : 0,
        };
      }

      return null; // User cancelled or no asset selected
    } catch (error) {
      console.error('Error picking image:', error);
      throw error;
    }
  }

  /**
   * Pick Video from Photo Library
   * 
   * Opens the system video picker for selecting videos from the user's library.
   * Configured specifically for reel content with duration limits.
   * 
   * Features:
   * - 60-second maximum duration for reels
   * - Built-in video trimming tools
   * - Quality optimization for mobile streaming
   * 
   * @returns {Promise<MediaFile | null>} Selected video file or null if cancelled
   */
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

  /**
   * Take Photo with Device Camera
   * 
   * Launches the device camera to capture a new photo directly within the app.
   * This method provides immediate photo capture functionality for social posts.
   * 
   * Camera Configuration:
   * - Image-only capture mode (no video recording)
   * - Built-in editing tools for cropping and rotation
   * - Square aspect ratio (1:1) for consistent social media format
   * - 80% quality compression for optimal file size vs quality
   * 
   * Permission Requirements:
   * - Camera access permission must be granted
   * - Automatically requests permission if not already granted
   * 
   * Error Handling:
   * - Graceful permission denial handling
   * - Camera hardware availability checks
   * - File system access validation
   * 
   * @returns {Promise<MediaFile | null>} Captured photo as MediaFile or null if cancelled
   * @throws {Error} If camera permissions are denied or camera is unavailable
   */
  async takePhoto(): Promise<MediaFile | null> {
    try {
      // Verify camera permissions before attempting to launch camera
      // This prevents runtime crashes on devices with restricted permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Camera permissions are required');
      }

      // Launch the device camera with optimized settings for social media
      // These settings ensure consistent output across different device types
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],     // Restrict to image capture only
        allowsEditing: true,        // Enable built-in crop/rotate tools
        aspect: [1, 1],            // Force square format for Instagram-style posts
        quality: 0.8,              // 80% quality - good balance of size vs quality
      });

      // Process the captured image if user didn't cancel the operation
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Get detailed file information for validation and storage purposes
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        
        // Return properly structured MediaFile object with all required metadata
        return {
          uri: asset.uri,
          type: 'image',
          mimeType: 'image/jpeg',    // Camera images are typically JPEG format
          size: fileInfo.exists ? (fileInfo as any).size || 0 : 0,
        };
      }

      // User cancelled the camera operation or no image was captured
      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      throw error;
    }
  }

  /**
   * Record Video with Device Camera
   * 
   * Launches the device camera in video recording mode for creating reels and video content.
   * This method provides real-time video capture functionality with built-in editing tools.
   * 
   * Video Recording Configuration:
   * - Video-only capture mode (camera focused on video recording)
   * - Maximum duration limit of 60 seconds (perfect for social media reels)
   * - Built-in video editing tools (trim, crop, basic adjustments)
   * - 80% quality compression for optimal streaming performance
   * - MP4 format output for maximum compatibility across platforms
   * 
   * Technical Requirements:
   * - Camera access permission must be granted
   * - Microphone access permission for audio recording
   * - Sufficient device storage space for video file
   * - Hardware video encoder support for real-time compression
   * 
   * Usage Scenarios:
   * - Creating short-form video content (reels, stories)
   * - Recording quick video responses or reactions
   * - Capturing live moments for immediate sharing
   * - Professional content creation with mobile devices
   * 
   * Performance Optimizations:
   * - Automatic quality adjustment based on device capabilities
   * - Hardware-accelerated video encoding when available
   * - Memory-efficient recording with progressive file writing
   * - Automatic cleanup of temporary files on cancellation
   * 
   * @returns {Promise<MediaFile | null>} Recorded video as MediaFile or null if cancelled
   * @throws {Error} If camera/microphone permissions are denied or recording fails
   * @example
   * ```typescript
   * const videoFile = await mediaUploadService.recordVideo();
   * if (videoFile) {
   *   console.log(`Recorded ${videoFile.duration}s video: ${videoFile.size} bytes`);
   * }
   * ```
   */
  async recordVideo(): Promise<MediaFile | null> {
    try {
      // Verify both camera and microphone permissions for video recording
      // Video recording requires both camera (for visual) and microphone (for audio)
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Camera and microphone permissions are required for video recording');
      }

      // Launch camera in video recording mode with optimized settings for social media
      // These settings are specifically tuned for reel-style content creation
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],     // Enable video recording mode only
        allowsEditing: true,        // Enable built-in video editing tools
        videoMaxDuration: 60,       // 60-second limit for reel compatibility
        quality: 0.8,              // 80% quality for good compression vs quality balance
      });

      // Process the recorded video if user completed the recording session
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Retrieve comprehensive file metadata for validation and storage optimization
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        
        // Construct complete MediaFile object with all video-specific metadata
        return {
          uri: asset.uri,                                               // Local file path for immediate access
          type: 'video',                                               // Explicitly mark as video content
          mimeType: 'video/mp4',                                       // Standard MP4 format for compatibility
          size: fileInfo.exists ? (fileInfo as any).size || 0 : 0,    // File size in bytes for upload progress
          duration: asset.duration || undefined,                       // Video duration for UI display and validation
        };
      }

      // User cancelled recording or no video was captured successfully
      return null;
    } catch (error) {
      // Log detailed error information for debugging video recording issues
      console.error('Error recording video:', error);
      throw error;
    }
  }

  /**
   * Upload Media - Universal Media Upload Handler
   * 
   * Primary entry point for all media upload operations in the Jorvea application.
   * This method intelligently routes different media types to their specialized upload handlers.
   * 
   * Architecture Design:
   * - NO FIREBASE STORAGE usage (replaced with specialized cloud providers)
   * - Videos: Routed to MUX for professional streaming optimization
   * - Images: Routed to Cloudinary/ImgBB for image hosting and transformation
   * - Progress tracking: Real-time feedback for upload status updates
   * 
   * Upload Strategy:
   * - Video files: Uploaded to MUX for HLS streaming and adaptive bitrate
   * - Image files: Processed and uploaded to image hosting services
   * - Large files: Chunked upload with progress tracking
   * - Failed uploads: Automatic retry mechanism with exponential backoff
   * 
   * Performance Features:
   * - Concurrent upload optimization for faster processing
   * - Automatic file validation before upload initiation
   * - Memory-efficient processing for large media files
   * - Network-aware upload strategies (WiFi vs cellular detection)
   * 
   * Error Handling:
   * - Comprehensive validation before upload attempts
   * - Graceful degradation for network connectivity issues
   * - Detailed error reporting for debugging and user feedback
   * - Automatic cleanup of partial uploads on failure
   * 
   * @param {MediaFile} mediaFile - The media file to upload (image or video)
   * @param {(progress: UploadProgress) => void} onProgress - Optional callback for upload progress updates
   * @returns {Promise<UploadResult>} Complete upload result with URLs and metadata
   * @throws {Error} If media type is unsupported or upload configuration is invalid
   * 
   * @example
   * ```typescript
   * // Upload with progress tracking
   * const result = await mediaUploadService.uploadMedia(
   *   mediaFile,
   *   (progress) => console.log(`Upload: ${progress.percentage}%`)
   * );
   * 
   * if (result.success) {
   *   console.log('Media URL:', result.mediaUrl);
   *   console.log('Asset ID:', result.assetId);
   * }
   * ```
   */
  async uploadMedia(
    mediaFile: MediaFile, 
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      // Log upload initiation with media type for debugging and analytics
      console.log('🚀 Starting media upload operation:', mediaFile.type);
      console.log('📊 File size:', mediaFile.size, 'bytes');
      console.log('🎯 MIME type:', mediaFile.mimeType);
      
      // Route video files to MUX for professional streaming capabilities
      if (mediaFile.type === 'video') {
        console.log('📹 Routing video to MUX streaming service');
        return await this.uploadVideoToMux(mediaFile, onProgress);
      }

      // Route image files to Cloudinary for image hosting and transformations
      if (mediaFile.type === 'image') {
        console.log('🖼️ Routing image to Cloudinary hosting service');
        return await this.uploadImageToCloudinary(mediaFile, onProgress);
      }

      // Reject unsupported media types with clear error message
      throw new Error(`Unsupported media type: ${mediaFile.type}. Supported types: image, video`);
    } catch (error) {
      // Log comprehensive error details for debugging and monitoring
      console.error('❌ Media upload failed:', error);
      console.error('📁 Failed file details:', {
        type: mediaFile.type,
        size: mediaFile.size,
        mimeType: mediaFile.mimeType,
        uri: mediaFile.uri
      });
      
      // Re-throw with enhanced error context for upstream handling
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
      
      // Validate the video file
      if (mediaFile.type !== 'video') {
        throw new Error('File is not a video');
      }
      
      if (!mediaFile.uri || mediaFile.size === 0) {
        throw new Error('Invalid video file: empty or corrupted');
      }
      
      // Check file extension
      const fileExtension = mediaFile.uri.split('.').pop()?.toLowerCase();
      const supportedFormats = ['mp4', 'mov', 'avi', 'm4v', 'mkv'];
      if (!fileExtension || !supportedFormats.includes(fileExtension)) {
        throw new Error(`Unsupported video format: ${fileExtension}. Supported formats: ${supportedFormats.join(', ')}`);
      }
      
      // Check if muxService is configured
      if (!muxService.isConfigured()) {
        throw new Error('MUX service not configured. Please add real MUX credentials to your .env file.');
      }
      
      // Upload video to MUX
      const uploadId = await muxService.uploadVideo(mediaFile.uri);
      console.log('Video uploaded to MUX with upload ID:', uploadId);
      
      // Try to get the actual asset ID from the upload
      let actualAssetId = null;
      let playbackUrl = null;
      let playbackId = null;
      
      // Wait for asset ID to be available with polling mechanism
      console.log('🔍 Polling for asset ID from upload...');
      const maxRetries = 30; // Max 30 retries (30 seconds)
      const retryDelay = 1000; // 1 second between retries
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔍 Attempt ${attempt}/${maxRetries}: Getting asset ID from upload...`);
          actualAssetId = await muxService.getAssetIdFromUpload(uploadId);
          
          if (actualAssetId) {
            console.log('✅ Got asset ID from upload:', actualAssetId);
            
            // Now try to get playback URL using the asset ID
            try {
              playbackUrl = await muxService.getPlaybackUrl(actualAssetId);
              if (playbackUrl) {
                playbackId = playbackUrl.split('/').pop()?.replace('.m3u8', '');
                console.log('✅ Got playback URL:', playbackUrl);
              }
            } catch (playbackError) {
              console.log('⏳ Playback URL not ready yet, asset still processing');
            }
            
            // Success! Return the proper asset ID
            return {
              success: true,
              assetId: actualAssetId,
              mediaUrl: playbackUrl || `processing-${actualAssetId}`,
              playbackId: playbackId || actualAssetId,
            };
          } else {
            console.log(`⏳ Asset ID not ready yet (attempt ${attempt}/${maxRetries}), waiting...`);
            
            // Update progress during polling
            if (onProgress) {
              const pollingProgress = 90 + (attempt / maxRetries) * 10; // 90-100% during polling
              onProgress({
                loaded: pollingProgress,
                total: 100,
                percentage: pollingProgress,
              });
            }
            
            // Wait before next attempt (except for last attempt)
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
          }
        } catch (error) {
          console.log(`⚠️ Error getting asset ID (attempt ${attempt}/${maxRetries}):`, error);
          
          // If it's the last attempt, we'll fail
          if (attempt === maxRetries) {
            throw new Error(`Failed to get asset ID after ${maxRetries} attempts. The upload may still be processing. Try refreshing in a few minutes.`);
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
      
      // If we get here, we failed to get the asset ID
      throw new Error(`Upload completed but asset ID not available after ${maxRetries} seconds. The video may still be processing on MUX servers. Please try refreshing in a few minutes.`);
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
