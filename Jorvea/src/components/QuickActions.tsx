import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  colors: [string, string];
  onPress: () => void;
}

interface QuickActionsProps {
  onCreatePost?: () => void;
  onCreateReel?: () => void;
  onGoLive?: () => void;
  onCreateStory?: () => void;
}

export default function QuickActions({ 
  onCreatePost, 
  onCreateReel, 
  onGoLive, 
  onCreateStory 
}: QuickActionsProps) {
  
  const actions: QuickAction[] = [
    {
      id: 'post',
      title: 'Create Post',
      icon: 'add-circle',
      colors: ['#667eea', '#764ba2'],
      onPress: onCreatePost || (() => {})
    },
    {
      id: 'reel',
      title: 'Create Reel',
      icon: 'videocam',
      colors: ['#f093fb', '#f5576c'],
      onPress: onCreateReel || (() => {})
    },
    {
      id: 'story',
      title: 'Add Story',
      icon: 'camera',
      colors: ['#4facfe', '#00f2fe'],
      onPress: onCreateStory || (() => {})
    },
    {
      id: 'live',
      title: 'Go Live',
      icon: 'radio',
      colors: ['#fa709a', '#fee140'],
      onPress: onGoLive || (() => {})
    }
  ];

  const renderAction = (action: QuickAction) => (
    <TouchableOpacity 
      key={action.id}
      style={styles.actionItem} 
      onPress={action.onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={action.colors}
        style={styles.actionBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={action.icon as any} size={24} color="#fff" />
      </LinearGradient>
      <Text style={styles.actionTitle}>{action.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsContainer}>
        {actions.map(renderAction)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  actionBackground: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionTitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
});
