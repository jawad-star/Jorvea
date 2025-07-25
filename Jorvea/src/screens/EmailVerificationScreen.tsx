import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useAuth } from '../context/AuthContext';
import { sendVerificationEmail, reloadUser } from '../services/authService';

const { width, height } = Dimensions.get('window');

export default function EmailVerificationScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);

  useEffect(() => {
    // Check if user is already verified
    if (user?.emailVerified) {
      router.replace('/');
    }
  }, [user]);

  const handleSendVerification = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await sendVerificationEmail(user);
      setVerificationSent(true);
      Alert.alert(
        'Verification Email Sent',
        'Please check your email and click the verification link.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Email verification error:', error.message);
      Alert.alert('Error', 'Failed to send verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!user) return;

    setCheckingVerification(true);
    try {
      await reloadUser(user);
      if (user.emailVerified) {
        Alert.alert(
          'Email Verified!',
          'Your email has been successfully verified.',
          [
            {
              text: 'Continue',
              onPress: () => router.replace('/')
            }
          ]
        );
      } else {
        Alert.alert(
          'Not Verified Yet',
          'Please check your email and click the verification link first.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Check verification error:', error.message);
      Alert.alert('Error', 'Failed to check verification status.');
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await user?.auth.signOut();
      router.replace('/sign-in');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Animated Header */}
          <Animatable.View 
            animation="bounceIn" 
            duration={1500}
            style={styles.iconContainer}
          >
            <View style={styles.emailIconWrapper}>
              <Ionicons name="mail" size={60} color="#667eea" />
            </View>
          </Animatable.View>

          <Animatable.View 
            animation="slideInUp" 
            duration={1000}
            delay={500}
            style={styles.textContainer}
          >
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              We've sent a verification email to:
            </Text>
            <Text style={styles.email}>{user?.email}</Text>
            <Text style={styles.description}>
              Please check your email and click the verification link to continue.
            </Text>
          </Animatable.View>

          {/* Action Buttons */}
          <Animatable.View 
            animation="slideInUp" 
            duration={1000}
            delay={800}
            style={styles.buttonContainer}
          >
            {!verificationSent ? (
              <TouchableOpacity 
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleSendVerification}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="mail-outline" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.primaryButtonText}>
                    {loading ? "Sending..." : "Send Verification Email"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.primaryButton, checkingVerification && styles.buttonDisabled]}
                onPress={handleCheckVerification}
                disabled={checkingVerification}
              >
                <LinearGradient
                  colors={['#4CAF50', '#45a049']}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.primaryButtonText}>
                    {checkingVerification ? "Checking..." : "I've Verified My Email"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {verificationSent && (
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={handleSendVerification}
                disabled={loading}
              >
                <Text style={styles.secondaryButtonText}>
                  Resend Verification Email
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={18} color="#ff6b6b" />
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </Animatable.View>

          {/* Help Section */}
          <Animatable.View 
            animation="fadeIn" 
            duration={1000}
            delay={1200}
            style={styles.helpContainer}
          >
            <Text style={styles.helpTitle}>Didn't receive the email?</Text>
            <Text style={styles.helpText}>
              • Check your spam/junk folder{'\n'}
              • Make sure the email address is correct{'\n'}
              • Try resending the verification email
            </Text>
          </Animatable.View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: height * 0.1,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 30,
  },
  emailIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 10,
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  description: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  primaryButton: {
    width: '100%',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  buttonIcon: {
    marginRight: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  signOutButtonText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginLeft: 5,
  },
  helpContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    width: '100%',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    lineHeight: 20,
  },
});
