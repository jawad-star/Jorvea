/**
 * Test script to verify profile update fix
 * This tests the scenario where updateUserProfile is called
 * on a user that doesn't have a Firestore document yet
 */

import { profileService } from '../services';

export async function testProfileUpdateFix(userId: string) {
  try {
    console.log('🧪 Testing profile update fix for user:', userId);
    
    // Simulate updating a profile for a user that doesn't exist yet
    const testUpdate = {
      displayName: 'Test User',
      bio: 'This is a test bio',
      profilePicture: 'https://example.com/avatar.jpg'
    };
    
    console.log('📝 Attempting to update non-existent user profile...');
    await profileService.updateUserProfile(userId, testUpdate);
    
    console.log('✅ Profile update successful! Document was created automatically.');
    
    // Verify the profile was created
    const profile = await profileService.getUserProfile(userId);
    console.log('📊 Created profile:', profile);
    
    return true;
  } catch (error) {
    console.error('❌ Profile update test failed:', error);
    return false;
  }
}

export async function testNormalProfileUpdate(userId: string) {
  try {
    console.log('🧪 Testing normal profile update for existing user:', userId);
    
    // Update an existing profile
    const testUpdate = {
      bio: 'Updated bio - test successful!'
    };
    
    await profileService.updateUserProfile(userId, testUpdate);
    console.log('✅ Normal profile update successful!');
    
    return true;
  } catch (error) {
    console.error('❌ Normal profile update test failed:', error);
    return false;
  }
}
