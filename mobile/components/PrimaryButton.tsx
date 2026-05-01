import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { type ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Filled, gradient call-to-action button with a press-scale + haptic.
 *
 * Used for "Continue", "Sign in", and other primary actions. Leaves enough
 * vertical breathing room for thumb-reach on the bottom of the screen.
 */
export function PrimaryButton({
  children,
  onPress,
  disabled,
  loading,
  iconLeft,
  iconRight,
  fullWidth = true,
}: {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}) {
  const scale = useSharedValue(1);
  const isDisabled = disabled || loading;

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = withTiming(0.97, { duration: 90 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 120 });
      }}
      onPress={() => {
        if (isDisabled) return;
        Haptics.selectionAsync().catch(() => undefined);
        onPress?.();
      }}
      disabled={isDisabled}
      style={[
        style,
        {
          opacity: isDisabled ? 0.55 : 1,
          width: fullWidth ? "100%" : undefined,
        },
      ]}
      className="overflow-hidden rounded-2xl"
    >
      <LinearGradient
        colors={["#a78bfa", "#7c3aed", "#f472b6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingVertical: 16, paddingHorizontal: 24 }}
      >
        <View className="flex-row items-center justify-center gap-2">
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              {iconLeft}
              <Text className="text-base font-semibold text-white">{children}</Text>
              {iconRight}
            </>
          )}
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
}

export function GhostButton({
  children,
  onPress,
  disabled,
}: {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = withTiming(0.97, { duration: 90 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 120 });
      }}
      onPress={() => {
        if (disabled) return;
        Haptics.selectionAsync().catch(() => undefined);
        onPress?.();
      }}
      style={[style, { opacity: disabled ? 0.55 : 1 }]}
      className="rounded-2xl border border-border bg-elevated/60 px-5 py-3"
    >
      <Text className="text-center text-sm font-semibold text-white/85">{children}</Text>
    </AnimatedPressable>
  );
}
