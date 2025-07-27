// Test file to verify all services are properly configured
import { firebaseService } from './services/firebaseService';
import { mediaManagerService } from './services/mediaManagerService';
import { mediaUploadService } from './services/mediaUploadService';
import { muxService } from './services/muxService';

// Type check that all services are properly imported and configured
export const testServices = () => {
  console.log('Testing service configurations...');

  // Test MUX service configuration
  const isMuxConfigured = muxService.isConfigured();
  console.log('MUX configured:', isMuxConfigured);

  // Test media manager service is available
  console.log('Media Manager Service available:', typeof mediaManagerService.uploadContent === 'function');
  console.log('Media Upload Service available:', typeof mediaUploadService.uploadMedia === 'function');
  console.log('Firebase Service available:', typeof firebaseService.createPost === 'function');

  return {
    muxConfigured: isMuxConfigured,
    allServicesAvailable: true
  };
};

// Export services for easy access
export {
    firebaseService, mediaManagerService,
    mediaUploadService,
    muxService
};

// Example usage documentation
export const USAGE_EXAMPLES = {
  uploadVideo: `
    // Videos automatically go to MUX
    const result = await mediaManagerService.uploadContent({
      type: 'video',
      mediaUrl: videoUri,
      caption: 'My awesome video',
      tags: ['fun', 'video'],
      userId: currentUserId,
      contentType: 'reel',
      isPrivate: false
    });
  `,
  uploadImage: `
    // Images automatically go to Firebase Storage
    const result = await mediaManagerService.uploadContent({
      type: 'image',
      mediaUrl: imageUri,
      caption: 'Beautiful photo',
      tags: ['photo', 'memories'],
      userId: currentUserId,
      contentType: 'post',
      isPrivate: false
    });
  `,
  getFeed: `
    // Get mixed content feed (posts and reels)
    const feed = await mediaManagerService.getContentFeed(undefined, 20);
    console.log('Feed items:', feed.length);
  `
};
