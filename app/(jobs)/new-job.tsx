import Input from '@/components/Input';
import { appwriteConfig, db, ID } from '@/utils/appwrite';
import { Colors } from '@/utils/colors';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function NewJob() {

const [jobName, setJobName] = useState('');
const [jobDescription, setJobDescription] = useState('');
const [isLoading, setIsLoading ] = useState(false);

const handleCreateRoom = async () => {
  try {
    setIsLoading(true);
    await db.createDocument(appwriteConfig.db, appwriteConfig.col.jobchat, 
      ID.unique(), {
      title: jobName,
      description: jobDescription,
    });
    router.back();
  } catch (error) {
    console.log(error);
  } finally {
    setIsLoading(false);
  }
}

return (
  <>
  <Stack.Screen />
      
    <View style={{ padding: 16, gap: 16 }}>

      
      <Image source={require('@/assets/images/photopus-icon-glow.png')} style={{ width: 150, height: 150 }} />
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
