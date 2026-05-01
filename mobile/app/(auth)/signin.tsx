import { Link, router } from "expo-router";
import { ArrowRight, Lock, Mail } from "lucide-react-native";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GoogleLogo } from "@/components/GoogleLogo";
import { GradientBackground } from "@/components/GradientBackground";
import { PrimaryButton } from "@/components/PrimaryButton";
import { UpsellCard } from "@/components/UpsellCard";
import { friendlyAuthError, useAuth } from "@/lib/auth";

type Mode = "signin" | "signup";

/**
 * Sign in / Sign up screen. Two paths:
 *  - Google: one tap, ends up at /api/v2/me with auth_method='google'.
 *  - Email + password: 6-char minimum on sign-up, "Forgot password?" link.
 *
 * Below the form, the {@link UpsellCard} explains the 6/day vs 20/day tiers.
 * Users who want 20/day will sign in here normally and then upgrade later via
 * the dashboard upsell — no need for a separate "Pollinations sign-up" path.
 */
export default function SignIn() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, promptGoogleAvailable } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signin") {
        await signInWithEmail(email.trim(), password);
      } else {
        await signUpWithEmail(email.trim(), password);
      }
      router.replace("/(app)/dashboard");
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // The auth state listener in AuthProvider will trigger a redirect via
      // _layout.tsx once the token round-trip completes.
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-1 px-6 pb-10 pt-4">
              <Text className="text-3xl font-extrabold text-white">
                {mode === "signin" ? "Welcome back" : "Create your account"}
              </Text>
              <Text className="mt-2 text-[14px] text-white/55">
                {mode === "signin"
                  ? "Sign in to keep generating images and captions."
                  : "Sign up to start generating up to 20 images a day."}
              </Text>

              {/* Google */}
              <View className="mt-6">
                <Pressable
                  onPress={handleGoogle}
                  disabled={!promptGoogleAvailable || googleLoading}
                  className="flex-row items-center justify-center gap-3 rounded-2xl border border-border bg-elevated px-4 py-4 active:opacity-80"
                  style={{ opacity: !promptGoogleAvailable || googleLoading ? 0.55 : 1 }}
                >
                  <GoogleLogo size={18} />
                  <Text className="text-[15px] font-semibold text-white">
                    {googleLoading ? "Opening Google…" : "Continue with Google"}
                  </Text>
                </Pressable>
              </View>

              {/* Divider */}
              <View className="my-5 flex-row items-center gap-3">
                <View className="h-px flex-1 bg-border" />
                <Text className="text-[11px] uppercase tracking-widest text-white/40">
                  or with email
                </Text>
                <View className="h-px flex-1 bg-border" />
              </View>

              {/* Email field */}
              <Field
                icon={<Mail size={16} color="rgba(255,255,255,0.55)" />}
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
              <View className="h-3" />
              <Field
                icon={<Lock size={16} color="rgba(255,255,255,0.55)" />}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />

              {mode === "signin" ? (
                <View className="mt-3 items-end">
                  <Link href="/(auth)/forgot" asChild>
                    <Pressable hitSlop={8}>
                      <Text className="text-[12px] font-semibold text-accent">
                        Forgot password?
                      </Text>
                    </Pressable>
                  </Link>
                </View>
              ) : null}

              {error ? (
                <Text className="mt-3 text-[12px] text-danger">{error}</Text>
              ) : null}

              <View className="mt-5">
                <PrimaryButton
                  onPress={handleSubmit}
                  loading={submitting}
                  disabled={!email.trim() || password.length < 6}
                  iconRight={<ArrowRight size={18} color="#fff" />}
                >
                  {mode === "signin" ? "Sign in" : "Create account"}
                </PrimaryButton>
              </View>

              <Pressable
                onPress={() => {
                  setError(null);
                  setMode((m) => (m === "signin" ? "signup" : "signin"));
                }}
                className="mt-4 self-center"
                hitSlop={8}
              >
                <Text className="text-[13px] text-white/55">
                  {mode === "signin"
                    ? "New here? "
                    : "Already have an account? "}
                  <Text className="font-semibold text-white">
                    {mode === "signin" ? "Create an account" : "Sign in"}
                  </Text>
                </Text>
              </Pressable>

              <View className="mt-8">
                <UpsellCard />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}

function Field({
  icon,
  ...inputProps
}: { icon: React.ReactNode } & React.ComponentProps<typeof TextInput>) {
  return (
    <View className="flex-row items-center gap-2 rounded-2xl border border-border bg-elevated px-3">
      {icon}
      <TextInput
        {...inputProps}
        placeholderTextColor="rgba(255,255,255,0.35)"
        className="flex-1 py-4 text-[14px] text-white"
      />
    </View>
  );
}
