# File Upload Implementation Plan

## Overview
Implement file upload functionality for the job chat, allowing users to upload documents and other files via the paperclip icon in the message input.

## Current State
- ✅ Paperclip icon exists in `[job].tsx` (line 1338)
- ✅ Attachment menu shows "Upload Document" option (line 1381-1399)
- ✅ Currently shows "Coming Soon" alert
- ✅ Image and video upload already implemented
- ✅ Message type supports `imageUrl`, `imageFileId`, `videoUrl`, `videoFileId`

## Required Changes

### 1. Install Dependencies
```bash
npx expo install expo-document-picker
```

### 2. Appwrite Bucket Configuration

#### MIME Types to Add
Add these allowed file types to your Appwrite Storage bucket:

**Documents:**
- `application/pdf` - PDF files
- `application/msword` - .doc files
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` - .docx files
- `text/plain` - .txt files
- `application/rtf` - .rtf files

**Spreadsheets:**
- `application/vnd.ms-excel` - .xls files
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` - .xlsx files

**Presentations:**
- `application/vnd.ms-powerpoint` - .ppt files
- `application/vnd.openxmlformats-officedocument.presentationml.presentation` - .pptx files

**Archives:**
- `application/zip` - .zip files
- `application/x-rar-compressed` - .rar files

**Optional (if you want to allow more):**
- `application/json` - JSON files
- `text/csv` - CSV files
- `application/xml` - XML files

#### File Size Limit
- **Appwrite Maximum**: 50MB per file (as configured in bucket)
- **Recommended Limit**: 10MB for documents (enforce client-side)
- **Reason**: Better UX, faster uploads, lower storage costs
- **Note**: Server accepts up to 50MB, but we'll validate 10MB client-side for documents

#### How to Configure in Appwrite Console
1. Go to **Storage** → Your bucket
2. Click **Settings**
3. Under **File Security**:
   - Add allowed file extensions: `pdf`, `doc`, `docx`, `txt`, `rtf`, `xls`, `xlsx`, `ppt`, `pptx`, `zip`, `rar`
   - Set maximum file size: `10485760` (10MB in bytes)
4. Save changes

### 3. Code Changes

#### A. Update Message Type (`utils/types.ts`)
Add file fields to Message interface:
```typescript
fileUrl?: string; // Optional file URL
fileFileId?: string; // Optional Appwrite file ID for deletion
fileName?: string; // Original filename
fileSize?: number; // File size in bytes
fileMimeType?: string; // MIME type
```

#### B. Update `[job].tsx`

**Add imports:**
```typescript
import * as DocumentPicker from 'expo-document-picker';
```

**Add state:**
```typescript
const [selectedFile, setSelectedFile] = React.useState<DocumentPicker.DocumentPickerAsset | null>(null);
```

**Implement file picker:**
```typescript
const pickDocument = async () => {
    setShowAttachmentMenu(false);
    setShowEmojiPicker(false);
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/rtf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/zip', 'application/x-rar-compressed'],
            copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets[0]) {
            const file = result.assets[0];
            
            // Check file size (10MB limit)
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
```

**Implement file upload:**
```typescript
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
```

**Update `handleUploadDocument`:**
```typescript
const handleUploadDocument = async () => {
    await pickDocument();
};
```

**Update `sendMessage` to handle files:**
- Add file upload logic similar to image/video upload
- Add file fields to message object
- Clear selectedFile after sending

**Update message rendering:**
- Display file icon and name
- Make file clickable to download/view
- Show file size

**Add file preview in input area:**
- Show selected file name and size
- Allow removing selected file

### 4. UI Updates

#### File Preview in Input Area
Add after video preview (around line 1286):
```tsx
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
                {(selectedFile.size! / 1024).toFixed(2)} KB
            </Text>
        </View>
        <Pressable
            onPress={() => setSelectedFile(null)}
            style={{
                padding: 4,
            }}
        >
            <IconSymbol name="xmark" color={Colors.Gray} size={20} />
        </Pressable>
    </View>
)}
```

#### File Message Display
Add in message rendering (around line 1112, after location message):
```tsx
{/* File Message */}
{item.fileFileId && item.content !== 'Message deleted by user' && (
    <TouchableOpacity 
        onPress={() => {
            // Open file URL
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
```

### 5. Database Schema Update

**YES - You need to add these attributes to the `messages` collection in Appwrite:**

Go to **Databases** → Your database → `messages` collection → **Attributes** → **Create Attribute**

Add these 5 attributes (all optional/not required):

1. **`fileUrl`** (String)
   - Size: 2048
   - Required: ❌ No
   - Array: ❌ No

2. **`fileFileId`** (String)
   - Size: 255
   - Required: ❌ No
   - Array: ❌ No

3. **`fileName`** (String)
   - Size: 512
   - Required: ❌ No
   - Array: ❌ No

4. **`fileSize`** (Integer)
   - Min: 0
   - Max: 52428800 (50MB in bytes)
   - Required: ❌ No
   - Array: ❌ No

5. **`fileMimeType`** (String)
   - Size: 100
   - Required: ❌ No
   - Array: ❌ No

**Why?** While Appwrite may accept undefined fields, defining attributes ensures:
- Proper validation
- Type safety
- Better error messages
- Consistent data structure

### 6. Testing Checklist

- [ ] Install expo-document-picker
- [ ] Configure Appwrite bucket with MIME types and size limit
- [ ] Test file picker opens correctly
- [ ] Test file size validation (try >10MB file)
- [ ] Test file upload (PDF, DOCX, TXT)
- [ ] Test file appears in chat
- [ ] Test file download/view works
- [ ] Test file deletion (when message is deleted)
- [ ] Test file preview in input area
- [ ] Test removing selected file before sending

## Implementation Order

1. **Install dependency** (expo-document-picker)
2. **Configure Appwrite bucket** (MIME types + size limit)
3. **Update types** (add file fields to Message)
4. **Implement file picker** (pickDocument function)
5. **Implement file upload** (uploadFile function)
6. **Update sendMessage** (handle file upload)
7. **Add file preview UI** (in input area)
8. **Add file message display** (in chat)
9. **Test thoroughly**

## Notes

- File size validation happens client-side for better UX
- Appwrite will also validate on server-side
- Files are stored in the same bucket as images/videos
- File URLs use the same pattern as images/videos
- Consider adding file type icons based on MIME type in the future
- Consider adding progress indicator for large file uploads

