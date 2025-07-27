import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { profileService, UserProfile } from '../services/firebaseProfileService';
import { MediaFile, mediaUploadService } from '../services/mediaUploadService';

interface EditProfileScreenProps {
  navigation: any;
}

export default function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Profile data
  const [profileData, setProfileData] = useState<Partial<UserProfile>>({
    username: '',
    displayName: '',
    bio: '',
    website: '',
    location: '',
    profilePicture: '',
    isPrivate: false,
    socialLinks: {
      instagram: '',
      tiktok: '',
      youtube: '',
      twitter: '',
    },
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const profile = await profileService.getUserProfile(user.uid);
      
      if (profile) {
        setProfileData({
          username: profile.username || '',
          displayName: profile.displayName || user.displayName || '',
          bio: profile.bio || '',
          website: profile.website || '',
          location: profile.location || '',
          profilePicture: profile.profilePicture || user.photoURL || '',
          isPrivate: profile.isPrivate || false,
          socialLinks: profile.socialLinks || {
            instagram: '',
            tiktok: '',
            youtube: '',
            twitter: '',
          },
        });
      } else {
        // Initialize with Firebase user data
        setProfileData({
          username: user.displayName?.toLowerCase().replace(/\s+/g, '') || '',
          displayName: user.displayName || '',
          bio: '',
          website: '',
          location: '',
          profilePicture: user.photoURL || '',
          isPrivate: false,
          socialLinks: {
            instagram: '',
            tiktok: '',
            youtube: '',
            twitter: '',
          },
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    if (!profileData.username?.trim()) {
      Alert.alert('Error', 'Username is required');
      return;
    }

    if (!profileData.displayName?.trim()) {
      Alert.alert('Error', 'Display name is required');
      return;
    }

    try {
      setSaving(true);
      
      await profileService.updateUserProfile(user.uid, {
        email: user.email || '',
        uid: user.uid,
        username: profileData.username!,
        displayName: profileData.displayName!,
        bio: profileData.bio,
        website: profileData.website,
        location: profileData.location,
        profilePicture: profileData.profilePicture,
        isPrivate: profileData.isPrivate || false,
        socialLinks: profileData.socialLinks,
      });

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please grant permission to access photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setUploadingImage(true);
        
        // Get file info
        const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri);
        
        const mediaFile: MediaFile = {
          uri: result.assets[0].uri,
          type: 'image',
          mimeType: result.assets[0].mimeType || 'image/jpeg',
          size: (fileInfo.exists && !fileInfo.isDirectory) ? fileInfo.size : 0,
        };
        
        const uploadResult = await mediaUploadService.uploadMedia(mediaFile, (progress) => {
          console.log('Upload progress:', progress.percentage);
        });

        if (uploadResult.success) {
          setProfileData(prev => ({
            ...prev,
            profilePicture: uploadResult.mediaUrl
          }));
        } else {
          Alert.alert('Error', 'Failed to upload image');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    } finally {
      setUploadingImage(false);
    }
  };

  const updateField = (field: string, value: string | boolean) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfileData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value,
        },
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </LinearGradient>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile Picture */}
          <View style={styles.profilePictureSection}>
            <TouchableOpacity onPress={handleImagePicker} style={styles.profilePictureContainer}>
              {uploadingImage ? (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                </View>
              ) : (
                <>
                  <Image
                    source={{ 
                      uri: profileData.profilePicture || 'https://via.placeholder.com/120'
                    }}
                    style={styles.profilePicture}
                  />
                  <View style={styles.editIconContainer}>
                    <Ionicons name="camera" size={20} color="#fff" />
                  </View>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.changePhotoText}>Tap to change photo</Text>
          </View>

          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.textInput}
                value={profileData.username}
                onChangeText={(text) => updateField('username', text.toLowerCase().replace(/\s+/g, ''))}
                placeholder="Enter username"
                autoCapitalize="none"
                maxLength={30}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Display Name</Text>
              <TextInput
                style={styles.textInput}
                value={profileData.displayName}
                onChangeText={(text) => updateField('displayName', text)}
                placeholder="Enter display name"
                maxLength={50}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.textInput, styles.bioInput]}
                value={profileData.bio}
                onChangeText={(text) => updateField('bio', text)}
                placeholder="Tell people about yourself..."
                multiline
                maxLength={150}
              />
              <Text style={styles.characterCount}>
                {profileData.bio?.length || 0}/150
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Website</Text>
              <TextInput
                style={styles.textInput}
                value={profileData.website}
                onChangeText={(text) => updateField('website', text)}
                placeholder="https://yourwebsite.com"
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.textInput}
                value={profileData.location}
                onChangeText={(text) => updateField('location', text)}
                placeholder="Enter your location"
                maxLength={50}
              />
            </View>
          </View>

          {/* Social Links */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Social Links</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Instagram</Text>
              <TextInput
                style={styles.textInput}
                value={profileData.socialLinks?.instagram}
                onChangeText={(text) => updateField('socialLinks.instagram', text)}
                placeholder="@username"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>TikTok</Text>
              <TextInput
                style={styles.textInput}
                value={profileData.socialLinks?.tiktok}
                placeholder="@username"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>YouTube</Text>
              <TextInput
                style={styles.textInput}
                value={profileData.socialLinks?.youtube}
                onChangeText={(text) => updateField('socialLinks.youtube', text)}
                placeholder="Channel URL"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Twitter</Text>
              <TextInput
                style={styles.textInput}
                value={profileData.socialLinks?.twitter}
                onChangeText={(text) => updateField('socialLinks.twitter', text)}
                placeholder="@username"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Privacy Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy</Text>
            
            <TouchableOpacity 
              style={styles.switchContainer}
              onPress={() => updateField('isPrivate', !profileData.isPrivate)}
            >
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Private Account</Text>
                <Text style={styles.switchDescription}>
                  Only followers can see your posts and reels
                </Text>
              </View>
              <View style={[styles.switch, profileData.isPrivate && styles.switchActive]}>
                <View style={[styles.switchThumb, profileData.isPrivate && styles.switchThumbActive]} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
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
  profilePictureSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#f8f9fa',
  },
  profilePictureContainer: {
    position: 'relative',
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ddd',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  changePhotoText: {
    marginTop: 12,
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  switchInfo: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  switchDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchActive: {
    backgroundColor: '#667eea',
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
  bottomPadding: {
    height: 40,
  },
});
