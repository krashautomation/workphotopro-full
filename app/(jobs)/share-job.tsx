import * as React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import { Colors } from '@/utils/colors';
import { Models } from 'react-native-appwrite';

type User = Models.User<Models.Preferences>;

type ShareJobProps = {
  onClose?: () => void;
  jobId: string;
  user: User | null;
  onShareReport: () => void;
  onCreateReport?: (reportId: string, reportUrl: string) => void;
  onUnmountReport?: () => void;
  reportId?: string | null;
};

const ShareJob: React.FC<ShareJobProps> = ({ onClose, onShareReport, jobId, user, onCreateReport, onUnmountReport, reportId: existingReportId }) => {
  const [isCreatingReport, setIsCreatingReport] = React.useState(false);
  const [hasReport, setHasReport] = React.useState(!!existingReportId);
  const [reportUrl, setReportUrl] = React.useState<string | null>(
    existingReportId ? `https://web.workphotopro.com/reports/${existingReportId}` : null
  );
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleClose = React.useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  const handleCreateReport = React.useCallback(async () => {
    console.log('🔍 ShareJob: Create Web Report tapped');
    
    if (!jobId || !user) {
      setErrorMessage('Missing job ID or user information');
      return;
    }

    setIsCreatingReport(true);
    setErrorMessage(null);
    setSuccessMessage(null);

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
      
      // Mark that a report now exists and store the URL
      setHasReport(true);
      setReportUrl(data.reportUrl);
      setSuccessMessage('Report created successfully!');
    } catch (error: any) {
      console.error('❌ Error creating report:', error);
      setErrorMessage(error.message || 'Failed to create report. Please try again.');
    } finally {
      setIsCreatingReport(false);
    }
  }, [jobId, user, onCreateReport]);

  // Update hasReport and reportUrl when existingReportId changes
  React.useEffect(() => {
    const hasExistingReport = !!existingReportId;
    setHasReport(hasExistingReport);
    if (hasExistingReport) {
      const url = `https://web.workphotopro.com/reports/${existingReportId}`;
      setReportUrl(url);
      setSuccessMessage('Recent report available');
    } else {
      setSuccessMessage(null);
    }
  }, [existingReportId]);

  const handleShareReport = React.useCallback(() => {
    console.log('🔍 ShareJob: Share the Report tapped');
    if (onShareReport) {
      onShareReport();
    }
  }, [onShareReport]);

  const handleViewReport = React.useCallback(async () => {
    console.log('🔍 ShareJob: View Web Report tapped');
    if (!reportUrl) return;

    try {
      const canOpen = await Linking.canOpenURL(reportUrl);
      if (canOpen) {
        await Linking.openURL(reportUrl);
      } else {
        Alert.alert('Error', 'Could not open browser');
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert('Error', 'Could not open browser');
    }
  }, [reportUrl]);

  const handleUnmountReport = React.useCallback(() => {
    console.log('🔍 ShareJob: Unmount Report tapped');
    setHasReport(false);
    setReportUrl(null);
    setSuccessMessage(null);
    if (onUnmountReport) {
      onUnmountReport();
    }
  }, [onUnmountReport]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Share Report</Text>
      <Text style={styles.message}>
        You can create and edit a web report for this job chat below.
      </Text>

      {successMessage && (
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✅</Text>
          <View style={styles.successTextContainer}>
            <Text style={styles.successText}>{successMessage}</Text>
            {reportUrl && (
              <Text style={styles.successUrl} selectable>{reportUrl}</Text>
            )}
          </View>
        </View>
      )}

      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

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
        <Pressable 
          onPress={handleViewReport} 
          style={[styles.actionButton, !hasReport && styles.actionButtonDisabled]}
          disabled={!hasReport}
        >
          <View style={styles.actionButtonContent}>
            <Text style={styles.actionIcon}>👁️</Text>
            <Text style={[styles.actionText, !hasReport && styles.actionTextDisabled]}>View Web Report</Text>
          </View>
        </Pressable>
        <Pressable 
          onPress={handleShareReport} 
          style={[styles.actionButton, !hasReport && styles.actionButtonDisabled]}
          disabled={!hasReport}
        >
          <View style={styles.actionButtonContent}>
            <Text style={styles.actionIcon}>🔗</Text>
            <Text style={[styles.actionText, !hasReport && styles.actionTextDisabled]}>Share the Report</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.footerContainer}>
        {hasReport && (
          <Pressable onPress={handleUnmountReport} style={styles.unmountButton}>
            <Text style={styles.unmountText}>Unmount Report</Text>
          </Pressable>
        )}
        <Pressable onPress={handleClose} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
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
    opacity: 0.5,
  },
  actionTextDisabled: {
    opacity: 0.6,
  },
  footerContainer: {
    marginTop: 8,
    gap: 8,
  },
  unmountButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.DarkGray,
    backgroundColor: Colors.Surface,
    alignSelf: 'flex-start',
  },
  unmountText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.Gray,
  },
  cancelButton: {
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
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.Success + '20',
    borderWidth: 1,
    borderColor: Colors.Success,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  successIcon: {
    fontSize: 18,
  },
  successTextContainer: {
    flex: 1,
    gap: 4,
  },
  successText: {
    fontSize: 14,
    color: Colors.Success,
    fontWeight: '500',
  },
  successUrl: {
    fontSize: 12,
    color: Colors.Success,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4444' + '20',
    borderWidth: 1,
    borderColor: '#ff4444',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  errorIcon: {
    fontSize: 18,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#ff4444',
    fontWeight: '500',
  },
});


