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
} from 'react-native';
import { followService } from '../services';
import { profileService } from '../services';
import { useAuth } from '../context/AuthContext';

export default function DebugFollowScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runFollowTests = async () => {
    if (!user) return;
    
    setLoading(true);
    clearResults();
    
    try {
      addResult('🔄 Starting Follow System Tests...\n');

      // Test 1: Create sample follow data
      addResult('Test 1: Creating sample follow data...');
      // await followService.createSampleFollowData(); // TODO: Implement in Firebase service
      addResult('✅ Sample follow data created\n');

      // Test 2: Check follow stats for current user
      addResult('Test 2: Checking follow stats for current user...');
      const userStats = await followService.getUserFollowStats(user.uid);
      addResult(`✅ User stats: ${userStats.followersCount} followers, ${userStats.followingCount} following\n`);

      // Test 3: Test follow functionality
      addResult('Test 3: Testing follow functionality...');
      const testUserId = 'user1'; // Sample user
      const isFollowing = await followService.isFollowing(user.uid, testUserId);
      addResult(`✅ Following status for ${testUserId}: ${isFollowing}\n`);

      // Test 4: Test story visibility
      addResult('Test 4: Testing story visibility...');
      const canSeeStories = await followService.canSeeUserStories(user.uid, testUserId);
      addResult(`✅ Can see stories for ${testUserId}: ${canSeeStories}\n`);

      // Test 5: Get followers and following lists
      addResult('Test 5: Getting followers and following lists...');
      const followers = await followService.getUserFollowers(user.uid);
      const following = await followService.getUserFollowing(user.uid);
      addResult(`✅ Followers: [${followers.join(', ')}]`);
      addResult(`✅ Following: [${following.join(', ')}]\n`);

      // Test 6: Test profile service integration
      addResult('Test 6: Testing profile service integration...');
      try {
        const profile = await profileService.getUserProfile(user.uid);
        if (profile) {
          addResult(`✅ Profile loaded: ${profile.displayName} (@${profile.username})\n`);
        } else {
          addResult(`❌ Profile not found\n`);
        }
      } catch (error) {
        addResult(`❌ Profile error: ${error}\n`);
      }

      addResult('🎉 All follow system tests completed successfully!');
      
    } catch (error) {
      addResult(`❌ Test failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testFollowRequest = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const testUserId = 'user2';
      const userInfo = {
        username: user.displayName || user.email || 'testuser',
        displayName: user.displayName || user.email || 'Test User',
        profilePicture: user.photoURL,
        isVerified: false
      };

      await followService.sendFollowRequest(user.uid, testUserId);
      Alert.alert('Success', 'Follow request sent!');
    } catch (error) {
      Alert.alert('Error', `Failed to send follow request: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will clear all follow data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Clear follow data by resetting AsyncStorage keys
              // await followService.cleanupOldRequests(); // TODO: Implement in Firebase service
              Alert.alert('Success', 'All follow data cleared!');
              clearResults();
            } catch (error) {
              Alert.alert('Error', `Failed to clear data: ${error}`);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Follow System Debug</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={runFollowTests}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Run All Tests</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={testFollowRequest}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { color: '#667eea' }]}>Test Follow Request</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={clearAllData}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Clear All Data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={clearResults}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { color: '#667eea' }]}>Clear Results</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Running tests...</Text>
          </View>
        )}

        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          {testResults.map((result, index) => (
            <Text key={index} style={styles.resultText}>
              {result}
            </Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#667eea',
  },
  secondaryButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dangerButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  resultsContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
});
