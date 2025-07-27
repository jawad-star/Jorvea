import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import PeopleCarousel from '../../components/PeopleCarousel';
import { useAuth } from '../../context/AuthContext';
import { contentService, profileService } from '../../services';
import { FirebasePost, FirebaseReel } from '../../services/firebaseContentService';
import { UserProfile } from '../../services/firebaseProfileService';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 40) / 3; // 3 columns with padding

type TabType = 'posts' | 'reels';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [userPosts, setUserPosts] = useState<FirebasePost[]>([]);
  const [userReels, setUserReels] = useState<FirebaseReel[]>([]);
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
      
      // Filter content by current user with null checks
      const filteredPosts = (posts || []).filter(post => post.userId === user.uid);
      const filteredReels = (reels || []).filter(reel => reel.userId === user.uid);
      
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
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderProfileInfo = () => (
    <View style={styles.userSection}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {userProfile?.profilePicture || user?.photoURL ? (
            <Image 
              source={{ uri: userProfile?.profilePicture || user?.photoURL || '' }} 
              style={styles.avatar} 
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color="#999" />
            </View>
          )}
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userPosts?.length || 0}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userReels?.length || 0}</Text>
            <Text style={styles.statLabel}>Reels</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userProfile?.followersCount || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userProfile?.followingCount || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>
      </View>

      <View style={styles.profileDetails}>
        <View style={styles.nameRow}>
          <Text style={styles.displayName}>
            {userProfile?.displayName || user?.displayName || 'Unknown User'}
          </Text>
          {userProfile?.isVerified && (
            <Ionicons name="checkmark-circle" size={18} color="#1DA1F2" />
          )}
        </View>
        
        {userProfile?.username && (
          <Text style={styles.username}>@{userProfile.username}</Text>
        )}
        
        {userProfile?.bio && (
          <Text style={styles.bio}>{userProfile.bio}</Text>
        )}
        
        {userProfile?.website && (
          <TouchableOpacity style={styles.websiteContainer}>
            <Ionicons name="link" size={16} color="#667eea" />
            <Text style={styles.websiteText}>{userProfile.website}</Text>
          </TouchableOpacity>
        )}
        
        {userProfile?.location && (
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color="#666" />
            <Text style={styles.locationText}>{userProfile.location}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderContentTabs = () => (
    <View style={styles.tabsContainer}>
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
          name="play-outline" 
          size={24} 
          color={activeTab === 'reels' ? '#667eea' : '#999'} 
        />
        <Text style={[styles.tabText, activeTab === 'reels' && styles.activeTabText]}>
          Reels
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderContentItem = ({ item, index }: { item: FirebasePost | FirebaseReel; index: number }) => {
    const isReel = 'videoUrl' in item;
    const imageSource = isReel 
      ? { uri: (item as FirebaseReel).thumbnailUrl || (item as FirebaseReel).videoUrl }
      : { uri: (item as FirebasePost).imageUrl || (item as FirebasePost).videoUrl };

    return (
      <TouchableOpacity style={styles.contentItem}>
        <Image source={imageSource} style={styles.contentImage} />
        {isReel && (
          <View style={styles.videoIndicator}>
            <Ionicons name="play" size={16} color="#fff" />
          </View>
        )}
        <View style={styles.contentOverlay}>
          <View style={styles.contentStats}>
            <Ionicons name="heart" size={12} color="#fff" />
            <Text style={styles.contentStatText}>{item.likes}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentContent = activeTab === 'posts' ? (userPosts || []) : (userReels || []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
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
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Info */}
        {renderProfileInfo()}

        {/* People You May Know */}
        <PeopleCarousel 
          title="People You May Know"
          onViewAll={() => navigation.navigate('UserProfile', { userId: 'discover' })}
        />

        {/* Content Tabs */}
        {renderContentTabs()}

        {/* Content Grid */}
        <View style={styles.contentContainer}>
          {currentContent.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons 
                name={activeTab === 'posts' ? "images-outline" : "videocam-outline"} 
                size={64} 
                color="#999" 
              />
              <Text style={styles.emptyTitle}>
                No {activeTab} yet
              </Text>
              <Text style={styles.emptySubtitle}>
                Share your first {activeTab === 'posts' ? 'post' : 'reel'} to get started!
              </Text>
            </View>
          ) : (
            <FlatList
              data={currentContent}
              renderItem={renderContentItem}
              keyExtractor={(item) => item.id}
              numColumns={3}
              scrollEnabled={false}
              style={styles.contentGrid}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingVertical: 16,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  
  // Profile Info Styles
  userSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ddd',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  profileDetails: {
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  username: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  websiteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  websiteText: {
    fontSize: 14,
    color: '#667eea',
    marginLeft: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },

  // Content Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#667eea',
  },
  tabText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#667eea',
  },

  // Content Grid
  contentContainer: {
    backgroundColor: '#fff',
    flex: 1,
  },
  contentGrid: {
    paddingHorizontal: 2,
  },
  contentItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: 1,
    position: 'relative',
  },
  contentImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ddd',
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 4,
  },
  contentStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentStatText: {
    fontSize: 10,
    color: '#fff',
    marginLeft: 2,
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
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
