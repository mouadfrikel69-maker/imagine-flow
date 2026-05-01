/**
 * Auth context: keeps the Firebase user + the backend `/api/v2/me` profile in
 * sync, and exposes helpers used by sign-in / sign-up / dashboard screens.
 */
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { fetchMe, type Me } from "./api";
import { firebaseAuth, googleClientIds } from "./firebase";

WebBrowser.maybeCompleteAuthSession();

type AuthState = {
  loading: boolean;
  user: User | null;
  me: Me | null;
  meError: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<void>;
  /** True until we know whether the *user* is signed in (not until /me loads). */
  authReady: boolean;
  promptGoogleAvailable: boolean;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [meError, setMeError] = useState<string | null>(null);
  const [meLoading, setMeLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: googleClientIds.webClientId,
    androidClientId: googleClientIds.androidClientId,
    iosClientId: googleClientIds.iosClientId,
    webClientId: googleClientIds.webClientId,
    scopes: ["openid", "email", "profile"],
  });

  // Track the latest Firebase user
  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth(), (u) => {
      setUser(u);
      setAuthReady(true);
      if (!u) {
        setMe(null);
        setMeError(null);
      }
    });
    return unsub;
  }, []);

  const refreshMe = useCallback(async () => {
    if (!firebaseAuth().currentUser) {
      setMe(null);
      return;
    }
    setMeLoading(true);
    setMeError(null);
    try {
      const profile = await fetchMe();
      setMe(profile);
    } catch (err) {
      setMeError(err instanceof Error ? err.message : String(err));
    } finally {
      setMeLoading(false);
    }
  }, []);

  // Whenever auth state changes to signed-in, refresh /me
  useEffect(() => {
    if (user) void refreshMe();
  }, [user, refreshMe]);

  // Handle the Google response
  const googleHandled = useRef(false);
  useEffect(() => {
    if (!response || googleHandled.current) return;
    if (response.type === "success") {
      googleHandled.current = true;
      const idToken = response.authentication?.idToken ?? response.params?.id_token;
      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken);
        void signInWithCredential(firebaseAuth(), credential).catch((e) => {
          setMeError(e instanceof Error ? e.message : String(e));
        });
      }
    }
  }, [response]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(firebaseAuth(), email, password);
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    await createUserWithEmailAndPassword(firebaseAuth(), email, password);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!request) {
      throw new Error("Google sign-in not ready yet — try again in a moment.");
    }
    googleHandled.current = false;
    await promptAsync();
  }, [promptAsync, request]);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(firebaseAuth(), email);
  }, []);

  const signOut = useCallback(async () => {
    await fbSignOut(firebaseAuth());
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      loading: !authReady || meLoading,
      authReady,
      user,
      me,
      meError,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      resetPassword,
      signOut,
      refreshMe,
      promptGoogleAvailable: !!request,
    }),
    [
      authReady,
      meLoading,
      user,
      me,
      meError,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      resetPassword,
      signOut,
      refreshMe,
      request,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export const friendlyAuthError = (err: unknown): string => {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Wrong email or password.";
    case "auth/user-not-found":
      return "No account with that email.";
    case "auth/email-already-in-use":
      return "An account already exists for that email — try signing in.";
    case "auth/weak-password":
      return "Password is too weak (min 6 characters).";
    case "auth/invalid-email":
      return "That email doesn't look right.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a minute and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection.";
    default:
      return err instanceof Error ? err.message : String(err);
  }
};

// Re-export so screens can use it without importing AuthSession directly.
export { AuthSession };
