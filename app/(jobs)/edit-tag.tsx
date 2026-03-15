import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { Colors } from '@/utils/colors';
import { TagTemplate } from '@/utils/types';
import { tagService } from '@/lib/appwrite/database';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/utils/permissions';

export default function EditTag() {
  const { user } = useAuth();
  const { canManageTags } = usePermissions();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [tagName, setTagName] = useState('');
  const [tagDescription, setTagDescription] = useState('');
  const [tagColor, setTagColor] = useState('#FFD700');
  const [isInitialized, setIsInitialized] = useState(false);
  

  const predefinedColors = [
    '#FFD700', // Yellow
    '#007AFF', // Blue
    '#FF3B30', // Red
    '#22C55E', // Green
    '#8B5CF6', // Purple
    '#F59E0B', // Orange
    '#EF4444', // Red-500
    '#3B82F6', // Blue-500
    '#10B981', // Emerald-500
    '#F97316', // Orange-500
  ];


  useEffect(() => {
    // Initialize form with passed parameters only once
    if (!isInitialized) {
      if (params.tagName) setTagName(params.tagName as string);
      if (params.tagDescription) setTagDescription(params.tagDescription as string);
      if (params.tagColor) setTagColor(params.tagColor as string);
      setIsInitialized(true);
    }
  }, [params, isInitialized]);


  const handleSave = async () => {
    if (!canManageTags) {
      Alert.alert('Permission Denied', 'Only team owners or admins can manage tags.');
      return;
    }

    if (!user?.$id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!tagName.trim()) {
      Alert.alert('Error', 'Please enter a tag name');
      return;
    }

    try {
      setIsSaving(true);
      
      const tagId = params.tagId as string;
      await tagService.updateTagTemplate(tagId, {
        name: tagName.trim(),
        description: tagDescription.trim() || undefined,
        color: tagColor,
      });

      Alert.alert('Success', 'Tag updated successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error updating tag:', error);
      Alert.alert('Error', 'Failed to update tag');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };


  return (
    <>
      <Stack.Screen options={{ title: 'Edit Tag' }} />
      <View style={{ flex: 1, backgroundColor: Colors.Background }}>

      <ScrollView style={{ flex: 1, padding: 20 }}>
        {/* Tag Name */}
        <View style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{
              color: Colors.Text,
              fontSize: 16,
              fontWeight: '600',
            }}>
              Tag Name
            </Text>
            <Text style={{
              color: Colors.Gray,
              fontSize: 12,
            }}>
              {tagName.length}/30
            </Text>
          </View>
          <TextInput
            style={{
              backgroundColor: Colors.Secondary,
              color: Colors.Text,
              paddingHorizontal: 12,
              paddingVertical: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: Colors.Border,
              fontSize: 16,
            }}
            placeholder="Enter tag name"
            placeholderTextColor={Colors.Gray}
            value={tagName}
            onChangeText={setTagName}
            maxLength={30}
            returnKeyType="next"
            blurOnSubmit={false}
            editable={true}
            selectTextOnFocus={true}
            autoCorrect={false}
            autoCapitalize="words"
          />
        </View>

        {/* Tag Description */}
        <View style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{
              color: Colors.Text,
              fontSize: 16,
              fontWeight: '600',
            }}>
              Description
            </Text>
            <Text style={{
              color: Colors.Gray,
              fontSize: 12,
            }}>
              {tagDescription.length}/50
            </Text>
          </View>
          <TextInput
            style={{
              backgroundColor: Colors.Secondary,
              color: Colors.Text,
              paddingHorizontal: 12,
              paddingVertical: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: Colors.Border,
              fontSize: 16,
              minHeight: 80,
              textAlignVertical: 'top',
            }}
            placeholder="Enter tag description"
            placeholderTextColor={Colors.Gray}
            value={tagDescription}
            onChangeText={setTagDescription}
            maxLength={50}
            multiline
            returnKeyType="done"
            blurOnSubmit={true}
            editable={true}
            selectTextOnFocus={true}
            autoCorrect={false}
            autoCapitalize="sentences"
          />
        </View>


        {/* Color Selection */}
        <View style={{ marginBottom: 30 }}>
          <Text style={{
            color: Colors.Text,
            fontSize: 16,
            fontWeight: '600',
            marginBottom: 8,
          }}>
            Color
          </Text>
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
          }}>
            {predefinedColors.map((color) => (
              <Pressable
                key={color}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: color,
                  borderWidth: tagColor === color ? 3 : 1,
                  borderColor: tagColor === color ? Colors.White : Colors.Border,
                }}
                onPress={() => setTagColor(color)}
              />
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{
          flexDirection: 'row',
          gap: 12,
          marginBottom: 20,
        }}>
          <Pressable
            style={{
              flex: 1,
              backgroundColor: Colors.Secondary,
              paddingVertical: 14,
              paddingHorizontal: 20,
              borderRadius: 8,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: Colors.Border,
            }}
            onPress={handleCancel}
          >
            <Text style={{
              color: Colors.Text,
              fontSize: 16,
              fontWeight: '600',
            }}>
              Cancel
            </Text>
          </Pressable>

          <Pressable
            style={{
              flex: 1,
              backgroundColor: canManageTags ? Colors.Primary : Colors.Gray,
              paddingVertical: 14,
              paddingHorizontal: 20,
              borderRadius: 8,
              alignItems: 'center',
              opacity: isSaving ? 0.7 : 1,
            }}
            onPress={handleSave}
            disabled={isSaving || !canManageTags}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={Colors.White} />
            ) : (
              <Text style={{
                color: Colors.White,
                fontSize: 16,
                fontWeight: '600',
              }}>
                Save Changes
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
      </View>
    </>
  );
}
