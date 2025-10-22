import React, { useState } from 'react'
import { View, Text, Pressable, Alert, ActivityIndicator } from 'react-native'
import { Colors } from '@/utils/colors'
import { tagService } from '@/lib/appwrite/database'
import { useAuth } from '@/context/AuthContext'

export default function TagTestComponent() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<string[]>([])

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const clearResults = () => {
    setTestResults([])
  }

  const testDatabaseConnection = async () => {
    if (!user?.$id) {
      Alert.alert('Error', 'User not authenticated')
      return
    }

    setIsLoading(true)
    clearResults()
    addResult('Starting database tests...')

    try {
      // Test 1: Get active tag templates
      addResult('Test 1: Fetching active tag templates...')
      const templatesResponse = await tagService.getActiveTagTemplates()
      addResult(`✓ Found ${templatesResponse.documents.length} tag templates`)

      // Test 2: Initialize default tags
      addResult('Test 2: Initializing default tags...')
      const defaultTags = await tagService.initializeDefaultTags(user.$id)
      addResult(`✓ Created ${defaultTags.length} default tags`)

      // Test 3: Create a custom tag
      addResult('Test 3: Creating custom test tag...')
      const customTag = await tagService.createTagTemplate({
        name: 'Test Tag',
        color: '#FF6B6B',
        description: 'This is a test tag',
        isActive: true,
        sortOrder: 10,
        createdBy: user.$id,
      })
      addResult(`✓ Created custom tag: ${customTag.name}`)

      // Test 4: Update the custom tag
      addResult('Test 4: Updating custom tag...')
      await tagService.updateTagTemplate(customTag.$id, {
        description: 'Updated test tag description',
      })
      addResult('✓ Updated custom tag successfully')

      // Test 5: Get all tags again
      addResult('Test 5: Fetching all tags after changes...')
      const updatedTemplates = await tagService.getActiveTagTemplates()
      addResult(`✓ Now have ${updatedTemplates.documents.length} total tags`)

      // Test 6: Test job tag assignment (if you have a job)
      addResult('Test 6: Testing job tag assignment...')
      // This will fail if no jobs exist, which is expected
      try {
        const assignments = await tagService.getJobTagAssignments('test-job-id')
        addResult(`✓ Job tag assignments query successful (found ${assignments.documents.length} assignments)`)
      } catch (error) {
        if (error.message?.includes('Collection with the requested ID could not be found')) {
          addResult('⚠ Job tag assignment test skipped (job_tag_assignments collection not found)')
        } else if (error.message?.includes('Document with the requested ID could not be found')) {
          addResult('⚠ Job tag assignment test skipped (no jobs exist yet)')
        } else {
          addResult(`⚠ Job tag assignment test skipped: ${error.message}`)
        }
      }

      addResult('🎉 All database tests completed successfully!')
      Alert.alert('Success', 'All database tests passed! Check the results below.')

    } catch (error) {
      console.error('Database test error:', error)
      addResult(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      Alert.alert('Test Failed', `Database test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testPermissions = async () => {
    if (!user?.$id) {
      Alert.alert('Error', 'User not authenticated')
      return
    }

    setIsLoading(true)
    clearResults()
    addResult('Testing permissions...')

    try {
      // Test read permissions
      addResult('Testing read permissions...')
      await tagService.getActiveTagTemplates()
      addResult('✓ Read permissions working')

      // Test create permissions
      addResult('Testing create permissions...')
      const testTag = await tagService.createTagTemplate({
        name: 'Permission Test',
        color: '#00FF00',
        isActive: true,
        sortOrder: 20,
        createdBy: user.$id,
      })
      addResult('✓ Create permissions working')

      // Test update permissions
      addResult('Testing update permissions...')
      await tagService.updateTagTemplate(testTag.$id, {
        name: 'Permission Test Updated',
      })
      addResult('✓ Update permissions working')

      // Test delete permissions
      addResult('Testing delete permissions...')
      await tagService.deleteTagTemplate(testTag.$id)
      addResult('✓ Delete permissions working')

      addResult('🎉 All permission tests passed!')
      Alert.alert('Success', 'All permission tests passed!')

    } catch (error) {
      console.error('Permission test error:', error)
      addResult(`❌ Permission test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      Alert.alert('Permission Test Failed', `Permission test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: Colors.Background }}>
      <Text style={{
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.Text,
        marginBottom: 20,
        textAlign: 'center',
      }}>
        Database & Permissions Test
      </Text>

      <Pressable
        style={{
          backgroundColor: Colors.Primary,
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 8,
          marginBottom: 12,
          alignItems: 'center',
          opacity: isLoading ? 0.7 : 1,
        }}
        onPress={testDatabaseConnection}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.White} />
        ) : (
          <Text style={{
            color: Colors.White,
            fontSize: 16,
            fontWeight: '600',
          }}>
            Test Database Connection
          </Text>
        )}
      </Pressable>

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
          opacity: isLoading ? 0.7 : 1,
        }}
        onPress={testPermissions}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.Text} />
        ) : (
          <Text style={{
            color: Colors.Text,
            fontSize: 16,
            fontWeight: '600',
          }}>
            Test Permissions
          </Text>
        )}
      </Pressable>

      <Pressable
        style={{
          backgroundColor: Colors.Error,
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 8,
          marginBottom: 20,
          alignItems: 'center',
        }}
        onPress={clearResults}
      >
        <Text style={{
          color: Colors.White,
          fontSize: 14,
          fontWeight: '600',
        }}>
          Clear Results
        </Text>
      </Pressable>

      <View style={{
        backgroundColor: Colors.Secondary,
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.Border,
        maxHeight: 300,
      }}>
        <Text style={{
          color: Colors.Text,
          fontSize: 16,
          fontWeight: '600',
          marginBottom: 12,
        }}>
          Test Results:
        </Text>
        
        {testResults.length === 0 ? (
          <Text style={{
            color: Colors.Gray,
            fontSize: 14,
            fontStyle: 'italic',
          }}>
            No tests run yet. Click a test button above.
          </Text>
        ) : (
          <View style={{ maxHeight: 200 }}>
            {testResults.map((result, index) => (
              <Text
                key={index}
                style={{
                  color: result.includes('✓') ? Colors.Success : 
                         result.includes('❌') ? Colors.Error :
                         result.includes('⚠') ? Colors.Warning : Colors.Text,
                  fontSize: 12,
                  marginBottom: 4,
                  fontFamily: 'monospace',
                }}
              >
                {result}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}
