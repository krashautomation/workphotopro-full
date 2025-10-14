import { authService } from '@/lib/appwrite/auth';
import { globalStyles } from '@/styles/globalStyles';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';

export default function VerifyEmail() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const { userId, email, name } = useLocalSearchParams<{ userId: string; email: string; name?: string }>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify the OTP and create session
      await authService.verifyEmailOTP(userId, otp);
      
      // If name was provided during signup, update the user's name
      if (name && name.trim()) {
        try {
          await authService.updateName(name);
        } catch (nameError) {
          console.error('Failed to update name:', nameError);
          // Don't fail the entire verification if name update fails
        }
      }
      
      // Refresh user data in context
      await refreshUser();
      // Navigate to app
      router.replace('/(app)/jobs');
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    setResending(true);
    setError('');

    try {
      await authService.sendEmailOTP(email);
      setError('');
      // Show success message
      alert('A new code has been sent to your email!');
    } catch (err: any) {
      console.error('Resend OTP error:', err);
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Verify Your Email</Text>
      <Text style={[globalStyles.body, { marginBottom: 30, textAlign: 'center' }]}>
        We've sent a 6-digit code to{'\n'}
        <Text style={{ color: '#22c55e' }}>{email}</Text>
      </Text>

      <View style={styles.otpContainer}>
        <TextInput
          style={styles.otpInput}
          value={otp}
          onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="000000"
          placeholderTextColor="#666"
          autoFocus
        />
      </View>

      {error ? (
        <Text style={[globalStyles.body, { color: '#ff6b6b', marginBottom: 20, textAlign: 'center' }]}>
          {error}
        </Text>
      ) : null}

      <TouchableOpacity
        style={[globalStyles.button, loading && { opacity: 0.6 }]}
        onPress={verifyOTP}
        disabled={loading || otp.length !== 6}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={globalStyles.buttonText}>Verify Code</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={resendOTP}
        disabled={resending}
      >
        <Text style={styles.resendText}>
          {resending ? 'Sending...' : "Didn't receive the code? Resend"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={[globalStyles.body, { color: '#999' }]}>Back to Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  otpContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  otpInput: {
    backgroundColor: '#1e1e1e',
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 12,
    padding: 20,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 8,
    width: '100%',
  },
  resendButton: {
    marginTop: 20,
    padding: 10,
  },
  resendText: {
    color: '#22c55e',
    textAlign: 'center',
    fontSize: 14,
  },
  backButton: {
    marginTop: 10,
    padding: 10,
  },
});

