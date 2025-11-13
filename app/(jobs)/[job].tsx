import BottomModal from '@/components/BottomModal'
import BottomModal2 from '@/components/BottomModal2'
import { IconSymbol } from '@/components/IconSymbol'
import Avatar from '@/components/Avatar'
import ShareLocation from '@/components/share-location'
import { globalStyles } from '@/styles/globalStyles'
import { appwriteConfig, client, db, ID, storage } from '@/utils/appwrite'
import { Colors } from '@/utils/colors'
import { JobChats } from '@/utils/test-data'
import { JobChat, Message, LocationData } from '@/utils/types'
import { useAuth } from '@/context/AuthContext'
import { useOrganization } from '@/context/OrganizationContext'
import { LegendList } from '@legendapp/list'
import { useHeaderHeight } from '@react-navigation/elements'
import * as ImagePicker from 'expo-image-picker'
import { Stack, useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router'
import * as React from 'react'
import { ActivityIndicator, Alert, Image, Keyboard, KeyboardAvoidingView, Linking, Platform, Pressable, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Query } from 'react-native-appwrite'
import ImageViewing from 'react-native-image-viewing'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import JobDetails from './job-details'
import JobPhotos from './job-photos'
import * as SecureStore from 'expo-secure-store'
import SaveImageModal from '@/components/SaveImageModal'
import ShareJob from './share-job'


export default function Job() {
    const { job: jobId } = useLocalSearchParams()
    const { user, getUserProfilePicture } = useAuth();
    const { currentTeam, currentOrganization } = useOrganization();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    console.log('🔍 Job Component: Component mounted/rendered');
    console.log('🔍 Job Component: jobId from params:', jobId);
    console.log('🔍 Job Component: user info:', { userId: user?.$id, userName: user?.name });
    console.log('🔍 Job Component: Appwrite config:', {
        db: appwriteConfig.db,
        messagesCollection: appwriteConfig.col.messages,
        jobchatCollection: appwriteConfig.col.jobchat
    });

    if(!jobId) {
        console.log('🔍 Job Component: No jobId found, returning error');
        return <Text>Job not found. </Text>
    }
    

    const [messageContent, setMessageContent] = React.useState('');
    const [jobChat, setJobChat] = React.useState<JobChat | null>(null);
    const [activeTab, setActiveTab] = React.useState<'chat' | 'details' | 'photos'>('chat');

    const [messages, setMessages] = React.useState<Message[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [keyboardHeight, setKeyboardHeight] = React.useState(0);
    const headerHeight = Platform.OS === 'ios' ? useHeaderHeight() : 0;
    const listRef = React.useRef<any>(null);
    const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
    const [isUploading, setIsUploading] = React.useState(false);
    const [pressedMessageId, setPressedMessageId] = React.useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = React.useState(false);
    const [messageToDelete, setMessageToDelete] = React.useState<Message | null>(null);
    const [fullScreenImage, setFullScreenImage] = React.useState<string | null>(null);
    const [isImageViewVisible, setIsImageViewVisible] = React.useState(false);
    const [showSaveImageModal, setShowSaveImageModal] = React.useState(false);
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [showShareLocation, setShowShareLocation] = React.useState(false);
    const [showShareJobModal, setShowShareJobModal] = React.useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
    const [showAttachmentMenu, setShowAttachmentMenu] = React.useState(false);


    React.useEffect(() => {
        handleFirstLoad();
        
        // Additional scroll attempt after component mounts
        setTimeout(() => {
            listRef.current?.scrollToEnd({ animated: false });
        }, 1000);
    }, []);

    // Handle captured image from camera page
    React.useEffect(() => {
        const checkCapturedImage = async () => {
            try {
                const capturedImageUri = await SecureStore.getItemAsync('capturedImageUri')
                if (capturedImageUri) {
                    console.log('🔍 Received captured image URI:', capturedImageUri)
                    setSelectedImage(capturedImageUri)
                    // Clear the stored image URI
                    await SecureStore.deleteItemAsync('capturedImageUri')
                }
            } catch (error) {
                console.error('Error retrieving captured image:', error)
            }
        }
        checkCapturedImage()
    }, []) // Run once on mount and when screen comes into focus

    // Auto-refresh when returning to the screen
    useFocusEffect(
        React.useCallback(() => {
            console.log('🔍 useFocusEffect: Screen focused, refreshing messages');
            
            // Check for captured image from camera
            const checkCapturedImage = async () => {
                try {
                    const capturedImageUri = await SecureStore.getItemAsync('capturedImageUri')
                    if (capturedImageUri) {
                        console.log('🔍 Received captured image URI from camera:', capturedImageUri)
                        setSelectedImage(capturedImageUri)
                        // Clear the stored image URI
                        await SecureStore.deleteItemAsync('capturedImageUri')
                    }
                } catch (error) {
                    console.error('Error retrieving captured image:', error)
                }
            }
            checkCapturedImage()
            
            // Refresh messages
            const refreshMessages = async () => {
                await getMessages();
                // Scroll to bottom after refresh
                setTimeout(() => {
                    listRef.current?.scrollToEnd({ animated: true });
                }, 300);
            };
            refreshMessages();
        }, [jobId])
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
        
        // Disable real-time subscriptions temporarily to prevent WebSocket errors
        console.log('🔍 Real-time subscription: Disabled to prevent WebSocket errors');
        return;
        
        const channel = `databases.${appwriteConfig.db}.collections.${appwriteConfig.col.messages}.documents`;
        console.log('🔍 Real-time subscription: Setting up subscription for channel:', channel);
        
        let unsubscribe: (() => void) | null = null;
        
        try {
            unsubscribe = client.subscribe(channel, (event) => {
                try {
                    console.log('🔍 Real-time subscription: Received event:', event);
                    console.log('🔍 Real-time subscription: Event type:', event.events);
                    console.log('🔍 Real-time subscription: Event payload:', event.payload);
                    
                    // Only refresh if the event is related to our job
                    if (event.payload && (event.payload as any).jobId === jobId) {
                        console.log('🔍 Real-time subscription: Event is for our job, refreshing messages');
                        getMessages();
                    }
                } catch (error) {
                    console.error('🔍 Real-time subscription: Error handling event:', error);
                }
            });
        } catch (error) {
            console.error('🔍 Real-time subscription: Error setting up subscription:', error);
        }
        
        return () => {
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

    // Scroll to end when messages change
    React.useEffect(() => {
        console.log('🔍 Messages effect: Messages array changed, length:', messages.length);
        console.log('🔍 Messages effect: Messages content:', messages.map(m => ({ id: m.$id, content: m.content, senderId: m.senderId })));
        
        if (messages.length > 0 && listRef.current) {
            // Use requestAnimationFrame for better timing
            requestAnimationFrame(() => {
                listRef.current?.scrollToEnd({ animated: true });
            });
        }
    }, [messages]);
    
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
        

const getMessages = async () => {
    try {
        console.log('🔍 getMessages: Fetching messages for jobId:', jobId);
        const { documents, total } = await db.listDocuments<Message>(
            appwriteConfig.db, 
            appwriteConfig.col.messages,
            [
                Query.equal('jobId', jobId as string),
                Query.orderAsc('$createdAt'),
                Query.limit(100),
            ]
        );
        console.log('🔍 getMessages: Successfully fetched messages:', {
            count: documents.length,
            total: total,
            messages: documents.map(m => ({ id: m.$id, content: m.content, senderId: m.senderId }))
        });
        
        // Update messages state with fresh data
        // Parse locationData from locationData attribute (now defined in Appwrite)
        // Infer messageType from locationData presence (since messageType attribute doesn't exist in Appwrite)
        const freshMessages = documents.map((doc: any) => {
            // Check if this message has locationData (infers it's a location message)
            if (doc.locationData) {
                // Parse locationData from attribute (stored as JSON string)
                if (typeof doc.locationData === 'string') {
                    try {
                        doc.locationData = JSON.parse(doc.locationData);
                        doc.messageType = 'location'; // Infer messageType from locationData presence
                        console.log('🔍 getMessages: Parsed locationData and inferred messageType=location for message:', doc.$id);
                    } catch (e) {
                        console.error('🔍 getMessages: Error parsing locationData:', e, 'Raw data:', doc.locationData);
                        // If parsing fails, try parsing from content field (backward compatibility)
                        const locationMatch = doc.content?.match(/\|LOCATION_DATA:(.+?)\|/);
                        if (locationMatch && locationMatch[1]) {
                            try {
                                doc.locationData = JSON.parse(locationMatch[1]);
                                doc.content = doc.content.replace(/\|LOCATION_DATA:.+?\|/, '').trim();
                                doc.messageType = 'location';
                                console.log('🔍 getMessages: Parsed locationData from content (fallback) for message:', doc.$id);
                            } catch (e2) {
                                console.error('🔍 getMessages: Error parsing locationData from content:', e2);
                            }
                        }
                    }
                } else if (typeof doc.locationData === 'object') {
                    // Already parsed (shouldn't happen, but handle it just in case)
                    doc.messageType = 'location';
                    console.log('🔍 getMessages: locationData already an object, inferred messageType=location for message:', doc.$id);
                }
            } else if (doc.messageType === 'location') {
                // Backward compatibility: if messageType exists but no locationData, remove messageType
                // This handles old messages that might have messageType but no locationData
                console.log('🔍 getMessages: Found messageType=location but no locationData, removing messageType:', doc.$id);
                delete doc.messageType;
            }
            return doc;
        }) as Message[];
        
        setMessages(prevMessages => {
            // Only update if the data is actually different to prevent unnecessary re-renders
            if (JSON.stringify(prevMessages) !== JSON.stringify(freshMessages)) {
                console.log('🔍 getMessages: Updating messages state with fresh data');
                return freshMessages;
            }
            console.log('🔍 getMessages: Messages unchanged, keeping current state');
            return prevMessages;
        });
        
    } catch(e) {
        console.error('🔍 getMessages: Error fetching messages:', e);
    }
}

    const pickImage = async () => {
        setShowAttachmentMenu(false);
        setShowEmojiPicker(false);
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (permissionResult.granted === false) {
                Alert.alert('Permission Required', 'Please allow access to your photo library to send images.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setSelectedImage(result.assets[0].uri);
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

    const handleUploadDocument = () => {
        setShowAttachmentMenu(false);
        setShowEmojiPicker(false);
        Alert.alert('Coming Soon', 'Document uploads will be available soon.');
    };

    const pickCamera = () => {
        router.push(`/(jobs)/camera?jobId=${jobId}`);
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

    const sendMessage = async () => {
       
       setShowAttachmentMenu(false);
       
       if(messageContent.trim() === '' && !selectedImage) return;
       
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

        // Get user's profile picture from Google OAuth or stored preferences
        const userProfilePicture = await getUserProfilePicture();
        console.log('🔍 sendMessage: User profile picture:', userProfilePicture);

        // Upload image if one is selected
        if (selectedImage) {
            console.log('🔍 sendMessage: Uploading image...');
            const uploadResult = await uploadImage(selectedImage);
            if (uploadResult) {
                imageUrl = uploadResult.fileUrl;
                imageFileId = uploadResult.fileId;
                console.log('🔍 sendMessage: Image uploaded successfully:', { imageUrl, imageFileId });
            } else {
                console.error('🔍 sendMessage: Image upload failed');
                setIsUploading(false);
                return; // Don't send message if image upload failed
            }
        }

       const message: any = {
        content: messageContent || '', // Empty string if only image
        senderId: user?.$id,
        senderName: user?.name,
        senderPhoto: userProfilePicture || '', // Use user's profile picture from preferences
        jobId: jobId,
        teamId: currentTeam?.$id, // Add teamId from current team
        orgId: currentOrganization?.$id, // Add orgId from current organization
       };

       // Add image fields only if image was uploaded
       if (imageUrl) {
           message.imageUrl = imageUrl;
           message.imageFileId = imageFileId;
       }

       console.log('🔍 sendMessage: Creating message document:', message);

       const createdMessage = await db.createDocument(
        appwriteConfig.db, 
        appwriteConfig.col.messages, 
        ID.unique(), 
        message
        );

        console.log('🔍 sendMessage: Message created successfully:', createdMessage);

        // Clear input fields immediately
        setMessageContent('');
        setSelectedImage(null);
        setIsUploading(false);

        // Refresh messages to show the new message
        console.log('🔍 sendMessage: Refreshing messages after sending...');
        await getMessages();

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
        }
    }

    const deleteMessage = async (messageId: string) => {
        try {
            // Update the message to mark it as deleted
            await db.updateDocument(
                appwriteConfig.db,
                appwriteConfig.col.messages,
                messageId,
                {
                    content: 'Message deleted by user',
                    imageUrl: '',
                    imageFileId: '',
                }
            );
            
            // Refresh messages
            await getMessages();
        } catch (error) {
            console.error('Error deleting message:', error);
            Alert.alert('Error', 'Failed to delete message. Please try again.');
        }
    };

    const handleLongPress = (message: Message) => {
        // Only allow user to delete their own messages
        if (message.senderId !== user?.$id) {
            return;
        }

        // Don't allow deleting already deleted messages
        if (message.content === 'Message deleted by user') {
            return;
        }

        setPressedMessageId(message.$id);
        setMessageToDelete(message);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = () => {
        if (messageToDelete) {
            deleteMessage(messageToDelete.$id);
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
        console.log('🔍 handleRefresh: Starting pull-to-refresh');
        setIsRefreshing(true);
        try {
            await getMessages();
            // Scroll to bottom after refresh
            setTimeout(() => {
                listRef.current?.scrollToEnd({ animated: true });
            }, 300);
        } catch (error) {
            console.error('🔍 handleRefresh: Error during refresh:', error);
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
        selectedImage: !!selectedImage
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
                                onPress={() => {
                                    console.log('🔍 Share icon clicked, opening ShareJob modal');
                                    setShowShareJobModal(true);
                                }}
                            >
                                <IconSymbol name="square.and.arrow.up" color="#fff" size={20} />
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
                            borderBottomColor: activeTab === 'chat' ? Colors.Success : 'transparent',
                        }}
                        onPress={() => setActiveTab('chat')}
                    >
                        <Text style={{
                            color: activeTab === 'chat' ? Colors.Success : Colors.Gray,
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
                            borderBottomColor: activeTab === 'details' ? Colors.Success : 'transparent',
                        }}
                        onPress={() => setActiveTab('details')}
                    >
                        <Text style={{
                            color: activeTab === 'details' ? Colors.Success : Colors.Gray,
                            fontSize: 16,
                            fontWeight: activeTab === 'details' ? '600' : '400',
                        }}>
                            Job Details
                        </Text>
                    </Pressable>

                    {/* Photos Tab */}
                    <Pressable
                        style={{
                            flex: 1,
                            paddingVertical: 16,
                            alignItems: 'center',
                            borderBottomWidth: 3,
                            borderBottomColor: activeTab === 'photos' ? Colors.Success : 'transparent',
                        }}
                        onPress={() => setActiveTab('photos')}
                    >
                        <Text style={{
                            color: activeTab === 'photos' ? Colors.Success : Colors.Gray,
                            fontSize: 16,
                            fontWeight: activeTab === 'photos' ? '600' : '400',
                        }}>
                            Photos
                        </Text>
                    </Pressable>
                </View>

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
                                <RefreshControl
                                    refreshing={isRefreshing}
                                    onRefresh={handleRefresh}
                                    colors={[Colors.Primary]}
                                    tintColor={Colors.Primary}
                                    title="Pull to refresh messages"
                                    titleColor={Colors.Text}
                                />
                            }
                            renderItem={({ item }: { item: Message }) => {
                                console.log('🔍 LegendList renderItem: Rendering message:', { id: item.$id, content: item.content, senderId: item.senderId });
                                const isSender = item.senderId === user?.$id;
                                const isPressed = pressedMessageId === item.$id;
                                return (
                                    <View style={{ 
                                        padding: 10,
                                        borderRadius: 10,
                                        flexDirection: 'row',
                                        justifyContent: isSender ? 'flex-end' : 'flex-start',
                                    }}>
                                        {!isSender && (
                                        <Avatar 
                                            name={item.senderName || 'Unknown User'}
                                            imageUrl={item.senderPhoto}
                                            size={30}
                                            style={{ marginRight: 10 }}
                                        />
                                        )}
                                        <Pressable
                                            onLongPress={() => handleLongPress(item)}
                                            delayLongPress={500}
                                            style={{ 
                                                backgroundColor: isSender ? Colors.Purple : Colors.Secondary,
                                                padding: 10,
                                                borderRadius: 10,
                                                minWidth: '70%',
                                                maxWidth: '70%',
                                                opacity: isPressed ? 0.7 : 1,
                                                borderWidth: isPressed ? 2 : 0,
                                                borderColor: isPressed ? Colors.Primary : 'transparent',
                                            }}
                                        >
                                            <Text style={{ color: Colors.Text, fontWeight: 'bold', marginBottom: 5 }}>{item.senderName}</Text>
                                            
                                            {item.imageUrl && item.content !== 'Message deleted by user' && (
                                                <TouchableOpacity 
                                                    onPress={() => {
                                                        setFullScreenImage(item.imageUrl || null);
                                                        setIsImageViewVisible(true);
                                                    }}
                                                    activeOpacity={0.9}
                                                >
                                                    <Image 
                                                        source={{ uri: item.imageUrl }} 
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

                                            {/* Location Message */}
                                            {item.messageType === 'location' && item.locationData && (
                                                <TouchableOpacity 
                                                    onPress={() => {
                                                        // Open location in maps app
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
                                            
                                            {item.content && (
                                                <Text style={{ 
                                                    color: Colors.Text,
                                                    fontStyle: item.content === 'Message deleted by user' ? 'italic' : 'normal',
                                                    opacity: item.content === 'Message deleted by user' ? 0.6 : 1,
                                                    fontSize: isEmojiMessage(item.content) ? 48 : 14,
                                                    textAlign: isEmojiMessage(item.content) ? 'center' : 'left',
                                                    lineHeight: isEmojiMessage(item.content) ? 56 : undefined,
                                                }}>
                                                    {item.content}
                                                </Text>
                                            )}

                                            <Text
                                            style={{
                                                fontSize: 10,
                                                textAlign: "right",
                                                color: Colors.White,
                                            }}
                                            >
                                            {new Date(item.$createdAt!).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                            </Text>
                                        </Pressable>
                                    </View>
                                );
                            }}
                            keyExtractor={(item) => item?.$id ?? "unknown"}
                            contentContainerStyle={{ 
                                padding: 10,
                                paddingBottom: 20
                            }}
                            recycleItems={false}
                            maintainScrollAtEnd
                            maintainScrollAtEndThreshold={0.1}
                            estimatedItemSize={120}
                        />

                        <View style={{ marginHorizontal: 10, marginBottom: Platform.OS === 'ios' ? 34 : insets.bottom + 16 }}>
                            {/* Image Preview */}
                            {selectedImage && (
                                <View style={{
                                    position: 'relative',
                                    marginBottom: 8,
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                }}>
                                    <Image 
                                        source={{ uri: selectedImage }}
                                        style={{
                                            width: '100%',
                                            height: 200,
                                            borderRadius: 8,
                                        }}
                                        resizeMode="cover"
                                    />
                                    <Pressable
                                        onPress={() => setSelectedImage(null)}
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
                                <Pressable 
                                    onPress={() => {
                                        setShowEmojiPicker(!showEmojiPicker);
                                        setShowAttachmentMenu(false);
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
                                        name="face.smiling" 
                                        color={isUploading ? Colors.Gray : '#4A9EFF'}
                                        size={24}
                                    />
                                </Pressable>

                                {/* Attachment Menu */}
                                <View style={{ position: 'relative' }}>
                                    <Pressable 
                                        onPress={() => {
                                            if (isUploading) return;
                                            setShowEmojiPicker(false);
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
                                                onPress={handleUploadImage}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 10,
                                                    gap: 12,
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

                                <TextInput 
                                placeholder="Type your message..."
                                onChangeText={setMessageContent}
                                value={messageContent}
                                editable={!isUploading}
                                onFocus={() => setShowAttachmentMenu(false)}
                                style={{minHeight: 40, color: Colors.Text, flexGrow: 1,
                                    paddingVertical: 2, paddingHorizontal: 3, flexShrink: 1,
                                }}
                                placeholderTextColor={Colors.Gray}
                                onSubmitEditing={sendMessage}
                                blurOnSubmit={false}
                                returnKeyType="send"
                                />    
                            
                                {/* Send Button */}
                                <Pressable 
                                    disabled={messageContent === '' && !selectedImage || isUploading} 
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
                                        color={(messageContent || selectedImage) ? '#4A9EFF' : Colors.Gray}
                                        />
                                    )}
                                </Pressable>
                            </View>

                            {/* Emoji Picker */}
                            {showEmojiPicker && (
                                <View style={{
                                    flexDirection: 'row',
                                    gap: 8,
                                    paddingHorizontal: 10,
                                    paddingVertical: 12,
                                    borderWidth: 1,
                                    borderColor: Colors.Gray,
                                    borderRadius: 8,
                                    marginTop: 8,
                                    backgroundColor: Colors.Secondary,
                                }}>
                                    {['👍', '❤️', '😂', '😮', '🔥'].map((emoji) => (
                                        <Pressable
                                            key={emoji}
                                            onPress={() => {
                                                setMessageContent(emoji);
                                                setShowEmojiPicker(false);
                                            }}
                                            style={{
                                                padding: 12,
                                                backgroundColor: Colors.Primary + '20',
                                                borderRadius: 8,
                                                borderWidth: 1,
                                                borderColor: Colors.Primary,
                                            }}
                                        >
                                            <Text style={{ fontSize: 24 }}>{emoji}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            )}

                            {/* Camera Menu Row */}
                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    paddingVertical: 8,
                                    marginTop: 4,
                                }}
                            >
                                <Pressable
                                    onPress={pickCamera}
                                    disabled={isUploading}
                                    style={{
                                        width: 48,
                                        height: 48,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: '#4A9EFF' + '20',
                                        borderRadius: 24,
                                        borderWidth: 2,
                                        borderColor: isUploading ? Colors.Gray : '#4A9EFF',
                                    }}
                                >
                                    <IconSymbol 
                                        name="camera" 
                                        color={isUploading ? Colors.Gray : '#4A9EFF'}
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
                ) : (
                    <JobPhotos
                        messages={messages}
                        onImagePress={uri => {
                            setFullScreenImage(uri)
                            setIsImageViewVisible(true)
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

            {/* Full Screen Image Viewer with Zoom */}
            <ImageViewing
                images={fullScreenImage ? [{ uri: fullScreenImage }] : []}
                imageIndex={0}
                visible={isImageViewVisible}
                onRequestClose={() => {
                    setIsImageViewVisible(false);
                    setFullScreenImage(null);
                }}
                {...({ onLongPress: () => setShowSaveImageModal(true) } as any)}
                HeaderComponent={() => (
                    <View style={{
                        position: 'absolute',
                        top: Platform.OS === 'ios' ? 50 : 10,
                        right: 20,
                        zIndex: 1,
                    }}>
                        <Pressable
                            onPress={() => {
                                setIsImageViewVisible(false);
                                setFullScreenImage(null);
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
                )}
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
            >
                <ShareJob onClose={() => setShowShareJobModal(false)} />
            </BottomModal2>
            </>
    )
}
