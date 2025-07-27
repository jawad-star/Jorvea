import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { followService, profileService } from '../services';
import { FollowRequest } from '../services/firebaseFollowService';
import { useAuth } from '../context/AuthContext';

export default function FollowRequestsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [userProfiles, setUserProfiles] = useState<{ [userId: string]: any }>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadFollowRequests();
    }, [user?.uid])
  );

  const loadFollowRequests = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const requests = await followService.getFollowRequests(user.uid);
      setFollowRequests(requests);
      
      // Load user profiles for all request senders
      const userIds = [...new Set(requests.map(req => req.fromUserId))];
      const profiles: { [userId: string]: any } = {};
      
      await Promise.all(
        userIds.map(async (userId) => {
          try {
            const profile = await profileService.getUserProfile(userId);
            if (profile) {
              profiles[userId] = profile;
            }
          } catch (error) {
            console.error(`Error loading profile for user ${userId}:`, error);
          }
        })
      );
      
      setUserProfiles(profiles);
    } catch (error) {
      console.error('Error loading follow requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFollowRequests();
    setRefreshing(false);
  };

  const handleAcceptRequest = async (request: FollowRequest) => {
    try {
      if (!request.id) return;
      await followService.acceptFollowRequest(request.id);
      setFollowRequests(prev => prev.filter(req => req.id !== request.id));
      Alert.alert('Success', `Follow request accepted`);
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const handleRejectRequest = async (request: FollowRequest) => {
    try {
      if (!request.id) return;
      await followService.rejectFollowRequest(request.id);
      setFollowRequests(prev => prev.filter(req => req.id !== request.id));
    } catch (error) {
      console.error('Error rejecting request:', error);
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const renderFollowRequest = ({ item }: { item: FollowRequest }) => {
    const userProfile = userProfiles[item.fromUserId];
    
    return (
      <View style={styles.requestItem}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => navigation.navigate('UserProfile', { userId: item.fromUserId })}
        >
          <Image
            source={{
              uri: userProfile?.profilePicture || 'https://via.placeholder.com/50'
            }}
            style={styles.profilePicture}
          />
          <View style={styles.userDetails}>
            <View style={styles.usernameRow}>
              <Text style={styles.username}>@{userProfile?.username || 'user'}</Text>
              {userProfile?.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" style={styles.verifiedBadge} />
              )}
            </View>
            <Text style={styles.displayName}>{userProfile?.displayName || 'Unknown User'}</Text>
            <Text style={styles.requestTime}>
              {new Date(item.createdAt?.toDate?.() || item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </TouchableOpacity>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => handleRejectRequest(item)}
        >
          <Ionicons name="close" size={20} color="#ff3b5c" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptRequest(item)}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
    );
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
        
        <Text style={styles.headerTitle}>Follow Requests</Text>
        
        <View style={styles.headerRight}>
          {followRequests.length > 0 && (
            <View style={styles.requestsBadge}>
              <Text style={styles.requestsCount}>{followRequests.length}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        {followRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={60} color="#666" />
            <Text style={styles.emptyTitle}>No Follow Requests</Text>
            <Text style={styles.emptySubtitle}>
              When people request to follow you, they'll appear here
            </Text>
          </View>
        ) : (
          <FlatList
            data={followRequests}
            keyExtractor={(item) => item.id || item.fromUserId}
            renderItem={renderFollowRequest}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#667eea"
                colors={['#667eea']}
              />
            }
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
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
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  requestsBadge: {
    backgroundColor: '#ff3b5c',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  requestsCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
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
    fontWeight: '600',
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  displayName: {
    color: '#999',
    fontSize: 14,
    marginTop: 2,
  },
  requestTime: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rejectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 59, 92, 0.2)',
    borderWidth: 1,
    borderColor: '#ff3b5c',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  acceptButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
