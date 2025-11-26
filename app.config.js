const { config } = require('dotenv');

config();

const pkg = require('./package.json');

const version = process.env.APP_VERSION ?? pkg.version;

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
          data: [
            {
              scheme: 'https',
              host: 'web.workphotopro.com',
              pathPrefix: '/invite',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
        {
          action: 'VIEW',
          data: [
            {
              scheme: 'workphotopro',
              host: 'team-invite',
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
