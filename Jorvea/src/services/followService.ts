import AsyncStorage from '@react-native-async-storage/async-storage';
import { profileService } from './profileService';
import { notificationService } from './notificationService';

export interface FollowRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUserInfo: {
    username: string;
    displayName: string;
    profilePicture?: string;
    isVerified?: boolean;
  };
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface FollowRelationship {
  followerId: string;
  followingId: string;
  createdAt: number;
}

export interface UserFollowStats {
  userId: string;
  followersCount: number;
  followingCount: number;
  followers: string[]; // Array of user IDs
  following: string[]; // Array of user IDs
}

class FollowService {
  private followRequestsKey = 'jorvea_follow_requests';
  private followRelationshipsKey = 'jorvea_follow_relationships';
  private followStatsKey = 'jorvea_follow_stats';

  // Send follow request
  async sendFollowRequest(fromUserId: string, toUserId: string, fromUserInfo: any): Promise<boolean> {
    try {
      // Check if already following or request exists
      const isFollowing = await this.isFollowing(fromUserId, toUserId);
      if (isFollowing) {
        throw new Error('Already following this user');
      }

      const existingRequest = await this.getFollowRequest(fromUserId, toUserId);
      if (existingRequest) {
        throw new Error('Follow request already sent');
      }

      // Check if target user is private
      const targetUserProfile = await profileService.getUserProfile(toUserId);
      const isPrivateUser = targetUserProfile?.isPrivate || false;

      const requests = await this.getAllFollowRequests();
      const newRequest: FollowRequest = {
        id: `${fromUserId}_${toUserId}_${Date.now()}`,
        fromUserId,
        toUserId,
        fromUserInfo: {
          username: fromUserInfo.username,
          displayName: fromUserInfo.displayName,
          profilePicture: fromUserInfo.profilePicture,
          isVerified: fromUserInfo.isVerified,
        },
        status: isPrivateUser ? 'pending' : 'accepted',
        createdAt: Date.now(),
      };

      requests.push(newRequest);
      await AsyncStorage.setItem(this.followRequestsKey, JSON.stringify(requests));

      // Create notification for follow request
      await notificationService.createFollowRequestNotification(
        toUserId,
        fromUserId,
        fromUserInfo,
        newRequest.id
      );

      // If user is not private, auto-create the follow relationship
      if (!isPrivateUser) {
        await this.createFollowRelationship(fromUserId, toUserId);
      }

      return true;
    } catch (error) {
      console.error('Error sending follow request:', error);
      return false;
    }
  }

  // Accept follow request
  async acceptFollowRequest(requestId: string): Promise<boolean> {
    try {
      const requests = await this.getAllFollowRequests();
      const requestIndex = requests.findIndex(req => req.id === requestId);
      
      if (requestIndex === -1) {
        throw new Error('Follow request not found');
      }

      const request = requests[requestIndex];
      
      // Create follow relationship
      await this.createFollowRelationship(request.fromUserId, request.toUserId);
      
      // Update request status
      requests[requestIndex].status = 'accepted';
      await AsyncStorage.setItem(this.followRequestsKey, JSON.stringify(requests));
      
      return true;
    } catch (error) {
      console.error('Error accepting follow request:', error);
      return false;
    }
  }

  // Reject follow request
  async rejectFollowRequest(requestId: string): Promise<boolean> {
    try {
      const requests = await this.getAllFollowRequests();
      const requestIndex = requests.findIndex(req => req.id === requestId);
      
      if (requestIndex === -1) {
        throw new Error('Follow request not found');
      }

      requests[requestIndex].status = 'rejected';
      await AsyncStorage.setItem(this.followRequestsKey, JSON.stringify(requests));
      
      return true;
    } catch (error) {
      console.error('Error rejecting follow request:', error);
      return false;
    }
  }

  // Create follow relationship
  private async createFollowRelationship(followerId: string, followingId: string): Promise<void> {
    try {
      const relationships = await this.getAllFollowRelationships();
      const newRelationship: FollowRelationship = {
        followerId,
        followingId,
        createdAt: Date.now(),
      };

      relationships.push(newRelationship);
      await AsyncStorage.setItem(this.followRelationshipsKey, JSON.stringify(relationships));

      // Update follow stats
      await this.updateFollowStats(followerId, followingId);
    } catch (error) {
      console.error('Error creating follow relationship:', error);
    }
  }

  // Update follow stats
  private async updateFollowStats(followerId: string, followingId: string): Promise<void> {
    try {
      const stats = await this.getAllFollowStats();
      
      // Update follower's following count
      let followerStats = stats.find(s => s.userId === followerId);
      if (!followerStats) {
        followerStats = {
          userId: followerId,
          followersCount: 0,
          followingCount: 0,
          followers: [],
          following: [],
        };
        stats.push(followerStats);
      }
      followerStats.following.push(followingId);
      followerStats.followingCount = followerStats.following.length;

      // Update following user's followers count
      let followingStats = stats.find(s => s.userId === followingId);
      if (!followingStats) {
        followingStats = {
          userId: followingId,
          followersCount: 0,
          followingCount: 0,
          followers: [],
          following: [],
        };
        stats.push(followingStats);
      }
      followingStats.followers.push(followerId);
      followingStats.followersCount = followingStats.followers.length;

      await AsyncStorage.setItem(this.followStatsKey, JSON.stringify(stats));
    } catch (error) {
      console.error('Error updating follow stats:', error);
    }
  }

  // Unfollow user
  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    try {
      // Remove relationship
      const relationships = await this.getAllFollowRelationships();
      const filteredRelationships = relationships.filter(
        rel => !(rel.followerId === followerId && rel.followingId === followingId)
      );
      await AsyncStorage.setItem(this.followRelationshipsKey, JSON.stringify(filteredRelationships));

      // Update stats
      const stats = await this.getAllFollowStats();
      
      // Update follower stats
      const followerStats = stats.find(s => s.userId === followerId);
      if (followerStats) {
        followerStats.following = followerStats.following.filter(id => id !== followingId);
        followerStats.followingCount = followerStats.following.length;
      }

      // Update following stats
      const followingStats = stats.find(s => s.userId === followingId);
      if (followingStats) {
        followingStats.followers = followingStats.followers.filter(id => id !== followerId);
        followingStats.followersCount = followingStats.followers.length;
      }

      await AsyncStorage.setItem(this.followStatsKey, JSON.stringify(stats));
      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return false;
    }
  }

  // Check if user is following another user
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const relationships = await this.getAllFollowRelationships();
      return relationships.some(
        rel => rel.followerId === followerId && rel.followingId === followingId
      );
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }

  // Get follow request between two users
  async getFollowRequest(fromUserId: string, toUserId: string): Promise<FollowRequest | null> {
    try {
      const requests = await this.getAllFollowRequests();
      return requests.find(
        req => req.fromUserId === fromUserId && req.toUserId === toUserId && req.status === 'pending'
      ) || null;
    } catch (error) {
      console.error('Error getting follow request:', error);
      return null;
    }
  }

  // Get pending follow requests for a user
  async getPendingFollowRequests(userId: string): Promise<FollowRequest[]> {
    try {
      const requests = await this.getAllFollowRequests();
      return requests.filter(req => req.toUserId === userId && req.status === 'pending');
    } catch (error) {
      console.error('Error getting pending requests:', error);
      return [];
    }
  }

  // Get user's follow stats
  async getUserFollowStats(userId: string): Promise<UserFollowStats> {
    try {
      const stats = await this.getAllFollowStats();
      let userStats = stats.find(s => s.userId === userId);
      
      if (!userStats) {
        // Initialize stats for new users
        userStats = {
          userId,
          followersCount: 0,
          followingCount: 0,
          followers: [],
          following: [],
        };
        
        // Save the initialized stats
        stats.push(userStats);
        await AsyncStorage.setItem(this.followStatsKey, JSON.stringify(stats));
      }
      
      console.log('Loaded follow stats for user', userId, ':', userStats);
      return userStats;
    } catch (error) {
      console.error('Error getting user follow stats:', error);
      return {
        userId,
        followersCount: 0,
        followingCount: 0,
        followers: [],
        following: [],
      };
    }
  }

  // Get user's followers
  async getUserFollowers(userId: string): Promise<string[]> {
    try {
      const stats = await this.getUserFollowStats(userId);
      return stats.followers;
    } catch (error) {
      console.error('Error getting user followers:', error);
      return [];
    }
  }

  // Get user's following
  async getUserFollowing(userId: string): Promise<string[]> {
    try {
      const stats = await this.getUserFollowStats(userId);
      return stats.following;
    } catch (error) {
      console.error('Error getting user following:', error);
      return [];
    }
  }

  // Check if user can see another user's stories (must be following for private accounts)
  async canSeeUserStories(viewerId: string, storyOwnerId: string): Promise<boolean> {
    try {
      // If it's the same user, they can always see their own stories
      if (viewerId === storyOwnerId) {
        return true;
      }

      // Check if the story owner has a private account
      // For now, assume all accounts are private (you can modify this based on user settings)
      const isFollowing = await this.isFollowing(viewerId, storyOwnerId);
      return isFollowing;
    } catch (error) {
      console.error('Error checking story visibility:', error);
      return false;
    }
  }

  // Get all follow requests (private method)
  private async getAllFollowRequests(): Promise<FollowRequest[]> {
    try {
      const requestsJson = await AsyncStorage.getItem(this.followRequestsKey);
      return requestsJson ? JSON.parse(requestsJson) : [];
    } catch (error) {
      console.error('Error getting follow requests:', error);
      return [];
    }
  }

  // Get all follow relationships (private method)
  private async getAllFollowRelationships(): Promise<FollowRelationship[]> {
    try {
      const relationshipsJson = await AsyncStorage.getItem(this.followRelationshipsKey);
      return relationshipsJson ? JSON.parse(relationshipsJson) : [];
    } catch (error) {
      console.error('Error getting follow relationships:', error);
      return [];
    }
  }

  // Get all follow stats (private method)
  private async getAllFollowStats(): Promise<UserFollowStats[]> {
    try {
      const statsJson = await AsyncStorage.getItem(this.followStatsKey);
      return statsJson ? JSON.parse(statsJson) : [];
    } catch (error) {
      console.error('Error getting follow stats:', error);
      return [];
    }
  }

  // Clean up old rejected/accepted requests (call periodically)
  async cleanupOldRequests(): Promise<void> {
    try {
      const requests = await this.getAllFollowRequests();
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      const activeRequests = requests.filter(req => 
        req.status === 'pending' || req.createdAt > sevenDaysAgo
      );
      
      await AsyncStorage.setItem(this.followRequestsKey, JSON.stringify(activeRequests));
    } catch (error) {
      console.error('Error cleaning up old requests:', error);
    }
  }

  // Test function to create sample follow relationships
  async createSampleFollowData(): Promise<void> {
    try {
      // Create some sample relationships for testing
      const sampleRelationships: FollowRelationship[] = [
        {
          followerId: 'user1',
          followingId: 'user2',
          createdAt: Date.now(),
        },
        {
          followerId: 'user2',
          followingId: 'user1',
          createdAt: Date.now(),
        },
        {
          followerId: 'user3',
          followingId: 'user1',
          createdAt: Date.now(),
        }
      ];

      await AsyncStorage.setItem(this.followRelationshipsKey, JSON.stringify(sampleRelationships));

      // Update stats for these relationships
      for (const rel of sampleRelationships) {
        await this.updateFollowStats(rel.followerId, rel.followingId);
      }

      console.log('Sample follow data created successfully');
    } catch (error) {
      console.error('Error creating sample follow data:', error);
    }
  }
}

export const followService = new FollowService();
