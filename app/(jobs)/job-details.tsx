import React from 'react'
import { View, Text, Pressable, Alert, ActivityIndicator, ScrollView } from 'react-native'
import { IconSymbol } from '@/components/IconSymbol'
import Avatar from '@/components/Avatar'
import { globalStyles } from '@/styles/globalStyles'
import { Colors } from '@/utils/colors'
import { appwriteConfig, db, ID } from '@/utils/appwrite'
import { JobChat, TagTemplate, JobTagAssignment } from '@/utils/types'
import { tagService } from '@/lib/appwrite/database'
import { useAuth } from '@/context/AuthContext'

interface JobDetailsProps {
    jobId: string
    jobChat: JobChat | null
    onJobDeleted: () => void
    onStatusUpdate: (status: 'current' | 'complete') => Promise<void>
}

export default function JobDetails({ jobId, jobChat, onJobDeleted, onStatusUpdate }: JobDetailsProps) {
    const { user } = useAuth()
    const [isCurrent, setIsCurrent] = React.useState(jobChat?.status === 'current' || jobChat?.status === undefined || false)
    const [isComplete, setIsComplete] = React.useState(jobChat?.status === 'complete' || false)
    const [isDeleting, setIsDeleting] = React.useState(false)
    
    // Tags state
    const [tagTemplates, setTagTemplates] = React.useState<TagTemplate[]>([])
    const [assignedTags, setAssignedTags] = React.useState<JobTagAssignment[]>([])
    const [isLoadingTags, setIsLoadingTags] = React.useState(true)

    // Load tags when component mounts or jobId changes
    React.useEffect(() => {
        if (jobId) {
            loadTags()
        }
    }, [jobId, loadTags])

    // Update state when jobChat prop changes (e.g., when switching tabs)
    React.useEffect(() => {
        if (jobChat) {
            setIsCurrent(jobChat.status === 'current' || jobChat.status === undefined)
            setIsComplete(jobChat.status === 'complete' || false)
        }
    }, [jobChat])

    const loadTags = React.useCallback(async () => {
        console.log('🔍 JobDetails: Starting to load tags for jobId:', jobId)
        try {
            setIsLoadingTags(true)
            
            // Load available tag templates
            console.log('🔍 JobDetails: Loading tag templates...')
            const templatesResponse = await tagService.getActiveTagTemplates()
            console.log('🔍 JobDetails: Loaded', templatesResponse.documents.length, 'tag templates')
            setTagTemplates(templatesResponse.documents)
            
            // Try to load assigned tags for this job (collection might not exist yet)
            try {
                console.log('🔍 JobDetails: Loading job tag assignments...')
                const assignmentsResponse = await tagService.getJobTagAssignments(jobId)
                console.log('🔍 JobDetails: Loaded', assignmentsResponse.documents.length, 'tag assignments')
                setAssignedTags(assignmentsResponse.documents)
            } catch (assignmentError) {
                console.log('🔍 JobDetails: Job tag assignments collection not found, using empty assignments')
                setAssignedTags([])
            }
            
            console.log('🔍 JobDetails: Tags loaded successfully')
        } catch (error) {
            console.error('🔍 JobDetails: Error loading tags:', error)
            // Don't show alert for missing collections, just log it
            if (!error.message?.includes('Collection with the requested ID could not be found')) {
                Alert.alert('Error', 'Failed to load tags. Please try again.')
            }
        } finally {
            console.log('🔍 JobDetails: Setting isLoadingTags to false')
            setIsLoadingTags(false)
        }
    }, [jobId])

    const isTagAssigned = (tagTemplateId: string) => {
        return assignedTags.some(assignment => assignment.tagTemplateId === tagTemplateId)
    }

    const handleTagToggle = async (tagTemplateId: string) => {
        if (!user?.$id) {
            Alert.alert('Error', 'User not authenticated')
            return
        }

        console.log('🔍 JobDetails: Toggling tag for jobId:', jobId, 'tagTemplateId:', tagTemplateId)
        console.log('🔍 JobDetails: jobId type:', typeof jobId, 'value:', jobId)

        try {
            const isAssigned = isTagAssigned(tagTemplateId)
            console.log('🔍 JobDetails: Tag is currently assigned:', isAssigned)
            
            if (isAssigned) {
                // Remove tag assignment
                console.log('🔍 JobDetails: Removing tag assignment...')
                await tagService.removeTagFromJob(jobId, tagTemplateId)
                setAssignedTags(prev => prev.filter(assignment => assignment.tagTemplateId !== tagTemplateId))
                console.log('🔍 JobDetails: Tag assignment removed successfully')
            } else {
                // Add tag assignment
                console.log('🔍 JobDetails: Adding tag assignment...')
                await tagService.assignTagToJob(jobId, tagTemplateId, user.$id)
                const newAssignment = {
                    $id: '', // Will be set by the server
                    jobId,
                    tagTemplateId,
                    assignedBy: user.$id,
                    assignedAt: new Date().toISOString(),
                    isActive: true,
                } as JobTagAssignment
                setAssignedTags(prev => [...prev, newAssignment])
                console.log('🔍 JobDetails: Tag assignment added successfully')
            }
        } catch (error) {
            console.error('🔍 JobDetails: Error toggling tag:', error)
            if (error.message?.includes('Collection with the requested ID could not be found')) {
                Alert.alert(
                    'Tag Assignment Not Available', 
                    'Tag assignments are not set up yet. Please create the job_tag_assignments collection in Appwrite to enable this feature.'
                )
            } else if (error.message?.includes('Invalid query')) {
                Alert.alert(
                    'Query Error', 
                    `There's an issue with the job ID format. Job ID: "${jobId}" (type: ${typeof jobId}). Please check the collection configuration.`
                )
            } else {
                Alert.alert('Error', `Failed to update tag: ${error.message}`)
            }
        }
    }

    const handleStatusChange = async (status: 'current' | 'complete', checked: boolean) => {
        try {
            // Update the other status to be opposite
            if (status === 'current') {
                setIsCurrent(checked)
                setIsComplete(!checked)
            } else {
                setIsComplete(checked)
                setIsCurrent(!checked)
            }

            // Use the parent's update function to maintain consistency across tabs
            await onStatusUpdate(checked ? status : 'current')
        } catch (error) {
            console.error('Error updating job status:', error)
            Alert.alert('Error', 'Failed to update job status. Please try again.')
            
            // Revert the state on error
            if (status === 'current') {
                setIsCurrent(!checked)
                setIsComplete(checked)
            } else {
                setIsComplete(!checked)
                setIsCurrent(checked)
            }
        }
    }

    const handleDeleteJob = () => {
        Alert.alert(
            'Delete Job',
            'Are you sure you want to delete this job? This action cannot be undone.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: confirmDeleteJob,
                },
            ]
        )
    }

    const confirmDeleteJob = async () => {
        setIsDeleting(true)
        try {
            console.log('🔍 JobDetails: Starting soft delete for jobId:', jobId)
            console.log('🔍 JobDetails: Database ID:', appwriteConfig.db)
            console.log('🔍 JobDetails: Collection ID:', appwriteConfig.col.jobchat)
            
            // Soft delete the job by setting deletedAt timestamp
            await db.updateDocument(
                appwriteConfig.db,
                appwriteConfig.col.jobchat,
                jobId,
                {
                    deletedAt: new Date().toISOString(),
                }
            )
            
            console.log('🔍 JobDetails: Soft delete successful')
            
            // Show success message first
            Alert.alert('Success', 'Job has been deleted successfully.')
            
            // Small delay to ensure database update propagates, then navigate back
            setTimeout(() => {
                onJobDeleted()
            }, 500)
        } catch (error) {
            console.error('🔍 JobDetails: Error deleting job:', error)
            console.error('🔍 JobDetails: Error details:', {
                jobId,
                dbId: appwriteConfig.db,
                collectionId: appwriteConfig.col.jobchat,
                errorMessage: error instanceof Error ? error.message : 'Unknown error'
            })
            Alert.alert('Error', 'Failed to delete job. Please try again.')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <View style={{ flex: 1 }}>
            <ScrollView 
                style={{ flex: 1 }} 
                contentContainerStyle={{ padding: 20 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Job Title */}
                <View style={{ marginBottom: 30 }}>
                    <Text style={{
                        fontSize: 24,
                        fontWeight: 'bold',
                        color: Colors.Text,
                        marginBottom: 8
                    }}>
                        {jobChat?.title || `Job ${jobId}`}
                    </Text>
                    <Text style={{
                        fontSize: 16,
                        color: Colors.Gray,
                    }}>
                        Job ID: {jobId}
                    </Text>
                </View>

            {/* Job Status Section */}
            <View style={{ marginBottom: 40 }}>
                <Text style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: Colors.Text,
                    marginBottom: 20
                }}>
                    Job Status
                </Text>

                {/* Current Status Checkbox */}
                <Pressable
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        backgroundColor: Colors.Secondary,
                        borderRadius: 12,
                        marginBottom: 12,
                        borderWidth: 2,
                        borderColor: isCurrent ? Colors.Primary : 'transparent',
                    }}
                    onPress={() => handleStatusChange('current', !isCurrent)}
                >
                    <View style={{
                        width: 24,
                        height: 24,
                        borderWidth: 2,
                        borderColor: isCurrent ? Colors.Primary : Colors.Gray,
                        borderRadius: 4,
                        backgroundColor: isCurrent ? Colors.Primary : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                    }}>
                        {isCurrent && (
                            <IconSymbol name="checkmark" color={Colors.White} size={16} />
                        )}
                    </View>
                    <Text style={{
                        color: Colors.Text,
                        fontSize: 16,
                        fontWeight: isCurrent ? '600' : '400',
                    }}>
                        Current
                    </Text>
                </Pressable>

                {/* Complete Status Checkbox */}
                <Pressable
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        backgroundColor: Colors.Secondary,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: isComplete ? Colors.Primary : 'transparent',
                    }}
                    onPress={() => handleStatusChange('complete', !isComplete)}
                >
                    <View style={{
                        width: 24,
                        height: 24,
                        borderWidth: 2,
                        borderColor: isComplete ? Colors.Primary : Colors.Gray,
                        borderRadius: 4,
                        backgroundColor: isComplete ? Colors.Primary : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                    }}>
                        {isComplete && (
                            <IconSymbol name="checkmark" color={Colors.White} size={16} />
                        )}
                    </View>
                    <Text style={{
                        color: Colors.Text,
                        fontSize: 16,
                        fontWeight: isComplete ? '600' : '400',
                    }}>
                        Complete
                    </Text>
                </Pressable>
            </View>

            {/* Tags Section */}
            <View style={{ marginBottom: 40 }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 20
                }}>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: '600',
                        color: Colors.Text,
                    }}>
                        Tags
                    </Text>
                    <IconSymbol name="pencil" color="#007AFF" size={20} />
                </View>

                {isLoadingTags ? (
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 20,
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
                        paddingVertical: 20,
                        alignItems: 'center',
                    }}>
                        <Text style={{
                            color: Colors.Gray,
                            fontSize: 14,
                            textAlign: 'center',
                        }}>
                            No tags available. Contact your administrator to set up tags.
                        </Text>
                    </View>
                ) : (
                    tagTemplates.map((tag, index) => {
                        const isAssigned = isTagAssigned(tag.$id)
                        return (
                            <Pressable
                                key={tag.$id}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    paddingVertical: 12,
                                    paddingHorizontal: 16,
                                    backgroundColor: Colors.Secondary,
                                    borderRadius: 12,
                                    marginBottom: index < tagTemplates.length - 1 ? 12 : 0,
                                }}
                                onPress={() => handleTagToggle(tag.$id)}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <IconSymbol 
                                        name={tag.icon || "circle"} 
                                        color={tag.color} 
                                        size={16} 
                                    />
                                    <Text style={{
                                        color: Colors.Text,
                                        fontSize: 16,
                                        marginLeft: 12,
                                    }}>
                                        {tag.name}
                                    </Text>
                                    {tag.description && (
                                        <Text style={{
                                            color: Colors.Gray,
                                            fontSize: 12,
                                            marginLeft: 8,
                                        }}>
                                            ({tag.description})
                                        </Text>
                                    )}
                                </View>
                                <View style={{
                                    width: 24,
                                    height: 24,
                                    borderWidth: 2,
                                    borderColor: isAssigned ? Colors.Primary : Colors.Gray,
                                    borderRadius: 4,
                                    backgroundColor: isAssigned ? Colors.Primary : 'transparent',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    {isAssigned && (
                                        <IconSymbol name="checkmark" color={Colors.White} size={16} />
                                    )}
                                </View>
                            </Pressable>
                        )
                    })
                )}
            </View>

            {/* Team Members Section */}
            <View style={{ marginBottom: 40 }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 20
                }}>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: '600',
                        color: Colors.Text,
                    }}>
                        Team Members
                    </Text>
                    <IconSymbol name="pencil" color="#007AFF" size={20} />
                </View>

                {/* Job Creator */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor: Colors.Secondary,
                    borderRadius: 12,
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Avatar 
                            name={jobChat?.createdByName || 'Unknown User'}
                            size={40}
                        />
                        <Text style={{
                            color: Colors.Text,
                            fontSize: 16,
                            marginLeft: 12,
                        }}>
                            {jobChat?.createdByName || 'Unknown User'}
                        </Text>
                    </View>
                    <View style={{
                        width: 24,
                        height: 24,
                        borderWidth: 2,
                        borderColor: Colors.Primary,
                        borderRadius: 4,
                        backgroundColor: Colors.Primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <IconSymbol name="checkmark" color={Colors.White} size={16} />
                    </View>
                </View>
            </View>

                {/* Delete Job Section */}
                <View style={{ marginTop: 40, paddingBottom: 20 }}>
                    <Pressable
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingVertical: 16,
                            paddingHorizontal: 20,
                            backgroundColor: '#FF3B30',
                            borderRadius: 12,
                            opacity: isDeleting ? 0.7 : 1,
                        }}
                        onPress={handleDeleteJob}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <ActivityIndicator size="small" color={Colors.White} />
                        ) : (
                            <>
                                <IconSymbol name="trash" color={Colors.White} size={20} />
                                <Text style={{
                                    color: Colors.White,
                                    fontSize: 16,
                                    fontWeight: '600',
                                    marginLeft: 8,
                                }}>
                                    Delete Job
                                </Text>
                            </>
                        )}
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    )
}
