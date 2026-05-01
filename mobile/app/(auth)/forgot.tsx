import { router } from "expo-router";
import { ArrowLeft, Mail } from "lucide-react-native";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GradientBackground } from "@/components/GradientBackground";
import { PrimaryButton } from "@/components/PrimaryButton";
import { friendlyAuthError, useAuth } from "@/lib/auth";

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <View className="flex-1 px-6 pb-10 pt-4">
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              className="-ml-2 mb-4 flex-row items-center gap-1.5"
            >
              <ArrowLeft size={18} color="rgba(255,255,255,0.7)" />
              <Text className="text-[13px] text-white/70">Back</Text>
            </Pressable>

            <Text className="text-3xl font-extrabold text-white">
              Reset password
            </Text>
            <Text className="mt-2 text-[14px] text-white/55">
              Enter the email tied to your account and we'll send you a reset
              link.
            </Text>

            <View className="mt-6 flex-row items-center gap-2 rounded-2xl border border-border bg-elevated px-3">
              <Mail size={16} color="rgba(255,255,255,0.55)" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="you@example.com"
                placeholderTextColor="rgba(255,255,255,0.35)"
                className="flex-1 py-4 text-[14px] text-white"
              />
            </View>

            {sent ? (
              <Text className="mt-4 text-[13px] text-success">
                Check your inbox — we just sent a reset link.
              </Text>
            ) : null}
            {error ? (
              <Text className="mt-3 text-[12px] text-danger">{error}</Text>
            ) : null}

            <View className="mt-6">
              <PrimaryButton
                onPress={handleSubmit}
                loading={submitting}
                disabled={!email.trim()}
              >
                Send reset link
              </PrimaryButton>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}
