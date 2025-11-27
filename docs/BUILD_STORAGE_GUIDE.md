# 📦 Where to Store Build Artifacts

## ❌ **DO NOT Commit Builds to Git**

**Never commit build artifacts (`.aab`, `.apk` files) to your git repository.**

### Why Not?

1. **Large file sizes** - Build artifacts are binary files that can be 50-200MB+
2. **Repository bloat** - Makes your repo slow and hard to clone
3. **Regenerable** - Builds can always be regenerated from source code
4. **Frequent changes** - Every build creates a new file
5. **Platform-specific** - Different builds for different platforms/versions
6. **EAS stores them** - EAS Build keeps your builds in the cloud

---

## ✅ **Where to Store Builds**

### Option 1: EAS Cloud Storage (Recommended) ⭐

**Best option for EAS builds** - EAS automatically stores all your builds:

- ✅ **Automatic** - No manual storage needed
- ✅ **Accessible** - Download anytime from EAS dashboard
- ✅ **Organized** - Keeps build history with metadata
- ✅ **Secure** - Protected by EAS authentication
- ✅ **Free** - Included with EAS Build

**How to access:**
1. Go to [expo.dev](https://expo.dev)
2. Navigate to your project
3. Click "Builds" tab
4. Download any build you need

**Download command:**
```bash
eas build:list  # List all builds
eas build:download  # Download latest build
eas build:download --id <build-id>  # Download specific build
```

---

### Option 2: Local Downloads Folder (For Manual Storage)

If you need to keep builds locally for testing or distribution:

**Recommended location:**
```
~/Downloads/workphotopro-builds/  # Outside your repo
# or
C:\Users\<YourName>\Downloads\workphotopro-builds\  # Windows
```

**Create a folder structure:**
```
workphotopro-builds/
├── android/
│   ├── production/
│   │   ├── app-production-2024-01-15.aab
│   │   └── app-production-2024-01-20.aab
│   └── preview/
│       └── app-preview-2024-01-15.apk
└── ios/
    └── production/
        └── app-production-2024-01-15.ipa
```

**Why outside the repo?**
- Keeps your repo clean
- Easy to find in Downloads
- Can be backed up separately
- Won't accidentally get committed

---

### Option 3: Cloud Storage (For Team Sharing)

For sharing builds with team members or testers:

- **Google Drive** / **Dropbox** / **OneDrive**
- **Firebase App Distribution**
- **TestFlight** (for iOS)
- **Google Play Internal Testing** (for Android)

---

## 🔒 **Update .gitignore**

Make sure your `.gitignore` includes build artifacts:

```gitignore
# Build artifacts (do not commit - EAS stores builds in cloud)
*.aab
*.apk
*.apks
builds/
```

**Your current `.gitignore` already ignores:**
- ✅ `*.jks` (keystore files)
- ✅ `dist/` and `web-build/`
- ✅ `android/` and `ios/` folders

**You should add:**
- `*.aab` (Android App Bundle)
- `*.apk` (Android Package)
- `builds/` (if you create a builds folder)

---

## 📋 **Best Practices**

### ✅ DO:

1. **Download builds from EAS** when needed
2. **Store locally** in Downloads folder (outside repo) if needed
3. **Use EAS build history** to track all builds
4. **Tag releases in git** (not the build files themselves)
5. **Document build versions** in release notes

### ❌ DON'T:

1. ❌ Commit `.aab` or `.apk` files to git
2. ❌ Store builds in your project directory
3. ❌ Share builds via git (use cloud storage instead)
4. ❌ Keep old builds forever (clean up periodically)

---

## 🏷️ **Git Tagging Strategy**

Instead of committing builds, tag your releases:

```bash
# After a successful build and release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

This way:
- ✅ Git history shows when releases happened
- ✅ You can checkout specific release versions
- ✅ No binary files in git
- ✅ Builds are stored in EAS (linked to commit)

---

## 🔍 **How to Check if Builds are Ignored**

```bash
# Check if a file would be ignored
git check-ignore -v app-release.aab

# List all ignored files (if any got committed)
git ls-files --ignored --exclude-standard
```

---

## 📚 **EAS Build Management**

### List all builds:
```bash
eas build:list --platform android
eas build:list --platform ios
```

### Download specific build:
```bash
eas build:download --id <build-id>
```

### View build details:
```bash
eas build:view <build-id>
```

### Delete old builds (from EAS dashboard):
- Go to expo.dev → Your Project → Builds
- Click on a build → Delete

---

## 💡 **Summary**

| Storage Method | When to Use | Pros |
|---------------|-------------|------|
| **EAS Cloud** | Always (default) | Automatic, organized, free |
| **Local Downloads** | Testing, manual distribution | Quick access, offline |
| **Cloud Storage** | Team sharing | Easy sharing, version control |
| **Git Repository** | ❌ Never | Don't do this! |

**Remember**: Builds are artifacts, not source code. Keep them out of git, and use EAS cloud storage as your primary build archive.

