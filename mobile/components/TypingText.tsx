import { useEffect, useState } from "react";
import { Text, type TextProps } from "react-native";

/**
 * Typewriter loop: types each phrase character-by-character, holds for a
 * moment, deletes back to empty, then advances to the next phrase. Loops
 * forever so the second onboarding page feels alive while the user reads.
 */
export function TypingText({
  phrases,
  typeSpeed = 40,
  deleteSpeed = 20,
  holdMs = 1400,
  className,
  ...textProps
}: {
  phrases: string[];
  typeSpeed?: number;
  deleteSpeed?: number;
  holdMs?: number;
  className?: string;
} & Omit<TextProps, "children">) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [shown, setShown] = useState("");
  const [phase, setPhase] = useState<"type" | "hold" | "delete">("type");

  useEffect(() => {
    const phrase = phrases[phraseIndex] ?? "";
    if (phase === "type") {
      if (shown.length < phrase.length) {
        const t = setTimeout(() => setShown(phrase.slice(0, shown.length + 1)), typeSpeed);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("hold"), 0);
      return () => clearTimeout(t);
    }
    if (phase === "hold") {
      const t = setTimeout(() => setPhase("delete"), holdMs);
      return () => clearTimeout(t);
    }
    if (phase === "delete") {
      if (shown.length > 0) {
        const t = setTimeout(() => setShown(shown.slice(0, -1)), deleteSpeed);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => {
        setPhraseIndex((i) => (i + 1) % phrases.length);
        setPhase("type");
      }, 250);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [shown, phase, phraseIndex, phrases, typeSpeed, deleteSpeed, holdMs]);

  return (
    <Text className={className} {...textProps}>
      {shown}
      <Text className="text-accent">▍</Text>
    </Text>
  );
}
