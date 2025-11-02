import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { Colors } from '@/utils/colors';
import { IconSymbol } from '@/components/IconSymbol';
import { teamService } from '@/lib/appwrite/teams';
import Avatar from '@/components/Avatar';

export default function TeamScreen() {
  const { user, getGoogleUserData, getUserProfilePicture } = useAuth();
  const { currentTeam, currentOrganization } = useOrganization();
  const [googleData, setGoogleData] = useState<any>(null);
  const [userProfilePicture, setUserProfilePicture] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeamData();
  }, [currentTeam]);

  const loadTeamData = async () => {
    try {
      setLoading(true);

      // Load user data
      const [data, profilePic] = await Promise.all([
        getGoogleUserData(),
        getUserProfilePicture()
      ]);
      setGoogleData(data);
      setUserProfilePicture(profilePic);

      // Load team members if team is selected
      if (currentTeam?.$id) {
        const memberships = await teamService.listMemberships(currentTeam.$id);
        setMembers(memberships.memberships);
      }

    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMembers = () => {
    router.push('/(jobs)/invite');
  };

  const handleManageMember = (memberId: string, memberName: string) => {
    // Pass memberId (userId) and teamId so manage-member can fetch full member data
    router.push({
      pathname: '/(jobs)/manage-member',
      params: { 
        memberId, // This is actually userId
        memberName, // Pass as fallback
        teamId: currentTeam?.$id || ''
      }
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Team' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.Primary} />
          <Text style={styles.loadingText}>Loading team...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = googleData?.googleName || googleData?.firstName || user?.name || 'User';
  const totalMembers = members.length;

  // Check if current user is already in the members list
  const currentUserInMembers = members.find(m => m.userId === user?.$id);
  
  // Helper function to get display name for a member
  const getMemberDisplayName = (member: any): string => {
    // If this is the current user and userName is empty, use displayName
    if (member.userId === user?.$id && (!member.userName || !member.userName.trim())) {
      return displayName;
    }
    
    // Check userInfo first (from getUserInfo lookup)
    if (member.userInfo?.name) {
      return member.userInfo.name;
    }
    
    // If userName exists and is not empty, use it
    if (member.userName && member.userName.trim()) {
      return member.userName.trim();
    }
    
    // Check for email in Appwrite membership object
    let email = member.userEmail || member.email || '';
    
    // Check for email in userInfo
    if ((!email || !email.includes('@')) && member.userInfo?.email) {
      email = member.userInfo.email;
    }
    
    // Check for email in our custom membershipData (if we stored it)
    if ((!email || !email.includes('@')) && member.membershipData?.userEmail) {
      email = member.membershipData.userEmail;
    }
    
    // If email exists, format it nicely
    if (email && email.includes('@')) {
      const emailName = email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    
    // Use a more user-friendly fallback - format userId nicely
    const shortUserId = member.userId ? member.userId.slice(0, 8) : 'member';
    return `Member ${shortUserId}`;
  };
  
  // Helper function to get profile picture for a member
  const getMemberProfilePicture = (member: any): string | undefined => {
    // Current user gets their profile picture
    if (member.$id === 'current-user') {
      return userProfilePicture ?? undefined;
    }
    
    // Priority order for profile picture:
    // 1. membershipData.profilePicture (cached in our database from server script)
    // 2. member.profilePicture (from combined membership object)
    // 3. userInfo.profilePicture (legacy from users collection)
    if (member.membershipData?.profilePicture && member.membershipData.profilePicture.trim()) {
      return member.membershipData.profilePicture.trim();
    }
    
    if (member.profilePicture && member.profilePicture.trim()) {
      return member.profilePicture.trim();
    }
    
    if (member.userInfo?.profilePicture) {
      return member.userInfo.profilePicture;
    }
    
    return undefined;
  };
  
  // If current user is not in members list but we have a team, add them as owner
  // Also, ensure all members have a valid display name
  const displayMembers = currentUserInMembers 
    ? members.map(m => ({
        ...m,
        userName: getMemberDisplayName(m)
      }))
    : user && currentTeam 
      ? [
          {
            userId: user.$id,
            userName: displayName, // Use actual display name
            roles: ['owner'],
            membershipData: { role: 'owner' },
            $id: 'current-user'
          },
          ...members.map(m => ({
            ...m,
            userName: getMemberDisplayName(m)
          }))
        ]
      : members.map(m => ({
          ...m,
          userName: getMemberDisplayName(m)
        }));

  const finalMemberCount = displayMembers.length;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Team' }} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Team Header */}
        <View style={styles.teamHeader}>
          <Text style={styles.teamTitle}>{currentTeam?.name || 'No Team'}</Text>
          
          <View style={styles.teamInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Members:</Text>
              <Text style={styles.infoValue}>{finalMemberCount} {finalMemberCount === 1 ? 'member' : 'members'}</Text>
            </View>
            {currentOrganization && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Organization:</Text>
                <Text style={styles.infoValue}>{currentOrganization.orgName}</Text>
              </View>
            )}
            {user && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Owner:</Text>
                <Text style={styles.infoValue}>{displayName}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Team Members Section */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>Team Members</Text>
          
          {displayMembers.length > 0 ? (
            displayMembers.map((member) => (
              <Pressable 
                key={member.$id}
                style={styles.memberCard}
                onPress={() => handleManageMember(member.userId, member.userName)}
              >
                <View style={styles.memberInfo}>
                  <Avatar
                    name={member.userName}
                    imageUrl={getMemberProfilePicture(member)}
                    size={50}
                  />
                  <View style={styles.memberDetails}>
                    <Text style={styles.memberName}>{member.userName}</Text>
                    <Text style={styles.memberRole}>
                      {member.membershipData?.role || member.roles?.[0] || 'member'}
                    </Text>
                  </View>
                </View>
                <IconSymbol name="chevron.right" color={Colors.Gray} size={16} />
              </Pressable>
            ))
          ) : (
            <Text style={styles.noMembersText}>No team members yet</Text>
          )}
        </View>

        {/* Add Members Button */}
        <View style={styles.addMembersSection}>
          <Pressable style={styles.addMembersButton} onPress={handleAddMembers}>
            <IconSymbol name="person.badge.plus" color={Colors.White} size={20} />
            <Text style={styles.addMembersText}>Invite Members</Text>
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
    color: Colors.Gray,
    marginTop: 12,
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
    marginBottom: 12,
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
    textTransform: 'capitalize',
  },
  noMembersText: {
    fontSize: 14,
    color: Colors.Gray,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
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
  teamInfo: {
    marginTop: 15,
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.Gray,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.Text,
  },
});
