import * as React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert, Linking } from 'react-native';
import { Colors } from '@/utils/colors';
import { Models } from 'react-native-appwrite';

type User = Models.User<Models.Preferences>;

type ShareJobProps = {
  onClose?: () => void;
  jobId: string;
  user: User | null;
  onShareReport: () => void;
  onCreateReport?: (reportId: string, reportUrl: string) => void;
};

const ShareJob: React.FC<ShareJobProps> = ({ onClose, onShareReport, jobId, user, onCreateReport }) => {
  const [isCreatingReport, setIsCreatingReport] = React.useState(false);

  const handleClose = React.useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  const handleCreateReport = React.useCallback(async () => {
    console.log('🔍 ShareJob: Create Web Report tapped');
    
    if (!jobId || !user) {
      Alert.alert('Error', 'Missing job ID or user information');
      return;
    }

    setIsCreatingReport(true);

    try {
      // Call the web API to create the report
      // In development, you can use your local server: 'http://YOUR_LOCAL_IP:3000/api/reports'
      // Replace YOUR_LOCAL_IP with your computer's IP (find with: ipconfig on Windows)
      const apiUrl = process.env.EXPO_PUBLIC_WEB_API_URL || 'https://web.workphotopro.com/api/reports';
      
      console.log('🔍 Calling API:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          userId: user.$id,
          userName: user.name || 'Unknown',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create report' }));
        throw new Error(errorData.error || 'Failed to create report');
      }

      const data = await response.json();
      
      console.log('✅ Report created successfully:', data);
      console.log('🔗 Report URL:', data.reportUrl);

      if (onCreateReport) {
        onCreateReport(data.reportId, data.reportUrl);
      }

      // Open the report URL in browser
      const openReport = async () => {
        try {
          const canOpen = await Linking.canOpenURL(data.reportUrl);
          if (canOpen) {
            await Linking.openURL(data.reportUrl);
          } else {
            Alert.alert('Error', 'Could not open browser');
          }
        } catch (error) {
          console.error('Error opening URL:', error);
          Alert.alert('Error', 'Could not open browser');
        }
      };

      Alert.alert(
        'Report Created',
        `Your report has been created successfully!\n\nReport URL:\n${data.reportUrl}`,
        [
          {
            text: 'View Report',
            onPress: async () => {
              await openReport();
              if (onClose) {
                onClose();
              }
            },
            style: 'default',
          },
          {
            text: 'OK',
            onPress: () => {
              if (onClose) {
                onClose();
              }
            },
            style: 'cancel',
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Error creating report:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to create report. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCreatingReport(false);
    }
  }, [jobId, user, onCreateReport, onClose]);

  const handleShareReport = React.useCallback(() => {
    console.log('🔍 ShareJob: Share the Report tapped');
    if (onShareReport) {
      onShareReport();
    }
  }, [onShareReport]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Share Report</Text>
      <Text style={styles.message}>
        You can create and edit a web report for this job chat below.
      </Text>

      <View style={styles.linksContainer}>
        <Pressable 
          onPress={handleCreateReport} 
          style={[styles.actionButton, isCreatingReport && styles.actionButtonDisabled]}
          disabled={isCreatingReport}
        >
          <View style={styles.actionButtonContent}>
            {isCreatingReport ? (
              <>
                <ActivityIndicator size="small" color={Colors.Primary} />
                <Text style={styles.actionText}>Creating Report...</Text>
              </>
            ) : (
              <>
                <Text style={styles.actionIcon}>📊</Text>
                <Text style={styles.actionText}>Create a Web Report</Text>
              </>
            )}
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
  actionButtonDisabled: {
    opacity: 0.6,
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


