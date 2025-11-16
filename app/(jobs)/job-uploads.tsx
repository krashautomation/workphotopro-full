import React from 'react'
import { Dimensions, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { Message } from '@/utils/types'
import { Colors } from '@/utils/colors'
import { appwriteConfig } from '@/utils/appwrite'
import { IconSymbol } from '@/components/IconSymbol'
import { webColors } from '@/styles/webDesignTokens'

type JobUploadsProps = {
    messages: Message[]
    onImagePress: (uri: string) => void
}

type PhotoItem = {
    id: string
    uri: string
    createdAt?: string
}

type VideoItem = {
    id: string
    videoFileId: string
    videoUrl: string
    createdAt?: string
}

type FileItem = {
    id: string
    name: string
    createdAt?: string
}

const NUM_COLUMNS = 3
const SPACING = 8

type SubTab = 'photos' | 'videos' | 'files'

export default function JobUploads({ messages, onImagePress }: JobUploadsProps) {
    const [activeSubTab, setActiveSubTab] = React.useState<SubTab>('photos')

    const photos = React.useMemo<PhotoItem[]>(() => {
        return messages
            .filter(
                message =>
                    !!message.imageUrl &&
                    message.content !== 'Message deleted by user'
            )
            .map(message => ({
                id: message.$id,
                uri: message.imageUrl as string,
                createdAt: message.$createdAt,
            }))
    }, [messages])

    const videos = React.useMemo<VideoItem[]>(() => {
        return messages
            .filter(
                message =>
                    !!(message as any).videoFileId &&
                    message.content !== 'Message deleted by user'
            )
            .map(message => {
                const videoFileId = (message as any).videoFileId
                const videoUrl = appwriteConfig.bucket
                    ? `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucket}/files/${videoFileId}/view?project=${appwriteConfig.projectId}`
                    : ''
                return {
                    id: message.$id,
                    videoFileId,
                    videoUrl,
                    createdAt: message.$createdAt,
                }
            })
    }, [messages])

    // Placeholder files - will be implemented later
    const files = React.useMemo<FileItem[]>(() => {
        // Return empty array for now - placeholder implementation
        return []
    }, [])

    const { width } = Dimensions.get('window')
    const itemSize = React.useMemo(() => {
        const totalSpacing = SPACING * (NUM_COLUMNS + 1)
        return Math.floor((width - totalSpacing) / NUM_COLUMNS)
    }, [width])

    const renderEmptyState = (title: string, subtitle: string) => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{title}</Text>
            <Text style={styles.emptySubtitle}>{subtitle}</Text>
        </View>
    )

    const renderPhotosGrid = () => {
        if (photos.length === 0) {
            return renderEmptyState(
                'No photos yet',
                'Photos shared in this chat will show up here.'
            )
        }

        return (
            <FlatList
                data={photos}
                numColumns={NUM_COLUMNS}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                columnWrapperStyle={{ gap: SPACING }}
                ItemSeparatorComponent={() => <View style={{ height: SPACING }} />}
                renderItem={({ item }) => (
                    <Pressable
                        style={[styles.imageWrapper, { width: itemSize, height: itemSize }]}
                        onPress={() => onImagePress(item.uri)}
                    >
                        <Image
                            source={{ uri: item.uri }}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    </Pressable>
                )}
            />
        )
    }

    const renderVideosGrid = () => {
        if (videos.length === 0) {
            return renderEmptyState(
                'No videos yet',
                'Videos shared in this chat will show up here.'
            )
        }

        return (
            <FlatList
                data={videos}
                numColumns={NUM_COLUMNS}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                columnWrapperStyle={{ gap: SPACING }}
                ItemSeparatorComponent={() => <View style={{ height: SPACING }} />}
                renderItem={({ item }) => (
                    <Pressable
                        style={[styles.videoWrapper, { width: itemSize, height: itemSize }]}
                        onPress={() => {
                            // For now, just show the video URL
                            // Could implement a video viewer modal later
                            onImagePress(item.videoUrl)
                        }}
                    >
                        <View style={styles.videoThumbnail}>
                            <IconSymbol name="video" color={Colors.Primary} size={32} />
                        </View>
                        <View style={styles.videoOverlay}>
                            <View style={styles.playButton}>
                                <IconSymbol name="play.fill" color={Colors.White} size={20} />
                            </View>
                        </View>
                    </Pressable>
                )}
            />
        )
    }

    const renderFilesGrid = () => {
        if (files.length === 0) {
            return renderEmptyState(
                'No files yet',
                'Files shared in this chat will show up here.'
            )
        }

        return (
            <FlatList
                data={files}
                numColumns={NUM_COLUMNS}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                columnWrapperStyle={{ gap: SPACING }}
                ItemSeparatorComponent={() => <View style={{ height: SPACING }} />}
                renderItem={({ item }) => (
                    <Pressable
                        style={[styles.fileWrapper, { width: itemSize, height: itemSize }]}
                    >
                        <View style={styles.fileIconContainer}>
                            <IconSymbol name="doc.text" color={Colors.Primary} size={32} />
                        </View>
                        <Text style={styles.fileName} numberOfLines={2}>
                            {item.name}
                        </Text>
                    </Pressable>
                )}
            />
        )
    }

    return (
        <View style={styles.container}>
            {/* Sub-tabs */}
            <View style={styles.subTabsContainer}>
                <Pressable
                    style={[
                        styles.subTab,
                        activeSubTab === 'photos' && styles.subTabActive,
                    ]}
                    onPress={() => setActiveSubTab('photos')}
                >
                    <Text
                        style={[
                            styles.subTabText,
                            activeSubTab === 'photos' && styles.subTabTextActive,
                        ]}
                    >
                        Photos
                    </Text>
                </Pressable>
                <Pressable
                    style={[
                        styles.subTab,
                        activeSubTab === 'videos' && styles.subTabActive,
                    ]}
                    onPress={() => setActiveSubTab('videos')}
                >
                    <Text
                        style={[
                            styles.subTabText,
                            activeSubTab === 'videos' && styles.subTabTextActive,
                        ]}
                    >
                        Videos
                    </Text>
                </Pressable>
                <Pressable
                    style={[
                        styles.subTab,
                        activeSubTab === 'files' && styles.subTabActive,
                    ]}
                    onPress={() => setActiveSubTab('files')}
                >
                    <Text
                        style={[
                            styles.subTabText,
                            activeSubTab === 'files' && styles.subTabTextActive,
                        ]}
                    >
                        Files
                    </Text>
                </Pressable>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {activeSubTab === 'photos' && renderPhotosGrid()}
                {activeSubTab === 'videos' && renderVideosGrid()}
                {activeSubTab === 'files' && renderFilesGrid()}
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
    content: {
        flex: 1,
    },
    listContainer: {
        padding: SPACING,
    },
    imageWrapper: {
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: Colors.Secondary,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    videoWrapper: {
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: Colors.Secondary,
        position: 'relative',
    },
    videoThumbnail: {
        width: '100%',
        height: '100%',
        backgroundColor: Colors.Secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fileWrapper: {
        borderRadius: 8,
        backgroundColor: Colors.Secondary,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.Gray,
    },
    fileIconContainer: {
        marginBottom: 8,
    },
    fileName: {
        color: Colors.Text,
        fontSize: 12,
        textAlign: 'center',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
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
})
