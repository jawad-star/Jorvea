import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Notification {
  id: string;
  type: 'follow_request' | 'follow_accepted' | 'like' | 'comment' | 'mention' | 'story_like';
  userId: string; // The user this notification belongs to
  fromUserId: string; // The user who triggered this notification
  fromUserInfo: {
    username: string;
    displayName: string;
    profilePicture?: string;
    isVerified?: boolean;
  };
  title: string;
  message: string;
  data?: any; // Additional data based on notification type
  isRead: boolean;
  createdAt: number;
  // For follow request notifications
  followRequestId?: string;
  actionTaken?: 'accepted' | 'rejected' | null;
}

export interface NotificationStats {
  unreadCount: number;
  totalCount: number;
}

class NotificationService {
  private notificationsKey = 'jorvea_notifications';

  // Create notification
  async createNotification(notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>): Promise<Notification> {
    try {
      const newNotification: Notification = {
        ...notification,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        isRead: false,
        createdAt: Date.now(),
      };

      const notifications = await this.getAllNotifications();
      notifications.unshift(newNotification); // Add to beginning for latest first
      
      await AsyncStorage.setItem(this.notificationsKey, JSON.stringify(notifications));
      return newNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get all notifications
  async getAllNotifications(): Promise<Notification[]> {
    try {
      const notificationsJson = await AsyncStorage.getItem(this.notificationsKey);
      if (!notificationsJson) return [];
      return JSON.parse(notificationsJson);
    } catch (error) {
      console.error('Error getting all notifications:', error);
      return [];
    }
  }

  // Get notifications for a specific user
  async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const allNotifications = await this.getAllNotifications();
      return allNotifications
        .filter(notification => notification.userId === userId)
        .sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  // Get unread notifications for a user
  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    try {
      const userNotifications = await this.getUserNotifications(userId);
      return userNotifications.filter(notification => !notification.isRead);
    } catch (error) {
      console.error('Error getting unread notifications:', error);
      return [];
    }
  }

  // Get notification stats
  async getNotificationStats(userId: string): Promise<NotificationStats> {
    try {
      const userNotifications = await this.getUserNotifications(userId);
      const unreadCount = userNotifications.filter(n => !n.isRead).length;
      
      return {
        unreadCount,
        totalCount: userNotifications.length,
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return { unreadCount: 0, totalCount: 0 };
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const notifications = await this.getAllNotifications();
      const notificationIndex = notifications.findIndex(n => n.id === notificationId);
      
      if (notificationIndex === -1) return false;
      
      notifications[notificationIndex].isRead = true;
      await AsyncStorage.setItem(this.notificationsKey, JSON.stringify(notifications));
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const notifications = await this.getAllNotifications();
      let hasChanges = false;
      
      notifications.forEach(notification => {
        if (notification.userId === userId && !notification.isRead) {
          notification.isRead = true;
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        await AsyncStorage.setItem(this.notificationsKey, JSON.stringify(notifications));
      }
      
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const notifications = await this.getAllNotifications();
      const filteredNotifications = notifications.filter(n => n.id !== notificationId);
      
      await AsyncStorage.setItem(this.notificationsKey, JSON.stringify(filteredNotifications));
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  // Update follow request notification when action is taken
  async updateFollowRequestNotification(followRequestId: string, action: 'accepted' | 'rejected'): Promise<boolean> {
    try {
      const notifications = await this.getAllNotifications();
      const notificationIndex = notifications.findIndex(
        n => n.followRequestId === followRequestId && n.type === 'follow_request'
      );
      
      if (notificationIndex === -1) return false;
      
      notifications[notificationIndex].actionTaken = action;
      notifications[notificationIndex].isRead = true;
      
      await AsyncStorage.setItem(this.notificationsKey, JSON.stringify(notifications));
      return true;
    } catch (error) {
      console.error('Error updating follow request notification:', error);
      return false;
    }
  }

  // Create follow request notification
  async createFollowRequestNotification(
    toUserId: string,
    fromUserId: string,
    fromUserInfo: any,
    followRequestId: string
  ): Promise<void> {
    try {
      await this.createNotification({
        type: 'follow_request',
        userId: toUserId,
        fromUserId,
        fromUserInfo: {
          username: fromUserInfo.username,
          displayName: fromUserInfo.displayName,
          profilePicture: fromUserInfo.profilePicture,
          isVerified: fromUserInfo.isVerified,
        },
        title: 'Follow Request',
        message: `${fromUserInfo.displayName} wants to follow you`,
        followRequestId,
        actionTaken: null,
      });
    } catch (error) {
      console.error('Error creating follow request notification:', error);
    }
  }

  // Create follow accepted notification
  async createFollowAcceptedNotification(
    toUserId: string,
    fromUserId: string,
    fromUserInfo: any
  ): Promise<void> {
    try {
      await this.createNotification({
        type: 'follow_accepted',
        userId: toUserId,
        fromUserId,
        fromUserInfo: {
          username: fromUserInfo.username,
          displayName: fromUserInfo.displayName,
          profilePicture: fromUserInfo.profilePicture,
          isVerified: fromUserInfo.isVerified,
        },
        title: 'Follow Request Accepted',
        message: `${fromUserInfo.displayName} accepted your follow request`,
      });
    } catch (error) {
      console.error('Error creating follow accepted notification:', error);
    }
  }

  // Create like notification
  async createLikeNotification(
    toUserId: string,
    fromUserId: string,
    fromUserInfo: any,
    contentType: 'post' | 'reel' | 'story',
    contentId: string
  ): Promise<void> {
    try {
      await this.createNotification({
        type: contentType === 'story' ? 'story_like' : 'like',
        userId: toUserId,
        fromUserId,
        fromUserInfo,
        title: 'New Like',
        message: `${fromUserInfo.displayName} liked your ${contentType}`,
        data: { contentType, contentId },
      });
    } catch (error) {
      console.error('Error creating like notification:', error);
    }
  }

  // Create comment notification
  async createCommentNotification(
    toUserId: string,
    fromUserId: string,
    fromUserInfo: any,
    contentType: 'post' | 'reel',
    contentId: string,
    commentText: string
  ): Promise<void> {
    try {
      await this.createNotification({
        type: 'comment',
        userId: toUserId,
        fromUserId,
        fromUserInfo,
        title: 'New Comment',
        message: `${fromUserInfo.displayName} commented: ${commentText.slice(0, 50)}${commentText.length > 50 ? '...' : ''}`,
        data: { contentType, contentId, commentText },
      });
    } catch (error) {
      console.error('Error creating comment notification:', error);
    }
  }

  // Get follow request notifications that haven't been acted upon
  async getPendingFollowRequestNotifications(userId: string): Promise<Notification[]> {
    try {
      const userNotifications = await this.getUserNotifications(userId);
      return userNotifications.filter(
        n => n.type === 'follow_request' && n.actionTaken === null
      );
    } catch (error) {
      console.error('Error getting pending follow request notifications:', error);
      return [];
    }
  }

  // Clear all notifications for a user
  async clearAllNotifications(userId: string): Promise<boolean> {
    try {
      const allNotifications = await this.getAllNotifications();
      const filteredNotifications = allNotifications.filter(n => n.userId !== userId);
      
      await AsyncStorage.setItem(this.notificationsKey, JSON.stringify(filteredNotifications));
      return true;
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
