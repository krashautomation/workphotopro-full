# Multiple Image Upload Implementation Guide

This guide walks you through implementing multiple image uploads in messages (Option 1).

## Overview

We're implementing the ability to upload multiple images in a single message, displayed as an album/grid layout.

## Step-by-Step Implementation

### Step 1: Database Schema Updates ⚠️ REQUIRED

You need to add **two new attributes** to the `messages` collection in Appwrite:

#### Go to Appwrite Console:
1. Navigate to **Databases** → Your Database → `messages` collection
2. Click **Attributes** → **Create Attribute**

#### Add Attribute 1: `imageUrls` (Array of Strings)
- **Type**: String
- **Size**: 2048
- **Required**: ❌ No
- **Array**: ✅ **YES** (This is the key change!)
- **Default**: None

#### Add Attribute 2: `imageFileIds` (Array of Strings)
- **Type**: String
- **Size**: 255
- **Required**: ❌ No
- **Array**: ✅ **YES** (This is the key change!)
- **Default**: None

**Important Notes:**
- Keep the existing `imageUrl` and `imageFileId` fields (for backward compatibility)
- The arrays will store multiple image URLs/file IDs
- Arrays are indexed automatically in Appwrite

### Step 2: TypeScript Type Updates

Update `utils/types.ts` to add array fields to the `Message` interface:

```typescript
export interface Message {
  // ... existing fields ...
  
  // Single image fields (keep for backward compatibility)
  imageUrl?: string;
  imageFileId?: string;
  
  // NEW: Multiple image fields
  imageUrls?: string[];      // Array of image URLs
  imageFileIds?: string[];    // Array of file IDs for deletion
  
  // ... rest of fields ...
}
```

### Step 3: State Management Changes

In `app/(jobs)/[job].tsx`, update the state:

**Change from:**
```typescript
const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
```

**To:**
```typescript
const [selectedImages, setSelectedImages] = React.useState<string[]>([]);
```

### Step 4: Image Picker Updates

Update `handleUploadImage` function to support multiple selection:

**Current code:**
```typescript
const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
});

if (!result.canceled && result.assets[0]) {
    setSelectedImage(result.assets[0].uri);
}
```

**New code:**
```typescript
const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false, // Can't edit multiple images
    allowsMultipleSelection: true, // Enable multiple selection
    quality: 0.8,
    selectionLimit: 9, // Optional: limit to 9 images
});

if (!result.canceled && result.assets) {
    const uris = result.assets.map(asset => asset.uri);
    setSelectedImages(uris);
}
```

### Step 5: Upload Logic Updates

Update `sendMessage` function to handle multiple images:

**Current logic (single image):**
```typescript
if (selectedImage) {
    const uploadResult = await uploadImage(selectedImage);
    if (uploadResult) {
        imageUrl = uploadResult.fileUrl;
        imageFileId = uploadResult.fileId;
    }
}
```

**New logic (multiple images):**
```typescript
let imageUrls: string[] = [];
let imageFileIds: string[] = [];

if (selectedImages.length > 0) {
    setIsUploading(true);
    setUploadStatus('Uploading images...');
    
    // Upload all images in parallel
    const uploadPromises = selectedImages.map(imageUri => uploadImage(imageUri));
    const uploadResults = await Promise.all(uploadPromises);
    
    // Filter out failed uploads and collect URLs/IDs
    uploadResults.forEach((result, index) => {
        if (result) {
            imageUrls.push(result.fileUrl);
            imageFileIds.push(result.fileId);
        } else {
            console.warn(`Failed to upload image ${index + 1}`);
        }
    });
    
    // Only proceed if at least one image uploaded successfully
    if (imageUrls.length === 0) {
        Alert.alert('Upload Failed', 'Failed to upload images. Please try again.');
        setIsUploading(false);
        return;
    }
}
```

**Update message creation:**
```typescript
const messageData = {
    // ... other fields ...
    
    // Use arrays if multiple images, otherwise use single fields for backward compatibility
    ...(imageUrls.length > 0 ? {
        imageUrls: imageUrls,
        imageFileIds: imageFileIds,
    } : {}),
    
    // Keep single image fields for backward compatibility (if only one image)
    ...(imageUrls.length === 1 ? {
        imageUrl: imageUrls[0],
        imageFileId: imageFileIds[0],
    } : {}),
};
```

### Step 6: Display Logic Updates

Update the message rendering to show multiple images in a grid:

**Current display (single image):**
```typescript
{item.imageUrl && (
    <Image source={{ uri: item.imageUrl }} style={styles.messageImage} />
)}
```

**New display (multiple images with backward compatibility):**
```typescript
{/* Handle multiple images */}
{(item.imageUrls && item.imageUrls.length > 0) ? (
    <View style={styles.imageGrid}>
        {item.imageUrls.map((url, index) => (
            <TouchableOpacity
                key={index}
                onPress={() => {
                    setFullScreenImage(url);
                    setIsImageViewVisible(true);
                }}
                style={styles.gridImageContainer}
            >
                <Image
                    source={{ uri: url }}
                    style={styles.gridImage}
                    resizeMode="cover"
                />
                {item.imageUrls && item.imageUrls.length > 1 && (
                    <View style={styles.imageCountBadge}>
                        <Text style={styles.imageCountText}>
                            {index + 1}/{item.imageUrls.length}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        ))}
    </View>
) : (
    /* Backward compatibility: single image */
    item.imageUrl && (
        <TouchableOpacity onPress={() => {
            setFullScreenImage(item.imageUrl || null);
            setIsImageViewVisible(true);
        }}>
            <Image source={{ uri: item.imageUrl }} style={styles.messageImage} />
        </TouchableOpacity>
    )
)}
```

**Add styles:**
```typescript
const styles = StyleSheet.create({
    // ... existing styles ...
    
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginBottom: 8,
    },
    gridImageContainer: {
        width: '48%', // 2 columns
        aspectRatio: 1,
        position: 'relative',
    },
    gridImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    imageCountBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    imageCountText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
});
```

### Step 7: Preview UI Before Sending

Add a preview section above the message input to show selected images:

```typescript
{/* Image Preview Section */}
{selectedImages.length > 0 && (
    <View style={styles.imagePreviewContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedImages.map((uri, index) => (
                <View key={index} style={styles.previewImageWrapper}>
                    <Image source={{ uri }} style={styles.previewImage} />
                    <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => {
                            setSelectedImages(prev => prev.filter((_, i) => i !== index));
                        }}
                    >
                        <IconSymbol name="xmark.circle.fill" color="#fff" size={20} />
                    </TouchableOpacity>
                    <Text style={styles.imageNumber}>{index + 1}</Text>
                </View>
            ))}
        </ScrollView>
    </View>
)}
```

**Add preview styles:**
```typescript
imagePreviewContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.Secondary,
    borderTopWidth: 1,
    borderTopColor: Colors.Gray,
},
previewImageWrapper: {
    marginRight: 8,
    position: 'relative',
},
previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
},
removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.Background,
    borderRadius: 10,
},
imageNumber: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: '#fff',
    fontSize: 10,
    paddingHorizontal: 4,
    borderRadius: 4,
},
```

### Step 8: Update Send Button Logic

Update the send button disabled state:

**Change from:**
```typescript
disabled={(messageContent === '' && !selectedImage && !selectedVideo && !selectedFile && !selectedAudio) || isUploading}
```

**To:**
```typescript
disabled={(messageContent === '' && selectedImages.length === 0 && !selectedVideo && !selectedFile && !selectedAudio) || isUploading}
```

### Step 9: Clean Up After Sending

Update the cleanup logic:

**Change from:**
```typescript
setSelectedImage(null);
```

**To:**
```typescript
setSelectedImages([]);
```

### Step 10: Update Task Display

Update `job-tasks.tsx` to handle multiple images:

```typescript
{/* Task Attachments - Multiple Images */}
{item.imageUrls && item.imageUrls.length > 0 && item.content !== 'Message deleted by user' && (
    <View style={styles.taskImageGrid}>
        {item.imageUrls.map((url, index) => (
            <Image 
                key={index}
                source={{ uri: url }} 
                style={styles.taskImage}
                resizeMode="cover"
            />
        ))}
    </View>
)}
{/* Backward compatibility: single image */}
{item.imageUrl && !item.imageUrls && item.content !== 'Message deleted by user' && (
    <Image 
        source={{ uri: item.imageUrl }} 
        style={styles.taskImage}
        resizeMode="cover"
    />
)}
```

## Backward Compatibility

The implementation maintains backward compatibility:

1. **Old messages** with `imageUrl`/`imageFileId` will still display correctly
2. **New messages** can use `imageUrls`/`imageFileIds` arrays
3. **Single image uploads** can still populate both single and array fields for maximum compatibility

## Testing Checklist

- [ ] Database attributes added (`imageUrls` and `imageFileIds` as arrays)
- [ ] Can select multiple images from gallery
- [ ] Preview shows all selected images before sending
- [ ] Can remove individual images from preview
- [ ] Multiple images upload successfully
- [ ] Images display in grid layout in chat
- [ ] Can tap images to view fullscreen
- [ ] Old single-image messages still display correctly
- [ ] Task view shows multiple images correctly
- [ ] Image count badge appears when multiple images

## Performance Considerations

1. **Upload Strategy**: Using `Promise.all()` for parallel uploads is faster but uses more bandwidth. Consider sequential uploads if bandwidth is limited.

2. **Image Limits**: Consider limiting to 9 images max (3x3 grid) to prevent UI overflow.

3. **Image Size**: Consider compressing images before upload to reduce upload time and storage costs.

4. **Loading States**: Show progress for each image upload individually.

## Next Steps

After implementing:
1. Test thoroughly with various image counts (1, 2, 4, 9)
2. Test backward compatibility with old messages
3. Consider adding image compression
4. Consider adding swipe gestures for fullscreen view
5. Consider adding image reordering before sending

