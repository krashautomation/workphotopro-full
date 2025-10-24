import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { Colors } from '@/utils/colors';
import { appwriteConfig, db } from '@/utils/appwrite';
import { useAuth } from '@/context/AuthContext';

export default function EditJobTitle() {
  const { jobId, currentTitle } = useLocalSearchParams();
  const { user } = useAuth();
  const [title, setTitle] = useState(currentTitle as string || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a job title');
      return;
    }

    if (!user?.$id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setIsSaving(true);
    try {
      console.log('🔍 EditJobTitle: Updating job title for jobId:', jobId);
      console.log('🔍 EditJobTitle: New title:', title);
      
      await db.updateDocument(
        appwriteConfig.db,
        appwriteConfig.col.jobchat,
        jobId as string,
        {
          title: title.trim(),
        }
      );
      
      console.log('🔍 EditJobTitle: Job title updated successfully');
      Alert.alert('Success', 'Job title updated successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('🔍 EditJobTitle: Error updating job title:', error);
      Alert.alert('Error', 'Failed to update job title. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.Background }}>
      <Stack.Screen 
        options={{ 
          title: 'Edit Job Title',
        }} 
      />
      
      <View style={{ flex: 1, padding: 20 }}>
        {/* Title Input */}
        <View style={{ marginBottom: 30 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: Colors.Text,
            marginBottom: 12
          }}>
            Job Title
          </Text>
          <TextInput
            style={{
              backgroundColor: Colors.Secondary,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 16,
              color: Colors.Text,
              borderWidth: 1,
              borderColor: Colors.Gray,
            }}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter job title"
            placeholderTextColor={Colors.Gray}
            autoFocus
            multiline
          />
        </View>

        {/* Save Button */}
        <Pressable
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 16,
            paddingHorizontal: 20,
            backgroundColor: Colors.Primary,
            borderRadius: 12,
            opacity: isSaving ? 0.7 : 1,
          }}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={Colors.White} />
          ) : (
            <>
              <IconSymbol name="checkmark" color={Colors.White} size={20} />
              <Text style={{
                color: Colors.White,
                fontSize: 16,
                fontWeight: '600',
                marginLeft: 8,
              }}>
                Save
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
