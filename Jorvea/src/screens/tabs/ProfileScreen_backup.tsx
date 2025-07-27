import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  Image,
  FlatList,
  Dimensions,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { contentService } from '../../services/contentService';
import { profileService, UserProfile } from '../../services/profileService';
import { Post, Reel } from '../../types/media';
import PeopleCarousel from '../../components/PeopleCarousel';
import { Video } from 'expo-av';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 40) / 3; // 3 columns with padding

interface UserStats {
  postsCount: number;
  reelsCount: number;
  totalViews: number;
}

type TabType = 'posts' | 'reels';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userReels, setUserReels] = useState<Reel[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load user's content and profile when component mounts or user changes
  useEffect(() => {
    loadUserData();
  }, [user]);

  // Reload data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [user])
  );

  const loadUserData = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      // Load user profile and content in parallel
      const [profile, posts, reels] = await Promise.all([
        profileService.getUserProfile(user.uid),
        contentService.getAllPosts(),
        contentService.getAllReels(),
      ]);

      setUserProfile(profile);
      
      // Filter content by current user
      const filteredPosts = posts.filter(post => post.userId === user.uid);
      const filteredReels = reels.filter(reel => reel.userId === user.uid);
      
      setUserPosts(filteredPosts);
      setUserReels(filteredReels);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };
      const [posts, reels] = await Promise.all([
        contentService.getUserPosts(user.uid),
        contentService.getUserReels(user.uid)
      ]);
      
      setUserPosts(posts);
      setUserReels(reels);
      console.log(`Loaded ${posts.length} posts and ${reels.length} reels for user`);
    } catch (error) {
      console.error('Error loading user content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              // The AuthGuard will automatically redirect to sign-in page
            } catch (error) {
              Alert.alert("Error", "Failed to sign out. Please try again.");
            }
          }
        }
      ]
    );
  };

  // Render post item
  const renderPostItem = ({ item }: { item: Post }) => (
    <TouchableOpacity style={styles.mediaItem}>
      {item.mediaType === 'image' ? (
        <Image source={{ uri: item.mediaUrl }} style={styles.mediaImage} />
      ) : (
        <View style={styles.videoContainer}>
          <Image 
            source={{ uri: item.thumbnailUrl || item.mediaUrl }} 
            style={styles.mediaImage} 
          />
          <View style={styles.videoIndicator}>
            <Ionicons name="play" size={20} color="#fff" />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  // Render reel item
  const renderReelItem = ({ item }: { item: Reel }) => (
    <TouchableOpacity style={styles.mediaItem}>
      <View style={styles.videoContainer}>
        <Image 
          source={{ uri: item.thumbnailUrl }} 
          style={styles.mediaImage} 
        />
        <View style={styles.videoIndicator}>
          <Ionicons name="play" size={20} color="#fff" />
        </View>
        <View style={styles.reelInfo}>
          <Text style={styles.reelViews}>{item.views || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render user stats
  const renderUserStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{userPosts.length}</Text>
        <Text style={styles.statLabel}>Posts</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{userReels.length}</Text>
        <Text style={styles.statLabel}>Reels</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>
          {userPosts.reduce((sum, post) => sum + post.likes, 0) + 
           userReels.reduce((sum, reel) => sum + reel.likes, 0)}
        </Text>
        <Text style={styles.statLabel}>Likes</Text>
      </View>
    </View>
  );

  // Render content tabs
  const renderContentTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
        onPress={() => setActiveTab('posts')}
      >
        <Ionicons 
          name="grid-outline" 
          size={24} 
          color={activeTab === 'posts' ? '#667eea' : '#999'} 
        />
        <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
          Posts
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'reels' && styles.activeTab]}
        onPress={() => setActiveTab('reels')}
      >
        <Ionicons 
          name="videocam-outline" 
          size={24} 
          color={activeTab === 'reels' ? '#667eea' : '#999'} 
        />
        <Text style={[styles.tabText, activeTab === 'reels' && styles.activeTabText]}>
          Reels
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons 
        name={activeTab === 'posts' ? "images-outline" : "videocam-outline"} 
        size={64} 
        color="#ccc" 
      />
      <Text style={styles.emptyTitle}>
        No {activeTab === 'posts' ? 'posts' : 'reels'} yet
      </Text>
      <Text style={styles.emptySubtitle}>
        When you share {activeTab === 'posts' ? 'photos and videos' : 'reels'}, they'll appear here
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Ionicons name="create-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info Section */}
        <View style={styles.userSection}>
          <View style={styles.avatarContainer}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#999" />
              </View>
            )}
          </View>
          <Text style={styles.userName}>{user?.displayName || 'Unknown User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Stats Section */}
        {renderUserStats()}

        {/* Content Tabs */}
        {renderContentTabs()}

        {/* Content Grid */}
        <View style={styles.contentContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading your content...</Text>
            </View>
          ) : (
            <>
              {activeTab === 'posts' ? (
                userPosts.length > 0 ? (
                  <FlatList
                    data={userPosts}
                    renderItem={renderPostItem}
                    keyExtractor={(item) => item.id}
                    numColumns={3}
                    scrollEnabled={false}
                    contentContainerStyle={styles.gridContainer}
                  />
                ) : (
                  renderEmptyState()
                )
              ) : (
                userReels.length > 0 ? (
                  <FlatList
                    data={userReels}
                    renderItem={renderReelItem}
                    keyExtractor={(item) => item.id}
                    numColumns={3}
                    scrollEnabled={false}
                    contentContainerStyle={styles.gridContainer}
                  />
                ) : (
                  renderEmptyState()
                )
              )}
            </>
          )}
        </View>
      </ScrollView>
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
    width: '100%',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 8,
  },
  signOutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
  },
  
  // User Info Styles
  userSection: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },

  // Stats Styles
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 40,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },

  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#667eea',
  },
  tabText: {
    fontSize: 14,
    color: '#999',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#667eea',
    fontWeight: '600',
  },

  // Content Styles
  contentContainer: {
    flex: 1,
    padding: 10,
  },
  gridContainer: {
    paddingBottom: 20,
  },
  mediaItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: 5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  reelInfo: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  reelViews: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },

  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
