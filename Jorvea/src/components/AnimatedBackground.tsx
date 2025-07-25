import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface AnimatedElementProps {
  delay: number;
  duration: number;
  size: number;
  left: number;
  top: number;
  icon: string;
  color: string;
}

const AnimatedElement: React.FC<AnimatedElementProps> = ({ 
  delay, 
  duration, 
  size, 
  left, 
  top, 
  icon, 
  color 
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const animateElement = () => {
      // Reset animations
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      opacityAnim.setValue(0);
      translateYAnim.setValue(50);

      // Start animations with delay
      setTimeout(() => {
        Animated.parallel([
          // Scale animation (breathing effect)
          Animated.loop(
            Animated.sequence([
              Animated.timing(scaleAnim, {
                toValue: 1,
                duration: duration,
                useNativeDriver: true,
              }),
              Animated.timing(scaleAnim, {
                toValue: 0.8,
                duration: duration,
                useNativeDriver: true,
              }),
            ])
          ),
          // Rotation animation
          Animated.loop(
            Animated.timing(rotateAnim, {
              toValue: 1,
              duration: duration * 2,
              useNativeDriver: true,
            })
          ),
          // Opacity blinking
          Animated.loop(
            Animated.sequence([
              Animated.timing(opacityAnim, {
                toValue: 0.8,
                duration: duration / 2,
                useNativeDriver: true,
              }),
              Animated.timing(opacityAnim, {
                toValue: 0.3,
                duration: duration / 2,
                useNativeDriver: true,
              }),
            ])
          ),
          // Float up and down
          Animated.loop(
            Animated.sequence([
              Animated.timing(translateYAnim, {
                toValue: -20,
                duration: duration * 1.5,
                useNativeDriver: true,
              }),
              Animated.timing(translateYAnim, {
                toValue: 20,
                duration: duration * 1.5,
                useNativeDriver: true,
              }),
            ])
          ),
        ]).start();
      }, delay);
    };

    animateElement();
  }, [delay, duration, scaleAnim, rotateAnim, opacityAnim, translateYAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.animatedElement,
        {
          left,
          top,
          transform: [
            { scale: scaleAnim },
            { rotate: spin },
            { translateY: translateYAnim },
          ],
          opacity: opacityAnim,
        },
      ]}
    >
      <Ionicons name={icon as any} size={size} color={color} />
    </Animated.View>
  );
};

export default function AnimatedBackground() {
  const bubbles = [
    { delay: 0, duration: 2000, size: 40, left: 50, top: 100, icon: 'ellipse', color: 'rgba(255,255,255,0.6)' },
    { delay: 500, duration: 2500, size: 30, left: 300, top: 200, icon: 'ellipse', color: 'rgba(255,255,255,0.4)' },
    { delay: 1000, duration: 3000, size: 35, left: 80, top: 300, icon: 'ellipse', color: 'rgba(255,255,255,0.5)' },
    { delay: 1500, duration: 2200, size: 25, left: 280, top: 400, icon: 'ellipse', color: 'rgba(255,255,255,0.3)' },
    { delay: 2000, duration: 2800, size: 45, left: 150, top: 150, icon: 'ellipse', color: 'rgba(255,255,255,0.7)' },
    { delay: 2500, duration: 2600, size: 28, left: 320, top: 350, icon: 'ellipse', color: 'rgba(255,255,255,0.4)' },
  ];

  const stars = [
    { delay: 300, duration: 3000, size: 32, left: 120, top: 80, icon: 'star', color: 'rgba(255,215,0,0.8)' },
    { delay: 800, duration: 2400, size: 26, left: 260, top: 120, icon: 'star', color: 'rgba(255,255,255,0.9)' },
    { delay: 1300, duration: 3200, size: 28, left: 40, top: 250, icon: 'star', color: 'rgba(255,215,0,0.7)' },
    { delay: 1800, duration: 2700, size: 24, left: 310, top: 280, icon: 'star', color: 'rgba(255,255,255,0.8)' },
    { delay: 2300, duration: 3100, size: 30, left: 180, top: 380, icon: 'star', color: 'rgba(255,215,0,0.6)' },
    { delay: 2800, duration: 2900, size: 22, left: 90, top: 450, icon: 'star', color: 'rgba(255,255,255,0.7)' },
  ];

  const sparkles = [
    { delay: 400, duration: 1800, size: 24, left: 200, top: 60, icon: 'sparkles', color: 'rgba(255,255,255,0.9)' },
    { delay: 900, duration: 2100, size: 20, left: 60, top: 180, icon: 'sparkles', color: 'rgba(255,215,0,0.8)' },
    { delay: 1400, duration: 1900, size: 22, left: 290, top: 240, icon: 'sparkles', color: 'rgba(255,255,255,0.7)' },
    { delay: 1900, duration: 2300, size: 26, left: 130, top: 420, icon: 'sparkles', color: 'rgba(255,215,0,0.9)' },
  ];

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Render Bubbles */}
      {bubbles.map((bubble, index) => (
        <AnimatedElement
          key={`bubble-${index}`}
          delay={bubble.delay}
          duration={bubble.duration}
          size={bubble.size}
          left={bubble.left}
          top={bubble.top}
          icon={bubble.icon}
          color={bubble.color}
        />
      ))}
      
      {/* Render Stars */}
      {stars.map((star, index) => (
        <AnimatedElement
          key={`star-${index}`}
          delay={star.delay}
          duration={star.duration}
          size={star.size}
          left={star.left}
          top={star.top}
          icon={star.icon}
          color={star.color}
        />
      ))}
      
      {/* Render Sparkles */}
      {sparkles.map((sparkle, index) => (
        <AnimatedElement
          key={`sparkle-${index}`}
          delay={sparkle.delay}
          duration={sparkle.duration}
          size={sparkle.size}
          left={sparkle.left}
          top={sparkle.top}
          icon={sparkle.icon}
          color={sparkle.color}
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
  animatedElement: {
    position: 'absolute',
    zIndex: 1,
  },
});
