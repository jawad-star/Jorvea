import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  Alert,
  ActivityIndicator,
  Linking,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { profileService, contentService, followService } from '../services';
import { UserProfile } from '../services/firebaseProfileService';
import { Post, Reel } from '../types/media';
import MediaViewer from '../components/MediaViewer';
import { RootStackParamList } from '../components/AppNavigator';

const { width } = Dimensions.get('window');
const gridItemSize = (width - 6) / 3; // 3 items per row with 2px spacing

type UserProfileScreenProps = StackScreenProps<RootStackParamList, 'UserProfile'>;

export default function UserProfileScreen({ navigation, route }: UserProfileScreenProps) {
  const { user } = useAuth();
  const { userId } = route.params;
  const isOwnProfile = user?.uid === userId;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userReels, setUserReels] = useState<Reel[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'reels'>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followStats, setFollowStats] = useState({ followersCount: 0, followingCount: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [showBio, setShowBio] = useState(true);
  const [mediaViewerVisible, setMediaViewerVisible] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Post | Reel | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<'post' | 'reel'>('post');

  useEffect(() => {
    loadUserProfile();
    loadUserContent();
  }, [userId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadUserProfile(), loadUserContent()]);
    setRefreshing(false);
  };

  const handleMoreActions = () => {
    const options = [
      'Block User',
      'Report User', 
      'Copy Profile Link',
      'Share Profile',
      'Cancel'
    ];
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: 0, // Block User is destructive
          title: `${profile?.username || 'User'} Options`
        },
        (buttonIndex) => {
          handleMoreActionSelection(buttonIndex);
        }
      );
    } else {
      // For Android, show a simple alert with options
      Alert.alert(
        `${profile?.username || 'User'} Options`,
        'Choose an action:',
        [
          { text: 'Block User', style: 'destructive', onPress: () => handleMoreActionSelection(0) },
          { text: 'Report User', onPress: () => handleMoreActionSelection(1) },
          { text: 'Copy Profile Link', onPress: () => handleMoreActionSelection(2) },
          { text: 'Share Profile', onPress: () => handleMoreActionSelection(3) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleMoreActionSelection = (buttonIndex: number) => {
    switch (buttonIndex) {
      case 0: // Block User
        Alert.alert(
          'Block User',
          `Are you sure you want to block ${profile?.username}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Block', 
              style: 'destructive',
              onPress: () => {
                // TODO: Implement block functionality
                Alert.alert('Blocked', `You have blocked ${profile?.username}`);
              }
            }
          ]
        );
        break;
      case 1: // Report User
        Alert.alert(
          'Report User',
          'This will report the user to our moderation team.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Report', 
              onPress: () => {
                // TODO: Implement report functionality
                Alert.alert('Reported', 'Thank you for your report. We will review it.');
              }
            }
          ]
        );
        break;
      case 2: // Copy Profile Link
        // TODO: Implement copy to clipboard
        Alert.alert('Copied', 'Profile link copied to clipboard');
        break;
      case 3: // Share Profile
        // TODO: Implement share functionality
        Alert.alert('Share', 'Share functionality coming soon');
        break;
    }
  };

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userProfile = await profileService.getUserProfile(userId);
      setProfile(userProfile);
      
      if (user && userProfile) {
        const following = await followService.isFollowing(user.uid, userId);
        setIsFollowing(following);
      }
      
      // Load follow stats
      console.log('Loading follow stats for user:', userId);
      const stats = await followService.getUserFollowStats(userId);
      console.log('Received follow stats:', stats);
      setFollowStats({
        followersCount: stats.followersCount || 0,
        followingCount: stats.followingCount || 0
      });
      console.log('Set follow stats to state:', {
        followersCount: stats.followersCount || 0,
        followingCount: stats.followingCount || 0
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserContent = async () => {
    try {
      const [posts, reels] = await Promise.all([
        contentService.getAllPosts(),
        contentService.getAllReels(),
      ]);

      const filteredPosts = posts.filter(post => post.userId === userId);
      const filteredReels = reels.filter(reel => reel.userId === userId);

      setUserPosts(filteredPosts);
      setUserReels(filteredReels);
    } catch (error) {
      console.error('Error loading user content:', error);
    }
  };

  const handleFollow = async () => {
    if (!user || !profile) return;

    try {
      setFollowLoading(true);
      
      const isCurrentlyFollowing = await followService.isFollowing(user.uid, userId);
      
      if (isCurrentlyFollowing) {
        // Unfollow
        const success = await followService.unfollowUser(user.uid, userId);
        if (success) {
          setIsFollowing(false);
          // Update follow stats
          setFollowStats(prev => ({
            ...prev,
            followersCount: Math.max(0, prev.followersCount - 1)
          }));
        }
      } else {
        // Check if already has pending request
        const pendingRequest = await followService.getFollowRequest(user.uid, userId);
        if (pendingRequest) {
          Alert.alert('Request Pending', 'Your follow request is pending approval');
          return;
        }
        
        // Send follow request
        let currentUserProfile = await profileService.getUserProfile(user.uid);
        
        // Create basic profile for current user if it doesn't exist
        if (!currentUserProfile) {
          const basicProfile = {
            uid: user.uid,
            username: user.displayName?.toLowerCase().replace(/\s+/g, '_') || user.email?.split('@')[0] || `user_${user.uid.slice(-4)}`,
            displayName: user.displayName || user.email?.split('@')[0] || 'Unknown User',
            email: user.email || `${user.uid}@example.com`,
            isPrivate: false,
            isVerified: false,
          };
          
          currentUserProfile = await profileService.updateUserProfile(basicProfile);
        }
        
        const fromUserInfo = {
          username: currentUserProfile.username,
          displayName: currentUserProfile.displayName,
          profilePicture: currentUserProfile.profilePicture,
          isVerified: currentUserProfile.isVerified,
        };

        const success = await followService.sendFollowRequest(user.uid, userId, fromUserInfo);
        if (success) {
          // For public accounts, the request is auto-accepted
          if (!profile.isPrivate) {
            setIsFollowing(true);
            // Update follow stats
            setFollowStats(prev => ({
              ...prev,
              followersCount: prev.followersCount + 1
            }));
          }
          Alert.alert('Success', profile.isPrivate ? 'Follow request sent!' : 'Now following!');
        }
      }
    } catch (error) {
      console.error('Error handling follow action:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleOpenMediaViewer = (content: Post | Reel, type: 'post' | 'reel') => {
    setSelectedContent(content);
    setSelectedContentType(type);
    setMediaViewerVisible(true);
  };

  const handleSocialLink = (platform: string, handle?: string) => {
    if (!handle) return;

    let url = '';
    switch (platform) {
      case 'instagram':
        url = `https://instagram.com/${handle.replace('@', '')}`;
        break;
      case 'tiktok':
        url = `https://tiktok.com/@${handle.replace('@', '')}`;
        break;
      case 'youtube':
        url = handle.startsWith('http') ? handle : `https://youtube.com/c/${handle}`;
        break;
      case 'twitter':
        url = `https://twitter.com/${handle.replace('@', '')}`;
        break;
    }

    if (url) {
      Linking.openURL(url);
    }
  };

  const renderGridItem = ({ item, index }: { item: Post | Reel; index: number }) => {
    const isReel = 'videoUrl' in item;
    const imageUrl = isReel ? (item as Reel).thumbnailUrl : (item as Post).mediaUrl;

    return (
      <TouchableOpacity
        style={[styles.gridItem, { marginLeft: index % 3 !== 0 ? 2 : 0 }]}
        onPress={() => handleOpenMediaViewer(item, isReel ? 'reel' : 'post')}
      >
        <Image source={{ uri: imageUrl }} style={styles.gridImage} />
        {isReel && (
          <View style={styles.reelIndicator}>
            <Ionicons name="play" size={16} color="#fff" />
          </View>
        )}
        {(item as Post).mediaType === 'video' && !isReel && (
          <View style={styles.videoIndicator}>
            <Ionicons name="play" size={16} color="#fff" />
          </View>
        )}
        <View style={styles.gridOverlay}>
          <View style={styles.gridStats}>
            <Ionicons name="heart" size={12} color="#fff" />
            <Text style={styles.gridStatText}>{item.likes}</Text>
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.placeholder} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.placeholder} />
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={64} color="#999" />
          <Text style={styles.errorTitle}>User Not Found</Text>
          <Text style={styles.errorSubtitle}>This user profile doesn't exist or has been removed.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentContent = activeTab === 'posts' ? userPosts : userReels;

  return (
    <>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        {/* Header */}
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            @{profile.username || 'User'}
          </Text>
          {isOwnProfile ? (
            <TouchableOpacity 
              onPress={() => navigation.navigate('EditProfile')}
              style={styles.editButton}
            >
              <Ionicons name="create-outline" size={24} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile Info */}
          <View style={styles.profileSection}>
            <View style={styles.profileHeader}>
              <Image
                source={{ 
                  uri: profile.profilePicture || 'https://via.placeholder.com/80'
                }}
                style={styles.profilePicture}
              />
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{userPosts.length}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>
                <TouchableOpacity 
                  style={styles.statItem}
                  onPress={() => navigation.navigate('FollowersFollowing', { 
                    userId, 
                    initialTab: 'followers',
                    username: profile.username 
                  })}
                >
                  <Text style={styles.statNumber}>{followStats?.followersCount ?? 0}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.statItem}
                  onPress={() => navigation.navigate('FollowersFollowing', { 
                    userId, 
                    initialTab: 'following',
                    username: profile.username 
                  })}
                >
                  <Text style={styles.statNumber}>{followStats?.followingCount ?? 0}</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </TouchableOpacity>
              </View>
              
              {/* Debug button for testing (remove in production) */}
              {__DEV__ && (
                <View style={styles.debugContainer}>
                  <TouchableOpacity 
                    style={styles.debugButton}
                    onPress={async () => {
                      try {
                        console.log('Creating sample follow data...');
                        await followService.createSampleFollowData();
                        console.log('Sample data created, reloading profile...');
                        await loadUserProfile();
                        Alert.alert('Success', 'Sample follow data created and profile reloaded!');
                      } catch (error) {
                        console.error('Error creating sample data:', error);
                        Alert.alert('Error', 'Failed to create sample data');
                      }
                    }}
                  >
                    <Text style={styles.debugButtonText}>Create Test Data</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.debugButton, { backgroundColor: '#4ade80' }]}
                    onPress={async () => {
                      try {
                        const stats = await followService.getUserFollowStats(userId);
                        console.log('Current stats for user', userId, ':', stats);
                        Alert.alert('Current Stats', `Followers: ${stats.followersCount}\nFollowing: ${stats.followingCount}`);
                      } catch (error) {
                        console.error('Error getting stats:', error);
                        Alert.alert('Error', 'Failed to get stats');
                      }
                    }}
                  >
                    <Text style={styles.debugButtonText}>Check Stats</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.displayName}>{profile.displayName}</Text>
                {profile.isVerified && (
                  <Ionicons name="checkmark-circle" size={18} color="#1DA1F2" />
                )}
                {profile.isPrivate && (
                  <Ionicons name="lock-closed" size={16} color="#666" />
                )}
              </View>
              
              {profile.bio && showBio && (
                <TouchableOpacity onPress={() => setShowBio(!showBio)}>
                  <Text style={styles.bio} numberOfLines={3}>
                    {profile.bio}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Join date and post count info */}
              <View style={styles.profileMetadata}>
                <Text style={styles.metadataText}>
                  📅 Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </Text>
                {userPosts.length > 0 && (
                  <Text style={styles.metadataText}>
                    📸 {userPosts.length} post{userPosts.length !== 1 ? 's' : ''}
                  </Text>
                )}
                {userReels.length > 0 && (
                  <Text style={styles.metadataText}>
                    🎬 {userReels.length} reel{userReels.length !== 1 ? 's' : ''}
                  </Text>
                )}
              </View>

              {profile.website && (
                <TouchableOpacity 
                  onPress={() => Linking.openURL(profile.website!)}
                  style={styles.websiteContainer}
                >
                  <Ionicons name="link" size={16} color="#667eea" />
                  <Text style={styles.websiteText}>{profile.website}</Text>
                </TouchableOpacity>
              )}

              {profile.location && (
                <View style={styles.locationContainer}>
                  <Ionicons name="location" size={16} color="#666" />
                  <Text style={styles.locationText}>{profile.location}</Text>
                </View>
              )}

              {/* Social Links */}
              <View style={styles.socialLinksContainer}>
                {profile.socialLinks?.instagram && (
                  <TouchableOpacity 
                    style={styles.socialLink}
                    onPress={() => handleSocialLink('instagram', profile.socialLinks?.instagram)}
                  >
                    <Ionicons name="logo-instagram" size={20} color="#E4405F" />
                  </TouchableOpacity>
                )}
                {profile.socialLinks?.tiktok && (
                  <TouchableOpacity 
                    style={styles.socialLink}
                    onPress={() => handleSocialLink('tiktok', profile.socialLinks?.tiktok)}
                  >
                    <Text style={styles.tiktokIcon}>🎵</Text>
                  </TouchableOpacity>
                )}
                {profile.socialLinks?.youtube && (
                  <TouchableOpacity 
                    style={styles.socialLink}
                    onPress={() => handleSocialLink('youtube', profile.socialLinks?.youtube)}
                  >
                    <Ionicons name="logo-youtube" size={20} color="#FF0000" />
                  </TouchableOpacity>
                )}
                {profile.socialLinks?.twitter && (
                  <TouchableOpacity 
                    style={styles.socialLink}
                    onPress={() => handleSocialLink('twitter', profile.socialLinks?.twitter)}
                  >
                    <Ionicons name="logo-twitter" size={20} color="#1DA1F2" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            {!isOwnProfile && (
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.followButton, 
                    isFollowing && styles.followingButton,
                    styles.primaryActionButton
                  ]}
                  onPress={handleFollow}
                  disabled={followLoading}
                >
                  {followLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                      {isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.messageButton}>
                  <Ionicons name="chatbubble-outline" size={20} color="#667eea" />
                  <Text style={styles.messageButtonText}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.moreButton}
                  onPress={handleMoreActions}
                >
                  <Ionicons name="ellipsis-horizontal" size={20} color="#667eea" />
                </TouchableOpacity>
              </View>
            )}

            {isOwnProfile && (
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity 
                  style={styles.editProfileButton}
                  onPress={() => navigation.navigate('EditProfile')}
                >
                  <Text style={styles.editProfileButtonText}>Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareProfileButton}>
                  <Ionicons name="share-outline" size={20} color="#667eea" />
                  <Text style={styles.shareProfileButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Content Tabs */}
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
            </TouchableOpacity>
          </View>

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
                  {isOwnProfile 
                    ? `Share your first ${activeTab === 'posts' ? 'post' : 'reel'} to get started!`
                    : `${profile.displayName} hasn't shared any ${activeTab} yet.`
                  }
                </Text>
              </View>
            ) : (
              <FlatList
                data={currentContent}
                renderItem={renderGridItem}
                keyExtractor={(item) => item.id}
                numColumns={3}
                scrollEnabled={false}
                style={styles.grid}
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Media Viewer */}
      <MediaViewer
        visible={mediaViewerVisible}
        onClose={() => setMediaViewerVisible(false)}
        content={selectedContent}
        contentType={selectedContentType}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  editButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ddd',
    marginRight: 20,
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
  profileInfo: {
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  displayName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
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
  socialLinksContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  socialLink: {
    marginRight: 16,
    padding: 4,
  },
  tiktokIcon: {
    fontSize: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
    paddingHorizontal: 5,
  },
  primaryActionButton: {
    flex: 2,
  },
  followButton: {
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 45,
    elevation: 2,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  followingButton: {
    backgroundColor: '#f0f4f8',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  followButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  followingButtonText: {
    color: '#64748b',
  },
  messageButton: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 45,
  },
  messageButtonText: {
    color: '#667eea',
    fontWeight: '500',
    fontSize: 14,
  },
  moreButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 45,
    width: 45,
  },
  editProfileButton: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 45,
  },
  editProfileButtonText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 16,
  },
  shareProfileButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 45,
    marginLeft: 10,
  },
  shareProfileButtonText: {
    color: '#667eea',
    fontWeight: '500',
    fontSize: 14,
  },
  tabsContainer: {
    flexDirection: 'row',
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
  contentContainer: {
    flex: 1,
  },
  grid: {
    paddingHorizontal: 2,
  },
  gridItem: {
    width: gridItemSize,
    height: gridItemSize,
    marginBottom: 2,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ddd',
  },
  reelIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 4,
  },
  gridStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridStatText: {
    fontSize: 10,
    color: '#fff',
    marginLeft: 2,
    fontWeight: '600',
  },
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
  profileMetadata: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  metadataText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  debugButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 10,
    alignSelf: 'center',
    marginHorizontal: 5,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  debugContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
});
