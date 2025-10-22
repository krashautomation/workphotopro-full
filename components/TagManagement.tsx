import React, { useState, useEffect } from 'react'
import { View, Text, Pressable, Alert, ActivityIndicator, TextInput, ScrollView } from 'react-native'
import { IconSymbol } from '@/components/IconSymbol'
import { Colors } from '@/utils/colors'
import { TagTemplate } from '@/utils/types'
import { tagService } from '@/lib/appwrite/database'
import { useAuth } from '@/context/AuthContext'

interface TagManagementProps {
  onClose: () => void
}

export default function TagManagement({ onClose }: TagManagementProps) {
  const { user } = useAuth()
  const [tagTemplates, setTagTemplates] = useState<TagTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  // Form state for creating new tags
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#FFD700')
  const [newTagDescription, setNewTagDescription] = useState('')

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
  ]

  useEffect(() => {
    loadTagTemplates()
  }, [])

  const loadTagTemplates = async () => {
    try {
      setIsLoading(true)
      const response = await tagService.getActiveTagTemplates()
      setTagTemplates(response.documents)
    } catch (error) {
      console.error('Error loading tag templates:', error)
      Alert.alert('Error', 'Failed to load tag templates')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTag = async () => {
    if (!user?.$id) {
      Alert.alert('Error', 'User not authenticated')
      return
    }

    if (!newTagName.trim()) {
      Alert.alert('Error', 'Please enter a tag name')
      return
    }

    try {
      setIsCreating(true)
      await tagService.createTagTemplate({
        name: newTagName.trim(),
        color: newTagColor,
        description: newTagDescription.trim() || undefined,
        isActive: true,
        sortOrder: Math.min(tagTemplates.length + 1, 50),
        createdBy: user.$id,
      })

      // Reset form
      setNewTagName('')
      setNewTagColor('#FFD700')
      setNewTagDescription('')
      setShowCreateForm(false)

      // Reload tags
      await loadTagTemplates()
      
      Alert.alert('Success', 'Tag created successfully')
    } catch (error) {
      console.error('Error creating tag:', error)
      Alert.alert('Error', 'Failed to create tag')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteTag = async (tagId: string, tagName: string) => {
    Alert.alert(
      'Delete Tag',
      `Are you sure you want to delete the "${tagName}" tag? This will remove it from all jobs.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await tagService.deleteTagTemplate(tagId)
              await loadTagTemplates()
              Alert.alert('Success', 'Tag deleted successfully')
            } catch (error) {
              console.error('Error deleting tag:', error)
              Alert.alert('Error', 'Failed to delete tag')
            }
          }
        }
      ]
    )
  }

  const handleInitializeDefaultTags = async () => {
    if (!user?.$id) {
      Alert.alert('Error', 'User not authenticated')
      return
    }

    try {
      await tagService.initializeDefaultTags(user.$id)
      await loadTagTemplates()
      Alert.alert('Success', 'Default tags initialized successfully')
    } catch (error) {
      console.error('Error initializing default tags:', error)
      Alert.alert('Error', 'Failed to initialize default tags')
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.Background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.Border,
      }}>
        <Text style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: Colors.Text,
        }}>
          Manage Tags
        </Text>
        <Pressable onPress={onClose}>
          <IconSymbol name="xmark" color={Colors.Text} size={24} />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1, padding: 20 }}>
        {/* Initialize Default Tags Button */}
        {tagTemplates.length === 0 && (
          <Pressable
            style={{
              backgroundColor: Colors.Primary,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              marginBottom: 20,
              alignItems: 'center',
            }}
            onPress={handleInitializeDefaultTags}
          >
            <Text style={{
              color: Colors.White,
              fontSize: 16,
              fontWeight: '600',
            }}>
              Initialize Default Tags (Yellow, Blue, Red)
            </Text>
          </Pressable>
        )}

        {/* Create New Tag Button */}
        <Pressable
          style={{
            backgroundColor: Colors.Secondary,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 8,
            marginBottom: 20,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: Colors.Border,
          }}
          onPress={() => setShowCreateForm(!showCreateForm)}
        >
          <Text style={{
            color: Colors.Text,
            fontSize: 16,
            fontWeight: '600',
          }}>
            {showCreateForm ? 'Cancel' : 'Create New Tag'}
          </Text>
        </Pressable>

        {/* Create Tag Form */}
        {showCreateForm && (
          <View style={{
            backgroundColor: Colors.Secondary,
            padding: 16,
            borderRadius: 8,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: Colors.Border,
          }}>
            <Text style={{
              color: Colors.Text,
              fontSize: 16,
              fontWeight: '600',
              marginBottom: 12,
            }}>
              Create New Tag
            </Text>

            <TextInput
              style={{
                backgroundColor: Colors.Background,
                color: Colors.Text,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 6,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: Colors.Border,
              }}
              placeholder="Tag name"
              placeholderTextColor={Colors.Gray}
              value={newTagName}
              onChangeText={setNewTagName}
            />

            <TextInput
              style={{
                backgroundColor: Colors.Background,
                color: Colors.Text,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 6,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: Colors.Border,
              }}
              placeholder="Description (optional)"
              placeholderTextColor={Colors.Gray}
              value={newTagDescription}
              onChangeText={setNewTagDescription}
            />

            <Text style={{
              color: Colors.Text,
              fontSize: 14,
              marginBottom: 8,
            }}>
              Color:
            </Text>

            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              marginBottom: 16,
            }}>
              {predefinedColors.map((color) => (
                <Pressable
                  key={color}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: color,
                    marginRight: 8,
                    marginBottom: 8,
                    borderWidth: newTagColor === color ? 3 : 1,
                    borderColor: newTagColor === color ? Colors.White : Colors.Border,
                  }}
                  onPress={() => setNewTagColor(color)}
                />
              ))}
            </View>

            <Pressable
              style={{
                backgroundColor: Colors.Primary,
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 6,
                alignItems: 'center',
                opacity: isCreating ? 0.7 : 1,
              }}
              onPress={handleCreateTag}
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color={Colors.White} />
              ) : (
                <Text style={{
                  color: Colors.White,
                  fontSize: 16,
                  fontWeight: '600',
                }}>
                  Create Tag
                </Text>
              )}
            </Pressable>
          </View>
        )}

        {/* Tag List */}
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
              No tags available. Create your first tag above.
            </Text>
          </View>
        ) : (
          tagTemplates.map((tag, index) => (
            <View
              key={tag.$id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: Colors.Secondary,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                marginBottom: index < tagTemplates.length - 1 ? 12 : 0,
                borderWidth: 1,
                borderColor: Colors.Border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <IconSymbol
                  name={tag.icon || "circle"}
                  color={tag.color}
                  size={20}
                />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{
                    color: Colors.Text,
                    fontSize: 16,
                    fontWeight: '600',
                  }}>
                    {tag.name}
                  </Text>
                  {tag.description && (
                    <Text style={{
                      color: Colors.Gray,
                      fontSize: 12,
                      marginTop: 2,
                    }}>
                      {tag.description}
                    </Text>
                  )}
                </View>
              </View>
              
              <Pressable
                style={{
                  padding: 8,
                  borderRadius: 4,
                }}
                onPress={() => handleDeleteTag(tag.$id, tag.name)}
              >
                <IconSymbol name="trash" color={Colors.Error} size={16} />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}
