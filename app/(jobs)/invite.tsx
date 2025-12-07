import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Share, ActivityIndicator, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { IconSymbol } from '@/components/IconSymbol';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { teamService } from '@/lib/appwrite/teams';
import { generateInviteLink } from '@/utils/inviteLink';

export default function InviteScreen() {
  const { user } = useAuth();
  const { currentTeam, currentOrganization } = useOrganization();
  
  const [inviteLink, setInviteLink] = useState<string>('');
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeamData();
  }, [currentTeam]);

  const loadTeamData = async () => {
    if (!currentTeam?.$id || !user?.$id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Generate invite link via web API
      // This will create a base62-encoded short link and store it in the Invites collection
      // Returns: https://web.workphotopro.com/links/{base62Code}
      try {
        const shortLink = await generateInviteLink(currentTeam.$id, user.$id);
        setInviteLink(shortLink);
      } catch (inviteError) {
        console.error('Error generating invite link:', inviteError);
        // Fallback to direct link if API fails
        const fallbackLink = `https://web.workphotopro.com/invite/${currentTeam.$id}`;
        setInviteLink(fallbackLink);
        Alert.alert(
          'Warning',
          'Could not generate short invite link. Using direct link instead.'
        );
      }

      // Fetch member count - wrap in try/catch to handle Appwrite errors gracefully
      try {
        const memberships = await teamService.listMemberships(currentTeam.$id);
        setMemberCount(memberships.memberships.length);
      } catch (membershipError) {
        console.warn('Could not fetch memberships, using default count:', membershipError);
        // If we can't fetch memberships, default to 1 (just the owner)
        setMemberCount(1);
      }

    } catch (error) {
      console.error('Error loading team data:', error);
      Alert.alert('Error', 'Failed to load team information');
    } finally {
      setLoading(false);
    }
  };

  const handleShareLink = async () => {
    if (!inviteLink) {
      Alert.alert('Error', 'Invite link not available');
      return;
    }

    try {
      await Share.share({
        message: `Join my team "${currentTeam?.name || 'team'}" on WorkPhotoPro: ${inviteLink}`,
        url: inviteLink,
        title: `Join ${currentTeam?.name || 'team'} on WorkPhotoPro`,
      });
    } catch (error) {
      console.error('Error sharing link:', error);
      Alert.alert('Error', 'Failed to share link');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{ 
            title: 'Invite to Team',
            headerBackTitle: '',
            headerBackVisible: true,
          }} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.Primary} />
          <Text style={styles.loadingText}>Loading team information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentTeam) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{ 
            title: 'Invite to Team',
            headerBackTitle: '',
            headerBackVisible: true,
          }} 
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No team selected</Text>
          <Text style={styles.emptySubtext}>Please select a team first</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Invite to Team',
          headerBackTitle: '',
          headerBackVisible: true,
        }} 
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Team Information Section */}
        <View style={styles.teamInfoSection}>
          <View style={styles.teamIconContainer}>
            <View style={styles.teamIcon}>
              <View style={styles.teamIconGrid}>
                {Array.from({ length: 8 }).map((_, index) => (
                  <View key={index} style={styles.teamIconDot} />
                ))}
              </View>
              <Text style={styles.teamIconText}>Team</Text>
            </View>
          </View>
          
          <View style={styles.teamDetails}>
            <Text style={styles.teamName}>{currentTeam.name}</Text>
            <View style={styles.capacityBar}>
              <Text style={styles.capacityText}>
                Team members: <Text style={styles.capacityNumbers}>{memberCount}</Text>
              </Text>
            </View>
            {currentOrganization && (
              <Text style={styles.orgName}>{currentOrganization.orgName}</Text>
            )}
          </View>
        </View>

        {/* Invitation Link and QR Code Section */}
        <View style={styles.inviteSection}>
          <Text style={styles.inviteLink}>{inviteLink}</Text>
          
          <View style={styles.qrCodeContainer}>
            <QRCode
              value={inviteLink}
              size={200}
              color={Colors.Black}
              backgroundColor={Colors.White}
            />
          </View>
          
          <Text style={styles.qrInstructions}>
            Scan the QR code to join the team
          </Text>
          
          <Text style={styles.noteText}>
            📱 For now, copy this link and paste it into a text message or email. The person will need to open the link while using Expo Go to join your team.
          </Text>
          <Text style={[styles.noteText, { marginTop: 8, fontSize: 12, opacity: 0.7 }]}>
            Note: Deep links require the app to be installed. For production, we'll use HTTPS links that work in any browser.
          </Text>
        </View>

        {/* Share Link Option */}
        <View style={styles.shareSection}>
          <Text style={styles.orText}>or</Text>
          
          <Pressable style={styles.shareButton} onPress={handleShareLink}>
            <IconSymbol name="paperplane" color={Colors.White} size={20} />
            <Text style={styles.shareButtonText}>Share link</Text>
          </Pressable>
        </View>

        {/* Permissions Information */}
        <View style={styles.permissionsSection}>
          <Text style={styles.permissionsText}>
            New members will be able to view, create and update jobs in this workspace. Only owners can delete jobs or manage team members.
          </Text>
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
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.Gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.Text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.Gray,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  teamInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  teamIconContainer: {
    marginRight: 16,
  },
  teamIcon: {
    width: 60,
    height: 60,
    backgroundColor: Colors.Primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamIconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 24,
    height: 16,
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  teamIconDot: {
    width: 4,
    height: 4,
    backgroundColor: Colors.White,
    borderRadius: 2,
  },
  teamIconText: {
    color: Colors.White,
    fontSize: 10,
    fontWeight: '500',
  },
  teamDetails: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.Text,
    marginBottom: 8,
  },
  orgName: {
    fontSize: 14,
    color: Colors.Gray,
    marginTop: 4,
  },
  capacityBar: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  capacityText: {
    fontSize: 14,
    color: Colors.Black,
  },
  capacityNumbers: {
    fontWeight: 'bold',
    color: '#1976D2',
  },
  inviteSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  inviteLink: {
    fontSize: 14,
    color: Colors.Text,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  qrCodeContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: Colors.White,
    borderRadius: 12,
    shadowColor: Colors.Black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrInstructions: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.Text,
    textAlign: 'center',
    marginBottom: 12,
  },
  noteText: {
    fontSize: 14,
    color: Colors.Gray,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  shareSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  orText: {
    fontSize: 16,
    color: Colors.Gray,
    marginBottom: 16,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.Primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 160,
  },
  shareButtonText: {
    color: Colors.White,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  permissionsSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  permissionsText: {
    fontSize: 13,
    color: Colors.Gray,
    textAlign: 'center',
    lineHeight: 18,
  },
});
