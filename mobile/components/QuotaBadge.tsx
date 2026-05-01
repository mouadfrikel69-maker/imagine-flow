import { Sparkles } from "lucide-react-native";
import { Text, View } from "react-native";

/**
 * Compact "X / Y today" pill shown on the dashboard. Goes amber as the user
 * approaches the limit, red when they've hit it.
 */
export function QuotaBadge({
  used,
  limit,
  authMethod,
}: {
  used: number;
  limit: number;
  authMethod: "google" | "email" | "pollinations";
}) {
  const ratio = limit === 0 ? 0 : used / limit;
  const tone =
    ratio >= 1 ? "danger" : ratio >= 0.66 ? "warning" : authMethod === "pollinations" ? "accent" : "muted";

  const colors = {
    accent:  { bg: "bg-accent/15",  border: "border-accent/40",  text: "text-accent" },
    warning: { bg: "bg-warning/15", border: "border-warning/40", text: "text-warning" },
    danger:  { bg: "bg-danger/15",  border: "border-danger/40",  text: "text-danger" },
    muted:   { bg: "bg-white/5",    border: "border-border",     text: "text-white/70" },
  } as const;
  const c = colors[tone];

  return (
    <View
      className={`flex-row items-center gap-1.5 rounded-full border px-2.5 py-1 ${c.bg} ${c.border}`}
    >
      <Sparkles size={12} color={tone === "accent" ? "#a78bfa" : tone === "warning" ? "#f59e0b" : tone === "danger" ? "#ef4444" : "rgba(255,255,255,0.7)"} />
      <Text className={`text-[12px] font-semibold ${c.text}`}>
        {used} / {limit} today
      </Text>
    </View>
  );
}
