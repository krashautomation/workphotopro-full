import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import UserProfile from '@/components/UserProfile';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/utils/colors';
import { IconSymbol } from '@/components/IconSymbol';

export default function TeamScreen() {
  const { user, getGoogleUserData } = useAuth();
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

  const handleAddMembers = () => {
    router.push('/invite');
  };

  const handleManageMember = (memberId: string, memberName: string) => {
    router.push({
      pathname: '/manage-member',
      params: { memberId, memberName }
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Team' }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading team...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = googleData?.googleName || googleData?.firstName || user?.name || 'User';

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Team' }} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Team Header */}
        <View style={styles.teamHeader}>
          <Text style={styles.teamTitle}>Gardening Team</Text>
          <Text style={styles.teamSubtitle}>1 team members</Text>
        </View>

        {/* Team Members Section */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>Team Members</Text>
          
          <Pressable 
            style={styles.memberCard}
            onPress={() => handleManageMember('current-user', displayName)}
          >
            <View style={styles.memberInfo}>
              <UserProfile 
                size={60} 
                showEditButton={false}
                showName={false}
              />
              <View style={styles.memberDetails}>
                <Text style={styles.memberName}>{displayName}</Text>
                <Text style={styles.memberRole}>Owner</Text>
              </View>
            </View>
            <IconSymbol name="chevron.right" color={Colors.Gray} size={16} />
          </Pressable>
        </View>

        {/* Add Members Button */}
        <View style={styles.addMembersSection}>
          <Pressable style={styles.addMembersButton} onPress={handleAddMembers}>
            <IconSymbol name="plus" color={Colors.White} size={20} />
            <Text style={styles.addMembersText}>Add Members</Text>
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
  teamHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  teamTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.Text,
    marginBottom: 8,
  },
  teamSubtitle: {
    fontSize: 16,
    color: Colors.Gray,
  },
  membersSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.Text,
    marginBottom: 16,
  },
  memberCard: {
    backgroundColor: Colors.Secondary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberDetails: {
    marginLeft: 16,
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.Text,
    marginBottom: 4,
  },
  memberRole: {
    fontSize: 14,
    color: Colors.Gray,
  },
  addMembersSection: {
    marginTop: 'auto',
    paddingTop: 20,
  },
  addMembersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.Primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  addMembersText: {
    color: Colors.White,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
