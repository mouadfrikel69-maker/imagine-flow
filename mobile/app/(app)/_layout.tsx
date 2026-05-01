import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/lib/auth";

export default function AppLayout() {
  const { authReady, user } = useAuth();
  if (!authReady) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color="#a78bfa" />
      </View>
    );
  }
  if (!user) return <Redirect href="/(auth)/signin" />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#08070d" },
        animation: "slide_from_right",
      }}
    />
  );
}
