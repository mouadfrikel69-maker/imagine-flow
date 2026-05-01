import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ArrowRight, ScanText } from "lucide-react-native";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { GradientBackground } from "@/components/GradientBackground";
import { PrimaryButton } from "@/components/PrimaryButton";
import { TypingText } from "@/components/TypingText";

/**
 * Onboarding page 2 — image-to-text.
 *
 * Animated typing line that types → erases → retypes through three example
 * captions. Floating image on the side. "Continue" button at the bottom that
 * routes the user into the auth flow.
 */
export default function OnboardingTwo() {
  const headerOpacity = useSharedValue(0);
  const headerTranslate = useSharedValue(12);
  const imageScale = useSharedValue(0.96);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 700 });
    headerTranslate.value = withTiming(0, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
    imageScale.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(1.03, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.96, { duration: 2400, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );
  }, [headerOpacity, headerTranslate, imageScale]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslate.value }],
  }));
  const imgStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imageScale.value }],
  }));

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        <View className="flex-1 justify-between px-6 pb-8 pt-6">
          <Animated.View style={headerStyle} className="gap-2">
            <View className="flex-row items-center gap-2">
              <View className="h-9 w-9 items-center justify-center rounded-2xl bg-accent/15">
                <ScanText size={18} color="#a78bfa" />
              </View>
              <Text className="text-[11px] uppercase tracking-widest text-white/55">
                Step 2 of 2
              </Text>
            </View>
            <Text className="mt-2 text-3xl font-extrabold leading-[36px] text-white">
              Drop an image.{"\n"}
              <Text className="text-accent2">We tell you</Text> what's in it.
            </Text>
            <Text className="mt-3 text-[14px] leading-[22px] text-white/60">
              ImagineFlow does both directions: generate art from prompts, and
              describe images you already have. All in one app.
            </Text>
          </Animated.View>

          <View className="items-center">
            <View className="relative w-full max-w-[360px] overflow-hidden rounded-3xl border border-border bg-surface">
              <LinearGradient
                colors={["rgba(244,114,182,0.20)", "rgba(167,139,250,0.0)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: "absolute", inset: 0 }}
                pointerEvents="none"
              />
              <Animated.View
                style={[{ aspectRatio: 1.4, overflow: "hidden" }, imgStyle]}
              >
                <Image
                  source={require("../assets/images/onboarding-fox.jpg")}
                  contentFit="cover"
                  style={{ width: "100%", height: "100%" }}
                />
              </Animated.View>
              <View className="border-t border-border/60 px-4 py-3">
                <Text className="text-[10px] uppercase tracking-widest text-white/45">
                  AI caption
                </Text>
                <TypingText
                  className="mt-2 font-mono text-[13px] leading-[20px] text-white/85"
                  phrases={[
                    "A neon cyber-fox prowling a rainy Tokyo alley, cinematic.",
                    "An astronaut sips tea on the rim of a quiet crater.",
                    "Origami koi swim through a folded papercraft river.",
                  ]}
                />
              </View>
            </View>
          </View>

          <View>
            <PrimaryButton
              onPress={() => router.replace("/(auth)/signin")}
              iconRight={<ArrowRight size={18} color="#fff" />}
            >
              Continue
            </PrimaryButton>
            <Text className="mt-3 text-center text-[12px] text-white/40">
              Sign in next — takes one tap with Google.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}
