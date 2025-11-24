# Contacts Database Schema - Privacy-Focused Design

This document outlines the database collections needed for implementing a contact list feature with privacy-first design using SHA-256 hashing.

## Overview

The contacts system uses **hashed identifiers** (SHA-256) to match contacts with app users without exposing actual phone numbers or emails. This follows industry best practices for privacy.

## Collections Required

### 1. `user_contacts` Collection

Stores hashed contact identifiers for each user.

**Collection ID:** `user_contacts`

**Attributes:**
- `userId` (String, 36 chars, required) - Appwrite User ID who owns these contacts
- `phoneHash` (String, 64 chars, optional) - SHA-256 hash of normalized phone number
- `emailHash` (String, 64 chars, optional) - SHA-256 hash of normalized email (lowercase)
- `contactHash` (String, 64 chars, required) - Combined hash identifier (phoneHash or emailHash)
- `contactType` (String, 20 chars, required) - Either "phone" or "email"
- `syncedAt` (DateTime, required) - When contact was synced
- `isActive` (Boolean, default: true) - Soft delete flag

**Permissions:**
- Create: `users` (users can only create their own contacts)
- Read: `users` (users can only read their own contacts)
- Update: `users` (users can only update their own contacts)
- Delete: `users` (users can only delete their own contacts)

**Indexes:**
- `userId` (key: `userId`, type: `key`, attributes: `userId`)
- `contactHash` (key: `contactHash`, type: `key`, attributes: `contactHash`)
- `userId_contactHash` (key: `userId_contactHash`, type: `unique`, attributes: `userId`, `contactHash`) - Prevents duplicates

**Notes:**
- At least one of `phoneHash` or `emailHash` must be present
- `contactHash` is the primary identifier used for matching
- Normalize phone numbers (remove spaces, dashes, country code prefix) before hashing
- Normalize emails (lowercase, trim) before hashing

---

### 2. `contact_matches` Collection

Stores matches between user contacts and app users.

**Collection ID:** `contact_matches`

**Attributes:**
- `userId` (String, 36 chars, required) - User who owns the contact
- `matchedUserId` (String, 36 chars, required) - Appwrite User ID of matched user
- `contactHash` (String, 64 chars, required) - Hash that matched
- `matchType` (String, 20 chars, required) - "phone", "email", or "both"
- `matchedAt` (DateTime, required) - When match was discovered
- `isActive` (Boolean, default: true) - Soft delete flag

**Permissions:**
- Create: `users` (users can create matches for their contacts)
- Read: `users` (users can read their own matches)
- Update: `users` (users can update their own matches)
- Delete: `users` (users can delete their own matches)

**Indexes:**
- `userId` (key: `userId`, type: `key`, attributes: `userId`)
- `matchedUserId` (key: `matchedUserId`, type: `key`, attributes: `matchedUserId`)
- `contactHash` (key: `contactHash`, type: `key`, attributes: `contactHash`)
- `userId_matchedUserId` (key: `userId_matchedUserId`, type: `key`, attributes: `userId`, `matchedUserId`) - For finding mutual matches

**Notes:**
- This collection is populated by matching hashed contacts with user emails/phones
- Used to generate "People You May Know" lists
- Can be refreshed periodically as new users join

---

### 3. `user_contact_sync` Collection (Optional but Recommended)

Tracks sync status and metadata for each user's contact list.

**Collection ID:** `user_contact_sync`

**Attributes:**
- `userId` (String, 36 chars, required, unique) - Appwrite User ID
- `lastSyncedAt` (DateTime, optional) - Last successful sync timestamp
- `contactsCount` (Integer, default: 0) - Number of contacts synced
- `matchesCount` (Integer, default: 0) - Number of matches found
- `syncStatus` (String, 20 chars, default: "pending") - "pending", "syncing", "completed", "failed"
- `syncVersion` (Integer, default: 1) - Increment on each sync to detect changes

**Permissions:**
- Create: `users` (users create their own sync record)
- Read: `users` (users can only read their own sync record)
- Update: `users` (users can only update their own sync record)
- Delete: `users` (users can only delete their own sync record)

**Indexes:**
- `userId` (key: `userId`, type: `unique`, attributes: `userId`)

**Notes:**
- One record per user
- Helps track sync progress and prevent duplicate syncs
- Can be used to show "Last synced X days ago" in UI

---

## Hashing Strategy

### Phone Number Hashing
```typescript
// Normalize: Remove spaces, dashes, parentheses, country code prefix
// Example: "+1 (555) 123-4567" → "15551234567"
// Then hash with SHA-256
const normalized = phone.replace(/\D/g, ''); // Remove non-digits
const hash = sha256(normalized);
```

### Email Hashing
```typescript
// Normalize: Lowercase and trim
// Example: "John.Doe@Example.COM" → "john.doe@example.com"
// Then hash with SHA-256
const normalized = email.toLowerCase().trim();
const hash = sha256(normalized);
```

### Combined Hash
- If contact has phone: use `phoneHash` as `contactHash`
- If contact has email: use `emailHash` as `contactHash`
- If contact has both: prefer `phoneHash` (more unique), fallback to `emailHash`

---

## Matching Algorithm

1. **User syncs contacts:**
   - Hash all phone numbers and emails
   - Store in `user_contacts` collection

2. **Match discovery:**
   - Query all app users' emails/phones (already hashed in Appwrite)
   - Compare hashes with user's `contactHash` values
   - Create entries in `contact_matches` for matches

3. **"People You May Know":**
   - Query `contact_matches` for current user
   - Join with user profiles to show matched users
   - Sort by `matchedAt` (most recent first)

---

## Privacy Considerations

✅ **What we hash:**
- Phone numbers
- Email addresses

✅ **What we DON'T store:**
- Contact names (only used locally)
- Contact photos (only used locally)
- Raw phone numbers/emails

✅ **What we store:**
- Only SHA-256 hashes (one-way, cannot be reversed)
- User IDs (already in Appwrite)
- Match metadata (timestamps, match type)

---

## Implementation Steps

1. **Create collections** in Appwrite Console (use schema above)
2. **Create utility functions** for hashing contacts
3. **Create contact service** in `lib/appwrite/database.ts`
4. **Update contacts screen** to sync and display contacts
5. **Implement matching logic** (can be server-side function or client-side)

---

## Example Queries

### Get user's contacts
```typescript
Query.equal('userId', userId)
Query.equal('isActive', true)
```

### Find matches for user
```typescript
Query.equal('userId', userId)
Query.equal('isActive', true)
```

### Get "People You May Know"
```typescript
// Get matches
const matches = await listDocuments('contact_matches', [
  Query.equal('userId', currentUserId),
  Query.equal('isActive', true)
]);

// Get matched user IDs
const matchedUserIds = matches.documents.map(m => m.matchedUserId);

// Fetch user profiles (if you have a users collection)
const users = await listDocuments('users', [
  Query.equal('$id', matchedUserIds)
]);
```

---

## Next Steps

1. Create the three collections in Appwrite Console
2. Implement hashing utility functions
3. Create contact service methods
4. Update contacts screen to sync contacts
5. Implement matching algorithm
6. Display "People You May Know" section

