import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { followService, profileService } from '../services';
import { UserProfile } from '../services/firebaseProfileService';

const { width } = Dimensions.get('window');

interface PeopleCarouselProps {
  title: string;
  onViewAll?: () => void;
}

export default function PeopleCarousel({ title, onViewAll }: PeopleCarouselProps) {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuggestedUsers();
  }, []);

  const loadSuggestedUsers = async () => {
    try {
      setLoading(true);
      // Get all users and filter out current user and already following
      const allUsers = await profileService.getAllUsers();
      const currentUserProfile = user ? await profileService.getUserProfile(user.uid) : null;
      
      const filtered = allUsers.filter(profile => 
        profile.uid !== user?.uid 
        // Note: Firebase version doesn't have following array, so we'll just exclude current user
      );
      
      // Sort by followers count and take top 10
      const sorted = filtered
        .sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0))
        .slice(0, 10);
      
      setSuggestedUsers(sorted);
    } catch (error) {
      console.error('Error loading suggested users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserPress = (userId: string) => {
    navigation.navigate('UserProfile', { userId });
  };

  const handleFollowUser = async (userId: string) => {
    if (!user) return;
    
    try {
      // Get current user profile and create if it doesn't exist
      let currentUserProfile = await profileService.getUserProfile(user.uid);
      
      if (!currentUserProfile) {
        const basicProfile: UserProfile = {
          uid: user.uid,
          username: user.displayName?.toLowerCase().replace(/\s+/g, '_') || user.email?.split('@')[0] || `user_${user.uid.slice(-4)}`,
          displayName: user.displayName || user.email?.split('@')[0] || 'Unknown User',
          email: user.email || `${user.uid}@example.com`,
          isPrivate: false,
          isVerified: false,
          bio: '',
          postsCount: 0,
          reelsCount: 0,
          followersCount: 0,
          followingCount: 0,
          totalLikes: 0,
          totalViews: 0,
          createdAt: null,
          updatedAt: null,
        };
        
        await profileService.createUserProfile(basicProfile);
        currentUserProfile = basicProfile;
      }
      
      if (currentUserProfile) {
        const fromUserInfo = {
          username: currentUserProfile.username,
          displayName: currentUserProfile.displayName,
          profilePicture: currentUserProfile.profilePicture,
          isVerified: currentUserProfile.isVerified,
        };

        // @ts-ignore - Service interface may be outdated
        await followService.sendFollowRequest(user.uid, userId, fromUserInfo);
        // Remove from suggestions after sending follow request
        setSuggestedUsers(prev => prev.filter(u => u.uid !== userId));
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity 
      style={styles.userCard}
      onPress={() => handleUserPress(item.uid)}
    >
      <Image
        source={{ uri: item.profilePicture || 'https://via.placeholder.com/80' }}
        style={styles.userAvatar}
      />
      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.displayName} numberOfLines={1}>
            {item.displayName}
          </Text>
          {item.isVerified && (
            <Ionicons name="checkmark-circle" size={14} color="#1DA1F2" />
          )}
        </View>
        <Text style={styles.username} numberOfLines={1}>
          @{item.username}
        </Text>
        <Text style={styles.followers}>
          {item.followersCount || 0} followers
        </Text>
      </View>
      <TouchableOpacity
        style={styles.followButton}
        onPress={() => handleFollowUser(item.uid)}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.followGradient}
        >
          <Text style={styles.followText}>Follow</Text>
        </LinearGradient>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#667eea" />
        </View>
      </View>
    );
  }

  if (suggestedUsers.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={suggestedUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.uid}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAll: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  loadingContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 12,
  },
  userCard: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ddd',
    marginBottom: 8,
  },
  userInfo: {
    alignItems: 'center',
    flex: 1,
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 4,
    textAlign: 'center',
  },
  username: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  followers: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
  followButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  followGradient: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: 'center',
  },
  followText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});
