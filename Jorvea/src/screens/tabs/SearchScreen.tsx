import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { contentService, profileService } from '../../services';
import { UserProfile } from '../../services/firebaseProfileService';
import { followService } from '../../services';
import { Post, Reel } from '../../types/media';
import MediaViewer from '../../components/MediaViewer';
import TrendingTags from '../../components/TrendingTags';
import SearchSuggestions from '../../components/SearchSuggestions';
import FollowButton from '../../components/FollowButton';
import { useNavigation } from '@react-navigation/native';
import { initializeSampleProfiles } from '../../utils/sampleData';
import NotificationIcon from '../../components/NotificationIcon';

type SearchResult = {
  type: 'post' | 'reel' | 'user';
  data: Post | Reel | UserProfile;
};

export default function SearchScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [trendingContent, setTrendingContent] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'reels' | 'users'>('all');
  const [mediaViewerVisible, setMediaViewerVisible] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Post | Reel | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<'post' | 'reel'>('post');

  useEffect(() => {
    loadTrendingContent();
    initializeSampleProfiles(); // Initialize sample profiles for testing
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, activeTab]);

  const loadTrendingContent = async () => {
    try {
      const [posts, reels] = await Promise.all([
        contentService.getAllPosts(),
        contentService.getAllReels()
      ]);
      
      // Combine and sort by engagement (likes + views + shares)
      const allContent: SearchResult[] = [
        ...posts.map(post => ({ type: 'post' as const, data: post })),
        ...reels.map(reel => ({ type: 'reel' as const, data: reel }))
      ].sort((a, b) => {
        const aViews = 'views' in a.data ? a.data.views : 0;
        const bViews = 'views' in b.data ? b.data.views : 0;
        const aEngagement = a.data.likes + aViews + a.data.shares;
        const bEngagement = b.data.likes + bViews + b.data.shares;
        return bEngagement - aEngagement;
      });

      setTrendingContent(allContent.slice(0, 20)); // Top 20 trending
    } catch (error) {
      console.error('Error loading trending content:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const results: SearchResult[] = [];
      
      if (activeTab === 'all' || activeTab === 'users') {
        const users = await profileService.searchUsers(searchQuery);
        results.push(...users.map(user => ({ type: 'user' as const, data: user })));
      }
      
      if (activeTab === 'all' || activeTab === 'posts') {
        const posts = await contentService.searchPosts(searchQuery);
        results.push(...posts.map(post => ({ type: 'post' as const, data: post })));
      }
      
      if (activeTab === 'all' || activeTab === 'reels') {
        const reels = await contentService.searchReels(searchQuery);
        results.push(...reels.map(reel => ({ type: 'reel' as const, data: reel })));
      }
      
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMediaViewer = (content: Post | Reel, type: 'post' | 'reel') => {
    setSelectedContent(content);
    setSelectedContentType(type);
    setMediaViewerVisible(true);
  };

  const handleCloseMediaViewer = () => {
    setMediaViewerVisible(false);
    setSelectedContent(null);
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => {
    const { type, data } = item;
    
    if (type === 'user') {
      const userProfile = data as UserProfile;
      const [followStats, setFollowStats] = useState({ followersCount: 0, followingCount: 0 });
      
      // Load follow stats for this user
      useEffect(() => {
        const loadUserFollowStats = async () => {
          try {
            const stats = await followService.getUserFollowStats(userProfile.uid);
            setFollowStats({
              followersCount: stats.followersCount || 0,
              followingCount: stats.followingCount || 0
            });
          } catch (error) {
            console.error('Error loading follow stats for user:', error);
          }
        };
        loadUserFollowStats();
      }, [userProfile.uid]);
      
      return (
        <View style={styles.userResultItem}>
          <TouchableOpacity 
            style={styles.userInfo}
            onPress={() => navigation.navigate('UserProfile', { userId: userProfile.uid })}
          >
            <Image 
              source={{ 
                uri: userProfile.profilePicture || 'https://via.placeholder.com/50'
              }} 
              style={styles.userAvatar}
            />
            <View style={styles.userDetails}>
              <View style={styles.userNameRow}>
                <Text style={styles.userDisplayName}>{userProfile.displayName}</Text>
                {userProfile.isVerified && (
                  <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" />
                )}
                {userProfile.isPrivate && (
                  <Ionicons name="lock-closed" size={14} color="#666" style={styles.privateIcon} />
                )}
              </View>
              <Text style={styles.userName}>@{userProfile.username}</Text>
              {userProfile.bio && (
                <Text style={styles.userBio} numberOfLines={1}>{userProfile.bio}</Text>
              )}
              <View style={styles.userStats}>
                <Text style={styles.userStatText}>
                  {followStats.followersCount} followers
                </Text>
                <Text style={styles.userStatText}>
                  • {followStats.followingCount} following
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          
          <FollowButton
            targetUserId={userProfile.uid}
            targetUserInfo={{
              username: userProfile.username,
              displayName: userProfile.displayName,
              profilePicture: userProfile.profilePicture,
              isVerified: userProfile.isVerified,
            }}
            size="small"
          />
        </View>
      );
    }
    
    return (
      <TouchableOpacity 
        style={styles.resultItem}
        onPress={() => handleOpenMediaViewer(data as Post | Reel, type as 'post' | 'reel')}
      >
        <View style={styles.mediaContainer}>
          <Image 
            source={{ 
              uri: type === 'post' 
                ? (data as Post).mediaUrl 
                : (data as Reel).thumbnailUrl || (data as Reel).videoUrl
            }} 
            style={styles.mediaThumbnail}
          />
          {(type === 'reel' || (type === 'post' && (data as Post).mediaType === 'video')) && (
            <View style={styles.videoIndicator}>
              <Ionicons name="play" size={16} color="#fff" />
            </View>
          )}
          <View style={styles.mediaOverlay}>
            <View style={styles.contentTypeIndicator}>
              <Text style={styles.contentTypeText}>{type.toUpperCase()}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.resultInfo}>
          <Text style={styles.resultTitle} numberOfLines={2}>
            {type === 'post' 
              ? (data as Post).caption 
              : (data as Reel).title
            }
          </Text>
          <Text style={styles.resultUser}>@{(data as Post | Reel).userName}</Text>
          <View style={styles.resultStats}>
            <View style={styles.statItem}>
              <Ionicons name="heart" size={14} color="#ff3040" />
              <Text style={styles.statText}>{(data as Post | Reel).likes}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="eye" size={14} color="#666" />
              <Text style={styles.statText}>
                {'views' in data ? (data as any).views : 0}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.typeIndicator}>
          <Text style={[
            styles.typeText,
            { backgroundColor: type === 'post' ? '#667eea' : '#764ba2' }
          ]}>
            {type.toUpperCase()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGridItem = ({ item }: { item: SearchResult }) => {
    if (item.type === 'user') {
      // Don't render users in grid view, only content
      return null;
    }
    
    return (
      <TouchableOpacity style={styles.gridItem}>
        <Image 
          source={{ 
            uri: item.type === 'post' 
              ? (item.data as Post).mediaUrl 
              : (item.data as Reel).thumbnailUrl 
          }} 
          style={styles.gridImage}
        />
        {item.type === 'reel' && (
          <View style={styles.gridVideoIndicator}>
            <Ionicons name="play" size={12} color="#fff" />
          </View>
        )}
        <View style={styles.gridOverlay}>
          <View style={styles.gridStats}>
            <Ionicons name="heart" size={12} color="#fff" />
            <Text style={styles.gridStatText}>{(item.data as Post | Reel).likes}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const displayData = searchQuery.trim() ? searchResults : trendingContent;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Search</Text>
          <View style={styles.headerActions}>
            <NotificationIcon color="#fff" />
            <TouchableOpacity 
              style={styles.requestsButton}
              onPress={() => navigation.navigate('FollowRequests')}
            >
              <Ionicons name="person-add-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search posts, reels, users..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Search Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'all' && styles.activeTab]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'users' && styles.activeTab]}
            onPress={() => setActiveTab('users')}
          >
            <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
              Users
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
              Posts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'reels' && styles.activeTab]}
            onPress={() => setActiveTab('reels')}
          >
            <Text style={[styles.tabText, activeTab === 'reels' && styles.activeTabText]}>
              Reels
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : displayData.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            {searchQuery.trim() ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={64} color="#999" />
                <Text style={styles.emptyTitle}>No Results Found</Text>
                <Text style={styles.emptySubtitle}>
                  Try searching with different keywords
                </Text>
              </View>
            ) : (
              <>
                <SearchSuggestions
                  suggestions={[
                    { 
                      id: '1', 
                      type: 'user', 
                      title: 'Alice Johnson', 
                      subtitle: '@alice_j • 1.2K followers',
                      image: 'https://picsum.photos/100/100?random=1',
                      verified: true
                    },
                    { 
                      id: '2', 
                      type: 'hashtag', 
                      title: '#fyp', 
                      subtitle: '1.2M posts'
                    },
                    { 
                      id: '3', 
                      type: 'user', 
                      title: 'Bob Smith', 
                      subtitle: '@bobsmith • 856 followers',
                      image: 'https://picsum.photos/100/100?random=2'
                    },
                    { 
                      id: '4', 
                      type: 'location', 
                      title: 'New York, NY', 
                      subtitle: '45.6K posts'
                    },
                  ]}
                  onSuggestionPress={(suggestion) => {
                    if (suggestion.type === 'user') {
                      navigation.navigate('UserProfile', { userId: suggestion.id });
                    } else if (suggestion.type === 'hashtag') {
                      setSearchQuery(suggestion.title);
                    }
                  }}
                  onClearHistory={() => {
                    // Clear search history
                    console.log('Clear search history');
                  }}
                />
                <TrendingTags
                  onTagPress={(tag) => {
                    setSearchQuery(`#${tag}`);
                  }}
                />
              </>
            )}
          </View>
        ) : (
          <FlatList
            data={displayData}
            renderItem={searchQuery.trim() ? renderSearchResult : renderGridItem}
            keyExtractor={(item) => `${item.type}-${
              item.type === 'user' 
                ? (item.data as UserProfile).uid 
                : (item.data as Post | Reel).id
            }`}
            numColumns={searchQuery.trim() ? 1 : 3}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            key={searchQuery.trim() ? 'list' : 'grid'} // Force re-render when switching layouts
          />
        )}
      </View>

      {/* Media Viewer */}
      <MediaViewer
        visible={mediaViewerVisible}
        onClose={handleCloseMediaViewer}
        content={selectedContent}
        contentType={selectedContentType}
      />
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
  },
  
  // Search Container
  searchContainer: {
    marginBottom: 15,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 16,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  
  // Content
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 10,
  },
  
  // Search Results (List View)
  resultItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mediaContainer: {
    position: 'relative',
    marginRight: 12,
  },
  mediaThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  videoIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    padding: 2,
  },
  resultInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  resultUser: {
    fontSize: 12,
    color: '#666',
    marginVertical: 2,
  },
  resultStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  typeIndicator: {
    justifyContent: 'center',
  },
  typeText: {
    fontSize: 10,
    color: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600',
  },
  
  // Grid View (Trending)
  gridItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  gridVideoIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 6,
    padding: 2,
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    padding: 4,
  },
  gridStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridStatText: {
    fontSize: 10,
    color: '#fff',
    marginLeft: 2,
    fontWeight: '600',
  },
  
  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptyStateContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Media overlay styles
  mediaOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
  },
  contentTypeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  contentTypeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  
  // User search result styles
  userResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ddd',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userDisplayName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 6,
  },
  userName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userBio: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
  },
  userStats: {
    flexDirection: 'row',
  },
  userStatText: {
    fontSize: 12,
    color: '#666',
  },
  
  // New styles for header and follow functionality
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requestsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  userDetails: {
    flex: 1,
  },
  privateIcon: {
    marginLeft: 4,
  },
});
