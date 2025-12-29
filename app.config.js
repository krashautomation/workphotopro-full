const { config } = require('dotenv');
const fs = require('fs');
const path = require('path');

config();

const pkg = require('./package.json');

const version = process.env.APP_VERSION ?? pkg.version;

// Check if google-services.json exists
const googleServicesPath = path.join(__dirname, 'google-services.json');
const hasGoogleServices = fs.existsSync(googleServicesPath);

module.exports = {
  expo: {
    name: 'WorkPhotoPro',
    slug: 'workphotopro-v2',
    version,
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'workphotopro',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#000000',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.workphotopro.app',
      associatedDomains: [
        'applinks:web.workphotopro.com',
        'applinks:workphotopro.app',
        'applinks:links.workphotopro.com',
      ],
      infoPlist: {
        NSPhotoLibraryAddUsageDescription:
          'WorkPhotoPro needs access to your photo library to save job site photos.',
        NSPhotoLibraryUsageDescription:
          'WorkPhotoPro needs access to your photo library to save job site photos.',
        NSContactsUsageDescription:
          'To find your friends faster, allow WorkPhotoPro to access your contacts in your device settings.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundColor: '#000000',
      },
      package: 'com.workphotopro.app',
      ...(hasGoogleServices && { googleServicesFile: './google-services.json' }),
      privacyPolicy: 'https://workphotopro.com/privacy',
      permissions: [
        'android.permission.READ_MEDIA_IMAGES',
        'android.permission.READ_MEDIA_AUDIO',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.RECORD_AUDIO',
        'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
        'android.permission.READ_MEDIA_VIDEO',
      ],
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: 'web.workphotopro.com',
              pathPrefix: '/invite',
            },
            {
              scheme: 'https',
              host: 'web.workphotopro.com',
              pathPrefix: '/links',
            },
            {
              scheme: 'https',
              host: 'web.workphotopro.com',
              pathPrefix: '/reset-password',
            },
            {
              scheme: 'workphotopro',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
        {
          action: 'VIEW',
          data: [
            {
              scheme: 'appwrite-callback-68e9d42100365e14f358',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-dev-client',
      'expo-asset',
      'expo-audio',
      'expo-video',
      'expo-secure-store',
      [
        'expo-notifications',
        {
          icon: './assets/images/icon.png',
          color: '#22c55e',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission:
            'Allow WorkPhotoPro to access your photos for job site documentation.',
        },
      ],
      [
        'expo-media-library',
        {
          photosPermission:
            'Allow WorkPhotoPro to save photos to your library.',
          savePhotosPermission:
            'Allow WorkPhotoPro to save photos to your library.',
          isAccessMediaLocationEnabled: false,
        },
      ],
      [
        'expo-contacts',
        {
          contactsPermission:
            'To find your friends faster, allow WorkPhotoPro to access your contacts in your device settings.',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: 'c27e77a1-19c8-4d7a-b2a7-0b8012878bfd',
      },
      appVersion: version,
    },
  },
};
