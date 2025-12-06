import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { IconSymbol } from '@/components/IconSymbol';
import Avatar from '@/components/Avatar';
import { Switch } from 'react-native';
import { useOrganization } from '@/context/OrganizationContext';
import { useAuth } from '@/context/AuthContext';
import { teamService } from '@/lib/appwrite/teams';

export default function ManageMemberScreen() {
  const { memberId, memberName, teamId } = useLocalSearchParams<{ 
    memberId: string; 
    memberName?: string;
    teamId: string;
  }>();
  const { currentTeam } = useOrganization();
  const { user } = useAuth();
  const [sendJobReports, setSendJobReports] = useState(false);
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<any>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('member');
  const [updatingRole, setUpdatingRole] = useState(false);
  const [savingPermission, setSavingPermission] = useState(false);
  
  // Get the actual teamId (prefer param, fallback to currentTeam)
  const actualTeamId = teamId || currentTeam?.$id || '';
  
  // Get member role helper (defined early so useEffects can use it)
  const getMemberRole = (): string => {
    if (member?.membershipData?.role) {
      return member.membershipData.role;
    }
    if (member?.roles && member.roles.length > 0) {
      return member.roles[0];
    }
    return 'member';
  };

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
        // Load the permission value from membership data
        if (foundMember.membershipData?.canShareJobReports !== undefined) {
          setSendJobReports(foundMember.membershipData.canShareJobReports);
        } else {
          setSendJobReports(false); // Default to false if not set
        }
      } else {
        // If not found, create a basic member object from params
        setMember({
          userId: memberId,
          userName: memberName || 'Member',
          userEmail: '',
          roles: [],
          membershipData: null
        });
        setSendJobReports(false);
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
      setSendJobReports(false);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUserRole = async () => {
    if (!actualTeamId || !user?.$id) {
      setCurrentUserRole(null);
      return;
    }

    try {
      const memberships = await teamService.listMemberships(actualTeamId);
      const currentUserMembership = memberships.memberships.find((m: any) => m.userId === user.$id);
      
      if (currentUserMembership) {
        const role = currentUserMembership.membershipData?.role || currentUserMembership.roles?.[0] || 'member';
        setCurrentUserRole(role.toLowerCase());
      } else {
        setCurrentUserRole(null);
      }
    } catch (error) {
      console.error('Error loading current user role:', error);
      setCurrentUserRole(null);
    }
  };

  useEffect(() => {
    loadMemberData();
  }, [memberId, actualTeamId]);

  useEffect(() => {
    loadCurrentUserRole();
  }, [actualTeamId, user]);

  useEffect(() => {
    // Update selectedRole when member data loads
    if (member) {
      const role = getMemberRole();
      setSelectedRole(role);
      // Update permission value when member data loads
      if (member.membershipData?.canShareJobReports !== undefined) {
        setSendJobReports(member.membershipData.canShareJobReports);
      }
    }
  }, [member]);

  // Handle toggle for job reports permission
  const handleToggleJobReports = async (value: boolean) => {
    if (!member || !actualTeamId || !member.$id) {
      Alert.alert('Error', 'Cannot update permission. Member information is missing.');
      return;
    }

    // Don't allow changing permission for owners (they always have permission)
    if (isOwner()) {
      Alert.alert('Info', 'Owners always have permission to share job reports.');
      return;
    }

    try {
      setSavingPermission(true);
      await teamService.updateMembershipJobReportsPermission(
        actualTeamId,
        member.$id,
        value
      );
      
      setSendJobReports(value);
      
      // Reload member data to ensure sync
      await loadMemberData();
      
      // Show success message (optional, can be removed if too noisy)
      // Alert.alert('Success', `Permission ${value ? 'granted' : 'revoked'}`);
    } catch (error: any) {
      console.error('Error updating permission:', error);
      Alert.alert('Error', error.message || 'Failed to update permission. Please try again.');
      // Revert toggle on error
      setSendJobReports(!value);
    } finally {
      setSavingPermission(false);
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

  // Check if member is owner
  const isOwner = (): boolean => {
    const role = getMemberRole().toLowerCase();
    return role === 'owner' || role === 'owners';
  };

  const handleRemoveMember = () => {
    // Prevent removing owners
    if (isOwner()) {
      Alert.alert(
        'Cannot Remove Owner',
        'The owner cannot be removed from the team. You must transfer ownership first.',
        [{ text: 'OK' }]
      );
      return;
    }

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
              // Double-check role before deletion
              if (isOwner()) {
                Alert.alert('Error', 'Cannot remove the owner from the team.');
                return;
              }

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

  // Check if current user is owner
  const isCurrentUserOwner = (): boolean => {
    if (!currentUserRole) return false;
    return currentUserRole === 'owner' || currentUserRole === 'owners';
  };

  // Handle role change
  const handleRoleChange = async (newRole: string) => {
    if (!member || !actualTeamId || !member.$id) {
      Alert.alert('Error', 'Cannot change role. Member information is missing.');
      return;
    }

    // Prevent changing owner role
    if (isOwner()) {
      Alert.alert('Error', 'Cannot change the owner role.');
      return;
    }

    // Only allow Member or Owner roles
    if (newRole !== 'member' && newRole !== 'owner') {
      Alert.alert('Error', 'Invalid role. Only Owner or Member roles are allowed.');
      return;
    }

    try {
      setUpdatingRole(true);
      await teamService.updateMembershipRoles(actualTeamId, member.$id, [newRole]);
      
      // Reload member data to reflect the change
      await loadMemberData();
      setSelectedRole(newRole);
      
      Alert.alert('Success', `Role updated to ${newRole.charAt(0).toUpperCase() + newRole.slice(1)}`);
    } catch (error: any) {
      console.error('Error updating role:', error);
      Alert.alert('Error', error.message || 'Failed to update role. Please try again.');
    } finally {
      setUpdatingRole(false);
    }
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

        {/* Permissions Section - Only show if current user is owner */}
        {isCurrentUserOwner() && (
          <View style={styles.permissionsSection}>
            <Text style={styles.permissionsTitle}>PERMISSIONS</Text>
            
            <View style={styles.permissionItem}>
              <Text style={styles.permissionLabel}>Allow member to share job reports</Text>
              <Switch
                value={sendJobReports}
                onValueChange={handleToggleJobReports}
                trackColor={{ false: Colors.Gray, true: Colors.Primary }}
                thumbColor={sendJobReports ? Colors.White : Colors.White}
                disabled={savingPermission || isOwner()}
              />
            </View>
            {savingPermission && (
              <View style={styles.updatingIndicator}>
                <ActivityIndicator size="small" color={Colors.Primary} />
                <Text style={styles.updatingText}>Updating permission...</Text>
              </View>
            )}
            {isOwner() && (
              <Text style={styles.ownerPermissionNote}>
                Owners always have permission to share job reports.
              </Text>
            )}
          </View>
        )}

        {/* Role Change Section - Only show if current user is owner and member is not owner */}
        {isCurrentUserOwner() && !isOwner() && (
          <View style={styles.roleSection}>
            <Text style={styles.roleSectionTitle}>ROLE</Text>
            <View style={styles.roleSelector}>
              <Pressable
                style={[
                  styles.roleOption,
                  selectedRole === 'member' && styles.roleOptionSelected
                ]}
                onPress={() => handleRoleChange('member')}
                disabled={updatingRole}
              >
                <Text style={[
                  styles.roleOptionText,
                  selectedRole === 'member' && styles.roleOptionTextSelected
                ]}>
                  Member
                </Text>
                {selectedRole === 'member' && (
                  <IconSymbol name="checkmark.circle.fill" color={Colors.Primary} size={20} />
                )}
              </Pressable>
              <Pressable
                style={[
                  styles.roleOption,
                  selectedRole === 'owner' && styles.roleOptionSelected
                ]}
                onPress={() => handleRoleChange('owner')}
                disabled={updatingRole}
              >
                <Text style={[
                  styles.roleOptionText,
                  selectedRole === 'owner' && styles.roleOptionTextSelected
                ]}>
                  Owner
                </Text>
                {selectedRole === 'owner' && (
                  <IconSymbol name="checkmark.circle.fill" color={Colors.Primary} size={20} />
                )}
              </Pressable>
            </View>
            {updatingRole && (
              <View style={styles.updatingIndicator}>
                <ActivityIndicator size="small" color={Colors.Primary} />
                <Text style={styles.updatingText}>Updating role...</Text>
              </View>
            )}
          </View>
        )}

        {/* Remove Button - Only show for non-owners */}
        {!isOwner() && (
          <View style={styles.removeSection}>
            <Pressable style={styles.removeButton} onPress={handleRemoveMember}>
              <Text style={styles.removeButtonText}>Remove</Text>
            </Pressable>
          </View>
        )}
        
        {/* Owner Info Message */}
        {isOwner() && (
          <View style={styles.ownerInfoSection}>
            <Text style={styles.ownerInfoText}>
              The owner cannot be removed from the team.
            </Text>
          </View>
        )}
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
  ownerInfoSection: {
    marginTop: 'auto',
    paddingBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.Secondary,
    borderRadius: 12,
    alignItems: 'center',
  },
  ownerInfoText: {
    fontSize: 14,
    color: Colors.Gray,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  roleSection: {
    marginBottom: 40,
  },
  roleSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.Text,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  roleSelector: {
    gap: 12,
  },
  roleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.Secondary,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleOptionSelected: {
    borderColor: Colors.Primary,
    backgroundColor: Colors.Secondary,
  },
  roleOptionText: {
    fontSize: 16,
    color: Colors.Text,
    fontWeight: '500',
  },
  roleOptionTextSelected: {
    color: Colors.Primary,
    fontWeight: '600',
  },
  updatingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  updatingText: {
    fontSize: 14,
    color: Colors.Gray,
  },
  ownerPermissionNote: {
    fontSize: 12,
    color: Colors.Gray,
    fontStyle: 'italic',
    marginTop: 8,
    paddingHorizontal: 16,
  },
});
