import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import * as Contacts from 'expo-contacts';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '@/utils/colors';
import Avatar from '@/components/Avatar';
import { IconSymbol } from '@/components/IconSymbol';
import ContactsPermissionModal from '@/components/ContactsPermissionModal';

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
  const [showPermissionModal, setShowPermissionModal] = React.useState(false);
  const [isPermissionDenied, setIsPermissionDenied] = React.useState(false);
  const [permissionStatus, setPermissionStatus] = React.useState<Contacts.PermissionStatus | null>(null);
  const [isCheckingPermission, setIsCheckingPermission] = React.useState(true);

  // Check permission status on mount
  React.useEffect(() => {
    checkPermissionStatus();
  }, []);

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
        // TODO: Load contacts here
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
              {peopleYouMayKnow.map((person) => (
                <View key={person.id} style={styles.contactRow}>
                  <Avatar name={person.name} size={48} />
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{person.name}</Text>
                    <Text style={styles.contactRole}>{person.role}</Text>
                  </View>
                  <Pressable style={styles.inviteButton}>
                    <Text style={styles.inviteButtonText}>Invite</Text>
                  </Pressable>
                </View>
              ))}
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
});


