import React from 'react'
import { View, Text, Pressable, Alert, Platform, ActivityIndicator } from 'react-native'
import * as FileSystemLegacy from 'expo-file-system/legacy'
import * as MediaLibrary from 'expo-media-library'
import * as Sharing from 'expo-sharing'
import * as Linking from 'expo-linking'
import { Colors } from '@/utils/colors'
import BottomModal from '@/components/BottomModal'

interface SaveImageModalProps {
    visible: boolean
    imageUrl: string | null
    onClose: () => void
}

export default function SaveImageModal({ visible, imageUrl, onClose }: SaveImageModalProps) {
    const [isWorking, setIsWorking] = React.useState(false)

    const ensurePermissions = async (): Promise<boolean> => {
        try {
            // Always try to request permission first (this will show system dialog if needed)
            const requestResult = await MediaLibrary.requestPermissionsAsync()
            
            // If granted, we're good to go
            if (requestResult.status === 'granted') {
                return true
            }
            
            // Check if we can ask again
            const { canAskAgain } = await MediaLibrary.getPermissionsAsync()
            
            // If permission was denied and we can't ask again, guide user to settings
            if (!canAskAgain) {
                Alert.alert(
                    'Permission Required',
                    'Photo library access is required to save images. Please enable it in Settings.',
                    [
                        {
                            text: 'Cancel',
                            style: 'cancel',
                            onPress: () => setIsWorking(false)
                        },
                        {
                            text: 'Open Settings',
                            onPress: async () => {
                                try {
                                    await Linking.openSettings()
                                } catch (err) {
                                    Alert.alert('Error', 'Could not open settings. Please enable photo library access manually.')
                                }
                                setIsWorking(false)
                            }
                        }
                    ]
                )
                return false
            }
            
            // Permission was denied but can still be asked again in future
            // (User clicked "Don't Allow" but it wasn't permanent)
            Alert.alert(
                'Permission Required',
                'Photo library access is required to save images. Please allow access when prompted.',
                [
                    {
                        text: 'OK',
                        onPress: () => setIsWorking(false)
                    }
                ]
            )
            return false
        } catch (e) {
            console.error('Permission error:', e)
            Alert.alert('Error', 'Failed to request photo library permission.')
            setIsWorking(false)
            return false
        }
    }

    const downloadToCache = async (url: string): Promise<string> => {
        const fileNameGuess = url.split('?')[0].split('/').pop() || `photo-${Date.now()}.jpg`
        const localUri = `${FileSystemLegacy.cacheDirectory}${fileNameGuess}`
        
        // Use legacy API to avoid deprecation warning
        const downloadResult = await FileSystemLegacy.downloadAsync(url, localUri)
        return downloadResult.uri
    }

    const handleSaveToPhotos = async () => {
        if (!imageUrl) return
        setIsWorking(true)
        try {
            const ok = await ensurePermissions()
            if (!ok) {
                Alert.alert('Permission needed', 'Please allow Photos access to save images.')
                return
            }
            const localPath = await downloadToCache(imageUrl)
            await MediaLibrary.createAssetAsync(localPath)
            Alert.alert('Saved', 'Image saved to your Photos.')
            onClose()
        } catch (e) {
            Alert.alert('Save failed', 'Could not save the image.')
        } finally {
            setIsWorking(false)
        }
    }

    const handleShare = async () => {
        if (!imageUrl) return
        setIsWorking(true)
        try {
            const localPath = await downloadToCache(imageUrl)
            const canShare = await Sharing.isAvailableAsync()
            if (canShare) {
                await Sharing.shareAsync(localPath, {
                    UTI: 'public.jpeg',
                    mimeType: 'image/jpeg',
                })
            } else {
                Alert.alert('Downloaded', 'File downloaded to app cache (sharing not available).')
            }
            onClose()
        } catch (e) {
            Alert.alert('Share failed', 'Could not share the image.')
        } finally {
            setIsWorking(false)
        }
    }

    return (
        <BottomModal
            visible={visible}
            onClose={() => { if (!isWorking) onClose() }}
            content={
                <View style={{ padding: 20, paddingBottom: 40 }}>
                    <Text style={{ 
                        fontSize: 18, 
                        fontWeight: 'bold', 
                        color: Colors.Text,
                        marginBottom: 20,
                        textAlign: 'center'
                    }}>
                        Save image
                    </Text>

                    <Pressable
                        onPress={handleSaveToPhotos}
                        disabled={isWorking}
                        style={{
                            backgroundColor: Colors.Primary,
                            padding: 16,
                            borderRadius: 12,
                            marginBottom: 12,
                            alignItems: 'center',
                            opacity: isWorking ? 0.7 : 1,
                        }}
                    >
                        {isWorking ? (
                            <ActivityIndicator color={Colors.White} />
                        ) : (
                            <Text style={{ 
                                color: Colors.White, 
                                fontSize: 16, 
                                fontWeight: '600' 
                            }}>
                                Save to Photos
                            </Text>
                        )}
                    </Pressable>

                    <Pressable
                        onPress={handleShare}
                        disabled={isWorking}
                        style={{
                            backgroundColor: Colors.Secondary,
                            padding: 16,
                            borderRadius: 12,
                            marginBottom: 12,
                            alignItems: 'center',
                            opacity: isWorking ? 0.7 : 1,
                        }}
                    >
                        <Text style={{ 
                            color: Colors.Text, 
                            fontSize: 16, 
                            fontWeight: '600' 
                        }}>
                            Share...
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={onClose}
                        disabled={isWorking}
                        style={{
                            backgroundColor: Colors.Secondary,
                            padding: 16,
                            borderRadius: 12,
                            alignItems: 'center',
                            opacity: isWorking ? 0.7 : 1,
                        }}
                    >
                        <Text style={{ 
                            color: Colors.Text, 
                            fontSize: 16, 
                            fontWeight: '600' 
                        }}>
                            Cancel
                        </Text>
                    </Pressable>
                </View>
            }
        />
    )
}


