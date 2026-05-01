import { BlurView } from "expo-blur";
import { Sparkles } from "lucide-react-native";
import { useState } from "react";
import { Modal, Text, TextInput, View } from "react-native";

import { GhostButton, PrimaryButton } from "./PrimaryButton";

/**
 * Bottom-sheet-ish modal where the user pastes a Pollinations API key.
 *
 * Used both during sign-up (when they choose the Pollinations path) and when
 * an existing Google/email user accepts the upsell.
 */
export function KeyPasteSheet({
  open,
  onClose,
  onSubmit,
  submitting,
  error,
  title = "Paste your Pollinations API key",
  subtitle = "Find it at auth.pollinations.ai → Account → API Key.",
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (key: string) => Promise<void> | void;
  submitting?: boolean;
  error?: string | null;
  title?: string;
  subtitle?: string;
}) {
  const [value, setValue] = useState("");

  return (
    <Modal
      transparent
      visible={open}
      animationType="slide"
      onRequestClose={() => {
        if (!submitting) onClose();
      }}
    >
      <BlurView intensity={30} tint="dark" style={{ flex: 1 }}>
        <View className="flex-1 justify-end">
          <View className="rounded-t-3xl border-t border-border bg-surface p-6 pb-10">
            <View className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />
            <View className="mb-3 flex-row items-center gap-2">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-accent/20">
                <Sparkles size={16} color="#a78bfa" />
              </View>
              <Text className="text-lg font-semibold text-white">{title}</Text>
            </View>
            <Text className="mb-4 text-sm text-white/60">{subtitle}</Text>

            <TextInput
              value={value}
              onChangeText={setValue}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              placeholder="poll_********************"
              placeholderTextColor="rgba(255,255,255,0.3)"
              editable={!submitting}
              className="rounded-2xl border border-border bg-elevated px-4 py-4 font-mono text-[13px] text-white"
            />
            {error ? (
              <Text className="mt-2 text-[12px] text-danger">{error}</Text>
            ) : null}

            <View className="mt-5 gap-3">
              <PrimaryButton
                onPress={() => {
                  void onSubmit(value.trim());
                }}
                disabled={value.trim().length < 8}
                loading={submitting}
              >
                Save & unlock 20/day
              </PrimaryButton>
              <GhostButton onPress={onClose} disabled={submitting}>
                Cancel
              </GhostButton>
            </View>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}
