import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  StatusBar,
  Animated,
  SafeAreaView,
  Alert
} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { storyService } from '../services';
import { Story, StoryGroup } from '../services/firebaseContentService';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

interface StoryViewerProps {
  visible: boolean;
  onClose: () => void;
  storyGroups: StoryGroup[];
  initialGroupIndex: number;
  initialStoryIndex?: number;
}

export default function StoryViewer({
  visible,
  onClose,
  storyGroups,
  initialGroupIndex,
  initialStoryIndex = 0
}: StoryViewerProps) {
  const { user } = useAuth();
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  
  const progressTimer = useRef<NodeJS.Timeout | number | null>(null);
  const videoRef = useRef<Video>(null);
  const panY = useRef(new Animated.Value(0)).current;

  const currentGroup = storyGroups[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];
  const storyDuration = 5000; // 5 seconds per story

  useEffect(() => {
    if (visible && currentStory) {
      startProgress();
      markAsViewed();
    }
    return () => {
      if (progressTimer.current) {
        clearInterval(progressTimer.current);
      }
    };
  }, [visible, currentStoryIndex, currentGroupIndex]);

  const startProgress = () => {
    setProgress(0);
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
    }

    if (!isPaused) {
      progressTimer.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            nextStory();
            return 0;
          }
          return prev + (100 / (storyDuration / 100));
        });
      }, 100);
    }
  };

  const markAsViewed = async () => {
    if (currentStory && user?.uid) {
      await storyService.markStoryAsViewed(currentStory.id, user.uid);
    }
  };

  const nextStory = () => {
    if (currentStoryIndex < currentGroup.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else {
      nextGroup();
    }
  };

  const previousStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else {
      previousGroup();
    }
  };

  const nextGroup = () => {
    if (currentGroupIndex < storyGroups.length - 1) {
      setCurrentGroupIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      onClose();
    }
  };

  const previousGroup = () => {
    if (currentGroupIndex > 0) {
      setCurrentGroupIndex(prev => prev - 1);
      setCurrentStoryIndex(0);
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    if (isPaused) {
      startProgress();
    } else {
      if (progressTimer.current) {
        clearInterval(progressTimer.current);
      }
    }
  };

  const handleDeleteStory = async () => {
    if (currentStory && user?.uid === currentStory.userId) {
      Alert.alert(
        'Delete Story',
        'Are you sure you want to delete this story?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await storyService.deleteStory(currentStory.id, user.uid);
              nextStory();
            }
          }
        ]
      );
    }
  };

  const onPanGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: panY } }],
    { useNativeDriver: false }
  );

  const onPanHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === 4) { // ACTIVE
      if (event.nativeEvent.translationY > 100) {
        onClose();
      } else {
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      }
    }
  };

  if (!visible || !currentStory) {
    return null;
  }

  const timeRemaining = storyService.getTimeRemaining(currentStory);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <PanGestureHandler
        onGestureEvent={onPanGestureEvent}
        onHandlerStateChange={onPanHandlerStateChange}
      >
        <Animated.View 
          style={[
            styles.container,
            {
              transform: [{ translateY: panY }]
            }
          ]}
        >
          {/* Story Progress Bars */}
          <SafeAreaView style={styles.progressContainer}>
            <View style={styles.progressBars}>
              {currentGroup.stories.map((_, index) => (
                <View key={index} style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: 
                          index < currentStoryIndex ? '100%' :
                          index === currentStoryIndex ? `${progress}%` : '0%'
                      }
                    ]}
                  />
                </View>
              ))}
            </View>

            {/* Story Header */}
            <View style={styles.storyHeader}>
              <View style={styles.userInfo}>
                <View style={styles.avatarContainer}>
                  {currentGroup.userAvatar ? (
                    <Image source={{ uri: currentGroup.userAvatar }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={20} color="#fff" />
                    </View>
                  )}
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{currentGroup.userName}</Text>
                  <Text style={styles.timeAgo}>{timeRemaining}</Text>
                </View>
              </View>

              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={togglePause}
                >
                  <Ionicons 
                    name={isPaused ? "play" : "pause"} 
                    size={20} 
                    color="#fff" 
                  />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => setShowInfo(!showInfo)}
                >
                  <Ionicons name="information-circle-outline" size={20} color="#fff" />
                </TouchableOpacity>

                {currentStory.userId === user?.uid && (
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={handleDeleteStory}
                  >
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={onClose}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>

          {/* Story Content */}
          <View style={styles.storyContent}>
            {/* Touch Areas for Navigation */}
            <TouchableOpacity 
              style={styles.leftTouchArea}
              onPress={previousStory}
              activeOpacity={0.3}
            />
            <TouchableOpacity 
              style={styles.rightTouchArea}
              onPress={nextStory}
              activeOpacity={0.3}
            />

            {/* Media Content */}
            {currentStory.mediaType === 'image' ? (
              <Image source={{ uri: currentStory.mediaUrl }} style={styles.storyImage} />
            ) : (
              <Video
                ref={videoRef}
                source={{ uri: currentStory.mediaUrl }}
                style={styles.storyVideo}
                resizeMode={ResizeMode.COVER}
                shouldPlay={!isPaused}
                isLooping={false}
                onPlaybackStatusUpdate={(status) => {
                  if (status.isLoaded && status.didJustFinish) {
                    nextStory();
                  }
                }}
              />
            )}

            {/* Story Caption */}
            {currentStory.caption && (
              <View style={styles.captionContainer}>
                <Text style={styles.captionText}>{currentStory.caption}</Text>
              </View>
            )}

            {/* Story Info Overlay */}
            {showInfo && (
              <View style={styles.infoOverlay}>
                <LinearGradient
                  colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)']}
                  style={styles.infoGradient}
                >
                  <Text style={styles.infoTitle}>Story Details</Text>
                  <Text style={styles.infoText}>Posted: {new Date(currentStory.createdAt).toLocaleString()}</Text>
                  <Text style={styles.infoText}>Expires: {timeRemaining}</Text>
                  {currentStory.userId === user?.uid && (
                    <Text style={styles.infoText}>Views: {currentStory.viewedBy.length}</Text>
                  )}
                </LinearGradient>
              </View>
            )}
          </View>
        </Animated.View>
      </PanGestureHandler>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  progressBars: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 4,
  },
  progressBarContainer: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  timeAgo: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  storyContent: {
    flex: 1,
    position: 'relative',
  },
  leftTouchArea: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: width * 0.3,
    height: '100%',
    zIndex: 100,
  },
  rightTouchArea: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: width * 0.3,
    height: '100%',
    zIndex: 100,
  },
  storyImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  storyVideo: {
    width: '100%',
    height: '100%',
  },
  captionContainer: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    padding: 12,
  },
  captionText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  infoGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
});
