import { useAuth } from '@/context/AuthContext';
import { globalStyles } from '@/styles/globalStyles';
import { Link } from 'expo-router';
import { Text, View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

export default function Jobs() {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {user?.name || 'User'}!</Text>
        <Text style={styles.subtitle}>Your Jobs</Text>
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No jobs yet</Text>
        <Text style={styles.emptySubtext}>
          Create your first job to start organizing your work photos
        </Text>
        
        <TouchableOpacity style={globalStyles.button}>
          <Text style={globalStyles.buttonText}>Create Job</Text>
        </TouchableOpacity>
      </View>

      {/* Placeholder for future job list */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <Link href="/(app)/profile" asChild>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionTitle}>View Profile</Text>
            <Text style={styles.actionDescription}>Manage your account settings</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  actionCard: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#9ca3af',
  },
});

