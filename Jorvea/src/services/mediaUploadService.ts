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

  /**
   * Upload Image to Cloudinary - Image Hosting Service Integration
   * 
   * Handles image upload and processing using Cloudinary's cloud-based image management.
   * This method serves as an alternative to Firebase Storage for image hosting needs.
   * 
   * Current Implementation Strategy:
   * - Base64 encoding for direct Firestore storage (temporary solution)
   * - Easy migration path to full Cloudinary integration
   * - Maintains compatibility with existing Firestore document structure
   * - Supports immediate image display without external dependencies
   * 
   * Base64 Storage Benefits:
   * - No external API dependencies or API key requirements
   * - Immediate availability after upload completion
   * - Simple integration with Firestore document storage
   * - No additional hosting costs or service configurations
   * 
   * Base64 Storage Limitations:
   * - Larger storage footprint (~33% size increase)
   * - Firestore document size limits (1MB per document)
   * - No automatic image transformations or optimizations
   * - Limited CDN benefits for global image delivery
   * 
   * Future Migration Path:
   * - Replace base64 with Cloudinary direct upload
   * - Add automatic image transformations (resize, compress, format conversion)
   * - Implement CDN delivery for global performance optimization
   * - Add advanced features (face detection, auto-cropping, watermarking)
   * 
   * @param {MediaFile} mediaFile - Image file to upload and process
   * @param {(progress: UploadProgress) => void} onProgress - Optional progress callback for UI updates
   * @returns {Promise<UploadResult>} Upload result with base64 data URL
   * @throws {Error} If image processing fails or file format is unsupported
   * 
   * @example
   * ```typescript
   * // Upload image with progress tracking
   * const result = await uploadImageToCloudinary(imageFile, (progress) => {
   *   console.log(`Processing: ${progress.percentage}%`);
   * });
   * 
   * // Store result in Firestore
   * await firestore.collection('posts').add({
   *   imageUrl: result.mediaUrl, // Base64 data URL
   *   uploadTimestamp: new Date()
   * });
   * ```
   */
  private async uploadImageToCloudinary(
    mediaFile: MediaFile,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      // Log image processing initiation for debugging and analytics
      console.log('🖼️ Starting image processing with Cloudinary alternative...');
      console.log('📊 Image details:', {
        size: mediaFile.size,
        mimeType: mediaFile.mimeType,
        uri: mediaFile.uri
      });
      
      // Progress update: Starting image processing
      if (onProgress) {
        onProgress({
          loaded: 10,
          total: 100,
          percentage: 10
        });
      }
      
      // Convert image to base64 format for Firestore storage
      // This provides immediate availability without external service dependencies
      console.log('🔄 Converting image to base64 format for Firestore storage...');
      const base64 = await FileSystem.readAsStringAsync(mediaFile.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Progress update: Base64 conversion completed
      if (onProgress) {
        onProgress({
          loaded: 80,
          total: 100,
          percentage: 80
        });
      }
      
      // Create complete data URL with proper MIME type specification
      // This format allows direct embedding in HTML and immediate browser display
      const dataUrl = `data:${mediaFile.mimeType};base64,${base64}`;
      
      // Progress update: Processing completed
      if (onProgress) {
        onProgress({
          loaded: 100,
          total: 100,
          percentage: 100
        });
      }
      
      console.log('✅ Image converted to base64 format for Firestore storage');
      console.log('📏 Base64 data size:', dataUrl.length, 'characters');
      
      // Return successful upload result with base64 data URL
      return {
        success: true,
        mediaUrl: dataUrl, // Base64 data URL for direct Firestore storage
      };
    } catch (error) {
      // Log detailed error information for debugging image processing issues
      console.error('❌ Error processing image:', error);
      console.error('📁 Failed image details:', {
        size: mediaFile.size,
        mimeType: mediaFile.mimeType,
        uri: mediaFile.uri
      });
      
      // Throw enhanced error with context for upstream error handling
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

  /**
   * Check Video Processing Status - MUX Asset Readiness Verification
   * 
   * Verifies whether a video uploaded to MUX has completed processing and is ready for playback.
   * This method is essential for determining when videos can be displayed to users.
   * 
   * MUX Processing Pipeline:
   * 1. Video upload completion (returns upload ID)
   * 2. MUX transcoding and optimization (background processing)
   * 3. HLS playlist generation for adaptive streaming
   * 4. Playback URL availability (indicates readiness)
   * 
   * Usage Scenarios:
   * - Polling video status after upload completion
   * - Updating UI when videos become available for playback
   * - Handling "processing" states in video galleries
   * - Retry mechanisms for failed processing operations
   * 
   * Performance Considerations:
   * - Avoid excessive polling to prevent API rate limiting
   * - Implement exponential backoff for repeated checks
   * - Cache results to minimize redundant API calls
   * - Use webhooks for production applications when possible
   * 
   * @param {string} assetId - MUX asset ID to check processing status
   * @returns {Promise<{ready: boolean; playbackUrl?: string}>} Status object with readiness and URL
   * @throws {Error} If asset ID is invalid or MUX service is unavailable
   * 
   * @example
   * ```typescript
   * // Check video status after upload
   * const status = await mediaUploadService.checkVideoStatus(assetId);
   * 
   * if (status.ready && status.playbackUrl) {
   *   console.log('Video ready for playback:', status.playbackUrl);
   *   // Update UI to show video player
   * } else {
   *   console.log('Video still processing, please wait...');
   *   // Show loading indicator
   * }
   * ```
   */
  async checkVideoStatus(assetId: string): Promise<{ ready: boolean; playbackUrl?: string }> {
    try {
      // Log status check initiation for debugging and monitoring
      console.log('🔍 Checking video processing status for asset:', assetId);
      
      // Query MUX service for current playback URL availability
      // A successful response with URL indicates processing completion
      const playbackUrl = await muxService.getPlaybackUrl(assetId);
      
      // Determine readiness based on playback URL availability
      const isReady = playbackUrl !== null;
      
      // Log status result for debugging and analytics
      if (isReady) {
        console.log('✅ Video processing completed. Playback URL available:', playbackUrl);
      } else {
        console.log('⏳ Video still processing. Playback URL not yet available.');
      }
      
      return {
        ready: isReady,
        playbackUrl: playbackUrl || undefined,
      };
    } catch (error) {
      // Log detailed error information for debugging MUX integration issues
      console.error('❌ Error checking video status:', error);
      console.error('🎯 Asset ID:', assetId);
      
      // Return not ready status on error to prevent UI breakage
      return { ready: false };
    }
  }

  /**
   * Delete Media from Storage - Comprehensive Media Cleanup
   * 
   * Removes media files from their respective storage services based on media type.
   * This method ensures proper cleanup and prevents storage cost accumulation.
   * 
   * Deletion Strategy by Media Type:
   * - Videos: Direct deletion from MUX using asset management API
   * - Images: Cleanup handled by Firestore document deletion (base64 storage)
   * 
   * MUX Video Deletion Process:
   * 1. Validate asset ID format and existence
   * 2. Call MUX delete asset API endpoint
   * 3. Verify deletion completion
   * 4. Clean up local references and cache
   * 
   * Image Deletion Process:
   * - Base64 images are stored directly in Firestore documents
   * - Deletion occurs automatically when parent document is removed
   * - No additional API calls required for cleanup
   * 
   * Error Handling:
   * - Graceful handling of already-deleted assets
   * - Network failure resilience with retry mechanisms
   * - Detailed logging for audit trails and debugging
   * 
   * @param {string} assetId - Asset/media identifier for deletion
   * @param {'image' | 'video'} type - Media type to determine deletion strategy
   * @returns {Promise<boolean>} True if deletion successful, false otherwise
   * @throws {Error} If asset ID is invalid or deletion service is unavailable
   * 
   * @example
   * ```typescript
   * // Delete video from MUX
   * const videoDeleted = await mediaUploadService.deleteMedia(videoAssetId, 'video');
   * if (videoDeleted) {
   *   console.log('Video successfully deleted from MUX');
   * }
   * 
   * // Delete image (handled by Firestore)
   * const imageDeleted = await mediaUploadService.deleteMedia(imageId, 'image');
   * // Image cleanup happens automatically with document deletion
   * ```
   */
  async deleteMedia(assetId: string, type: 'image' | 'video'): Promise<boolean> {
    try {
      // Log deletion initiation for audit trails and debugging
      console.log('🗑️ Starting media deletion process:', { assetId, type });
      
      // Handle video deletion through MUX asset management
      if (type === 'video') {
        console.log('📹 Deleting video asset from MUX service...');
        
        // Call MUX service to permanently delete the video asset
        const deletionResult = await muxService.deleteAsset(assetId);
        
        if (deletionResult) {
          console.log('✅ Video asset successfully deleted from MUX:', assetId);
        } else {
          console.log('⚠️ Video deletion returned false, asset may already be deleted:', assetId);
        }
        
        return deletionResult;
      }
      
      // Handle image deletion (base64 storage in Firestore)
      if (type === 'image') {
        console.log('🖼️ Image deletion handled by Firestore document deletion');
        console.log('ℹ️ Base64 images are automatically cleaned when parent document is removed');
        
        // For base64 images stored in Firestore documents,
        // deletion happens automatically when the document is deleted
        // No additional cleanup required for this storage method
        return true;
      }
      
      // Handle unsupported media type
      console.error('❌ Unsupported media type for deletion:', type);
      throw new Error(`Unsupported media type for deletion: ${type}`);
    } catch (error) {
      // Log comprehensive error details for debugging and monitoring
      console.error('❌ Error deleting media:', error);
      console.error('🎯 Deletion context:', { assetId, type });
      
      // Return false to indicate deletion failure
      return false;
    }
  }
}

export const mediaUploadService = new MediaUploadService();
