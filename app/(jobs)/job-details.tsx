import React from 'react'
import { View, Text, Pressable, Alert, ActivityIndicator, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { IconSymbol } from '@/components/IconSymbol'
import Avatar from '@/components/Avatar'
import { globalStyles } from '@/styles/globalStyles'
import { Colors } from '@/utils/colors'
import { webColors } from '@/styles/webDesignTokens'
import { appwriteConfig, db, ID } from '@/utils/appwrite'
import { JobChat, TagTemplate, JobTagAssignment } from '@/utils/types'
import { tagService } from '@/lib/appwrite/database'
import { useAuth } from '@/context/AuthContext'
import { useOrganization } from '@/context/OrganizationContext'
import { teamService } from '@/lib/appwrite/teams'
import { usePermissions } from '@/utils/permissions'
import { SquareChevronRight, SquareCheck } from 'lucide-react-native'

interface JobDetailsProps {
    jobId: string
    jobChat: JobChat | null
    onJobDeleted: () => void
    onStatusUpdate: (status: 'active' | 'completed') => Promise<void>
}

export default function JobDetails({ jobId, jobChat, onJobDeleted, onStatusUpdate }: JobDetailsProps) {
    const { user } = useAuth()
    const { currentTeam } = useOrganization()
    const { canDeleteJob, canManageTags } = usePermissions(jobChat?.createdBy)
    const router = useRouter()
    const [isCurrent, setIsCurrent] = React.useState(jobChat?.status === 'active' || jobChat?.status === undefined || false)
    const [isComplete, setIsComplete] = React.useState(jobChat?.status === 'completed' || false)
    const [isDeleting, setIsDeleting] = React.useState(false)
    
    // Tags state
    const [tagTemplates, setTagTemplates] = React.useState<TagTemplate[]>([])
    const [assignedTags, setAssignedTags] = React.useState<JobTagAssignment[]>([])
    const [isLoadingTags, setIsLoadingTags] = React.useState(true)
    
    // Team members state
    const [teamMembers, setTeamMembers] = React.useState<any[]>([])
    const [isLoadingMembers, setIsLoadingMembers] = React.useState(true)

    const loadTags = React.useCallback(async () => {
        console.log('🔍 JobDetails: Starting to load tags for jobId:', jobId)
        try {
            setIsLoadingTags(true)
            
            // Load available tag templates
            console.log('🔍 JobDetails: Loading tag templates...')
            const templatesResponse = await tagService.getActiveTagTemplates()
            console.log('🔍 JobDetails: Loaded', templatesResponse.documents.length, 'tag templates')
            setTagTemplates(templatesResponse.documents as any as TagTemplate[])
            
            // Try to load assigned tags for this job (collection might not exist yet)
            try {
                console.log('🔍 JobDetails: Loading job tag assignments...')
                const assignmentsResponse = await tagService.getJobTagAssignments(jobId)
                console.log('🔍 JobDetails: Loaded', assignmentsResponse.documents.length, 'tag assignments')
                setAssignedTags(assignmentsResponse.documents as any as JobTagAssignment[])
            } catch (assignmentError) {
                console.log('🔍 JobDetails: Job tag assignments collection not found, using empty assignments')
                setAssignedTags([])
            }
            
            console.log('🔍 JobDetails: Tags loaded successfully')
        } catch (error) {
            console.error('🔍 JobDetails: Error loading tags:', error)
            // Don't show alert for missing collections, just log it
            const message = (error as any)?.message as string | undefined
            if (!message?.includes('Collection with the requested ID could not be found')) {
                Alert.alert('Error', 'Failed to load tags. Please try again.')
            }
        } finally {
            console.log('🔍 JobDetails: Setting isLoadingTags to false')
            setIsLoadingTags(false)
        }
    }, [jobId])

    // Load tags when component mounts or jobId changes
    React.useEffect(() => {
        if (jobId) {
            loadTags()
        }
    }, [jobId, loadTags])

    // Load team members
    const loadTeamMembers = React.useCallback(async () => {
        try {
            setIsLoadingMembers(true)
            if (currentTeam?.$id) {
                const memberships = await teamService.listMemberships(currentTeam.$id)
                setTeamMembers(memberships.memberships)
            } else {
                setTeamMembers([])
            }
        } catch (error) {
            console.error('Error loading team members:', error)
            setTeamMembers([])
        } finally {
            setIsLoadingMembers(false)
        }
    }, [currentTeam])

    // Load team members when component mounts or team changes
    React.useEffect(() => {
        loadTeamMembers()
    }, [loadTeamMembers])

    // Helper function to get display name for a member
    const getMemberDisplayName = (member: any): string => {
        // Check userInfo first (from getUserInfo lookup)
        if (member.userInfo?.name) {
            return member.userInfo.name
        }
        
        // If userName exists and is not empty, use it
        if (member.userName && member.userName.trim()) {
            return member.userName.trim()
        }
        
        // Check for email in Appwrite membership object
        let email = member.userEmail || member.email || ''
        
        // Check for email in userInfo
        if ((!email || !email.includes('@')) && member.userInfo?.email) {
            email = member.userInfo.email
        }
        
        // Check for email in our custom membershipData (if we stored it)
        if ((!email || !email.includes('@')) && member.membershipData?.userEmail) {
            email = member.membershipData.userEmail
        }
        
        // If email exists, format it nicely
        if (email && email.includes('@')) {
            const emailName = email.split('@')[0]
            return emailName.charAt(0).toUpperCase() + emailName.slice(1)
        }
        
        // Use a more user-friendly fallback - format userId nicely
        const shortUserId = member.userId ? member.userId.slice(0, 8) : 'member'
        return `Member ${shortUserId}`
    }
    
    // Helper function to get profile picture for a member
    const getMemberProfilePicture = (member: any): string | undefined => {
        // Priority order for profile picture:
        // 1. membershipData.profilePicture (cached in our database from server script)
        // 2. member.profilePicture (from combined membership object)
        // 3. userInfo.profilePicture (legacy from users collection)
        if (member.membershipData?.profilePicture && member.membershipData.profilePicture.trim()) {
            return member.membershipData.profilePicture.trim()
        }
        
        if (member.profilePicture && member.profilePicture.trim()) {
            return member.profilePicture.trim()
        }
        
        if (member.userInfo?.profilePicture) {
            return member.userInfo.profilePicture
        }
        
        return undefined
    }

    // Update state when jobChat prop changes (e.g., when switching tabs)
    React.useEffect(() => {
        if (jobChat) {
            setIsCurrent(jobChat.status === 'active' || jobChat.status === undefined)
            setIsComplete(jobChat.status === 'completed' || false)
        }
    }, [jobChat])

    const isTagAssigned = (tagTemplateId: string) => {
        return assignedTags.some(assignment => assignment.tagTemplateId === tagTemplateId)
    }

    const handleEditTags = () => {
        router.push('/(jobs)/edit-tags')
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
            const message = (error as any)?.message as string | undefined
            if (message?.includes('Collection with the requested ID could not be found')) {
                Alert.alert(
                    'Tag Assignment Not Available', 
                    'Tag assignments are not set up yet. Please create the job_tag_assignments collection in Appwrite to enable this feature.'
                )
            } else if (message?.includes('Invalid query')) {
                Alert.alert(
                    'Query Error', 
                    `There's an issue with the job ID format. Job ID: "${jobId}" (type: ${typeof jobId}). Please check the collection configuration.`
                )
            } else {
                Alert.alert('Error', `Failed to update tag${message ? `: ${message}` : ''}`)
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
            await onStatusUpdate(checked ? (status === 'current' ? 'active' : 'completed') : 'active')
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
            // Check permission before deleting
            if (!canDeleteJob) {
                console.error('🔍 JobDetails: Permission denied: User cannot delete this job')
                Alert.alert(
                    'Permission Denied', 
                    'Only job owners or the job creator can delete jobs.'
                )
                setIsDeleting(false)
                return
            }

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
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Job Title */}
                <View style={{ marginBottom: 24 }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 8
                    }}>
                        <Text style={{
                        fontSize: 16,
                        fontWeight: '500',
                        color: Colors.Gray,
                        }}>
                            Title
                        </Text>
                        <Pressable onPress={() => router.push({
                            pathname: '/(jobs)/edit-job-title',
                            params: { 
                                jobId: jobId,
                                currentTitle: jobChat?.title || `Job ${jobId}`
                            }
                        })}>
                            <IconSymbol name="pencil" color={Colors.Gray} size={20} />
                        </Pressable>
                    </View>
                    <Text style={{
                        fontSize: 16,
                        color: Colors.Gray,
                    }}>
                        {jobChat?.title || `Job ${jobId}`}
                    </Text>
                </View>

            {/* Job Status Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Job Status</Text>
                <View style={styles.card}>
                    <Pressable
                        style={[styles.listItem, styles.listItemDivider]}
                        onPress={() => handleStatusChange('current', !isCurrent)}
                    >
                        <View style={styles.itemContent}>
                            <View style={[
                                styles.statusIconContainer,
                                styles.statusIconContainerActive
                            ]}>
                                <SquareChevronRight
                                    size={16}
                                    color="#22c55e" // green to match muted background
                                />
                            </View>
                        <Text style={[styles.itemText, isCurrent && styles.itemTextSelected]}>
                            Current
                        </Text>
                        </View>
                        <View style={[
                            styles.checkbox,
                            styles.checkboxTrailing,
                            isCurrent && styles.checkboxSelected
                        ]}>
                            {isCurrent && (
                                <IconSymbol name="checkmark" color={Colors.White} size={16} />
                            )}
                        </View>
                    </Pressable>
                    <Pressable
                        style={styles.listItem}
                        onPress={() => handleStatusChange('complete', !isComplete)}
                    >
                        <View style={styles.itemContent}>
                            <View style={[
                                styles.statusIconContainer,
                                styles.statusIconContainerCompleted
                            ]}>
                                <SquareCheck
                                    size={16}
                                    color={webColors.accent} // cyan to match muted background
                                />
                            </View>
                            <Text style={[styles.itemText, isComplete && styles.itemTextSelected]}>
                                Complete
                            </Text>
                        </View>
                        <View style={[
                            styles.checkbox,
                            styles.checkboxTrailing,
                            isComplete && styles.checkboxSelected
                        ]}>
                            {isComplete && (
                                <IconSymbol name="checkmark" color={Colors.White} size={16} />
                            )}
                        </View>
                    </Pressable>
                </View>
            </View>

            {/* Tags Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Tags</Text>
                    {canManageTags && (
                        <Pressable onPress={handleEditTags}>
                            <IconSymbol name="pencil" color={Colors.Gray} size={20} />
                        </Pressable>
                    )}
                </View>

                {isLoadingTags ? (
                    <View style={[styles.card, styles.placeholderCard]}>
                        <ActivityIndicator size="small" color={Colors.Primary} />
                        <Text style={[styles.placeholderText, styles.placeholderMargin]}>Loading tags...</Text>
                    </View>
                ) : tagTemplates.length === 0 ? (
                    <View style={[styles.card, styles.placeholderCard]}>
                        <Text style={styles.placeholderText}>
                            No tags available. Contact your administrator to set up tags.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.card}>
                        {tagTemplates.map((tag, index) => {
                            const isAssigned = isTagAssigned(tag.$id)
                            const showDivider = index < tagTemplates.length - 1
                            return (
                                <Pressable
                                    key={tag.$id}
                                    style={[styles.listItem, showDivider && styles.listItemDivider]}
                                    onPress={() => handleTagToggle(tag.$id)}
                                >
                                    <View style={styles.itemContent}>
                                        <IconSymbol 
                                            name={(tag.icon as any) || 'circle'} 
                                            color={tag.color} 
                                            size={16} 
                                            style={styles.tagIcon}
                                        />
                                        <Text style={styles.itemText}>
                                            {tag.name}
                                        </Text>
                                    </View>
                                    <View style={[
                                        styles.checkbox,
                                        styles.checkboxTrailing,
                                        isAssigned && styles.checkboxSelected
                                    ]}>
                                        {isAssigned && (
                                            <IconSymbol name="checkmark" color={Colors.White} size={16} />
                                        )}
                                    </View>
                                </Pressable>
                            )
                        })}
                    </View>
                )}
            </View>

            {/* Team Members Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Team Members</Text>
                    <Pressable onPress={() => router.push('/(jobs)/team')}>
                        <IconSymbol name="pencil" color={Colors.Gray} size={20} />
                    </Pressable>
                </View>

                {isLoadingMembers ? (
                    <View style={[styles.card, styles.placeholderCard]}>
                        <ActivityIndicator size="small" color={Colors.Primary} />
                        <Text style={[styles.placeholderText, styles.placeholderMargin]}>
                            Loading team members...
                        </Text>
                    </View>
                ) : teamMembers.length === 0 ? (
                    <View style={[styles.card, styles.placeholderCard]}>
                        <Text style={styles.placeholderText}>
                            No team members found. Please select a team.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.card}>
                        {teamMembers.map((member, index) => {
                            const memberName = getMemberDisplayName(member)
                            const memberProfilePicture = getMemberProfilePicture(member)
                            const memberRole = member.membershipData?.role || member.roles?.[0] || 'member'
                            const showDivider = index < teamMembers.length - 1
                            
                            return (
                                <View
                                    key={member.$id || member.userId || index}
                                    style={[styles.listItem, showDivider && styles.listItemDivider]}
                                >
                                    <View style={styles.memberInfo}>
                                        <Avatar 
                                            name={memberName}
                                            imageUrl={memberProfilePicture}
                                            size={40}
                                        />
                                        <View style={styles.memberTextWrapper}>
                                            <Text style={styles.memberName}>
                                                {memberName}
                                            </Text>
                                            <Text style={styles.memberRole}>
                                                {memberRole}
                                            </Text>
                                        </View>
                                    </View>
                                    {member.userId === jobChat?.createdBy && (
                                        <View style={styles.creatorBadge}>
                                            <IconSymbol name="checkmark" color={Colors.White} size={16} />
                                        </View>
                                    )}
                                </View>
                            )
                        })}
                    </View>
                )}
            </View>

                {/* Delete Job Section */}
                <View style={{ marginTop: 12, paddingBottom: 20 }}>
                    {canDeleteJob && (
                        <Pressable
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingVertical: 16,
                                paddingHorizontal: 20,
                            backgroundColor: Colors.Primary,
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
                    )}
                </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.Gray,
    },
    card: {
        backgroundColor: Colors.Secondary,
        borderRadius: 16,
        overflow: 'hidden',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    listItemDivider: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.Border,
    },
    itemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    itemText: {
        color: Colors.Text,
        fontSize: 16,
    },
    itemTextSelected: {
        fontWeight: '600',
    },
    indicator: {
        fontSize: 20,
    },
    statusIconContainer: {
        width: 20,
        height: 20,
        borderRadius: 3,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    statusIconContainerActive: {
        backgroundColor: 'rgba(34, 197, 94, 0.15)', // muted green (like Owner pill)
    },
    statusIconContainerCompleted: {
        backgroundColor: 'rgba(40, 247, 248, 0.15)', // muted cyan (like Member pill)
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: Colors.Gray,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    checkboxLeading: {
        marginRight: 12,
    },
    checkboxTrailing: {
        marginLeft: 12,
    },
    checkboxSelected: {
        borderColor: Colors.Primary,
        backgroundColor: Colors.Primary,
    },
    tagIcon: {
        marginRight: 12,
    },
    placeholderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    placeholderText: {
        color: Colors.Gray,
        fontSize: 14,
        textAlign: 'center',
    },
    placeholderMargin: {
        marginLeft: 8,
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    memberTextWrapper: {
        flex: 1,
        marginLeft: 12,
    },
    memberName: {
        color: Colors.Text,
        fontSize: 16,
        fontWeight: '600',
    },
    memberRole: {
        color: Colors.Gray,
        fontSize: 14,
        textTransform: 'capitalize',
    },
    creatorBadge: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: Colors.Primary,
        borderRadius: 4,
        backgroundColor: Colors.Primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
})
