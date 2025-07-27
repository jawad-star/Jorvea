import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { MediaFile, mediaManagerService } from '../services/mediaManagerService';

const { width } = Dimensions.get('window');

export default function CreateContentScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const contentType = route.params?.type || 'post';

  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [currentHashtag, setCurrentHashtag] = useState('');

  const pickMedia = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Please grant camera roll permissions');
        return;
      }

      // Pick media based on content type
      const mediaTypes = contentType === 'reel' ? ['videos'] : ['images', 'videos'];
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes,
        allowsEditing: true,
        aspect: contentType === 'story' ? undefined : [1, 1],
        quality: 0.8,
        videoMaxDuration: contentType === 'reel' ? 60 : 30,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const mediaFile: MediaFile = {
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' : 'image',
          mimeType: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
          size: asset.fileSize || 0,
          duration: asset.duration || undefined,
        };
        setSelectedMedia(mediaFile);
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to select media');
    }
  };

  const addHashtag = () => {
    if (currentHashtag.trim() && !hashtags.includes(currentHashtag.trim())) {
      setHashtags([...hashtags, currentHashtag.trim()]);
      setCurrentHashtag('');
    }
  };

  const removeHashtag = (index: number) => {
    setHashtags(hashtags.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!selectedMedia || !user) {
      Alert.alert('Error', 'Please select media and ensure you are logged in');
      return;
    }

    if (!caption.trim() && contentType !== 'story') {
      Alert.alert('Error', 'Please add a caption');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Prepare upload options
      const options = {
        caption: caption || '',
        tags: hashtags,
        contentType: contentType as 'post' | 'reel' | 'story',
        isPrivate: false,
      };

      // Upload using media manager service - handles routing automatically
      console.log(`🚀 Uploading ${selectedMedia.type} as ${contentType}...`);
      
      const result = await mediaManagerService.uploadContent(
        selectedMedia,
        user.uid,
        options,
        (progress) => {
          setUploadProgress(progress);
          console.log(`Upload progress: ${progress.toFixed(1)}%`);
        }
      );

      const routingInfo = result.assetId?.startsWith('firebase_') 
        ? 'Firebase Storage (MUX fallback)' 
        : selectedMedia.type === 'video' 
          ? 'MUX Video Service' 
          : 'Firebase Storage';

      Alert.alert(
        '🎉 Success!',
        `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} uploaded successfully!\n\n📍 Routing:\n${selectedMedia.type === 'video' ? '🎬' : '📸'} ${selectedMedia.type} → ${routingInfo}\n📊 Metadata → Firestore`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error(`Error uploading ${contentType}:`, error);
      Alert.alert(
        'Upload Failed',
        error?.message || 'An error occurred during upload. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Create {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
          </Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Media Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Media</Text>
          {selectedMedia ? (
            <View style={styles.mediaPreview}>
              <Image source={{ uri: selectedMedia.uri }} style={styles.previewImage} />
              <View style={styles.mediaInfo}>
                <Text style={styles.mediaType}>
                  {selectedMedia.type === 'video' ? '🎬' : '📸'} {selectedMedia.type}
                </Text>
                <Text style={styles.mediaSize}>
                  Size: {(selectedMedia.size / 1024 / 1024).toFixed(1)} MB
                </Text>
                {selectedMedia.duration && (
                  <Text style={styles.mediaSize}>
                    Duration: {selectedMedia.duration.toFixed(1)}s
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.changeMediaButton}
                onPress={pickMedia}
              >
                <Text style={styles.changeMediaText}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.selectMediaButton} onPress={pickMedia}>
              <Ionicons name="cloud-upload-outline" size={48} color="#667eea" />
              <Text style={styles.selectMediaText}>
                Tap to select {contentType === 'reel' ? 'video' : 'photo/video'}
              </Text>
              <Text style={styles.selectMediaSubtext}>
                {contentType === 'reel' 
                  ? 'Videos will automatically upload to MUX' 
                  : 'Videos → MUX, Images → Firebase Storage'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Caption */}
        {contentType !== 'story' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Caption</Text>
            <TextInput
              style={styles.captionInput}
              placeholder="Write a caption..."
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={500}
            />
            <Text style={styles.characterCount}>{caption.length}/500</Text>
          </View>
        )}

        {/* Hashtags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hashtags</Text>
          <View style={styles.hashtagInput}>
            <TextInput
              style={styles.hashtagTextInput}
              placeholder="Add hashtag"
              value={currentHashtag}
              onChangeText={setCurrentHashtag}
              onSubmitEditing={addHashtag}
            />
            <TouchableOpacity style={styles.addHashtagButton} onPress={addHashtag}>
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
          <View style={styles.hashtagContainer}>
            {hashtags.map((hashtag, index) => (
              <View key={index} style={styles.hashtag}>
                <Text style={styles.hashtagText}>#{hashtag}</Text>
                <TouchableOpacity onPress={() => removeHashtag(index)}>
                  <Ionicons name="close" size={16} color="#667eea" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Upload Progress */}
        {isUploading && (
          <View style={styles.uploadProgress}>
            <Text style={styles.uploadText}>
              Uploading {selectedMedia?.type === 'video' ? 'to MUX...' : 'to Firebase Storage...'}
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{uploadProgress.toFixed(1)}%</Text>
          </View>
        )}

        {/* Upload Button */}
        <TouchableOpacity
          style={[styles.uploadButton, (!selectedMedia || isUploading) && styles.uploadButtonDisabled]}
          onPress={handleUpload}
          disabled={!selectedMedia || isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.uploadButtonText}>
              🚀 Upload {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  selectMediaButton: {
    borderWidth: 2,
    borderColor: '#667eea',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.05)',
  },
  selectMediaText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
    marginTop: 10,
  },
  selectMediaSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  mediaPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  mediaInfo: {
    flex: 1,
    marginLeft: 15,
  },
  mediaType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  mediaSize: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  changeMediaButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  changeMediaText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  captionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: 'white',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    textAlign: 'right',
    color: '#666',
    fontSize: 12,
    marginTop: 5,
  },
  hashtagInput: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  hashtagTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    marginRight: 10,
  },
  addHashtagButton: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hashtagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  hashtag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  hashtagText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 5,
  },
  uploadProgress: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
  },
  progressText: {
    fontSize: 14,
    color: '#667eea',
    textAlign: 'center',
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  uploadButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
