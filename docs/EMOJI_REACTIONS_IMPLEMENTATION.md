# 🎭 Emoji Reactions Implementation Guide

## Overview
This guide explains how to implement emoji reactions in the chat screen ([job].tsx).

## 📋 Implementation Options

### ✅ **Recommended: Separate Collection (Implemented)**
**What I've added:**
1. Types in `utils/types.ts`:
   - `MessageReaction` - Individual reaction record
   - `ReactionCount` - Aggregated reaction data for UI

2. Service in `lib/appwrite/database.ts`:
   - `reactionService.addReaction()` - Add/toggle reaction
   - `reactionService.removeReaction()` - Remove specific reaction
   - `reactionService.getMessageReactions()` - Get all reactions for a message
   - `reactionService.getReactionCounts()` - Get aggregated counts per emoji

## 🔧 Next Steps to Complete Implementation

### 1. Create `message_reactions` Collection in Appwrite

Go to your Appwrite Console → Databases → Create Collection

**Collection ID:** `message_reactions`

**Attributes:**
```
- messageId: String (required, 100 chars, indexed)
- userId: String (required, 100 chars, indexed)
- userName: String (required, 100 chars)
- emoji: String (required, 10 chars, indexed)
- teamId: String (required, 100 chars, indexed)
- orgId: String (required, 100 chars, indexed)
```

**Indexes:**
- Create index: `messageId` (database)
- Create index: `userId` (database)
- Create index: `emoji` (database)
- Create composite index: `messageId` + `userId` + `emoji` (unique)

**Permissions:**
- Create: Any authenticated user
- Read: Any authenticated user
- Update: None (reactions are immutable)
- Delete: Owner of the reaction OR team admin

### 2. Add Reaction UI to Messages

In `app/(jobs)/[job].tsx`, add:

```tsx
const [messageReactions, setMessageReactions] = React.useState<{[key: string]: ReactionCount[]}>({});

// Load reactions for all messages
const loadReactions = async () => {
  const reactions: {[key: string]: ReactionCount[]} = {};
  
  for (const message of messages) {
    const counts = await reactionService.getReactionCounts(message.$id, user?.$id);
    if (counts.length > 0) {
      reactions[message.$id] = counts;
    }
  }
  
  setMessageReactions(reactions);
};

// Add reaction handler
const handleAddReaction = async (messageId: string, emoji: string) => {
  if (!currentTeam?.$id || !currentOrganization?.$id || !user?.$id || !user?.name) {
    return;
  }
  
  try {
    await reactionService.addReaction(
      messageId,
      emoji,
      user.$id,
      user.name,
      currentTeam.$id,
      currentOrganization.$id
    );
    
    // Reload reactions for this message
    const counts = await reactionService.getReactionCounts(messageId, user.$id);
    setMessageReactions(prev => ({ ...prev, [messageId]: counts }));
  } catch (error) {
    console.error('Failed to add reaction:', error);
  }
};

// Add to your message render
const renderReactions = (item: Message) => {
  const reactions = messageReactions[item.$id] || [];
  
  if (reactions.length === 0) return null;
  
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
      {reactions.map((reaction, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => handleAddReaction(item.$id, reaction.emoji)}
          style={{
            backgroundColor: reaction.userReacted ? Colors.Primary : Colors.Secondary,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: reaction.userReacted ? Colors.Primary : Colors.Gray,
          }}
        >
          <Text style={{ fontSize: 14 }}>
            {reaction.emoji} {reaction.count}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Add this in your message Pressable, before the closing tag:
{renderReactions(item)}
```

### 3. Add Quick Reaction Button

Add a quick emoji picker:

```tsx
const [showEmojiPicker, setShowEmojiPicker] = React.useState<string | null>(null);
const quickEmojis = ['👍', '❤️', '😂', '😮', '👎', '🔥'];

// Add this button in your message rendering
{isSender && (
  <Pressable
    onPress={() => setShowEmojiPicker(item.$id)}
    style={{ marginLeft: 8 }}
  >
    <IconSymbol name="face.smiling" size={16} color={Colors.Gray} />
  </Pressable>
)}

// Emoji picker modal
{showEmojiPicker === item.$id && (
  <BottomModal
    visible={true}
    onClose={() => setShowEmojiPicker(null)}
    content={
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 20 }}>
        {quickEmojis.map((emoji) => (
          <TouchableOpacity
            key={emoji}
            onPress={() => {
              handleAddReaction(item.$id, emoji);
              setShowEmojiPicker(null);
            }}
            style={{
              padding: 12,
              backgroundColor: Colors.Secondary,
              borderRadius: 12,
            }}
          >
            <Text style={{ fontSize: 24 }}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    }
  />
)}
```

## 🎨 Alternative: Simpler Embedding Approach

If you want something **much simpler** without a separate collection:

### Add to Message type:
```typescript
// In utils/types.ts
export interface Message {
  // ... existing fields
  reactions?: { [emoji: string]: number }; // Count of each emoji
  userReactions?: string[]; // Emojis the current user has reacted with
}
```

### In the UI:
```tsx
// When rendering messages
{item.reactions && Object.entries(item.reactions).map(([emoji, count]) => (
  <TouchableOpacity
    key={emoji}
    onPress={() => handleAddReaction(item.$id, emoji)}
    style={{
      backgroundColor: item.userReactions?.includes(emoji) ? Colors.Primary : Colors.Secondary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    }}
  >
    <Text>{emoji} {count}</Text>
  </TouchableOpacity>
))}
```

### Handle adding reactions:
```tsx
const handleAddReaction = async (messageId: string, emoji: string) => {
  try {
    const message = messages.find(m => m.$id === messageId);
    if (!message) return;
    
    const currentCount = message.reactions?.[emoji] || 0;
    const hasReacted = message.userReactions?.includes(emoji) || false;
    
    // Toggle reaction
    const newCount = hasReacted ? currentCount - 1 : currentCount + 1;
    const newUserReactions = hasReacted
      ? message.userReactions?.filter(e => e !== emoji) || []
      : [...(message.userReactions || []), emoji];
    
    // Update message
    const newReactions = { ...message.reactions };
    if (newCount === 0) {
      delete newReactions[emoji];
    } else {
      newReactions[emoji] = newCount;
    }
    
    await db.updateDocument(
      appwriteConfig.db,
      appwriteConfig.col.messages,
      messageId,
      { reactions: newReactions, userReactions: newUserReactions }
    );
    
    // Refresh messages
    await getMessages();
  } catch (error) {
    console.error('Failed to add reaction:', error);
  }
};
```

**Pros:**
- Simpler implementation
- No separate collection needed
- Faster queries (all data on message)

**Cons:**
- Can't see WHO reacted (only count)
- Appwrite document size limit (max ~4MB)
- Won't scale well with many reactions

## 📊 Recommended Approach

**For MVP/Testing:** Use the simplified embedding approach above.

**For Production:** Use the separate collection approach I've already implemented.

## 🔗 Quick Links

- Database service: `lib/appwrite/database.ts`
- Types: `utils/types.ts`
- Chat screen: `app/(jobs)/[job].tsx`
- Appwrite Console: https://cloud.appwrite.io

## 🚀 Getting Started

1. Choose your approach (separate collection recommended)
2. Create the collection in Appwrite (if using separate collection)
3. Add the UI code to your message rendering
4. Test with multiple users to verify real-time updates

