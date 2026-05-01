import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles, Type as TypeIcon, Image as ImageIcon } from "lucide-react-native";
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

/**
 * Onboarding-page-1 hero: a faux browser window card showing a prompt panel
 * on the left and a generated image on the right.
 *
 * Mirrors the HTML the user pasted (Mac-style traffic-light dots, URL bar,
 * two-column body, sparkle icon, "generated" badge). The prompt animates in
 * with a soft fade + nudge, and the image breathes via a slow scale loop so
 * the screen doesn't feel static while the 4-second progress bar runs below.
 */
export function BrowserMockup({
  prompt = "an astronaut riding a horse on mars, cinematic, hyper-detailed",
  imageSource,
  meta = "flux · 512×512",
  url = "imagineflow.app/text-to-image",
}: {
  prompt?: string;
  imageSource: number | { uri: string };
  meta?: string;
  url?: string;
}) {
  const promptOpacity = useSharedValue(0);
  const promptTranslate = useSharedValue(8);
  const imgScale = useSharedValue(0.96);

  useEffect(() => {
    promptOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    promptTranslate.value = withDelay(
      200,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
    );
    imgScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.96, { duration: 2200, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, [promptOpacity, promptTranslate, imgScale]);

  const promptStyle = useAnimatedStyle(() => ({
    opacity: promptOpacity.value,
    transform: [{ translateY: promptTranslate.value }],
  }));

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imgScale.value }],
  }));

  return (
    <View className="relative">
      {/* Soft outer glow */}
      <LinearGradient
        colors={["rgba(167,139,250,0.30)", "rgba(244,114,182,0.20)", "rgba(167,139,250,0.30)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: "absolute",
          inset: -16,
          borderRadius: 28,
          opacity: 0.7,
        }}
        pointerEvents="none"
      />

      <View className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/50">
        {/* Title bar */}
        <View className="flex-row items-center gap-2 border-b border-border/60 px-4 py-2.5">
          <View className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
          <View className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <View className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <Text
            numberOfLines={1}
            className="ml-3 flex-1 font-mono text-[11px] text-white/40"
          >
            {url}
          </Text>
        </View>

        {/* Body: prompt + image */}
        <View className="flex-row">
          <View className="flex-1 border-r border-border/60 p-5">
            <View className="mb-3 flex-row items-center gap-2">
              <TypeIcon size={14} color="rgba(255,255,255,0.5)" />
              <Text className="text-[11px] uppercase tracking-widest text-white/50">
                Prompt
              </Text>
            </View>
            <Animated.Text
              style={promptStyle}
              className="font-mono text-[13px] leading-5 text-white/85"
            >
              {prompt}
            </Animated.Text>
            <View className="mt-5 flex-row items-center gap-2">
              <Sparkles size={14} color="#a78bfa" />
              <Text className="text-[11px] text-white/40">{meta}</Text>
            </View>
          </View>
          <View className="relative aspect-square flex-1 overflow-hidden bg-black/40">
            <Animated.View style={[{ position: "absolute", inset: 0 }, imageStyle]}>
              <Image
                source={imageSource}
                contentFit="cover"
                style={{ width: "100%", height: "100%" }}
              />
            </Animated.View>
            <View className="absolute bottom-2 right-2 flex-row items-center rounded-md bg-black/55 px-2 py-1">
              <ImageIcon size={10} color="rgba(255,255,255,0.7)" />
              <Text className="ml-1 text-[10px] uppercase tracking-widest text-white/70">
                generated
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
