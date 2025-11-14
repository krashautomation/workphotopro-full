import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { Colors } from '@/utils/colors';
import { IconSymbol } from '@/components/IconSymbol';
import { Users, MessageCircle, Copy, Share2, MessageSquare } from 'lucide-react-native';

const introBullets = [
  'Add people as contacts and send invites.',
  'Add them to teams at a future time.',
  'View their profile and see their stats.',
] as const;

const inviteOptions = [
  { label: 'Contacts', Icon: Users },
  { label: 'WhatsApp', Icon: MessageCircle },
  { label: 'Copy invite link', Icon: Copy },
  { label: 'Invite friends by…', Icon: Share2 },
  { label: 'Messages', Icon: MessageSquare },
] as const;

export default function InviteContactsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Invite Contacts' }} />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
          <Text style={styles.heading}>Find Contacts</Text>
          <Text style={styles.body}>
            Search your contacts to find people you know. You can:
          </Text>
          <View style={styles.bulletList}>
            {introBullets.map(point => (
              <View key={point} style={styles.bulletItem}>
                <Text style={styles.bulletDot}>{'\u2022'}</Text>
                <Text style={styles.bulletText}>{point}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Invite your friends</Text>
          {inviteOptions.map(option => {
            const OptionIcon = option.Icon;
            return (
              <Pressable key={option.label} style={styles.option}>
                <View style={styles.left}>
                  <OptionIcon color={Colors.Text} size={22} strokeWidth={1.7} />
                  <Text style={styles.optionLabel}>{option.label}</Text>
                </View>
                <IconSymbol name='chevron.right' color={Colors.Gray} size={16} />
              </Pressable>
            );
          })}
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
  bulletList: {
    marginBottom: 12,
    gap: 6,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bulletDot: {
    fontSize: 16,
    lineHeight: 22,
    color: Colors.Text,
    marginRight: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.Gray,
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
});

