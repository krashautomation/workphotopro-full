import React from 'react'
import { View, Text, Pressable, Alert, ActivityIndicator } from 'react-native'
import { IconSymbol } from '@/components/IconSymbol'
import Avatar from '@/components/Avatar'
import { globalStyles } from '@/styles/globalStyles'
import { Colors } from '@/utils/colors'
import { appwriteConfig, db, ID } from '@/utils/appwrite'
import { JobChat } from '@/utils/types'

interface JobDetailsProps {
    jobId: string
    jobChat: JobChat | null
    onJobDeleted: () => void
    onStatusUpdate: (status: 'current' | 'complete') => Promise<void>
}

export default function JobDetails({ jobId, jobChat, onJobDeleted, onStatusUpdate }: JobDetailsProps) {
    const [isCurrent, setIsCurrent] = React.useState(jobChat?.status === 'current' || jobChat?.status === undefined || false)
    const [isComplete, setIsComplete] = React.useState(jobChat?.status === 'complete' || false)
    const [isDeleting, setIsDeleting] = React.useState(false)
    
    // Tags state
    const [yellowTag, setYellowTag] = React.useState(false)
    const [blueTag, setBlueTag] = React.useState(false)
    const [redTag, setRedTag] = React.useState(false)

    // Update state when jobChat prop changes (e.g., when switching tabs)
    React.useEffect(() => {
        if (jobChat) {
            setIsCurrent(jobChat.status === 'current' || jobChat.status === undefined)
            setIsComplete(jobChat.status === 'complete' || false)
        }
    }, [jobChat])

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
        <View style={{ flex: 1, padding: 20 }}>
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

                {/* Yellow Tag */}
                <Pressable
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        backgroundColor: Colors.Secondary,
                        borderRadius: 12,
                        marginBottom: 12,
                    }}
                    onPress={() => setYellowTag(!yellowTag)}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <IconSymbol name="circle" color="#FFD700" size={16} />
                        <Text style={{
                            color: Colors.Text,
                            fontSize: 16,
                            marginLeft: 12,
                        }}>
                            Yellow
                        </Text>
                    </View>
                    <View style={{
                        width: 24,
                        height: 24,
                        borderWidth: 2,
                        borderColor: yellowTag ? Colors.Primary : Colors.Gray,
                        borderRadius: 4,
                        backgroundColor: yellowTag ? Colors.Primary : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        {yellowTag && (
                            <IconSymbol name="checkmark" color={Colors.White} size={16} />
                        )}
                    </View>
                </Pressable>

                {/* Blue Tag */}
                <Pressable
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        backgroundColor: Colors.Secondary,
                        borderRadius: 12,
                        marginBottom: 12,
                    }}
                    onPress={() => setBlueTag(!blueTag)}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <IconSymbol name="circle" color="#007AFF" size={16} />
                        <Text style={{
                            color: Colors.Text,
                            fontSize: 16,
                            marginLeft: 12,
                        }}>
                            Blue
                        </Text>
                    </View>
                    <View style={{
                        width: 24,
                        height: 24,
                        borderWidth: 2,
                        borderColor: blueTag ? Colors.Primary : Colors.Gray,
                        borderRadius: 4,
                        backgroundColor: blueTag ? Colors.Primary : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        {blueTag && (
                            <IconSymbol name="checkmark" color={Colors.White} size={16} />
                        )}
                    </View>
                </Pressable>

                {/* Red Tag */}
                <Pressable
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        backgroundColor: Colors.Secondary,
                        borderRadius: 12,
                    }}
                    onPress={() => setRedTag(!redTag)}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <IconSymbol name="circle" color="#FF3B30" size={16} />
                        <Text style={{
                            color: Colors.Text,
                            fontSize: 16,
                            marginLeft: 12,
                        }}>
                            Red
                        </Text>
                    </View>
                    <View style={{
                        width: 24,
                        height: 24,
                        borderWidth: 2,
                        borderColor: redTag ? Colors.Primary : Colors.Gray,
                        borderRadius: 4,
                        backgroundColor: redTag ? Colors.Primary : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        {redTag && (
                            <IconSymbol name="checkmark" color={Colors.White} size={16} />
                        )}
                    </View>
                </Pressable>
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
                            name={jobChat?.createdBy || 'Unknown User'}
                            size={40}
                        />
                        <Text style={{
                            color: Colors.Text,
                            fontSize: 16,
                            marginLeft: 12,
                        }}>
                            {jobChat?.createdBy || 'Unknown User'}
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
            <View style={{ marginTop: 'auto', paddingBottom: 20 }}>
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
        </View>
    )
}
