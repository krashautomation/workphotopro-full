import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { Colors } from '@/utils/colors';
import { TagTemplate } from '@/utils/types';
import { tagService } from '@/lib/appwrite/database';
import { useAuth } from '@/context/AuthContext';

export default function EditTags() {
  const { user } = useAuth();
  const router = useRouter();
  const [tagTemplates, setTagTemplates] = useState<TagTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTagTemplates();
  }, []);

  const loadTagTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await tagService.getActiveTagTemplates();
      setTagTemplates(response.documents);
    } catch (error) {
      console.error('Error loading tag templates:', error);
      Alert.alert('Error', 'Failed to load tag templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagPress = (tag: TagTemplate) => {
    router.push({
      pathname: '/(jobs)/edit-tag',
      params: {
        tagId: tag.$id,
        tagName: tag.name,
        tagColor: tag.color,
        tagIcon: tag.icon || 'circle',
        tagDescription: tag.description || '',
      },
    });
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Tags' }} />
      <View style={{ flex: 1, backgroundColor: Colors.Background }}>

      <ScrollView style={{ flex: 1, padding: 20 }}>
        {isLoading ? (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 40,
          }}>
            <ActivityIndicator size="small" color={Colors.Primary} />
            <Text style={{
              color: Colors.Gray,
              fontSize: 14,
              marginLeft: 8,
            }}>
              Loading tags...
            </Text>
          </View>
        ) : tagTemplates.length === 0 ? (
          <View style={{
            alignItems: 'center',
            paddingVertical: 40,
          }}>
            <Text style={{
              color: Colors.Gray,
              fontSize: 16,
              textAlign: 'center',
            }}>
              No tags available. Create tags in the tag management section.
            </Text>
          </View>
        ) : (
          tagTemplates.map((tag, index) => (
            <Pressable
              key={tag.$id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: Colors.Secondary,
                paddingVertical: 16,
                paddingHorizontal: 16,
                borderRadius: 8,
                marginBottom: index < tagTemplates.length - 1 ? 12 : 0,
                borderWidth: 1,
                borderColor: Colors.Border,
              }}
              onPress={() => handleTagPress(tag)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <IconSymbol
                  name={tag.icon || "circle"}
                  color={tag.color}
                  size={24}
                />
                <View style={{ marginLeft: 16, flex: 1 }}>
                  <Text style={{
                    color: Colors.Text,
                    fontSize: 16,
                    fontWeight: '600',
                    marginBottom: 4,
                  }}>
                    {tag.name}
                  </Text>
                  {tag.description && (
                    <Text style={{
                      color: Colors.Gray,
                      fontSize: 14,
                      lineHeight: 20,
                    }}>
                      {tag.description}
                    </Text>
                  )}
                </View>
              </View>
              
              <IconSymbol 
                name="chevron.right" 
                color={Colors.Gray} 
                size={20} 
              />
            </Pressable>
          ))
        )}
      </ScrollView>
      </View>
    </>
  );
}
