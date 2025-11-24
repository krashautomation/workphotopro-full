# Contacts Database Setup Verification

## ✅ Setup Complete!

Your database collections are correctly configured. Here's a verification checklist:

### Collection 1: `user_contacts` ✅
- [x] All 7 attributes created correctly
- [x] Required fields marked (userId, contactHash, contactType, syncedAt, isActive)
- [x] Optional fields marked (phoneHash, emailHash)
- [x] Default value set for `isActive` = `true`
- [x] All 3 indexes created (userId, contactHash, userId_contactHash unique)

### Collection 2: `contact_matches` ✅
- [x] All 6 attributes created correctly
- [x] All fields required (as expected)
- [x] Default value set for `isActive` = `true`
- [x] All 4 indexes created (userId, matchedUserId, contactHash, userId_matchedUserId)

### Collection 3: `user_contact_sync` ✅
- [x] All 6 attributes created correctly
- [x] Required fields marked correctly
- [x] Optional field marked (lastSyncedAt)
- [x] Default values set (contactsCount=0, matchesCount=0, syncStatus=pending, syncVersion=1)
- [x] Unique index on userId created

---

## Next Steps

### 1. Install Required Library
```bash
npx expo install expo-crypto
```

### 2. Rebuild Your App
Since `expo-crypto` is a native module:
```bash
# For iOS
npx expo run:ios

# For Android
npx expo run:android
```

### 3. Test Database Connection
Create a simple test to verify collections are accessible:

```typescript
// Test script (you can run this in your app)
import { contactService } from '@/lib/appwrite/contacts';
import { useAuth } from '@/context/AuthContext';

// In your contacts screen or a test component
const testDatabase = async () => {
  const { user } = useAuth();
  if (!user) return;

  try {
    // Test creating sync record
    const syncRecord = await contactService.getSyncRecord(user.$id);
    console.log('✅ Sync record:', syncRecord);
    
    // Test getting contacts (should be empty initially)
    const contacts = await contactService.getUserContacts(user.$id);
    console.log('✅ User contacts:', contacts);
    
    // Test getting matches (should be empty initially)
    const matches = await contactService.getPeopleYouMayKnow(user.$id);
    console.log('✅ Matches:', matches);
    
    console.log('✅ All database tests passed!');
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
};
```

### 4. Implement Contact Syncing
Update `app/(jobs)/contacts.tsx` to sync contacts after permission is granted.

### 5. Test End-to-End Flow
1. Navigate to contacts screen
2. Grant permission
3. Sync contacts
4. Verify contacts are stored in database
5. Test matching logic

---

## Common Issues & Solutions

### Issue: "Collection not found"
**Solution:** Double-check collection IDs are exactly:
- `user_contacts` (lowercase, underscore)
- `contact_matches` (lowercase, underscore)
- `user_contact_sync` (lowercase, underscore)

### Issue: "Permission denied"
**Solution:** Verify permissions are set to `users` role (not `any` or `guests`)

### Issue: "Index creation failed"
**Solution:** Ensure all attributes exist before creating indexes

### Issue: "Default value not working"
**Solution:** In Appwrite, defaults are applied when creating documents, not on read

---

## Verification Test

Run this in your app to verify everything works:

```typescript
import { databaseService } from '@/lib/appwrite/database';

const verifySetup = async () => {
  try {
    // Test user_contacts collection
    const contacts = await databaseService.listDocuments('user_contacts', []);
    console.log('✅ user_contacts accessible:', contacts.total, 'documents');
    
    // Test contact_matches collection
    const matches = await databaseService.listDocuments('contact_matches', []);
    console.log('✅ contact_matches accessible:', matches.total, 'documents');
    
    // Test user_contact_sync collection
    const syncs = await databaseService.listDocuments('user_contact_sync', []);
    console.log('✅ user_contact_sync accessible:', syncs.total, 'documents');
    
    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  }
};
```

---

## Ready to Proceed! 🚀

Your database is set up correctly. You can now:
1. Install `expo-crypto`
2. Rebuild your app
3. Start implementing contact syncing functionality

