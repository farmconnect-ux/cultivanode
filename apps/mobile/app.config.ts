// brand.ts has no imports, so Expo's config loader can read it directly.
import { brand } from '@cultivanode/shared/brand';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ExpoConfig } from 'expo/config';

// Icon and splash PNGs are generated from the SVGs in assets/ by `npm run icons`
// (CI does this before every Android build). Until they exist locally, Expo's defaults are used.
const generated = (file: string) => {
  const path = `./assets/generated/${file}`;
  return existsSync(join(__dirname, path)) ? path : undefined;
};

const markBackground = brand.logo.background;

const config: ExpoConfig = {
  name: brand.name,
  slug: 'cultivanode', // app IDs change only at a real rename (store listing identity)
  scheme: 'cultivanode',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  icon: generated('icon.png'),
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.cultivanode.app',
  },
  android: {
    package: 'com.cultivanode.app',
    // Bump by 1 for every build uploaded to the Play Store / CI release.
    versionCode: process.env.ANDROID_VERSION_CODE ? parseInt(process.env.ANDROID_VERSION_CODE, 10) : 1,
    predictiveBackGestureEnabled: false,
    adaptiveIcon: generated('adaptive-foreground.png')
      ? { foregroundImage: generated('adaptive-foreground.png'), backgroundColor: markBackground }
      : undefined,
  },
  plugins: [
    'expo-router',
    // Keeps keystore entries out of Android cloud backups (a restored phone signs in again).
    ['expo-secure-store', { configureAndroidBackup: true, faceIDPermission: false }],
    // Source-map upload only when a Sentry project is configured for the build (EAS secrets).
    ...(process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
      ? [['@sentry/react-native/expo', { organization: process.env.SENTRY_ORG, project: process.env.SENTRY_PROJECT }] as [string, object]]
      : []),
    [
      'expo-splash-screen',
      {
        image: generated('splash-icon.png'),
        imageWidth: 160,
        resizeMode: 'contain',
        backgroundColor: markBackground,
      },
    ],
  ],
};

export default config;
