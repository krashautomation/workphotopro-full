# Create Katya User Script

This script creates Katya's user account in Appwrite.

## Prerequisites

1. **Create `.env` file** in the project root with:

```env
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://sfo.cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
APPWRITE_DROID_API_KEY=your_server_api_key_here
# OR use APPWRITE_API_KEY if you prefer
# APPWRITE_API_KEY=your_server_api_key_here
```

**Important**: 
- Use either `APPWRITE_DROID_API_KEY` or `APPWRITE_API_KEY` in your `.env` file
- Must be a **Server API Key** (not public key)
- Get it from: Appwrite Console → Settings → API Keys
- The API key name in Console (e.g., `APPWRITE_DROID_API_KEY`) is just a label
- Required scopes: 
  - **Auth**: `users.write`, `sessions.write` (to create user and session)
  - **Database**: `rows.read`, `rows.write`, `tables.read` (to read/write messages)
  - **Functions**: `execution.write` (to execute Cloud Function)

## Run the Script

From the project root:

```bash
node Droid/scripts/create-katya-user.js
```

Or from the scripts directory:

```bash
cd Droid/scripts
node create-katya-user.js
```

## Output

The script will:
1. Create Katya user account (`katya@workphotopro.ai`)
2. Generate a secure password
3. Display credentials (save these!)
4. Save credentials to `katya-credentials.json` (in project root)

**Save these credentials** - you'll need them for the Cloud Function environment variables:
- User ID
- Email
- Password

## Troubleshooting

**"Missing required environment variables"**
- Ensure `.env` file exists in project root
- Check variable names match exactly
- Verify `APPWRITE_API_KEY` is set (server key, not public)

**"User already exists"**
- Katya user was already created
- Delete user in Appwrite Console → Auth → Users if you need to recreate
- Or use existing user ID for Cloud Function

**Permission errors**
- Ensure `APPWRITE_API_KEY` has admin permissions
- Check API key scope includes "users" access

