import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Animated,
  Text,
  Dimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface FloatingAction {
  id: string;
  title: string;
  icon: string;
  colors: [string, string];
  onPress: () => void;
}

interface FloatingActionButtonProps {
  onCreatePost?: () => void;
  onCreateReel?: () => void;
  onCreateStory?: () => void;
  onGoLive?: () => void;
}

export default function FloatingActionButton({
  onCreatePost,
  onCreateReel,
  onCreateStory,
  onGoLive
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const actions: FloatingAction[] = [
    {
      id: 'post',
      title: 'Post',
      icon: 'add-circle',
      colors: ['#667eea', '#764ba2'],
      onPress: onCreatePost || (() => {})
    },
    {
      id: 'reel',
      title: 'Reel',
      icon: 'videocam',
      colors: ['#f093fb', '#f5576c'],
      onPress: onCreateReel || (() => {})
    },
    {
      id: 'story',
      title: 'Story',
      icon: 'camera',
      colors: ['#4facfe', '#00f2fe'],
      onPress: onCreateStory || (() => {})
    },
    {
      id: 'live',
      title: 'Live',
      icon: 'radio',
      colors: ['#fa709a', '#fee140'],
      onPress: onGoLive || (() => {})
    }
  ];

  const toggleFAB = () => {
    const toValue = isOpen ? 0 : 1;
    Animated.spring(animation, {
      toValue,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
    setIsOpen(!isOpen);
  };

  const handleActionPress = (action: FloatingAction) => {
    action.onPress();
    toggleFAB();
  };

  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const renderActionButton = (action: FloatingAction, index: number) => {
    const translateY = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -(60 * (index + 1))],
    });

    const scale = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    const opacity = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <Animated.View
        key={action.id}
        style={[
          styles.actionButton,
          {
            transform: [{ translateY }, { scale }],
            opacity,
          },
        ]}
      >
        <View style={styles.actionContent}>
          <Text style={styles.actionLabel}>{action.title}</Text>
          <TouchableOpacity
            onPress={() => handleActionPress(action)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={action.colors}
              style={styles.actionGradient}
            >
              <Ionicons name={action.icon as any} size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Backdrop */}
      {isOpen && (
        <TouchableOpacity 
          style={styles.backdrop} 
          onPress={toggleFAB}
          activeOpacity={1}
        />
      )}
      
      {/* Action Buttons */}
      {actions.map(renderActionButton)}
      
      {/* Main FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={toggleFAB}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.fabGradient}
        >
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Ionicons name="add" size={28} color="#fff" />
          </Animated.View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    alignItems: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    width: width,
    height: height,
    top: -height,
    right: -20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionLabel: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: '500',
  },
  actionGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
