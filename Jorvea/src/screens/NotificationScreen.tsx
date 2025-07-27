import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'post';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  userAvatar?: string;
  userName: string;
  actionData?: any;
}

interface NotificationScreenProps {
  onNotificationPress?: (notification: Notification) => void;
  onMarkAllRead?: () => void;
}

export default function NotificationScreen({ 
  onNotificationPress, 
  onMarkAllRead 
}: NotificationScreenProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    // Mock data - replace with actual API call
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'like',
        title: 'New Like',
        message: 'Alice Johnson liked your post',
        timestamp: Date.now() - 300000, // 5 minutes ago
        read: false,
        userAvatar: 'https://picsum.photos/100/100?random=1',
        userName: 'Alice Johnson'
      },
      {
        id: '2',
        type: 'comment',
        title: 'New Comment',
        message: 'Bob Smith commented on your reel: "Amazing content!"',
        timestamp: Date.now() - 900000, // 15 minutes ago
        read: false,
        userAvatar: 'https://picsum.photos/100/100?random=2',
        userName: 'Bob Smith'
      },
      {
        id: '3',
        type: 'follow',
        title: 'New Follower',
        message: 'Carol Davis started following you',
        timestamp: Date.now() - 1800000, // 30 minutes ago
        read: true,
        userAvatar: 'https://picsum.photos/100/100?random=3',
        userName: 'Carol Davis'
      },
      {
        id: '4',
        type: 'mention',
        title: 'Mentioned You',
        message: 'David Wilson mentioned you in a post',
        timestamp: Date.now() - 3600000, // 1 hour ago
        read: true,
        userAvatar: 'https://picsum.photos/100/100?random=4',
        userName: 'David Wilson'
      },
      {
        id: '5',
        type: 'post',
        title: 'Content Update',
        message: 'Your post is trending! It has reached 1K likes.',
        timestamp: Date.now() - 7200000, // 2 hours ago
        read: true,
        userName: 'Jorvea'
      }
    ];
    setNotifications(mockNotifications);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return { name: 'heart', color: '#ff3040' };
      case 'comment':
        return { name: 'chatbubble', color: '#4facfe' };
      case 'follow':
        return { name: 'person-add', color: '#43e97b' };
      case 'mention':
        return { name: 'at', color: '#f093fb' };
      case 'post':
        return { name: 'trending-up', color: '#667eea' };
      default:
        return { name: 'notifications', color: '#999' };
    }
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderNotification = ({ item }: { item: Notification }) => {
    const icon = getNotificationIcon(item.type);
    
    return (
      <TouchableOpacity 
        style={[styles.notificationItem, !item.read && styles.unreadItem]}
        onPress={() => {
          if (!item.read) {
            markAsRead(item.id);
          }
          onNotificationPress?.(item);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.notificationLeft}>
          <View style={styles.avatarContainer}>
            {item.userAvatar ? (
              <Image source={{ uri: item.userAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={20} color="#999" />
              </View>
            )}
            <View style={[styles.iconBadge, { backgroundColor: icon.color }]}>
              <Ionicons name={icon.name as any} size={12} color="#fff" />
            </View>
          </View>
          
          <View style={styles.notificationContent}>
            <Text style={styles.notificationMessage}>{item.message}</Text>
            <Text style={styles.notificationTime}>{formatTimeAgo(item.timestamp)}</Text>
          </View>
        </View>
        
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={onMarkAllRead}>
              <Text style={styles.markAllReadText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
              All ({notifications.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'unread' && styles.activeFilterTab]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[styles.filterText, filter === 'unread' && styles.activeFilterText]}>
              Unread ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      <FlatList
        data={filteredNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        style={styles.notificationsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={64} color="#999" />
            <Text style={styles.emptyTitle}>
              {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'unread' 
                ? 'All caught up! Check back later for updates.'
                : 'Notifications will appear here when you receive them.'
              }
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  markAllReadText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeFilterTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
  },
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  unreadItem: {
    backgroundColor: '#f8f9ff',
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667eea',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
