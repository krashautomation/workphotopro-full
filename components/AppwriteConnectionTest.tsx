import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { testAppwriteHealth, testAppwriteConnection, ConnectionTestResult } from '@/lib/appwrite/testConnection';

export default function AppwriteConnectionTest() {
  const [healthResult, setHealthResult] = useState<ConnectionTestResult | null>(null);
  const [connectionResult, setConnectionResult] = useState<ConnectionTestResult | null>(null);
  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    setTesting(true);
    setHealthResult(null);
    setConnectionResult(null);

    // Test health endpoint
    const health = await testAppwriteHealth();
    setHealthResult(health);

    // Test connection
    const conn = await testAppwriteConnection();
    setConnectionResult(conn);

    setTesting(false);
  };

  const getStatusColor = (success: boolean) => {
    return success ? '#22c55e' : '#ef4444';
  };

  const getStatusText = (success: boolean) => {
    return success ? '✅ PASSED' : '❌ FAILED';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Appwrite Connection Test</Text>
        <Text style={styles.subtitle}>Test if Appwrite is accessible</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, testing && styles.buttonDisabled]}
        onPress={runTests}
        disabled={testing}
      >
        <Text style={styles.buttonText}>
          {testing ? 'Testing...' : 'Run Connection Tests'}
        </Text>
      </TouchableOpacity>

      {healthResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Health Check Test</Text>
          <Text style={[styles.resultStatus, { color: getStatusColor(healthResult.success) }]}>
            {getStatusText(healthResult.success)}
          </Text>
          <Text style={styles.resultDetail}>Endpoint: {healthResult.endpoint}</Text>
          <Text style={styles.resultDetail}>Duration: {healthResult.duration}ms</Text>
          {healthResult.statusCode && (
            <Text style={styles.resultDetail}>Status Code: {healthResult.statusCode}</Text>
          )}
          {healthResult.error && (
            <Text style={[styles.resultDetail, { color: '#ef4444' }]}>
              Error: {healthResult.error}
            </Text>
          )}
        </View>
      )}

      {connectionResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Connection Test</Text>
          <Text style={[styles.resultStatus, { color: getStatusColor(connectionResult.success) }]}>
            {getStatusText(connectionResult.success)}
          </Text>
          <Text style={styles.resultDetail}>Endpoint: {connectionResult.endpoint}</Text>
          <Text style={styles.resultDetail}>Duration: {connectionResult.duration}ms</Text>
          {connectionResult.statusCode && (
            <Text style={styles.resultDetail}>Status Code: {connectionResult.statusCode}</Text>
          )}
          {connectionResult.error && (
            <Text style={[styles.resultDetail, { color: '#ef4444' }]}>
              Error: {connectionResult.error}
            </Text>
          )}
        </View>
      )}

      {(healthResult || connectionResult) && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>What do these results mean?</Text>
          <Text style={styles.infoText}>
            • Health Check: Tests if Appwrite server is responding
          </Text>
          <Text style={styles.infoText}>
            • Connection Test: Tests if you can reach Appwrite API
          </Text>
          <Text style={styles.infoText}>
            • 401 status is OK - it means server is reachable but you're not authenticated
          </Text>
          <Text style={styles.infoText}>
            • Timeout errors indicate Appwrite may be down
          </Text>
          <Text style={styles.infoText}>
            • Check status at: https://status.appwrite.io
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
  },
  button: {
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#6b7280',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  resultStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultDetail: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  infoContainer: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
    lineHeight: 20,
  },
});
