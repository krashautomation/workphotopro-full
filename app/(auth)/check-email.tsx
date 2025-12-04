import React, { useState } from 'react';
import { globalStyles, getPlaceholderTextColor } from '@/styles/globalStyles';
import { getUserFriendlyError } from '@/utils/errorHandler';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { authService } from '@/lib/appwrite/auth';
import { useAuth } from '@/context/AuthContext';

export default function CheckEmail() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const { email, userId } = useLocalSearchParams<{ email: string; userId: string }>();
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    if (!userId) {
      setError('Verification session expired. Please sign up again.');
      return;
    }

    setVerifying(true);
    setError('');
    setSuccessMessage('');

    try {
      // Verify OTP and create session
      await authService.verifyEmailOTP(userId, otp);
      
      // Refresh user data
      await refreshUser();
      
      // Navigate to jobs screen
      router.replace('/(jobs)');
    } catch (err: any) {
      const errorMessage = getUserFriendlyError(err);
      setError(errorMessage || 'Invalid verification code. Please try again.');
      setOtp(''); // Clear OTP on error
    } finally {
      setVerifying(false);
    }
  };

  const resendVerification = async () => {
    if (!email) {
      setError('Email address is required');
      return;
    }

    setResending(true);
    setError('');
    setSuccessMessage('');

    try {
      await authService.sendVerificationEmail(email);
      setSuccessMessage('A new verification code has been sent!');
      setOtp(''); // Clear previous OTP
      // Note: userId remains the same - each resend generates a new code for the same user
    } catch (err: any) {
      const errorMessage = getUserFriendlyError(err);
      setError(errorMessage || 'Failed to resend verification code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View style={globalStyles.container}>
        <Text style={globalStyles.title}>Check Your Email</Text>
        <Text style={[globalStyles.body, { marginBottom: 30, textAlign: 'center' }]}>
          We've sent a verification code to{'\n'}
          <Text style={{ color: '#22c55e' }}>{email}</Text>
          {'\n\n'}
          Please check your email and enter the 6-digit code to verify your account.
        </Text>

        {error ? (
          <Text style={[globalStyles.body, { color: '#ff6b6b', marginBottom: 20, textAlign: 'center' }]}>
            {error}
          </Text>
        ) : null}

        {successMessage ? (
          <Text style={[globalStyles.body, { color: '#22c55e', marginBottom: 20, textAlign: 'center' }]}>
            {successMessage}
          </Text>
        ) : null}

        {/* OTP Input */}
        <TextInput
          style={[globalStyles.input, styles.otpInput]}
          placeholder="Enter 6-digit code"
          placeholderTextColor={getPlaceholderTextColor()}
          value={otp}
          onChangeText={(text) => {
            // Only allow digits and limit to 6 characters
            const digitsOnly = text.replace(/[^0-9]/g, '').slice(0, 6);
            setOtp(digitsOnly);
            setError(''); // Clear error when user types
          }}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
          editable={!verifying && !resending}
        />

        {/* Verify Button */}
        <TouchableOpacity
          style={[globalStyles.button, (verifying || otp.length !== 6) && { opacity: 0.6 }]}
          onPress={handleVerifyOTP}
          disabled={verifying || otp.length !== 6}
        >
          {verifying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={globalStyles.buttonText}>Verify Code</Text>
          )}
        </TouchableOpacity>

        {/* Resend Button */}
        <TouchableOpacity
          style={[styles.resendButton, resending && { opacity: 0.6 }]}
          onPress={resendVerification}
          disabled={resending}
        >
          {resending ? (
            <ActivityIndicator color="#22c55e" />
          ) : (
            <Text style={[globalStyles.body, { color: '#22c55e' }]}>Resend Verification Code</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={[globalStyles.body, { color: '#999' }]}>Back to Sign Up</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  otpInput: {
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: 20,
  },
  resendButton: {
    marginTop: 20,
    padding: 10,
    alignItems: 'center',
  },
  backButton: {
    marginTop: 20,
    padding: 10,
  },
});

