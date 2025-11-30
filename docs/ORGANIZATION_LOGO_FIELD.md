# Organization Logo Field - Database Setup

## Overview

The `logoUrl` field has been added to the Organization interface to allow organizations to have a custom photo icon/logo. When no logo URL is provided, the system defaults to displaying a Building2 icon (from lucide-react-native).

## Database Field Requirement

### Field to Add to `organizations` Collection

**Field Name:** `logoUrl`

**Type:** String

**Size:** 500 characters (to accommodate URLs)

**Required:** No (optional field)

**Default:** null/empty (will show default Building2 icon)

## Setup Instructions

### Step 1: Add Field to Database

1. Go to **Appwrite Console** → **Databases** → Your Database → `organizations` collection
2. Click **"Add Attribute"**
3. Configure the field:
   - **Key:** `logoUrl`
   - **Type:** `String`
   - **Size:** `500`
   - **Required:** ❌ No (leave unchecked)
   - **Array:** ❌ No
   - **Default:** (leave empty)
4. Click **"Create"**

### Step 2: Verify Field Exists

After adding the field, verify it appears in your `organizations` collection attributes list.

## Usage

### In Code

The `logoUrl` field is now part of the `Organization` interface in `utils/types.ts`:

```typescript
export interface Organization {
  // ... other fields
  logoUrl?: string; // Organization logo/icon URL
  // ... other fields
}
```

### Display Logic

- **If `logoUrl` is provided:** The image from the URL is displayed
- **If `logoUrl` is empty/null:** The default Building2 icon is displayed

### Where It's Used

1. **Profile Settings** (`app/(jobs)/profile-settings.tsx`): Shows the logo in the "Your Organization" section
2. **User Profile** (`app/(jobs)/user-profile.tsx`): Shows the logo in the organization card
3. **Edit Organization** (`app/(jobs)/edit-organization.tsx`): Allows editing the logo URL

## Migration Notes

- **Existing organizations:** Will have `logoUrl` as `null`/`undefined` and will display the default Building2 icon
- **No data migration needed:** The field is optional, so existing organizations will continue to work without any changes

## Default Icon

The default icon used when no `logoUrl` is set is:
- **Icon:** `Building2` from `lucide-react-native`
- **Size:** 24px
- **Color:** Secondary text color
- **Stroke Width:** 2

