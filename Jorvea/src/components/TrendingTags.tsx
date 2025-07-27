import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Dimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface TrendingTag {
  id: string;
  name: string;
  postCount: number;
  colors: [string, string];
}

interface TrendingTagsProps {
  onTagPress?: (tag: string) => void;
}

export default function TrendingTags({ onTagPress }: TrendingTagsProps) {
  const trendingTags: TrendingTag[] = [
    { id: '1', name: 'fyp', postCount: 1234, colors: ['#667eea', '#764ba2'] },
    { id: '2', name: 'viral', postCount: 987, colors: ['#f093fb', '#f5576c'] },
    { id: '3', name: 'trending', postCount: 756, colors: ['#4facfe', '#00f2fe'] },
    { id: '4', name: 'dance', postCount: 543, colors: ['#43e97b', '#38f9d7'] },
    { id: '5', name: 'music', postCount: 432, colors: ['#fa709a', '#fee140'] },
    { id: '6', name: 'comedy', postCount: 321, colors: ['#a8edea', '#fed6e3'] },
    { id: '7', name: 'art', postCount: 298, colors: ['#ff9a9e', '#fecfef'] },
    { id: '8', name: 'food', postCount: 287, colors: ['#ffecd2', '#fcb69f'] },
  ];

  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const renderTag = (tag: TrendingTag, index: number) => (
    <TouchableOpacity 
      key={tag.id}
      style={[styles.tagItem, { width: (width - 40) / 2 }]}
      onPress={() => onTagPress?.(tag.name)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={tag.colors}
        style={styles.tagGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.tagContent}>
          <View style={styles.tagIcon}>
            <Text style={styles.hashSymbol}>#</Text>
          </View>
          <Text style={styles.tagName}>{tag.name}</Text>
          <Text style={styles.tagCount}>{formatCount(tag.postCount)} posts</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Trending Hashtags</Text>
      <View style={styles.tagsContainer}>
        {trendingTags.map(renderTag)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    paddingVertical: 20,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagItem: {
    marginBottom: 10,
  },
  tagGradient: {
    borderRadius: 15,
    padding: 15,
    minHeight: 80,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tagContent: {
    alignItems: 'center',
  },
  tagIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  hashSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  tagName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  tagCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
});
