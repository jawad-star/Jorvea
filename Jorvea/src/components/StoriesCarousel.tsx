import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Dimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { storyService } from '../services';
import { StoryGroup } from '../services/firebaseContentService';

const { width } = Dimensions.get('window');

interface StoriesCarouselProps {
  onStoryPress?: (groupIndex: number, storyIndex?: number) => void;
  onAddStoryPress?: () => void;
}

export default function StoriesCarousel({ onStoryPress, onAddStoryPress }: StoriesCarouselProps) {
  const { user } = useAuth();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStories();
    
    // Set up periodic cleanup of expired stories
    const cleanupInterval = setInterval(() => {
      storyService.cleanupExpiredStories();
      loadStories();
    }, 60000); // Check every minute

    return () => clearInterval(cleanupInterval);
  }, []);

  const loadStories = async () => {
    try {
      const groups = await storyService.getStoriesGroupedByUser();
      setStoryGroups(groups);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAddStory = () => (
    <TouchableOpacity style={styles.storyItem} onPress={onAddStoryPress}>
      <View style={styles.addStoryContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.addStoryBackground}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </LinearGradient>
      </View>
      <Text style={styles.storyUsername}>Your Story</Text>
    </TouchableOpacity>
  );

  const renderStoryGroup = (group: StoryGroup, index: number) => {
    const isCurrentUser = group.userId === user?.uid;
    
    return (
      <TouchableOpacity 
        key={group.userId}
        style={styles.storyItem} 
        onPress={() => onStoryPress?.(index)}
      >
        <View style={[styles.storyBorder, !group.hasUnviewed && styles.viewedStoryBorder]}>
          <LinearGradient
            colors={group.hasUnviewed ? ['#f093fb', '#f5576c', '#4facfe'] : ['#c7c7c7', '#8e8e8e']}
            style={styles.storyGradient}
          >
            <View style={styles.storyImageContainer}>
              {group.userAvatar ? (
                <Image source={{ uri: group.userAvatar }} style={styles.storyImage} />
              ) : (
                <View style={styles.storyPlaceholder}>
                  <Ionicons name="person" size={30} color="#999" />
                </View>
              )}
              
              {/* Show story count badge for current user */}
              {isCurrentUser && group.stories.length > 0 && (
                <View style={styles.storyCountBadge}>
                  <Text style={styles.storyCountText}>{group.stories.length}</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>
        <Text style={styles.storyUsername} numberOfLines={1}>
          {isCurrentUser ? 'Your Story' : group.userName}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderAddStory()}
        {storyGroups.map(renderStoryGroup)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  scrollContent: {
    paddingHorizontal: 15,
    gap: 15,
  },
  storyItem: {
    alignItems: 'center',
    width: 70,
  },
  addStoryContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addStoryBackground: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyBorder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2,
  },
  viewedStoryBorder: {
    opacity: 0.6,
  },
  storyGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 2,
  },
  storyImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  storyImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  storyPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyUsername: {
    fontSize: 12,
    color: '#333',
    marginTop: 5,
    textAlign: 'center',
  },
  storyCountBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#ff3040',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  storyCountText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
});
