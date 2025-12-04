import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  Share,
  Alert,
  Linking,
} from 'react-native';
import { Colors } from '@/utils/colors';
import { IconSymbol } from '@/components/IconSymbol';
import BottomModal2 from '@/components/BottomModal2';
import * as Clipboard from 'expo-clipboard';
import { MessageCircle, MessageSquare, Share2 } from 'lucide-react-native';

type ShareReportModalProps = {
  visible: boolean;
  reportUrl: string;
  shareMessage: string;
  onClose: () => void;
};

const ShareReportModal: React.FC<ShareReportModalProps> = ({
  visible,
  reportUrl,
  shareMessage,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);

  const handleCopy = async () => {
    if (!shareMessage) return;

    setCopying(true);
    try {
      await Clipboard.setStringAsync(shareMessage);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy to clipboard');
    } finally {
      setCopying(false);
    }
  };

  const handleShare = async () => {
    if (!shareMessage) return;

    try {
      const result = await Share.share({
        message: shareMessage,
        url: reportUrl,
        title: 'Job Report',
      });

      if (result.action === Share.sharedAction) {
        console.log('Shared successfully');
      }
    } catch (error: any) {
      console.error('Error sharing:', error);
      Alert.alert('Error', error.message || 'Failed to share. Please try again.');
    }
  };

  const handleWhatsAppShare = async () => {
    if (!shareMessage) return;

    const whatsappUrl = Platform.select({
      ios: `whatsapp://send?text=${encodeURIComponent(shareMessage)}`,
      android: `whatsapp://send?text=${encodeURIComponent(shareMessage)}`,
      default: `https://wa.me/?text=${encodeURIComponent(shareMessage)}`,
    });

    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl!);
      if (canOpen) {
        await Linking.openURL(whatsappUrl!);
      } else {
        Alert.alert(
          'WhatsApp not available',
          'Unable to open WhatsApp. Please try another sharing method.',
          [
            { text: 'Copy Link Instead', onPress: handleCopy },
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
    if (!shareMessage) return;

    const smsUrl = Platform.select({
      ios: `sms:&body=${encodeURIComponent(shareMessage)}`,
      android: `sms:?body=${encodeURIComponent(shareMessage)}`,
      default: `sms:?body=${encodeURIComponent(shareMessage)}`,
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
            { text: 'Copy Link Instead', onPress: handleCopy },
            { text: 'OK', style: 'cancel' },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error opening Messages:', error);
      Alert.alert('Error', 'Failed to open Messages. Please try again.');
    }
  };

  return (
    <BottomModal2
      visible={visible}
      onClose={onClose}
      contentStyle={{ backgroundColor: Colors.Secondary }}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Share Report</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <IconSymbol name="xmark" color={Colors.Gray} size={20} />
          </Pressable>
        </View>

        <View style={styles.messageContainer}>
          <Text style={styles.messageText} selectable>
            {shareMessage}
          </Text>
        </View>

        <Pressable
          style={[styles.copyButton, copied && styles.copyButtonCopied]}
          onPress={handleCopy}
          disabled={copying || copied}
        >
          {copying ? (
            <ActivityIndicator size="small" color={Colors.White} />
          ) : copied ? (
            <>
              <IconSymbol name="checkmark" color={Colors.White} size={18} />
              <Text style={styles.copyButtonText}>Copied!</Text>
            </>
          ) : (
            <>
              <IconSymbol name="doc.on.doc" color={Colors.White} size={18} />
              <Text style={styles.copyButtonText}>Copy Message</Text>
            </>
          )}
        </Pressable>

        <View style={styles.shareOptionsContainer}>
          <Text style={styles.shareOptionsTitle}>Share via</Text>
          <View style={styles.shareOptionsGrid}>
            <Pressable style={styles.shareOption} onPress={handleShare}>
              <Share2 size={24} color={Colors.Primary} />
              <Text style={styles.shareOptionText}>Share</Text>
            </Pressable>
            <Pressable style={styles.shareOption} onPress={handleWhatsAppShare}>
              <MessageCircle size={24} color={Colors.Primary} />
              <Text style={styles.shareOptionText}>WhatsApp</Text>
            </Pressable>
            <Pressable style={styles.shareOption} onPress={handleMessagesShare}>
              <MessageSquare size={24} color={Colors.Primary} />
              <Text style={styles.shareOptionText}>Messages</Text>
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.closeTextButton} onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </View>
    </BottomModal2>
  );
};

export default ShareReportModal;

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.Text,
  },
  closeButton: {
    padding: 4,
  },
  messageContainer: {
    backgroundColor: Colors.Background,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.Gray + '30',
  },
  messageText: {
    fontSize: 14,
    color: Colors.Text,
    lineHeight: 20,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.Primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  copyButtonCopied: {
    backgroundColor: Colors.Success,
  },
  copyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.White,
  },
  shareOptionsContainer: {
    marginTop: 8,
  },
  shareOptionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.Gray,
    marginBottom: 12,
  },
  shareOptionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  shareOption: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.Background,
    borderWidth: 1,
    borderColor: Colors.Gray + '30',
    flex: 1,
    gap: 8,
  },
  shareOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.Text,
  },
  closeTextButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.Gray,
  },
});

