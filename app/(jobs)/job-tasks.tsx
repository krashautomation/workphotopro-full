import React from 'react'
import { FlatList, Image, Linking, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Colors } from '@/utils/colors'
import { CalendarCheck, LayoutList } from 'lucide-react-native'
import { Message } from '@/utils/types'
import { IconSymbol } from '@/components/IconSymbol'
import Avatar from '@/components/Avatar'
import { appwriteConfig } from '@/utils/appwrite'
import VideoPlayer from '@/components/VideoPlayer'
import AudioPlayer from '@/components/AudioPlayer'
import { webColors } from '@/styles/webDesignTokens'

type JobTasksProps = {
    jobId: string
    messages: Message[]
    currentUserId?: string
    onCompleteTask: (messageId: string) => Promise<void>
}

type SubTab = 'tasks' | 'duties'

export default function JobTasks({ jobId, messages, currentUserId, onCompleteTask }: JobTasksProps) {
    const [activeSubTab, setActiveSubTab] = React.useState<SubTab>('tasks')
    
    // Lighter, brighter blue for task highlighting
    const taskBlue = '#3b82f6'; // Bright blue-500
    
    // Filter and sort tasks
    const tasks = React.useMemo(() => {
        const taskMessages = messages.filter((msg) => msg.isTask === true)
        
        // Sort: active first, then completed (both by creation date)
        return [...taskMessages].sort((a, b) => {
            const aActive = a.taskStatus === 'active'
            const bActive = b.taskStatus === 'active'
            
            if (aActive !== bActive) {
                return aActive ? -1 : 1 // Active tasks first
            }
            
            // Same status, sort by creation date (oldest first)
            return new Date(a.$createdAt).getTime() - new Date(b.$createdAt).getTime()
        })
    }, [messages])

    const activeTasks = tasks.filter((t) => t.taskStatus === 'active')
    const completedTasks = tasks.filter((t) => t.taskStatus === 'completed')

    const renderTask = ({ item }: { item: Message }) => {
        const isSender = item.senderId === currentUserId
        const isCompleted = item.taskStatus === 'completed'

        return (
            <View style={[
                styles.taskItem,
                isCompleted && styles.taskItemCompleted,
                !isCompleted && { borderColor: taskBlue }
            ]}>
                {/* Task Header */}
                <View style={styles.taskHeader}>
                    <View style={styles.taskHeaderLeft}>
                        <IconSymbol 
                            name={isCompleted ? 'checkmark.circle.fill' : 'circle'} 
                            color={isCompleted ? Colors.Gray : taskBlue} 
                            size={16} 
                        />
                        <Text style={[
                            styles.taskStatusBadge,
                            isCompleted && styles.taskStatusBadgeCompleted,
                            !isCompleted && { color: taskBlue }
                        ]}>
                            {isCompleted ? 'Completed' : 'Active'}
                        </Text>
                        {!isSender && (
                            <Avatar 
                                name={item.senderName || 'Unknown User'}
                                imageUrl={item.senderPhoto}
                                size={20}
                                style={{ marginLeft: 6 }}
                            />
                        )}
                        <Text style={[
                            styles.taskCreator,
                            isCompleted && styles.taskCreatorCompleted
                        ]} numberOfLines={1}>
                            {item.senderName}
                        </Text>
                        <Text style={[
                            styles.taskTimestamp,
                            isCompleted && styles.taskTimestampCompleted
                        ]}>
                            • {new Date(item.$createdAt).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </Text>
                    </View>
                    {!isCompleted && isSender && (
                        <TouchableOpacity
                            onPress={() => onCompleteTask(item.$id)}
                            style={[styles.completeButton, { backgroundColor: taskBlue + '20' }]}
                        >
                            <Text style={[styles.completeButtonText, { color: taskBlue }]}>Complete</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Task Content */}
                {item.content && (
                    <Text style={[
                        styles.taskContent,
                        isCompleted && styles.taskContentCompleted
                    ]} numberOfLines={3}>
                        {item.content}
                    </Text>
                )}

                {/* Task Attachments */}
                {item.imageUrl && item.content !== 'Message deleted by user' && (
                    <Image 
                        source={{ uri: item.imageUrl }} 
                        style={styles.taskImage}
                        resizeMode="cover"
                    />
                )}

                {item.videoFileId && item.content !== 'Message deleted by user' && (
                    <View style={styles.taskVideo}>
                        <VideoPlayer
                            uri={appwriteConfig.bucket ? `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucket}/files/${item.videoFileId}/view?project=${appwriteConfig.projectId}` : ''}
                            showControls={true}
                            autoPlay={false}
                        />
                    </View>
                )}

                {item.audioFileId && item.content !== 'Message deleted by user' && (
                    <AudioPlayer
                        uri={item.audioUrl || (appwriteConfig.bucket ? `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucket}/files/${item.audioFileId}/view?project=${appwriteConfig.projectId}` : '')}
                        duration={item.audioDuration}
                    />
                )}

                {item.fileFileId && item.content !== 'Message deleted by user' && (
                    <TouchableOpacity 
                        onPress={() => {
                            const fileUrl = item.fileUrl || `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucket}/files/${item.fileFileId}/view?project=${appwriteConfig.projectId}`
                            Linking.openURL(fileUrl)
                        }}
                        style={[styles.taskFile, { borderColor: taskBlue }]}
                    >
                        <IconSymbol name="doc.text" color={taskBlue} size={18} />
                        <View style={styles.taskFileInfo}>
                            <Text style={[styles.taskFileName, { color: taskBlue }]} numberOfLines={1}>{item.fileName || 'Document'}</Text>
                            {item.fileSize && (
                                <Text style={styles.taskFileSize}>
                                    {(item.fileSize / 1024).toFixed(2)} KB
                                </Text>
                            )}
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        )
    }

    const renderDutiesContent = () => {
        return (
            <View style={styles.content}>
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <LayoutList color={Colors.Primary} size={24} />
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.sectionTitle}>Duties</Text>
                            <Text style={styles.sectionDescription}>Ongoing job duties</Text>
                        </View>
                    </View>
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyTitle}>No duties yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Duties created in this job will show up here.
                        </Text>
                    </View>
                </View>
            </View>
        )
    }

    const renderTasksContent = () => {
        return (
            <View style={styles.content}>
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <CalendarCheck color={Colors.Primary} size={24} />
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.sectionTitle}>Tasks</Text>
                            <Text style={styles.sectionDescription}>
                                {tasks.length > 0 
                                    ? `${activeTasks.length} active, ${completedTasks.length} completed`
                                    : 'Current tasks in this job'
                                }
                            </Text>
                        </View>
                    </View>
                    
                    {tasks.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>No tasks yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Tasks created in this job will show up here.
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={tasks}
                            renderItem={renderTask}
                            keyExtractor={(item) => item.$id}
                            contentContainerStyle={styles.tasksList}
                            showsVerticalScrollIndicator={false}
                            ItemSeparatorComponent={() => <View style={styles.taskSeparator} />}
                        />
                    )}
                </View>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            {/* Sub-tabs */}
            <View style={styles.subTabsContainer}>
                <Pressable
                    style={[
                        styles.subTab,
                        activeSubTab === 'tasks' && styles.subTabActive,
                    ]}
                    onPress={() => setActiveSubTab('tasks')}
                >
                    <Text
                        style={[
                            styles.subTabText,
                            activeSubTab === 'tasks' && styles.subTabTextActive,
                        ]}
                    >
                        Tasks
                    </Text>
                </Pressable>
                <Pressable
                    style={[
                        styles.subTab,
                        activeSubTab === 'duties' && styles.subTabActive,
                    ]}
                    onPress={() => setActiveSubTab('duties')}
                >
                    <Text
                        style={[
                            styles.subTabText,
                            activeSubTab === 'duties' && styles.subTabTextActive,
                        ]}
                    >
                        Duties
                    </Text>
                </Pressable>
            </View>

            {/* Content */}
            <View style={styles.tabContent}>
                {activeSubTab === 'tasks' && renderTasksContent()}
                {activeSubTab === 'duties' && renderDutiesContent()}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.Background,
    },
    subTabsContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.Secondary,
        borderBottomWidth: 1,
        borderBottomColor: Colors.Gray,
    },
    subTab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    subTabActive: {
        borderBottomColor: webColors.primary,
    },
    subTabText: {
        color: Colors.Gray,
        fontSize: 14,
        fontWeight: '400',
    },
    subTabTextActive: {
        color: webColors.primary,
        fontWeight: '600',
    },
    tabContent: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 32,
        flex: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.Gray,
    },
    headerTextContainer: {
        flex: 1,
    },
    sectionTitle: {
        color: Colors.Text,
        fontSize: 20,
        fontWeight: '600',
    },
    sectionDescription: {
        color: Colors.Gray,
        fontSize: 14,
        marginTop: 2,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        paddingHorizontal: 24,
    },
    emptyTitle: {
        color: Colors.Text,
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptySubtitle: {
        color: Colors.Gray,
        fontSize: 14,
        textAlign: 'center',
    },
    tasksList: {
        paddingVertical: 4,
    },
    taskItem: {
        backgroundColor: Colors.Secondary,
        borderRadius: 8,
        padding: 10,
        borderWidth: 1,
        borderColor: '#3b82f6', // Bright blue for tasks (will be overridden by inline styles)
    },
    taskItemCompleted: {
        borderColor: Colors.Gray,
        opacity: 0.7,
    },
    taskSeparator: {
        height: 8,
    },
    taskHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    taskHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 6,
        flexWrap: 'wrap',
    },
    taskStatusBadge: {
        color: '#3b82f6', // Bright blue for tasks (will be overridden by inline styles)
        fontWeight: '600',
        fontSize: 10,
        textTransform: 'uppercase',
    },
    taskStatusBadgeCompleted: {
        color: Colors.Gray,
    },
    taskCreator: {
        color: Colors.Text,
        fontWeight: '600',
        fontSize: 13,
        flexShrink: 0,
    },
    taskCreatorCompleted: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
    completeButton: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: '#3b82f620', // Bright blue for tasks (will be overridden by inline styles)
    },
    completeButtonText: {
        color: '#3b82f6', // Bright blue for tasks (will be overridden by inline styles)
        fontSize: 11,
        fontWeight: '600',
    },
    taskContent: {
        color: Colors.Text,
        fontSize: 14,
        lineHeight: 18,
        marginBottom: 8,
    },
    taskContentCompleted: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
    taskImage: {
        width: '100%',
        height: 150,
        borderRadius: 6,
        marginBottom: 8,
    },
    taskVideo: {
        width: '100%',
        marginBottom: 8,
        borderRadius: 6,
        overflow: 'hidden',
    },
    taskFile: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.Background,
        padding: 8,
        borderRadius: 6,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#3b82f6', // Bright blue for tasks (will be overridden by inline styles)
        gap: 8,
    },
    taskFileInfo: {
        flex: 1,
    },
    taskFileName: {
        color: '#3b82f6', // Bright blue for tasks (will be overridden by inline styles)
        fontWeight: '600',
        fontSize: 13,
    },
    taskFileSize: {
        color: Colors.Gray,
        fontSize: 11,
        marginTop: 1,
    },
    taskTimestamp: {
        color: Colors.Gray,
        fontSize: 10,
        marginLeft: 4,
    },
    taskTimestampCompleted: {
        opacity: 0.6,
    },
})

