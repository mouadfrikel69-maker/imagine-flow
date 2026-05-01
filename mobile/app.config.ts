/* eslint-disable @typescript-eslint/no-require-imports */
import type { ExpoConfig } from "expo/config";

/**
 * Expo dynamic config.
 *
 * Pulls Firebase + backend URL from EXPO_PUBLIC_* environment variables so the
 * same code can target dev / staging / production by swapping a .env file.
 *
 * Required env vars (see .env.example):
 *   EXPO_PUBLIC_FIREBASE_API_KEY
 *   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
 *   EXPO_PUBLIC_FIREBASE_PROJECT_ID
 *   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 *   EXPO_PUBLIC_FIREBASE_APP_ID
 *   EXPO_PUBLIC_FIREBASE_GOOGLE_WEB_CLIENT_ID
 *   EXPO_PUBLIC_API_URL                 — e.g. https://imagine-flow-api.onrender.com
 *
 * Optional:
 *   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
 *   EXPO_PUBLIC_FIREBASE_GOOGLE_ANDROID_CLIENT_ID
 *   EXPO_PUBLIC_FIREBASE_GOOGLE_IOS_CLIENT_ID
 */
const config: ExpoConfig = {
  name: "ImagineFlow",
  slug: "imagine-flow",
  version: "1.0.0",
  scheme: "imagineflow",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#08070d",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.imagineflow.app",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#08070d",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.imagineflow.app",
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
  },
  plugins: ["expo-router", "expo-secure-store", "expo-web-browser"],
  extra: {
    router: { origin: false },
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "",
    firebase: {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "",
      googleWebClientId: process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_WEB_CLIENT_ID,
      googleAndroidClientId: process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_ANDROID_CLIENT_ID,
      googleIosClientId: process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_IOS_CLIENT_ID,
    },
  },
};

export default config;
