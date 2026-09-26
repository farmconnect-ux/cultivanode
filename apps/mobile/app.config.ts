import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ExpoConfig } from 'expo/config';

// Icon and splash PNGs are generated from the SVGs in assets/ by `npm run icons`
// (CI does this before every Android build). Until they exist locally, Expo's defaults are used.
const generated = (file: string) => {
  const path = `./assets/generated/${file}`;
  return existsSync(join(__dirname, path)) ? path : undefined;
};

const leaf600 = '#236639'; // colors.leaf[600] in @tillmate/shared

const config: ExpoConfig = {
  name: 'Tillmate',
  slug: 'tillmate',
  scheme: 'tillmate',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  icon: generated('icon.png'),
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'ng.tillmate.app',
  },
  android: {
    package: 'ng.tillmate.app',
    // Bump by 1 for every build uploaded to the Play Store.
    versionCode: 1,
    predictiveBackGestureEnabled: false,
    adaptiveIcon: generated('adaptive-foreground.png')
      ? { foregroundImage: generated('adaptive-foreground.png'), backgroundColor: leaf600 }
      : undefined,
  },
  plugins: [
    [
      'expo-splash-screen',
      {
        image: generated('splash-icon.png'),
        imageWidth: 160,
        resizeMode: 'contain',
        backgroundColor: leaf600,
      },
    ],
  ],
};

export default config;
