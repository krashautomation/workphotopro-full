import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator, Image } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

type GoogleAuthButtonProps = {
  onSuccess: () => void;
  onError: (error: Error) => void;
  mode: 'sign-up' | 'sign-in';
};

export default function GoogleAuthButton({ onSuccess, onError, mode }: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle } = useAuth();

  const handlePress = async () => {
    console.log(`🟠 GoogleAuthButton: ${mode} button pressed`);
    setLoading(true);
    try {
      console.log(`🟠 GoogleAuthButton: ${mode} initiated`);
      
      // Call the OAuth flow from AuthContext
      await signInWithGoogle();
      
      console.log('🟠 GoogleAuthButton: OAuth successful, calling onSuccess...');
      setLoading(false);
      onSuccess();
      console.log('🟠 GoogleAuthButton: onSuccess callback completed');
    } catch (error) {
      console.error('🔴 GoogleAuthButton: Error:', error);
      setLoading(false);
      onError(error as Error);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.button}
      onPress={handlePress}
      disabled={loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <View style={styles.content}>
          <Image 
            source={require('@/assets/images/google-icon.png')}
            style={styles.icon}
          />
          <Text style={styles.text}>Google</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    marginBottom: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  icon: {
    width: 20,
    height: 20,
  },
  text: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

