import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services';

export default function NotificationIcon({ color = 'white' }: { color?: string }) {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.uid) {
      loadUnreadCount();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.uid]);

  const loadUnreadCount = async () => {
    if (!user?.uid) return;
    
    try {
      // TODO: Implement getNotificationStats in Firebase service
      // const stats = await notificationService.getNotificationStats(user.uid);
      // setUnreadCount(stats.unreadCount);
      setUnreadCount(0); // Temporarily set to 0
    } catch (error) {
      console.error('Error loading notification stats:', error);
    }
  };

  const handlePress = () => {
    navigation.navigate('Notifications');
    // Reset unread count after navigation
    setTimeout(() => {
      setUnreadCount(0);
    }, 500);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <Ionicons name="notifications-outline" size={24} color={color} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount.toString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
