import { LinearGradient } from "expo-linear-gradient";
import { type ReactNode } from "react";
import { View } from "react-native";

/**
 * Shared dark gradient backdrop with subtle violet/pink glow.
 *
 * Used as the root of every screen so colors and ambient lighting feel
 * consistent throughout onboarding → auth → dashboard.
 */
export function GradientBackground({ children }: { children: ReactNode }) {
  return (
    <View className="flex-1 bg-bg">
      <LinearGradient
        colors={["#160b2c", "#08070d", "#08070d"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: "absolute", inset: 0 }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["rgba(167,139,250,0.18)", "rgba(244,114,182,0.0)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: "absolute",
          top: -120,
          left: -80,
          width: 360,
          height: 360,
          borderRadius: 360,
          opacity: 0.7,
        }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["rgba(244,114,182,0.18)", "rgba(167,139,250,0.0)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: "absolute",
          bottom: -160,
          right: -120,
          width: 420,
          height: 420,
          borderRadius: 420,
          opacity: 0.6,
        }}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}
