import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator, Image } from 'react-native';
import { useState } from 'react';

type GoogleAuthButtonProps = {
  onSuccess: (user: any) => void;
  onError: (error: Error) => void;
  mode: 'sign-up' | 'sign-in';
};

export default function GoogleAuthButton({ onSuccess, onError, mode }: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    setLoading(true);
    try {
      // TODO: Implement Google OAuth
      console.log(`Google ${mode} initiated`);
      
      // Placeholder - will implement actual OAuth later
      setTimeout(() => {
        setLoading(false);
        // onSuccess(user);
      }, 1000);
    } catch (error) {
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
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
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

