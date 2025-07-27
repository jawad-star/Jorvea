import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Alert,
  StyleSheet,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { contentService } from '../services';
import { eventService } from '../services/eventService';
import { Post, Reel } from '../types/media';
import CommentModal from './CommentModal';

const { width, height } = Dimensions.get('window');

interface MediaViewerProps {
  visible: boolean;
  onClose: () => void;
  content: Post | Reel | null;
  contentType: 'post' | 'reel';
  navigation?: any;
}

export default function MediaViewer({ visible, onClose, content, contentType, navigation }: MediaViewerProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const videoRef = useRef<Video>(null);

  if (!content) return null;

  const handleLike = async () => {
    if (!user) return;
    
    try {
      if (contentType === 'post') {
        const newLikeStatus = await contentService.togglePostLike(content.id, user.uid);
        eventService.emitContentInteraction(newLikeStatus ? 'like' : 'unlike', 'post', content.id);
        setIsLiked(newLikeStatus);
      } else {
        const newLikeStatus = await contentService.toggleReelLike(content.id, user.uid);
        eventService.emitContentInteraction(newLikeStatus ? 'like' : 'unlike', 'reel', content.id);
        setIsLiked(newLikeStatus);
      }
    } catch (error) {
      console.error('Error liking content:', error);
    }
  };

  const handleShare = async () => {
    try {
      // TODO: Implement share functionality in Firebase service
      eventService.emitContentInteraction('share', contentType, content.id);
      Alert.alert('Shared!', `${contentType === 'post' ? 'Post' : 'Reel'} shared successfully`);
    } catch (error) {
      console.error('Error sharing content:', error);
    }
  };

  const handleComment = () => {
    setCommentModalVisible(true);
  };

  const toggleVideoPlay = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const renderPostContent = (post: Post) => {
    if (post.mediaType === 'video') {
      return (
        <TouchableOpacity style={styles.mediaContainer} onPress={toggleVideoPlay}>
          <Video
            ref={videoRef}
            source={{ uri: post.mediaUrl }}
            style={styles.media}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={isPlaying}
            isLooping
            onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
              if (status.isLoaded) {
                setIsPlaying(status.isPlaying || false);
              }
            }}
          />
          {!isPlaying && (
            <View style={styles.playOverlay}>
              <View style={styles.playButton}>
                <Ionicons name="play" size={40} color="#fff" />
              </View>
            </View>
          )}
        </TouchableOpacity>
      );
    } else {
      return (
        <View style={styles.mediaContainer}>
          <Image source={{ uri: post.mediaUrl }} style={styles.media} resizeMode="contain" />
        </View>
      );
    }
  };

  const renderReelContent = (reel: Reel) => {
    return (
      <TouchableOpacity style={styles.mediaContainer} onPress={toggleVideoPlay}>
        <Video
          ref={videoRef}
          source={{ uri: reel.videoUrl }}
          style={styles.media}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={isPlaying}
          isLooping
          onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
            if (status.isLoaded) {
              setIsPlaying(status.isPlaying || false);
            }
          }}
        />
        {!isPlaying && (
          <View style={styles.playOverlay}>
            <View style={styles.playButton}>
              <Ionicons name="play" size={40} color="#fff" />
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getTitle = () => {
    if (contentType === 'post') {
      return (content as Post).caption;
    } else {
      return (content as Reel).title;
    }
  };

  const getDescription = () => {
    if (contentType === 'post') {
      return (content as Post).caption;
    } else {
      return (content as Reel).description;
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.9)" translucent />
          
          {/* Header */}
          <LinearGradient
            colors={['rgba(0,0,0,0.8)', 'transparent']}
            style={styles.header}
          >
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.userName}>@{content.userName}</Text>
              <Text style={styles.contentType}>{contentType === 'post' ? 'Post' : 'Reel'}</Text>
            </View>
            <View style={styles.placeholder} />
          </LinearGradient>

          {/* Media Content */}
          <View style={styles.contentContainer}>
            {contentType === 'post' ? renderPostContent(content as Post) : renderReelContent(content as Reel)}
          </View>

          {/* Bottom Info and Actions */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.bottomContainer}
          >
            <View style={styles.infoSection}>
              <Text style={styles.title} numberOfLines={2}>
                {getTitle()}
              </Text>
              {getDescription() && getDescription() !== getTitle() && (
                <Text style={styles.description} numberOfLines={3}>
                  {getDescription()}
                </Text>
              )}
            </View>

            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                <Ionicons 
                  name={isLiked ? "heart" : "heart-outline"} 
                  size={28} 
                  color={isLiked ? "#ff4757" : "#fff"} 
                />
                <Text style={styles.actionText}>
                  {content.likes > 999 ? `${(content.likes / 1000).toFixed(1)}K` : content.likes}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
                <Ionicons name="chatbubble-outline" size={28} color="#fff" />
                <Text style={styles.actionText}>
                  {contentType === 'post' 
                    ? ((content as Post).comments > 999 ? `${((content as Post).comments / 1000).toFixed(1)}K` : (content as Post).comments)
                    : ((content as Reel).comments > 999 ? `${((content as Reel).comments / 1000).toFixed(1)}K` : (content as Reel).comments)
                  }
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Ionicons name="share-outline" size={28} color="#fff" />
                <Text style={styles.actionText}>
                  {content.shares > 999 ? `${(content.shares / 1000).toFixed(1)}K` : content.shares}
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </SafeAreaView>
      </Modal>

      {/* Comment Modal */}
      <CommentModal
        visible={commentModalVisible}
        onClose={() => setCommentModalVisible(false)}
        contentId={content.id}
        contentType={contentType}
        contentTitle={getTitle()}
        navigation={navigation}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  contentType: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 2,
  },
  placeholder: {
    width: 44,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaContainer: {
    width: width,
    height: height * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 40,
  },
  infoSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
  },
  actionText: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
    fontWeight: '600',
  },
});
