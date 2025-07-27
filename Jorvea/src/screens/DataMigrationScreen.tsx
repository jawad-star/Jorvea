import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { dataMigrationService } from '../services/dataMigrationService';
import { profileService, contentService, followService } from '../services';

export default function DataMigrationScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<string>('');

  const handleClearLocalData = async () => {
    Alert.alert(
      'Clear Local Data',
      'This will remove all locally stored data from AsyncStorage. Your Firebase data will remain intact. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await dataMigrationService.clearAllLocalData();
              setMigrationStatus('✅ Local data cleared successfully');
            } catch (error) {
              setMigrationStatus('❌ Failed to clear local data');
            }
            setLoading(false);
          },
        },
      ]
    );
  };

  const handleTestFirebase = async () => {
    setLoading(true);
    setMigrationStatus('🔄 Testing Firebase connection...');
    
    try {
      const isConnected = await dataMigrationService.testFirebaseConnection();
      if (isConnected) {
        setMigrationStatus('✅ Firebase connection successful!');
        setTimeout(() => {
          dataMigrationService.showMigrationStatus();
        }, 1000);
      } else {
        setMigrationStatus('❌ Firebase connection failed');
      }
    } catch (error) {
      setMigrationStatus('❌ Firebase connection error');
    }
    setLoading(false);
  };

  const handleInitializeUser = async () => {
    if (!user) {
      Alert.alert('Error', 'No user logged in');
      return;
    }

    setLoading(true);
    setMigrationStatus('🔄 Initializing user in Firebase...');
    
    try {
      await dataMigrationService.initializeUserInFirebase(user);
      setMigrationStatus('✅ User initialized in Firebase successfully!');
    } catch (error) {
      setMigrationStatus('❌ Failed to initialize user in Firebase');
      console.error('Error initializing user:', error);
    }
    setLoading(false);
  };

  const handleShowFirebaseRules = () => {
    const rules = dataMigrationService.getFirebaseSecurityRulesInstructions();
    Alert.alert(
      'Firebase Security Rules',
      'Please check the console for detailed Firebase security rules setup instructions.',
      [{ text: 'OK' }]
    );
    console.log(rules);
  };

  const handleTestDataFlow = async () => {
    if (!user) {
      Alert.alert('Error', 'No user logged in');
      return;
    }

    setLoading(true);
    setMigrationStatus('🔄 Testing Firebase data flow...');
    
    try {
      // Test profile service
      const profile = await profileService.getUserProfile(user.uid);
      console.log('Profile test:', profile ? '✅ Found' : '❌ Not found');
      
      // Test content service
      const posts = await contentService.getAllPosts();
      console.log('Posts test:', `✅ Found ${posts.length} posts`);
      
      // Test follow service
      const followStats = await followService.getUserFollowStats(user.uid);
      console.log('Follow stats test:', followStats ? '✅ Found' : '❌ Not found');
      
      setMigrationStatus(`✅ Data flow test completed!\nProfile: ${profile ? 'Found' : 'Not found'}\nPosts: ${posts.length} found\nFollow stats: ${followStats ? 'Found' : 'Not found'}`);
    } catch (error) {
      console.error('Data flow test error:', error);
      setMigrationStatus('❌ Data flow test failed');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Firebase Migration</Text>
        <Text style={styles.headerSubtitle}>Data Migration & Testing Tools</Text>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {migrationStatus ? (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>{migrationStatus}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗑️ Data Cleanup</Text>
          <Text style={styles.sectionDescription}>
            Clear old AsyncStorage data to ensure the app uses Firebase for all data.
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleClearLocalData} disabled={loading}>
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Clear Local Data</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Firebase Connection</Text>
          <Text style={styles.sectionDescription}>
            Test connection to Firebase and check database status.
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleTestFirebase} disabled={loading}>
            <Ionicons name="cloud-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Test Firebase Connection</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 User Setup</Text>
          <Text style={styles.sectionDescription}>
            Initialize your user profile in Firebase if it doesn't exist.
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleInitializeUser} disabled={loading || !user}>
            <Ionicons name="person-add-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Initialize User Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 Data Flow Test</Text>
          <Text style={styles.sectionDescription}>
            Test all Firebase services to ensure they're working correctly.
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleTestDataFlow} disabled={loading || !user}>
            <Ionicons name="flask-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Test Data Flow</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛡️ Security Rules</Text>
          <Text style={styles.sectionDescription}>
            Get Firebase security rules for your Firestore database.
          </Text>
          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleShowFirebaseRules}>
            <Ionicons name="shield-outline" size={20} color="#667eea" />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Show Security Rules</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e8e8e8',
    textAlign: 'center',
    marginTop: 5,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#f0f2ff',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  secondaryButtonText: {
    color: '#667eea',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#667eea',
    marginTop: 10,
  },
});
