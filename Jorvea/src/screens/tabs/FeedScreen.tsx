import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { contentService, commentService, storyService, profileService } from '../../services';
import { eventService } from '../../services/eventService';
import { Post } from '../../types/media';
import { FirebasePost } from '../../services/firebaseContentService';
import CommentModal from '../../components/CommentModal';
import StoriesCarousel from '../../components/StoriesCarousel';
import FloatingActionButton from '../../components/FloatingActionButton';
import StoryViewer from '../../components/StoryViewer';
import { StoryGroup } from '../../services/firebaseContentService';
import NotificationIcon from '../../components/NotificationIcon';

export default function FeedScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [posts, setPosts] = useState<FirebasePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [likedPosts, setLikedPosts] = useState<{ [key: string]: boolean }>({});
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<FirebasePost | null>(null);
  const [postCommentCounts, setPostCommentCounts] = useState<{ [key: string]: number }>({});
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [selectedStoryGroup, setSelectedStoryGroup] = useState(0);
  const [userProfiles, setUserProfiles] = useState<{ [userId: string]: any }>({});

  useEffect(() => {
    if (!user?.uid) return;

    // Setup real-time posts listener for Firebase
    const unsubscribePosts = user?.uid
      ? contentService.subscribeToFeed((posts: any[]) => {
          setPosts(posts);
          setLoading(false);
          
          // Load user profiles for all post authors
          const profilePromises: { [userId: string]: any } = {};
          const uniqueUserIds = [...new Set(posts.map((post: any) => post.userId))];
          
          uniqueUserIds.forEach(async (userId: string) => {
            try {
              const profile = await profileService.getUserProfile(userId);
              if (profile) {
                setUserProfiles(prev => ({ ...prev, [userId]: profile }));
              }
            } catch (error) {
              console.error(`Error loading profile for user ${userId}:`, error);
            }
          });
          
          // Load comment counts for all posts
          posts.forEach(async (post: any) => {
            try {
              const count = await commentService.getCommentCount(post.id, 'post');
              setPostCommentCounts(prev => ({ ...prev, [post.id]: count }));
            } catch (error) {
              console.error(`Error loading comment count for post ${post.id}:`, error);
            }
          });
        })
      : null;
    
    // Fallback: Load posts if real-time subscription not available
    if (!unsubscribePosts) {
      loadPosts();
    }
    
    // Listen for content creation events
    const unsubscribeContentCreated = eventService.onContentCreated((data) => {
      if (data.type === 'post') {
        // Immediately refresh when new post is created
        if (!unsubscribePosts) {
          loadPosts();
        }
      }
    });
    
    // Load stories
    loadStories();

    return () => {
      if (unsubscribePosts) {
        unsubscribePosts();
      }
      unsubscribeContentCreated();
    };
  }, [user?.uid]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const allPosts = await contentService.getAllPosts();
      setPosts(allPosts);
      
      // Load user profiles for all post authors
      const profiles: { [userId: string]: any } = {};
      const uniqueUserIds = [...new Set(allPosts.map(post => post.userId))];
      
      for (const userId of uniqueUserIds) {
        try {
          const profile = await profileService.getUserProfile(userId);
          if (profile) {
            profiles[userId] = profile;
          }
        } catch (error) {
          console.error(`Error loading profile for user ${userId}:`, error);
        }
      }
      setUserProfiles(profiles);
      
      // Load comment counts for all posts
      const commentCounts: { [key: string]: number } = {};
      for (const post of allPosts) {
        const count = await commentService.getCommentCount(post.id, 'post');
        commentCounts[post.id] = count;
      }
      setPostCommentCounts(commentCounts);
      
      // Also load stories
      await loadStories();
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStories = async () => {
    if (!user?.uid) return;
    
    try {
      const groups = await storyService.getStoriesForUser(user.uid);
      setStoryGroups(groups);
    } catch (error) {
      console.error('Error loading stories:', error);
      // Set empty array on error to show "Add Story" button
      setStoryGroups([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleLike = async (post: FirebasePost) => {
    try {
      if (!user?.uid) return;
      
      const wasLiked = await contentService.togglePostLike(post.id, user.uid);
      eventService.emitContentInteraction(wasLiked ? 'like' : 'unlike', 'post', post.id);
      setLikedPosts(prev => ({ ...prev, [post.id]: wasLiked }));
      loadPosts(); // Reload to get updated counts
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleShare = async (post: FirebasePost) => {
    try {
      // TODO: Implement share functionality in Firebase service
      // await contentService.sharePost(post.id);
      eventService.emitContentInteraction('share', 'post', post.id);
      Alert.alert('Shared!', 'Post shared successfully');
      // loadPosts(); // Reload to get updated share count
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const handleComment = async (post: FirebasePost) => {
    setSelectedPost(post);
    setCommentModalVisible(true);
  };

  const handleCommentModalClose = async () => {
    setCommentModalVisible(false);
    setSelectedPost(null);
    // Reload comment counts after modal closes
    if (posts.length > 0) {
      const commentCounts: { [key: string]: number } = {};
      for (const post of posts) {
        const count = await commentService.getCommentCount(post.id, 'post');
        commentCounts[post.id] = count;
      }
      setPostCommentCounts(commentCounts);
    }
  };

  const handleStoryPress = (groupIndex: number) => {
    setSelectedStoryGroup(groupIndex);
    setStoryViewerVisible(true);
  };

  const handleAddStory = () => {
    navigation.navigate('CreateContent', { type: 'story' });
  };

  const renderPost = ({ item }: { item: FirebasePost }) => {
    const isLiked = likedPosts[item.id] || false;
    const userProfile = userProfiles[item.userId];
    
    return (
      <View style={styles.postContainer}>
        {/* Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity 
            style={styles.userInfo}
            onPress={() => navigation.navigate('UserProfile', { userId: item.userId })}
          >
            <View style={styles.avatarContainer}>
              {userProfile?.profilePicture || item.userAvatar ? (
                <Image 
                  source={{ uri: userProfile?.profilePicture || item.userAvatar }} 
                  style={styles.avatar} 
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={20} color="#999" />
                </View>
              )}
              {userProfile?.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={10} color="#fff" />
                </View>
              )}
            </View>
            <View>
              <View style={styles.userNameRow}>
                <Text style={styles.username}>
                  {userProfile?.displayName || item.username}
                </Text>
                {userProfile?.isVerified && (
                  <Ionicons name="checkmark-circle" size={14} color="#1DA1F2" style={styles.verifiedIcon} />
                )}
              </View>
              <Text style={styles.timestamp}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
              {userProfile?.location && (
                <Text style={styles.location}>
                  <Ionicons name="location-outline" size={12} color="#666" /> {userProfile.location}
                </Text>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Media */}
        <View style={styles.mediaContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
          ) : item.videoUrl ? (
            <Video
              source={{ uri: item.videoUrl }}
              style={styles.postVideo}
              resizeMode={ResizeMode.COVER}
              useNativeControls
              shouldPlay={false}
            />
          ) : item.muxPlaybackId ? (
            <Video
              source={{ uri: `https://stream.mux.com/${item.muxPlaybackId}.m3u8` }}
              style={styles.postVideo}
              resizeMode={ResizeMode.COVER}
              useNativeControls
              shouldPlay={false}
            />
          ) : null}
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <View style={styles.leftActions}>
            <TouchableOpacity 
              style={[styles.actionButton, isLiked && styles.likedButton]}
              onPress={() => handleLike(item)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={24} 
                color={isLiked ? "#fff" : "#333"} 
              />
              <Text style={[styles.actionText, isLiked && styles.likedText]}>
                {item.likes > 999 ? `${(item.likes / 1000).toFixed(1)}K` : item.likes}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleComment(item)}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-outline" size={22} color="#333" />
              <Text style={styles.actionText}>
                {postCommentCounts[item.id] > 999 ? `${(postCommentCounts[item.id] / 1000).toFixed(1)}K` : (postCommentCounts[item.id] || 0)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleShare(item)}
              activeOpacity={0.7}
            >
              <Ionicons name="paper-plane-outline" size={22} color="#333" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity>
            <Ionicons name="bookmark-outline" size={22} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.likesText}>
            {item.likes} {item.likes === 1 ? 'like' : 'likes'}
          </Text>
          <View style={styles.statsSeparator}>
            <Text style={styles.statsText}>
              {item.commentsCount} comments • {item.shares} shares
            </Text>
          </View>
        </View>

        {/* Caption */}
        <View style={styles.captionContainer}>
          <Text style={styles.captionText}>
            <Text style={styles.usernameText}>{item.username}</Text> {item.caption}
          </Text>
        </View>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={styles.tagsText}>
              {item.tags.map(tag => `#${tag}`).join(' ')}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Jorvea</Text>
        </LinearGradient>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading feed...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (posts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Jorvea</Text>
        </LinearGradient>
        
        <View style={styles.emptyState}>
          <Ionicons name="camera-outline" size={64} color="#999" />
          <Text style={styles.emptyTitle}>No Posts Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start following people or create your first post to see content here!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Jorvea</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerAction}
            onPress={() => {
              // Navigate to messages screen
              console.log('Navigate to messages');
            }}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <NotificationIcon color="#fff" />
        </View>
      </LinearGradient>
      
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <StoriesCarousel 
            onAddStoryPress={handleAddStory}
            onStoryPress={handleStoryPress}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#667eea']}
          />
        }
      />
      
      {/* Story Viewer */}
      <StoryViewer
        visible={storyViewerVisible}
        onClose={() => setStoryViewerVisible(false)}
        storyGroups={storyGroups}
        initialGroupIndex={selectedStoryGroup}
      />
      
      {/* Floating Action Button */}
      <FloatingActionButton
        onCreatePost={() => navigation.navigate('CreateContent', { type: 'post' })}
        onCreateReel={() => navigation.navigate('CreateContent', { type: 'reel' })}
        onCreateStory={() => navigation.navigate('CreateContent', { type: 'story' })}
        onGoLive={() => {
          Alert.alert('Coming Soon', 'Live streaming feature is coming soon!');
        }}
      />
      
      {/* Comment Modal */}
      <CommentModal
        visible={commentModalVisible}
        onClose={handleCommentModalClose}
        contentId={selectedPost?.id || ''}
        contentType="post"
        contentTitle={selectedPost?.caption}
        navigation={navigation}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  headerAction: {
    padding: 5,
  },
  notificationIconContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ff3040',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  
  // Post Container
  postContainer: {
    backgroundColor: '#fff',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  
  // Post Header
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 10,
    position: 'relative',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#1DA1F2',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  verifiedIcon: {
    marginLeft: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  location: {
    fontSize: 11,
    color: '#666',
    marginTop: 1,
  },
  
  // Media
  mediaContainer: {
    width: '100%',
    aspectRatio: 1,
  },
  postImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  postVideo: {
    width: '100%',
    height: '100%',
  },
  
  // Actions
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: 16,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionCount: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  
  // Likes
  likesContainer: {
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  likesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  
  // Stats
  statsContainer: {
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  statsSeparator: {
    marginTop: 2,
  },
  statsText: {
    fontSize: 12,
    color: '#999',
  },
  
  // Caption
  captionContainer: {
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  captionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  usernameText: {
    fontWeight: '600',
  },
  
  // Tags
  tagsContainer: {
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  tagsText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '600',
  },
  
  // Time
  timeContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
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
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Enhanced action styles
  likedButton: {
    backgroundColor: '#ff3040',
    borderColor: '#ff3040',
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '600',
  },
  likedText: {
    color: '#fff',
  },
});
