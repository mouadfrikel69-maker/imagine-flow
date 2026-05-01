import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrowserMockup } from "@/components/BrowserMockup";
import { GradientBackground } from "@/components/GradientBackground";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import { useAuth } from "@/lib/auth";

/**
 * Onboarding page 1.
 *
 * Shows the browser-mockup hero from the user's design + an animated 4-second
 * progress bar. When the bar fills, we auto-advance to /onboarding-2.
 *
 * If the user is already signed in (returning visit), we skip onboarding
 * entirely and go straight to the dashboard.
 */
export default function OnboardingOne() {
  const { authReady, user } = useAuth();
  const advanced = useRef(false);

  const titleOpacity = useSharedValue(0);
  const titleTranslate = useSharedValue(12);
  const sublineOpacity = useSharedValue(0);

  useEffect(() => {
    titleOpacity.value = withTiming(1, { duration: 600 });
    titleTranslate.value = withTiming(0, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    sublineOpacity.value = withDelay(250, withTiming(1, { duration: 700 }));
  }, [titleOpacity, titleTranslate, sublineOpacity]);

  useEffect(() => {
    if (!authReady) return;
    if (user) {
      // Returning user — skip onboarding.
      router.replace("/(app)/dashboard");
    }
  }, [authReady, user]);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslate.value }],
  }));
  const sublineStyle = useAnimatedStyle(() => ({
    opacity: sublineOpacity.value,
  }));

  function advance() {
    if (advanced.current) return;
    advanced.current = true;
    router.replace("/onboarding-2");
  }

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        <View className="flex-1 justify-between px-6 pb-10 pt-6">
          <View className="items-start">
            <View className="flex-row items-center gap-2 rounded-full border border-border/70 bg-elevated/50 px-3 py-1.5">
              <View className="h-1.5 w-1.5 rounded-full bg-accent" />
              <Text className="text-[11px] uppercase tracking-widest text-white/65">
                ImagineFlow
              </Text>
            </View>
          </View>

          <View className="-mt-4">
            <Animated.Text
              style={titleStyle}
              className="text-3xl font-extrabold leading-[36px] text-white"
            >
              Type a prompt.{"\n"}
              <Text className="text-accent">See it become</Text> art.
            </Animated.Text>
            <Animated.Text
              style={sublineStyle}
              className="mt-3 text-[14px] leading-[22px] text-white/60"
            >
              Powered by Pollinations.ai. Generate up to 20 high-resolution
              images a day, right from your phone.
            </Animated.Text>

            <View className="mt-7">
              <BrowserMockup
                imageSource={require("../assets/images/onboarding-dragon.jpg")}
                prompt="a crystal dragon perched on a mountain peak, fantasy concept art"
              />
            </View>
          </View>

          <View className="gap-3">
            <Text className="text-center text-[12px] text-white/45">
              Loading the experience…
            </Text>
            <OnboardingProgress durationMs={4000} onDone={advance} />
          </View>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}
