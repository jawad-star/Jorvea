import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface FloatingIconProps {
  delay: number;
  icon: string;
  color: string;
  size: number;
  left: number;
  top: number;
}

const FloatingIcon: React.FC<FloatingIconProps> = ({ 
  delay, 
  icon, 
  color, 
  size, 
  left, 
  top 
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      // Initial fade in
      Animated.timing(opacity, {
        toValue: 0.7,
        duration: 1000,
        delay,
        useNativeDriver: true,
      }).start();

      // Floating animation
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: -15,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1.1,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: 15,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 0.9,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();

      // Rotation animation
      Animated.loop(
        Animated.timing(rotate, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        })
      ).start();
    };

    animate();
  }, [delay, translateY, scale, rotate, opacity]);

  const rotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.floatingIcon,
        {
          left,
          top,
          opacity,
          transform: [
            { translateY },
            { scale },
            { rotate: rotation },
          ],
        },
      ]}
    >
      <Ionicons name={icon as any} size={size} color={color} />
    </Animated.View>
  );
};

export default function FloatingElements() {
  const elements = [
    { delay: 0, icon: 'heart', color: 'rgba(255,105,180,0.6)', size: 28, left: width * 0.1, top: height * 0.15 },
    { delay: 1000, icon: 'camera', color: 'rgba(255,255,255,0.7)', size: 26, left: width * 0.85, top: height * 0.25 },
    { delay: 2000, icon: 'chatbubble', color: 'rgba(255,215,0,0.8)', size: 24, left: width * 0.15, top: height * 0.45 },
    { delay: 3000, icon: 'share-social', color: 'rgba(255,255,255,0.6)', size: 30, left: width * 0.8, top: height * 0.55 },
    { delay: 4000, icon: 'thumbs-up', color: 'rgba(255,105,180,0.5)', size: 27, left: width * 0.1, top: height * 0.75 },
    { delay: 5000, icon: 'musical-notes', color: 'rgba(255,215,0,0.7)', size: 25, left: width * 0.85, top: height * 0.1 },
  ];

  return (
    <View style={styles.container} pointerEvents="none">
      {elements.map((element, index) => (
        <FloatingIcon
          key={index}
          delay={element.delay}
          icon={element.icon}
          color={element.color}
          size={element.size}
          left={element.left}
          top={element.top}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  floatingIcon: {
    position: 'absolute',
    zIndex: 1,
  },
});
