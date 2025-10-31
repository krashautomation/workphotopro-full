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

// Album name for organizing saved photos
const ALBUM_NAME = 'WorkPhotoPro Photos'

export default function SaveImageModal({ visible, imageUrl, onClose }: SaveImageModalProps) {
    const [isWorking, setIsWorking] = React.useState(false)
    
    /**
     * Get or create the custom album and add the asset to it
     * 
     * On Android: You can't create an empty album. You must:
     * 1. Create the asset first (save it to media library)
     * 2. Then create the album with that asset, OR add the asset to existing album
     * 
     * On iOS: You can create an album with just a name, then add assets to it
     */
    const ensureAssetInAlbum = async (asset: MediaLibrary.Asset): Promise<void> => {
        try {
            console.log('[SaveImage] 📁 Ensuring asset is in album:', ALBUM_NAME)
            console.log('[SaveImage] 📁 Platform:', Platform.OS)
            console.log('[SaveImage] 📁 Asset ID:', asset.id)
            
            // Get all albums
            const albums = await MediaLibrary.getAlbumsAsync()
            console.log('[SaveImage] 📁 Found albums:', albums.map(a => ({ id: a.id, title: a.title })))
            
            // Check if our album already exists
            let album = albums.find(a => a.title === ALBUM_NAME)
            
            if (album) {
                console.log('[SaveImage] ✅ Album exists:', album.id, album.title)
                // Add asset to existing album
                console.log('[SaveImage] 📁 Adding asset to existing album...')
                await MediaLibrary.addAssetsToAlbumAsync([asset], album, false)
                console.log('[SaveImage] ✅ Asset added to album')
            } else {
                // Album doesn't exist, create it
                console.log('[SaveImage] 📁 Creating new album:', ALBUM_NAME)
                
                if (Platform.OS === 'android') {
                    // On Android, create album with the asset (can't create empty album)
                    console.log('[SaveImage] 📁 Creating album on Android with asset...')
                    album = await MediaLibrary.createAlbumAsync(ALBUM_NAME, asset, false)
                    console.log('[SaveImage] ✅ Album created on Android:', album.id, album.title)
                } else {
                    // iOS - create album, then add asset
                    console.log('[SaveImage] 📁 Creating album on iOS...')
                    album = await MediaLibrary.createAlbumAsync(ALBUM_NAME)
                    console.log('[SaveImage] ✅ Album created on iOS:', album.id, album.title)
                    
                    // Add asset to the new album
                    console.log('[SaveImage] 📁 Adding asset to album...')
                    await MediaLibrary.addAssetsToAlbumAsync([asset], album, false)
                    console.log('[SaveImage] ✅ Asset added to album')
                }
            }
            
        } catch (error) {
            console.error('[SaveImage] ❌ Error ensuring asset in album:', error)
            if (error instanceof Error) {
                console.error('[SaveImage] ❌ Error details:', {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                })
            }
            // If album operations fail, the asset is still saved (just in default location)
            throw error
        }
    }

    const ensurePermissions = async (): Promise<boolean> => {
        try {
            console.log('[SaveImage] 📋 Starting permission check...')
            
            // Check current permissions first
            const currentPermissions = await MediaLibrary.getPermissionsAsync()
            console.log('[SaveImage] 📋 Current permissions:', {
                status: currentPermissions.status,
                granted: currentPermissions.granted,
                canAskAgain: currentPermissions.canAskAgain,
            })
            
            // Always try to request permission first (this will show system dialog if needed)
            const requestResult = await MediaLibrary.requestPermissionsAsync()
            console.log('[SaveImage] 📋 Permission request result:', {
                status: requestResult.status,
                granted: requestResult.granted,
                canAskAgain: requestResult.canAskAgain,
            })
            
            // If granted, we're good to go
            if (requestResult.status === 'granted') {
                console.log('[SaveImage] ✅ Permission granted!')
                return true
            }
            
            // Check if we can ask again
            const { canAskAgain } = await MediaLibrary.getPermissionsAsync()
            console.log('[SaveImage] ❌ Permission denied. Can ask again:', canAskAgain)
            
            // If permission was denied and we can't ask again, guide user to settings
            if (!canAskAgain) {
                console.log('[SaveImage] ❌ Permission permanently denied, opening settings...')
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
                                    console.error('[SaveImage] ❌ Error opening settings:', err)
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
            console.log('[SaveImage] ⚠️ Permission denied (not permanent)')
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
            console.error('[SaveImage] ❌ Permission error:', e)
            if (e instanceof Error) {
                console.error('[SaveImage] ❌ Error details:', {
                    message: e.message,
                    stack: e.stack,
                    name: e.name,
                })
            }
            Alert.alert('Error', 'Failed to request photo library permission.')
            setIsWorking(false)
            return false
        }
    }

    const downloadToCache = async (url: string): Promise<string> => {
        console.log('[SaveImage] 📥 Starting download to cache...')
        console.log('[SaveImage] 📥 Source URL:', url)
        
        // Generate a unique filename with proper extension
        // Always use .jpg extension for images (MediaLibrary requires extension)
        const timestamp = Date.now()
        const fileName = `photo-${timestamp}.jpg`
        const localUri = `${FileSystemLegacy.cacheDirectory}${fileName}`
        
        console.log('[SaveImage] 📥 Generated filename:', fileName)
        console.log('[SaveImage] 📥 Target file path:', localUri)
        console.log('[SaveImage] 📥 Cache directory:', FileSystemLegacy.cacheDirectory)
        
        try {
            // Use legacy API to avoid deprecation warning
            console.log('[SaveImage] 📥 Calling downloadAsync...')
            const downloadResult = await FileSystemLegacy.downloadAsync(url, localUri)
            console.log('[SaveImage] ✅ Download complete!')
            console.log('[SaveImage] 📥 Download result:', {
                uri: downloadResult.uri,
                status: downloadResult.status,
                headers: downloadResult.headers,
            })
            
            // Check if we can extract filename from content-disposition header (for logging)
            const headers = downloadResult.headers || {}
            // Find content-disposition header (case-insensitive search)
            let contentDisposition: string | null = null
            for (const key in headers) {
                if (key.toLowerCase() === 'content-disposition') {
                    contentDisposition = headers[key] as string
                    break
                }
            }
            
            if (contentDisposition) {
                console.log('[SaveImage] 📥 Content-Disposition header:', contentDisposition)
                // Try to extract filename from content-disposition if available (for reference)
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
                if (filenameMatch && filenameMatch[1]) {
                    let extractedName = filenameMatch[1].replace(/['"]/g, '')
                    console.log('[SaveImage] 📥 Extracted filename from header:', extractedName)
                    
                    // Log if extension differs (we keep .jpg for MediaLibrary compatibility)
                    if (!extractedName.toLowerCase().endsWith('.jpg') && 
                        !extractedName.toLowerCase().endsWith('.jpeg')) {
                        console.log('[SaveImage] 📥 Note: Extracted filename may have different extension, keeping .jpg for compatibility')
                    }
                }
            }
            
            return downloadResult.uri
        } catch (error) {
            console.error('[SaveImage] ❌ Download error:', error)
            if (error instanceof Error) {
                console.error('[SaveImage] ❌ Download error details:', {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                })
            }
            throw error
        }
    }

    const handleSaveToPhotos = async () => {
        console.log('[SaveImage] 🚀 ========== Save to Photos Started ==========')
        console.log('[SaveImage] 🚀 Platform:', Platform.OS)
        console.log('[SaveImage] 🚀 Image URL:', imageUrl)
        
        if (!imageUrl) {
            console.error('[SaveImage] ❌ No image URL provided!')
            return
        }
        
        setIsWorking(true)
        try {
            // Step 1: Check permissions
            console.log('[SaveImage] 📋 Step 1: Checking permissions...')
            const ok = await ensurePermissions()
            if (!ok) {
                console.error('[SaveImage] ❌ Permissions not granted, aborting save')
                Alert.alert('Permission needed', 'Please allow Photos access to save images.')
                return
            }
            
            // Step 2: Download image to cache
            console.log('[SaveImage] 📥 Step 2: Downloading image to cache...')
            const localPath = await downloadToCache(imageUrl)
            console.log('[SaveImage] ✅ Image downloaded to:', localPath)
            
            // Step 3: Save to media library
            console.log('[SaveImage] 💾 Step 3: Saving to media library...')
            console.log('[SaveImage] 💾 Local file path:', localPath)
            
            // Check if file exists before saving
            const fileInfo = await FileSystemLegacy.getInfoAsync(localPath)
            console.log('[SaveImage] 💾 File info:', {
                exists: fileInfo.exists,
                isDirectory: fileInfo.isDirectory,
                ...(fileInfo.exists && 'size' in fileInfo ? { size: fileInfo.size } : {}),
                uri: fileInfo.uri,
            })
            
            if (!fileInfo.exists) {
                throw new Error(`File does not exist at path: ${localPath}`)
            }
            
            // Step 4: Save asset to media library first
            // On Android, we must create the asset before creating/adding to album
            console.log('[SaveImage] 💾 Step 4: Saving asset to media library...')
            const asset = await MediaLibrary.createAssetAsync(localPath)
            console.log('[SaveImage] ✅ Asset created in media library!')
            console.log('[SaveImage] ✅ Asset details:', {
                id: asset.id,
                filename: asset.filename,
                uri: asset.uri,
                mediaType: asset.mediaType,
                width: asset.width,
                height: asset.height,
                creationTime: asset.creationTime,
                modificationTime: asset.modificationTime,
                duration: asset.duration,
            })
            
            // Step 5: Add asset to custom album (if possible)
            console.log('[SaveImage] 📁 Step 5: Adding asset to custom album...')
            let albumSuccess = false
            try {
                await ensureAssetInAlbum(asset)
                albumSuccess = true
                console.log('[SaveImage] ✅ Asset successfully added to album:', ALBUM_NAME)
            } catch (albumError) {
                console.warn('[SaveImage] ⚠️ Could not add asset to album, but asset is still saved:', albumError)
                // Asset is still saved, just not in the custom album
            }
            
            const successMessage = albumSuccess
                ? `Image saved to ${ALBUM_NAME} album.`
                : 'Image saved to your Photos.'
            
            Alert.alert('Saved', successMessage)
            onClose()
            console.log('[SaveImage] ✅ ========== Save Complete ==========')
        } catch (e) {
            console.error('[SaveImage] ❌ ========== Save Failed ==========')
            console.error('[SaveImage] ❌ Error:', e)
            
            if (e instanceof Error) {
                console.error('[SaveImage] ❌ Error details:', {
                    name: e.name,
                    message: e.message,
                    stack: e.stack,
                })
            }
            
            // Check if it's a MediaLibrary specific error
            if (e && typeof e === 'object' && 'code' in e) {
                console.error('[SaveImage] ❌ Error code:', e.code)
            }
            
            // Provide more specific error message
            const errorMessage = e instanceof Error ? e.message : 'Unknown error'
            Alert.alert(
                'Save failed',
                `Could not save the image.\n\nError: ${errorMessage}\n\nCheck console for details.`
            )
        } finally {
            setIsWorking(false)
            console.log('[SaveImage] 🏁 ========== Save Process Ended ==========')
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


