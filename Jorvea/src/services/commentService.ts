import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Comment {
  id: string;
  contentId: string; // Post or Reel ID
  contentType: 'post' | 'reel';
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: number;
  likes: number;
  likedBy: string[]; // Array of user IDs who liked this comment
  replies?: Comment[]; // For nested replies (optional for now)
}

class CommentService {
  private commentsKey = 'jorvea_comments';
  
  // Get all comments for a specific content (post or reel)
  async getComments(contentId: string, contentType: 'post' | 'reel'): Promise<Comment[]> {
    try {
      const allComments = await this.getAllComments();
      return allComments
        .filter(comment => comment.contentId === contentId && comment.contentType === contentType)
        .sort((a, b) => b.timestamp - a.timestamp); // Latest first
    } catch (error) {
      console.error('Error getting comments:', error);
      return [];
    }
  }

  // Add a new comment
  async addComment(commentData: Omit<Comment, 'id' | 'timestamp' | 'likes' | 'likedBy'>): Promise<Comment> {
    try {
      const newComment: Comment = {
        ...commentData,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        likes: 0,
        likedBy: [],
      };

      const allComments = await this.getAllComments();
      allComments.push(newComment);
      await AsyncStorage.setItem(this.commentsKey, JSON.stringify(allComments));
      
      return newComment;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  // Delete a comment
  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    try {
      const allComments = await this.getAllComments();
      const commentIndex = allComments.findIndex(comment => 
        comment.id === commentId && comment.userId === userId
      );
      
      if (commentIndex === -1) {
        return false; // Comment not found or user doesn't own it
      }

      allComments.splice(commentIndex, 1);
      await AsyncStorage.setItem(this.commentsKey, JSON.stringify(allComments));
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  }

  // Like/Unlike a comment
  async toggleCommentLike(commentId: string, userId: string): Promise<boolean> {
    try {
      const allComments = await this.getAllComments();
      const commentIndex = allComments.findIndex(comment => comment.id === commentId);
      
      if (commentIndex === -1) {
        return false;
      }

      const comment = allComments[commentIndex];
      const likedIndex = comment.likedBy.indexOf(userId);
      
      if (likedIndex > -1) {
        // Unlike
        comment.likedBy.splice(likedIndex, 1);
        comment.likes = Math.max(0, comment.likes - 1);
      } else {
        // Like
        comment.likedBy.push(userId);
        comment.likes += 1;
      }

      await AsyncStorage.setItem(this.commentsKey, JSON.stringify(allComments));
      return likedIndex === -1; // Return true if liked, false if unliked
    } catch (error) {
      console.error('Error toggling comment like:', error);
      return false;
    }
  }

  // Get comment count for content
  async getCommentCount(contentId: string, contentType: 'post' | 'reel'): Promise<number> {
    try {
      const comments = await this.getComments(contentId, contentType);
      return comments.length;
    } catch (error) {
      console.error('Error getting comment count:', error);
      return 0;
    }
  }

  // Private method to get all comments
  private async getAllComments(): Promise<Comment[]> {
    try {
      const commentsJson = await AsyncStorage.getItem(this.commentsKey);
      return commentsJson ? JSON.parse(commentsJson) : [];
    } catch (error) {
      console.error('Error getting all comments:', error);
      return [];
    }
  }

  // Clear all comments (for development/testing)
  async clearAllComments(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.commentsKey);
    } catch (error) {
      console.error('Error clearing comments:', error);
    }
  }
}

export const commentService = new CommentService();
