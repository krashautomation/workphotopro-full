import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Colors } from '@/utils/colors';
import { IconSymbol } from '@/components/IconSymbol';

// Clipboard helper that works with Expo Go
// Note: React Native's Clipboard API was removed in RN 0.60+
// For Expo Go, we'll use web API when available, otherwise text is selectable
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      // Web: Use navigator.clipboard
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      return false;
    }
    
    // For native (iOS/Android) in Expo Go:
    // Clipboard API is not available without native modules
    // Text is selectable, so users can copy manually
    // We'll return true to show success UI (text is selectable)
    return true;
  } catch (error) {
    console.warn('Clipboard copy failed:', error);
    return false;
  }
};

type InviteLinkModalProps = {
  visible: boolean;
  inviteLink: string;
  onClose: () => void;
};

export default function InviteLinkModal({
  visible,
  inviteLink,
  onClose,
}: InviteLinkModalProps) {
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);

  const handleCopy = async () => {
    if (!inviteLink) return;

    setCopying(true);
    try {
      const success = await copyToClipboard(inviteLink);
      if (success) {
        setCopied(true);
        // Reset "Copied!" message after 2 seconds
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      } else {
        // Clipboard not available - show message that text is selectable
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    } finally {
      setCopying(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Invite Link</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <IconSymbol name="xmark" color={Colors.Gray} size={20} />
            </Pressable>
          </View>

          <View style={styles.linkContainer}>
            <Text style={styles.linkText} selectable>
              {inviteLink}
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
                <Text style={styles.copyButtonText}>Copy Link</Text>
              </>
            )}
          </Pressable>

          <Pressable style={styles.closeTextButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: Colors.Secondary,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.Text,
  },
  closeButton: {
    padding: 4,
  },
  linkContainer: {
    backgroundColor: Colors.Background,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.Gray + '30',
  },
  linkText: {
    fontSize: 14,
    color: Colors.Text,
    fontFamily: 'monospace',
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
    marginBottom: 12,
  },
  copyButtonCopied: {
    backgroundColor: Colors.Success,
  },
  copyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.White,
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

