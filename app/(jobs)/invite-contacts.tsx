import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Platform, Share } from 'react-native';
import { Stack, router } from 'expo-router';
import * as Linking from 'expo-linking';
import { Colors } from '@/utils/colors';
import { IconSymbol } from '@/components/IconSymbol';
import { Users, MessageCircle, Copy, Share2, MessageSquare } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import InviteLinkModal from '@/components/InviteLinkModal';
import { generateInviteLink } from '@/utils/inviteLink';

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
  const { user } = useAuth();
  const [showInviteLinkModal, setShowInviteLinkModal] = React.useState(false);
  const [inviteLink, setInviteLink] = React.useState('');

  const handleCopyInviteLink = () => {
    if (!user) {
      // Handle case where user is not logged in
      return;
    }
    
    const link = generateInviteLink(user.$id);
    setInviteLink(link);
    setShowInviteLinkModal(true);
  };

  const handleShareInvite = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to share invites.');
      return;
    }

    const inviteLink = generateInviteLink(user.$id);
    const message = `Join me on WorkPhotoPro! ${inviteLink}`;

    try {
      // Use React Native's Share API (works with links/text)
      const result = await Share.share({
        message: message,
        url: inviteLink, // Some platforms use this
        title: 'Invite friends to WorkPhotoPro',
      });

      // result.action can be: Share.sharedAction, Share.dismissedAction, or Share.dismissedAction (iOS)
      if (result.action === Share.sharedAction) {
        // User shared successfully
        console.log('Shared successfully');
      }
    } catch (error: any) {
      console.error('Error sharing invite:', error);
      Alert.alert('Error', error.message || 'Failed to share invite. Please try again.');
    }
  };

  const handleWhatsAppShare = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to share invites.');
      return;
    }

    const inviteLink = generateInviteLink(user.$id);
    const message = `Join me on WorkPhotoPro! ${inviteLink}`;
    
    // WhatsApp URL format: whatsapp://send?text=MESSAGE
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    
    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert(
          'WhatsApp not installed',
          'Please install WhatsApp to share via WhatsApp, or use another sharing method.',
          [
            { text: 'Copy Link Instead', onPress: handleCopyInviteLink },
            { text: 'OK', style: 'cancel' },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error opening WhatsApp:', error);
      Alert.alert('Error', 'Failed to open WhatsApp. Please try again.');
    }
  };

  const handleMessagesShare = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to share invites.');
      return;
    }

    const inviteLink = generateInviteLink(user.$id);
    const message = `Join me on WorkPhotoPro! ${inviteLink}`;
    
    // SMS URL format: sms:?body=MESSAGE (iOS) or sms:?body=MESSAGE (Android)
    const smsUrl = Platform.select({
      ios: `sms:&body=${encodeURIComponent(message)}`,
      android: `sms:?body=${encodeURIComponent(message)}`,
      default: `sms:?body=${encodeURIComponent(message)}`,
    });
    
    try {
      const canOpen = await Linking.canOpenURL(smsUrl!);
      
      if (canOpen) {
        await Linking.openURL(smsUrl!);
      } else {
        Alert.alert(
          'Messages not available',
          'Unable to open Messages app. Please try another sharing method.',
          [
            { text: 'Copy Link Instead', onPress: handleCopyInviteLink },
            { text: 'OK', style: 'cancel' },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error opening Messages:', error);
      Alert.alert('Error', 'Failed to open Messages. Please try again.');
    }
  };

  const handleContactsPicker = () => {
    // Navigate to contacts screen where user can select contacts
    router.push('/(jobs)/contacts');
  };

  const handleOptionPress = (label: string) => {
    switch (label) {
      case 'Copy invite link':
        handleCopyInviteLink();
        break;
      case 'Contacts':
        handleContactsPicker();
        break;
      case 'WhatsApp':
        handleWhatsAppShare();
        break;
      case 'Invite friends by…':
        handleShareInvite();
        break;
      case 'Messages':
        handleMessagesShare();
        break;
      default:
        break;
    }
  };

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
              <Pressable 
                key={option.label} 
                style={styles.option}
                onPress={() => handleOptionPress(option.label)}
              >
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

      <InviteLinkModal
        visible={showInviteLinkModal}
        inviteLink={inviteLink}
        onClose={() => setShowInviteLinkModal(false)}
      />
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

