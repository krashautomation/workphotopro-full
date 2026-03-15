import BottomModal from '@/components/BottomModal'
import BottomModal2 from '@/components/BottomModal2'
import { IconSymbol } from '@/components/IconSymbol'
import Avatar from '@/components/Avatar'
import ShareLocation from '@/components/share-location'
import { globalStyles } from '@/styles/globalStyles'
import { webColors } from '@/styles/webDesignTokens'
import { appwriteConfig, client, db, ID, storage } from '@/utils/appwrite'
import { Colors } from '@/utils/colors'
import { JobChats } from '@/utils/test-data'
import { JobChat, Message, LocationData } from '@/utils/types'
import { useAuth } from '@/context/AuthContext'
import { useOrganization } from '@/context/OrganizationContext'
import { LegendList } from '@legendapp/list'
import { useHeaderHeight } from '@react-navigation/elements'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import { Stack, useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router'
import * as React from 'react'
import { ActivityIndicator, Alert, AppState, Dimensions, Image, Keyboard, KeyboardAvoidingView, Linking, Platform, Pressable, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import CachedImage from '@/components/CachedImage'
import { Query } from 'react-native-appwrite'
import ImageViewing from 'react-native-image-viewing'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import JobDetails from './job-details'
import JobUploads from './job-uploads'
import JobTasks from './job-tasks'
import * as SecureStore from 'expo-secure-store'
import SaveImageModal from '@/components/SaveImageModal'
import ShareJob from './share-job'
import ShareReportModal from './share-report-modal'
import { useJobReportsPermission } from '@/hooks/useJobReportsPermission'
import VideoPlayer from '@/components/VideoPlayer'
import FullScreenVideoPlayer from '@/components/FullScreenVideoPlayer'
import AudioRecorder from '@/components/AudioRecorder'
import AudioPlayer from '@/components/AudioPlayer'
import EmojiPicker, { EmojiPickerView } from '@/components/EmojiPicker'
import { ClipboardList, CalendarCheck, LayoutList } from 'lucide-react-native'
import { usePermissions } from '@/utils/permissions'

// Color palette for sender names (6 distinct colors for dark background)
const SENDER_COLORS = [
    '#22c55e', // Green (current user)
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#f59e0b', // Amber/Orange
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
];

// Generate consistent color for a sender based on userId
const getSenderColor = (senderId: string, isCurrentUser: boolean): string => {
    if (isCurrentUser) return SENDER_COLORS[0]; // Green for current user
    // Hash the senderId to pick a consistent color
    let hash = 0;
    for (let i = 0; i < senderId.length; i++) {
        hash = senderId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % (SENDER_COLORS.length - 1) + 1; // Skip index 0 (green)
    return SENDER_COLORS[index];
};

export default function Job() {
    const { job: jobId } = useLocalSearchParams()
    const { user, getUserProfilePicture } = useAuth();
    const { currentTeam, currentOrganization } = useOrganization();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { canUploadPhoto, canRecordVideo } = usePermissions();

    console.log('🔍 Job Component: Component mounted/rendered');
    console.log('🔍 Job Component: jobId from params:', jobId);
    console.log('🔍 Job Component: user info:', { userId: user?.$id, userName: user?.name });
    console.log('🔍 Job Component: Appwrite config:', {
        db: appwriteConfig.db,
        messagesCollection: appwriteConfig.col.messages,
        jobchatCollection: appwriteConfig.col.jobchat
    });

    const [messageContent, setMessageContent] = React.useState('');
    const [jobChat, setJobChat] = React.useState<JobChat | null>(null);
    const [activeTab, setActiveTab] = React.useState<'chat' | 'details' | 'photos' | 'tasks'>('chat');
    
    // Check permission to share job reports
    const { canShare: canShareJobReports } = useJobReportsPermission(jobChat?.teamId);

    const [messages, setMessages] = React.useState<Message[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [keyboardHeight, setKeyboardHeight] = React.useState(0);
    const headerHeightValue = useHeaderHeight();
    const headerHeight = Platform.OS === 'ios' ? headerHeightValue : 0;
    const listRef = React.useRef<any>(null);
    
    // Pagination state for loading older messages
    const [hasMoreMessages, setHasMoreMessages] = React.useState(true);
    const [isLoadingOlderMessages, setIsLoadingOlderMessages] = React.useState(false);
    const [oldestMessageId, setOldestMessageId] = React.useState<string | null>(null);
    const [isInitialLoad, setIsInitialLoad] = React.useState(true);
    const [shouldScrollToBottom, setShouldScrollToBottom] = React.useState(true);
    const [allMessagesLoaded, setAllMessagesLoaded] = React.useState(false); // Track if all messages are loaded
    const [contentHeight, setContentHeight] = React.useState(0);
    const [currentScrollY, setCurrentScrollY] = React.useState(0); // Track scroll position for RefreshControl
    const [isScrollingUp, setIsScrollingUp] = React.useState(false); // Track scroll direction
    const scrollY = React.useRef(0);
    const hasTriggeredLoadMore = React.useRef(false);
    const isUserScrolling = React.useRef(false);
    const scrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const messageToMaintainPosition = React.useRef<string | null>(null); // Message ID to maintain scroll position after loading older messages
    const [selectedImages, setSelectedImages] = React.useState<string[]>([]);
    const [selectedVideo, setSelectedVideo] = React.useState<string | null>(null);
    const [fullScreenVideo, setFullScreenVideo] = React.useState<{ uri: string; fileId?: string } | null>(null);
    const [selectedFile, setSelectedFile] = React.useState<DocumentPicker.DocumentPickerAsset | null>(null);
    const [selectedAudio, setSelectedAudio] = React.useState<{ uri: string; duration: number } | null>(null);
    const [showAudioRecorder, setShowAudioRecorder] = React.useState(false);
    const [isUploading, setIsUploading] = React.useState(false);
    const [uploadStatus, setUploadStatus] = React.useState<string>('');
    const [uploadProgress, setUploadProgress] = React.useState<number>(0);
    const [pressedMessageId, setPressedMessageId] = React.useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = React.useState(false);
    const [messageToDelete, setMessageToDelete] = React.useState<Message | null>(null);
    const [fullScreenImage, setFullScreenImage] = React.useState<string | null>(null);
    const [isImageViewVisible, setIsImageViewVisible] = React.useState(false);
    const [viewingMessage, setViewingMessage] = React.useState<Message | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
    const [showSaveImageModal, setShowSaveImageModal] = React.useState(false);
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [isLoadingAllMessages, setIsLoadingAllMessages] = React.useState(false);
    const [showShareLocation, setShowShareLocation] = React.useState(false);
    const [showShareJobModal, setShowShareJobModal] = React.useState(false);
    const [showShareReportModal, setShowShareReportModal] = React.useState(false);
    const [reportId, setReportId] = React.useState<string | null>(null);
    const [isLoadingReport, setIsLoadingReport] = React.useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
    const [showAttachmentMenu, setShowAttachmentMenu] = React.useState(false);
    const [showClipboardMenu, setShowClipboardMenu] = React.useState(false);
    const [isTaskMessage, setIsTaskMessage] = React.useState(false); // Flag to mark message as task when sending
    const [isDutyMessage, setIsDutyMessage] = React.useState(false); // Flag to mark message as duty when sending
    const [currentPinnedTaskIndex, setCurrentPinnedTaskIndex] = React.useState(0); // Index of currently displayed pinned task/duty
    const [taskToScrollTo, setTaskToScrollTo] = React.useState<string | null>(null); // Task/Duty message ID to scroll to
    const [replyingToMessage, setReplyingToMessage] = React.useState<Message | null>(null); // Message being replied to
    const [editingMessage, setEditingMessage] = React.useState<Message | null>(null); // Message being edited
    const [showMessageActionsModal, setShowMessageActionsModal] = React.useState(false); // Modal for message actions (Edit/Reply/Delete)
    const [messageForAction, setMessageForAction] = React.useState<Message | null>(null); // Message selected for action
    const [previewProfilePicture, setPreviewProfilePicture] = React.useState<string | null>(null);
    
    // Lighter, brighter blue for task highlighting
    const taskBlue = '#3b82f6'; // Bright blue-500
    // Red for duty highlighting
    const dutyRed = '#ef4444'; // Red-500

    // Get combined pinned items (tasks and duties), sorted by most recent first
    const pinnedItems = React.useMemo(() => {
        const activeTasks = messages.filter(m => m.isTask === true && m.taskStatus === 'active');
        const activeDuties = messages.filter(m => m.isDuty === true && m.dutyStatus === 'active');
        // Combine tasks and duties, then sort by creation date (most recent first)
        const combined = [...activeTasks, ...activeDuties];
        return combined.sort((a, b) => {
            const aTime = new Date(a.$createdAt).getTime();
            const bTime = new Date(b.$createdAt).getTime();
            return bTime - aTime; // Descending order (most recent first)
        });
    }, [messages]);

    // Reset pinned item index when pinned items change
    React.useEffect(() => {
        if (pinnedItems.length > 0 && currentPinnedTaskIndex >= pinnedItems.length) {
            setCurrentPinnedTaskIndex(0);
        }
    }, [pinnedItems.length, currentPinnedTaskIndex]);

    // Handle scrolling to task/duty when chat tab is active and message ID is set
    React.useEffect(() => {
        if (activeTab === 'chat' && taskToScrollTo && messages.length > 0 && listRef.current) {
            const scrollToMessage = () => {
                const messageIndex = messages.findIndex(m => m.$id === taskToScrollTo);
                if (messageIndex >= 0) {
                    try {
                        listRef.current?.scrollToIndex({ 
                            index: messageIndex, 
                            animated: true,
                            viewPosition: 0.5 
                        });
                        // Clear the message to scroll to after successful scroll
                        setTimeout(() => setTaskToScrollTo(null), 1000);
                    } catch (error) {
                        console.log('🔍 ScrollToIndex failed, retrying...', error);
                        // Retry with delay
                        setTimeout(() => {
                            const retryIndex = messages.findIndex(m => m.$id === taskToScrollTo);
                            if (retryIndex >= 0 && listRef.current) {
                                try {
                                    listRef.current.scrollToIndex({ 
                                        index: retryIndex, 
                                        animated: true 
                                    });
                                    setTimeout(() => setTaskToScrollTo(null), 500);
                                } catch (retryError) {
                                    console.error('🔍 ScrollToIndex retry failed:', retryError);
                                    setTaskToScrollTo(null);
                                }
                            } else {
                                setTaskToScrollTo(null);
                            }
                        }, 500);
                    }
                } else {
                    setTaskToScrollTo(null);
                }
            };

            // Wait for list to be ready
            const timeoutId = setTimeout(scrollToMessage, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [activeTab, taskToScrollTo, messages]);


    React.useEffect(() => {
        handleFirstLoad();
    }, []);

    // Load preview profile picture
    React.useEffect(() => {
        getUserProfilePicture().then(setPreviewProfilePicture).catch(() => {});
    }, []);

    // Handle captured image from camera page
    React.useEffect(() => {
        const checkCapturedMedia = async () => {
            try {
                const capturedImageUri = await SecureStore.getItemAsync('capturedImageUri')
                if (capturedImageUri) {
                    console.log('🔍 Received captured image URI:', capturedImageUri)
                    setSelectedImages([capturedImageUri])
                    // Clear the stored image URI
                    await SecureStore.deleteItemAsync('capturedImageUri')
                }
                
                const recordedVideoUri = await SecureStore.getItemAsync('recordedVideoUri')
                if (recordedVideoUri) {
                    console.log('🔍 Received recorded video URI:', recordedVideoUri)
                    setSelectedVideo(recordedVideoUri)
                    // Clear the stored video URI
                    await SecureStore.deleteItemAsync('recordedVideoUri')
                }
            } catch (error) {
                console.error('Error retrieving captured media:', error)
            }
        }
        checkCapturedMedia()
    }, []) // Run once on mount and when screen comes into focus

    // Cleanup scroll timeout on unmount
    React.useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

            // Check for most recent report on mount - query from Reports collection
            React.useEffect(() => {
                const checkRecentReport = async () => {
                    if (!jobId || !user?.$id) {
                        console.log('🔍 checkRecentReport (mount): Missing jobId or user.$id', { jobId, userId: user?.$id });
                        return;
                    }
                    
                    // Don't check if we already have a reportId
                    if (reportId) {
                        console.log('🔍 checkRecentReport (mount): Already have reportId, skipping check:', reportId);
                        return;
                    }
                    
                    try {
                        console.log('🔍 checkRecentReport (mount): Querying Reports collection for jobId', { jobId });
                        setIsLoadingReport(true);
                        
                        // Query the Reports collection directly from Appwrite
                        // Get the most recent report for this jobId
                        const reportsResponse = await db.listDocuments(
                            appwriteConfig.db,
                            appwriteConfig.col.reports,
                            [
                                Query.equal('jobId', jobId as string),
                                Query.orderDesc('$createdAt'),
                                Query.limit(1),
                            ]
                        );
                        
                        console.log('🔍 checkRecentReport (mount): Reports response:', reportsResponse);
                        
                        if (reportsResponse.documents && reportsResponse.documents.length > 0) {
                            const latestReport = reportsResponse.documents[0];
                            const foundReportId = latestReport.$id;
                            const reportUrl = `https://web.workphotopro.com/reports/${foundReportId}`;
                            
                            console.log('✅ checkRecentReport (mount): Found recent report:', { 
                                reportId: foundReportId, 
                                reportUrl 
                            });
                            setReportId(foundReportId);
                        } else {
                            console.log('🔍 checkRecentReport (mount): No reports found for this jobId');
                        }
                    } catch (error: any) {
                        console.error('❌ checkRecentReport (mount): Error fetching reports:', error);
                        // If collection doesn't exist, that's okay
                        if (error.code !== 404 && error.code !== 404) {
                            console.error('Unexpected error:', error);
                        }
                    } finally {
                        setIsLoadingReport(false);
                    }
                };
                checkRecentReport();
            }, [jobId, user?.$id]); // Only run when jobId or user changes

    // Auto-refresh when returning to the screen
    useFocusEffect(
        React.useCallback(() => {
            console.log('🔍 useFocusEffect: Screen focused, refreshing messages');
            
            // Check for captured media from camera
            const checkCapturedMedia = async () => {
                try {
                    const capturedImageUri = await SecureStore.getItemAsync('capturedImageUri')
                    if (capturedImageUri) {
                        console.log('🔍 Received captured image URI from camera:', capturedImageUri)
                        setSelectedImages([capturedImageUri])
                        // Clear the stored image URI
                        await SecureStore.deleteItemAsync('capturedImageUri')
                    }
                    
                    const recordedVideoUri = await SecureStore.getItemAsync('recordedVideoUri')
                    if (recordedVideoUri) {
                        console.log('🔍 Received recorded video URI from camera:', recordedVideoUri)
                        setSelectedVideo(recordedVideoUri)
                        // Clear the stored video URI
                        await SecureStore.deleteItemAsync('recordedVideoUri')
                    }
                } catch (error) {
                    console.error('Error retrieving captured media:', error)
                }
            }
            checkCapturedMedia()
            
            // Check for most recent report when screen comes into focus - query from Reports collection
            const checkRecentReportOnFocus = async () => {
                if (!jobId || !user?.$id) {
                    console.log('🔍 checkRecentReport (focus): Missing jobId or user.$id', { jobId, userId: user?.$id });
                    return;
                }
                
                try {
                    console.log('🔍 checkRecentReport (focus): Querying Reports collection for jobId', { jobId });
                    setIsLoadingReport(true);
                    
                    // Query the Reports collection directly from Appwrite
                    // Get the most recent report for this jobId
                    const reportsResponse = await db.listDocuments(
                        appwriteConfig.db,
                        appwriteConfig.col.reports,
                        [
                            Query.equal('jobId', jobId as string),
                            Query.orderDesc('$createdAt'),
                            Query.limit(1),
                        ]
                    );
                    
                    console.log('🔍 checkRecentReport (focus): Reports response:', reportsResponse);
                    
                    if (reportsResponse.documents && reportsResponse.documents.length > 0) {
                        const latestReport = reportsResponse.documents[0];
                        const foundReportId = latestReport.$id;
                        const reportUrl = `https://web.workphotopro.com/reports/${foundReportId}`;
                        
                        console.log('✅ checkRecentReport (focus): Found recent report:', { 
                            reportId: foundReportId, 
                            reportUrl 
                        });
                        setReportId(foundReportId);
                    } else {
                        console.log('🔍 checkRecentReport (focus): No reports found for this jobId');
                    }
                } catch (error: any) {
                    console.error('❌ checkRecentReport (focus): Error fetching reports:', error);
                    // If collection doesn't exist, that's okay
                    if (error.code !== 404) {
                        console.error('Unexpected error:', error);
                    }
                } finally {
                    setIsLoadingReport(false);
                }
            };
            checkRecentReportOnFocus();
            
            // Refresh messages - only reload if we're not in the middle of loading older messages or refreshing
            // This prevents race conditions where this useEffect and handleRefresh both try to update messages
            const refreshMessages = async () => {
                if (!isLoadingOlderMessages && !isRefreshing && messages.length === 0) {
                    setShouldScrollToBottom(true);
                    setOldestMessageId(null);
                    setHasMoreMessages(true);
                    await getMessages(false);
                } else {
                    console.log('🔍 useEffect jobId: Skipping refresh - messages already loaded or loading in progress');
                }
            };
            refreshMessages();
        }, [jobId, user?.$id])
    );

    React.useEffect(() => {
        const keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', (e) => {
            setKeyboardHeight(e.endCoordinates.height);
        });
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
            setKeyboardHeight(e.endCoordinates.height);
        });
        const keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', () => {
            setKeyboardHeight(0);
        });
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardHeight(0);
        });

        return () => {
            keyboardWillShowListener?.remove();
            keyboardDidShowListener?.remove();
            keyboardWillHideListener?.remove();
            keyboardDidHideListener?.remove();
        };
    }, []);


    React.useEffect(() => {
        if (!jobId) return;
        
        const channel = `databases.${appwriteConfig.db}.collections.${appwriteConfig.col.messages}.documents`;
        console.log('🔍 Real-time subscription: Setting up subscription for channel:', channel);
        
        let unsubscribe: (() => void) | null = null;
        let retryAttempt = 0;
        const maxRetries = 1;
        
        const setupSubscription = () => {
            try {
                unsubscribe = client.subscribe(channel, (event) => {
                    try {
                        console.log('🔍 Real-time subscription: Received event:', event);
                        console.log('🔍 Real-time subscription: Event type:', event.events);
                        console.log('🔍 Real-time subscription: Event payload:', event.payload);
                        
                        // Only refresh if the event is related to our job
                        if (event.payload && (event.payload as any).jobId === jobId) {
                            console.log('🔍 Real-time subscription: Event is for our job, appending new message');
                            const newMessage = event.payload as any;
                            setMessages(prev => {
                                // Deduplicate
                                if (prev.find(m => m.$id === newMessage.$id)) return prev;
                                // Append and sort
                                return [...prev, newMessage].sort((a, b) => 
                                    new Date(a.$createdAt).getTime() - 
                                    new Date(b.$createdAt).getTime()
                                );
                            });
                            setShouldScrollToBottom(true);
                        }
                    } catch (error) {
                        console.error('🔍 Real-time subscription: Error handling event:', error);
                    }
                });
                
                // Connection successful
                console.log('✅ Real-time subscription: Connected successfully');
                retryAttempt = 0; // Reset retry counter on success
            } catch (error) {
                console.error('❌ Real-time subscription: Connection failed', error);
                
                // Retry logic: wait 3 seconds and retry once
                if (retryAttempt < maxRetries) {
                    retryAttempt++;
                    console.log(`🔍 Real-time subscription: Retrying connection (attempt ${retryAttempt}/${maxRetries})...`);
                    setTimeout(() => {
                        setupSubscription();
                    }, 3000);
                }
            }
        };
        
        // Initial subscription attempt
        setupSubscription();
        
        // AppState listener to resubscribe when app comes back to foreground
        const appStateSubscription = AppState.addEventListener(
            'change',
            (nextAppState) => {
                if (nextAppState === 'active') {
                    console.log('📱 App came to foreground - resubscribing to real-time');
                    if (unsubscribe) {
                        unsubscribe();
                        unsubscribe = null;
                    }
                    setupSubscription();
                }
            }
        );
        
        return () => {
            appStateSubscription.remove();
            try {
                if (unsubscribe) {
                    console.log('🔍 Real-time subscription: Unsubscribing from channel:', channel);
                    unsubscribe();
                }
            } catch (error) {
                console.error('🔍 Real-time subscription: Error unsubscribing:', error);
            }
        };
    }, [jobId]);

    // Restore scroll position after loading older messages
    // This maintains user's view when new messages are prepended above
    React.useEffect(() => {
        // Only restore if we're done loading older messages and have a message to maintain
        const messageIdToRestore = messageToMaintainPosition.current;
        if (!messageIdToRestore || isLoadingOlderMessages || !listRef.current || messages.length === 0) {
            return;
        }
        
        const messageIndex = messages.findIndex(m => m.$id === messageIdToRestore);
        
        if (messageIndex >= 0) {
            console.log('🔍 Restore scroll position: Restoring to message index:', messageIndex, 'messageId:', messageIdToRestore);
            
            // Use multiple attempts with increasing delays to ensure list is fully rendered
            const restorePosition = (attempt: number = 1) => {
                const delays = [50, 100, 200]; // Progressive delays
                const delay = delays[attempt - 1] || 200;
                
                setTimeout(() => {
                    try {
                        // Try scrollToIndex first (most accurate)
                        listRef.current?.scrollToIndex({ 
                            index: messageIndex, 
                            animated: false, 
                            viewPosition: 0 
                        });
                        console.log('🔍 Restore scroll position: Successfully restored (attempt', attempt, ')');
                        messageToMaintainPosition.current = null; // Clear after successful restore
                    } catch (error) {
                        console.log('🔍 Restore scroll position: Attempt', attempt, 'failed:', error);
                        
                        // If scrollToIndex fails and we haven't tried all attempts, try again
                        if (attempt < 3) {
                            restorePosition(attempt + 1);
                        } else {
                            // Final fallback: use scrollToOffset with estimated position
                            try {
                                const estimatedOffset = messageIndex * 120; // Approximate message height
                                listRef.current?.scrollToOffset({ offset: estimatedOffset, animated: false });
                                console.log('🔍 Restore scroll position: Using fallback scrollToOffset');
                                messageToMaintainPosition.current = null;
                            } catch (fallbackError) {
                                console.log('🔍 Restore scroll position: All attempts failed:', fallbackError);
                                messageToMaintainPosition.current = null; // Clear even on failure to prevent infinite loops
                            }
                        }
                    }
                }, delay);
            };
            
            // Start restoration process
            requestAnimationFrame(() => {
                restorePosition(1);
            });
        } else {
            console.log('🔍 Restore scroll position: Message not found, clearing restore target');
            messageToMaintainPosition.current = null; // Clear if message not found
        }
    }, [messages, isLoadingOlderMessages]);

    // Scroll to end when messages change (only if shouldScrollToBottom is true)
    // This prevents auto-scroll when loading older messages or when user is scrolling
    React.useEffect(() => {
        console.log('🔍 Messages effect: Messages array changed, length:', messages.length);
        console.log('🔍 Messages effect: shouldScrollToBottom:', shouldScrollToBottom, 'isLoadingOlder:', isLoadingOlderMessages, 'isUserScrolling:', isUserScrolling.current, 'allMessagesLoaded:', allMessagesLoaded, 'maintainingPosition:', messageToMaintainPosition.current !== null);
        
        // Don't scroll if:
        // 1. Loading older messages (we're maintaining position)
        // 2. User is actively scrolling
        // 3. All messages are loaded (no auto-scroll needed)
        // 4. We're maintaining scroll position after loading older messages
        if (isLoadingOlderMessages || isUserScrolling.current || allMessagesLoaded || messageToMaintainPosition.current !== null) {
            console.log('🔍 Messages effect: Skipping auto-scroll due to conditions');
            return;
        }
        
        // Only auto-scroll to bottom for new messages (when shouldScrollToBottom is true)
        if (messages.length > 0 && listRef.current && shouldScrollToBottom) {
            // Use multiple timing strategies to ensure scroll happens
            const scrollToBottom = () => {
                // Double-check conditions before scrolling
                if (isUserScrolling.current || isLoadingOlderMessages || messageToMaintainPosition.current !== null) {
                    return;
                }
                try {
                    listRef.current?.scrollToEnd({ animated: !isInitialLoad });
                } catch (error) {
                    console.log('🔍 ScrollToEnd error:', error);
                }
            };
            
            // Try immediately
            requestAnimationFrame(() => {
                scrollToBottom();
            });
            
            // After initial load, set isInitialLoad to false
            if (isInitialLoad) {
                setTimeout(() => setIsInitialLoad(false), 500);
            }
        }
    }, [messages, shouldScrollToBottom, isInitialLoad, isLoadingOlderMessages]);
    
    // Early return check must be AFTER all hooks to maintain hook order
    if(!jobId) {
        console.log('🔍 Job Component: No jobId found, returning error');
        return <Text>Job not found. </Text>
    }
    
        const handleFirstLoad = async () => {
        try {
            console.log('🔍 handleFirstLoad: Starting initial load...');
            await getJobChat();
            await getMessages();
            console.log('🔍 handleFirstLoad: Initial load completed');
        } catch(e) {
            console.error('🔍 handleFirstLoad: Error during initial load:', e);
        }
    };


    const getJobChat = async () => {
        try {
            console.log('🔍 getJobChat: Fetching job chat for jobId:', jobId);
            const data = await db.getDocument<JobChat>(
                appwriteConfig.db, 
                appwriteConfig.col.jobchat, 
                jobId as string
            );
            console.log('🔍 getJobChat: Successfully fetched job chat:', data);
            setJobChat(data);
        } catch(e) {
            console.error('🔍 getJobChat: Error fetching job chat:', e);
        }
    };

    // Function to update jobChat status locally and in database
    const updateJobStatus = async (status: 'active' | 'completed') => {
        try {
            console.log('🔍 updateJobStatus: Updating job status to:', status);
            
            // Update the database
            await db.updateDocument(
                appwriteConfig.db,
                appwriteConfig.col.jobchat,
                jobId as string,
                { status }
            );
            
            // Update local state to reflect the change immediately
            setJobChat(prevJobChat => {
                if (prevJobChat) {
                    return { ...prevJobChat, status };
                }
                return prevJobChat;
            });
            
            console.log('🔍 updateJobStatus: Status updated successfully');
        } catch (error) {
            console.error('🔍 updateJobStatus: Error updating job status:', error);
            throw error; // Re-throw to let the calling component handle the error
        }
    };
        

// Helper function to process and normalize messages
const processMessages = (documents: any[]): Message[] => {
    return documents.map((doc: any) => {
        // Normalize isTask field (handle string "true" or boolean true)
        if (doc.isTask === true || doc.isTask === 'true' || doc.isTask === 1) {
            doc.isTask = true;
            // Set default taskStatus if isTask is true but taskStatus is missing
            if (!doc.taskStatus) {
                doc.taskStatus = 'active';
            }
        } else {
            doc.isTask = false;
        }

        // Normalize isDuty field (handle string "true" or boolean true)
        if (doc.isDuty === true || doc.isDuty === 'true' || doc.isDuty === 1) {
            doc.isDuty = true;
            // Set default dutyStatus if isDuty is true but dutyStatus is missing
            if (!doc.dutyStatus) {
                doc.dutyStatus = 'active';
            }
        } else {
            doc.isDuty = false;
        }
        
        // Check if this message has locationData (infers it's a location message)
        if (doc.locationData) {
            // Parse locationData from attribute (stored as JSON string)
            if (typeof doc.locationData === 'string') {
                try {
                    doc.locationData = JSON.parse(doc.locationData);
                    doc.messageType = 'location'; // Infer messageType from locationData presence
                    console.log('🔍 processMessages: Parsed locationData and inferred messageType=location for message:', doc.$id);
                } catch (e) {
                    console.error('🔍 processMessages: Error parsing locationData:', e, 'Raw data:', doc.locationData);
                    // If parsing fails, try parsing from content field (backward compatibility)
                    const locationMatch = doc.content?.match(/\|LOCATION_DATA:(.+?)\|/);
                    if (locationMatch && locationMatch[1]) {
                        try {
                            doc.locationData = JSON.parse(locationMatch[1]);
                            doc.content = doc.content.replace(/\|LOCATION_DATA:.+?\|/, '').trim();
                            doc.messageType = 'location';
                            console.log('🔍 processMessages: Parsed locationData from content (fallback) for message:', doc.$id);
                        } catch (e2) {
                            console.error('🔍 processMessages: Error parsing locationData from content:', e2);
                        }
                    }
                }
            } else if (typeof doc.locationData === 'object') {
                // Already parsed (shouldn't happen, but handle it just in case)
                doc.messageType = 'location';
                console.log('🔍 processMessages: locationData already an object, inferred messageType=location for message:', doc.$id);
            }
        } else if (doc.messageType === 'location') {
            // Backward compatibility: if messageType exists but no locationData, remove messageType
            // This handles old messages that might have messageType but no locationData
            console.log('🔍 processMessages: Found messageType=location but no locationData, removing messageType:', doc.$id);
            delete doc.messageType;
        }
        return doc;
    }) as Message[];
};

const getMessages = async (loadOlder: boolean = false) => {
    try {
        setIsLoadingOlderMessages(loadOlder);
        
        console.log('🔍 getMessages: Fetching messages for jobId:', jobId, 'loadOlder:', loadOlder);
        
        // Determine query parameters based on whether we're loading older messages
        const limit = loadOlder ? 20 : 10; // Load 10 initially, 20 when loading older
        const queries: any[] = [
            Query.equal('jobId', jobId as string),
            Query.orderDesc('$createdAt'), // Get newest first
            Query.limit(limit),
        ];
        
        // If loading older messages, add a cursor to get messages before the oldest one
        // Use cursorBefore with the oldest message ID
        if (loadOlder && oldestMessageId) {
            queries.push(Query.cursorBefore(oldestMessageId));
            console.log('🔍 getMessages: Using cursorBefore with message ID:', oldestMessageId);
        }
        
        const { documents, total } = await db.listDocuments<Message>(
            appwriteConfig.db, 
            appwriteConfig.col.messages,
            queries
        );
        
        console.log('🔍 getMessages: Successfully fetched messages:', {
            count: documents.length,
            total: total,
            loadOlder,
            hasMore: documents.length === limit
        });
        
        // Process and normalize messages
        const freshMessages = processMessages(documents);
        
        // Reverse to get chronological order (oldest to newest)
        const sortedMessages = [...freshMessages].reverse().sort((a, b) => {
            return new Date(a.$createdAt).getTime() - new Date(b.$createdAt).getTime();
        });
        
        // Preload media for offline access (in background)
        if (!loadOlder && sortedMessages.length > 0) {
            const imageUrls: string[] = [];
            sortedMessages.forEach(msg => {
                if (msg.imageUrl) imageUrls.push(msg.imageUrl);
                if (msg.imageUrls) imageUrls.push(...msg.imageUrls);
            });
            if (imageUrls.length > 0) {
                // Preload images in background (don't await)
                import('@/utils/offlineCache').then(({ offlineCache }) => {
                    offlineCache.preloadRecentMedia(imageUrls, 'image').catch(err => {
                        console.warn('[Job] Preload error (non-critical):', err);
                    });
                });
            }
        }

        if (loadOlder) {
            // When loading older messages, prepend them to the existing messages
            setMessages(prevMessages => {
                // Combine old and new messages, avoiding duplicates
                const combined = [...sortedMessages, ...prevMessages];
                const unique = combined.filter((msg, index, self) => 
                    index === self.findIndex(m => m.$id === msg.$id)
                );
                // Sort by date to maintain chronological order
                const final = unique.sort((a, b) => 
                    new Date(a.$createdAt).getTime() - new Date(b.$createdAt).getTime()
                );
                return final;
            });
            
            
            // Update hasMoreMessages based on whether we got a full page
            // If we got fewer messages than requested, we've reached the end
            setHasMoreMessages(documents.length === limit);
        } else {
            // Initial load - replace all messages
            setMessages(sortedMessages);
            setShouldScrollToBottom(true);
            setIsInitialLoad(true);
            setAllMessagesLoaded(false); // Reset flag when doing normal pagination load
            
            // Update pagination state
            if (sortedMessages.length > 0) {
                const oldest = sortedMessages[0];
                setOldestMessageId(oldest.$id);
                setHasMoreMessages(documents.length === limit && total > limit);
            } else {
                setHasMoreMessages(false);
            }
        }
        
    } catch(e) {
        console.error('🔍 getMessages: Error fetching messages:', e);
        setHasMoreMessages(false);
    } finally {
        setIsLoadingOlderMessages(false);
    }
}

    // Function to load ALL messages (bypassing pagination limits)
    const loadAllMessages = async () => {
        try {
            setIsLoadingAllMessages(true);
            console.log('🔍 loadAllMessages: Loading all messages for jobId:', jobId);
            
            let allMessages: Message[] = [];
            let lastMessageId: string | null = null;
            const limit = 100; // Appwrite max limit per query
            
            // Paginate through all messages
            while (true) {
                const queries: any[] = [
                    Query.equal('jobId', jobId as string),
                    Query.orderDesc('$createdAt'), // Get newest first
                    Query.limit(limit),
                ];
                
                // Add cursor for pagination if we have a last message ID
                if (lastMessageId) {
                    queries.push(Query.cursorAfter(lastMessageId));
                }
                
                const { documents } = await db.listDocuments<Message>(
                    appwriteConfig.db, 
                    appwriteConfig.col.messages,
                    queries
                );
                
                if (documents.length === 0) {
                    break; // No more messages
                }
                
                // Process and normalize messages
                const processedMessages = processMessages(documents);
                allMessages = allMessages.concat(processedMessages);
                
                // Set last message ID for next iteration
                lastMessageId = documents[documents.length - 1].$id;
                
                // If we got fewer than the limit, we've fetched all messages
                if (documents.length < limit) {
                    break;
                }
            }
            
            // Reverse to get chronological order (oldest to newest)
            const sortedMessages = allMessages.sort((a, b) => {
                return new Date(a.$createdAt).getTime() - new Date(b.$createdAt).getTime();
            });
            
            console.log('🔍 loadAllMessages: Loaded all messages:', {
                totalCount: sortedMessages.length
            });
            
            // Update state with all messages
            // Don't scroll anywhere - let the list maintain its natural position
            setMessages(sortedMessages);
            setShouldScrollToBottom(false); // Don't auto-scroll
            setHasMoreMessages(false); // No more messages to load
            setOldestMessageId(null);
            setAllMessagesLoaded(true); // Mark that all messages are loaded
            
            // Preload media for offline access (in background)
            if (sortedMessages.length > 0) {
                const imageUrls: string[] = [];
                sortedMessages.forEach(msg => {
                    if (msg.imageUrl) imageUrls.push(msg.imageUrl);
                    if (msg.imageUrls) imageUrls.push(...msg.imageUrls);
                });
                if (imageUrls.length > 0) {
                    // Preload images in background (don't await)
                    import('@/utils/offlineCache').then(({ offlineCache }) => {
                        offlineCache.preloadRecentMedia(imageUrls, 'image').catch(err => {
                            console.warn('[Job] Preload error (non-critical):', err);
                        });
                    });
                }
            }
            
            Alert.alert(
                'All Messages Loaded',
                `Loaded ${sortedMessages.length} message${sortedMessages.length !== 1 ? 's' : ''} from this chat.`,
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('🔍 loadAllMessages: Error loading all messages:', error);
            Alert.alert('Error', 'Failed to load all messages. Please try again.');
        } finally {
            setIsLoadingAllMessages(false);
        }
    };

// Function to load older messages when user scrolls up
const loadOlderMessages = async () => {
    // Don't try to load older messages if all messages are already loaded
    if (allMessagesLoaded) {
        console.log('🔍 loadOlderMessages: Skipping - all messages already loaded');
        return;
    }
    
    if (isLoadingOlderMessages || !hasMoreMessages || messages.length === 0) {
        console.log('🔍 loadOlderMessages: Skipping - isLoading:', isLoadingOlderMessages, 'hasMore:', hasMoreMessages, 'messages:', messages.length);
        return;
    }
    
    console.log('🔍 loadOlderMessages: Loading older messages, current oldestMessageId:', oldestMessageId);
    setShouldScrollToBottom(false); // Don't auto-scroll when loading older messages
    
    // Capture the message ID that should remain visible after loading
    // This will be used to restore scroll position naturally
    const currentOldestMessage = messages[0];
    if (currentOldestMessage && currentOldestMessage.$id) {
        // Store the message ID to maintain position
        messageToMaintainPosition.current = currentOldestMessage.$id;
        console.log('🔍 loadOlderMessages: Will maintain position at message:', messageToMaintainPosition.current);
        
        // Set the oldest message ID before loading
        setOldestMessageId(currentOldestMessage.$id);
        await getMessages(true);
        
        // Reset the flag after a delay to allow scroll restoration
        setTimeout(() => {
            messageToMaintainPosition.current = null;
            hasTriggeredLoadMore.current = false;
        }, 1000);
    }
}

    const pickImage = async () => {
        setShowAttachmentMenu(false);
        setShowClipboardMenu(false);
        setShowEmojiPicker(false);
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (permissionResult.granted === false) {
                Alert.alert('Permission Required', 'Please allow access to your photo library to send images.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false, // Can't edit multiple images
                allowsMultipleSelection: true, // Enable multiple selection
                quality: 0.8,
                selectionLimit: 9, // Limit to 9 images max
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const uris = result.assets.map(asset => asset.uri);
                setSelectedImages(uris);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image. Please try again.');
        }
    };

    const handleUploadImage = async () => {
        if (isUploading) return;
        await pickImage();
    };

    const pickDocument = async () => {
        setShowAttachmentMenu(false);
        setShowClipboardMenu(false);
        setShowEmojiPicker(false);
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'text/plain',
                    'application/rtf',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-powerpoint',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'application/zip',
                    'application/x-rar-compressed',
                ],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets[0]) {
                const file = result.assets[0];
                
                // Check file size (10MB limit for documents)
                const maxSize = 10 * 1024 * 1024; // 10MB in bytes
                if (file.size && file.size > maxSize) {
                    Alert.alert('File Too Large', `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds the 10MB limit.`);
                    return;
                }
                
                setSelectedFile(file);
            }
        } catch (error) {
            console.error('Error picking document:', error);
            Alert.alert('Error', 'Failed to pick document. Please try again.');
        }
    };

    const handleUploadDocument = async () => {
        await pickDocument();
    };

    const pickCamera = () => {
        if (canUploadPhoto) {
            router.push(`/(jobs)/camera?jobId=${jobId}`);
        }
    };

    const pickVideoCamera = () => {
        if (canRecordVideo) {
            router.push(`/(jobs)/video-camera?jobId=${jobId}`);
        }
    };

    const handleRecordAudio = () => {
        setShowAudioRecorder(true);
    };

    const uploadImage = async (imageUri: string): Promise<{ fileId: string; fileUrl: string } | null> => {
        try {
            if (!appwriteConfig.bucket) {
                Alert.alert('Configuration Error', 'Bucket ID not configured. Please add EXPO_PUBLIC_APPWRITE_BUCKET_ID to your .env file.');
                throw new Error('Bucket ID not configured');
            }

            // Create a unique file ID
            const fileId = ID.unique();

            // Create a file object from the image URI
            const filename = imageUri.split('/').pop() || `image-${Date.now()}.jpg`;
            
            // Fetch the image and create a proper file object
            const response = await fetch(imageUri);
            const blob = await response.blob();
            
            // Create file object for React Native Appwrite
            const file = {
                uri: imageUri,
                name: filename,
                type: blob.type || 'image/jpeg',
                size: blob.size,
            };

            // Upload to Appwrite Storage
            const uploadResponse = await storage.createFile(
                appwriteConfig.bucket,
                fileId,
                file
            );

            // Check if response is valid
            if (!uploadResponse || !uploadResponse.$id) {
                throw new Error(`Invalid upload response: ${JSON.stringify(uploadResponse)}`);
            }

            // Get the file URL
            const fileUrl = `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucket}/files/${uploadResponse.$id}/view?project=${appwriteConfig.projectId}`;

            return {
                fileId: uploadResponse.$id,
                fileUrl: fileUrl,
            };
        } catch (error) {
            console.error('Error uploading image:', error);
            Alert.alert('Upload Failed', `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return null;
        }
    };

    const uploadVideo = async (videoUri: string): Promise<{ fileId: string; fileUrl: string } | null> => {
        try {
            if (!appwriteConfig.bucket) {
                Alert.alert('Configuration Error', 'Bucket ID not configured. Please add EXPO_PUBLIC_APPWRITE_BUCKET_ID to your .env file.');
                throw new Error('Bucket ID not configured');
            }

            // Create a unique file ID
            const fileId = ID.unique();

            // Create a file object from the video URI
            const filename = videoUri.split('/').pop() || `video-${Date.now()}.mp4`;
            
            // Determine MIME type based on file extension
            const fileExtension = filename.split('.').pop()?.toLowerCase();
            let mimeType = 'video/mp4'; // Default
            if (fileExtension === 'mov') {
                mimeType = 'video/quicktime';
            } else if (fileExtension === 'webm') {
                mimeType = 'video/webm';
            }
            
            // Fetch the video and create a proper file object (same approach as images)
            const response = await fetch(videoUri);
            const blob = await response.blob();
            
            // Create file object for React Native Appwrite (same format as images)
            const file = {
                uri: videoUri,
                name: filename,
                type: mimeType,
                size: blob.size,
            };

            console.log('📹 Uploading video:', { filename, mimeType, uri: videoUri, size: blob.size });

            // Upload to Appwrite Storage using object parameter style
            const uploadResponse = await storage.createFile({
                bucketId: appwriteConfig.bucket,
                fileId: fileId,
                file: file
            });

            // Check if response is valid
            if (!uploadResponse || !uploadResponse.$id) {
                throw new Error(`Invalid upload response: ${JSON.stringify(uploadResponse)}`);
            }

            // Get the file URL
            const fileUrl = `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucket}/files/${uploadResponse.$id}/view?project=${appwriteConfig.projectId}`;

            console.log('✅ Video uploaded successfully:', { fileId: uploadResponse.$id, fileUrl });

            return {
                fileId: uploadResponse.$id,
                fileUrl: fileUrl,
            };
        } catch (error) {
            console.error('Error uploading video:', error);
            Alert.alert('Upload Failed', `Failed to upload video: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return null;
        }
    };

    const uploadFile = async (fileUri: string, fileName: string, mimeType: string): Promise<{ fileId: string; fileUrl: string } | null> => {
        try {
            if (!appwriteConfig.bucket) {
                Alert.alert('Configuration Error', 'Bucket ID not configured.');
                throw new Error('Bucket ID not configured');
            }

            const fileId = ID.unique();
            
            // Fetch the file and create a blob
            const response = await fetch(fileUri);
            const blob = await response.blob();
            
            // Create file object for React Native Appwrite
            const file = {
                uri: fileUri,
                name: fileName,
                type: mimeType,
                size: blob.size,
            };

            console.log('📄 Uploading file:', { fileName, mimeType, size: blob.size });

            const uploadResponse = await storage.createFile({
                bucketId: appwriteConfig.bucket,
                fileId: fileId,
                file: file
            });

            if (!uploadResponse || !uploadResponse.$id) {
                throw new Error(`Invalid upload response: ${JSON.stringify(uploadResponse)}`);
            }

            const fileUrl = `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucket}/files/${uploadResponse.$id}/view?project=${appwriteConfig.projectId}`;

            console.log('✅ File uploaded successfully:', { fileId: uploadResponse.$id, fileUrl });

            return {
                fileId: uploadResponse.$id,
                fileUrl: fileUrl,
            };
        } catch (error) {
            console.error('Error uploading file:', error);
            Alert.alert('Upload Failed', `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return null;
        }
    };

    const uploadAudio = async (audioUri: string): Promise<{ fileId: string; fileUrl: string } | null> => {
        try {
            if (!appwriteConfig.bucket) {
                Alert.alert('Configuration Error', 'Bucket ID not configured.');
                throw new Error('Bucket ID not configured');
            }

            const fileId = ID.unique();
            
            // Determine filename and MIME type
            const filename = `audio_${Date.now()}.m4a`;
            const mimeType = 'audio/m4a';
            
            // Fetch the audio and create a blob
            const response = await fetch(audioUri);
            const blob = await response.blob();
            
            // Create file object for React Native Appwrite
            const file = {
                uri: audioUri,
                name: filename,
                type: mimeType,
                size: blob.size,
            };

            console.log('🎤 Uploading audio:', { filename, mimeType, size: blob.size });

            const uploadResponse = await storage.createFile({
                bucketId: appwriteConfig.bucket,
                fileId: fileId,
                file: file
            });

            if (!uploadResponse || !uploadResponse.$id) {
                throw new Error(`Invalid upload response: ${JSON.stringify(uploadResponse)}`);
            }

            const fileUrl = `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucket}/files/${uploadResponse.$id}/view?project=${appwriteConfig.projectId}`;

            console.log('✅ Audio uploaded successfully:', { fileId: uploadResponse.$id, fileUrl });

            return {
                fileId: uploadResponse.$id,
                fileUrl: fileUrl,
            };
        } catch (error) {
            console.error('Error uploading audio:', error);
            Alert.alert('Upload Failed', `Failed to upload audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return null;
        }
    };

    const sendMessage = async () => {
       
       setShowAttachmentMenu(false);
       setShowClipboardMenu(false);
       
       // For editing, only require text content (no attachments allowed)
       if (editingMessage) {
           if (messageContent.trim() === '') return;
       } else {
           // For new messages, require content or attachments
           if(messageContent.trim() === '' && selectedImages.length === 0 && !selectedVideo && !selectedFile && !selectedAudio) return;
       }
       
       // Check if we have required team and organization data
       if (!currentTeam?.$id || !currentOrganization?.$id) {
           console.error('🔍 sendMessage: Missing team or organization data:', {
               teamId: currentTeam?.$id,
               orgId: currentOrganization?.$id
           });
           Alert.alert('Error', 'Please select a team and organization before sending messages.');
           return;
       }
       
        try {
        console.log('🔍 sendMessage: Starting to send message...');
        console.log('🔍 sendMessage: Current messages count before sending:', messages.length);
        console.log('🔍 sendMessage: Message content:', messageContent);
        console.log('🔍 sendMessage: User info:', { userId: user?.$id, userName: user?.name });
        
        setIsUploading(true);
        
        let imageUrl = undefined;
        let imageFileId = undefined;
        let imageUrls: string[] = [];
        let imageFileIds: string[] = [];
        let videoUrl = undefined;
        let videoFileId = undefined;
        let fileUrl = undefined;
        let fileFileId = undefined;
        let fileName = undefined;
        let fileSize = undefined;
        let fileMimeType = undefined;
        let audioUrl = undefined;
        let audioFileId = undefined;
        let audioDuration = undefined;

        // Get user's profile picture from Google OAuth or stored preferences
        const userProfilePicture = await getUserProfilePicture();
        console.log('🔍 sendMessage: User profile picture:', userProfilePicture);

        // Upload multiple images if any are selected
        if (selectedImages.length > 0) {
            console.log('🔍 sendMessage: Uploading', selectedImages.length, 'image(s)...');
            setUploadStatus('Uploading images...');
            setUploadProgress(0);
            
            // Upload all images in parallel
            const uploadPromises = selectedImages.map((imageUri, index) => {
                return uploadImage(imageUri).then(result => {
                    // Update progress
                    setUploadProgress(Math.round(((index + 1) / selectedImages.length) * 90));
                    return result;
                });
            });
            
            const uploadResults = await Promise.all(uploadPromises);
            
            // Filter out failed uploads and collect URLs/IDs
            uploadResults.forEach((result, index) => {
                if (result) {
                    imageUrls.push(result.fileUrl);
                    imageFileIds.push(result.fileId);
                } else {
                    console.warn(`🔍 sendMessage: Failed to upload image ${index + 1}`);
                }
            });
            
            // Only proceed if at least one image uploaded successfully
            if (imageUrls.length === 0) {
                console.error('🔍 sendMessage: All image uploads failed');
                setUploadStatus('');
                setUploadProgress(0);
                setIsUploading(false);
                Alert.alert('Upload Failed', 'Failed to upload images. Please try again.');
                return; // Don't send message if all image uploads failed
            }
            
            setUploadProgress(100);
            setUploadStatus('Images uploaded!');
            console.log('🔍 sendMessage: Successfully uploaded', imageUrls.length, 'image(s)');
            
            // For backward compatibility, also set single image fields if only one image
            if (imageUrls.length === 1) {
                imageUrl = imageUrls[0];
                imageFileId = imageFileIds[0];
            }
        }

        // Upload video if one is selected
        if (selectedVideo) {
            console.log('🔍 sendMessage: Uploading video...');
            setUploadStatus('Uploading video...');
            setUploadProgress(0);
            
            // Simulate progress (since Appwrite doesn't provide progress callbacks)
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) return prev; // Don't go to 100% until actually done
                    return prev + 10;
                });
            }, 200);
            
            const uploadResult = await uploadVideo(selectedVideo);
            clearInterval(progressInterval);
            
            if (uploadResult) {
                setUploadProgress(100);
                videoUrl = uploadResult.fileUrl;
                videoFileId = uploadResult.fileId;
                console.log('🔍 sendMessage: Video uploaded successfully:', { videoUrl, videoFileId });
                setUploadStatus('Video uploaded!');
            } else {
                console.error('🔍 sendMessage: Video upload failed');
                setUploadStatus('');
                setUploadProgress(0);
                setIsUploading(false);
                return; // Don't send message if video upload failed
            }
        }

        // Upload file if one is selected
        if (selectedFile) {
            console.log('🔍 sendMessage: Uploading file...');
            setUploadStatus('Uploading file...');
            setUploadProgress(0);
            
            // Simulate progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) return prev;
                    return prev + 10;
                });
            }, 200);
            
            const uploadResult = await uploadFile(
                selectedFile.uri,
                selectedFile.name || `file-${Date.now()}`,
                selectedFile.mimeType || 'application/octet-stream'
            );
            clearInterval(progressInterval);
            
            if (uploadResult) {
                setUploadProgress(100);
                fileUrl = uploadResult.fileUrl;
                fileFileId = uploadResult.fileId;
                fileName = selectedFile.name;
                fileSize = selectedFile.size || 0;
                fileMimeType = selectedFile.mimeType || 'application/octet-stream';
                console.log('🔍 sendMessage: File uploaded successfully:', { fileUrl, fileFileId, fileName });
                setUploadStatus('File uploaded!');
                
                // Clean up cached document file after successful upload
                try {
                    const { cacheManager } = await import('@/utils/cacheManager');
                    await cacheManager.deleteCacheFile(selectedFile.uri);
                    console.log('🔍 sendMessage: ✅ Cached document file cleaned up');
                } catch (cleanupError) {
                    console.warn('🔍 sendMessage: ⚠️ Could not clean up cached document file (non-critical):', cleanupError);
                    // Non-critical error - file is uploaded, cache cleanup is optional
                }
            } else {
                console.error('🔍 sendMessage: File upload failed');
                setUploadStatus('');
                setUploadProgress(0);
                setIsUploading(false);
                return; // Don't send message if file upload failed
            }
        }

        // Upload audio if one is selected
        if (selectedAudio) {
            console.log('🔍 sendMessage: Uploading audio...');
            setUploadStatus('Uploading audio...');
            setUploadProgress(0);
            
            // Simulate progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) return prev;
                    return prev + 10;
                });
            }, 200);
            
            const uploadResult = await uploadAudio(selectedAudio.uri);
            clearInterval(progressInterval);
            
            if (uploadResult) {
                setUploadProgress(100);
                audioUrl = uploadResult.fileUrl;
                audioFileId = uploadResult.fileId;
                audioDuration = selectedAudio.duration;
                console.log('🔍 sendMessage: Audio uploaded successfully:', { audioUrl, audioFileId, audioDuration });
                setUploadStatus('Audio uploaded!');
            } else {
                console.error('🔍 sendMessage: Audio upload failed');
                setUploadStatus('');
                setUploadProgress(0);
                setIsUploading(false);
                return; // Don't send message if audio upload failed
            }
        }

       const message: any = {
        content: messageContent || '', // Empty string if only media
        senderId: user?.$id,
        senderName: user?.name,
        senderPhoto: userProfilePicture || '', // Use user's profile picture from preferences
        jobId: jobId,
        teamId: currentTeam?.$id, // Add teamId from current team
        orgId: currentOrganization?.$id, // Add orgId from current organization
       };

       // Add image fields only if images were uploaded
       // Note: messageType is not stored in Appwrite, inferred from imageUrl/imageUrls/videoUrl presence
       if (imageUrls.length > 0) {
           // Add array fields for multiple images
           message.imageUrls = imageUrls;
           message.imageFileIds = imageFileIds;
           // Also set single fields for backward compatibility if only one image
           if (imageUrls.length === 1) {
               message.imageUrl = imageUrls[0];
               message.imageFileId = imageFileIds[0];
           }
       } else if (imageUrl) {
           // Backward compatibility: single image from old code path
           message.imageUrl = imageUrl;
           message.imageFileId = imageFileId;
       }

       // Add video fields only if video was uploaded
       // Note: Only save videoFileId, construct videoUrl when displaying
       if (videoFileId) {
           message.videoFileId = videoFileId;
       }

       // Add file fields only if file was uploaded
       if (fileFileId) {
           message.fileUrl = fileUrl;
           message.fileFileId = fileFileId;
           message.fileName = fileName;
           message.fileSize = fileSize;
           message.fileMimeType = fileMimeType;
       }

       // Add audio fields only if audio was uploaded
       // Note: Audio messages detected by audioFileId presence (same pattern as videoFileId)
       if (audioFileId) {
           message.audioFileId = audioFileId;
           message.audioUrl = audioUrl;
           message.audioDuration = audioDuration;
       }

       // Add task fields if message is marked as a task
       if (isTaskMessage) {
           message.isTask = true;
           message.taskStatus = 'active'; // Tasks are active when created
           console.log('🔍 sendMessage: Message is marked as a task:', { isTask: message.isTask, taskStatus: message.taskStatus });
       } else {
           console.log('🔍 sendMessage: Message is NOT a task, isTaskMessage:', isTaskMessage);
       }

       // Add duty fields if message is marked as a duty
       if (isDutyMessage) {
           message.isDuty = true;
           message.dutyStatus = 'active'; // Duties are active when created
           console.log('🔍 sendMessage: Message is marked as a duty:', { isDuty: message.isDuty, dutyStatus: message.dutyStatus });
       } else {
           console.log('🔍 sendMessage: Message is NOT a duty, isDutyMessage:', isDutyMessage);
       }

       // Handle editing existing message
       if (editingMessage) {
           console.log('🔍 sendMessage: Updating message:', editingMessage.$id);
           
           // Update the message content
           await db.updateDocument(
               appwriteConfig.db,
               appwriteConfig.col.messages,
               editingMessage.$id,
               {
                   content: messageContent || '',
               }
           );
           
           // Clear edit state
           setEditingMessage(null);
           setMessageContent('');
           setSelectedImages([]);
           setSelectedVideo(null);
           setSelectedFile(null);
           setSelectedAudio(null);
           setIsUploading(false);
           setUploadStatus('');
           setUploadProgress(0);
           
           // Refresh messages
           await getMessages();
           return;
       }

       // Add reply fields if replying to a message
       if (replyingToMessage) {
           message.replyToMessageId = replyingToMessage.$id;
           console.log('🔍 sendMessage: Replying to message:', replyingToMessage.$id);
       }

       console.log('🔍 sendMessage: Creating message document:', message);

       const createdMessage = await db.createDocument(
        appwriteConfig.db, 
        appwriteConfig.col.messages, 
        ID.unique(), 
        message
        );

        console.log('🔍 sendMessage: Message created successfully:', {
            id: createdMessage.$id,
            content: createdMessage.content,
            isTask: (createdMessage as any).isTask,
            taskStatus: (createdMessage as any).taskStatus,
            isDuty: (createdMessage as any).isDuty,
            dutyStatus: (createdMessage as any).dutyStatus,
            senderId: createdMessage.senderId
        });

        // If this was a reply, increment replyCount on the original message
        if (replyingToMessage) {
            try {
                const currentReplyCount = replyingToMessage.replyCount || 0;
                await db.updateDocument(
                    appwriteConfig.db,
                    appwriteConfig.col.messages,
                    replyingToMessage.$id,
                    {
                        replyCount: currentReplyCount + 1
                    }
                );
                console.log('🔍 sendMessage: Incremented replyCount for message:', replyingToMessage.$id);
            } catch (error) {
                console.error('🔍 sendMessage: Failed to increment replyCount:', error);
                // Don't fail the whole operation if this fails
            }
        }

        // Clear input fields immediately
        setMessageContent('');
        setSelectedImages([]);
        setSelectedVideo(null);
        setSelectedFile(null);
        setSelectedAudio(null);
        setIsUploading(false);
        setUploadStatus('');
        setUploadProgress(0);
        setIsTaskMessage(false); // Clear task flag
        setIsDutyMessage(false); // Clear duty flag
        setReplyingToMessage(null); // Clear reply state
        setEditingMessage(null); // Clear edit state

        // Refresh messages to show the new message
        console.log('🔍 sendMessage: Refreshing messages after sending...');
        // Real-time subscription will append the message automatically
        setShouldScrollToBottom(true);

        await db.updateDocument(
            appwriteConfig.db, 
            appwriteConfig.col.jobchat, 
            jobId as string,
            {
                $updatedAt: new Date().toISOString(),
            }
         ) 
        } catch(e) {
            console.error('🔍 sendMessage: Error sending message:', e);
            setIsUploading(false);
            setUploadStatus('');
            setUploadProgress(0);
        }
    }

    const deleteMessage = async (message: Message) => {
        try {
            // Hard delete associated image/video files from storage (if any)
            try {
                // Delete multiple images if present
                if ((message as any).imageFileIds && Array.isArray((message as any).imageFileIds)) {
                    const deletePromises = (message as any).imageFileIds.map((fileId: string) =>
                        storage.deleteFile(appwriteConfig.bucket, fileId).catch(err => {
                            console.error(`Error deleting image file ${fileId} from storage:`, err);
                        })
                    );
                    await Promise.all(deletePromises);
                }
                // Backward compatibility: delete single image if present
                else if ((message as any).imageFileId) {
                    await storage.deleteFile(appwriteConfig.bucket, (message as any).imageFileId);
                }
            } catch (fileError) {
                console.error('Error deleting image file(s) from storage:', fileError);
            }

            try {
                if ((message as any).videoFileId) {
                    await storage.deleteFile(appwriteConfig.bucket, (message as any).videoFileId);
                }
            } catch (fileError) {
                console.error('Error deleting video file from storage:', fileError);
            }

            try {
                if ((message as any).fileFileId) {
                    await storage.deleteFile(appwriteConfig.bucket, (message as any).fileFileId);
                }
            } catch (fileError) {
                console.error('Error deleting file from storage:', fileError);
            }

            // Update the message to mark it as deleted
            await db.updateDocument(
                appwriteConfig.db,
                appwriteConfig.col.messages,
                message.$id,
                {
                    content: 'Message deleted by user',
                    imageUrl: '',
                    imageFileId: '',
                    videoFileId: '',
                    fileFileId: '',
                }
            );
            
            // Update message in state directly
            setMessages(prev => prev.map(m =>
                m.$id === message.$id
                    ? { ...m, content: 'Message deleted by user', imageUrl: '',
                        imageFileId: '', videoFileId: '', fileFileId: '' }
                    : m
            ));
        } catch (error) {
            console.error('Error deleting message:', error);
            Alert.alert('Error', 'Failed to delete message. Please try again.');
        }
    };

    const handleLongPress = (message: Message) => {
        // Don't allow actions on already deleted messages
        if (message.content === 'Message deleted by user') {
            return;
        }

        setPressedMessageId(message.$id);
        setMessageForAction(message);
        setShowMessageActionsModal(true);
    };

    const handleEditMessage = () => {
        if (messageForAction) {
            setEditingMessage(messageForAction);
            setMessageContent(messageForAction.content || '');
            setShowMessageActionsModal(false);
            setMessageForAction(null);
            setPressedMessageId(null);
        }
    };

    const handleReplyFromModal = () => {
        if (messageForAction) {
            setReplyingToMessage(messageForAction);
            setShowMessageActionsModal(false);
            setMessageForAction(null);
            setPressedMessageId(null);
        }
    };

    const handleDeleteFromModal = () => {
        if (messageForAction) {
            setMessageToDelete(messageForAction);
            setShowMessageActionsModal(false);
            setShowDeleteModal(true);
            setMessageForAction(null);
            setPressedMessageId(null);
        }
    };

    const handleCancelActions = () => {
        setShowMessageActionsModal(false);
        setMessageForAction(null);
        setPressedMessageId(null);
    };

    const handleCancelEdit = () => {
        setEditingMessage(null);
        setMessageContent('');
    };

    const handleDeleteConfirm = () => {
        if (messageToDelete) {
            deleteMessage(messageToDelete);
        }
        setShowDeleteModal(false);
        setPressedMessageId(null);
        setMessageToDelete(null);
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setPressedMessageId(null);
        setMessageToDelete(null);
    };

    const handleCompleteTask = async (messageId: string) => {
        try {
            const message = messages.find(m => m.$id === messageId);
            if (!message) {
                Alert.alert('Error', 'Task not found.');
                return;
            }

            // Only the creator can complete the task
            if (message.senderId !== user?.$id) {
                Alert.alert('Permission Denied', 'Only the task creator can mark it as completed.');
                return;
            }

            // Only allow completing active tasks
            if (message.taskStatus !== 'active') {
                Alert.alert('Error', 'This task is already completed.');
                return;
            }

            // Update the task status
            await db.updateDocument(
                appwriteConfig.db,
                appwriteConfig.col.messages,
                messageId,
                {
                    taskStatus: 'completed',
                }
            );

            console.log('✅ Task marked as completed:', messageId);

            // Update message in state directly
            setMessages(prev => prev.map(m =>
                m.$id === messageId
                    ? { ...m, taskStatus: 'completed' }
                    : m
            ));
        } catch (error) {
            console.error('Error completing task:', error);
            Alert.alert('Error', 'Failed to complete task. Please try again.');
        }
    };

    const handleCompleteDuty = async (messageId: string) => {
        try {
            const message = messages.find(m => m.$id === messageId);
            if (!message) {
                Alert.alert('Error', 'Duty not found.');
                return;
            }

            // Only the creator can complete the duty
            if (message.senderId !== user?.$id) {
                Alert.alert('Permission Denied', 'Only the duty creator can mark it as completed.');
                return;
            }

            // Only allow completing active duties
            if (message.dutyStatus !== 'active') {
                Alert.alert('Error', 'This duty is already completed.');
                return;
            }

            // Update the duty status
            await db.updateDocument(
                appwriteConfig.db,
                appwriteConfig.col.messages,
                messageId,
                {
                    dutyStatus: 'completed',
                }
            );

            console.log('✅ Duty marked as completed:', messageId);

            // Update message in state directly
            setMessages(prev => prev.map(m =>
                m.$id === messageId
                    ? { ...m, dutyStatus: 'completed' }
                    : m
            ));
        } catch (error) {
            console.error('Error completing duty:', error);
            Alert.alert('Error', 'Failed to complete duty. Please try again.');
        }
    };

    // Helper function to check if message is mostly emojis
    const isEmojiMessage = (text: string): boolean => {
        const trimmedText = text.trim();
        
        // Must be short message (1-10 chars)
        if (trimmedText.length === 0 || trimmedText.length > 10) {
            return false;
        }
        
        // Check if it contains regular text characters
        // If no letters or numbers, assume it's emoji
        const hasLettersOrNumbers = /[a-zA-Z0-9]/.test(trimmedText);
        
        return !hasLettersOrNumbers;
    };

    const postLocationToChat = async (locationData: LocationData) => {
        try {
            console.log('🔍 postLocationToChat: Posting location to chat...');
            
            // Check if we have required team and organization data
            if (!currentTeam?.$id || !currentOrganization?.$id) {
                console.error('🔍 postLocationToChat: Missing team or organization data:', {
                    teamId: currentTeam?.$id,
                    orgId: currentOrganization?.$id
                });
                throw new Error('Please select a team and organization before sharing location.');
            }
            
            // Get user's profile picture from Google OAuth or stored preferences
            const userProfilePicture = await getUserProfilePicture();
            console.log('🔍 postLocationToChat: User profile picture:', userProfilePicture);

            // Store locationData as JSON string in the locationData attribute (now defined in Appwrite)
            // Note: messageType is not defined in Appwrite, so we'll infer it from locationData presence
            const locationDataJson = JSON.stringify(locationData);
            const message: any = {
                content: `📍 Location shared: ${locationData.address || 'Current location'}`,
                senderId: user?.$id,
                senderName: user?.name,
                senderPhoto: userProfilePicture || '',
                jobId: jobId,
                teamId: currentTeam?.$id,
                orgId: currentOrganization?.$id,
                locationData: locationDataJson, // Store as JSON string in locationData attribute
                // messageType removed - not defined in Appwrite, will be inferred from locationData presence
            };
            
            console.log('🔍 postLocationToChat: Location data JSON length:', locationDataJson.length);
            console.log('🔍 postLocationToChat: Location data preview:', locationDataJson.substring(0, 100) + '...');

            console.log('🔍 postLocationToChat: Creating location message:', message);

            const createdMessage = await db.createDocument(
                appwriteConfig.db, 
                appwriteConfig.col.messages, 
                ID.unique(), 
                message
            );

            console.log('🔍 postLocationToChat: Location message created successfully:', createdMessage);

            // Refresh messages to show the new location message
            await getMessages();

            // Update job chat timestamp
            await db.updateDocument(
                appwriteConfig.db, 
                appwriteConfig.col.jobchat, 
                jobId as string,
                {
                    $updatedAt: new Date().toISOString(),
                }
            );

        } catch (error) {
            console.error('🔍 postLocationToChat: Error posting location:', error);
            throw error; // Re-throw to let the ShareLocation component handle the error
        }
    };

    const handleRefresh = async () => {
        console.log('🔍 handleRefresh: Starting pull-to-refresh, allMessagesLoaded:', allMessagesLoaded, 'currentScrollY:', currentScrollY, 'hasMoreMessages:', hasMoreMessages);
        setIsRefreshing(true);
        
        // ⚠️ IMPORTANT: DO NOT CHANGE THIS BEHAVIOR
        // If all messages are loaded, do nothing - don't reload all messages
        // This prevents pull-to-refresh from triggering when user is at oldest message
        // User can use the refresh icon button in header if they want to reload all messages
        // This behavior is intentional and should be preserved
        if (allMessagesLoaded) {
            console.log('🔍 handleRefresh: All messages already loaded - doing nothing (use refresh icon to reload)');
            setIsRefreshing(false);
            return;
        }
        
        // If user is scrolling up or near top with more messages, they're trying to load older messages
        // Don't trigger refresh - let loadOlderMessages handle it
        if ((isScrollingUp || currentScrollY < 300) && hasMoreMessages && !isLoadingOlderMessages) {
            console.log('🔍 handleRefresh: User scrolling up or near top with more messages - triggering loadOlderMessages instead');
            setIsRefreshing(false);
            loadOlderMessages();
            return;
        }
        
        // For normal refresh: Fetch NEW messages (newer than what we have) and append them
        // CRITICAL: Never replace existing messages - always preserve what's currently visible
        // This prevents messages from disappearing during refresh
        setShouldScrollToBottom(true);
        
        // Capture current messages count BEFORE any async operations
        const messagesCountBefore = messages.length;
        console.log('🔍 handleRefresh: Starting refresh with', messagesCountBefore, 'existing messages');
        
        try {
            // Get the newest message ID we currently have
            const currentNewestMessage = messages.length > 0 ? messages[messages.length - 1] : null;
            const newestMessageId = currentNewestMessage?.$id;
            
            // If we have no messages, this is an initial load - use getMessages instead
            if (!newestMessageId || messages.length === 0) {
                console.log('🔍 handleRefresh: No existing messages, using getMessages for initial load');
                setOldestMessageId(null);
                setHasMoreMessages(true);
                setAllMessagesLoaded(false);
                await getMessages(false);
                setIsRefreshing(false);
                return;
            }
            
            // Fetch only new messages (messages created after our newest message)
            const queries: any[] = [
                Query.equal('jobId', jobId as string),
                Query.orderDesc('$createdAt'),
                Query.limit(50), // Get up to 50 new messages
                Query.cursorAfter(newestMessageId), // Only get messages newer than what we have
            ];
            
            const { documents } = await db.listDocuments<Message>(
                appwriteConfig.db, 
                appwriteConfig.col.messages,
                queries
            );
            
            // CRITICAL: Use functional update to ensure we're working with the latest state
            // This prevents race conditions where messages might be updated between the capture and the update
            setMessages(prevMessages => {
                // CRITICAL SAFETY CHECK: Never return fewer messages than we started with
                // If messages disappeared (shouldn't happen), preserve what we have
                if (prevMessages.length < messagesCountBefore) {
                    console.error('🔍 handleRefresh: ERROR - Message count decreased from', messagesCountBefore, 'to', prevMessages.length);
                    console.error('🔍 handleRefresh: This should never happen! Preserving current state to prevent data loss.');
                    // Return current state - don't modify anything if messages were lost
                    return prevMessages;
                }
                
                // Preserve all existing messages - never lose any
                const existingIds = new Set(prevMessages.map(m => m.$id));
                const existingCount = prevMessages.length;
                
                if (documents.length > 0) {
                    // Process and normalize new messages
                    const freshMessages = processMessages(documents);
                    const sortedNewMessages = [...freshMessages].reverse().sort((a, b) => {
                        return new Date(a.$createdAt).getTime() - new Date(b.$createdAt).getTime();
                    });
                    
                    // Only add messages that don't already exist
                    const newMessagesToAdd = sortedNewMessages.filter(msg => !existingIds.has(msg.$id));
                    
                    if (newMessagesToAdd.length === 0) {
                        console.log('🔍 handleRefresh: No new messages to add (all already present) - preserved', existingCount, 'messages');
                        return prevMessages; // Return unchanged if no new messages
                    }
                    
                    // Combine: existing messages + new messages
                    const combined = [...prevMessages, ...newMessagesToAdd];
                    
                    // Sort by date to maintain chronological order
                    const sorted = combined.sort((a, b) => 
                        new Date(a.$createdAt).getTime() - new Date(b.$createdAt).getTime()
                    );
                    
                    // Final safety check: ensure we didn't lose any messages
                    if (sorted.length < existingCount) {
                        console.error('🔍 handleRefresh: ERROR - After adding new messages, count decreased from', existingCount, 'to', sorted.length);
                        console.error('🔍 handleRefresh: Returning original messages to prevent data loss');
                        return prevMessages; // Return original if something went wrong
                    }
                    
                    console.log('🔍 handleRefresh: SUCCESS - Preserved', existingCount, 'existing messages, added', newMessagesToAdd.length, 'new messages. Total:', sorted.length);
                    return sorted;
                } else {
                    console.log('🔍 handleRefresh: No new messages found - preserved all', existingCount, 'existing messages');
                    return prevMessages; // Return unchanged if no new messages
                }
            });
        } catch (error) {
            console.error('🔍 handleRefresh: Error during refresh:', error);
            // On error, don't modify messages - preserve what's visible
            // The state should remain unchanged, so messages won't disappear
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleJobDeleted = () => {
        console.log('🔍 Job Component: Job deleted, navigating back to jobs list');
        // Navigate back to the jobs list when job is deleted
        // The jobs list will auto-refresh when it comes into focus
        router.back();
    };

    if(isLoading) {
        return (
            <View style={globalStyles.centeredContainer}>
                <ActivityIndicator size="large" color={Colors.Primary} />
            </View>
        )
    }

    // Find the job data using the jobId
    const job = JobChats.find(j => j.id === jobId)
    const jobTitle = job ? job.title : `Job ${jobId}`
    
    console.log('🔍 Job Component: About to render, current state:', {
        messagesCount: messages.length,
        jobChatTitle: jobChat?.title,
        isLoading: isLoading,
        isUploading: isUploading,
        messageContent: messageContent,
        selectedImages: selectedImages.length
    });

    return (
        <>
            <StatusBar style="light" backgroundColor="#1a1a1a" translucent={false} />
            <Stack.Screen 
                options={{
                    headerTitle: jobChat?.title || 'Job Chat',
                    headerRight: () => (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 16 }}>
                            <TouchableOpacity 
                                style={{ padding: 4 }}
                                onPress={() => {
                                    console.log('🔍 Location icon clicked, setting showShareLocation to true');
                                    setShowShareLocation(true);
                                }}
                            >
                                <IconSymbol name="location" color="#fff" size={20} />
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={{ padding: 4 }}
                                onPress={loadAllMessages}
                                disabled={isLoadingAllMessages}
                            >
                                {isLoadingAllMessages ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <IconSymbol name="arrow.clockwise" color="#ffffff" size={22} />
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={{ padding: 4, opacity: canShareJobReports ? 1 : 0.5 }}
                                onPress={() => {
                                    if (!canShareJobReports) {
                                        Alert.alert(
                                            'Permission Denied',
                                            'You do not have permission to share job reports. Ask owner for permission.',
                                            [{ text: 'OK' }]
                                        );
                                        return;
                                    }
                                    console.log('🔍 Share icon clicked, opening ShareJob modal');
                                    setShowShareJobModal(true);
                                }}
                            >
                                <IconSymbol 
                                    name="arrowOutward" 
                                    color={canShareJobReports ? "#fff" : "#888"} 
                                    size={20} 
                                />
                            </TouchableOpacity>
                        </View>
                    ),
                    headerStyle: { 
                        backgroundColor: '#1a1a1a',
                    },
                    headerTitleStyle: {
                        color: '#fff',
                    },
                    headerTintColor: '#fff',
                }} 
            />
            <View style={{ flex: 1 }}>
                {/* Tab Header */}
                <View style={{
                    flexDirection: 'row',
                    backgroundColor: Colors.Secondary,
                    borderBottomWidth: 1,
                    borderBottomColor: Colors.Gray,
                }}>
                    {/* Chat Tab */}
                    <Pressable
                        style={{
                            flex: 1,
                            paddingVertical: 16,
                            alignItems: 'center',
                            borderBottomWidth: 3,
                            borderBottomColor: activeTab === 'chat' ? webColors.primary : 'transparent',
                        }}
                        onPress={() => setActiveTab('chat')}
                    >
                        <Text style={{
                            color: activeTab === 'chat' ? webColors.primary : Colors.Gray,
                            fontSize: 16,
                            fontWeight: activeTab === 'chat' ? '600' : '400',
                        }}>
                            Chat
                        </Text>
                    </Pressable>

                    {/* Job Details Tab */}
                    <Pressable
                        style={{
                            flex: 1,
                            paddingVertical: 16,
                            alignItems: 'center',
                            borderBottomWidth: 3,
                            borderBottomColor: activeTab === 'details' ? webColors.primary : 'transparent',
                        }}
                        onPress={() => setActiveTab('details')}
                    >
                        <Text style={{
                            color: activeTab === 'details' ? webColors.primary : Colors.Gray,
                            fontSize: 16,
                            fontWeight: activeTab === 'details' ? '600' : '400',
                        }}>
                            Job Details
                        </Text>
                    </Pressable>

                    {/* Uploads Tab */}
                    <Pressable
                        style={{
                            flex: 1,
                            paddingVertical: 16,
                            alignItems: 'center',
                            borderBottomWidth: 3,
                            borderBottomColor: activeTab === 'photos' ? webColors.primary : 'transparent',
                        }}
                        onPress={() => setActiveTab('photos')}
                    >
                        <Text style={{
                            color: activeTab === 'photos' ? webColors.primary : Colors.Gray,
                            fontSize: 16,
                            fontWeight: activeTab === 'photos' ? '600' : '400',
                        }}>
                            Uploads
                        </Text>
                    </Pressable>

                    {/* Tasks Tab */}
                    <Pressable
                        style={{
                            flex: 1,
                            paddingVertical: 16,
                            alignItems: 'center',
                            borderBottomWidth: 3,
                            borderBottomColor: activeTab === 'tasks' ? webColors.primary : 'transparent',
                        }}
                        onPress={() => setActiveTab('tasks')}
                    >
                        <Text style={{
                            color: activeTab === 'tasks' ? webColors.primary : Colors.Gray,
                            fontSize: 16,
                            fontWeight: activeTab === 'tasks' ? '600' : '400',
                        }}>
                            Tasks
                        </Text>
                    </Pressable>
                </View>

                {/* Pinned Tasks/Duties Bar - Only show in Chat tab */}
                {activeTab === 'chat' && (() => {
                    if (pinnedItems.length === 0) return null;
                    
                    const currentItem = pinnedItems[currentPinnedTaskIndex % pinnedItems.length];
                    if (!currentItem) return null;
                    
                    const isTask = currentItem.isTask === true;
                    const isDuty = currentItem.isDuty === true;
                    const itemColor = isTask ? taskBlue : (isDuty ? dutyRed : taskBlue);
                    const itemType = isTask ? 'Task' : (isDuty ? 'Duty' : 'Task');
                    
                    const itemExcerpt = currentItem.content ? 
                        (currentItem.content.length > 50 ? currentItem.content.substring(0, 50) + '...' : currentItem.content) 
                        : `${itemType} message`;
                    
                    return (
                        <TouchableOpacity
                            onPress={() => {
                                const itemMessageId = currentItem.$id;
                                
                                // Move to next item (cycle) before switching
                                setCurrentPinnedTaskIndex((prev) => (prev + 1) % pinnedItems.length);
                                
                                // Set the message to scroll to
                                setTaskToScrollTo(itemMessageId);
                                
                                // Switch to chat tab (scroll will happen via useEffect when tab is active)
                                setActiveTab('chat');
                            }}
                            style={{
                                backgroundColor: itemColor + '15',
                                borderLeftWidth: 3,
                                borderLeftColor: itemColor,
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <IconSymbol name="pin.fill" color={itemColor} size={16} />
                                <Text style={{ color: itemColor, fontWeight: '600', fontSize: 12, marginRight: 4 }}>
                                    {itemType}:
                                </Text>
                                <Text style={{ color: Colors.Text, fontSize: 13, flex: 1 }} numberOfLines={1}>
                                    {itemExcerpt}
                                </Text>
                            </View>
                            {pinnedItems.length > 1 && (
                                <TouchableOpacity
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        // Cycle to next item
                                        setCurrentPinnedTaskIndex((prev) => (prev + 1) % pinnedItems.length);
                                    }}
                                    style={{ padding: 4 }}
                                >
                                    <IconSymbol name="chevron.right" color={itemColor} size={16} />
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>
                    );
                })()}

                {/* Tab Content */}
                {activeTab === 'chat' ? (
                    <KeyboardAvoidingView
                        style={{ flex: 1 }}
                        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
                    >
                        <LegendList 
                            ref={listRef}
                            data={messages}
                            refreshControl={
                                // ⚠️ IMPORTANT: DO NOT CHANGE THIS BEHAVIOR
                                // Completely disable pull-to-refresh when:
                                // 1. All messages are loaded (always disable - use refresh icon instead)
                                //    This prevents pull-to-refresh from triggering when user is at oldest message
                                // 2. There are more messages to load (hasMoreMessages = true) - ALWAYS DISABLE
                                //    User should scroll up to load older messages, not use pull-to-refresh
                                //    This prevents refresh from interfering with loading older messages
                                // 3. User is scrolling up (trying to load older messages) - disable to prevent interference
                                // 4. Currently loading older messages
                                // This behavior is intentional - when there are more messages, pull-to-refresh
                                // should be COMPLETELY DISABLED to allow natural scroll-up loading. 
                                // User must use refresh icon button to reload all messages.
                                (allMessagesLoaded || hasMoreMessages || isScrollingUp || isLoadingOlderMessages) ? null : (
                                    <RefreshControl
                                        refreshing={isRefreshing}
                                        onRefresh={handleRefresh}
                                        colors={[Colors.Primary]}
                                        tintColor={Colors.Primary}
                                        title="Pull to refresh messages"
                                        titleColor={Colors.Text}
                                    />
                                )
                            }
                            renderItem={({ item }: { item: Message }) => {
                                console.log('🔍 LegendList renderItem: Rendering message:', { 
                                    id: item.$id, 
                                    content: item.content, 
                                    senderId: item.senderId,
                                    isTask: item.isTask,
                                    taskStatus: item.taskStatus
                                });
                                
                                const isCurrentUser = item.senderId === user?.$id;
                                const senderColor = getSenderColor(item.senderId || '', isCurrentUser);
                                const isPressed = pressedMessageId === item.$id;
                                const isDeleted = item.content === 'Message deleted by user';
                                const originalMessage = item.replyToMessageId ? messages.find(m => m.$id === item.replyToMessageId) : null;
                                
                                // Render deleted messages
                                if (isDeleted) {
                                    return (
                                        <View style={{ 
                                            paddingHorizontal: 10,
                                            paddingVertical: 5,
                                            alignItems: 'center',
                                        }}>
                                            <Text style={{ 
                                                color: Colors.White,
                                                fontSize: 14,
                                                fontStyle: 'italic',
                                                opacity: 0.6,
                                            }}>
                                                {item.content}
                                            </Text>
                                        </View>
                                    );
                                }
                                
                                return (
                                    <Pressable
                                        onLongPress={() => handleLongPress(item)}
                                        delayLongPress={500}
                                        style={{ 
                                            padding: 10,
                                            flexDirection: 'row',
                                            alignItems: 'flex-start',
                                        }}
                                    >
                                        {/* Left vertical accent bar */}
                                        <View style={{
                                            width: 3,
                                            backgroundColor: senderColor,
                                            borderRadius: 2,
                                            marginRight: 10,
                                            alignSelf: 'stretch',
                                            minHeight: 40,
                                        }} />
                                        
                                        {/* Message content */}
                                        <Pressable
                                            onLongPress={() => handleLongPress(item)}
                                            delayLongPress={500}
                                            style={{ 
                                                flex: 1,
                                                opacity: isPressed ? 0.7 : 1,
                                            }}
                                        >
                                            {/* Sender Name - colored and uppercase */}
                                            <Pressable
                                                onPress={() => {
                                                    router.push({
                                                        pathname: '/(jobs)/user-profile',
                                                        params: {
                                                            name: item.senderName || 'Unknown User',
                                                            imageUrl: item.senderPhoto || '',
                                                            senderId: item.senderId || '',
                                                            orgId: item.orgId || '',
                                                        }
                                                    });
                                                }}
                                            >
                                                <Text style={{ 
                                                    color: senderColor, 
                                                    fontWeight: '700', 
                                                    fontSize: 12,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: 0.5,
                                                    marginBottom: 4,
                                                }}>
                                                    {item.senderName || 'Unknown User'}
                                                </Text>
                                            </Pressable>
                                            
                                            {/* Task Badge and Status */}
                                            {item.isTask && (
                                                <View style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    marginBottom: 8,
                                                    paddingBottom: 8,
                                                    borderBottomWidth: 1,
                                                    borderBottomColor: Colors.Gray + '40',
                                                }}>
                                                    <IconSymbol 
                                                        name={item.taskStatus === 'completed' ? 'checkmark.circle.fill' : 'circle'} 
                                                        color={item.taskStatus === 'completed' ? Colors.Gray : taskBlue} 
                                                        size={18} 
                                                    />
                                                    <Text style={{
                                                        color: item.taskStatus === 'completed' ? Colors.Gray : taskBlue,
                                                        fontWeight: '600',
                                                        fontSize: 12,
                                                        marginLeft: 6,
                                                        textTransform: 'uppercase',
                                                    }}>
                                                        Task {item.taskStatus === 'completed' ? '• Completed' : '• Active'}
                                                    </Text>
                                                    {item.taskStatus === 'active' && item.senderId === user?.$id && (
                                                        <TouchableOpacity
                                                            onPress={() => handleCompleteTask(item.$id)}
                                                            style={{
                                                                marginLeft: 'auto',
                                                                paddingHorizontal: 8,
                                                                paddingVertical: 4,
                                                                borderRadius: 6,
                                                                backgroundColor: taskBlue + '20',
                                                            }}
                                                        >
                                                            <Text style={{
                                                                color: taskBlue,
                                                                fontSize: 11,
                                                                fontWeight: '600',
                                                            }}>
                                                                Complete
                                                            </Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            )}

                                            {/* Duty Badge and Status */}
                                            {item.isDuty && (
                                                <View style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    marginBottom: 8,
                                                    paddingBottom: 8,
                                                    borderBottomWidth: 1,
                                                    borderBottomColor: Colors.Gray + '40',
                                                }}>
                                                    <IconSymbol 
                                                        name={item.dutyStatus === 'completed' ? 'checkmark.circle.fill' : 'circle'} 
                                                        color={item.dutyStatus === 'completed' ? Colors.Gray : dutyRed} 
                                                        size={18} 
                                                    />
                                                    <Text style={{
                                                        color: item.dutyStatus === 'completed' ? Colors.Gray : dutyRed,
                                                        fontWeight: '600',
                                                        fontSize: 12,
                                                        marginLeft: 6,
                                                        textTransform: 'uppercase',
                                                    }}>
                                                        Duties {item.dutyStatus === 'completed' ? '• Completed' : '• Active'}
                                                    </Text>
                                                    {item.dutyStatus === 'active' && item.senderId === user?.$id && (
                                                        <TouchableOpacity
                                                            onPress={() => handleCompleteDuty(item.$id)}
                                                            style={{
                                                                marginLeft: 'auto',
                                                                paddingHorizontal: 8,
                                                                paddingVertical: 4,
                                                                borderRadius: 6,
                                                                backgroundColor: dutyRed + '20',
                                                            }}
                                                        >
                                                            <Text style={{
                                                                color: dutyRed,
                                                                fontSize: 11,
                                                                fontWeight: '600',
                                                            }}>
                                                                Complete
                                                            </Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            )}
                                            
                                            {/* Reply Context */}
                                            {originalMessage && (
                                                <Pressable
                                                    onPress={() => {
                                                        const index = messages.findIndex(m => m.$id === originalMessage.$id);
                                                        if (index !== -1 && listRef.current) {
                                                            listRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
                                                        }
                                                    }}
                                                    style={{
                                                        backgroundColor: Colors.Secondary,
                                                        borderRadius: 6,
                                                        padding: 8,
                                                        marginBottom: 8,
                                                        borderLeftWidth: 2,
                                                        borderLeftColor: Colors.Primary,
                                                    }}
                                                >
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                        <IconSymbol name="arrowshape.turn.up.left.fill" color={Colors.Primary} size={12} />
                                                        <Text style={{ color: Colors.Primary, fontSize: 11, fontWeight: '600' }}>
                                                            {originalMessage.senderName || 'Unknown User'}
                                                        </Text>
                                                    </View>
                                                    <Text 
                                                        style={{ 
                                                            color: Colors.Text, 
                                                            fontSize: 12, 
                                                            opacity: 0.7,
                                                            lineHeight: 16,
                                                        }} 
                                                        numberOfLines={1}
                                                    >
                                                        {originalMessage.content || (originalMessage.imageUrl ? '📷 Image' : originalMessage.videoFileId ? '🎥 Video' : originalMessage.audioFileId ? '🎵 Audio' : originalMessage.fileFileId ? '📄 File' : 'Message')}
                                                    </Text>
                                                </Pressable>
                                            )}
                                            
                                            {/* Multiple Images Display */}
                                            {(item.imageUrls && item.imageUrls.length > 0) && item.content !== 'Message deleted by user' && (
                                                <View style={{
                                                    flexDirection: 'row',
                                                    flexWrap: 'wrap',
                                                    gap: 4,
                                                    marginBottom: 8,
                                                }}>
                                                    {item.imageUrls.map((url, index) => (
                                                        <TouchableOpacity
                                                            key={index}
                                                            onPress={() => {
                                                                setViewingMessage(item);
                                                                setCurrentImageIndex(index);
                                                                setFullScreenImage(url);
                                                                setIsImageViewVisible(true);
                                                            }}
                                                            activeOpacity={0.9}
                                                            style={{
                                                                width: item.imageUrls && item.imageUrls.length === 1 ? '100%' : '48%',
                                                                aspectRatio: item.imageUrls && item.imageUrls.length === 1 ? undefined : 1,
                                                                position: 'relative',
                                                            }}
                                                        >
                                                            <CachedImage 
                                                                source={{ uri: url }} 
                                                                fileId={item.imageFileIds?.[index]}
                                                                autoCache={true}
                                                                style={{ 
                                                                    width: '100%', 
                                                                    height: item.imageUrls && item.imageUrls.length === 1 ? 200 : undefined,
                                                                    aspectRatio: item.imageUrls && item.imageUrls.length === 1 ? undefined : 1,
                                                                    borderRadius: 8,
                                                                }}
                                                                resizeMode="cover"
                                                            />
                                                            {item.imageUrls && item.imageUrls.length > 1 && (
                                                                <View style={{
                                                                    position: 'absolute',
                                                                    top: 4,
                                                                    right: 4,
                                                                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                                                    paddingHorizontal: 6,
                                                                    paddingVertical: 2,
                                                                    borderRadius: 4,
                                                                }}>
                                                                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>
                                                                        {index + 1}/{item.imageUrls.length}
                                                                    </Text>
                                                                </View>
                                                            )}
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            )}
                                            
                                            {/* Backward Compatibility: Single Image Display */}
                                            {(!item.imageUrls || item.imageUrls.length === 0) && item.imageUrl && item.content !== 'Message deleted by user' && (
                                                <TouchableOpacity 
                                                    onPress={() => {
                                                        setViewingMessage(item);
                                                        setCurrentImageIndex(0);
                                                        setFullScreenImage(item.imageUrl || null);
                                                        setIsImageViewVisible(true);
                                                    }}
                                                    activeOpacity={0.9}
                                                >
                                                    <CachedImage 
                                                        source={{ uri: item.imageUrl }} 
                                                        fileId={item.imageFileId}
                                                        autoCache={true}
                                                        style={{ 
                                                            width: '100%', 
                                                            height: 200, 
                                                            borderRadius: 8,
                                                            marginBottom: 8
                                                        }}
                                                        resizeMode="cover"
                                                    />
                                                </TouchableOpacity>
                                            )}

                                            {/* Video Message */}
                                            {item.videoFileId && item.content !== 'Message deleted by user' && (
                                                <Pressable
                                                    key={`video-${item.videoFileId}`}
                                                    style={{
                                                        width: '100%',
                                                        marginBottom: 8,
                                                    }}
                                                    onPress={() => {
                                                        const videoUri = appwriteConfig.bucket 
                                                            ? `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucket}/files/${item.videoFileId}/view?project=${appwriteConfig.projectId}`
                                                            : '';
                                                        setFullScreenVideo({ uri: videoUri, fileId: item.videoFileId });
                                                    }}
                                                >
                                                    <VideoPlayer
                                                        key={`video-player-${item.videoFileId}`}
                                                        uri={appwriteConfig.bucket ? `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucket}/files/${item.videoFileId}/view?project=${appwriteConfig.projectId}` : ''}
                                                        fileId={item.videoFileId}
                                                        showControls={false}
                                                        autoPlay={false}
                                                        autoCache={true}
                                                        showThumbnailInfo={true}
                                                        onThumbnailPress={() => {
                                                            const videoUri = appwriteConfig.bucket 
                                                                ? `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucket}/files/${item.videoFileId}/view?project=${appwriteConfig.projectId}`
                                                                : '';
                                                            setFullScreenVideo({ uri: videoUri, fileId: item.videoFileId });
                                                        }}
                                                        onError={(error) => {
                                                            console.error('Video playback error:', error);
                                                            Alert.alert('Video Error', 'Failed to play video. You can try opening it in your browser.');
                                                        }}
                                                    />
                                                </Pressable>
                                            )}

                                            {/* Location Message */}
                                            {item.messageType === 'location' && item.locationData && (
                                                <TouchableOpacity 
                                                    onPress={() => {
                                                        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${item.locationData?.latitude},${item.locationData?.longitude}`;
                                                        Linking.openURL(mapUrl);
                                                    }}
                                                    style={{
                                                        backgroundColor: Colors.Secondary,
                                                        padding: 12,
                                                        borderRadius: 8,
                                                        marginBottom: 8,
                                                        borderWidth: 1,
                                                        borderColor: Colors.Primary,
                                                    }}
                                                >
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                        <IconSymbol name="location" color={Colors.Primary} size={20} />
                                                        <Text style={{ color: Colors.Primary, fontWeight: '600', marginLeft: 8 }}>
                                                            Location Shared
                                                        </Text>
                                                    </View>
                                                    <Text style={{ color: Colors.Text, fontSize: 14, marginBottom: 4 }}>
                                                        {item.locationData.address || 'Current location'}
                                                    </Text>
                                                    <Text style={{ color: Colors.Gray, fontSize: 12 }}>
                                                        {item.locationData.latitude.toFixed(6)}, {item.locationData.longitude.toFixed(6)}
                                                    </Text>
                                                    <Text style={{ color: Colors.Primary, fontSize: 12, marginTop: 4 }}>
                                                        Tap to open in Maps
                                                    </Text>
                                                </TouchableOpacity>
                                            )}

                                            {/* File Message */}
                                            {item.fileFileId && item.content !== 'Message deleted by user' && (
                                                <TouchableOpacity 
                                                    onPress={() => {
                                                        const fileUrl = item.fileUrl || `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucket}/files/${item.fileFileId}/view?project=${appwriteConfig.projectId}`;
                                                        Linking.openURL(fileUrl);
                                                    }}
                                                    style={{
                                                        backgroundColor: Colors.Secondary,
                                                        padding: 12,
                                                        borderRadius: 8,
                                                        marginBottom: 8,
                                                        borderWidth: 1,
                                                        borderColor: Colors.Primary,
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <IconSymbol name="doc.text" color={Colors.Primary} size={24} />
                                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                                        <Text style={{ color: Colors.Primary, fontWeight: '600', fontSize: 14 }}>
                                                            {item.fileName || 'Document'}
                                                        </Text>
                                                        {item.fileSize && (
                                                            <Text style={{ color: Colors.Gray, fontSize: 12, marginTop: 2 }}>
                                                                {(item.fileSize / 1024).toFixed(2)} KB
                                                            </Text>
                                                        )}
                                                    </View>
                                                    <IconSymbol name="arrow.down.circle" color={Colors.Primary} size={20} />
                                                </TouchableOpacity>
                                            )}

                                            {/* Audio Message */}
                                            {item.audioFileId && item.content !== 'Message deleted by user' && (
                                                <AudioPlayer
                                                    uri={item.audioUrl || (appwriteConfig.bucket ? `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucket}/files/${item.audioFileId}/view?project=${appwriteConfig.projectId}` : '')}
                                                    fileId={item.audioFileId}
                                                    duration={item.audioDuration}
                                                    autoCache={true}
                                                    senderName={item.senderName}
                                                    senderPhoto={item.senderPhoto}
                                                    showAvatar={false}
                                                />
                                            )}
                                            
                                            {/* Message Text */}
                                            {item.content && (
                                                <Text style={{ 
                                                    color: Colors.White,
                                                    fontSize: isEmojiMessage(item.content) ? 48 : 16,
                                                    lineHeight: isEmojiMessage(item.content) ? 56 : 24,
                                                    textAlign: isEmojiMessage(item.content) ? 'center' : 'left',
                                                }}>
                                                    {item.content}
                                                </Text>
                                            )}

                                            {/* Reply Count Badge */}
                                            {(item.replyCount ?? 0) > 0 && (
                                                <View style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    marginTop: 6,
                                                    gap: 4,
                                                }}>
                                                    <IconSymbol name="arrowshape.turn.up.left.fill" color={Colors.Primary} size={12} />
                                                    <Text style={{
                                                        color: Colors.Primary,
                                                        fontSize: 11,
                                                        fontWeight: '600',
                                                    }}>
                                                        {item.replyCount} {item.replyCount === 1 ? 'reply' : 'replies'}
                                                    </Text>
                                                </View>
                                            )}

                                            {/* Timestamp */}
                                            <Text
                                                style={{
                                                    fontSize: 10,
                                                    color: Colors.Gray,
                                                    marginTop: 4,
                                                }}
                                            >
                                                {new Date(item.$createdAt!).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </Text>
                                        </Pressable>
                                    </Pressable>
                                );
                            }}
                            keyExtractor={(item) => item?.$id ?? "unknown"}
                            contentContainerStyle={{ 
                                padding: 10,
                                paddingBottom: 20
                            }}
                            recycleItems={false}
                            maintainScrollAtEnd={false} // Always disabled to allow free scrolling
                            maintainScrollAtEndThreshold={0.1}
                            estimatedItemSize={120}
                            onScroll={(event) => {
                                const scrollYValue = event.nativeEvent.contentOffset.y;
                                const previousScrollY = scrollY.current;
                                scrollY.current = scrollYValue;
                                setCurrentScrollY(scrollYValue); // Update state for RefreshControl check
                                
                                // Determine scroll direction
                                const scrollingUp = scrollYValue < previousScrollY;
                                setIsScrollingUp(scrollingUp);
                                
                                // Mark that user is actively scrolling
                                isUserScrolling.current = true;
                                
                                // Clear any existing timeout
                                if (scrollTimeoutRef.current) {
                                    clearTimeout(scrollTimeoutRef.current);
                                }
                                
                                // Reset user scrolling flag after 500ms of no scrolling
                                scrollTimeoutRef.current = setTimeout(() => {
                                    isUserScrolling.current = false;
                                    setIsScrollingUp(false); // Reset scroll direction when scrolling stops
                                }, 500);
                                
                                // Proactive loading: Load older messages as user approaches top
                                // Start loading when within 600-800px from top to make it smooth
                                // This loads messages in background before user reaches top
                                const nearTop = scrollYValue < 800; // Increased threshold for proactive loading
                                const veryNearTop = scrollYValue < 600; // Closer threshold
                                const significantScrollUp = scrollingUp && (previousScrollY - scrollYValue) > 30; // Scrolled up at least 30px
                                
                                // Load when: approaching top (within 800px) OR scrolling up significantly
                                // Use debouncing: only trigger if not already loading and haven't triggered recently
                                if ((nearTop || significantScrollUp) && !hasTriggeredLoadMore.current && hasMoreMessages && !isLoadingOlderMessages && !allMessagesLoaded && messages.length > 0) {
                                    console.log('🔍 onScroll: Proactive loading - scrollY:', scrollYValue, 'previousScrollY:', previousScrollY, 'scrollingUp:', scrollingUp, 'nearTop:', nearTop, 'veryNearTop:', veryNearTop);
                                    hasTriggeredLoadMore.current = true;
                                    
                                    // Load in background - don't block UI
                                    loadOlderMessages().catch(err => {
                                        console.error('🔍 onScroll: Error loading older messages:', err);
                                        hasTriggeredLoadMore.current = false; // Reset on error
                                    });
                                } else if (scrollYValue > 1000) {
                                    // Reset trigger when user scrolls well away from top
                                    hasTriggeredLoadMore.current = false;
                                }
                            }}
                            scrollEventThrottle={400}
                            onContentSizeChange={(width, height) => {
                                // Track content height changes
                                setContentHeight(height);
                            }}
                            ListFooterComponent={
                                isLoadingOlderMessages ? (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <ActivityIndicator size="small" color={Colors.Primary} />
                                        <Text style={{ color: Colors.Gray, marginTop: 8, fontSize: 12 }}>
                                            Loading older messages...
                                        </Text>
                                    </View>
                                ) : null
                            }
                        />

                        <View style={{ marginHorizontal: 10, marginBottom: Platform.OS === 'ios' ? 34 : insets.bottom + 16 }}>
                            {/* Image Preview */}
                            {selectedImages.length > 0 && (
                                <View style={{
                                    marginBottom: 8,
                                    backgroundColor: Colors.Secondary,
                                    borderRadius: 8,
                                    padding: 8,
                                    borderWidth: 1,
                                    borderColor: Colors.Gray,
                                }}>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <View style={{ flexDirection: 'row', gap: 8 }}>
                                            {selectedImages.map((uri, index) => (
                                                <View key={index} style={{
                                                    position: 'relative',
                                                    width: 80,
                                                    height: 80,
                                                    borderRadius: 8,
                                                    overflow: 'hidden',
                                                }}>
                                                    <CachedImage 
                                                        source={{ uri }}
                                                        autoCache={false}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                        }}
                                                        resizeMode="cover"
                                                    />
                                                    <Pressable
                                                        onPress={() => {
                                                            setSelectedImages(prev => prev.filter((_, i) => i !== index));
                                                        }}
                                                        style={{
                                                            position: 'absolute',
                                                            top: 4,
                                                            right: 4,
                                                            backgroundColor: 'rgba(0,0,0,0.6)',
                                                            borderRadius: 12,
                                                            width: 24,
                                                            height: 24,
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        <IconSymbol name="xmark" color={Colors.White} size={14} />
                                                    </Pressable>
                                                    <View style={{
                                                        position: 'absolute',
                                                        bottom: 4,
                                                        right: 4,
                                                        backgroundColor: 'rgba(0,0,0,0.6)',
                                                        paddingHorizontal: 4,
                                                        paddingVertical: 2,
                                                        borderRadius: 4,
                                                    }}>
                                                        <Text style={{ color: Colors.White, fontSize: 10, fontWeight: '600' }}>
                                                            {index + 1}/{selectedImages.length}
                                                        </Text>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    </ScrollView>
                                </View>
                            )}

                            {/* Video Preview */}
                            {selectedVideo && (
                                <View style={{
                                    position: 'relative',
                                    marginBottom: 8,
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                    backgroundColor: Colors.Secondary,
                                    borderWidth: 1,
                                    borderColor: Colors.Primary,
                                }}>
                                    <View style={{
                                        width: '100%',
                                        height: 200,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}>
                                        <IconSymbol name="video" color={Colors.Primary} size={48} />
                                        <Text style={{ 
                                            color: Colors.Text, 
                                            marginTop: 8,
                                            fontSize: 14 
                                        }}>
                                            15 second video ready
                                        </Text>
                                    </View>
                                    
                                    {/* Upload Progress Indicator */}
                                    {isUploading && uploadStatus && (
                                        <View style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            backgroundColor: 'rgba(0,0,0,0.8)',
                                            padding: 12,
                                        }}>
                                            <View style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            marginBottom: 8,
                                        }}>
                                                <ActivityIndicator size="small" color={Colors.Primary} style={{ marginRight: 8 }} />
                                                <Text style={{ 
                                                    color: Colors.White, 
                                                    fontSize: 12,
                                                    flex: 1 
                                                }}>
                                                    {uploadStatus}
                                                </Text>
                                                {uploadProgress > 0 && (
                                                    <Text style={{ 
                                                        color: Colors.White, 
                                                        fontSize: 12 
                                                    }}>
                                                        {uploadProgress}%
                                                    </Text>
                                                )}
                                            </View>
                                            {uploadProgress > 0 && (
                                                <View style={{
                                                    height: 4,
                                                    backgroundColor: Colors.Gray + '40',
                                                    borderRadius: 2,
                                                    overflow: 'hidden',
                                                }}>
                                                    <View style={{
                                                        height: '100%',
                                                        width: `${uploadProgress}%`,
                                                        backgroundColor: Colors.Primary,
                                                        borderRadius: 2,
                                                    }} />
                                                </View>
                                            )}
                                        </View>
                                    )}
                                    
                                    {!isUploading && (
                                        <Pressable
                                            onPress={() => setSelectedVideo(null)}
                                            style={{
                                                position: 'absolute',
                                                top: 8,
                                                right: 8,
                                                backgroundColor: 'rgba(0,0,0,0.6)',
                                                borderRadius: 16,
                                                width: 32,
                                                height: 32,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <IconSymbol name="xmark" color={Colors.White} size={20} />
                                        </Pressable>
                                    )}
                                </View>
                            )}

                            {/* File Preview */}
                            {selectedFile && (
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    padding: 12,
                                    marginBottom: 8,
                                    backgroundColor: Colors.Secondary,
                                    borderRadius: 8,
                                    borderWidth: 1,
                                    borderColor: Colors.Primary,
                                }}>
                                    <IconSymbol name="doc.text" color={Colors.Primary} size={24} />
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={{ color: Colors.Text, fontSize: 14, fontWeight: '500' }}>
                                            {selectedFile.name}
                                        </Text>
                                        <Text style={{ color: Colors.Gray, fontSize: 12 }}>
                                            {selectedFile.size ? `${(selectedFile.size / 1024).toFixed(2)} KB` : 'Unknown size'}
                                        </Text>
                                    </View>
                                    {!isUploading && (
                                        <Pressable
                                            onPress={() => setSelectedFile(null)}
                                            style={{
                                                padding: 4,
                                            }}
                                        >
                                            <IconSymbol name="xmark" color={Colors.Gray} size={20} />
                                        </Pressable>
                                    )}
                                </View>
                            )}

                            {/* Audio Preview */}
                            {selectedAudio && (
                                <View style={{
                                    position: 'relative',
                                    marginBottom: 8,
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                    backgroundColor: Colors.Secondary,
                                    borderWidth: 1,
                                    borderColor: Colors.Primary,
                                    padding: 12,
                                }}>
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'flex-start',
                                        gap: 12,
                                    }}>
                                        {/* Profile Picture with Microphone Badge Overlay */}
                                        <View style={{ position: 'relative', marginRight: 0 }}>
                                            <Avatar
                                                name={user?.name || 'User'}
                                                imageUrl={previewProfilePicture || undefined}
                                                size={42}
                                            />
                                            {/* Microphone Icon in Green Dot - Bottom Right Overlay */}
                                            <View style={{
                                                position: 'absolute',
                                                bottom: -2,
                                                right: -2,
                                                width: 20,
                                                height: 20,
                                                borderRadius: 10,
                                                backgroundColor: Colors.Primary,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderWidth: 2,
                                                borderColor: Colors.Secondary,
                                            }}>
                                                <IconSymbol
                                                    name="mic.fill"
                                                    color={Colors.White}
                                                    size={12}
                                                />
                                            </View>
                                        </View>
                                        
                                        {/* Play Button */}
                                        <View style={{ marginTop: 4 }}>
                                            <IconSymbol name="play.fill" color={Colors.Primary} size={32} />
                                        </View>
                                        
                                        {/* Waveform Preview and Duration Container */}
                                        <View style={{
                                            flex: 1,
                                            gap: 2,
                                        }}>
                                            {/* Waveform Preview */}
                                            <View style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                height: 32,
                                                gap: 2,
                                                width: '100%',
                                            }}>
                                                {Array.from({ length: 20 }, (_, index) => {
                                                    const height = 4 + Math.random() * 24;
                                                    return (
                                                        <View
                                                            key={index}
                                                            style={{
                                                                flex: 1,
                                                                backgroundColor: Colors.Gray,
                                                                borderRadius: 1.5,
                                                                height: height,
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </View>
                                            
                                            {/* Duration */}
                                            <Text style={{ 
                                                color: Colors.Text, 
                                                fontSize: 12,
                                                textAlign: 'left',
                                            }}>
                                                {Math.floor(selectedAudio.duration / 60)}:{(selectedAudio.duration % 60).toString().padStart(2, '0')}
                                            </Text>
                                        </View>
                                        
                                        {/* Remove Button */}
                                        {!isUploading && (
                                            <Pressable
                                                onPress={() => setSelectedAudio(null)}
                                                style={{
                                                    backgroundColor: 'rgba(0,0,0,0.6)',
                                                    borderRadius: 16,
                                                    width: 32,
                                                    height: 32,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <IconSymbol name="xmark" color={Colors.White} size={20} />
                                            </Pressable>
                                        )}
                                    </View>
                                    
                                    {/* Upload Progress Indicator */}
                                    {isUploading && uploadStatus && (
                                        <View style={{
                                            marginTop: 8,
                                            paddingTop: 8,
                                            borderTopWidth: 1,
                                            borderTopColor: Colors.Gray + '40',
                                        }}>
                                            <Text style={{ 
                                                color: Colors.White, 
                                                fontSize: 12 
                                            }}>
                                                {uploadStatus}
                                            </Text>
                                            {uploadProgress > 0 && (
                                                <View style={{
                                                    marginTop: 4,
                                                    height: 4,
                                                    backgroundColor: Colors.Gray + '40',
                                                    borderRadius: 2,
                                                    overflow: 'hidden',
                                                }}>
                                                    <View style={{
                                                        height: '100%',
                                                        width: `${uploadProgress}%`,
                                                        backgroundColor: Colors.Primary,
                                                        borderRadius: 2,
                                                    }} />
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* Edit Preview - Above Input */}
                            {editingMessage && (
                                <View style={{
                                    backgroundColor: Colors.Secondary,
                                    borderRadius: 6,
                                    paddingHorizontal: 10,
                                    paddingVertical: 6,
                                    marginBottom: 6,
                                    marginHorizontal: 10,
                                    borderLeftWidth: 2,
                                    borderLeftColor: Colors.Primary,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                }}>
                                    <IconSymbol name="pencil" color={Colors.Primary} size={12} />
                                    <Text style={{ color: Colors.Primary, fontSize: 11, fontWeight: '600', flexShrink: 0 }}>
                                        Editing message
                                    </Text>
                                    <Text 
                                        style={{ 
                                            color: Colors.Text, 
                                            fontSize: 11, 
                                            opacity: 0.7,
                                            flex: 1,
                                        }} 
                                        numberOfLines={1}
                                    >
                                        {editingMessage.content || (editingMessage.imageUrl ? '📷 Image' : editingMessage.videoFileId ? '🎥 Video' : editingMessage.audioFileId ? '🎵 Audio' : editingMessage.fileFileId ? '📄 File' : 'Message')}
                                    </Text>
                                    <Pressable
                                        onPress={handleCancelEdit}
                                        style={{
                                            padding: 2,
                                            marginLeft: -2,
                                        }}
                                    >
                                        <IconSymbol name="xmark.circle.fill" color={Colors.Gray} size={16} />
                                    </Pressable>
                                </View>
                            )}

                            {/* Reply Preview - Above Input */}
                            {replyingToMessage && !editingMessage && (
                                <View style={{
                                    backgroundColor: Colors.Secondary,
                                    borderRadius: 6,
                                    paddingHorizontal: 10,
                                    paddingVertical: 6,
                                    marginBottom: 6,
                                    marginHorizontal: 10,
                                    borderLeftWidth: 2,
                                    borderLeftColor: Colors.Primary,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                }}>
                                    <IconSymbol name="arrowshape.turn.up.left.fill" color={Colors.Primary} size={12} />
                                    <Text style={{ color: Colors.Primary, fontSize: 11, fontWeight: '600', flexShrink: 0 }}>
                                        {replyingToMessage.senderName}:
                                    </Text>
                                    <Text 
                                        style={{ 
                                            color: Colors.Text, 
                                            fontSize: 11, 
                                            opacity: 0.7,
                                            flex: 1,
                                        }} 
                                        numberOfLines={1}
                                    >
                                        {replyingToMessage.content || (replyingToMessage.imageUrl ? '📷 Image' : replyingToMessage.videoFileId ? '🎥 Video' : replyingToMessage.audioFileId ? '🎵 Audio' : replyingToMessage.fileFileId ? '📄 File' : 'Message')}
                                    </Text>
                                    <Pressable
                                        onPress={() => setReplyingToMessage(null)}
                                        style={{
                                            padding: 2,
                                            marginLeft: -2,
                                        }}
                                    >
                                        <IconSymbol name="xmark.circle.fill" color={Colors.Gray} size={16} />
                                    </Pressable>
                                </View>
                            )}

                            {/* Input Area */}
                            <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8,
                                paddingVertical: 2,
                                paddingHorizontal: 10,
                                borderWidth: 1,
                                borderColor: Colors.Gray,
                                borderRadius: 8,
                            }}>
                                {/* Emoji Picker Button */}
                                <EmojiPicker
                                    onEmojiSelect={(emoji) => setMessageContent(emoji)}
                                    isOpen={showEmojiPicker}
                                    onOpenChange={setShowEmojiPicker}
                                    isDisabled={isUploading}
                                    renderPickerSeparately={true}
                                    onCloseOtherMenus={() => {
                                        setShowAttachmentMenu(false);
                                        setShowClipboardMenu(false);
                                    }}
                                />

                                {/* Attachment Menu */}
                                <View style={{ position: 'relative' }}>
                                    <Pressable 
                                        onPress={() => {
                                            if (isUploading) return;
                                            setShowEmojiPicker(false);
                                            setShowClipboardMenu(false);
                                            setShowAttachmentMenu((prev) => !prev);
                                        }}
                                        disabled={isUploading}
                                        style={{
                                            width: 32,
                                            height: 32,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <IconSymbol 
                                            name="paperclip" 
                                            color={isUploading ? Colors.Gray : '#4A9EFF'}
                                            size={24}
                                        />
                                    </Pressable>
                                    {showAttachmentMenu && (
                                        <View
                                            style={{
                                                position: 'absolute',
                                                bottom: 44,
                                                left: -8,
                                                backgroundColor: Colors.Secondary,
                                                borderRadius: 8,
                                                borderWidth: 1,
                                                borderColor: Colors.Gray,
                                                paddingVertical: 4,
                                                width: 200,
                                                shadowColor: '#000',
                                                shadowOpacity: 0.15,
                                                shadowRadius: 6,
                                                shadowOffset: { width: 0, height: 4 },
                                                elevation: 5,
                                            }}
                                        >
                                            <Pressable
                                                onPress={() => canUploadPhoto && handleUploadImage()}
                                                disabled={!canUploadPhoto}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 10,
                                                    gap: 12,
                                                    opacity: canUploadPhoto ? 1 : 0.4,
                                                }}
                                            >
                                                <IconSymbol 
                                                    name="photo" 
                                                    color={Colors.Primary}
                                                    size={22}
                                                />
                                                <Text style={{ color: Colors.Text, fontSize: 14 }}>
                                                    Upload Image
                                                </Text>
                                            </Pressable>
                                            <Pressable
                                                onPress={handleUploadDocument}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 10,
                                                    gap: 12,
                                                }}
                                            >
                                                <IconSymbol 
                                                    name="doc.text" 
                                                    color={Colors.Primary}
                                                    size={22}
                                                />
                                                <Text style={{ color: Colors.Text, fontSize: 14 }}>
                                                    Upload Document
                                                </Text>
                                            </Pressable>
                                        </View>
                                    )}
                                </View>

                                {/* Clipboard Menu */}
                                <View style={{ position: 'relative' }}>
                                    <Pressable 
                                        onPress={() => {
                                            if (isUploading) return;
                                            setShowEmojiPicker(false);
                                            setShowAttachmentMenu(false);
                                            setShowClipboardMenu((prev) => !prev);
                                        }}
                                        disabled={isUploading}
                                        style={{
                                            width: 32,
                                            height: 32,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <ClipboardList 
                                            color={isUploading ? Colors.Gray : '#4A9EFF'}
                                            size={24}
                                        />
                                    </Pressable>
                                    {showClipboardMenu && (
                                        <View
                                            style={{
                                                position: 'absolute',
                                                bottom: 44,
                                                left: -8,
                                                backgroundColor: Colors.Secondary,
                                                borderRadius: 8,
                                                borderWidth: 1,
                                                borderColor: Colors.Gray,
                                                paddingVertical: 4,
                                                width: 200,
                                                shadowColor: '#000',
                                                shadowOpacity: 0.15,
                                                shadowRadius: 6,
                                                shadowOffset: { width: 0, height: 4 },
                                                elevation: 5,
                                            }}
                                        >
                                            <Pressable
                                                onPress={() => {
                                                    setShowClipboardMenu(false);
                                                    setIsTaskMessage(true); // Enable task mode
                                                }}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 10,
                                                    gap: 12,
                                                }}
                                            >
                                                <CalendarCheck 
                                                    color={Colors.Primary}
                                                    size={22}
                                                />
                                                <Text style={{ color: Colors.Text, fontSize: 14 }}>
                                                    Create task
                                                </Text>
                                            </Pressable>
                                            <Pressable
                                                onPress={() => {
                                                    setShowClipboardMenu(false);
                                                    setIsDutyMessage(true); // Enable duty mode
                                                }}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 10,
                                                    gap: 12,
                                                }}
                                            >
                                                <LayoutList 
                                                    color={Colors.Primary}
                                                    size={22}
                                                />
                                                <Text style={{ color: Colors.Text, fontSize: 14 }}>
                                                    Create duties
                                                </Text>
                                            </Pressable>
                                        </View>
                                    )}
                                </View>

                                <TextInput 
                                placeholder={editingMessage ? "Edit your message..." : (replyingToMessage ? "Type your reply..." : (isTaskMessage ? "Type your task..." : isDutyMessage ? "Type your duty..." : "Type your message..."))}
                                onChangeText={setMessageContent}
                                value={messageContent}
                                editable={!isUploading}
                                multiline={true}
                                onFocus={() => {
                                    setShowAttachmentMenu(false);
                                    setShowClipboardMenu(false);
                                    setShowEmojiPicker(false);
                                }}
                                style={{minHeight: 40, maxHeight: 120, color: Colors.Text, flexGrow: 1,
                                    paddingVertical: 8, paddingHorizontal: 3, flexShrink: 1,
                                }}
                                placeholderTextColor={Colors.Gray}
                                textAlignVertical="top"
                                returnKeyType="default"
                                />    
                            
                                {/* Send Button */}
                                <Pressable 
                                    disabled={(messageContent === '' && selectedImages.length === 0 && !selectedVideo && !selectedFile && !selectedAudio) || isUploading} 
                                    style={{
                                        width: 32,
                                        height: 32,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                    onPress={sendMessage}
                                >
                                    {isUploading ? (
                                        <ActivityIndicator size="small" color="#4A9EFF" />
                                    ) : (
                                        <IconSymbol 
                                        name="paperplane" 
                                        color={(messageContent || selectedImages.length > 0 || selectedVideo || selectedAudio) ? '#4A9EFF' : Colors.Gray}
                                        />
                                    )}
                                </Pressable>
                            </View>

                            {/* Emoji Picker View */}
                            <EmojiPickerView
                                isOpen={showEmojiPicker}
                                onEmojiSelect={(emoji) => {
                                    setMessageContent(emoji);
                                    setShowEmojiPicker(false);
                                }}
                            />

                            {/* Camera Menu Row */}
                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    paddingVertical: 8,
                                    marginTop: 4,
                                    gap: 12,
                                }}
                            >
                                <Pressable
                                    onPress={pickCamera}
                                    disabled={isUploading || !canUploadPhoto}
                                    style={{
                                        width: 48,
                                        height: 48,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: !canUploadPhoto ? Colors.Gray + '20' : '#4A9EFF' + '20',
                                        borderRadius: 24,
                                        borderWidth: 2,
                                        borderColor: isUploading || !canUploadPhoto ? Colors.Gray : '#4A9EFF',
                                    }}
                                >
                                    <IconSymbol 
                                        name="camera" 
                                        color={isUploading || !canUploadPhoto ? Colors.Gray : '#4A9EFF'}
                                        size={28}
                                    />
                                </Pressable>
                                <Pressable
                                    onPress={pickVideoCamera}
                                    disabled={isUploading || !canRecordVideo}
                                    style={{
                                        width: 48,
                                        height: 48,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: !canRecordVideo ? Colors.Gray + '20' : '#FF6B6B' + '20',
                                        borderRadius: 24,
                                        borderWidth: 2,
                                        borderColor: isUploading || !canRecordVideo ? Colors.Gray : '#FF6B6B',
                                    }}
                                >
                                    <IconSymbol 
                                        name="video" 
                                        color={isUploading || !canRecordVideo ? Colors.Gray : '#FF6B6B'}
                                        size={28}
                                    />
                                </Pressable>
                                <Pressable
                                    onPress={handleRecordAudio}
                                    disabled={isUploading}
                                    style={{
                                        width: 48,
                                        height: 48,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: '#22c55e' + '20',
                                        borderRadius: 24,
                                        borderWidth: 2,
                                        borderColor: isUploading ? Colors.Gray : '#22c55e',
                                    }}
                                >
                                    <IconSymbol 
                                        name="mic" 
                                        color={isUploading ? Colors.Gray : '#22c55e'}
                                        size={28}
                                    />
                                </Pressable>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                ) : activeTab === 'details' ? (
                    <JobDetails 
                        jobId={jobId as string}
                        jobChat={jobChat}
                        onJobDeleted={handleJobDeleted}
                        onStatusUpdate={updateJobStatus}
                    />
                ) : activeTab === 'tasks' ? (
                    <JobTasks
                        jobId={jobId as string}
                        messages={messages}
                        currentUserId={user?.$id}
                        onCompleteTask={handleCompleteTask}
                        onCompleteDuty={handleCompleteDuty}
                    />
                ) : (
                    <JobUploads
                        messages={messages}
                        onImagePress={uri => {
                            // Find the message that contains this image
                            const message = messages.find(msg => 
                                (msg.imageUrls && msg.imageUrls.includes(uri)) ||
                                msg.imageUrl === uri
                            );
                            if (message) {
                                const imageUrls = message.imageUrls && message.imageUrls.length > 0
                                    ? message.imageUrls
                                    : message.imageUrl
                                    ? [message.imageUrl]
                                    : [];
                                const index = imageUrls.indexOf(uri);
                                setViewingMessage(message);
                                setCurrentImageIndex(index >= 0 ? index : 0);
                                setFullScreenImage(uri);
                                setIsImageViewVisible(true);
                            } else {
                                // Fallback for single image
                                setFullScreenImage(uri);
                                setIsImageViewVisible(true);
                            }
                        }}
                        onRefresh={async () => {
                            await getMessages(false);
                        }}
                    />
                )}
            </View>

            {/* Delete Message Modal */}
            <BottomModal
                visible={showDeleteModal}
                onClose={handleDeleteCancel}
                content={
                    <View style={{ padding: 20, paddingBottom: 40 }}>
                        <Text style={{ 
                            fontSize: 18, 
                            fontWeight: 'bold', 
                            color: Colors.Text,
                            marginBottom: 20,
                            textAlign: 'center'
                        }}>
                            Delete message?
                        </Text>

                        {/* Delete Button */}
                        <Pressable
                            onPress={handleDeleteConfirm}
                            style={{
                                backgroundColor: '#FF3B30',
                                padding: 16,
                                borderRadius: 12,
                                marginBottom: 12,
                                alignItems: 'center',
                            }}
                        >
                            <Text style={{ 
                                color: Colors.White, 
                                fontSize: 16, 
                                fontWeight: '600' 
                            }}>
                                Delete
                            </Text>
                        </Pressable>

                        {/* Cancel Button */}
                        <Pressable
                            onPress={handleDeleteCancel}
                            style={{
                                backgroundColor: Colors.Secondary,
                                padding: 16,
                                borderRadius: 12,
                                alignItems: 'center',
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

            {/* Message Actions Modal (Edit/Reply/Delete) */}
            <BottomModal
                visible={showMessageActionsModal}
                onClose={handleCancelActions}
                content={
                    <View style={{ padding: 20, paddingBottom: 40 }}>
                        <Text style={{ 
                            fontSize: 18, 
                            fontWeight: 'bold', 
                            color: Colors.Text,
                            marginBottom: 20,
                            textAlign: 'center'
                        }}>
                            Message Options
                        </Text>

                        {/* Edit Button - Only for own messages */}
                        {messageForAction && messageForAction.senderId === user?.$id && (
                            <Pressable
                                onPress={handleEditMessage}
                                style={{
                                    backgroundColor: Colors.Primary,
                                    padding: 16,
                                    borderRadius: 12,
                                    marginBottom: 12,
                                    alignItems: 'center',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    gap: 8,
                                }}
                            >
                                <IconSymbol name="pencil" color={Colors.White} size={18} />
                                <Text style={{ 
                                    color: Colors.White, 
                                    fontSize: 16, 
                                    fontWeight: '600' 
                                }}>
                                    Edit
                                </Text>
                            </Pressable>
                        )}

                        {/* Reply Button */}
                        <Pressable
                            onPress={handleReplyFromModal}
                            style={{
                                backgroundColor: Colors.Primary,
                                padding: 16,
                                borderRadius: 12,
                                marginBottom: 12,
                                alignItems: 'center',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                gap: 8,
                            }}
                        >
                            <IconSymbol name="arrowshape.turn.up.left" color={Colors.White} size={18} />
                            <Text style={{ 
                                color: Colors.White, 
                                fontSize: 16, 
                                fontWeight: '600' 
                            }}>
                                Reply
                            </Text>
                        </Pressable>

                        {/* Delete Button - Only for own messages */}
                        {messageForAction && messageForAction.senderId === user?.$id && (
                            <Pressable
                                onPress={handleDeleteFromModal}
                                style={{
                                    backgroundColor: '#FF3B30',
                                    padding: 16,
                                    borderRadius: 12,
                                    marginBottom: 12,
                                    alignItems: 'center',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    gap: 8,
                                }}
                            >
                                <IconSymbol name="trash" color={Colors.White} size={18} />
                                <Text style={{ 
                                    color: Colors.White, 
                                    fontSize: 16, 
                                    fontWeight: '600' 
                                }}>
                                    Delete
                                </Text>
                            </Pressable>
                        )}

                        {/* Cancel Button */}
                        <Pressable
                            onPress={handleCancelActions}
                            style={{
                                backgroundColor: Colors.Secondary,
                                padding: 16,
                                borderRadius: 12,
                                alignItems: 'center',
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

            {/* Full Screen Image Viewer with Zoom and Album Navigation */}
            <ImageViewing
                images={
                    viewingMessage && viewingMessage.imageUrls && viewingMessage.imageUrls.length > 0
                        ? viewingMessage.imageUrls.map(uri => {
                            // Use cached URI if available (will be resolved by ImageViewing's internal caching)
                            // For now, pass original URI - ImageViewing uses expo-image internally which has HTTP caching
                            return { uri };
                        })
                        : viewingMessage && viewingMessage.imageUrl
                        ? [{ uri: viewingMessage.imageUrl }]
                        : fullScreenImage
                        ? [{ uri: fullScreenImage }]
                        : []
                }
                imageIndex={currentImageIndex}
                visible={isImageViewVisible}
                onRequestClose={() => {
                    setIsImageViewVisible(false);
                    setFullScreenImage(null);
                    setViewingMessage(null);
                    setCurrentImageIndex(0);
                }}
                onImageIndexChange={(index) => {
                    setCurrentImageIndex(index);
                    if (viewingMessage?.imageUrls && viewingMessage.imageUrls[index]) {
                        setFullScreenImage(viewingMessage.imageUrls[index]);
                    }
                }}
                {...({ onLongPress: () => setShowSaveImageModal(true) } as any)}
                HeaderComponent={() => {
                    const imageUrls = viewingMessage?.imageUrls && viewingMessage.imageUrls.length > 0
                        ? viewingMessage.imageUrls
                        : viewingMessage?.imageUrl
                        ? [viewingMessage.imageUrl]
                        : [];
                    const hasMultipleImages = imageUrls.length > 1;
                    const canGoBack = currentImageIndex > 0;
                    const canGoForward = currentImageIndex < imageUrls.length - 1;
                    const screenHeight = Dimensions.get('window').height;
                    const arrowYPosition = screenHeight / 2 - 25; // 50% of screen minus half button height

                    return (
                        <>
                            {/* Close Button */}
                            <View style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                paddingTop: Platform.OS === 'ios' ? insets.top + 10 : insets.top + 10,
                                paddingHorizontal: 20,
                                zIndex: 1,
                            }}>
                                <View style={{
                                    flexDirection: 'row',
                                    justifyContent: 'flex-end',
                                    alignItems: 'center',
                                }}>
                                    <Pressable
                                        onPress={() => {
                                            setIsImageViewVisible(false);
                                            setFullScreenImage(null);
                                            setViewingMessage(null);
                                            setCurrentImageIndex(0);
                                        }}
                                        style={{
                                            backgroundColor: 'rgba(0,0,0,0.6)',
                                            borderRadius: 20,
                                            width: 40,
                                            height: 40,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <IconSymbol name="xmark" color={Colors.White} size={24} />
                                    </Pressable>
                                </View>
                            </View>

                            {/* Navigation Arrows - Vertically Centered at 50% of screen */}
                            {hasMultipleImages && (
                                <View style={{
                                    position: 'absolute',
                                    top: arrowYPosition,
                                    left: 0,
                                    right: 0,
                                    height: 50,
                                    zIndex: 10,
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    pointerEvents: 'box-none',
                                }}>
                                    {/* Previous Button */}
                                    <Pressable
                                        onPress={() => {
                                            if (canGoBack) {
                                                const newIndex = currentImageIndex - 1;
                                                setCurrentImageIndex(newIndex);
                                                if (viewingMessage?.imageUrls && viewingMessage.imageUrls[newIndex]) {
                                                    setFullScreenImage(viewingMessage.imageUrls[newIndex]);
                                                }
                                            }
                                        }}
                                        disabled={!canGoBack}
                                        style={{
                                            backgroundColor: canGoBack ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                                            borderRadius: 25,
                                            width: 50,
                                            height: 50,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            opacity: canGoBack ? 1 : 0.5,
                                            marginLeft: 20,
                                        }}
                                    >
                                        <IconSymbol 
                                            name="chevron.left" 
                                            color={Colors.White} 
                                            size={28} 
                                        />
                                    </Pressable>

                                    {/* Next Button */}
                                    <Pressable
                                        onPress={() => {
                                            if (canGoForward) {
                                                const newIndex = currentImageIndex + 1;
                                                setCurrentImageIndex(newIndex);
                                                if (viewingMessage?.imageUrls && viewingMessage.imageUrls[newIndex]) {
                                                    setFullScreenImage(viewingMessage.imageUrls[newIndex]);
                                                }
                                            }
                                        }}
                                        disabled={!canGoForward}
                                        style={{
                                            backgroundColor: canGoForward ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                                            borderRadius: 25,
                                            width: 50,
                                            height: 50,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            opacity: canGoForward ? 1 : 0.5,
                                            marginRight: 20,
                                        }}
                                    >
                                        <IconSymbol 
                                            name="chevron.right" 
                                            color={Colors.White} 
                                            size={28} 
                                        />
                                    </Pressable>
                                </View>
                            )}
                        </>
                    );
                }}
                FooterComponent={() => {
                    const imageUrls = viewingMessage?.imageUrls && viewingMessage.imageUrls.length > 0
                        ? viewingMessage.imageUrls
                        : viewingMessage?.imageUrl
                        ? [viewingMessage.imageUrl]
                        : [];
                    const hasMultipleImages = imageUrls.length > 1;
                    const canGoBack = currentImageIndex > 0;
                    const canGoForward = currentImageIndex < imageUrls.length - 1;
                    return (
                        <>
                            {/* Bottom Content - Counter and Message */}
                            <View style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                paddingBottom: Platform.OS === 'ios' ? insets.bottom + 10 : insets.bottom + 20,
                                paddingHorizontal: 20,
                                zIndex: 1,
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                paddingTop: 15,
                            }}>
                                {/* Image Counter */}
                                {hasMultipleImages && (
                                    <View style={{
                                        alignItems: 'center',
                                        marginBottom: viewingMessage?.content && viewingMessage.content !== 'Message deleted by user' ? 12 : 0,
                                    }}>
                                        <Text style={{
                                            color: Colors.White,
                                            fontSize: 16,
                                            fontWeight: '600',
                                        }}>
                                            {currentImageIndex + 1} / {imageUrls.length}
                                        </Text>
                                    </View>
                                )}

                                {/* Message Content */}
                                {viewingMessage?.content && viewingMessage.content !== 'Message deleted by user' && (
                                    <View style={{
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        borderRadius: 8,
                                        padding: 12,
                                    }}>
                                        <Text style={{
                                            color: Colors.White,
                                            fontSize: 14,
                                            lineHeight: 22,
                                        }} numberOfLines={3}>
                                            {viewingMessage.content}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </>
                    );
                }}
            />

            <SaveImageModal
                visible={showSaveImageModal}
                imageUrl={fullScreenImage}
                onClose={() => setShowSaveImageModal(false)}
            />

            {/* Share Location Modal */}
            <ShareLocation
                visible={showShareLocation}
                onClose={() => {
                    console.log('🔍 ShareLocation onClose called');
                    setShowShareLocation(false);
                }}
                onPostLocation={postLocationToChat}
            />
            <BottomModal2
                visible={showShareJobModal}
                onClose={() => setShowShareJobModal(false)}
                contentStyle={{ backgroundColor: Colors.Secondary }}
                minHeightRatio={0.5}
                maxHeightRatio={0.9}
            >
                <ShareJob 
                    onClose={() => setShowShareJobModal(false)} 
                    jobId={jobId as string}
                    user={user}
                    teamId={jobChat?.teamId}
                    reportId={reportId}
                    onShareReport={() => {
                        setShowShareJobModal(false);
                        setShowShareReportModal(true);
                    }}
                    onCreateReport={async (newReportId, reportUrl) => {
                        setReportId(newReportId);
                        console.log('✅ Report created:', { reportId: newReportId, reportUrl });
                        // Report is already stored in Reports collection by the web API
                    }}
                    onUnmountReport={() => {
                        setReportId(null);
                        console.log('🔍 Report unmounted');
                    }}
                />
            </BottomModal2>
            <ShareReportModal
                visible={showShareReportModal}
                reportUrl={reportId ? `https://web.workphotopro.com/reports/${reportId}` : `https://web.workphotopro.com/reports/${jobId}`}
                shareMessage={`${user?.name || 'Someone'} has a job with you, ${reportId ? `https://web.workphotopro.com/reports/${reportId}` : `https://web.workphotopro.com/reports/${jobId}`}`}
                onClose={() => setShowShareReportModal(false)}
            />
            <BottomModal2
                visible={showAudioRecorder}
                onClose={() => {
                    setShowAudioRecorder(false);
                    setSelectedAudio(null);
                }}
                contentStyle={{ backgroundColor: Colors.Secondary }}
            >
                <AudioRecorder
                    onRecordingComplete={(uri, duration) => {
                        setSelectedAudio({ uri, duration });
                        setShowAudioRecorder(false);
                    }}
                    onCancel={() => setShowAudioRecorder(false)}
                />
            </BottomModal2>

            {/* Full Screen Video Player */}
            {fullScreenVideo && (
                <FullScreenVideoPlayer
                    uri={fullScreenVideo.uri}
                    fileId={fullScreenVideo.fileId}
                    visible={!!fullScreenVideo}
                    onClose={() => setFullScreenVideo(null)}
                    onError={(error) => {
                        console.error('Full screen video error:', error);
                        Alert.alert('Video Error', 'Failed to play video.');
                        setFullScreenVideo(null);
                    }}
                />
            )}
            </>
    )
}
