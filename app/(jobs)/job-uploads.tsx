import React from 'react'
import { Dimensions, FlatList, Image, Pressable, StyleSheet, Text, View, Linking, Platform, Alert } from 'react-native'
import { Message } from '@/utils/types'
import { Colors } from '@/utils/colors'
import { appwriteConfig } from '@/utils/appwrite'
import { IconSymbol } from '@/components/IconSymbol'
import { webColors } from '@/styles/webDesignTokens'
import CachedImage from '@/components/CachedImage'
import * as FileSystem from 'expo-file-system'
import * as FileSystemLegacy from 'expo-file-system/legacy'
import * as MediaLibrary from 'expo-media-library'
import * as Sharing from 'expo-sharing'

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
    fileFileId: string
    fileUrl: string
    fileSize?: number
    fileMimeType?: string
    createdAt?: string
}

type AudioItem = {
    id: string
    audioFileId: string
    audioUrl: string
    audioDuration?: number
    createdAt?: string
}

const NUM_COLUMNS = 3
const SPACING = 8
const ALBUM_NAME = 'All WorkPhotoPro'

type SubTab = 'photos' | 'videos' | 'files' | 'audios'

export default function JobUploads({ messages, onImagePress }: JobUploadsProps) {
    const [activeSubTab, setActiveSubTab] = React.useState<SubTab>('photos')
    const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set())

    // Clear selection when switching tabs
    React.useEffect(() => {
        setSelectedItems(new Set())
    }, [activeSubTab])

    const ensurePermissions = async (): Promise<boolean> => {
        try {
            const requestResult = await MediaLibrary.requestPermissionsAsync()
            if (requestResult.status === 'granted') {
                return true
            }
            
            const { canAskAgain } = await MediaLibrary.getPermissionsAsync()
            if (!canAskAgain) {
                Alert.alert(
                    'Permission Required',
                    'Photo library access is required to save images. Please enable it in Settings.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Open Settings',
                            onPress: async () => {
                                try {
                                    await Linking.openSettings()
                                } catch (err) {
                                    console.error('Error opening settings:', err)
                                }
                            }
                        }
                    ]
                )
                return false
            }
            
            Alert.alert(
                'Permission Required',
                'Photo library access is required to save images. Please allow access when prompted.'
            )
            return false
        } catch (e) {
            console.error('Permission error:', e)
            Alert.alert('Error', 'Failed to request photo library permission.')
            return false
        }
    }

    const downloadToCache = async (url: string, fileName: string): Promise<string> => {
        const localUri = `${FileSystemLegacy.cacheDirectory}${fileName}`
        const downloadResult = await FileSystemLegacy.downloadAsync(url, localUri)
        return downloadResult.uri
    }

    const ensureAssetInAlbum = async (asset: MediaLibrary.Asset): Promise<void> => {
        const albums = await MediaLibrary.getAlbumsAsync()
        let album = albums.find(a => a.title === ALBUM_NAME)
        
        if (album) {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false)
        } else {
            if (Platform.OS === 'android') {
                album = await MediaLibrary.createAlbumAsync(ALBUM_NAME, asset, false)
            } else {
                album = await MediaLibrary.createAlbumAsync(ALBUM_NAME)
                await MediaLibrary.addAssetsToAlbumAsync([asset], album, false)
            }
        }
    }

    const saveToMediaLibrary = async (url: string, fileName: string): Promise<void> => {
        // Download to cache
        const localPath = await downloadToCache(url, fileName)
        
        // Check if file exists
        const fileInfo = await FileSystemLegacy.getInfoAsync(localPath)
        if (!fileInfo.exists) {
            throw new Error(`File does not exist at path: ${localPath}`)
        }
        
        // Create asset in media library
        const asset = await MediaLibrary.createAssetAsync(localPath)
        
        // Add to album
        try {
            await ensureAssetInAlbum(asset)
        } catch (albumError) {
            console.warn('Could not add asset to album, but asset is still saved:', albumError)
        }
        
        // Clean up cache file
        try {
            const { cacheManager } = await import('@/utils/cacheManager')
            await cacheManager.deleteCacheFile(localPath)
        } catch (cleanupError) {
            console.warn('Could not clean up cache file:', cleanupError)
        }
    }

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

    const files = React.useMemo<FileItem[]>(() => {
        return messages
            .filter(
                message =>
                    !!(message as any).fileFileId &&
                    message.content !== 'Message deleted by user'
            )
            .map(message => {
                const fileFileId = (message as any).fileFileId
                const fileUrl = (message as any).fileUrl || (appwriteConfig.bucket
                    ? `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucket}/files/${fileFileId}/view?project=${appwriteConfig.projectId}`
                    : '')
                return {
                    id: message.$id,
                    name: (message as any).fileName || 'Document',
                    fileFileId,
                    fileUrl,
                    fileSize: (message as any).fileSize,
                    fileMimeType: (message as any).fileMimeType,
                    createdAt: message.$createdAt,
                }
            })
    }, [messages])

    const audios = React.useMemo<AudioItem[]>(() => {
        return messages
            .filter(
                message =>
                    !!(message as any).audioFileId &&
                    message.content !== 'Message deleted by user'
            )
            .map(message => {
                const audioFileId = (message as any).audioFileId
                const audioUrl = (message as any).audioUrl || (appwriteConfig.bucket
                    ? `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucket}/files/${audioFileId}/view?project=${appwriteConfig.projectId}`
                    : '')
                return {
                    id: message.$id,
                    audioFileId,
                    audioUrl,
                    audioDuration: (message as any).audioDuration,
                    createdAt: message.$createdAt,
                }
            })
    }, [messages])

    const { width } = Dimensions.get('window')
    const itemSize = React.useMemo(() => {
        const totalSpacing = SPACING * (NUM_COLUMNS + 1)
        return Math.floor((width - totalSpacing) / NUM_COLUMNS)
    }, [width])

    const toggleItemSelection = (itemId: string) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev)
            if (newSet.has(itemId)) {
                newSet.delete(itemId)
            } else {
                newSet.add(itemId)
            }
            return newSet
        })
    }

    const handleSelectAll = () => {
        let allIds: string[] = []
        switch (activeSubTab) {
            case 'photos':
                allIds = photos.map(p => p.id)
                break
            case 'videos':
                allIds = videos.map(v => v.id)
                break
            case 'files':
                allIds = files.map(f => f.id)
                break
            case 'audios':
                allIds = audios.map(a => a.id)
                break
        }
        setSelectedItems(new Set(allIds))
    }

    const handleDeselectAll = () => {
        setSelectedItems(new Set())
    }

    const getCurrentItems = () => {
        switch (activeSubTab) {
            case 'photos':
                return photos
            case 'videos':
                return videos
            case 'files':
                return files
            case 'audios':
                return audios
        }
    }

    const isAllSelected = () => {
        const currentItems = getCurrentItems()
        return currentItems.length > 0 && selectedItems.size === currentItems.length
    }

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
                extraData={selectedItems}
                numColumns={NUM_COLUMNS}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                columnWrapperStyle={{ gap: SPACING }}
                ItemSeparatorComponent={() => <View style={{ height: SPACING }} />}
                renderItem={({ item }) => {
                    const isSelected = selectedItems.has(item.id)
                    return (
                        <Pressable
                            key={`${item.id}-${isSelected}`}
                            style={({ pressed }) => [
                                styles.imageWrapper,
                                { width: itemSize, height: itemSize },
                                isSelected && styles.itemSelected,
                                pressed && !isSelected && { opacity: 0.8 },
                                !isSelected && !pressed && { opacity: 1 },
                            ]}
                            onPress={() => {
                                if (selectedItems.size > 0) {
                                    toggleItemSelection(item.id)
                                } else {
                                    onImagePress(item.uri)
                                }
                            }}
                            onLongPress={() => toggleItemSelection(item.id)}
                        >
                            <CachedImage
                                key={`${item.id}-${isSelected}`}
                                source={{ uri: item.uri }}
                                autoCache={true}
                                style={styles.image}
                                resizeMode="cover"
                            />
                            {isSelected && (
                                <View style={styles.checkmarkOverlay}>
                                    <View style={styles.checkmarkContainer}>
                                        <IconSymbol name="checkmark.circle.fill" color={Colors.White} size={20} />
                                    </View>
                                </View>
                            )}
                        </Pressable>
                    )
                }}
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
                extraData={selectedItems}
                numColumns={NUM_COLUMNS}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                columnWrapperStyle={{ gap: SPACING }}
                ItemSeparatorComponent={() => <View style={{ height: SPACING }} />}
                renderItem={({ item }) => {
                    const isSelected = selectedItems.has(item.id)
                    return (
                        <Pressable
                            key={`${item.id}-${isSelected}`}
                            style={({ pressed }) => [
                                styles.videoWrapper,
                                { width: itemSize, height: itemSize },
                                isSelected && styles.itemSelected,
                                pressed && !isSelected && { opacity: 0.8 },
                                !isSelected && !pressed && { opacity: 1 },
                            ]}
                            onPress={() => {
                                if (selectedItems.size > 0) {
                                    toggleItemSelection(item.id)
                                } else {
                                    onImagePress(item.videoUrl)
                                }
                            }}
                            onLongPress={() => toggleItemSelection(item.id)}
                        >
                            <View style={styles.videoThumbnail}>
                                <IconSymbol name="video" color={Colors.Primary} size={32} />
                            </View>
                            <View style={styles.videoOverlay}>
                                <View style={styles.playButton}>
                                    <IconSymbol name="play.fill" color={Colors.White} size={20} />
                                </View>
                            </View>
                            {isSelected && (
                                <View style={styles.checkmarkOverlay}>
                                    <View style={styles.checkmarkContainer}>
                                        <IconSymbol name="checkmark.circle.fill" color={Colors.White} size={20} />
                                    </View>
                                </View>
                            )}
                        </Pressable>
                    )
                }}
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
                extraData={selectedItems}
                numColumns={NUM_COLUMNS}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                columnWrapperStyle={{ gap: SPACING }}
                ItemSeparatorComponent={() => <View style={{ height: SPACING }} />}
                renderItem={({ item }) => {
                    const isSelected = selectedItems.has(item.id)
                    return (
                        <Pressable
                            key={`${item.id}-${isSelected}`}
                            style={({ pressed }) => [
                                styles.fileWrapper,
                                { width: itemSize, height: itemSize },
                                isSelected && styles.itemSelected,
                                pressed && !isSelected && { opacity: 0.8 },
                                !isSelected && !pressed && { opacity: 1 },
                            ]}
                            onPress={() => {
                                if (selectedItems.size > 0) {
                                    toggleItemSelection(item.id)
                                } else {
                                    if (item.fileUrl) {
                                        Linking.openURL(item.fileUrl)
                                    }
                                }
                            }}
                            onLongPress={() => toggleItemSelection(item.id)}
                        >
                            <View style={styles.fileIconContainer}>
                                <IconSymbol name="doc.text" color={Colors.Primary} size={32} />
                            </View>
                            <Text style={styles.fileName} numberOfLines={2}>
                                {item.name}
                            </Text>
                            {item.fileSize && (
                                <Text style={styles.fileSize} numberOfLines={1}>
                                    {(item.fileSize / 1024).toFixed(1)} KB
                                </Text>
                            )}
                            {isSelected && (
                                <View style={styles.checkmarkOverlay}>
                                    <View style={styles.checkmarkContainer}>
                                        <IconSymbol name="checkmark.circle.fill" color={Colors.White} size={20} />
                                    </View>
                                </View>
                            )}
                        </Pressable>
                    )
                }}
            />
        )
    }

    const renderAudiosGrid = () => {
        if (audios.length === 0) {
            return renderEmptyState(
                'No audio recordings yet',
                'Audio messages shared in this chat will show up here.'
            )
        }

        const formatDuration = (seconds?: number) => {
            if (!seconds) return '--:--'
            const mins = Math.floor(seconds / 60)
            const secs = seconds % 60
            return `${mins}:${secs.toString().padStart(2, '0')}`
        }

        return (
            <FlatList
                data={audios}
                extraData={selectedItems}
                numColumns={NUM_COLUMNS}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                columnWrapperStyle={{ gap: SPACING }}
                ItemSeparatorComponent={() => <View style={{ height: SPACING }} />}
                renderItem={({ item }) => {
                    const isSelected = selectedItems.has(item.id)
                    return (
                        <Pressable
                            key={`${item.id}-${isSelected}`}
                            style={({ pressed }) => [
                                styles.audioWrapper,
                                { width: itemSize, height: itemSize },
                                isSelected && styles.itemSelected,
                                pressed && !isSelected && { opacity: 0.8 },
                                !isSelected && !pressed && { opacity: 1 },
                            ]}
                            onPress={() => {
                                if (selectedItems.size > 0) {
                                    toggleItemSelection(item.id)
                                } else {
                                    if (item.audioUrl) {
                                        Linking.openURL(item.audioUrl)
                                    }
                                }
                            }}
                            onLongPress={() => toggleItemSelection(item.id)}
                        >
                            <View style={styles.audioIconContainer}>
                                <IconSymbol name="mic" color={Colors.Primary} size={32} />
                            </View>
                            <View style={styles.playButtonSmall}>
                                <IconSymbol name="play.fill" color={Colors.White} size={16} />
                            </View>
                            {item.audioDuration && (
                                <Text style={styles.audioDuration} numberOfLines={1}>
                                    {formatDuration(item.audioDuration)}
                                </Text>
                            )}
                            {isSelected && (
                                <View style={styles.checkmarkOverlay}>
                                    <View style={styles.checkmarkContainer}>
                                        <IconSymbol name="checkmark.circle.fill" color={Colors.White} size={20} />
                                    </View>
                                </View>
                            )}
                        </Pressable>
                    )
                }}
            />
        )
    }

    const handleDownloadAll = async () => {
        if (selectedItems.size === 0) return

        let itemsToDownload: Array<{ url: string; name: string }> = []

        const baseTimestamp = Date.now()
        switch (activeSubTab) {
            case 'photos':
                itemsToDownload = photos
                    .filter(photo => selectedItems.has(photo.id))
                    .map((photo, index) => ({
                        url: photo.uri,
                        name: `photo_${baseTimestamp + index}.jpg`,
                    }))
                break
            case 'videos':
                itemsToDownload = videos
                    .filter(video => selectedItems.has(video.id))
                    .map((video, index) => ({
                        url: video.videoUrl,
                        name: `video_${baseTimestamp + index}.mp4`,
                    }))
                break
            case 'files':
                itemsToDownload = files
                    .filter(file => selectedItems.has(file.id))
                    .map(file => ({
                        url: file.fileUrl,
                        name: file.name,
                    }))
                break
            case 'audios':
                itemsToDownload = audios
                    .filter(audio => selectedItems.has(audio.id))
                    .map((audio, index) => ({
                        url: audio.audioUrl,
                        name: `audio_${baseTimestamp + index}.m4a`,
                    }))
                break
        }

        if (itemsToDownload.length === 0) return

        try {
            if (Platform.OS === 'web') {
                // For web, download files individually
                if (typeof document !== 'undefined') {
                    for (const item of itemsToDownload) {
                        const link = document.createElement('a')
                        link.href = item.url
                        link.download = item.name
                        link.target = '_blank'
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                        // Small delay between downloads
                        await new Promise(resolve => setTimeout(resolve, 100))
                    }
                    Alert.alert('Download started', `Downloading ${itemsToDownload.length} file(s)...`)
                } else {
                    // Fallback: open URLs directly
                    for (const item of itemsToDownload) {
                        Linking.openURL(item.url)
                        await new Promise(resolve => setTimeout(resolve, 200))
                    }
                }
            } else {
                // For mobile, use MediaLibrary for photos/videos/audios, FileSystem for files
                const isMediaType = activeSubTab === 'photos' || activeSubTab === 'videos' || activeSubTab === 'audios'
                
                if (isMediaType) {
                    // Check permissions first
                    const hasPermission = await ensurePermissions()
                    if (!hasPermission) {
                        return
                    }

                    Alert.alert(
                        'Downloading',
                        `Downloading ${itemsToDownload.length} file(s) to ${ALBUM_NAME}...`,
                        [{ text: 'OK' }]
                    )

                    let successCount = 0
                    let failCount = 0

                    // Download and save each item sequentially to avoid overwhelming the system
                    for (const item of itemsToDownload) {
                        try {
                            await saveToMediaLibrary(item.url, item.name)
                            successCount++
                        } catch (error) {
                            console.error(`Failed to download ${item.name}:`, error)
                            failCount++
                        }
                    }

                    if (successCount > 0) {
                        Alert.alert(
                            'Download complete',
                            `Successfully saved ${successCount} file(s) to ${ALBUM_NAME} album.${failCount > 0 ? `\n\n${failCount} file(s) failed to download.` : ''}`
                        )
                    } else {
                        Alert.alert(
                            'Download failed',
                            `Failed to download ${failCount} file(s). Please check console for details.`
                        )
                    }
                } else {
                    // For files (documents), use FileSystem and share
                    Alert.alert(
                        'Downloading',
                        `Downloading ${itemsToDownload.length} file(s)...`,
                        [{ text: 'OK' }]
                    )

                    const downloadPromises = itemsToDownload.map(async (item) => {
                        try {
                            const fileUri = `${FileSystem.documentDirectory}${item.name}`
                            const downloadResult = await FileSystem.downloadAsync(item.url, fileUri)
                            return downloadResult.uri
                        } catch (error) {
                            console.error(`Failed to download ${item.name}:`, error)
                            return null
                        }
                    })

                    const downloadedFiles = await Promise.all(downloadPromises)
                    const successfulDownloads = downloadedFiles.filter(uri => uri !== null)

                    if (successfulDownloads.length > 0 && (await Sharing.isAvailableAsync())) {
                        // Share the first file (or could implement sharing multiple files)
                        await Sharing.shareAsync(successfulDownloads[0])
                    } else {
                        Alert.alert(
                            'Download complete',
                            `Successfully downloaded ${successfulDownloads.length} file(s) to your device.`
                        )
                    }
                }
            }
        } catch (error) {
            console.error('Download error:', error)
            Alert.alert('Download failed', 'An error occurred while downloading files.')
        }
    }

    const getDownloadButtonText = () => {
        if (selectedItems.size === 0) {
            return 'Download selected'
        }
        return `Download selected (${selectedItems.size})`
    }

    const hasSelectedItems = selectedItems.size > 0

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
                        activeSubTab === 'audios' && styles.subTabActive,
                    ]}
                    onPress={() => setActiveSubTab('audios')}
                >
                    <Text
                        style={[
                            styles.subTabText,
                            activeSubTab === 'audios' && styles.subTabTextActive,
                        ]}
                    >
                        Audios
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

            {/* Action buttons */}
            <View style={styles.downloadButtonContainer}>
                <View style={styles.buttonRow}>
                    <Pressable
                        style={styles.selectAllButton}
                        onPress={isAllSelected() ? handleDeselectAll : handleSelectAll}
                    >
                        <Text style={styles.selectAllButtonText}>
                            {isAllSelected() ? 'Deselect All' : 'Select All'}
                        </Text>
                    </Pressable>
                    <Pressable
                        style={[
                            styles.downloadButton,
                            !hasSelectedItems && styles.downloadButtonDisabled,
                        ]}
                        onPress={handleDownloadAll}
                        disabled={!hasSelectedItems}
                    >
                        <IconSymbol
                            name="arrow.down.circle"
                            color={hasSelectedItems ? webColors.primary : Colors.Gray}
                            size={18}
                        />
                        <Text
                            style={[
                                styles.downloadButtonText,
                                !hasSelectedItems && styles.downloadButtonTextDisabled,
                            ]}
                        >
                            {getDownloadButtonText()}
                        </Text>
                    </Pressable>
                </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {activeSubTab === 'photos' && renderPhotosGrid()}
                {activeSubTab === 'videos' && renderVideosGrid()}
                {activeSubTab === 'files' && renderFilesGrid()}
                {activeSubTab === 'audios' && renderAudiosGrid()}
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
    downloadButtonContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.Background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.Gray,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    selectAllButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: Colors.Secondary,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.Gray,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectAllButtonText: {
        color: Colors.Text,
        fontSize: 14,
        fontWeight: '600',
    },
    downloadButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: Colors.Secondary,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: webColors.primary,
        gap: 8,
    },
    downloadButtonDisabled: {
        borderColor: Colors.Gray,
        opacity: 0.5,
    },
    downloadButtonText: {
        color: webColors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    downloadButtonTextDisabled: {
        color: Colors.Gray,
    },
    checkmarkOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 8,
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        padding: 8,
    },
    checkmarkContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: webColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.White,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    itemSelected: {
        borderColor: webColors.primary,
        borderWidth: 3,
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
        opacity: 1,
    },
    image: {
        width: '100%',
        height: '100%',
        opacity: 1,
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
        fontWeight: '500',
    },
    fileSize: {
        color: Colors.Gray,
        fontSize: 10,
        textAlign: 'center',
        marginTop: 4,
    },
    audioWrapper: {
        borderRadius: 8,
        backgroundColor: Colors.Secondary,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.Gray,
        position: 'relative',
    },
    audioIconContainer: {
        marginBottom: 8,
    },
    playButtonSmall: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.Primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    audioDuration: {
        color: Colors.Text,
        fontSize: 12,
        textAlign: 'center',
        marginTop: 8,
        fontWeight: '500',
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
