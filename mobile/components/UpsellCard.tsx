import { LinearGradient } from "expo-linear-gradient";
import { Sparkles, Zap } from "lucide-react-native";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

/**
 * "Smart" quota explainer card shown under the sign-in form (and reused on
 * the dashboard as an upsell). Pulses softly to draw the eye without being
 * obnoxious.
 */
export function UpsellCard({ compact = false }: { compact?: boolean }) {
  const glow = useSharedValue(0);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, [glow]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + glow.value * 0.45,
  }));

  return (
    <View className="relative">
      <Animated.View
        style={[
          {
            position: "absolute",
            inset: -6,
            borderRadius: 24,
          },
          glowStyle,
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={["#a78bfa", "#f472b6", "#a78bfa"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, borderRadius: 24, opacity: 0.5 }}
        />
      </Animated.View>

      <View
        className={`relative rounded-2xl border border-border/80 bg-elevated/80 ${
          compact ? "p-4" : "p-5"
        }`}
      >
        <View className="flex-row items-center gap-2">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-accent/20">
            <Zap size={16} color="#a78bfa" />
          </View>
          <Text className="text-sm font-semibold text-white">
            Want more images per day?
          </Text>
        </View>

        <View className="mt-3 gap-2">
          <Row
            label="Use Google or email"
            value="6 / day"
            tone="muted"
          />
          <Row
            label="Use a Pollinations.ai API key"
            value="20 / day"
            tone="accent"
            icon={<Sparkles size={12} color="#f472b6" />}
          />
        </View>

        {!compact ? (
          <Text className="mt-3 text-[12px] leading-[18px] text-white/55">
            Grab a free key at{" "}
            <Text className="font-semibold text-accent">auth.pollinations.ai</Text>{" "}
            and sign in below with the Pollinations option to unlock the higher
            limit.
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function Row({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: "muted" | "accent";
  icon?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between rounded-xl border border-border/60 bg-bg/40 px-3 py-2">
      <View className="flex-row items-center gap-2">
        {icon}
        <Text className="text-[13px] text-white/70">{label}</Text>
      </View>
      <Text
        className={`text-[13px] font-semibold ${
          tone === "accent" ? "text-accent2" : "text-white/80"
        }`}
      >
        {value}
      </Text>
    </View>
  );
}
