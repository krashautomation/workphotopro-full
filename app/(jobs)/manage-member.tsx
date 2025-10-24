import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { IconSymbol } from '@/components/IconSymbol';
import UserProfile from '@/components/UserProfile';
import { Switch } from 'react-native';

export default function ManageMemberScreen() {
  const { memberId, memberName } = useLocalSearchParams();
  const [sendJobReports, setSendJobReports] = useState(false);

  const handleRemoveMember = () => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from the team?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement remove member functionality
            console.log('Remove member:', memberId);
            router.back();
          },
        },
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Manage Member',
          headerBackTitle: '',
          headerBackVisible: true,
        }} 
      />
      
      <View style={styles.content}>
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <UserProfile 
            size={120} 
            showEditButton={false}
            showName={false}
          />
          <Text style={styles.userName}>{memberName || 'Dave H.'}</Text>
        </View>

        {/* Permissions Section */}
        <View style={styles.permissionsSection}>
          <Text style={styles.permissionsTitle}>PERMISSIONS</Text>
          
          <View style={styles.permissionItem}>
            <Text style={styles.permissionLabel}>Send job reports</Text>
            <Switch
              value={sendJobReports}
              onValueChange={setSendJobReports}
              trackColor={{ false: Colors.Gray, true: Colors.Primary }}
              thumbColor={sendJobReports ? Colors.White : Colors.White}
            />
          </View>
        </View>

        {/* Remove Button */}
        <View style={styles.removeSection}>
          <Pressable style={styles.removeButton} onPress={handleRemoveMember}>
            <Text style={styles.removeButtonText}>Remove</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.Text,
    marginTop: 16,
  },
  permissionsSection: {
    marginBottom: 40,
  },
  permissionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.Text,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.Secondary,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  permissionLabel: {
    fontSize: 16,
    color: Colors.Text,
    flex: 1,
  },
  removeSection: {
    marginTop: 'auto',
    paddingBottom: 20,
  },
  removeButton: {
    backgroundColor: '#FF4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  removeButtonText: {
    color: Colors.White,
    fontSize: 16,
    fontWeight: '600',
  },
});
