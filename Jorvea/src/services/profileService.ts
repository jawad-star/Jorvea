import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  email: string;
  bio?: string;
  profilePicture?: string;
  website?: string;
  location?: string;
  dateOfBirth?: string;
  isPrivate: boolean;
  isVerified: boolean;
  followers: string[]; // Array of user IDs
  following: string[]; // Array of user IDs
  postsCount: number;
  reelsCount: number;
  createdAt: number;
  updatedAt: number;
  // Social links
  socialLinks?: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    twitter?: string;
  };
  // Profile stats
  totalLikes: number;
  totalViews: number;
}

class ProfileService {
  private profilesKey = 'jorvea_profiles';
  
  // Get user profile by ID
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const profiles = await this.getAllProfiles();
      return profiles.find(profile => profile.uid === userId) || null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // Create or update user profile
  async updateUserProfile(profileData: Partial<UserProfile> & { uid: string }): Promise<UserProfile> {
    try {
      const profiles = await this.getAllProfiles();
      const existingIndex = profiles.findIndex(profile => profile.uid === profileData.uid);
      
      const now = Date.now();
      
      if (existingIndex >= 0) {
        // Update existing profile
        profiles[existingIndex] = {
          ...profiles[existingIndex],
          ...profileData,
          updatedAt: now,
        };
        await AsyncStorage.setItem(this.profilesKey, JSON.stringify(profiles));
        return profiles[existingIndex];
      } else {
        // Create new profile
        const newProfile: UserProfile = {
          uid: profileData.uid,
          username: profileData.username || '',
          displayName: profileData.displayName || '',
          email: profileData.email || '',
          bio: profileData.bio || '',
          profilePicture: profileData.profilePicture,
          website: profileData.website,
          location: profileData.location,
          dateOfBirth: profileData.dateOfBirth,
          isPrivate: profileData.isPrivate || false,
          isVerified: profileData.isVerified || false,
          followers: profileData.followers || [],
          following: profileData.following || [],
          postsCount: 0,
          reelsCount: 0,
          totalLikes: 0,
          totalViews: 0,
          createdAt: now,
          updatedAt: now,
          socialLinks: profileData.socialLinks || {},
        };
        
        profiles.push(newProfile);
        await AsyncStorage.setItem(this.profilesKey, JSON.stringify(profiles));
        return newProfile;
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Follow/Unfollow user
  async toggleFollow(currentUserId: string, targetUserId: string): Promise<boolean> {
    try {
      const profiles = await this.getAllProfiles();
      const currentUserProfile = profiles.find(p => p.uid === currentUserId);
      const targetUserProfile = profiles.find(p => p.uid === targetUserId);
      
      if (!currentUserProfile || !targetUserProfile) {
        throw new Error('User profiles not found');
      }

      const isFollowing = currentUserProfile.following.includes(targetUserId);
      
      if (isFollowing) {
        // Unfollow
        currentUserProfile.following = currentUserProfile.following.filter(id => id !== targetUserId);
        targetUserProfile.followers = targetUserProfile.followers.filter(id => id !== currentUserId);
      } else {
        // Follow
        currentUserProfile.following.push(targetUserId);
        targetUserProfile.followers.push(currentUserId);
      }

      await AsyncStorage.setItem(this.profilesKey, JSON.stringify(profiles));
      return !isFollowing; // Return new follow state
    } catch (error) {
      console.error('Error toggling follow:', error);
      throw error;
    }
  }

  // Search users
  async searchUsers(query: string): Promise<UserProfile[]> {
    try {
      const profiles = await this.getAllProfiles();
      const lowercaseQuery = query.toLowerCase();
      
      return profiles.filter(profile => 
        profile.username.toLowerCase().includes(lowercaseQuery) ||
        profile.displayName.toLowerCase().includes(lowercaseQuery)
      );
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  // Get all users (for discovery features)
  async getAllUsers(): Promise<UserProfile[]> {
    try {
      return await this.getAllProfiles();
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  // Get user stats
  async getUserStats(userId: string): Promise<{
    posts: number;
    reels: number;
    followers: number;
    following: number;
    totalLikes: number;
    totalViews: number;
  }> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) {
        return { posts: 0, reels: 0, followers: 0, following: 0, totalLikes: 0, totalViews: 0 };
      }

      return {
        posts: profile.postsCount,
        reels: profile.reelsCount,
        followers: Array.isArray(profile.followers) ? profile.followers.length : 0,
        following: Array.isArray(profile.following) ? profile.following.length : 0,
        totalLikes: profile.totalLikes,
        totalViews: profile.totalViews,
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return { posts: 0, reels: 0, followers: 0, following: 0, totalLikes: 0, totalViews: 0 };
    }
  }

  // Update profile picture
  async updateProfilePicture(userId: string, imageUrl: string): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(userId);
      if (profile) {
        await this.updateUserProfile({ uid: userId, profilePicture: imageUrl });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating profile picture:', error);
      return false;
    }
  }

  // Get followers list
  async getFollowers(userId: string): Promise<UserProfile[]> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) return [];

      const allProfiles = await this.getAllProfiles();
      return allProfiles.filter(p => profile.followers.includes(p.uid));
    } catch (error) {
      console.error('Error getting followers:', error);
      return [];
    }
  }

  // Get following list
  async getFollowing(userId: string): Promise<UserProfile[]> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) return [];

      const allProfiles = await this.getAllProfiles();
      return allProfiles.filter(p => profile.following.includes(p.uid));
    } catch (error) {
      console.error('Error getting following:', error);
      return [];
    }
  }

  // Private method to get all profiles
  private async getAllProfiles(): Promise<UserProfile[]> {
    try {
      const profilesJson = await AsyncStorage.getItem(this.profilesKey);
      return profilesJson ? JSON.parse(profilesJson) : [];
    } catch (error) {
      console.error('Error getting all profiles:', error);
      return [];
    }
  }

  // Clear all profiles (for development/testing)
  async clearAllProfiles(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.profilesKey);
    } catch (error) {
      console.error('Error clearing profiles:', error);
    }
  }
}

export const profileService = new ProfileService();
