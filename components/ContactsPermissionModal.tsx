import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  Platform,
} from 'react-native';
import { Colors } from '@/utils/colors';

type ContactsPermissionModalProps = {
  visible: boolean;
  onAllow: () => void;
  onDeny: () => void;
  isDenied?: boolean; // If permission was previously denied
};

export default function ContactsPermissionModal({
  visible,
  onAllow,
  onDeny,
  isDenied = false,
}: ContactsPermissionModalProps) {
  const handleLearnMore = () => {
    // You can link to a privacy policy or help page
    // For now, we'll just dismiss or open settings
    if (isDenied) {
      openSettings();
    }
  };

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDeny}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>
            Allow WorkPhotoPro to access your contacts?
          </Text>

          <View style={styles.bodyContainer}>
            <Text style={styles.bodyText}>
              To find your friends faster, allow WorkPhotoPro to access your contacts in your device settings.
            </Text>
            <Pressable onPress={handleLearnMore}>
              <Text style={styles.learnMoreLink}>Learn more.</Text>
            </Pressable>
          </View>

          {isDenied && (
            <Text style={styles.deniedText}>
              If you've previously declined this, you may need to tap Permissions and turn on Contacts.
            </Text>
          )}

          <View style={styles.buttonContainer}>
            <Pressable style={styles.allowButton} onPress={onAllow}>
              <Text style={styles.allowButtonText}>Allow access</Text>
            </Pressable>
            <Pressable style={styles.denyButton} onPress={onDeny}>
              <Text style={styles.denyButtonText}>Don't allow access</Text>
            </Pressable>
          </View>
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
  modalContainer: {
    backgroundColor: Colors.Secondary,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.Text,
    marginBottom: 16,
    textAlign: 'center',
  },
  bodyContainer: {
    marginBottom: 16,
  },
  bodyText: {
    fontSize: 15,
    color: Colors.Text,
    lineHeight: 22,
    marginBottom: 8,
  },
  learnMoreLink: {
    fontSize: 15,
    color: Colors.Primary,
    fontWeight: '500',
  },
  deniedText: {
    fontSize: 14,
    color: Colors.Gray,
    lineHeight: 20,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 8,
  },
  allowButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: Colors.Primary,
    alignItems: 'center',
  },
  allowButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.White,
  },
  denyButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  denyButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.Text,
  },
});

