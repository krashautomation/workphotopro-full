import { useAuth } from '@/context/AuthContext';
import { globalStyles } from '@/styles/globalStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, Redirect } from 'expo-router';
import { Camera, UserCircle } from 'lucide-react-native';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

export default function Index() {
  const { isAuthenticated, loading } = useAuth();

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
      <View style={{ width: '100%', alignItems: 'flex-end' }}>
        <Link href="/(jobs)/user-profile" asChild>
          <TouchableOpacity
            style={{
              padding: 8,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.06)',
            }}
            accessibilityRole="button"
            accessibilityLabel="Open user profile"
          >
            <UserCircle size={28} color="#fff" />
          </TouchableOpacity>
        </Link>
      </View>

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
          Job site photos made easy...
        </Text>
        
        <Text style={globalStyles.body}>
          Capture, organize and share work photos for projects, estimates and updates with ease.
        </Text>
      </View>

      {/* Content Section */}
      <View style={globalStyles.contentSection}>
        <View style={globalStyles.buttonSection}>
          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity>
              <LinearGradient
                colors={['#22c55e', '#84cc16', '#eab308']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={globalStyles.gradientButton}
              >
                <Text style={globalStyles.buttonText}>Get Started</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Link>
          
          <View style={globalStyles.verticalLinkContainer}>
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
          Trusted by contractors worldwide
        </Text>
      </View>
    </View>
  );
}

