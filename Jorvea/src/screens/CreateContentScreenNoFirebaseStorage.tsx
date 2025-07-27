import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import type { UploadProgress } from '../services/mediaManagerServiceNoFirebaseStorage';
import { mediaManagerService } from '../services/mediaManagerServiceNoFirebaseStorage';

export default function CreateContentScreenNoFirebaseStorage() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [routingInfo, setRoutingInfo] = useState<string>('');

  const handleUploadProgress = (progress: UploadProgress) => {
    setUploadProgress(progress);
    console.log(`Upload progress: ${progress.percentage}%`);
  };

  const pickImage = async () => {
    try {
      setIsUploading(true);
      setRoutingInfo(mediaManagerService.getRoutingInfo('image'));
      
      if (!user?.uid) {
        Alert.alert('Error', 'Please sign in to upload content');
        return;
      }

      const content = await mediaManagerService.pickAndUploadImage(
        title || 'Untitled Image',
        caption,
        user.uid,
        tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        isPublic,
        handleUploadProgress
      );

      Alert.alert('Success', 'Image uploaded successfully!', [
        { text: 'OK', onPress: () => router.push('/home') }
      ]);
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', `Failed to upload image: ${(error as Error).message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const pickVideo = async () => {
    try {
      setIsUploading(true);
      setRoutingInfo(mediaManagerService.getRoutingInfo('video'));
      
      if (!user?.uid) {
        Alert.alert('Error', 'Please sign in to upload content');
        return;
      }

      const content = await mediaManagerService.pickAndUploadVideo(
        title || 'Untitled Video',
        caption,
        user.uid,
        tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        isPublic,
        handleUploadProgress
      );

      Alert.alert('Success', 'Video uploaded to MUX successfully! It may take a few minutes to process.', [
        { text: 'OK', onPress: () => router.push('/home') }
      ]);
    } catch (error) {
      console.error('Error uploading video:', error);
      Alert.alert('Error', `Failed to upload video: ${(error as Error).message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const takePhoto = async () => {
    try {
      setIsUploading(true);
      setRoutingInfo(mediaManagerService.getRoutingInfo('image'));
      
      if (!user?.uid) {
        Alert.alert('Error', 'Please sign in to upload content');
        return;
      }

      const content = await mediaManagerService.takePhotoAndUpload(
        title || 'Untitled Photo',
        caption,
        user.uid,
        tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        isPublic,
        handleUploadProgress
      );

      Alert.alert('Success', 'Photo uploaded successfully!', [
        { text: 'OK', onPress: () => router.push('/home') }
      ]);
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', `Failed to take photo: ${(error as Error).message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const recordVideo = async () => {
    try {
      setIsUploading(true);
      setRoutingInfo(mediaManagerService.getRoutingInfo('video'));
      
      if (!user?.uid) {
        Alert.alert('Error', 'Please sign in to upload content');
        return;
      }

      const content = await mediaManagerService.recordVideoAndUpload(
        title || 'Untitled Video',
        caption,
        user.uid,
        tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        isPublic,
        handleUploadProgress
      );

      Alert.alert('Success', 'Video recorded and uploaded to MUX successfully!', [
        { text: 'OK', onPress: () => router.push('/home') }
      ]);
    } catch (error) {
      console.error('Error recording video:', error);
      Alert.alert('Error', `Failed to record video: ${(error as Error).message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Create Content</Text>
        <Text style={styles.subtitle}>No Firebase Storage - Firestore Only</Text>
        
        {/* Routing Information */}
        {routingInfo && (
          <View style={styles.routingInfo}>
            <Text style={styles.routingTitle}>Current Routing:</Text>
            <Text style={styles.routingText}>{routingInfo}</Text>
          </View>
        )}

        {/* Form Fields */}
        <View style={styles.form}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter title..."
            editable={!isUploading}
          />

          <Text style={styles.label}>Caption</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={caption}
            onChangeText={setCaption}
            placeholder="Write a caption..."
            multiline
            numberOfLines={3}
            editable={!isUploading}
          />

          <Text style={styles.label}>Tags (comma separated)</Text>
          <TextInput
            style={styles.input}
            value={tags}
            onChangeText={setTags}
            placeholder="nature, photography, travel..."
            editable={!isUploading}
          />

          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setIsPublic(!isPublic)}
            disabled={isUploading}
          >
            <Text style={styles.toggleText}>
              {isPublic ? '🌍 Public' : '🔒 Private'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Upload Progress */}
        {uploadProgress && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Uploading... {Math.round(uploadProgress.percentage)}%
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${uploadProgress.percentage}%` }
                ]} 
              />
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.imageButton]}
            onPress={pickImage}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonIcon}>📷</Text>
                <Text style={styles.buttonText}>Pick Image</Text>
                <Text style={styles.buttonSubtext}>→ Base64 in Firestore</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.videoButton]}
            onPress={pickVideo}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonIcon}>🎥</Text>
                <Text style={styles.buttonText}>Pick Video</Text>
                <Text style={styles.buttonSubtext}>→ MUX Streaming</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.cameraButton]}
            onPress={takePhoto}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonIcon}>📸</Text>
                <Text style={styles.buttonText}>Take Photo</Text>
                <Text style={styles.buttonSubtext}>→ Base64 in Firestore</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.recordButton]}
            onPress={recordVideo}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonIcon}>🎬</Text>
                <Text style={styles.buttonText}>Record Video</Text>
                <Text style={styles.buttonSubtext}>→ MUX Streaming</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Status Information */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>Storage Configuration:</Text>
          <Text style={styles.statusItem}>✅ Videos → MUX (Real credentials)</Text>
          <Text style={styles.statusItem}>✅ Images → Firestore Base64</Text>
          <Text style={styles.statusItem}>❌ Firebase Storage (Eliminated)</Text>
          <Text style={styles.statusItem}>✅ Metadata → Firestore Only</Text>
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
  scrollView: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  routingInfo: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeft: 4,
    borderLeftColor: '#2196f3',
  },
  routingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 5,
  },
  routingText: {
    fontSize: 14,
    color: '#1976d2',
  },
  form: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  toggleButton: {
    backgroundColor: '#4caf50',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  toggleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 3,
  },
  buttonContainer: {
    gap: 15,
    marginBottom: 20,
  },
  actionButton: {
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  imageButton: {
    backgroundColor: '#ff5722',
  },
  videoButton: {
    backgroundColor: '#2196f3',
  },
  cameraButton: {
    backgroundColor: '#9c27b0',
  },
  recordButton: {
    backgroundColor: '#f44336',
  },
  buttonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  buttonSubtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  statusItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    paddingLeft: 5,
  },
});
