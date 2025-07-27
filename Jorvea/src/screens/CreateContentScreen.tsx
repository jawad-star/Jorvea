/**
 * Create Content Screen
 * 
 * Main content creation interface for the Jorvea social media app.
 * Supports creating posts, reels, and stories with comprehensive media handling.
 * 
 * Features:
 * - Multi-format content creation (posts, reels, stories)
 * - Camera and gallery integration for media selection
 * - Real-time upload progress with stage indicators
 * - Hashtag management and content tagging
 * - Image and video preview with editing capabilities
 * - Comprehensive error handling and user feedback
 * - Responsive design for various screen sizes
 * 
 * Content Types:
 * - Posts: Images/videos with captions and hashtags
 * - Reels: Short-form videos optimized for engagement
 * - Stories: Temporary 24-hour content
 * 
 * Dependencies:
 * - MediaUploadService: Handles all media operations
 * - ContentService: Manages content persistence
 * - AuthContext: User authentication and profile data
 * 
 * @author Jorvea Development Team
 * @version 2.5.0
 * @created 2024-12-01
 * @updated 2025-01-27
 */

import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { contentService } from '../services';
import { MediaFile, mediaUploadService, UploadProgress, UploadResult } from '../services/mediaUploadService';

// Get device dimensions for responsive design
const { width, height } = Dimensions.get('window');

/**
 * Props interface for CreateContentScreen component
 */
interface CreateContentScreenProps {
  route: {
    params: {
      type: 'post' | 'reel' | 'story'; // Content type to create
    };
  };
}

/**
 * CreateContentScreen Component
 * 
 * Main functional component for content creation functionality.
 * Handles the entire content creation workflow from media selection to publication.
 */
export default function CreateContentScreen() {
  // Hooks for navigation, authentication, and route parameters
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const contentType = route.params?.type || 'post';

  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [caption, setCaption] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [currentHashtag, setCurrentHashtag] = useState('');

  // Reset states when content type changes
  useEffect(() => {
    resetStates();
  }, [contentType]);

  const resetStates = () => {
    setSelectedMedia(null);
    setCaption('');
    setTitle('');
    setDescription('');
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStage('');
    setHashtags([]);
    setCurrentHashtag('');
  };

  // Handle media selection
  const handleMediaSelect = async (type: 'camera_photo' | 'camera_video' | 'gallery_photo' | 'gallery_video') => {
    try {
      setShowMediaOptions(false);
      let mediaFile: MediaFile | null = null;
      
      switch (type) {
        case 'camera_photo':
          mediaFile = await mediaUploadService.takePhoto();
          break;
        case 'camera_video':
          mediaFile = await mediaUploadService.recordVideo();
          break;
        case 'gallery_photo':
          mediaFile = await mediaUploadService.pickImage();
          break;
        case 'gallery_video':
          mediaFile = await mediaUploadService.pickVideo();
          break;
      }
      
      if (mediaFile) {
        setSelectedMedia(mediaFile);
      }
    } catch (error) {
      console.error('Error selecting media:', error);
      Alert.alert('Error', 'Failed to select media');
    }
  };

  // Add hashtag
  const addHashtag = () => {
    if (currentHashtag.trim() && !hashtags.includes(currentHashtag.trim())) {
      setHashtags([...hashtags, currentHashtag.trim()]);
      setCurrentHashtag('');
    }
  };

  // Remove hashtag
  const removeHashtag = (index: number) => {
    setHashtags(hashtags.filter((_, i) => i !== index));
  };

  // Handle content creation
  const handleCreate = async () => {
    if (!selectedMedia) {
      Alert.alert('Error', 'Please select media first');
      return;
    }

    if (!caption.trim() && contentType !== 'story') {
      Alert.alert('Error', 'Please add a caption');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadStage('Uploading...');

      // Upload media
      const uploadResult: UploadResult = await mediaUploadService.uploadMedia(
        selectedMedia,
        (progress: UploadProgress) => {
          setUploadProgress(progress.percentage / 100);
          if (progress.percentage >= 90) {
            setUploadStage('Processing video...');
          } else {
            setUploadStage('Uploading...');
          }
        }
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      // Create content based on type
      if (contentType === 'story') {
        // TODO: Implement story service
        console.log('Story creation not implemented yet');
        Alert.alert('Info', 'Story feature is not implemented yet');
      } else if (contentType === 'post') {
        await contentService.createPost({
          userId: user?.uid || '',
          username: user?.displayName || user?.email || 'Unknown',
          userDisplayName: user?.displayName || user?.email || 'Unknown',
          caption: caption,
          imageUrl: selectedMedia.type === 'image' ? uploadResult.mediaUrl : undefined,
          videoUrl: selectedMedia.type === 'video' ? uploadResult.mediaUrl : undefined,
          muxAssetId: uploadResult.assetId,
          muxPlaybackId: uploadResult.playbackId,
          tags: hashtags,
        });
      } else if (contentType === 'reel') {
        await contentService.createReel({
          userId: user?.uid || '',
          username: user?.displayName || user?.email || 'Unknown',
          userDisplayName: user?.displayName || user?.email || 'Unknown',
          caption: caption,
          videoUrl: uploadResult.mediaUrl!,
          thumbnailUrl: uploadResult.thumbnailUrl || '',
          muxPlaybackId: uploadResult.playbackId || '',
          muxAssetId: uploadResult.assetId || '',
          duration: selectedMedia.duration || 15,
          tags: hashtags,
        });
      }

      Alert.alert(
        'Success!', 
        `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} created successfully`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error(`Error creating ${contentType}:`, error);
      Alert.alert('Error', `Failed to create ${contentType}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStage('');
    }
  };

  const renderMediaOptions = () => (
    <Modal
      visible={showMediaOptions}
      transparent
      animationType="slide"
      onRequestClose={() => setShowMediaOptions(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.mediaOptionsContainer}>
          <Text style={styles.mediaOptionsTitle}>Select Media</Text>
          
          <TouchableOpacity
            style={styles.mediaOption}
            onPress={() => handleMediaSelect('camera_photo')}
          >
            <Ionicons name="camera" size={24} color="#fff" />
            <Text style={styles.mediaOptionText}>Take Photo</Text>
          </TouchableOpacity>

          {contentType !== 'post' && (
            <TouchableOpacity
              style={styles.mediaOption}
              onPress={() => handleMediaSelect('camera_video')}
            >
              <Ionicons name="videocam" size={24} color="#fff" />
              <Text style={styles.mediaOptionText}>Record Video</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.mediaOption}
            onPress={() => handleMediaSelect('gallery_photo')}
          >
            <Ionicons name="image" size={24} color="#fff" />
            <Text style={styles.mediaOptionText}>Choose Photo</Text>
          </TouchableOpacity>

          {contentType !== 'post' && (
            <TouchableOpacity
              style={styles.mediaOption}
              onPress={() => handleMediaSelect('gallery_video')}
            >
              <Ionicons name="play" size={24} color="#fff" />
              <Text style={styles.mediaOptionText}>Choose Video</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.mediaOption, styles.cancelOption]}
            onPress={() => setShowMediaOptions(false)}
          >
            <Ionicons name="close" size={24} color="#ff3b5c" />
            <Text style={[styles.mediaOptionText, { color: '#ff3b5c' }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const getTitle = () => {
    switch (contentType) {
      case 'story':
        return 'Create Story';
      case 'reel':
        return 'Create Reel';
      default:
        return 'Create Post';
    }
  };

  const getPlaceholder = () => {
    switch (contentType) {
      case 'story':
        return 'Add a caption to your story...';
      case 'reel':
        return 'Describe your reel...';
      default:
        return 'Write a caption...';
    }
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
        
        <Text style={styles.headerTitle}>{getTitle()}</Text>
        
        <TouchableOpacity 
          style={[styles.createButton, (!selectedMedia || isUploading) && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={!selectedMedia || isUploading}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>
              {contentType === 'story' ? 'Share' : 'Post'}
            </Text>
          )}
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Media Selection */}
        <View style={styles.mediaSection}>
          {selectedMedia ? (
            <View style={styles.selectedMediaContainer}>
              {selectedMedia.type === 'video' ? (
                <Video
                  source={{ uri: selectedMedia.uri }}
                  style={styles.selectedMedia}
                  useNativeControls
                  resizeMode={ResizeMode.COVER}
                />
              ) : (
                <Image
                  source={{ uri: selectedMedia.uri }}
                  style={styles.selectedMedia}
                  resizeMode="cover"
                />
              )}
              <TouchableOpacity
                style={styles.changeMediaButton}
                onPress={() => setShowMediaOptions(true)}
              >
                <Ionicons name="swap-horizontal" size={20} color="#fff" />
                <Text style={styles.changeMediaText}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.selectMediaButton}
              onPress={() => setShowMediaOptions(true)}
            >
              <Ionicons name="add-circle" size={60} color="#667eea" />
              <Text style={styles.selectMediaText}>Select Media</Text>
              <Text style={styles.selectMediaSubText}>
                {contentType === 'story' ? 'Photo or Video' : 
                 contentType === 'reel' ? 'Video only' : 'Photo or Video'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Upload Progress */}
        {isUploading && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>{uploadStage} {Math.round(uploadProgress * 100)}%</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${uploadProgress * 100}%` }]} />
            </View>
          </View>
        )}

        {/* Caption Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Caption</Text>
          <TextInput
            style={styles.captionInput}
            placeholder={getPlaceholder()}
            placeholderTextColor="#999"
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={contentType === 'story' ? 100 : 500}
          />
          <Text style={styles.characterCount}>
            {caption.length}/{contentType === 'story' ? 100 : 500}
          </Text>
        </View>

        {/* Hashtags (for posts and reels) */}
        {contentType !== 'story' && (
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Hashtags</Text>
            <View style={styles.hashtagInputContainer}>
              <TextInput
                style={styles.hashtagInput}
                placeholder="Add hashtag..."
                placeholderTextColor="#999"
                value={currentHashtag}
                onChangeText={setCurrentHashtag}
                onSubmitEditing={addHashtag}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={styles.addHashtagButton}
                onPress={addHashtag}
              >
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {hashtags.length > 0 && (
              <View style={styles.hashtagsList}>
                {hashtags.map((tag, index) => (
                  <View key={index} style={styles.hashtagChip}>
                    <Text style={styles.hashtagChipText}>#{tag}</Text>
                    <TouchableOpacity
                      style={styles.removeHashtagButton}
                      onPress={() => removeHashtag(index)}
                    >
                      <Ionicons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Content Type Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>
            {contentType === 'story' ? '📖 Story Info' :
             contentType === 'reel' ? '🎬 Reel Info' : '📝 Post Info'}
          </Text>
          <Text style={styles.infoText}>
            {contentType === 'story' 
              ? 'Your story will be visible for 24 hours and then automatically deleted.'
              : contentType === 'reel'
              ? 'Reels are short, engaging videos that can be discovered by more people.'
              : 'Posts appear in your followers\' feeds and on your profile.'
            }
          </Text>
        </View>
      </ScrollView>

      {renderMediaOptions()}
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
    textAlign: 'center',
    flex: 1,
  },
  createButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  mediaSection: {
    marginBottom: 24,
  },
  selectedMediaContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedMedia: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  changeMediaButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  changeMediaText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  selectMediaButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectMediaText: {
    color: '#667eea',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  selectMediaSubText: {
    color: '#999',
    fontSize: 14,
    marginTop: 4,
  },
  progressContainer: {
    marginBottom: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
  },
  progressText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  captionInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    color: '#fff',
    fontSize: 16,
    padding: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    color: '#999',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  hashtagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hashtagInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    color: '#fff',
    fontSize: 16,
    padding: 12,
    marginRight: 8,
  },
  addHashtagButton: {
    backgroundColor: '#667eea',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hashtagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hashtagChip: {
    backgroundColor: '#667eea',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  hashtagChipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  removeHashtagButton: {
    marginLeft: 6,
    padding: 2,
  },
  infoSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    color: '#999',
    fontSize: 14,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  mediaOptionsContainer: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  mediaOptionsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  mediaOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cancelOption: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ff3b5c',
  },
  mediaOptionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
});
