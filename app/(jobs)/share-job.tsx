import * as React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors } from '@/utils/colors';

type ShareJobProps = {
  onClose?: () => void;
};

const ShareJob: React.FC<ShareJobProps> = ({ onClose }) => {
  const handleClose = React.useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  const handleCreateReport = React.useCallback(() => {
    console.log('🔍 ShareJob: Create Web Report tapped');
  }, []);

  const handleShareReport = React.useCallback(() => {
    console.log('🔍 ShareJob: Share the Report tapped');
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Share Report</Text>
      <Text style={styles.message}>
        You can create and edit a web report for this job chat below.
      </Text>

      <View style={styles.linksContainer}>
        <Pressable onPress={handleCreateReport} style={styles.actionButton}>
          <View style={styles.actionButtonContent}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>Create a Web Report</Text>
          </View>
        </Pressable>
        <Pressable onPress={handleShareReport} style={styles.actionButton}>
          <View style={styles.actionButtonContent}>
            <Text style={styles.actionIcon}>🔗</Text>
            <Text style={styles.actionText}>Share the Report</Text>
          </View>
        </Pressable>
      </View>

      <Pressable onPress={handleClose} style={styles.cancelButton}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </View>
  );
};

export default ShareJob;

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.Text,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.LightGray,
  },
  linksContainer: {
    gap: 12,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.Primary + '20',
    borderWidth: 1,
    borderColor: Colors.Primary,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.Text,
  },
  cancelButton: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.DarkGray,
    backgroundColor: Colors.Surface,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.Text,
  },
});


