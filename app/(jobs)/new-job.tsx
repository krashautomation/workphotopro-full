import Input from '@/components/Input';
import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { jobChatService } from '@/lib/appwrite/database';
import { Colors } from '@/utils/colors';
import { Image } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, Alert } from 'react-native';

export default function NewJob() {
  const { user } = useAuth();
  const { currentTeam, currentOrganization } = useOrganization();
  const { photoFlow, mediaType } = useLocalSearchParams<{ photoFlow?: string; mediaType?: 'photo' | 'video' }>();
  const isVideo = mediaType === 'video';
  const [jobName, setJobName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading ] = useState(false);

const handleCreateRoom = async () => {
  try {
    // Check if user has selected a team
    if (!currentTeam?.$id) {
      Alert.alert('No Team Selected', 'Please select a team before creating a job.');
      return;
    }

    if (!currentOrganization?.$id) {
      Alert.alert('No Organization Selected', 'Please select an organization before creating a job.');
      return;
    }

    setIsLoading(true);
    
    // Use jobChatService which properly handles teamId and orgId
    const newJob = await jobChatService.createJobChat({
      title: jobName,
      description: jobDescription,
      createdBy: user?.$id || 'unknown',
      createdByName: user?.name || 'Unknown User',
    }, currentTeam.$id, currentOrganization.$id);
    
    // If we're in photo flow mode, navigate to camera/video-camera with the new job's ID
    if (photoFlow === 'true' && newJob?.$id) {
      router.replace({
        pathname: isVideo ? '/(jobs)/video-camera' : '/(jobs)/camera',
        params: {
          jobId: newJob.$id,
          photoFlow: 'true',
        },
      });
    } else {
      // Normal flow: just go back
      router.back();
    }
  } catch (error) {
    console.error('Error creating job:', error);
    Alert.alert('Error', 'Failed to create job. Please try again.');
  } finally {
    setIsLoading(false);
  }
}

return (
  <>
  <Stack.Screen />
      
    <View style={{ padding: 16, gap: 16 }}>
      

      <Image 
        source={require('@/assets/images/new-job-chat.png')} 
        style={{ width: 200, height: 200, alignSelf: 'center', marginBottom: 10, marginTop: 15 }} 
        resizeMode="contain"
      />
           <Text style={styles.subtitle}>Create a new job that can be assigned to team members for monitoring and collaboration using photos, video, comments and more.</Text>
        
        <Input
        placeholder="Job Name"
        value={jobName}
        onChangeText={setJobName}
        style={{ color: '#fff' }}
        placeholderTextColor={Colors.Gray}
        maxLength={200}
      />
      <Input
        placeholder="Job Description (Optional)"
        value={jobDescription}
        onChangeText={setJobDescription}
        placeholderTextColor={Colors.Gray}
        maxLength={500}
        style={{ height: 100 }}
        textAlignVertical="top"
        multiline
      />
      
      <Pressable 
        style={[
          styles.createButton,
          jobName.length === 0 && styles.createButtonDisabled
        ]}
        onPress={handleCreateRoom} 
        disabled={jobName.length === 0 || isLoading}
      >
        <Text style={[
          styles.createButtonText,
          jobName.length === 0 && styles.createButtonTextDisabled
        ]}>
          {isLoading ? "Creating..." : "Create"}
        </Text>
      </Pressable>
    
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  createButtonTextDisabled: {
    color: 'rgba(128, 128, 128, 0.4)',
  },
});
