import { Pressable, StyleSheet, View } from "react-native";
import { Icon, Text } from "@/src/components/ui";
import { formatDuration, type RecorderPhase } from "@/src/hooks/useRecorder";
import { colors, radius, spacing } from "@/src/theme";

interface RecorderControlsProps {
  phase: RecorderPhase;
  durationMs: number;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export function RecorderControls({
  phase,
  durationMs,
  onStart,
  onStop,
  disabled,
}: RecorderControlsProps) {
  const recording = phase === "recording";
  const showButton = phase === "idle" || phase === "recording";

  return (
    <View style={styles.wrap}>
      <Text style={styles.timer}>{formatDuration(durationMs)}</Text>
      {showButton ? (
        <Pressable
          onPress={recording ? onStop : onStart}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={recording ? "Stop recording" : "Start recording"}
          style={({ pressed }) => [
            styles.button,
            recording && styles.buttonRecording,
            pressed && !disabled && styles.pressed,
            disabled && styles.disabled,
          ]}
        >
          {recording ? (
            <View style={styles.stopIcon} />
          ) : (
            <Icon name="mic" size={36} color="#fff" />
          )}
        </Pressable>
      ) : null}
      {recording ? (
        <View style={styles.recordingDot}>
          <View style={styles.dot} />
          <Text variant="caption" style={styles.recordingText}>
            REC
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: spacing.lg,
  },
  timer: {
    fontSize: 40,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    color: colors.foreground,
  },
  button: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: colors.destructive,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 6px 14px rgba(15, 23, 42, 0.18)",
  },
  buttonRecording: {
    backgroundColor: "#dc2626",
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.5 },
  stopIcon: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  recordingDot: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.destructive,
  },
  recordingText: { color: colors.destructive, fontWeight: "600" },
});
