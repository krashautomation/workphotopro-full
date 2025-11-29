import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getPlaceholderTextColor, globalStyles } from '@/styles/globalStyles';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
// GOOGLE_AUTH: Commented out - uncomment to re-enable Google sign up
// import GoogleAuthButton from '@/components/GoogleAuthButton';
import { ChevronLeft } from 'lucide-react-native';

type SignUpStep = 0 | 1 | 2 | 3;

const STEPS = [
  { label: 'Full Name', key: 'name' },
  { label: 'Email', key: 'email' },
  { label: 'Password', key: 'password' },
  { label: 'Confirm Password', key: 'confirmPassword' },
] as const;

export default function SignUp() {
  const { signUp } = useAuth();
  // GOOGLE_AUTH: Commented out - uncomment to re-enable Google sign up
  // const { signUp, signInWithGoogle } = useAuth();
  const router = useRouter();
  const { email: initialEmail } = useLocalSearchParams<{ email?: string }>();
  const [currentStep, setCurrentStep] = useState<SignUpStep>(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailPreFilled, setEmailPreFilled] = useState(false);

  // Set email from params if provided
  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
      setEmailPreFilled(true);
      // If email is provided, start at step 0 (name step) - skip email step
      setCurrentStep(0);
    }
  }, [initialEmail]);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const validateStep = (step: SignUpStep): string | null => {
    switch (step) {
      case 0:
        if (!name.trim()) {
          return 'Please enter your full name';
        }
        return null;
      case 1:
        if (!email.trim()) {
          return 'Please enter your email';
        }
        if (!email.includes('@')) {
          return 'Please enter a valid email';
        }
        return null;
      case 2:
        const passwordError = validatePassword(password);
        if (passwordError) {
          return passwordError;
        }
        return null;
      case 3:
        if (!confirmPassword) {
          return 'Please confirm your password';
        }
        if (password !== confirmPassword) {
          return 'Passwords do not match';
        }
        return null;
      default:
        return null;
    }
  };

  const handleNext = () => {
    const validationError = validateStep(currentStep);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    
    // If email is pre-filled, skip email step (step 1)
    if (emailPreFilled) {
      if (currentStep === 0) {
        // After name, go to password (step 2)
        setCurrentStep(2);
      } else if (currentStep < 3) {
        setCurrentStep((currentStep + 1) as SignUpStep);
      }
    } else {
      // Normal flow: go to next step
      if (currentStep < 3) {
        setCurrentStep((currentStep + 1) as SignUpStep);
      }
    }
  };

  const handleBack = () => {
    setError('');
    if (emailPreFilled) {
      // If email is pre-filled, step 0 -> go back to home, step 2 -> go to step 0
      if (currentStep === 2) {
        setCurrentStep(0);
      } else if (currentStep > 0) {
        router.back();
      }
    } else {
      if (currentStep > 0) {
        setCurrentStep((currentStep - 1) as SignUpStep);
      }
    }
  };

  const handleSignUp = async () => {
    // If email is pre-filled, validate password step (step 2) instead of confirm password (step 3)
    const validationStep = emailPreFilled ? 2 : 3;
    const validationError = validateStep(validationStep);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Additional validation: ensure password meets requirements
    if (emailPreFilled && currentStep === 2) {
      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      // Create account with email and password
      // User is automatically logged in after signup
      const result = await signUp(email, password, name);
      
      // Navigate directly to app (user is already logged in)
      router.replace('/(jobs)');
    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(err.message || 'Sign up failed. Please try again.');
      setLoading(false);
    }
  };

  const getCurrentValue = () => {
    switch (currentStep) {
      case 0:
        return name;
      case 1:
        return email;
      case 2:
        return password;
      case 3:
        return confirmPassword;
      default:
        return '';
    }
  };

  const setCurrentValue = (value: string) => {
    switch (currentStep) {
      case 0:
        setName(value);
        break;
      case 1:
        setEmail(value);
        break;
      case 2:
        setPassword(value);
        break;
      case 3:
        setConfirmPassword(value);
        break;
    }
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const getCurrentPlaceholder = () => {
    return STEPS[currentStep].label;
  };

  const isPasswordField = () => {
    // If email is pre-filled, step 2 is password (and step 1 is skipped)
    if (emailPreFilled) {
      return currentStep === 2;
    }
    return currentStep === 2 || currentStep === 3;
  };

  // GOOGLE_AUTH: Commented out - uncomment to re-enable Google sign up
  // const handleGoogleSuccess = async () => {
  //   try {
  //     console.log('🟡 SignUp: handleGoogleSuccess called');
  //     // GoogleAuthButton already calls signInWithGoogle(), so we just navigate
  //     console.log('🟡 SignUp: OAuth successful, navigating to jobs...');
  //     router.replace('/(jobs)');
  //   } catch (error: any) {
  //     console.error('🔴 SignUp: Google OAuth error:', error);
  //     setError(error.message || 'Google sign up failed. Please try again.');
  //   }
  // };

  // const handleGoogleError = (error: Error) => {
  //   console.error('Google sign up error:', error);
  //   setError(error.message || 'Google sign up failed. Please try again.');
  // };


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={globalStyles.container}>
          {/* Back button */}
          {(emailPreFilled ? currentStep > 0 : currentStep > 0) && (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            {emailPreFilled ? (
              // Show only 2 steps when email is pre-filled: Name and Password
              <>
                <View
                  style={[
                    styles.progressDot,
                    currentStep >= 0 && styles.progressDotActive,
                  ]}
                />
                <View
                  style={[
                    styles.progressDot,
                    currentStep >= 2 && styles.progressDotActive,
                  ]}
                />
              </>
            ) : (
              // Show all 4 steps in normal flow
              STEPS.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index <= currentStep && styles.progressDotActive,
                  ]}
                />
              ))
            )}
          </View>

          <Text style={globalStyles.title}>Create account</Text>
          <Text style={styles.stepIndicator}>
            {emailPreFilled 
              ? `Step ${currentStep === 0 ? 1 : 2} of 2`
              : `Step ${currentStep + 1} of ${STEPS.length}`
            }
          </Text>

          {error ? (
            <Text style={[globalStyles.body, { color: '#ff6b6b', marginVertical: 10 }]}>
              {error}
            </Text>
          ) : null}

          <View style={{ flex: 0.1 }} />

          {/* Single input field for current step */}
          <TextInput
            style={[globalStyles.input, styles.stepInput]}
            placeholder={getCurrentPlaceholder()}
            placeholderTextColor={getPlaceholderTextColor()}
            value={getCurrentValue()}
            onChangeText={setCurrentValue}
            autoCapitalize={currentStep === 0 ? 'words' : 'none'}
            keyboardType={currentStep === 1 ? 'email-address' : 'default'}
            secureTextEntry={isPasswordField()}
            autoFocus
            editable={!loading}
            onSubmitEditing={
              emailPreFilled 
                ? (currentStep === 0 ? handleNext : handleSignUp)
                : (currentStep < 3 ? handleNext : handleSignUp)
            }
            returnKeyType={
              emailPreFilled
                ? (currentStep === 0 ? 'next' : 'done')
                : (currentStep < 3 ? 'next' : 'done')
            }
          />

          {/* Next / Sign up button */}
          <TouchableOpacity
            style={[globalStyles.button, loading && { opacity: 0.5 }]}
            onPress={
              emailPreFilled
                ? (currentStep === 0 ? handleNext : handleSignUp)
                : (currentStep < 3 ? handleNext : handleSignUp)
            }
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={globalStyles.buttonText}>
                {emailPreFilled
                  ? (currentStep === 0 ? 'Next' : 'Sign up')
                  : (currentStep < 3 ? 'Next' : 'Sign up')
                }
              </Text>
            )}
          </TouchableOpacity>

          {/* GOOGLE_AUTH: Commented out - uncomment to re-enable Google sign up */}
          {/* Show Google auth only on first step */}
          {/* {currentStep === 0 && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              <GoogleAuthButton 
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                mode="sign-up"
              />
            </>
          )} */}

          <View style={globalStyles.linkContainer}>
            <Text style={globalStyles.body}>Already have an account? </Text>
            <Link href="/(auth)/sign-in">
              <Text style={globalStyles.link}>Sign in</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    padding: 8,
    zIndex: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    marginTop: 20,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#374151',
  },
  progressDotActive: {
    backgroundColor: '#22c55e',
    width: 24,
  },
  stepIndicator: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepInput: {
    fontSize: 18,
    paddingVertical: 18,
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
});

