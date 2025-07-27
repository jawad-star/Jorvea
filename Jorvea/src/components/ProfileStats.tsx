import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface ProfileStat {
  label: string;
  count: number;
  onPress?: () => void;
}

interface ProfileStatsProps {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  likesCount?: number;
  viewsCount?: number;
  onPostsPress?: () => void;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
}

export default function ProfileStats({
  postsCount,
  followersCount,
  followingCount,
  likesCount = 0,
  viewsCount = 0,
  onPostsPress,
  onFollowersPress,
  onFollowingPress
}: ProfileStatsProps) {

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const stats: ProfileStat[] = [
    {
      label: 'Posts',
      count: postsCount,
      onPress: onPostsPress
    },
    {
      label: 'Followers',
      count: followersCount,
      onPress: onFollowersPress
    },
    {
      label: 'Following',
      count: followingCount,
      onPress: onFollowingPress
    }
  ];

  const renderStat = (stat: ProfileStat, index: number) => (
    <TouchableOpacity 
      key={stat.label}
      style={styles.statItem} 
      onPress={stat.onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.statCount}>{formatCount(stat.count)}</Text>
      <Text style={styles.statLabel}>{stat.label}</Text>
    </TouchableOpacity>
  );

  const renderEngagementStats = () => (
    <View style={styles.engagementContainer}>
      <View style={styles.engagementItem}>
        <LinearGradient
          colors={['#ff6b6b', '#ee5a52']}
          style={styles.engagementIcon}
        >
          <Ionicons name="heart" size={16} color="#fff" />
        </LinearGradient>
        <Text style={styles.engagementText}>{formatCount(likesCount)} likes</Text>
      </View>
      
      <View style={styles.engagementItem}>
        <LinearGradient
          colors={['#4ecdc4', '#44a08d']}
          style={styles.engagementIcon}
        >
          <Ionicons name="eye" size={16} color="#fff" />
        </LinearGradient>
        <Text style={styles.engagementText}>{formatCount(viewsCount)} views</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        {stats.map(renderStat)}
      </View>
      {(likesCount > 0 || viewsCount > 0) && renderEngagementStats()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statCount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  engagementContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    gap: 20,
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  engagementIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  engagementText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});
