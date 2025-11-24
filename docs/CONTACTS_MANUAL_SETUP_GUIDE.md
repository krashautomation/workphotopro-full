# Contacts Collections - Manual Setup Guide

This guide provides **exact step-by-step instructions** for creating the three database collections in Appwrite Console with all field specifications.

---

## Collection 1: `user_contacts`

### Step 1: Create Collection
1. Go to **Appwrite Console** → **Databases** → Your Database
2. Click **"Create Collection"**
3. **Collection ID:** `user_contacts`
4. **Name:** `User Contacts`
5. Click **"Create"**

### Step 2: Add Attributes

#### Attribute 1: `userId`
- **Key:** `userId`
- **Type:** `String`
- **Size:** `36` (Appwrite User IDs are 36 characters)
- **Required:** ✅ Yes
- **Array:** ❌ No
- **Default:** (leave empty)

#### Attribute 2: `phoneHash`
- **Key:** `phoneHash`
- **Type:** `String`
- **Size:** `64` (SHA-256 produces 64-character hex strings)
- **Required:** ❌ No (optional - contact may only have email)
- **Array:** ❌ No
- **Default:** (leave empty)

#### Attribute 3: `emailHash`
- **Key:** `emailHash`
- **Type:** `String`
- **Size:** `64` (SHA-256 produces 64-character hex strings)
- **Required:** ❌ No (optional - contact may only have phone)
- **Array:** ❌ No
- **Default:** (leave empty)

#### Attribute 4: `contactHash`
- **Key:** `contactHash`
- **Type:** `String`
- **Size:** `64` (SHA-256 produces 64-character hex strings)
- **Required:** ✅ Yes
- **Array:** ❌ No
- **Default:** (leave empty)

#### Attribute 5: `contactType`
- **Key:** `contactType`
- **Type:** `String`
- **Size:** `20` (values: "phone" or "email")
- **Required:** ✅ Yes
- **Array:** ❌ No
- **Default:** (leave empty)

#### Attribute 6: `syncedAt`
- **Key:** `syncedAt`
- **Type:** `DateTime`
- **Required:** ✅ Yes
- **Array:** ❌ No
- **Default:** (leave empty)

#### Attribute 7: `isActive`
- **Key:** `isActive`
- **Type:** `Boolean`
- **Required:** ✅ Yes
- **Array:** ❌ No
- **Default:** `true`

### Step 3: Create Indexes

#### Index 1: `userId`
- **Key:** `userId`
- **Type:** `key`
- **Attributes:** `userId`

#### Index 2: `contactHash`
- **Key:** `contactHash`
- **Type:** `key`
- **Attributes:** `contactHash`

#### Index 3: `userId_contactHash` (Unique)
- **Key:** `userId_contactHash`
- **Type:** `unique`
- **Attributes:** `userId`, `contactHash`

### Step 4: Set Permissions

**Create Permission:**
- **Role:** `users`
- **Permission:** `create`

**Read Permission:**
- **Role:** `users`
- **Permission:** `read`

**Update Permission:**
- **Role:** `users`
- **Permission:** `update`

**Delete Permission:**
- **Role:** `users`
- **Permission:** `delete`

---

## Collection 2: `contact_matches`

### Step 1: Create Collection
1. Go to **Appwrite Console** → **Databases** → Your Database
2. Click **"Create Collection"**
3. **Collection ID:** `contact_matches`
4. **Name:** `Contact Matches`
5. Click **"Create"**

### Step 2: Add Attributes

#### Attribute 1: `userId`
- **Key:** `userId`
- **Type:** `String`
- **Size:** `36`
- **Required:** ✅ Yes
- **Array:** ❌ No
- **Default:** (leave empty)

#### Attribute 2: `matchedUserId`
- **Key:** `matchedUserId`
- **Type:** `String`
- **Size:** `36`
- **Required:** ✅ Yes
- **Array:** ❌ No
- **Default:** (leave empty)

#### Attribute 3: `contactHash`
- **Key:** `contactHash`
- **Type:** `String`
- **Size:** `64`
- **Required:** ✅ Yes
- **Array:** ❌ No
- **Default:** (leave empty)

#### Attribute 4: `matchType`
- **Key:** `matchType`
- **Type:** `String`
- **Size:** `20` (values: "phone", "email", or "both")
- **Required:** ✅ Yes
- **Array:** ❌ No
- **Default:** (leave empty)

#### Attribute 5: `matchedAt`
- **Key:** `matchedAt`
- **Type:** `DateTime`
- **Required:** ✅ Yes
- **Array:** ❌ No
- **Default:** (leave empty)

#### Attribute 6: `isActive`
- **Key:** `isActive`
- **Type:** `Boolean`
- **Required:** ✅ Yes
- **Array:** ❌ No
- **Default:** `true`

### Step 3: Create Indexes

#### Index 1: `userId`
- **Key:** `userId`
- **Type:** `key`
- **Attributes:** `userId`

#### Index 2: `matchedUserId`
- **Key:** `matchedUserId`
- **Type:** `key`
- **Attributes:** `matchedUserId`

#### Index 3: `contactHash`
- **Key:** `contactHash`
- **Type:** `key`
- **Attributes:** `contactHash`

#### Index 4: `userId_matchedUserId`
- **Key:** `userId_matchedUserId`
- **Type:** `key`
- **Attributes:** `userId`, `matchedUserId`

### Step 4: Set Permissions

**Create Permission:**
- **Role:** `users`
- **Permission:** `create`

**Read Permission:**
- **Role:** `users`
- **Permission:** `read`

**Update Permission:**
- **Role:** `users`
- **Permission:** `update`

**Delete Permission:**
- **Role:** `users`
- **Permission:** `delete`

---

## Collection 3: `user_contact_sync`

### Step 1: Create Collection
1. Go to **Appwrite Console** → **Databases** → Your Database
2. Click **"Create Collection"**
3. **Collection ID:** `user_contact_sync`
4. **Name:** `User Contact Sync`
5. Click **"Create"**

### Step 2: Add Attributes

#### Attribute 1: `userId`
- **Key:** `userId`
- **Type:** `String`
- **Size:** `36`
- **Required:** ✅ Yes
- **Array:** ❌ No
- **Default:** (leave empty)

#### Attribute 2: `lastSyncedAt`
- **Key:** `lastSyncedAt`
- **Type:** `DateTime`
- **Required:** ❌ No (optional - null until first sync)
- **Array:** ❌ No
- **Default:** (leave empty)

#### Attribute 3: `contactsCount`
- **Key:** `contactsCount`
- **Type:** `Integer`
- **Required:** ✅ Yes
- **Array:** ❌ No
- **Default:** `0`

#### Attribute 4: `matchesCount`
- **Key:** `matchesCount`
- **Type:** `Integer`
- **Required:** ✅ Yes
- **Array:** ❌ No
- **Default:** `0`

#### Attribute 5: `syncStatus`
- **Key:** `syncStatus`
- **Type:** `String`
- **Size:** `20` (values: "pending", "syncing", "completed", "failed")
- **Required:** ✅ Yes
- **Array:** ❌ No
- **Default:** `pending`

#### Attribute 6: `syncVersion`
- **Key:** `syncVersion`
- **Type:** `Integer`
- **Required:** ✅ Yes
- **Array:** ❌ No
- **Default:** `1`

### Step 3: Create Indexes

#### Index 1: `userId` (Unique)
- **Key:** `userId`
- **Type:** `unique`
- **Attributes:** `userId`

**Note:** This ensures only one sync record per user.

### Step 4: Set Permissions

**Create Permission:**
- **Role:** `users`
- **Permission:** `create`

**Read Permission:**
- **Role:** `users`
- **Permission:** `read`

**Update Permission:**
- **Role:** `users`
- **Permission:** `update`

**Delete Permission:**
- **Role:** `users`
- **Permission:** `delete`

---

## Quick Reference Table

### Field Type Summary

| Field Name | Type | Size | Required | Default |
|------------|------|------|----------|---------|
| **user_contacts** |
| `userId` | String | 36 | ✅ Yes | - |
| `phoneHash` | String | 64 | ❌ No | - |
| `emailHash` | String | 64 | ❌ No | - |
| `contactHash` | String | 64 | ✅ Yes | - |
| `contactType` | String | 20 | ✅ Yes | - |
| `syncedAt` | DateTime | - | ✅ Yes | - |
| `isActive` | Boolean | - | ✅ Yes | `true` |
| **contact_matches** |
| `userId` | String | 36 | ✅ Yes | - |
| `matchedUserId` | String | 36 | ✅ Yes | - |
| `contactHash` | String | 64 | ✅ Yes | - |
| `matchType` | String | 20 | ✅ Yes | - |
| `matchedAt` | DateTime | - | ✅ Yes | - |
| `isActive` | Boolean | - | ✅ Yes | `true` |
| **user_contact_sync** |
| `userId` | String | 36 | ✅ Yes | - |
| `lastSyncedAt` | DateTime | - | ❌ No | - |
| `contactsCount` | Integer | - | ✅ Yes | `0` |
| `matchesCount` | Integer | - | ✅ Yes | `0` |
| `syncStatus` | String | 20 | ✅ Yes | `pending` |
| `syncVersion` | Integer | - | ✅ Yes | `1` |

---

## Important Notes

### String Size Guidelines
- **36 characters:** Appwrite User IDs
- **64 characters:** SHA-256 hash (hex format)
- **20 characters:** Status/enum fields (plenty of room for values)

### Default Values
- **Boolean fields:** Set default to `true` for `isActive` flags
- **Integer fields:** Set default to `0` for counts, `1` for version
- **String fields:** Set default to `pending` for status fields

### Index Strategy
- **Single field indexes:** Use `key` type for frequently queried fields
- **Unique indexes:** Use `unique` type to prevent duplicates (e.g., `userId_contactHash`)
- **Composite indexes:** Use for queries that filter by multiple fields

### Permissions
- All collections use `users` role (any authenticated user)
- Users can only access their own data (enforced by queries filtering by `userId`)

---

## Verification Checklist

After creating each collection, verify:

- [ ] All attributes are created with correct types and sizes
- [ ] Required fields are marked as required
- [ ] Default values are set where specified
- [ ] All indexes are created
- [ ] Permissions are set correctly
- [ ] Collection ID matches exactly (case-sensitive)

---

## Troubleshooting

### "Attribute size too small"
- SHA-256 hashes are always 64 characters (hex)
- Appwrite User IDs are always 36 characters
- If you get size errors, double-check these values

### "Index creation failed"
- Ensure the attribute exists before creating index
- Unique indexes require the attribute to be required
- Composite indexes require all attributes to exist

### "Permission denied"
- Ensure `users` role is selected (not `any` or `guests`)
- Verify you're logged in as an authenticated user when testing

---

## Next Steps

After creating all three collections:

1. ✅ Verify all collections are created correctly
2. ✅ Test creating a document in each collection
3. ✅ Test queries with indexes
4. ✅ Proceed with implementing contact syncing in your app

