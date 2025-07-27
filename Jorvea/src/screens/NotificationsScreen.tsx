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
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services';
import { FirebaseNotification } from '../services/firebaseContentService';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<FirebaseNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    try {
      await notificationService.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationPress = async (notification: FirebaseNotification) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'follow':
      case 'follow_request':
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
      case 'follow':
        return 'checkmark-circle';
      case 'like':
      case 'story_view':
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
      case 'follow':
        return '#34C759';
      case 'like':
      case 'story_view':
        return '#FF3B30';
      case 'comment':
        return '#FF9500';
      case 'mention':
        return '#5AC8FA';
      default:
        return '#8E8E93';
    }
  };

  const getTimeAgo = (timestamp: any) => {
    let time: number;
    if (timestamp?.seconds) {
      time = timestamp.seconds * 1000;
    } else if (typeof timestamp === 'number') {
      time = timestamp;
    } else {
      time = Date.now();
    }

    const now = Date.now();
    const diff = now - time;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(time).toLocaleDateString();
  };

  const renderNotificationItem = ({ item }: { item: FirebaseNotification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.isRead && styles.unreadNotification]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.leftSection}>
          <Image
            source={{ uri: item.fromUserAvatar || 'https://via.placeholder.com/50' }}
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
            <Text style={styles.username}>{item.fromUsername}</Text>
            <Text style={styles.messageText}> {item.message}</Text>
          </Text>
          <Text style={styles.timeAgo}>{getTimeAgo(item.createdAt)}</Text>
        </View>
      </View>

      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

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
          <TouchableOpacity onPress={() => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))}>
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
