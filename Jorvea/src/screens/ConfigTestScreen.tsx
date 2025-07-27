// Test component to verify MUX and Firebase configuration
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { testMuxConfiguration } from '../utils/testMuxConfig';
import { auth } from '../config/firebase';

export default function ConfigTestScreen() {
  const [muxStatus, setMuxStatus] = useState<string>('Not tested');
  const [firebaseStatus, setFirebaseStatus] = useState<string>('Not tested');
  const [testLogs, setTestLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setTestLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  const testMux = async () => {
    setMuxStatus('Testing...');
    addLog('🎥 Starting MUX test...');
    
    try {
      const result = await testMuxConfiguration();
      if (result) {
        setMuxStatus('✅ Working');
        addLog('✅ MUX configuration is working!');
      } else {
        setMuxStatus('❌ Failed');
        addLog('❌ MUX configuration failed');
      }
    } catch (error) {
      setMuxStatus('❌ Error');
      addLog(`❌ MUX test error: ${error}`);
    }
  };

  const testFirebase = async () => {
    setFirebaseStatus('Testing...');
    addLog('🔥 Starting Firebase test...');
    
    try {
      const user = auth.currentUser;
      if (user) {
        setFirebaseStatus('✅ Authenticated');
        addLog(`✅ Firebase user authenticated: ${user.email}`);
      } else {
        setFirebaseStatus('⚠️ Not authenticated');
        addLog('⚠️ Firebase user not authenticated');
      }
    } catch (error) {
      setFirebaseStatus('❌ Error');
      addLog(`❌ Firebase test error: ${error}`);
    }
  };

  const runAllTests = async () => {
    setTestLogs([]);
    addLog('🚀 Starting all configuration tests...');
    await testFirebase();
    await testMux();
    addLog('🏁 All tests completed!');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Configuration Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Firebase Status:</Text>
        <Text style={styles.statusText}>{firebaseStatus}</Text>
      </View>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>MUX Status:</Text>
        <Text style={styles.statusText}>{muxStatus}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testFirebase}>
          <Text style={styles.buttonText}>Test Firebase</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testMux}>
          <Text style={styles.buttonText}>Test MUX</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={runAllTests}>
          <Text style={styles.buttonText}>Run All Tests</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logsContainer}>
        <Text style={styles.logsTitle}>Test Logs:</Text>
        {testLogs.map((log, index) => (
          <Text key={index} style={styles.logText}>{log}</Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusText: {
    fontSize: 16,
    color: '#666',
  },
  buttonContainer: {
    marginTop: 30,
    gap: 10,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logsContainer: {
    marginTop: 30,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    minHeight: 200,
  },
  logsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  logText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
});
