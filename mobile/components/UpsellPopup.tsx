import { BlurView } from "expo-blur";
import * as WebBrowser from "expo-web-browser";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles, X } from "lucide-react-native";
import { type ReactNode, useEffect } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { GhostButton, PrimaryButton } from "./PrimaryButton";

/**
 * Post-sign-in modal: animated reminder that they can unlock 20/day by
 * grabbing their own Pollinations key. Two CTAs:
 *
 * - "Get my free key" — opens auth.pollinations.ai in an in-app browser, then
 *   navigates to the upgrade flow on close.
 * - "Maybe later" — dismisses; backend marks the upsell as dismissed.
 *
 * Visible only when `auth_method === 'google' || 'email'` and the upsell
 * hasn't been dismissed yet.
 */
export function UpsellPopup({
  open,
  onClose,
  onUpgrade,
}: {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (open) {
      scale.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
      opacity.value = withTiming(1, { duration: 280 });
    } else {
      scale.value = 0.9;
      opacity.value = 0;
    }
  }, [open, scale, opacity]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Modal
      transparent
      visible={open}
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={40} tint="dark" style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center px-6">
          <Animated.View
            style={[cardStyle, { width: "100%", maxWidth: 380 }]}
            className="overflow-hidden rounded-3xl border border-border bg-surface"
          >
            <LinearGradient
              colors={["rgba(167,139,250,0.20)", "rgba(244,114,182,0.10)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: "absolute", inset: 0, opacity: 0.9 }}
              pointerEvents="none"
            />

            <View className="flex-row items-start justify-between p-5 pb-2">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-accent/20">
                <Sparkles size={18} color="#a78bfa" />
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                className="h-8 w-8 items-center justify-center rounded-full bg-white/5"
              >
                <X size={16} color="rgba(255,255,255,0.55)" />
              </Pressable>
            </View>

            <View className="px-5 pb-5">
              <Text className="text-xl font-bold text-white">
                Unlock 20 images / day
              </Text>
              <Text className="mt-2 text-sm leading-[20px] text-white/65">
                You're on the free tier — 6 images per day. Bring your own
                Pollinations.ai API key (it's free) and we'll bump you to 20 a
                day instantly. No re-signup.
              </Text>

              <View className="mt-4 rounded-2xl border border-border/60 bg-bg/60 p-3">
                <Bullet>1. Tap "Get my free key" to open auth.pollinations.ai</Bullet>
                <Bullet>2. Sign in there and copy your API key</Bullet>
                <Bullet>3. Paste it back here when prompted</Bullet>
              </View>

              <View className="mt-5 gap-3">
                <PrimaryButton
                  onPress={async () => {
                    try {
                      await WebBrowser.openBrowserAsync(
                        "https://auth.pollinations.ai"
                      );
                    } finally {
                      onUpgrade();
                    }
                  }}
                  iconLeft={<Sparkles size={16} color="#fff" />}
                >
                  Get my free key
                </PrimaryButton>
                <GhostButton onPress={onClose}>Maybe later</GhostButton>
              </View>
            </View>
          </Animated.View>
        </View>
      </BlurView>
    </Modal>
  );
}

function Bullet({ children }: { children: ReactNode }) {
  return <Text className="text-[12px] leading-[20px] text-white/70">{children}</Text>;
}
