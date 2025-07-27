import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { notificationService, profileService, followService } from '../services';
import { FirebaseNotification } from '../services/firebaseContentService';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<FirebaseNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    if (!user?.uid) return;

    try {
      const userNotifications = await notificationService.getUserNotifications(user.uid);
      setNotifications(userNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId: string) => {
    await notificationService.markAsRead(notificationId);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  };

  const handleFollowRequest = async (notification: Notification, action: 'accept' | 'reject') => {
    if (!notification.followRequestId || processingRequests.has(notification.id)) return;

    try {
      setProcessingRequests(prev => new Set(prev).add(notification.id));

      if (action === 'accept') {
        await followService.acceptFollowRequest(notification.followRequestId);
        // Create notification for the requester
        const currentUserProfile = await profileService.getUserProfile(user!.uid);
        if (currentUserProfile) {
          // TODO: Implement createFollowAcceptedNotification in Firebase service
        }

        // TODO: Implement updateFollowRequestNotification in Firebase service
          
          setNotifications(prev => 
            prev.map(n => n.id === notification.id 
              ? { ...n, actionTaken: 'accepted', isRead: true } 
              : n
            )
          );

          Alert.alert('Success', 'Follow request accepted!');
        }
      } else {
        const success = await followService.rejectFollowRequest(notification.followRequestId);
        if (success) {
          await notificationService.updateFollowRequestNotification(notification.followRequestId, 'rejected');
          
          setNotifications(prev => 
            prev.map(n => n.id === notification.id 
              ? { ...n, actionTaken: 'rejected', isRead: true } 
              : n
            )
          );

          Alert.alert('Request Rejected', 'Follow request has been rejected');
        }
      }
    } catch (error) {
      console.error('Error handling follow request:', error);
      Alert.alert('Error', 'Failed to process follow request');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(notification.id);
        return newSet;
      });
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'follow_request':
        // Already handled by accept/reject buttons
        break;
      case 'follow_accepted':
      case 'like':
      case 'comment':
        // Navigate to the user's profile
        navigation.navigate('UserProfile', { userId: notification.fromUserId });
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow_request':
        return 'person-add';
      case 'follow_accepted':
        return 'checkmark-circle';
      case 'like':
      case 'story_like':
        return 'heart';
      case 'comment':
        return 'chatbubble';
      case 'mention':
        return 'at';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'follow_request':
        return '#007AFF';
      case 'follow_accepted':
        return '#34C759';
      case 'like':
      case 'story_like':
        return '#FF3B30';
      case 'comment':
        return '#FF9500';
      case 'mention':
        return '#5AC8FA';
      default:
        return '#8E8E93';
    }
  };

  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(timestamp).toLocaleDateString();
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.isRead && styles.unreadNotification]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.leftSection}>
          <Image
            source={{ uri: item.fromUserInfo.profilePicture || 'https://via.placeholder.com/50' }}
            style={styles.avatar}
          />
          <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.type) }]}>
            <Ionicons 
              name={getNotificationIcon(item.type) as any} 
              size={12} 
              color="white" 
            />
          </View>
        </View>

        <View style={styles.messageSection}>
          <Text style={styles.message}>
            <Text style={styles.username}>{item.fromUserInfo.displayName}</Text>
            {item.fromUserInfo.isVerified && (
              <Ionicons name="checkmark-circle" size={14} color="#1DA1F2" style={styles.verifiedIcon} />
            )}
            <Text style={styles.messageText}> {item.message.replace(item.fromUserInfo.displayName, '')}</Text>
          </Text>
          <Text style={styles.timeAgo}>{getTimeAgo(item.createdAt)}</Text>
        </View>

        {item.type === 'follow_request' && item.actionTaken === null && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleFollowRequest(item, 'accept')}
              disabled={processingRequests.has(item.id)}
            >
              {processingRequests.has(item.id) ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.acceptButtonText}>Accept</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleFollowRequest(item, 'reject')}
              disabled={processingRequests.has(item.id)}
            >
              <Text style={styles.rejectButtonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.type === 'follow_request' && item.actionTaken && (
          <View style={styles.actionTaken}>
            <Text style={[
              styles.actionTakenText,
              item.actionTaken === 'accepted' ? styles.acceptedText : styles.rejectedText
            ]}>
              {item.actionTaken === 'accepted' ? 'Accepted' : 'Declined'}
            </Text>
          </View>
        )}
      </View>

      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const markAllAsRead = async () => {
    if (!user?.uid) return;
    
    await notificationService.markAllAsRead(user.uid);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="white" />
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications List */}
        <View style={styles.contentContainer}>
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-outline" size={64} color="#8E8E93" />
              <Text style={styles.emptyStateTitle}>No notifications yet</Text>
              <Text style={styles.emptyStateMessage}>
                When people interact with your content, you'll see it here
              </Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              renderItem={renderNotificationItem}
              keyExtractor={(item) => item.id}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  markAllRead: {
    color: 'white',
    fontSize: 14,
    opacity: 0.8,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  notificationItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  unreadNotification: {
    backgroundColor: '#F8F9FF',
    borderLeftWidth: 3,
    borderLeftColor: '#667eea',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  leftSection: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  iconContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  messageSection: {
    flex: 1,
    marginRight: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  username: {
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  messageText: {
    color: '#666',
  },
  timeAgo: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#007AFF',
  },
  rejectButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  rejectButtonText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  actionTaken: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTakenText: {
    fontSize: 12,
    fontWeight: '600',
  },
  acceptedText: {
    color: '#34C759',
  },
  rejectedText: {
    color: '#FF3B30',
  },
  unreadDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667eea',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
