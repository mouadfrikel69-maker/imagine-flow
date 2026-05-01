import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

/**
 * 4-second animated progress bar for onboarding pages.
 *
 * Calls `onDone` once when the fill reaches 100%. The fill itself is a
 * gradient overlay so the bar reads as a single, smooth sweep on dark UI.
 */
export function OnboardingProgress({
  durationMs = 4000,
  onDone,
}: {
  durationMs?: number;
  onDone?: () => void;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(
      1,
      { duration: durationMs, easing: Easing.out(Easing.cubic) },
      (finished) => {
        "worklet";
        // Reanimated finish callback runs on the UI thread (worklet context).
        // requestAnimationFrame doesn't exist there — runOnJS bounces back
        // onto the JS thread so React state updates / navigation work.
        if (finished && onDone) {
          runOnJS(onDone)();
        }
      }
    );
  }, [durationMs, onDone, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <Animated.View
        style={fillStyle}
        className="h-full rounded-full bg-accent"
      />
    </View>
  );
}
