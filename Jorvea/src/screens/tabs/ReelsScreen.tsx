import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import CommentModal from '../../components/CommentModal';
import { useAuth } from '../../context/AuthContext';
import { commentService, contentService, profileService } from '../../services';
import { eventService } from '../../services/eventService';
import { FirebaseReel } from '../../services/firebaseContentService';

const { width, height } = Dimensions.get('window');
const REEL_HEIGHT = height - 140; // Account for tabs and status bar

export default function ReelsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [reels, setReels] = useState<FirebaseReel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playingVideos, setPlayingVideos] = useState<{ [key: string]: boolean }>({});
  const [likedReels, setLikedReels] = useState<{ [key: string]: boolean }>({});
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedReel, setSelectedReel] = useState<FirebaseReel | null>(null);
  const [reelCommentCounts, setReelCommentCounts] = useState<{ [key: string]: number }>({});
  const [userProfiles, setUserProfiles] = useState<{ [userId: string]: any }>({});
  const [showReelInfo, setShowReelInfo] = useState<{ [key: string]: boolean }>({});
  const flatListRef = useRef<FlatList>(null);
  const videoRefs = useRef<{ [key: string]: Video | null }>({});

  useEffect(() => {
    loadReels();
    
    // Auto-refresh every 30 seconds when app is active
    const interval = setInterval(() => {
      if (!refreshing && !loading) {
        loadReels();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Listen for new posts/reels from other screens
  useEffect(() => {
    // Listen for content creation events
    const unsubscribeContentCreated = eventService.onContentCreated((data) => {
      if (data.type === 'reel') {
        // Immediately refresh when new reel is created
        loadReels();
      }
    });
    
    return () => {
      unsubscribeContentCreated();
    };
  }, []);

  // Handle screen focus/blur - pause videos when leaving screen
  useFocusEffect(
    React.useCallback(() => {
      // When screen comes into focus, resume current video
      const currentReel = reels[currentIndex];
      if (currentReel) {
        setPlayingVideos(prev => ({ ...prev, [currentReel.id]: true }));
      }

      return () => {
        // When screen loses focus, pause all videos
        setPlayingVideos({});
        Object.values(videoRefs.current).forEach(async (videoRef) => {
          if (videoRef) {
            try {
              await videoRef.pauseAsync();
            } catch (error) {
              // Ignore errors when pausing
            }
          }
        });
      };
    }, [currentIndex, reels])
  );

  const loadReels = async () => {
    try {
      setLoading(true);
      const allReels = await contentService.getAllReels();
      setReels(allReels);
      
      // Load user profiles for all reel authors
      const profiles: { [userId: string]: any } = {};
      const uniqueUserIds = [...new Set(allReels.map(reel => reel.userId))];
      
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
      
      // Load comment counts for all reels
      const commentCounts: { [key: string]: number } = {};
      for (const reel of allReels) {
        const count = await commentService.getCommentCount(reel.id, 'reel');
        commentCounts[reel.id] = count;
      }
      setReelCommentCounts(commentCounts);
    } catch (error) {
      console.error('Error loading reels:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReels();
    setRefreshing(false);
  };

  const toggleVideoPlay = async (reelId: string) => {
    const videoRef = videoRefs.current[reelId];
    if (videoRef) {
      const isPlaying = playingVideos[reelId];
      if (isPlaying) {
        await videoRef.pauseAsync();
      } else {
        await videoRef.playAsync();
      }
      setPlayingVideos(prev => ({ ...prev, [reelId]: !isPlaying }));
    }
  };

  const handleLike = async (reel: FirebaseReel) => {
    try {
      if (!user?.uid) return;
      
      const wasLiked = await contentService.toggleReelLike(reel.id, user.uid);
      eventService.emitContentInteraction(wasLiked ? 'like' : 'unlike', 'reel', reel.id);
      
      if (wasLiked) {
        // Increment views when user likes
        await contentService.incrementViews(reel.id, 'reel');
      }
      
      setLikedReels(prev => ({ ...prev, [reel.id]: wasLiked }));
      // Reload reels to get updated counts
      loadReels();
    } catch (error) {
      console.error('Error liking reel:', error);
    }
  };

  const handleShare = async (reel: FirebaseReel) => {
    try {
      // TODO: Implement share functionality in Firebase service
      // await contentService.shareReel(reel.id);
      eventService.emitContentInteraction('share', 'reel', reel.id);
      Alert.alert('Shared!', 'Reel shared successfully');
      // loadReels(); // Reload to get updated share count
    } catch (error) {
      console.error('Error sharing reel:', error);
    }
  };

  const handleComment = async (reel: FirebaseReel) => {
    setSelectedReel(reel);
    setCommentModalVisible(true);
  };

  const handleDeleteReel = async (reel: FirebaseReel) => {
    try {
      if (!user?.uid) return;
      
      // Show confirmation dialog
      Alert.alert(
        'Delete Reel',
        'Are you sure you want to delete this reel? This action cannot be undone and will remove the video from all databases including MUX.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                // Show loading state
                Alert.alert('Deleting...', 'Please wait while we remove your reel.');
                
                // Delete the reel (this will handle Firebase, MUX, comments, and notifications)
                await contentService.deleteReel(reel.id, user.uid);
                
                // Remove from local state
                setReels(prev => prev.filter(r => r.id !== reel.id));
                
                // Show success message
                Alert.alert('Success', 'Your reel has been deleted successfully.');
                
                // Reload reels to ensure consistency
                loadReels();
              } catch (error) {
                console.error('Error deleting reel:', error);
                Alert.alert('Error', 'Failed to delete reel. Please try again.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error in delete reel handler:', error);
    }
  };

  const handleCommentModalClose = async () => {
    setCommentModalVisible(false);
    setSelectedReel(null);
    // Reload comment counts after modal closes
    if (reels.length > 0) {
      const commentCounts: { [key: string]: number } = {};
      for (const reel of reels) {
        const count = await commentService.getCommentCount(reel.id, 'reel');
        commentCounts[reel.id] = count;
      }
      setReelCommentCounts(commentCounts);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  const renderReel = ({ item, index }: { item: FirebaseReel; index: number }) => {
    const isActive = index === currentIndex;
    const isPlaying = playingVideos[item.id] || false;
    const isLiked = likedReels[item.id] || false;
    const userProfile = userProfiles[item.userId];
    
    // Construct video URL with proper MUX handling
    let videoUrl = '';
    let isProcessing = false;
    
    // Check if we have a direct video URL (non-MUX)
    if (item.videoUrl && !item.videoUrl.includes('stream.mux.com') && !item.videoUrl.startsWith('processing-')) {
      videoUrl = item.videoUrl;
    }
    // Check for proper MUX playback ID (should be different from asset ID)
    else if (item.muxPlaybackId && item.muxPlaybackId !== item.muxAssetId && !item.muxPlaybackId.startsWith('processing-')) {
      videoUrl = `https://stream.mux.com/${item.muxPlaybackId}.m3u8`;
    }
    // Check if we have a videoUrl that's already a proper MUX stream URL
    else if (item.videoUrl && item.videoUrl.includes('stream.mux.com')) {
      videoUrl = item.videoUrl;
    }
    // CONTROLLED FALLBACK: Only try asset ID as last resort for older videos
    else if (item.muxAssetId && !item.muxAssetId.startsWith('processing-') && item.muxAssetId.length > 10) {
      // Calculate processing time
      const createdAt = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
      const minutesSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60);
      
      // Only try direct asset playback for videos older than 2 minutes as a last resort
      if (minutesSinceCreation > 2) {
        console.log('⚠️ Last resort: Trying asset ID as playback URL for reel:', item.id);
        console.log('⏰ Video created', minutesSinceCreation.toFixed(1), 'minutes ago');
        videoUrl = `https://stream.mux.com/${item.muxAssetId}.m3u8`;
      } else {
        console.log('⏳ Video too new (', minutesSinceCreation.toFixed(1), 'min), waiting for proper processing');
        isProcessing = true;
      }
    }
    // Check if video is still processing
    else if (item.muxAssetId && (item.muxAssetId.startsWith('processing-') || item.videoUrl?.startsWith('processing-'))) {
      isProcessing = true;
    }
    // Last resort: if we have any asset ID, try it
    else if (item.muxAssetId) {
      isProcessing = true;
    }

    const handleRetryVideo = async () => {
      try {
        console.log('🔄 Manual refresh for reel:', item.id);
        console.log('📋 Current data - Asset:', item.muxAssetId, 'Playback:', item.muxPlaybackId);
        
        // First try to refresh the video status from MUX (this handles upload ID -> asset ID conversion)
        const statusUpdated = await contentService.refreshReelVideoStatus(item.id);
        
        if (statusUpdated) {
          console.log('✅ Video status updated successfully, reloading reels...');
        } else {
          console.log('⏳ Video still not ready, but refreshing list anyway...');
        }
        
        // Always refresh the reels list to get any updates
        await loadReels();
      } catch (error) {
        console.error('Error retrying video:', error);
        // Still try to refresh the list even if status update failed
        try {
          await loadReels();
        } catch (listError) {
          console.error('Error refreshing reels list:', listError);
        }
      }
    };
    
    // Show processing state with retry option
    if (isProcessing || !videoUrl) {
      console.warn('Video still processing for reel:', item.id, 'Asset:', item.muxAssetId, 'Playback:', item.muxPlaybackId);
      
      // Calculate how long the video has been processing
      const createdAt = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
      const minutesSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60);
      const processingTime = minutesSinceCreation.toFixed(1);
      
      return (
        <View style={styles.reelContainer}>
          <View style={[styles.video, { backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="play-circle-outline" size={80} color="#fff" style={{ opacity: 0.5 }} />
            <Text style={{ color: '#fff', textAlign: 'center', marginTop: 20, fontSize: 16 }}>
              Video Processing...
            </Text>
            <Text style={{ color: '#ccc', textAlign: 'center', marginTop: 10, fontSize: 14 }}>
              Processing for {processingTime} minutes
            </Text>
            <Text style={{ color: '#999', textAlign: 'center', marginTop: 5, fontSize: 12 }}>
              Usually takes 1-2 minutes
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={handleRetryVideo}
            >
              <Ionicons name="refresh" size={20} color="#667eea" />
              <Text style={styles.retryText}>Tap to refresh</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    return (
      <View style={styles.reelContainer}>
        <TouchableOpacity 
          style={styles.videoTouchable}
          onPress={() => toggleVideoPlay(item.id)}
          activeOpacity={1}
        >
          <Video
            ref={(ref) => { videoRefs.current[item.id] = ref; }}
            source={{ uri: videoUrl }}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay={isActive && isPlaying}
            isLooping
            isMuted={!isActive} // Only unmute if active
            onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
              if (status.isLoaded && status.didJustFinish && !playingVideos[item.id]) {
                // Auto-replay when video ends only if it's not already marked as playing
                setPlayingVideos(prev => ({ ...prev, [item.id]: true }));
              }
            }}
            onError={(error) => {
              console.error(`Video playback error for reel ${item.id}:`, error);
              console.log(`Reel details - Asset: ${item.muxAssetId}, Playback: ${item.muxPlaybackId}, URL: ${videoUrl}`);
            }}
          />
          
          {/* Play/Pause Overlay */}
          {!isPlaying && (
            <View style={styles.playOverlay}>
              <View style={styles.playButton}>
                <Ionicons name="play" size={40} color="#fff" />
              </View>
            </View>
          )}
          
          {/* Gradient Overlay for better text visibility */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
            style={styles.gradientOverlay}
          />
        </TouchableOpacity>
        
        {/* Overlay Content */}
        <View style={styles.overlay}>
          {/* Right Side Actions */}
          <View style={styles.rightActions}>
            {/* Profile Picture */}
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('UserProfile', { userId: item.userId })}
            >
              <Image
                source={{ 
                  uri: userProfile?.profilePicture || 'https://via.placeholder.com/50' 
                }}
                style={styles.profilePicture}
              />
              {userProfile?.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, isLiked && styles.likedButton]}
              onPress={() => handleLike(item)}
            >
              <View style={[styles.actionIconContainer, isLiked && styles.likedIconContainer]}>
                <Ionicons 
                  name={isLiked ? "heart" : "heart-outline"} 
                  size={32} 
                  color={isLiked ? "#ff3040" : "#fff"} 
                />
              </View>
              <Text style={[styles.actionText, isLiked && styles.likedText]}>
                {item.likes > 999 ? `${(item.likes / 1000).toFixed(1)}K` : item.likes}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleComment(item)}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="chatbubble-outline" size={28} color="#fff" />
              </View>
              <Text style={styles.actionText}>
                {reelCommentCounts[item.id] > 999 ? `${(reelCommentCounts[item.id] / 1000).toFixed(1)}K` : (reelCommentCounts[item.id] || 0)}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleShare(item)}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="arrow-redo-outline" size={28} color="#fff" />
              </View>
              <Text style={styles.actionText}>
                {item.shares > 999 ? `${(item.shares / 1000).toFixed(1)}K` : item.shares}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="eye-outline" size={28} color="#fff" />
              </View>
              <Text style={styles.actionText}>
                {item.views > 999 ? `${(item.views / 1000).toFixed(1)}K` : item.views}
              </Text>
            </TouchableOpacity>

            {/* Delete button - only show for user's own videos */}
            {user && item.userId === user.uid ? (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleDeleteReel(item)}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="trash-outline" size={24} color="#ff4444" />
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.actionButton}>
                <View style={styles.actionIconContainer}>
                  <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
                </View>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Bottom Content */}
          <View style={styles.bottomContent}>
            <TouchableOpacity 
              style={styles.userInfo}
              onPress={() => navigation.navigate('UserProfile', { userId: item.userId })}
            >
              <View style={styles.userRow}>
                <Image
                  source={{ 
                    uri: userProfile?.profilePicture || 'https://via.placeholder.com/30' 
                  }}
                  style={styles.bottomProfilePicture}
                />
                <View style={styles.userDetails}>
                  <View style={styles.usernameRow}>
                    <Text style={styles.username}>
                      @{userProfile?.username || item.username || 'user'}
                    </Text>
                    {userProfile?.isVerified && (
                      <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" style={styles.verifiedIcon} />
                    )}
                  </View>
                  {userProfile?.location && (
                    <Text style={styles.locationText}>📍 {userProfile.location}</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
            <Text style={styles.description}>{item.caption}</Text>
            {item.tags && item.tags.length > 0 && (
              <Text style={styles.tags}>
                {item.tags.map(tag => `#${tag}`).join(' ')}
              </Text>
            )}
            {/* Music info removed - not available in FirebaseReel */}
          </View>
        </View>
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
          <Text style={styles.headerTitle}>Reels</Text>
        </LinearGradient>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading reels...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (reels.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Reels</Text>
        </LinearGradient>
        
        <View style={styles.emptyState}>
          <Ionicons name="videocam-outline" size={64} color="#999" />
          <Text style={styles.emptyTitle}>No Reels Yet</Text>
          <Text style={styles.emptySubtitle}>
            Be the first to create a reel and share it with the community!
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
        <Text style={styles.headerTitle}>Reels</Text>
      </LinearGradient>
      
      <FlatList
        ref={flatListRef}
        data={reels}
        renderItem={renderReel}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={REEL_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
      />
      
      {/* Comment Modal */}
      <CommentModal
        visible={commentModalVisible}
        onClose={handleCommentModalClose}
        contentId={selectedReel?.id || ''}
        contentType="reel"
        contentTitle={selectedReel?.caption}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  
  // Reel Container
  reelContainer: {
    width: width,
    height: REEL_HEIGHT,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoTouchable: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'transparent',
  },
  
  // Overlay
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  
  // Right Actions
  rightActions: {
    position: 'absolute',
    right: 12,
    bottom: 100,
    alignItems: 'center',
  },
  profileButton: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#1DA1F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 8,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  likedButton: {
    transform: [{ scale: 1.1 }],
  },
  likedIconContainer: {
    backgroundColor: 'rgba(255, 48, 64, 0.2)',
  },
  actionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  likedText: {
    color: '#ff3040',
  },
  
  // Bottom Content
  bottomContent: {
    position: 'absolute',
    bottom: 20,
    left: 12,
    right: 80,
  },
  userInfo: {
    marginBottom: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomProfilePicture: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
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
    fontWeight: 'bold',
    marginBottom: 4,
    marginRight: 4,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  locationText: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 2,
  },
  description: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  tags: {
    color: '#64b5f6',
    fontSize: 14,
    fontWeight: '600',
  },
  musicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  musicText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  
  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 40,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Retry Button
  retryButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#667eea',
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Comment Modal Styles
  commentModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
});
