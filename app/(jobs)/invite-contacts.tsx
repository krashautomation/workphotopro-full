import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { Colors } from '@/utils/colors';
import { IconSymbol } from '@/components/IconSymbol';

const inviteOptions = [
  { label: 'Contacts', icon: 'person.2.fill' },
  { label: 'WhatsApp', icon: 'message.circle.fill' },
  { label: 'Copy invite link', icon: 'link' },
  { label: 'Invite friends by…', icon: 'square.and.arrow.up' },
  { label: 'Messages', icon: 'ellipsis.message.fill' },
  { label: 'Threads', icon: 'number' },
];

export default function InviteContactsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Invite Contacts' }} />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
          <Text style={styles.heading}>Find Contacts</Text>
          <Text style={styles.body}>
            Search your contacts to find people you know who are already using the app.
          </Text>
          <Text style={styles.body}>
            You can add people as contacts and send invites to download the app. You don't have to add
            them to your team, but save them for future projects and add them at a future time.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Invite your friends</Text>
          {inviteOptions.map(option => (
            <Pressable key={option.label} style={styles.option}>
              <View style={styles.left}>
                <IconSymbol name={option.icon} color={Colors.Text} size={22} />
                <Text style={styles.optionLabel}>{option.label}</Text>
              </View>
              <IconSymbol name='chevron.right' color={Colors.Gray} size={16} />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Pressable style={styles.closeButton} onPress={() => router.back()}>
        <Text style={styles.closeText}>Close</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: Colors.Secondary,
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.Text,
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.Gray,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.Gray,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Gray + '20',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 16,
    color: Colors.Text,
    marginLeft: 12,
  },
  closeButton: {
    margin: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.Secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: Colors.Text,
    fontSize: 16,
    fontWeight: '600',
  },
});

