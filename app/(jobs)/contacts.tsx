import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import { Colors } from '@/utils/colors';
import Avatar from '@/components/Avatar';
import { IconSymbol } from '@/components/IconSymbol';

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

export default function ContactsScreen() {
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
          <Text style={styles.placeholderNote}>
            This is placeholder data. Real contacts will appear here once synced.
          </Text>
        }
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
  },
});


