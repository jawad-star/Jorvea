import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { followService, profileService } from '../services';
import { useAuth } from '../context/AuthContext';

interface FollowButtonProps {
  targetUserId: string;
  targetUserInfo?: {
    username: string;
    displayName: string;
    profilePicture?: string;
    isVerified?: boolean;
  };
  style?: any;
  size?: 'small' | 'medium' | 'large';
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({
  targetUserId,
  targetUserInfo,
  style,
  size = 'medium',
  onFollowChange,
}: FollowButtonProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [requestPending, setRequestPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(targetUserInfo);
  const [isPrivateAccount, setIsPrivateAccount] = useState(false);

  useEffect(() => {
    if (user?.uid && targetUserId && user.uid !== targetUserId) {
      loadFollowStatus();
      if (!targetUserInfo) {
        loadUserInfo();
      }
    }
  }, [user?.uid, targetUserId]);

  const loadFollowStatus = async () => {
    try {
      const following = await followService.isFollowing(user!.uid, targetUserId);
      setIsFollowing(following);
      
      if (!following) {
        const request = await followService.getFollowRequest(user!.uid, targetUserId);
        setRequestPending(!!request);
      }
    } catch (error) {
      console.error('Error loading follow status:', error);
    }
  };

  const loadUserInfo = async () => {
    try {
      const profile = await profileService.getUserProfile(targetUserId);
      if (profile) {
        setIsPrivateAccount(profile.isPrivate);
        setUserInfo({
          username: profile.username,
          displayName: profile.displayName,
          profilePicture: profile.profilePicture,
          isVerified: profile.isVerified,
        });
      } else {
        // Create a basic profile if it doesn't exist
        const basicProfile = {
          uid: targetUserId,
          username: targetUserId.split('@')[0] || `user_${targetUserId.slice(-4)}`,
          displayName: targetUserId.split('@')[0] || `User ${targetUserId.slice(-4)}`,
          email: targetUserId.includes('@') ? targetUserId : `${targetUserId}@example.com`,
          isPrivate: false,
          isVerified: false,
        };
        
        const createdProfile = await profileService.updateUserProfile(basicProfile);
        setIsPrivateAccount(createdProfile.isPrivate);
        setUserInfo({
          username: createdProfile.username,
          displayName: createdProfile.displayName,
          profilePicture: createdProfile.profilePicture,
          isVerified: createdProfile.isVerified,
        });
      }
    } catch (error) {
      console.error('Error loading user info:', error);
      // Set fallback user info
      setIsPrivateAccount(false);
      setUserInfo({
        username: targetUserId.split('@')[0] || `user_${targetUserId.slice(-4)}`,
        displayName: targetUserId.split('@')[0] || `User ${targetUserId.slice(-4)}`,
        profilePicture: undefined,
        isVerified: false,
      });
    }
  };

  const handleFollow = async () => {
    if (!user?.uid || !userInfo || user.uid === targetUserId) return;

    try {
      setLoading(true);

      if (isFollowing) {
        // Unfollow
        await followService.unfollowUser(user.uid, targetUserId);
        setIsFollowing(false);
        setRequestPending(false);
        onFollowChange?.(false);
      } else if (requestPending) {
        // Cancel request (for now, just show message)
        Alert.alert('Request Pending', 'Your follow request is pending approval');
      } else {
        // Send follow request
        let currentUserProfile = await profileService.getUserProfile(user.uid);
        
        // Create basic profile for current user if it doesn't exist
        if (!currentUserProfile) {
          const basicProfile = {
            uid: user.uid,
            username: user.displayName?.toLowerCase().replace(/\s+/g, '_') || user.email?.split('@')[0] || `user_${user.uid.slice(-4)}`,
            displayName: user.displayName || user.email?.split('@')[0] || 'Unknown User',
            email: user.email || `${user.uid}@example.com`,
            isPrivate: false,
            isVerified: false,
          };
          
          currentUserProfile = await profileService.updateUserProfile(basicProfile);
        }
        
        const fromUserInfo = {
          username: currentUserProfile.username,
          displayName: currentUserProfile.displayName,
          profilePicture: currentUserProfile.profilePicture,
          isVerified: currentUserProfile.isVerified,
        };

        await followService.sendFollowRequest(user.uid, targetUserId);
        if (isPrivateAccount) {
          setRequestPending(true);
          Alert.alert('Request Sent', 'Follow request sent successfully');
        } else {
          setIsFollowing(true);
          onFollowChange?.(true);
          Alert.alert('Success', 'Now following!');
        }
      }
    } catch (error) {
      console.error('Error handling follow action:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Don't show button for current user
  if (!user?.uid || user.uid === targetUserId) {
    return null;
  }

  const getButtonText = () => {
    if (isFollowing) return 'Following';
    if (requestPending) return 'Requested';
    return 'Follow';
  };

  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[size]];
    
    if (isFollowing) {
      return [...baseStyle, styles.followingButton];
    } else if (requestPending) {
      return [...baseStyle, styles.requestedButton];
    } else {
      return [...baseStyle, styles.followButton];
    }
  };

  const getTextStyle = () => {
    if (isFollowing) {
      return [styles.buttonText, styles.followingText];
    } else if (requestPending) {
      return [styles.buttonText, styles.requestedText];
    } else {
      return [styles.buttonText, styles.followText];
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={handleFollow}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text style={getTextStyle()}>{getButtonText()}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  small: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 70,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 90,
  },
  large: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 110,
  },
  followButton: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderColor: '#666',
  },
  requestedButton: {
    backgroundColor: 'transparent',
    borderColor: '#999',
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  followText: {
    color: '#fff',
  },
  followingText: {
    color: '#666',
  },
  requestedText: {
    color: '#999',
  },
});
