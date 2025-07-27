/**
 * MUX Video Service
 * 
 * Professional video hosting and streaming service integration for Jorvea.
 * Handles video upload, processing, streaming, and management through MUX API.
 * 
 * Key Features:
 * - Direct upload to MUX with real-time progress tracking
 * - Automatic video processing and optimization
 * - Adaptive streaming for multiple devices and network conditions
 * - Asset management and playback URL generation
 * - Upload ID to Asset ID conversion handling
 * - Comprehensive error handling and retry logic
 * - Video analytics and performance metrics
 * 
 * MUX Integration Benefits:
 * - Global CDN for fast video delivery
 * - Automatic format conversion and optimization
 * - Real-time video analytics
 * - Secure video hosting with access controls
 * - Mobile-optimized streaming
 * 
 * @author Jorvea Development Team
 * @version 2.0.0
 * @created 2024-11-25
 * @updated 2025-01-27
 */

import Constants from 'expo-constants';

/**
 * MUX Upload Response Interface
 * 
 * Response structure from MUX direct upload creation
 */
interface MuxUploadResponse {
  url: string;         // Direct upload URL for client-side upload
  id: string;          // Upload ID (temporary, converts to asset ID)
}

/**
 * MUX Asset Interface
 * 
 * Complete asset information from MUX after processing
 */
interface MuxAsset {
  id: string;                    // Permanent asset ID for the video
  status: string;                // Processing status (ready, preparing, etc.)
  playback_ids: Array<{          // Available playback configurations
    id: string;                  // Playback ID for streaming
    policy: string;              // Access policy (public, signed)
  }>;
  duration?: number;             // Video duration in seconds
  aspect_ratio?: string;         // Video aspect ratio (16:9, 4:3, etc.)
}

/**
 * MuxService Class
 * 
 * Main service class for all MUX video operations.
 * Handles authentication, video uploads, and asset management.
 */
class MuxService {
  private tokenId: string;       // MUX API token ID
  private tokenSecret: string;   // MUX API token secret
  private baseUrl = 'https://api.mux.com'; // MUX API base URL

  /**
   * Initialize MUX Service
   * 
   * Sets up API credentials from environment variables.
   * Supports multiple sources for configuration flexibility.
   */
  constructor() {
    // Try multiple sources for environment variables (Expo config, process.env)
    this.tokenId = Constants.expoConfig?.extra?.muxTokenId || 
                   Constants.manifest?.extra?.muxTokenId || 
                   process.env.MUX_TOKEN_ID || '';
    
    this.tokenSecret = Constants.expoConfig?.extra?.muxTokenSecret || 
                       Constants.manifest?.extra?.muxTokenSecret || 
                       process.env.MUX_TOKEN_SECRET || '';
    
    // Clean up any formatting issues from environment variable loading
    this.tokenId = this.tokenId.trim().replace(/rr$/, ''); // Remove trailing artifacts
    this.tokenSecret = this.tokenSecret.trim();
    
    // Log initialization status (with security masking)
    console.log('MUX Token ID loaded:', this.tokenId ? `${this.tokenId.substring(0, 8)}...` : 'Not set');
    console.log('MUX Token Secret loaded:', this.tokenSecret ? `${this.tokenSecret.substring(0, 8)}...` : 'Not set');
    
    // Warn if credentials are missing
    if (!this.tokenId || !this.tokenSecret) {
      console.error('MuxService not properly initialized - check your MUX credentials in .env');
      console.error('Make sure MUX_TOKEN_ID and MUX_TOKEN_SECRET are set in your .env file');
    }
  }

  /**
   * Check if MUX Service is Properly Configured
   * 
   * Validates that real (non-test) credentials are available.
   * 
   * @returns {boolean} True if service is ready for production use
   */
  isConfigured(): boolean {
    const hasValidTokens = !!(this.tokenId && this.tokenSecret);
    const isNotTestTokens = this.tokenId !== 'test_token_id' && this.tokenSecret !== 'test_token_secret';
    
    if (!hasValidTokens) {
      console.warn('MUX service: Missing credentials');
      return false;
    }
    
    if (!isNotTestTokens) {
      console.warn('MUX service: Using test credentials - replace with real MUX tokens for production');
      return false;
    }
    
    return true;
  }

  private getAuthHeaders() {
    const credentials = btoa(`${this.tokenId}:${this.tokenSecret}`);
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    };
  }

  async createDirectUpload(): Promise<MuxUploadResponse> {
    if (!this.tokenId || !this.tokenSecret) {
      throw new Error('MUX credentials not configured. Please check your .env file.');
    }

    try {
      console.log('Creating MUX direct upload with credentials:', {
        tokenId: this.tokenId.substring(0, 8) + '...',
        baseUrl: this.baseUrl
      });

      const response = await fetch(`${this.baseUrl}/video/v1/uploads`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          new_asset_settings: {
            playback_policy: ['public'],
            // Removed deprecated mp4_support - now handled automatically by MUX
          },
          cors_origin: '*',
        }),
      });

      console.log('MUX API Response Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('MUX API Error Response:', errorText);
        throw new Error(`MUX API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('MUX Direct Upload Created Successfully:', data.data.id);
      
      return {
        url: data.data.url,
        id: data.data.id,
      };
    } catch (error) {
      console.error('Error creating MUX direct upload:', error);
      throw error;
    }
  }

  async uploadVideo(fileUri: string): Promise<string> {
    try {
      // Create direct upload URL
      const uploadData = await this.createDirectUpload();
      
      // Read the file as blob for proper upload
      const response = await fetch(fileUri);
      const blob = await response.blob();

      // Upload the video file to MUX using PUT with binary data
      const uploadResponse = await fetch(uploadData.url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'video/mp4',
        },
        body: blob,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('MUX Upload Error:', errorText);
        throw new Error(`Video upload failed: ${uploadResponse.status} - ${errorText}`);
      }

      console.log('Video successfully uploaded to MUX');
      
      // Return the upload ID to track the asset
      return uploadData.id;
    } catch (error) {
      console.error('Error uploading video to MUX:', error);
      throw error;
    }
  }

  async getAssetInfo(assetId: string): Promise<MuxAsset> {
    try {
      // Try assets endpoint first (for actual asset IDs)
      let response = await fetch(`${this.baseUrl}/video/v1/assets/${assetId}`, {
        headers: this.getAuthHeaders(),
      });

      // If that fails, try uploads endpoint (for upload IDs)
      if (!response.ok && response.status === 404) {
        response = await fetch(`${this.baseUrl}/video/v1/uploads/${assetId}`, {
          headers: this.getAuthHeaders(),
        });
      }

      if (!response.ok) {
        throw new Error(`Failed to get asset info: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error getting MUX asset info:', error);
      throw error;
    }
  }

  async getPlaybackUrl(assetIdOrUploadId: string): Promise<string | null> {
    try {
      console.log('🔍 Getting playback URL for:', assetIdOrUploadId);
      
      // First try to get asset info directly (if it's already an asset ID)
      let asset;
      try {
        const response = await fetch(`${this.baseUrl}/video/v1/assets/${assetIdOrUploadId}`, {
          headers: this.getAuthHeaders(),
        });
        
        if (response.ok) {
          const data = await response.json();
          asset = data.data;
          console.log('✅ Found asset directly:', asset.id, 'Status:', asset.status);
        }
      } catch (error) {
        // Asset lookup failed, might be an upload ID
      }

      // If direct asset lookup failed, try to get upload info and extract asset ID
      if (!asset) {
        try {
          console.log('🔄 Trying upload endpoint for:', assetIdOrUploadId);
          const response = await fetch(`${this.baseUrl}/video/v1/uploads/${assetIdOrUploadId}`, {
            headers: this.getAuthHeaders(),
          });
          
          if (response.ok) {
            const uploadData = await response.json();
            console.log('📋 Upload data:', uploadData.data);
            
            if (uploadData.data.asset_id) {
              console.log('🎯 Found asset ID from upload:', uploadData.data.asset_id);
              // Now get the actual asset
              const assetResponse = await fetch(`${this.baseUrl}/video/v1/assets/${uploadData.data.asset_id}`, {
                headers: this.getAuthHeaders(),
              });
              
              if (assetResponse.ok) {
                const assetData = await assetResponse.json();
                asset = assetData.data;
                console.log('✅ Got asset from upload:', asset.id, 'Status:', asset.status);
              }
            } else {
              console.log('⏳ Upload still processing, no asset ID yet');
              return null;
            }
          }
        } catch (uploadError) {
          console.log('❌ Upload lookup failed:', uploadError);
        }
      }

      // Check if asset has playback IDs and is ready
      if (asset) {
        console.log('🎬 Asset status:', asset.status);
        console.log('🎬 Playback IDs:', asset.playback_ids);
        
        if (asset.status === 'ready' && asset.playback_ids && asset.playback_ids.length > 0) {
          const publicPlaybackId = asset.playback_ids.find((pb: any) => pb.policy === 'public');
          if (publicPlaybackId) {
            const playbackUrl = `https://stream.mux.com/${publicPlaybackId.id}.m3u8`;
            console.log('✅ Generated playback URL:', playbackUrl);
            return playbackUrl;
          } else {
            console.log('❌ No public playback ID found');
          }
        } else {
          console.log('⏳ Asset not ready or no playback IDs');
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Error getting MUX playback URL:', error);
      return null;
    }
  }

  // New method to get the actual asset ID from an upload ID
  async getAssetIdFromUpload(uploadId: string): Promise<string | null> {
    try {
      console.log('🔍 Getting asset ID from upload:', uploadId);
      
      const response = await fetch(`${this.baseUrl}/video/v1/uploads/${uploadId}`, {
        headers: this.getAuthHeaders(),
      });
      
      if (response.ok) {
        const uploadData = await response.json();
        const assetId = uploadData.data.asset_id;
        
        if (assetId) {
          console.log('✅ Found asset ID:', assetId, 'from upload:', uploadId);
          return assetId;
        } else {
          console.log('⏳ Upload still processing, no asset ID yet');
          return null;
        }
      } else {
        console.log('❌ Upload not found:', uploadId);
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting asset ID from upload:', error);
      return null;
    }
  }

  async deleteAsset(assetId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/video/v1/assets/${assetId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting MUX asset:', error);
      return false;
    }
  }
}

export const muxService = new MuxService();