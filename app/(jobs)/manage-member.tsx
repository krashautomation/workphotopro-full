import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { IconSymbol } from '@/components/IconSymbol';
import Avatar from '@/components/Avatar';
import { Switch } from 'react-native';
import { useOrganization } from '@/context/OrganizationContext';
import { teamService } from '@/lib/appwrite/teams';

export default function ManageMemberScreen() {
  const { memberId, memberName, teamId } = useLocalSearchParams<{ 
    memberId: string; 
    memberName?: string;
    teamId: string;
  }>();
  const { currentTeam } = useOrganization();
  const [sendJobReports, setSendJobReports] = useState(false);
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<any>(null);
  
  // Get the actual teamId (prefer param, fallback to currentTeam)
  const actualTeamId = teamId || currentTeam?.$id || '';
  
  useEffect(() => {
    loadMemberData();
  }, [memberId, actualTeamId]);

  const loadMemberData = async () => {
    if (!actualTeamId || !memberId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Get memberships and find the specific member
      const memberships = await teamService.listMemberships(actualTeamId);
      const foundMember = memberships.memberships.find((m: any) => m.userId === memberId);
      
      if (foundMember) {
        setMember(foundMember);
      } else {
        // If not found, create a basic member object from params
        setMember({
          userId: memberId,
          userName: memberName || 'Member',
          userEmail: '',
          roles: [],
          membershipData: null
        });
      }
    } catch (error) {
      console.error('Error loading member data:', error);
      // Fallback to params
      setMember({
        userId: memberId,
        userName: memberName || 'Member',
        userEmail: '',
        roles: [],
        membershipData: null
      });
    } finally {
      setLoading(false);
    }
  };

  // Get display name for member
  const getMemberDisplayName = (): string => {
    if (member?.userName && member.userName.trim()) {
      return member.userName.trim();
    }
    if (member?.membershipData?.userName && member.membershipData.userName.trim()) {
      return member.membershipData.userName.trim();
    }
    if (member?.userEmail && member.userEmail.includes('@')) {
      // Format name from email
      const emailName = member.userEmail.split('@')[0];
      return emailName
        .split(/[._-]/)
        .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }
    return memberName || 'Member';
  };

  // Get profile picture for member
  const getMemberProfilePicture = (): string | undefined => {
    if (member?.profilePicture && member.profilePicture.trim()) {
      return member.profilePicture.trim();
    }
    if (member?.membershipData?.profilePicture && member.membershipData.profilePicture.trim()) {
      return member.membershipData.profilePicture.trim();
    }
    return undefined;
  };

  // Get member role
  const getMemberRole = (): string => {
    if (member?.membershipData?.role) {
      return member.membershipData.role;
    }
    if (member?.roles && member.roles.length > 0) {
      return member.roles[0];
    }
    return 'member';
  };

  const handleRemoveMember = () => {
    const displayName = getMemberDisplayName();
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${displayName} from the team?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Find the Appwrite membership ID
              if (member?.$id && actualTeamId) {
                await teamService.deleteMembership(actualTeamId, member.$id);
                Alert.alert('Success', `${displayName} has been removed from the team`);
                router.back();
              } else {
                Alert.alert('Error', 'Could not remove member. Membership not found.');
              }
            } catch (error: any) {
              console.error('Error removing member:', error);
              Alert.alert('Error', error.message || 'Failed to remove member. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{ 
            title: 'Manage Member',
            headerBackTitle: '',
            headerBackVisible: true,
          }} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.Primary} />
          <Text style={styles.loadingText}>Loading member data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = getMemberDisplayName();
  const profilePicture = getMemberProfilePicture();
  const memberRole = getMemberRole();
  const memberEmail = member?.userEmail || member?.membershipData?.userEmail || '';

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
        {/* Member Profile Section */}
        <View style={styles.profileSection}>
          <Avatar
            name={displayName}
            imageUrl={profilePicture}
            size={120}
          />
          <Text style={styles.userName}>{displayName}</Text>
          {memberEmail && (
            <Text style={styles.userEmail}>{memberEmail}</Text>
          )}
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{memberRole.toUpperCase()}</Text>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.Gray,
    marginTop: 12,
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
    fontSize: 20,
    fontWeight: '600',
    color: Colors.Text,
    marginTop: 16,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.Gray,
    marginTop: 4,
  },
  roleBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: Colors.Secondary,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.Primary,
    letterSpacing: 0.5,
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
