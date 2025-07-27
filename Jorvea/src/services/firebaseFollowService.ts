import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface FollowRelationship {
  id?: string;
  followerId: string;
  followingId: string;
  createdAt: any;
}

export interface FollowRequest {
  id?: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any;
}

export interface UserFollowStats {
  userId: string;
  followersCount: number;
  followingCount: number;
  followers: string[];
  following: string[];
}

class FirebaseFollowService {
  private followsCollection = 'follows';
  private followRequestsCollection = 'follow_requests';
  private usersCollection = 'users';

  // ========== FOLLOW RELATIONSHIPS ==========
  
  // Follow user
  async followUser(followerId: string, followingId: string): Promise<void> {
    try {
      // Check if already following
      const isFollowing = await this.isFollowing(followerId, followingId);
      if (isFollowing) {
        throw new Error('Already following this user');
      }

      // Create follow relationship
      await addDoc(collection(db, this.followsCollection), {
        followerId,
        followingId,
        createdAt: serverTimestamp()
      });

      // Update both users' counts
      await Promise.all([
        this.updateFollowersCount(followingId, 1),
        this.updateFollowingCount(followerId, 1)
      ]);

      console.log('✅ Follow relationship created');
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  }

  // Unfollow user
  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    try {
      // Find and delete the follow relationship
      const followQuery = query(
        collection(db, this.followsCollection),
        where('followerId', '==', followerId),
        where('followingId', '==', followingId)
      );
      
      const snapshot = await getDocs(followQuery);
      if (snapshot.empty) {
        throw new Error('Follow relationship not found');
      }

      // Delete the relationship
      await deleteDoc(snapshot.docs[0].ref);

      // Update both users' counts
      await Promise.all([
        this.updateFollowersCount(followingId, -1),
        this.updateFollowingCount(followerId, -1)
      ]);

      console.log('✅ Unfollowed successfully');
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  }

  // Check if user is following another user
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const followQuery = query(
        collection(db, this.followsCollection),
        where('followerId', '==', followerId),
        where('followingId', '==', followingId)
      );
      
      const snapshot = await getDocs(followQuery);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }

  // Get user's followers
  async getUserFollowers(userId: string): Promise<string[]> {
    try {
      const followersQuery = query(
        collection(db, this.followsCollection),
        where('followingId', '==', userId)
      );
      
      const snapshot = await getDocs(followersQuery);
      return snapshot.docs.map(doc => doc.data().followerId);
    } catch (error) {
      console.error('Error getting followers:', error);
      return [];
    }
  }

  // Get user's following
  async getUserFollowing(userId: string): Promise<string[]> {
    try {
      const followingQuery = query(
        collection(db, this.followsCollection),
        where('followerId', '==', userId)
      );
      
      const snapshot = await getDocs(followingQuery);
      return snapshot.docs.map(doc => doc.data().followingId);
    } catch (error) {
      console.error('Error getting following:', error);
      return [];
    }
  }

  // Get user's follow stats
  async getUserFollowStats(userId: string): Promise<UserFollowStats> {
    try {
      const [followers, following] = await Promise.all([
        this.getUserFollowers(userId),
        this.getUserFollowing(userId)
      ]);

      return {
        userId,
        followersCount: followers.length,
        followingCount: following.length,
        followers,
        following
      };
    } catch (error) {
      console.error('Error getting follow stats:', error);
      return {
        userId,
        followersCount: 0,
        followingCount: 0,
        followers: [],
        following: []
      };
    }
  }

  // ========== FOLLOW REQUESTS ==========
  
  // Send follow request
  async sendFollowRequest(fromUserId: string, toUserId: string): Promise<void> {
    try {
      // Check if request already exists
      const existingRequest = await this.getFollowRequest(fromUserId, toUserId);
      if (existingRequest) {
        throw new Error('Follow request already sent');
      }

      // Check if already following
      const isFollowing = await this.isFollowing(fromUserId, toUserId);
      if (isFollowing) {
        throw new Error('Already following this user');
      }

      // Create follow request
      await addDoc(collection(db, this.followRequestsCollection), {
        fromUserId,
        toUserId,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      console.log('✅ Follow request sent');
    } catch (error) {
      console.error('Error sending follow request:', error);
      throw error;
    }
  }

  // Accept follow request
  async acceptFollowRequest(requestId: string): Promise<void> {
    try {
      const requestDoc = await getDoc(doc(db, this.followRequestsCollection, requestId));
      if (!requestDoc.exists()) {
        throw new Error('Follow request not found');
      }

      const request = requestDoc.data() as FollowRequest;
      
      // Update request status
      await updateDoc(doc(db, this.followRequestsCollection, requestId), {
        status: 'accepted',
        updatedAt: serverTimestamp()
      });

      // Create follow relationship
      await this.followUser(request.fromUserId, request.toUserId);

      console.log('✅ Follow request accepted');
    } catch (error) {
      console.error('Error accepting follow request:', error);
      throw error;
    }
  }

  // Reject follow request
  async rejectFollowRequest(requestId: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.followRequestsCollection, requestId), {
        status: 'rejected',
        updatedAt: serverTimestamp()
      });

      console.log('✅ Follow request rejected');
    } catch (error) {
      console.error('Error rejecting follow request:', error);
      throw error;
    }
  }

  // Get follow requests for a user
  async getFollowRequests(userId: string): Promise<FollowRequest[]> {
    try {
      const requestsQuery = query(
        collection(db, this.followRequestsCollection),
        where('toUserId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(requestsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FollowRequest[];
    } catch (error) {
      console.error('Error getting follow requests:', error);
      return [];
    }
  }

  // Check if follow request exists
  async getFollowRequest(fromUserId: string, toUserId: string): Promise<FollowRequest | null> {
    try {
      const requestQuery = query(
        collection(db, this.followRequestsCollection),
        where('fromUserId', '==', fromUserId),
        where('toUserId', '==', toUserId),
        where('status', '==', 'pending')
      );
      
      const snapshot = await getDocs(requestQuery);
      if (snapshot.empty) return null;
      
      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      } as FollowRequest;
    } catch (error) {
      console.error('Error getting follow request:', error);
      return null;
    }
  }

  // ========== STORY PRIVACY ==========
  
  // Check if user can see another user's stories
  async canSeeUserStories(viewerId: string, storyOwnerId: string): Promise<boolean> {
    try {
      // User can see their own stories
      if (viewerId === storyOwnerId) return true;

      // Get story owner's profile to check if private
      const ownerDoc = await getDoc(doc(db, this.usersCollection, storyOwnerId));
      if (!ownerDoc.exists()) return false;

      const ownerProfile = ownerDoc.data();
      
      // If public account, anyone can see
      if (!ownerProfile.isPrivate) return true;

      // If private account, only followers can see
      return await this.isFollowing(viewerId, storyOwnerId);
    } catch (error) {
      console.error('Error checking story visibility:', error);
      return false;
    }
  }

  // ========== HELPER METHODS ==========
  
  private async updateFollowersCount(userId: string, increment_value: number): Promise<void> {
    try {
      const userRef = doc(db, this.usersCollection, userId);
      await updateDoc(userRef, {
        followersCount: increment(increment_value),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating followers count:', error);
    }
  }

  private async updateFollowingCount(userId: string, increment_value: number): Promise<void> {
    try {
      const userRef = doc(db, this.usersCollection, userId);
      await updateDoc(userRef, {
        followingCount: increment(increment_value),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating following count:', error);
    }
  }

  // Real-time follow requests listener
  subscribeToFollowRequests(userId: string, callback: (requests: FollowRequest[]) => void) {
    const requestsQuery = query(
      collection(db, this.followRequestsCollection),
      where('toUserId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(requestsQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FollowRequest[];
      callback(requests);
    });
  }

  // Real-time follow stats listener
  subscribeToFollowStats(userId: string, callback: (stats: UserFollowStats) => void) {
    const followersQuery = query(
      collection(db, this.followsCollection),
      where('followingId', '==', userId)
    );

    const followingQuery = query(
      collection(db, this.followsCollection),
      where('followerId', '==', userId)
    );

    // Listen to both followers and following changes
    const unsubscribeFollowers = onSnapshot(followersQuery, async () => {
      const stats = await this.getUserFollowStats(userId);
      callback(stats);
    });

    const unsubscribeFollowing = onSnapshot(followingQuery, async () => {
      const stats = await this.getUserFollowStats(userId);
      callback(stats);
    });

    // Return combined unsubscribe function
    return () => {
      unsubscribeFollowers();
      unsubscribeFollowing();
    };
  }
}

export const firebaseFollowService = new FirebaseFollowService();
export default firebaseFollowService;
