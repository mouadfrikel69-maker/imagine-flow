import { Image } from "expo-image";
import { router } from "expo-router";
import { ArrowLeft, Sparkles, Trash2, Wand2 } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GradientBackground } from "@/components/GradientBackground";
import { PrimaryButton } from "@/components/PrimaryButton";
import { QuotaBadge } from "@/components/QuotaBadge";
import { ApiError, generateImage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  addGeneratedImage,
  loadLibrary,
  removeItem,
  type ImageItem,
} from "@/lib/library";

/**
 * Text-to-image sub-dashboard.
 *
 * The user types a prompt, taps Generate, and the backend returns an image
 * which we save to the device's library (per-uid). Hitting the daily limit
 * shows a friendly inline error.
 */
export default function TextToImage() {
  const { user, me, refreshMe } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ImageItem[]>([]);

  const reload = useCallback(async () => {
    if (!user) return;
    setItems(await loadLibrary<ImageItem>(user.uid, "text-to-image"));
  }, [user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleGenerate() {
    if (!user || !prompt.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await generateImage({ prompt: prompt.trim(), seed: 0 });
      await addGeneratedImage(user.uid, prompt.trim(), dataUrl);
      setPrompt("");
      await Promise.all([reload(), refreshMe()]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError(
          `You've used your ${me?.daily_limit ?? "daily"} limit for today.${
            me?.auth_method !== "pollinations"
              ? " Add your own Pollinations key on the dashboard for 20/day."
              : ""
          }`
        );
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete(id: string) {
    if (!user) return;
    Alert.alert("Delete image?", "Removed from your local library only.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await removeItem(user.uid, "text-to-image", id);
          await reload();
        },
      },
    ]);
  }

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        <View className="flex-row items-center justify-between px-6 pt-3">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="-ml-2 flex-row items-center gap-1.5"
          >
            <ArrowLeft size={18} color="rgba(255,255,255,0.7)" />
            <Text className="text-[13px] text-white/70">Dashboard</Text>
          </Pressable>
          {me ? (
            <QuotaBadge
              used={me.used_today}
              limit={me.daily_limit}
              authMethod={me.auth_method}
            />
          ) : null}
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="mt-3 text-2xl font-extrabold text-white">
            Text → Image
          </Text>
          <Text className="mt-1 text-[13px] text-white/55">
            Describe what you want and we'll generate it. Saved straight to
            your device.
          </Text>

          <View className="mt-5 rounded-2xl border border-border bg-elevated p-4">
            <View className="flex-row items-center gap-2">
              <Wand2 size={14} color="#a78bfa" />
              <Text className="text-[11px] uppercase tracking-widest text-white/55">
                Prompt
              </Text>
            </View>
            <TextInput
              value={prompt}
              onChangeText={setPrompt}
              multiline
              placeholder="an astronaut riding a horse on mars, cinematic"
              placeholderTextColor="rgba(255,255,255,0.35)"
              className="mt-2 min-h-[80px] font-mono text-[14px] leading-[20px] text-white"
              editable={!busy}
            />
            <View className="mt-3">
              <PrimaryButton
                onPress={handleGenerate}
                loading={busy}
                disabled={!prompt.trim()}
                iconLeft={<Sparkles size={18} color="#fff" />}
              >
                Generate
              </PrimaryButton>
            </View>
            {error ? (
              <Text className="mt-3 text-[12px] text-danger">{error}</Text>
            ) : null}
          </View>

          <Text className="mt-7 text-[11px] uppercase tracking-widest text-white/40">
            Your library ({items.length})
          </Text>
          {items.length === 0 ? (
            <View className="mt-3 rounded-2xl border border-dashed border-border bg-surface/40 p-6">
              <Text className="text-center text-[13px] text-white/45">
                Nothing here yet. Generate your first image above.
              </Text>
            </View>
          ) : (
            <View className="mt-3 gap-3">
              {items.map((item) => (
                <View
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-border bg-surface"
                >
                  <Image
                    source={{ uri: item.uri }}
                    contentFit="cover"
                    style={{ width: "100%", aspectRatio: 1 }}
                  />
                  <View className="p-3">
                    <Text
                      numberOfLines={2}
                      className="text-[12px] leading-[18px] text-white/75"
                    >
                      {item.prompt}
                    </Text>
                    <View className="mt-2 flex-row items-center justify-between">
                      <Text className="text-[10px] uppercase tracking-widest text-white/35">
                        {new Date(item.createdAt).toLocaleString()}
                      </Text>
                      <Pressable
                        onPress={() => confirmDelete(item.id)}
                        hitSlop={8}
                        className="flex-row items-center gap-1.5 rounded-full border border-border px-3 py-1"
                      >
                        <Trash2 size={12} color="rgba(255,255,255,0.55)" />
                        <Text className="text-[11px] text-white/65">Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}
