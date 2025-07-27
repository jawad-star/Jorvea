import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  TouchableOpacity, 
  Alert,
  TextInput,
  ScrollView,
  Image,
  Modal,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { mediaUploadService, MediaFile, UploadResult } from '../../services/mediaUploadService';
import { contentService } from '../../services';
import { eventService } from '../../services/eventService';
import { useAuth } from '../../context/AuthContext';

type CreationMode = 'select' | 'post' | 'reel';

export default function CreateScreen() {
  const { user } = useAuth();
  const [mode, setMode] = useState<CreationMode>('select');
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [caption, setCaption] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showMediaOptions, setShowMediaOptions] = useState(false);

  // Reset all states
  const resetStates = () => {
    setMode('select');
    setSelectedMedia(null);
    setCaption('');
    setTitle('');
    setDescription('');
    setIsUploading(false);
    setUploadProgress(0);
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
        // Auto-select mode based on media type
        setMode(mediaFile.type === 'video' ? 'reel' : 'post');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select media. Please try again.');
      console.error('Media selection error:', error);
    }
  };

  // Handle post creation
  const handleCreatePost = async () => {
    if (!selectedMedia || !caption.trim()) {
      Alert.alert('Error', 'Please add a caption and select media');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadResult: UploadResult = await mediaUploadService.uploadMedia(
        selectedMedia,
        (progress) => {
          setUploadProgress(progress.percentage);
        }
      );

      if (uploadResult.success) {
        // Save post to local storage
        // Prepare post data without undefined values
        const postData: any = {
          userId: user?.uid || 'anonymous',
          username: user?.displayName || 'Unknown User',
          userDisplayName: user?.displayName || 'Unknown User',
          caption: caption.trim(),
          tags: [], // TODO: Extract hashtags from caption
        };

        // Only add optional fields if they have values
        if (user?.photoURL) {
          postData.userAvatar = user.photoURL;
        }
        if (selectedMedia.type === 'image' && uploadResult.mediaUrl) {
          postData.imageUrl = uploadResult.mediaUrl;
        }
        if (selectedMedia.type === 'video' && uploadResult.mediaUrl) {
          postData.videoUrl = uploadResult.mediaUrl;
        }
        if (uploadResult.assetId) {
          postData.muxAssetId = uploadResult.assetId;
        }
        if (uploadResult.playbackId) {
          postData.muxPlaybackId = uploadResult.playbackId;
        }

        const newPost = await contentService.createPost(postData);

        console.log('Post created successfully:', newPost);
        
        // Emit event to refresh other screens
        eventService.emitContentCreated('post');
        
        Alert.alert('Success', 'Your post has been shared with your followers!', [
          { text: 'OK', onPress: resetStates }
        ]);
      } else {
        Alert.alert('Error', uploadResult.error || 'Failed to upload media');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create post. Please try again.');
      console.error('Post creation error:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle reel creation
  const handleCreateReel = async () => {
    if (!selectedMedia || !title.trim() || selectedMedia.type !== 'video') {
      Alert.alert('Error', 'Please add a title and select a video');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadResult: UploadResult = await mediaUploadService.uploadMedia(
        selectedMedia,
        (progress) => {
          setUploadProgress(progress.percentage);
        }
      );

      if (uploadResult.success) {
        // Prepare reel data without undefined values
        const reelData: any = {
          userId: user?.uid || 'anonymous',
          username: user?.displayName || 'Unknown User',
          userDisplayName: user?.displayName || 'Unknown User',
          caption: `${title.trim()}\n${description.trim()}`,
          videoUrl: uploadResult.mediaUrl!,
          muxPlaybackId: uploadResult.playbackId!,
          muxAssetId: uploadResult.assetId!,
          duration: selectedMedia.duration || 0,
          tags: [], // TODO: Extract hashtags from description
        };

        // Only add optional fields if they have values
        if (user?.photoURL) {
          reelData.userAvatar = user.photoURL;
        }
        if (uploadResult.thumbnailUrl) {
          reelData.thumbnailUrl = uploadResult.thumbnailUrl;
        }

        const newReel = await contentService.createReel(reelData);

        console.log('Reel created successfully:', newReel);
        
        // Emit event to refresh other screens
        eventService.emitContentCreated('reel');
        
        Alert.alert('Success', 'Your reel is now live on Jorvea! Everyone can see it in the Reels tab.', [
          { text: 'OK', onPress: resetStates }
        ]);
      } else {
        Alert.alert('Error', uploadResult.error || 'Failed to upload video');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create reel. Please try again.');
      console.error('Reel creation error:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Render media preview
  const renderMediaPreview = () => {
    if (!selectedMedia) return null;

    return (
      <View style={styles.mediaPreview}>
        {selectedMedia.type === 'image' ? (
          <Image source={{ uri: selectedMedia.uri }} style={styles.previewImage} />
        ) : (
          <Video
            source={{ uri: selectedMedia.uri }}
            style={styles.previewVideo}
            shouldPlay={false}
            isLooping
            useNativeControls
          />
        )}
        <TouchableOpacity 
          style={styles.removeMediaButton}
          onPress={() => setSelectedMedia(null)}
        >
          <Ionicons name="close-circle" size={30} color="#ff4444" />
        </TouchableOpacity>
      </View>
    );
  };

  // Render mode selection
  const renderModeSelection = () => (
    <View style={styles.modeContainer}>
      <Text style={styles.modeTitle}>What would you like to create?</Text>
      
      <TouchableOpacity 
        style={styles.modeButton}
        onPress={() => setShowMediaOptions(true)}
      >
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.modeGradient}>
          <Ionicons name="images" size={30} color="#fff" />
          <Text style={styles.modeButtonText}>Create Post</Text>
          <Text style={styles.modeDescription}>Share photos and videos with your followers</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.modeButton}
        onPress={() => setShowMediaOptions(true)}
      >
        <LinearGradient colors={['#f093fb', '#f5576c']} style={styles.modeGradient}>
          <Ionicons name="videocam" size={30} color="#fff" />
          <Text style={styles.modeButtonText}>Create Reel</Text>
          <Text style={styles.modeDescription}>Short videos visible to everyone on Jorvea</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // Render post creation form
  const renderPostForm = () => (
    <ScrollView style={styles.formContainer}>
      <View style={styles.formHeader}>
        <TouchableOpacity onPress={resetStates}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.formTitle}>Create Post</Text>
        <TouchableOpacity 
          onPress={handleCreatePost}
          disabled={isUploading || !selectedMedia || !caption.trim()}
        >
          <Text style={[styles.shareButton, (!selectedMedia || !caption.trim()) && styles.shareButtonDisabled]}>
            Share
          </Text>
        </TouchableOpacity>
      </View>

      {renderMediaPreview()}

      <View style={styles.formSection}>
        <TextInput
          style={styles.captionInput}
          placeholder="Write a caption..."
          placeholderTextColor="#999"
          value={caption}
          onChangeText={setCaption}
          multiline
          maxLength={500}
        />
        <Text style={styles.characterCount}>{caption.length}/500</Text>
      </View>

      {!selectedMedia && (
        <TouchableOpacity 
          style={styles.addMediaButton}
          onPress={() => setShowMediaOptions(true)}
        >
          <Ionicons name="add-circle-outline" size={50} color="#667eea" />
          <Text style={styles.addMediaText}>Add Photo or Video</Text>
        </TouchableOpacity>
      )}

      {isUploading && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.uploadingText}>Creating your post... {Math.round(uploadProgress)}%</Text>
        </View>
      )}
    </ScrollView>
  );

  // Render reel creation form
  const renderReelForm = () => (
    <ScrollView style={styles.formContainer}>
      <View style={styles.formHeader}>
        <TouchableOpacity onPress={resetStates}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.formTitle}>Create Reel</Text>
        <TouchableOpacity 
          onPress={handleCreateReel}
          disabled={isUploading || !selectedMedia || !title.trim()}
        >
          <Text style={[styles.shareButton, (!selectedMedia || !title.trim()) && styles.shareButtonDisabled]}>
            Share
          </Text>
        </TouchableOpacity>
      </View>

      {renderMediaPreview()}

      <View style={styles.formSection}>
        <TextInput
          style={styles.titleInput}
          placeholder="Add a catchy title..."
          placeholderTextColor="#999"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
        <Text style={styles.characterCount}>{title.length}/100</Text>
      </View>

      <View style={styles.formSection}>
        <TextInput
          style={styles.descriptionInput}
          placeholder="Describe your reel..."
          placeholderTextColor="#999"
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={300}
        />
        <Text style={styles.characterCount}>{description.length}/300</Text>
      </View>

      {!selectedMedia && (
        <TouchableOpacity 
          style={styles.addMediaButton}
          onPress={() => setShowMediaOptions(true)}
        >
          <Ionicons name="videocam-outline" size={50} color="#f5576c" />
          <Text style={styles.addMediaText}>Add Video</Text>
        </TouchableOpacity>
      )}

      {isUploading && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="large" color="#f5576c" />
          <Text style={styles.uploadingText}>Creating your reel... {Math.round(uploadProgress)}%</Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Create</Text>
      </LinearGradient>
      
      {mode === 'select' && renderModeSelection()}
      {mode === 'post' && renderPostForm()}
      {mode === 'reel' && renderReelForm()}

      {/* Media Options Modal */}
      <Modal
        visible={showMediaOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMediaOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Media</Text>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => handleMediaSelect('camera_photo')}
            >
              <Ionicons name="camera" size={24} color="#667eea" />
              <Text style={styles.modalOptionText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => handleMediaSelect('camera_video')}
            >
              <Ionicons name="videocam" size={24} color="#667eea" />
              <Text style={styles.modalOptionText}>Record Video</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => handleMediaSelect('gallery_photo')}
            >
              <Ionicons name="images" size={24} color="#667eea" />
              <Text style={styles.modalOptionText}>Choose Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => handleMediaSelect('gallery_video')}
            >
              <Ionicons name="film" size={24} color="#667eea" />
              <Text style={styles.modalOptionText}>Choose Video</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalCancel}
              onPress={() => setShowMediaOptions(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  
  // Mode Selection Styles
  modeContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  modeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  modeButton: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  modeGradient: {
    padding: 24,
    alignItems: 'center',
  },
  modeButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  modeDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },

  // Form Styles
  formContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  shareButton: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
  },
  shareButtonDisabled: {
    color: '#ccc',
  },
  formSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  // Media Preview Styles
  mediaPreview: {
    position: 'relative',
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  previewVideo: {
    width: '100%',
    height: 300,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
  },

  // Input Styles
  captionInput: {
    fontSize: 16,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
    padding: 0,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    padding: 0,
  },
  descriptionInput: {
    fontSize: 16,
    color: '#333',
    minHeight: 60,
    textAlignVertical: 'top',
    padding: 0,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },

  // Add Media Styles
  addMediaButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    margin: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#eee',
    borderStyle: 'dashed',
  },
  addMediaText: {
    fontSize: 16,
    color: '#667eea',
    marginTop: 8,
    fontWeight: '500',
  },

  // Upload Progress Styles
  uploadingContainer: {
    alignItems: 'center',
    padding: 20,
    margin: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  uploadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    fontWeight: '500',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 24,
  },
  modalOptionText: {
    fontSize: 16,
    marginLeft: 16,
    color: '#333',
  },
  modalCancel: {
    alignItems: 'center',
    padding: 16,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#ff4444',
    fontWeight: '500',
  },
});
