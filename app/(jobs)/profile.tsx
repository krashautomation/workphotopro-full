import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import UserProfile from '@/components/UserProfile';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/utils/colors';
import { IconSymbol } from '@/components/IconSymbol';

export default function ProfileScreen() {
  const { user, getGoogleUserData, signOut } = useAuth();
  const [googleData, setGoogleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoogleData();
  }, []);

  const loadGoogleData = async () => {
    try {
      const data = await getGoogleUserData();
      setGoogleData(data);
    } catch (error) {
      console.error('Error loading Google data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Sign out error:', error);
            }
          }
        },
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert(
      'Edit Profile',
      'Profile editing features coming soon!',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Profile' }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Profile' }} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Profile Picture Section */}
        <View style={styles.profileSection}>
          <UserProfile 
            size={120} 
            showEditButton={true}
            showName={true}
          />
          
          <Pressable style={styles.editProfileButton} onPress={handleEditProfile}>
            <IconSymbol name="pencil" color={Colors.White} size={16} />
            <Text style={styles.editProfileText}>Update Avatar</Text>
          </Pressable>
        </View>

        {/* User Information Section */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>
              {googleData?.googleName || googleData?.firstName || user?.name || 'Not provided'}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>
              {googleData?.googleEmail || user?.email || 'Not provided'}
            </Text>
          </View>
          
          {googleData?.firstName && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>First Name</Text>
              <Text style={styles.infoValue}>{googleData.firstName}</Text>
            </View>
          )}
          
          {googleData?.lastName && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Last Name</Text>
              <Text style={styles.infoValue}>{googleData.lastName}</Text>
            </View>
          )}
          
          {googleData?.locale && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Locale</Text>
              <Text style={styles.infoValue}>{googleData.locale}</Text>
            </View>
          )}
          
          {googleData?.googleDataUpdated && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Last Updated</Text>
              <Text style={styles.infoValue}>
                {new Date(googleData.googleDataUpdated).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {/* Profile Picture Info */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Profile Picture</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Source</Text>
            <Text style={styles.infoValue}>
              {googleData?.profilePicture ? 'Google Account' : 'Uploaded Photo'}
            </Text>
          </View>
          {googleData?.profilePicture && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Google URL</Text>
              <Text style={styles.infoValue} numberOfLines={2}>
                {googleData.profilePicture}
              </Text>
            </View>
          )}
          {googleData?.profilePictureUrl && googleData.profilePictureUrl !== googleData?.profilePicture && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Uploaded URL</Text>
              <Text style={styles.infoValue} numberOfLines={2}>
                {googleData.profilePictureUrl}
              </Text>
            </View>
          )}
        </View>

        {/* Actions Section */}
        <View style={styles.actionsSection}>
          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <IconSymbol name="arrow.right.square" color={Colors.White} size={20} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.Text,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.Primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  editProfileText: {
    color: Colors.White,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoSection: {
    backgroundColor: Colors.Secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.Text,
    marginBottom: 16,
  },
  infoItem: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.Gray,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.Text,
  },
  actionsSection: {
    marginTop: 20,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 12,
  },
  signOutText: {
    color: Colors.White,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});