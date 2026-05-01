import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ArrowLeft, ScanText, Trash2, Upload } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GradientBackground } from "@/components/GradientBackground";
import { PrimaryButton } from "@/components/PrimaryButton";
import { QuotaBadge } from "@/components/QuotaBadge";
import { ApiError, captionImage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  addCaption,
  loadLibrary,
  removeItem,
  type CaptionItem,
} from "@/lib/library";

/**
 * Image-to-text sub-dashboard.
 *
 * Pick an image from the device, send it to the backend's /api/v2/caption
 * endpoint, save both the caption text and a thumbnail in the local
 * library. Same per-uid privacy guarantee as the image library.
 */
export default function ImageToText() {
  const { user, me, refreshMe } = useAuth();
  const [pickedDataUrl, setPickedDataUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<CaptionItem[]>([]);

  const reload = useCallback(async () => {
    if (!user) return;
    setItems(await loadLibrary<CaptionItem>(user.uid, "image-to-text"));
  }, [user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function pick() {
    setError(null);
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.85,
    });
    if (res.canceled) return;
    const asset = res.assets[0];
    if (!asset?.base64) {
      setError("Couldn't read that image.");
      return;
    }
    const mime = asset.mimeType || "image/jpeg";
    setPickedDataUrl(`data:${mime};base64,${asset.base64}`);
  }

  async function handleCaption() {
    if (!user || !pickedDataUrl) return;
    setBusy(true);
    setError(null);
    try {
      const caption = await captionImage({ image_data_url: pickedDataUrl });
      await addCaption(user.uid, caption, pickedDataUrl);
      setPickedDataUrl(null);
      await Promise.all([reload(), refreshMe()]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError(
          `You've used your ${me?.daily_limit ?? "daily"} limit for today.`
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
    Alert.alert("Delete caption?", "Removed from your local library only.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await removeItem(user.uid, "image-to-text", id);
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
        >
          <Text className="mt-3 text-2xl font-extrabold text-white">
            Image → Text
          </Text>
          <Text className="mt-1 text-[13px] text-white/55">
            Pick an image and we'll describe it for you.
          </Text>

          <View className="mt-5 rounded-2xl border border-border bg-elevated p-4">
            <View className="flex-row items-center gap-2">
              <ScanText size={14} color="#f472b6" />
              <Text className="text-[11px] uppercase tracking-widest text-white/55">
                Source image
              </Text>
            </View>

            {pickedDataUrl ? (
              <View className="mt-3 overflow-hidden rounded-xl border border-border">
                <Image
                  source={{ uri: pickedDataUrl }}
                  contentFit="cover"
                  style={{ width: "100%", aspectRatio: 1.4 }}
                />
              </View>
            ) : (
              <Pressable
                onPress={pick}
                className="mt-3 items-center justify-center rounded-xl border border-dashed border-border bg-surface/40 px-6 py-10 active:opacity-90"
              >
                <Upload size={20} color="rgba(255,255,255,0.55)" />
                <Text className="mt-2 text-[13px] text-white/65">
                  Tap to pick an image
                </Text>
              </Pressable>
            )}

            <View className="mt-4 gap-2">
              <PrimaryButton
                onPress={handleCaption}
                loading={busy}
                disabled={!pickedDataUrl}
                iconLeft={<ScanText size={18} color="#fff" />}
              >
                Describe this image
              </PrimaryButton>
              {pickedDataUrl ? (
                <Pressable
                  onPress={pick}
                  className="self-center"
                  hitSlop={6}
                  disabled={busy}
                >
                  <Text className="text-[12px] text-white/55">
                    Pick a different image
                  </Text>
                </Pressable>
              ) : null}
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
                Nothing here yet. Drop in an image above.
              </Text>
            </View>
          ) : (
            <View className="mt-3 gap-3">
              {items.map((item) => (
                <View
                  key={item.id}
                  className="rounded-2xl border border-border bg-surface p-3"
                >
                  <View className="flex-row gap-3">
                    {item.uri ? (
                      <Image
                        source={{ uri: item.uri }}
                        contentFit="cover"
                        style={{ width: 64, height: 64, borderRadius: 12 }}
                      />
                    ) : null}
                    <View className="flex-1">
                      <Text
                        numberOfLines={4}
                        className="text-[13px] leading-[20px] text-white/85"
                      >
                        {item.caption}
                      </Text>
                      <Text className="mt-1 text-[10px] uppercase tracking-widest text-white/35">
                        {new Date(item.createdAt).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  <View className="mt-3 flex-row justify-end">
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
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}
