import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  ArrowRight,
  ImagePlus,
  LogOut,
  ScanText,
  Sparkles,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GradientBackground } from "@/components/GradientBackground";
import { KeyPasteSheet } from "@/components/KeyPasteSheet";
import { QuotaBadge } from "@/components/QuotaBadge";
import { UpsellCard } from "@/components/UpsellCard";
import { UpsellPopup } from "@/components/UpsellPopup";
import {
  ApiError,
  dismissUpsell,
  upgradeToPollinations,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { libraryStats } from "@/lib/library";

/**
 * Main post-sign-in screen.
 *
 * - Greets the user.
 * - Shows a quota badge ("X / Y today") computed by the backend.
 * - Two big feature cards: Text-to-Image (primary, accent gradient) and
 *   Image-to-Text (secondary).
 * - First-time-popup reminding the user about the 20/day Pollinations tier
 *   (only when auth_method is google/email and not yet dismissed).
 * - Smaller {@link UpsellCard} pinned at the bottom for the same reason.
 *
 * "Upgrade" — pasting a Pollinations key — is an in-place flow that flips the
 * user's auth_method to 'pollinations' and bumps the daily limit to 20 with
 * no re-signup.
 */
export default function Dashboard() {
  const { user, me, refreshMe, signOut } = useAuth();
  const [popupOpen, setPopupOpen] = useState(false);
  const [keySheet, setKeySheet] = useState(false);
  const [keySubmitting, setKeySubmitting] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ textToImage: number; imageToText: number }>({
    textToImage: 0,
    imageToText: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const eligibleForUpsell =
    me &&
    me.auth_method !== "pollinations" &&
    !me.dismissed_pollinations_upsell;

  // Auto-show the popup once after sign-in
  useEffect(() => {
    if (eligibleForUpsell) {
      const t = setTimeout(() => setPopupOpen(true), 600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [eligibleForUpsell]);

  // Load local library counts whenever uid is known
  useEffect(() => {
    if (!user) return;
    void libraryStats(user.uid).then(setStats);
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshMe();
      if (user) setStats(await libraryStats(user.uid));
    } finally {
      setRefreshing(false);
    }
  }, [refreshMe, user]);

  async function handleDismiss() {
    setPopupOpen(false);
    try {
      await dismissUpsell();
      await refreshMe();
    } catch {
      /* ignore */
    }
  }

  async function handleUpgrade(key: string) {
    setKeySubmitting(true);
    setKeyError(null);
    try {
      await upgradeToPollinations(key);
      await refreshMe();
      setKeySheet(false);
    } catch (err) {
      setKeyError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : String(err)
      );
    } finally {
      setKeySubmitting(false);
    }
  }

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              tintColor="#a78bfa"
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        >
          <View className="flex-row items-center justify-between pt-3">
            <View>
              <Text className="text-[12px] uppercase tracking-widest text-white/40">
                Hi {me?.name?.split(" ")[0] || me?.email?.split("@")[0] || "there"}
              </Text>
              <Text className="text-2xl font-extrabold text-white">
                ImagineFlow
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              {me ? (
                <QuotaBadge
                  used={me.used_today}
                  limit={me.daily_limit}
                  authMethod={me.auth_method}
                />
              ) : null}
              <Pressable
                onPress={signOut}
                hitSlop={8}
                className="h-9 w-9 items-center justify-center rounded-full border border-border bg-elevated"
              >
                <LogOut size={15} color="rgba(255,255,255,0.65)" />
              </Pressable>
            </View>
          </View>

          {/* Primary feature: text-to-image */}
          <Pressable
            onPress={() => router.push("/(app)/text-to-image")}
            className="mt-6 overflow-hidden rounded-3xl border border-border bg-surface active:opacity-90"
          >
            <LinearGradient
              colors={["rgba(167,139,250,0.30)", "rgba(244,114,182,0.20)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: "absolute", inset: 0 }}
              pointerEvents="none"
            />
            <Image
              source={require("../../assets/images/onboarding-astronaut.jpg")}
              contentFit="cover"
              style={{ width: "100%", height: 180, opacity: 0.45 }}
            />
            <View
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(8,7,13,0.45)",
              }}
              pointerEvents="none"
            />
            <View className="absolute inset-0 justify-end p-5">
              <View className="flex-row items-center gap-2">
                <View className="h-8 w-8 items-center justify-center rounded-2xl bg-white/10">
                  <ImagePlus size={16} color="#fff" />
                </View>
                <Text className="text-[11px] uppercase tracking-widest text-white/70">
                  Primary
                </Text>
              </View>
              <Text className="mt-2 text-2xl font-extrabold text-white">
                Text → Image
              </Text>
              <View className="mt-2 flex-row items-center gap-2">
                <Text className="text-[13px] text-white/70">
                  {stats.textToImage} in your library
                </Text>
                <View className="h-1 w-1 rounded-full bg-white/30" />
                <Text className="text-[13px] text-white/70">Tap to create →</Text>
              </View>
            </View>
          </Pressable>

          {/* Secondary feature: image-to-text */}
          <Pressable
            onPress={() => router.push("/(app)/image-to-text")}
            className="mt-3 flex-row items-center gap-3 rounded-2xl border border-border bg-elevated p-4 active:opacity-90"
          >
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-accent2/15">
              <ScanText size={20} color="#f472b6" />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-white">
                Image → Text
              </Text>
              <Text className="text-[12px] text-white/55">
                {stats.imageToText} captions saved
              </Text>
            </View>
            <ArrowRight size={18} color="rgba(255,255,255,0.55)" />
          </Pressable>

          {/* Activity row */}
          <View className="mt-6 flex-row gap-3">
            <StatCard
              label="Today"
              value={`${me?.used_today ?? 0} / ${me?.daily_limit ?? 6}`}
              icon={<Sparkles size={16} color="#a78bfa" />}
            />
            <StatCard
              label="Tier"
              value={
                me?.auth_method === "pollinations"
                  ? "Pollinations 20/day"
                  : "Free 6/day"
              }
              icon={<Sparkles size={16} color="#f472b6" />}
            />
          </View>

          {/* Upsell card (persistent) */}
          {eligibleForUpsell ? (
            <View className="mt-6">
              <UpsellCard compact />
              <View className="mt-3 flex-row gap-3">
                <Pressable
                  onPress={() => setKeySheet(true)}
                  className="flex-1 items-center rounded-2xl border border-accent/40 bg-accent/15 px-4 py-3 active:opacity-80"
                >
                  <Text className="text-[13px] font-semibold text-accent">
                    Paste my key
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleDismiss}
                  className="rounded-2xl border border-border bg-elevated px-4 py-3 active:opacity-80"
                >
                  <Text className="text-[13px] font-semibold text-white/65">
                    Not now
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <UpsellPopup
          open={popupOpen}
          onClose={handleDismiss}
          onUpgrade={() => {
            setPopupOpen(false);
            setKeySheet(true);
          }}
        />

        <KeyPasteSheet
          open={keySheet}
          submitting={keySubmitting}
          error={keyError}
          onClose={() => {
            if (!keySubmitting) setKeySheet(false);
          }}
          onSubmit={handleUpgrade}
        />
      </SafeAreaView>
    </GradientBackground>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <View className="flex-1 rounded-2xl border border-border bg-elevated p-4">
      <View className="flex-row items-center gap-2">
        {icon}
        <Text className="text-[11px] uppercase tracking-widest text-white/45">
          {label}
        </Text>
      </View>
      <Text className="mt-2 text-[15px] font-semibold text-white">{value}</Text>
    </View>
  );
}
