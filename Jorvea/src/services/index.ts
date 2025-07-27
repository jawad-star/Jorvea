import firebaseProfileService from './firebaseProfileService';
import firebaseContentService, { storyService, commentService, notificationService } from './firebaseContentService';
import firebaseFollowService from './firebaseFollowService';
import { muxService } from './muxService';

// Export all Firebase services as the main services (NO AsyncStorage!)
export const profileService = firebaseProfileService;
export const contentService = firebaseContentService;
export const followService = firebaseFollowService;

// Export additional Firebase services
export { storyService, commentService, notificationService };

// Also export MUX service for video handling
export { muxService };

console.log('🔥 Firebase services loaded - All data is now 100% dynamic!');
