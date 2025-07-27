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
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { followService, profileService } from '../services';
import { UserProfile } from '../services/firebaseProfileService';
import FollowButton from '../components/FollowButton';
import { useAuth } from '../context/AuthContext';

interface FollowersFollowingScreenProps {
  route: {
    params: {
      userId: string;
      initialTab: 'followers' | 'following';
      username?: string;
    };
  };
}

export default function FollowersFollowingScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { userId, initialTab, username } = route.params;

  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFollowData();
  }, [userId, activeTab]);

  const loadFollowData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'followers') {
        const followerIds = await followService.getUserFollowers(userId);
        const followerProfiles = await Promise.all(
          followerIds.map(async (id) => {
            const profile = await profileService.getUserProfile(id);
            return profile;
          })
        );
        setFollowers(followerProfiles.filter(Boolean) as UserProfile[]);
      } else {
        const followingIds = await followService.getUserFollowing(userId);
        const followingProfiles = await Promise.all(
          followingIds.map(async (id) => {
            const profile = await profileService.getUserProfile(id);
            return profile;
          })
        );
        setFollowing(followingProfiles.filter(Boolean) as UserProfile[]);
      }
    } catch (error) {
      console.error('Error loading follow data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFollowData();
    setRefreshing(false);
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => (
    <View style={styles.userItem}>
      <TouchableOpacity
        style={styles.userInfo}
        onPress={() => navigation.navigate('UserProfile', { userId: item.uid })}
      >
        <Image
          source={{
            uri: item.profilePicture || 'https://via.placeholder.com/50'
          }}
          style={styles.profilePicture}
        />
        <View style={styles.userDetails}>
          <View style={styles.usernameRow}>
            <Text style={styles.username}>@{item.username}</Text>
            {item.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" style={styles.verifiedBadge} />
            )}
          </View>
          <Text style={styles.displayName}>{item.displayName}</Text>
          {item.bio && (
            <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>
          )}
          <View style={styles.stats}>
            <Text style={styles.statText}>
              {item.followersCount || 0} followers • {item.followingCount || 0} following
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <FollowButton
        targetUserId={item.uid}
        targetUserInfo={{
          username: item.username,
          displayName: item.displayName,
          profilePicture: item.profilePicture,
          isVerified: item.isVerified,
        }}
        size="small"
        onFollowChange={loadFollowData}
      />
    </View>
  );

  const getTabTitle = () => {
    if (activeTab === 'followers') {
      return `${followers.length} Followers`;
    } else {
      return `${following.length} Following`;
    }
  };

  const getCurrentData = () => {
    return activeTab === 'followers' ? followers : following;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {username ? `@${username}` : 'User'}
        </Text>
        
        <View style={styles.headerRight} />
      </LinearGradient>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
          onPress={() => setActiveTab('followers')}
        >
          <Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>
            Followers
          </Text>
          {activeTab === 'followers' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'following' && styles.activeTab]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
            Following
          </Text>
          {activeTab === 'following' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {getCurrentData().length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons 
              name={activeTab === 'followers' ? "people-outline" : "person-add-outline"} 
              size={60} 
              color="#666" 
            />
            <Text style={styles.emptyTitle}>
              {activeTab === 'followers' ? 'No Followers' : 'Not Following Anyone'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'followers' 
                ? 'When people follow this user, they\'ll appear here'
                : 'When this user follows people, they\'ll appear here'
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={getCurrentData()}
            keyExtractor={(item) => item.uid}
            renderItem={renderUserItem}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#667eea"
                colors={['#667eea']}
              />
            }
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    // Active tab styling handled by indicator
  },
  tabText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#667eea',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#667eea',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  displayName: {
    color: '#999',
    fontSize: 14,
    marginTop: 2,
  },
  bio: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 4,
  },
  stats: {
    marginTop: 4,
  },
  statText: {
    color: '#666',
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
