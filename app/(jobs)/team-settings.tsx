import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { globalStyles, colors } from '@/styles/globalStyles';
import { useRouter, useFocusEffect } from 'expo-router';
import { Text, View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useCallback } from 'react';

import { IconSymbol } from '@/components/IconSymbol';

export default function EditTeam() {
  const { user, isAuthenticated } = useAuth();
  const { currentTeam, refreshCurrentTeam } = useOrganization();
  const router = useRouter();
  
  // Refresh team data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (currentTeam) {
        refreshCurrentTeam();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  // Show sign in prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <View style={globalStyles.centeredContainer}>
        <Text style={globalStyles.body}>Please sign in to view team settings</Text>
      </View>
    );
  }

  // Show message if no team is selected
  if (!currentTeam) {
    return (
      <View style={globalStyles.centeredContainer}>
        <Text style={globalStyles.body}>No team selected</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Check if user is owner - only owners can access team settings
  const membershipRole = (currentTeam as any)?.membershipRole || 'member';
  const isOwner = membershipRole?.toLowerCase() === 'owner';
  
  // Debug logging
  console.log('🔍 team-settings.tsx - Checking permissions:', {
    teamId: currentTeam?.$id,
    teamName: currentTeam?.name,
    membershipRole: membershipRole,
    isOwner: isOwner,
    currentTeamKeys: Object.keys(currentTeam || {}),
    hasMembershipRole: 'membershipRole' in (currentTeam as any || {})
  });
  
  if (!isOwner) {
    return (
      <View style={globalStyles.centeredContainer}>
        <Text style={globalStyles.body}>You don't have permission to access team settings</Text>
        <Text style={[globalStyles.body, { marginTop: 8, color: colors.textSecondary }]}>
          Only team owners can manage team settings.
        </Text>
        <Text style={[globalStyles.body, { marginTop: 8, color: colors.textSecondary, fontSize: 12 }]}>
          Your role: {membershipRole || 'unknown'}
        </Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const teamName = currentTeam.name || 'Unnamed Team';
  const teamDescription = currentTeam.teamData?.description || 'No description';
  const teamEmail = currentTeam.teamData?.email || 'No email';
  const teamPhone = currentTeam.teamData?.phone || 'No phone number';
  const teamWebsite = currentTeam.teamData?.website || 'No website';
  const teamAddress = currentTeam.teamData?.address || 'No address';
  const teamPhotoUrl = currentTeam.teamData?.teamPhotoUrl;

  const handleEditTeam = () => {
    router.push('/(jobs)/edit-team');
  };

  const handleDeleteTeam = () => {
    if (!currentTeam) return;
    
    const teamName = currentTeam.name || 'Team';
    
    router.push({
      pathname: '/(jobs)/delete-team',
      params: { teamId: currentTeam.$id, teamName },
    });
  };

  const handleTrashedJobs = () => {
    router.push('/(jobs)/trashed-jobs');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol
            name="chevron.left"
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Team Details Section */}
      <View style={styles.teamDetailsSection}>
        {/* Team Image */}
        <View style={styles.teamImageContainer}>
          {teamPhotoUrl ? (
            <Image 
              source={{ uri: teamPhotoUrl }} 
              style={styles.teamPhoto}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <IconSymbol
              name="photo"
              size={48}
              color={colors.textSecondary}
            />
          )}
        </View>
        
        {/* Team Name */}
        <Text style={styles.teamName}>{teamName}</Text>

        {/* Team Email */}
        <Text style={styles.teamEmail}>{teamEmail}</Text>

        {/* Contact Information */}
        <View style={styles.contactInfo}>
          <View style={styles.contactItem}>
            <IconSymbol
              name="phone"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.contactText}>{teamPhone}</Text>
          </View>
          
          <View style={styles.contactItem}>
            <IconSymbol
              name="link"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.contactText}>{teamWebsite}</Text>
          </View>
          
          <View style={styles.contactItem}>
            <IconSymbol
              name="location"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.contactText}>{teamAddress}</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description}>{teamDescription}</Text>
      </View>

      {/* Settings Section */}
      <View style={styles.settingsSection}>
        {/* Edit Team */}
        <TouchableOpacity style={styles.settingItem} onPress={handleEditTeam}>
          <View style={styles.settingLeft}>
            <IconSymbol
              name="pencil"
              size={20}
              color={colors.textSecondary}
            />
            <Text style={styles.settingText}>Edit Team</Text>
          </View>
          <IconSymbol
            name="chevron.right"
            size={16}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Delete Team */}
        <TouchableOpacity style={styles.settingItem} onPress={handleDeleteTeam}>
          <View style={styles.settingLeft}>
            <IconSymbol
              name="trash"
              size={20}
              color={colors.textSecondary}
            />
            <Text style={styles.settingText}>Delete Team</Text>
          </View>
          <IconSymbol
            name="chevron.right"
            size={16}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Trashed Jobs */}
        <TouchableOpacity style={styles.settingItem} onPress={handleTrashedJobs}>
          <View style={styles.settingLeft}>
            <IconSymbol
              name="trash"
              size={20}
              color={colors.textSecondary}
            />
            <Text style={styles.settingText}>Trashed Jobs</Text>
          </View>
          <IconSymbol
            name="chevron.right"
            size={16}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSpacer: {
    width: 36,
  },
  teamDetailsSection: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  teamImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  teamPhoto: {
    width: '100%',
    height: '100%',
  },
  teamName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  teamEmail: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  contactInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  settingsSection: {
    padding: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    color: colors.text,
  },
});
