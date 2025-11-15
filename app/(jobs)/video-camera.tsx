import { CameraView, CameraType, useCameraPermissions } from 'expo-camera'
import { IconSymbol } from '@/components/IconSymbol'
import { Colors } from '@/utils/colors'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import React from 'react'
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import * as SecureStore from 'expo-secure-store'
import { useAuth } from '@/context/AuthContext'
import { organizationService } from '@/lib/appwrite/teams'
import { useOrganization } from '@/context/OrganizationContext'
import { JobChat, Organization } from '@/utils/types'
import { appwriteConfig, db } from '@/utils/appwrite'

const RECORDING_DURATION = 15 // 15 seconds fixed duration
const VIDEO_RESOLUTION = { width: 1920, height: 1080 } // 1080p HD

export default function VideoCameraPage() {
    const { jobId } = useLocalSearchParams()
    const { user } = useAuth()
    const { currentOrganization, isCurrentOrgPremium, loadUserData } = useOrganization()
    const [facing, setFacing] = React.useState<CameraType>('back')
    const [permission, requestPermission] = useCameraPermissions()
    const [isRecording, setIsRecording] = React.useState(false)
    const [recordingTime, setRecordingTime] = React.useState(0)
    const [recordedVideo, setRecordedVideo] = React.useState<string | null>(null)
    const [jobOrganization, setJobOrganization] = React.useState<Organization | null>(null)
    const [isCheckingPremium, setIsCheckingPremium] = React.useState(true)
    const cameraRef = React.useRef<any>(null)
    const recordingTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const timeIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
    const insets = useSafeAreaInsets()
    const router = useRouter()
    
    const activeOrganization = React.useMemo(
        () => jobOrganization ?? currentOrganization,
        [jobOrganization, currentOrganization]
    )

    // Check premium access and video recording enabled
    React.useEffect(() => {
        let isMounted = true

        const checkAccess = async () => {
            setIsCheckingPremium(true)
            
            try {
                // Refresh organization data
                await loadUserData()
                
                // Resolve job organization if jobId is provided
                if (jobId && typeof jobId === 'string') {
                    try {
                        const jobDoc = await db.getDocument<JobChat>(
                            appwriteConfig.db,
                            appwriteConfig.col.jobchat,
                            jobId as string
                        )

                        if (!isMounted) return

                        const jobOrgId = jobDoc?.orgId

                        if (jobOrgId) {
                            if (currentOrganization?.$id === jobOrgId) {
                                setJobOrganization(currentOrganization)
                            } else {
                                try {
                                    const organization = await organizationService.getOrganization(jobOrgId)
                                    if (isMounted) {
                                        setJobOrganization(organization)
                                    }
                                } catch (orgError) {
                                    console.warn('Failed to load job organization:', orgError)
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error resolving job organization:', error)
                    }
                }

                if (!isMounted) return

                // Check if organization has premium and video recording enabled
                const org = activeOrganization || currentOrganization
                const hasPremium = isCurrentOrgPremium || (org?.premiumTier && org.premiumTier !== 'free')
                const videoEnabled = org?.videoRecordingEnabled ?? false

                if (!hasPremium || !videoEnabled) {
                    Alert.alert(
                        'Premium Feature',
                        'Video recording is available for premium organizations only. Please upgrade to premium and enable video recording in your organization settings.',
                        [
                            {
                                text: 'Go to Premium',
                                onPress: () => router.push('/(jobs)/get-premium'),
                            },
                            {
                                text: 'Cancel',
                                style: 'cancel',
                                onPress: () => router.back(),
                            },
                        ]
                    )
                }
            } catch (error) {
                console.error('Error checking premium access:', error)
                Alert.alert('Error', 'Failed to verify premium access. Please try again.')
            } finally {
                if (isMounted) {
                    setIsCheckingPremium(false)
                }
            }
        }

        checkAccess()

        return () => {
            isMounted = false
        }
    }, [jobId, currentOrganization, isCurrentOrgPremium, loadUserData, router])

    // Cleanup timers on unmount
    React.useEffect(() => {
        return () => {
            if (recordingTimerRef.current) {
                clearTimeout(recordingTimerRef.current)
            }
            if (timeIntervalRef.current) {
                clearInterval(timeIntervalRef.current)
            }
        }
    }, [])

    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'))
    }

    const startRecording = async () => {
        if (cameraRef.current && !isRecording) {
            try {
                // Check premium access again before recording
                const org = activeOrganization || currentOrganization
                const hasPremium = isCurrentOrgPremium || (org?.premiumTier && org.premiumTier !== 'free')
                const videoEnabled = org?.videoRecordingEnabled ?? false

                if (!hasPremium || !videoEnabled) {
                    Alert.alert(
                        'Premium Feature',
                        'Video recording is not available for this organization.'
                    )
                    return
                }

                setIsRecording(true)
                setRecordingTime(0)
                setRecordedVideo(null)

                // Start recording
                const recording = await cameraRef.current.recordAsync({
                    maxDuration: RECORDING_DURATION,
                    quality: '1080p',
                })

                // Start timer for UI
                let timeElapsed = 0
                timeIntervalRef.current = setInterval(() => {
                    timeElapsed += 0.1
                    setRecordingTime(Math.min(timeElapsed, RECORDING_DURATION))
                    
                    if (timeElapsed >= RECORDING_DURATION) {
                        if (timeIntervalRef.current) {
                            clearInterval(timeIntervalRef.current)
                        }
                    }
                }, 100)

                // Auto-stop after 15 seconds
                recordingTimerRef.current = setTimeout(async () => {
                    try {
                        if (cameraRef.current) {
                            await cameraRef.current.stopRecording()
                        }
                        if (timeIntervalRef.current) {
                            clearInterval(timeIntervalRef.current)
                        }
                        setIsRecording(false)
                        setRecordingTime(RECORDING_DURATION)
                    } catch (error) {
                        console.error('Error stopping recording:', error)
                        setIsRecording(false)
                    }
                }, RECORDING_DURATION * 1000)

                // Wait for recording to complete
                const videoUri = await recording
                
                if (timeIntervalRef.current) {
                    clearInterval(timeIntervalRef.current)
                }
                if (recordingTimerRef.current) {
                    clearTimeout(recordingTimerRef.current)
                }

                setIsRecording(false)
                setRecordingTime(RECORDING_DURATION)
                setRecordedVideo(videoUri.uri)
            } catch (error) {
                console.error('Error recording video:', error)
                Alert.alert('Error', 'Failed to record video. Please try again.')
                setIsRecording(false)
                setRecordingTime(0)
                if (timeIntervalRef.current) {
                    clearInterval(timeIntervalRef.current)
                }
                if (recordingTimerRef.current) {
                    clearTimeout(recordingTimerRef.current)
                }
            }
        }
    }

    const stopRecording = async () => {
        if (cameraRef.current && isRecording) {
            try {
                await cameraRef.current.stopRecording()
                setIsRecording(false)
                if (timeIntervalRef.current) {
                    clearInterval(timeIntervalRef.current)
                }
                if (recordingTimerRef.current) {
                    clearTimeout(recordingTimerRef.current)
                }
            } catch (error) {
                console.error('Error stopping recording:', error)
                setIsRecording(false)
            }
        }
    }

    const handleDone = async () => {
        if (recordedVideo) {
            try {
                // Store the recorded video URI in secure store
                await SecureStore.setItemAsync('recordedVideoUri', recordedVideo)
                console.log('✅ Saved video:', recordedVideo)
                // Navigate back to job page
                router.back()
            } catch (error) {
                console.error('Error storing video:', error)
                Alert.alert('Error', 'Failed to save video. Please try again.')
            }
        }
    }

    const handleCancel = () => {
        // Stop recording if in progress
        if (isRecording) {
            stopRecording()
        }
        // Clear any recorded video
        setRecordedVideo(null)
        router.back()
    }

    const handleRetake = () => {
        setRecordedVideo(null)
        setRecordingTime(0)
    }

    // Request permission on mount
    React.useEffect(() => {
        if (permission && !permission.granted && !permission.canAskAgain) {
            Alert.alert(
                'Camera Permission',
                'Please enable camera access in your device settings to record videos.',
                [{ text: 'OK' }]
            )
        } else if (permission && !permission.granted) {
            requestPermission()
        }
    }, [permission])

    if (isCheckingPremium) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={Colors.Primary} />
                <Text style={styles.loadingText}>Checking access...</Text>
            </View>
        )
    }

    if (!permission) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>Loading...</Text>
            </View>
        )
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>We need your permission to use the camera</Text>
                <Pressable 
                    onPress={requestPermission} 
                    style={styles.button}
                >
                    <Text style={styles.buttonText}>Grant Permission</Text>
                </Pressable>
                <Pressable 
                    onPress={() => router.back()} 
                    style={[styles.button, styles.closeButton]}
                >
                    <Text style={styles.buttonText}>Cancel</Text>
                </Pressable>
            </View>
        )
    }

    // Check if user has premium access
    const org = activeOrganization || currentOrganization
    const hasPremium = isCurrentOrgPremium || (org?.premiumTier && org.premiumTier !== 'free')
    const videoEnabled = org?.videoRecordingEnabled ?? false

    if (!hasPremium || !videoEnabled) {
        return (
            <View style={styles.container}>
                <IconSymbol name="video.slash" color={Colors.Gray} size={64} />
                <Text style={styles.message}>Video recording is a premium feature</Text>
                <Text style={styles.subMessage}>
                    Upgrade to premium and enable video recording in your organization settings.
                </Text>
                <Pressable 
                    onPress={() => router.push('/(jobs)/get-premium')} 
                    style={styles.button}
                >
                    <Text style={styles.buttonText}>Get Premium</Text>
                </Pressable>
                <Pressable 
                    onPress={() => router.back()} 
                    style={[styles.button, styles.closeButton]}
                >
                    <Text style={styles.buttonText}>Cancel</Text>
                </Pressable>
            </View>
        )
    }

    return (
        <>
            <StatusBar style="light" backgroundColor="#000" translucent={true} />
            <Stack.Screen 
                options={{
                    headerShown: false,
                }} 
            />
            <View style={styles.container}>
                {/* Show camera view when not showing recorded video */}
                {!recordedVideo ? (
                    <View style={styles.cameraWrapper}>
                        <CameraView 
                            ref={cameraRef} 
                            style={styles.camera} 
                            facing={facing}
                            mode="video"
                        />

                        {/* Header with close button */}
                        <View style={[styles.headerOverlay, { paddingTop: insets.top + 10 }]}>
                            <Pressable 
                                onPress={handleCancel} 
                                style={styles.closeButton}
                                disabled={isRecording}
                            >
                                <IconSymbol name="xmark" color={Colors.White} size={28} />
                            </Pressable>
                        </View>

                        {/* Recording indicator */}
                        {isRecording && (
                            <View style={styles.recordingIndicator}>
                                <View style={styles.recordingDot} />
                                <Text style={styles.recordingText}>
                                    {Math.ceil(RECORDING_DURATION - recordingTime)}s
                                </Text>
                            </View>
                        )}

                        {/* Footer with camera controls */}
                        <View style={[styles.footerOverlay, { paddingBottom: insets.bottom + 20 }]}>
                            {/* Cancel button */}
                            <Pressable 
                                onPress={handleCancel} 
                                style={styles.cancelButton}
                                disabled={isRecording}
                            >
                                <IconSymbol name="xmark" color={Colors.White} size={24} />
                                <Text style={styles.buttonText}>Cancel</Text>
                            </Pressable>

                            {/* Record button */}
                            <Pressable 
                                onPress={isRecording ? stopRecording : startRecording} 
                                style={[styles.recordButton, isRecording && styles.recordButtonActive]}
                                disabled={false}
                            >
                                {isRecording ? (
                                    <View style={styles.stopIcon} />
                                ) : (
                                    <View style={styles.recordButtonInner} />
                                )}
                            </Pressable>

                            {/* Flip camera button */}
                            <Pressable 
                                onPress={toggleCameraFacing} 
                                style={styles.flipButton}
                                disabled={isRecording}
                            >
                                <IconSymbol name="arrow.triangle.2.circlepath" color={Colors.White} size={24} />
                            </Pressable>
                        </View>
                    </View>
                ) : (
                    /* Show preview when video is recorded */
                    <View style={styles.previewContainer}>
                        <View style={styles.previewHeader}>
                            <Text style={styles.previewTitle}>Video Recorded</Text>
                            <Pressable onPress={handleCancel} style={styles.previewCloseButton}>
                                <IconSymbol name="xmark" color={Colors.White} size={24} />
                            </Pressable>
                        </View>
                        
                        <View style={styles.previewContent}>
                            <IconSymbol name="checkmark.circle.fill" color={Colors.Primary} size={64} />
                            <Text style={styles.previewText}>15 second video recorded successfully</Text>
                        </View>

                        <View style={[styles.previewFooter, { paddingBottom: insets.bottom + 20 }]}>
                            <Pressable 
                                onPress={handleRetake} 
                                style={styles.retakeButton}
                            >
                                <IconSymbol name="arrow.counterclockwise" color={Colors.White} size={24} />
                                <Text style={styles.buttonText}>Retake</Text>
                            </Pressable>

                            <Pressable 
                                onPress={handleDone} 
                                style={styles.doneButton}
                            >
                                <IconSymbol name="checkmark" color={Colors.White} size={24} />
                                <Text style={styles.buttonText}>Done</Text>
                            </Pressable>
                        </View>
                    </View>
                )}
            </View>
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.Secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: Colors.Text,
        marginTop: 16,
        fontSize: 16,
    },
    message: {
        color: Colors.Text,
        textAlign: 'center',
        marginBottom: 20,
        fontSize: 16,
    },
    subMessage: {
        color: Colors.Gray,
        textAlign: 'center',
        marginBottom: 20,
        fontSize: 14,
        paddingHorizontal: 40,
    },
    button: {
        backgroundColor: Colors.Primary,
        padding: 16,
        borderRadius: 8,
        marginVertical: 8,
        minWidth: 200,
        alignItems: 'center',
    },
    closeButton: {
        backgroundColor: Colors.Secondary,
    },
    buttonText: {
        color: Colors.White,
        fontSize: 16,
        fontWeight: '600',
    },
    cameraWrapper: {
        flex: 1,
        width: '100%',
    },
    camera: {
        flex: 1,
        width: '100%',
    },
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        alignItems: 'flex-start',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    recordingIndicator: {
        position: 'absolute',
        top: 100,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    recordingDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FF0000',
    },
    recordingText: {
        color: Colors.White,
        fontSize: 18,
        fontWeight: 'bold',
    },
    footerOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 40,
    },
    recordButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: Colors.White,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordButtonActive: {
        borderColor: '#FF0000',
        backgroundColor: '#FF0000',
    },
    recordButtonInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FF0000',
    },
    stopIcon: {
        width: 32,
        height: 32,
        backgroundColor: Colors.White,
        borderRadius: 4,
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },
    flipButton: {
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },
    previewContainer: {
        flex: 1,
        width: '100%',
        backgroundColor: Colors.Secondary,
    },
    previewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    previewTitle: {
        color: Colors.White,
        fontSize: 20,
        fontWeight: 'bold',
    },
    previewCloseButton: {
        padding: 8,
    },
    previewContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    previewText: {
        color: Colors.Text,
        fontSize: 16,
        textAlign: 'center',
    },
    previewFooter: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 40,
        paddingTop: 20,
    },
    retakeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
    },
    doneButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: Colors.Primary,
        borderRadius: 20,
    },
})

