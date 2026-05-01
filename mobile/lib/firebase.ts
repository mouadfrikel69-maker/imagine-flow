/**
 * Firebase initialization for React Native (Expo Go-friendly).
 *
 * Uses the Firebase JS SDK with AsyncStorage for session persistence.
 * Config values come from `expo-constants` (set in app.json under
 * `extra.firebase`) so they can be different per build profile.
 */
import Constants from "expo-constants";
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  GoogleAuthProvider,
  initializeAuth,
  // @ts-expect-error - getReactNativePersistence isn't in v9 type defs but exists at runtime
  getReactNativePersistence,
  getAuth,
  type Auth,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId: string;
  appId: string;
  // Google OAuth Web client ID — required by expo-auth-session/Google.
  googleWebClientId?: string;
  googleAndroidClientId?: string;
  googleIosClientId?: string;
};

const cfg = (Constants.expoConfig?.extra?.firebase ?? {}) as Partial<FirebaseConfig>;

function assertConfig(c: Partial<FirebaseConfig>): asserts c is FirebaseConfig {
  const missing = (
    ["apiKey", "authDomain", "projectId", "messagingSenderId", "appId"] as const
  ).filter((k) => !c[k]);
  if (missing.length) {
    throw new Error(
      `Missing Firebase config: ${missing.join(", ")}. ` +
        "Add them under app.json -> expo.extra.firebase."
    );
  }
}

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;

export function firebaseApp(): FirebaseApp {
  if (_app) return _app;
  assertConfig(cfg);
  _app = getApps().length > 0 ? getApps()[0]! : initializeApp(cfg);
  return _app;
}

export function firebaseAuth(): Auth {
  if (_auth) return _auth;
  const app = firebaseApp();
  try {
    _auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // initializeAuth throws if already initialized (HMR case) — fall back.
    _auth = getAuth(app);
  }
  return _auth;
}

export const googleClientIds = {
  webClientId: cfg.googleWebClientId,
  androidClientId: cfg.googleAndroidClientId,
  iosClientId: cfg.googleIosClientId,
};

export { GoogleAuthProvider };
