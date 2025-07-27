import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MediaContent, mediaManagerService } from '../services/mediaManagerService';
import { muxService } from '../services/muxService';

export const MediaManagerExample: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [feed, setFeed] = useState<MediaContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [muxConfigured, setMuxConfigured] = useState(false);

  useEffect(() => {
    checkMuxConfiguration();
  }, []);

  const checkMuxConfiguration = () => {
    const configured = muxService.isConfigured();
    setMuxConfigured(configured);
    if (!configured) {
      console.warn('⚠️ MUX not configured - videos will upload to Firebase Storage as fallback');
    }
  };

  const handlePickAndUpload = async () => {
    try {
      setUploading(true);

      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Please grant camera roll permissions');
        return;
      }

      // Pick media (images or videos)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Prepare media file object
        const mediaFile = {
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' as const : 'image' as const,
          mimeType: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
          size: asset.fileSize || 0,
          duration: asset.duration || undefined,
        };
        
        // Prepare upload options
        const options = {
          caption: 'Test upload from Media Manager',
          tags: ['test', 'dynamic'],
          contentType: asset.type === 'video' ? 'reel' as const : 'post' as const,
          isPrivate: false,
        };
        
        // Upload content with the media manager
        const contentResult = await mediaManagerService.uploadContent(
          mediaFile,
          'current-user-id', // Replace with actual user ID
          options,
          (progress) => {
            console.log(`Upload progress: ${progress}%`);
          }
        );

        if (contentResult) {
          Alert.alert('Success!', `Content uploaded with ID: ${contentResult.id}`);
          // Refresh feed to show new content
          loadFeed();
        } else {
          Alert.alert('Error', 'Failed to upload content');
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const loadFeed = async () => {
    try {
      setLoading(true);
      const feedData = await mediaManagerService.getContentFeed(undefined, 10);
      setFeed(feedData);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderFeedItem = (item: MediaContent) => (
    <View key={item.id} style={{ padding: 16, borderBottomWidth: 1, borderColor: '#eee' }}>
      <Text style={{ fontWeight: 'bold' }}>Type: {item.contentType}</Text>
      <Text>Media Type: {item.type}</Text>
      <Text>Caption: {item.caption}</Text>
      <Text>User: {item.userId}</Text>
      <Text>Likes: {item.likes}</Text>
      <Text>Comments: {item.comments}</Text>
      <Text>Shares: {item.shares}</Text>
      {item.type === 'video' && (
        <>
          <Text>Views: {item.views}</Text>
          <Text>Playback ID: {item.playbackId || 'N/A'}</Text>
          <Text>Asset ID: {item.assetId || 'N/A'}</Text>
        </>
      )}
      <Text>Created: {item.createdAt.toLocaleDateString()}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        Dynamic Media Manager Example
      </Text>
      
      <Text style={styles.description}>
        This example demonstrates the dynamic media routing system:
        {'\n'}• Videos automatically go to MUX (or Firebase as fallback)
        {'\n'}• Images automatically go to Firebase Storage
        {'\n'}• All metadata goes to Firestore
        {'\n'}• Unified content management interface
      </Text>

      {/* Status Information */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>System Status:</Text>
        <Text style={[styles.statusText, { color: muxConfigured ? '#34C759' : '#FF3B30' }]}>
          MUX Service: {muxConfigured ? '✅ Configured' : '❌ Not Configured (using test tokens)'}
        </Text>
        <Text style={styles.statusText}>
          Firebase: ✅ Connected
        </Text>
        {!muxConfigured && (
          <Text style={styles.warningText}>
            ⚠️ To use MUX for videos, update your .env file with real MUX credentials:
            {'\n'}MUX_TOKEN_ID=your_real_token_id
            {'\n'}MUX_TOKEN_SECRET=your_real_token_secret
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, styles.primaryButton, { opacity: uploading ? 0.5 : 1 }]}
        onPress={handlePickAndUpload}
        disabled={uploading}
      >
        <Text style={styles.buttonText}>
          {uploading ? 'Uploading...' : 'Pick & Upload Media'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton, { opacity: loading ? 0.5 : 1 }]}
        onPress={loadFeed}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Loading...' : 'Load Content Feed'}
        </Text>
      </TouchableOpacity>

      {feed.length > 0 && (
        <>
          <Text style={styles.feedTitle}>
            Content Feed ({feed.length} items)
          </Text>
          {feed.map(renderFeedItem)}
        </>
      )}

      {feed.length === 0 && !loading && (
        <Text style={styles.emptyText}>
          No content in feed. Upload some media first!
        </Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  description: {
    marginBottom: 20,
    color: '#666',
  },
  statusContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#FF9500',
    marginTop: 8,
    backgroundColor: '#FFF3CD',
    padding: 8,
    borderRadius: 4,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  feedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
  },
});

export default MediaManagerExample;
