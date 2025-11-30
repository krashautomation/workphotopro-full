import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { globalStyles, getPlaceholderTextColor } from '@/styles/globalStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, Redirect, useRouter } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import RotatingText from '@/components/RotatingText';

export default function Index() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleGetStarted = () => {
    if (email.trim()) {
      router.push({
        pathname: '/(auth)/sign-up',
        params: { email: email.trim() },
      });
    } else {
      router.push('/(auth)/sign-up');
    }
  };

  if (loading) {
    return (
      <View style={globalStyles.centeredContainer}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(jobs)" />;
  }

  return (
    <View style={globalStyles.welcomeContainer}>
      {/* Logo Section */}
      <View style={globalStyles.logoContainer}>
        <LinearGradient
          colors={['#22c55e', '#84cc16', '#eab308']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={globalStyles.logoIcon}
        >
          <Camera size={64} color="#010101" />
        </LinearGradient>
        
        <Text style={globalStyles.title}>Work Photo Pro</Text>
        
        <Text style={globalStyles.subtitle}>
          The Work photo chat app for{' '} 
          <RotatingText 
            words={['Clients...  ', 'Companies...', 'Contractors...', 'Estimates...  ', 'Inventory...   ', 'Reports...   ', 'Invoices... ', 'Proof...     ']}
            interval={2000}
            style={globalStyles.subtitle}
          /></Text>
        
        <Text style={globalStyles.body}>
          Capture, organize & share work photos in the cloud for projects, estimates, updates and more....
        </Text>

        {/* New Container Below Description */}
        <View style={[styles.newContainer, { width: '100%' }]}>
          <TextInput
            style={styles.newInput}
            placeholder="Your email"
            placeholderTextColor={getPlaceholderTextColor()}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <TouchableOpacity onPress={handleGetStarted} style={styles.newButtonWrapper}>
            <LinearGradient
              colors={['#22c55e', '#84cc16', '#eab308']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.newButton}
            >
              <Text style={globalStyles.buttonText}>Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <View style={styles.newLinkContainer}>
            <Text style={globalStyles.body}>
              Already have an account?{' '}
              <Link href="/(auth)/sign-in">
                <Text style={globalStyles.link}>Sign In</Text>
              </Link>
            </Text>
          </View>
        </View>
      </View>

      {/* Footer Section */}
      <View style={globalStyles.footerSection}>
        <Text style={globalStyles.footer}>
          Trusted by 10,000+ companies worldwide
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  newContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 12,
    alignSelf: 'stretch',
    flexShrink: 0,
  },
  newInput: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    fontSize: 18,
    paddingVertical: 18,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    width: '100%',
    minWidth: '100%',
    textAlign: 'center',
    marginBottom: 0,
  },
  newButtonWrapper: {
    width: '100%',
    alignSelf: 'stretch',
  },
  newButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    height: 56,
    justifyContent: 'center',
    width: '100%',
    minWidth: '100%',
  },
  newLinkContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
});

