import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/lib/auth";

export default function AuthLayout() {
  const { authReady, user } = useAuth();
  // If the user is already signed in, route them to the dashboard so they
  // never see the auth pages again on relaunch.
  if (authReady && user) return <Redirect href="/(app)/dashboard" />;

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
