import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import * as Contacts from 'expo-contacts';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '@/utils/colors';
import Avatar from '@/components/Avatar';
import { IconSymbol } from '@/components/IconSymbol';
import ContactsPermissionModal from '@/components/ContactsPermissionModal';
import { contactService, ContactMatch } from '@/lib/appwrite/contacts';
import { useAuth } from '@/context/AuthContext';

const contacts = [
  {
    id: '1',
    name: 'Avery Johnson',
    role: 'Project Manager',
    status: 'Active',
  },
  {
    id: '2',
    name: 'Morgan Lee',
    role: 'Photographer',
    status: 'Invited',
  },
  {
    id: '3',
    name: 'Cameron Patel',
    role: 'Editor',
    status: 'Active',
  },
] as const;

const peopleYouMayKnow = [
  {
    id: 'p1',
    name: 'Jordan Smith',
    role: 'Designer',
  },
  {
    id: 'p2',
    name: 'Taylor Chen',
    role: 'Photographer',
  },
  {
    id: 'p3',
    name: 'Alex Rivera',
    role: 'Videographer',
  },
  {
    id: 'p4',
    name: 'Sam Williams',
    role: 'Editor',
  },
] as const;

const PERMISSION_STORAGE_KEY = 'contacts_permission_requested';
const PERMISSION_STATUS_KEY = 'contacts_permission_status';

export default function ContactsScreen() {
  const { user } = useAuth();
  const [showPermissionModal, setShowPermissionModal] = React.useState(false);
  const [isPermissionDenied, setIsPermissionDenied] = React.useState(false);
  const [permissionStatus, setPermissionStatus] = React.useState<Contacts.PermissionStatus | null>(null);
  const [isCheckingPermission, setIsCheckingPermission] = React.useState(true);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [syncStatus, setSyncStatus] = React.useState<{ contactsCount: number; matchesCount: number; lastSyncedAt: string | null } | null>(null);
  const [peopleYouMayKnow, setPeopleYouMayKnow] = React.useState<ContactMatch[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = React.useState(false);

  // Check permission status on mount
  React.useEffect(() => {
    checkPermissionStatus();
  }, []);

  // Load sync status and matches when permission is granted
  React.useEffect(() => {
    if (permissionStatus === Contacts.PermissionStatus.GRANTED && user) {
      loadSyncStatus();
      loadPeopleYouMayKnow();
    }
  }, [permissionStatus, user]);

  const checkPermissionStatus = async () => {
    try {
      setIsCheckingPermission(true);
      
      // Check if we've previously requested permission
      const previouslyRequested = await SecureStore.getItemAsync(PERMISSION_STORAGE_KEY);
      
      // Get current permission status
      const { status } = await Contacts.getPermissionsAsync();
      setPermissionStatus(status);

      // Show modal if:
      // 1. Permission hasn't been requested before, OR
      // 2. Permission was denied
      if (status === Contacts.PermissionStatus.UNDETERMINED) {
        // First time - show modal
        setShowPermissionModal(true);
        setIsPermissionDenied(false);
      } else if (status === Contacts.PermissionStatus.DENIED) {
        // Permission was denied - show modal with denied message
        setShowPermissionModal(true);
        setIsPermissionDenied(true);
      } else {
        // Permission granted - hide modal
        setShowPermissionModal(false);
        setIsPermissionDenied(false);
      }
    } catch (error) {
      console.error('Error checking contacts permission:', error);
      // On error, don't show modal
      setShowPermissionModal(false);
    } finally {
      setIsCheckingPermission(false);
    }
  };

  const handleAllowPermission = async () => {
    try {
      // Request permission
      const { status } = await Contacts.requestPermissionsAsync();
      
      // Store that we've requested permission
      await SecureStore.setItemAsync(PERMISSION_STORAGE_KEY, 'true');
      await SecureStore.setItemAsync(PERMISSION_STATUS_KEY, status);
      
      setPermissionStatus(status);
      
      if (status === Contacts.PermissionStatus.GRANTED) {
        setShowPermissionModal(false);
        setIsPermissionDenied(false);
        // Load sync status after permission granted
        if (user) {
          loadSyncStatus();
          loadPeopleYouMayKnow();
        }
      } else {
        // Permission denied
        setShowPermissionModal(true);
        setIsPermissionDenied(true);
      }
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      setShowPermissionModal(false);
    }
  };

  const handleDenyPermission = async () => {
    // Store that user denied permission
    await SecureStore.setItemAsync(PERMISSION_STORAGE_KEY, 'true');
    await SecureStore.setItemAsync(PERMISSION_STATUS_KEY, Contacts.PermissionStatus.DENIED);
    
    setShowPermissionModal(false);
    setIsPermissionDenied(false);
    setPermissionStatus(Contacts.PermissionStatus.DENIED);
  };

  const loadSyncStatus = async () => {
    if (!user) return;
    
    try {
      const syncRecord = await contactService.getSyncRecord(user.$id);
      if (syncRecord) {
        setSyncStatus({
          contactsCount: syncRecord.contactsCount || 0,
          matchesCount: syncRecord.matchesCount || 0,
          lastSyncedAt: syncRecord.lastSyncedAt || null,
        });
      }
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  };

  const loadPeopleYouMayKnow = async () => {
    if (!user) return;
    
    setIsLoadingMatches(true);
    try {
      const matches = await contactService.getPeopleYouMayKnow(user.$id);
      setPeopleYouMayKnow(matches);
    } catch (error) {
      console.error('Error loading people you may know:', error);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const handleSyncContacts = async () => {
    if (!user || permissionStatus !== Contacts.PermissionStatus.GRANTED) {
      Alert.alert('Permission Required', 'Please grant contacts permission first.');
      return;
    }

    setIsSyncing(true);
    try {
      // Get contacts from device
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
      });

      if (data.length === 0) {
        Alert.alert('No Contacts', 'No contacts found on your device.');
        setIsSyncing(false);
        return;
      }

      // Filter and format contacts for syncing (only include contacts with phone or email)
      const contactsToSync = data
        .filter(contact => 
          (contact.phoneNumbers && contact.phoneNumbers.length > 0 && contact.phoneNumbers[0].number) ||
          (contact.emails && contact.emails.length > 0 && contact.emails[0].email)
        )
        .map(contact => ({
          phoneNumbers: contact.phoneNumbers?.filter(p => p.number).map(p => ({ number: p.number! })),
          emails: contact.emails?.filter(e => e.email).map(e => ({ email: e.email! })),
        }));

      if (contactsToSync.length === 0) {
        Alert.alert('No Valid Contacts', 'No contacts with phone numbers or emails found.');
        setIsSyncing(false);
        return;
      }

      // Sync contacts (hash and store)
      const result = await contactService.syncUserContacts(user.$id, contactsToSync);
      
      // Find matches
      await contactService.findMatches(user.$id);

      // Reload sync status and matches
      await loadSyncStatus();
      await loadPeopleYouMayKnow();

      Alert.alert(
        'Sync Complete',
        `Synced ${result.synced} contacts${result.errors > 0 ? ` (${result.errors} errors)` : ''}.`
      );
    } catch (error: any) {
      console.error('Error syncing contacts:', error);
      Alert.alert('Sync Failed', error.message || 'Failed to sync contacts. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Your Contacts' }} />

      <Pressable style={styles.inviteBanner} onPress={() => router.push('/(jobs)/invite-contacts')}>
        <View>
          <Text style={styles.bannerTitle}>Invite your contacts</Text>
          <Text style={styles.bannerSubtitle}>Add new collaborators anytime</Text>
        </View>
        <IconSymbol name="chevron.right" color={Colors.Gray} size={18} />
      </Pressable>

      {permissionStatus === Contacts.PermissionStatus.GRANTED && (
        <Pressable 
          style={[styles.syncBanner, isSyncing && styles.syncBannerDisabled]} 
          onPress={handleSyncContacts}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <View style={styles.syncContent}>
              <ActivityIndicator size="small" color={Colors.Primary} />
              <Text style={styles.syncBannerText}>Syncing contacts...</Text>
            </View>
          ) : (
            <View style={styles.syncContent}>
              <IconSymbol name="arrow.clockwise" color={Colors.Primary} size={18} />
              <View style={styles.syncTextContainer}>
                <Text style={styles.syncBannerText}>Sync contacts</Text>
                {syncStatus && (
                  <Text style={styles.syncBannerSubtext}>
                    {syncStatus.contactsCount} contacts • {syncStatus.matchesCount} matches
                    {syncStatus.lastSyncedAt && ` • Last synced ${formatLastSynced(syncStatus.lastSyncedAt)}`}
                  </Text>
                )}
              </View>
            </View>
          )}
        </Pressable>
      )}

      <Text style={styles.contactListHeading}>Contact list</Text>

      <FlatList
        data={contacts}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.contactRow}>
            <Avatar name={item.name} size={48} />
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{item.name}</Text>
              <Text style={styles.contactRole}>{item.role}</Text>
            </View>
            <Text
              style={[
                styles.status,
                item.status === 'Invited' ? styles.statusInvited : styles.statusActive,
              ]}
            >
              {item.status}
            </Text>
          </View>
        )}
        ListFooterComponent={
          <>
            {permissionStatus === Contacts.PermissionStatus.GRANTED ? (
              <Text style={styles.placeholderNote}>
                Real contacts will appear here once synced.
              </Text>
            ) : (
              <Text style={styles.placeholderNote}>
                This is placeholder data. Real contacts will appear here once synced.
              </Text>
            )}
            
            <View style={styles.peopleYouMayKnowSection}>
              <Text style={styles.sectionTitle}>People You May Know</Text>
              {isLoadingMatches ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={Colors.Gray} />
                  <Text style={styles.loadingText}>Loading matches...</Text>
                </View>
              ) : peopleYouMayKnow.length > 0 ? (
                peopleYouMayKnow.map((match) => (
                  <View key={match.$id} style={styles.contactRow}>
                    <Avatar name={match.matchedUserId} size={48} />
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>User {match.matchedUserId.slice(0, 8)}</Text>
                      <Text style={styles.contactRole}>Matched via {match.matchType}</Text>
                    </View>
                    <Pressable style={styles.inviteButton}>
                      <Text style={styles.inviteButtonText}>Invite</Text>
                    </Pressable>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyStateText}>
                  {syncStatus && syncStatus.contactsCount > 0
                    ? 'No matches found yet. More matches will appear as users join.'
                    : 'Sync your contacts to find people you may know.'}
                </Text>
              )}
            </View>
          </>
        }
      />

      <ContactsPermissionModal
        visible={showPermissionModal}
        onAllow={handleAllowPermission}
        onDeny={handleDenyPermission}
        isDenied={isPermissionDenied}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
  },
  inviteBanner: {
    margin: 20,
    padding: 16,
    backgroundColor: Colors.Secondary,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.Text,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: Colors.Gray,
    marginTop: 4,
  },
  contactListHeading: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.Text,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.Secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.Text,
  },
  contactRole: {
    fontSize: 14,
    color: Colors.Gray,
    marginTop: 2,
  },
  status: {
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  statusActive: {
    backgroundColor: '#22C55E30',
    color: '#15803d',
  },
  statusInvited: {
    backgroundColor: '#fbbf2430',
    color: '#b45309',
  },
  placeholderNote: {
    textAlign: 'center',
    color: Colors.Gray,
    fontSize: 13,
    marginTop: 8,
    marginBottom: 32,
  },
  peopleYouMayKnowSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.Secondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.Text,
    marginBottom: 16,
  },
  inviteButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.Primary,
    borderRadius: 8,
  },
  inviteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  syncBanner: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    padding: 16,
    backgroundColor: Colors.Secondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.Primary + '30',
  },
  syncBannerDisabled: {
    opacity: 0.6,
  },
  syncContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  syncTextContainer: {
    flex: 1,
  },
  syncBannerText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.Text,
  },
  syncBannerSubtext: {
    fontSize: 12,
    color: Colors.Gray,
    marginTop: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.Gray,
  },
  emptyStateText: {
    textAlign: 'center',
    color: Colors.Gray,
    fontSize: 14,
    paddingVertical: 20,
    fontStyle: 'italic',
  },
});

// Helper function to format last synced time
function formatLastSynced(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}


