import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius } from "@/src/theme";

interface ActionIconButtonProps {
  onPress: () => void;
  accessibilityLabel: string;
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  tone?: "default" | "emerald";
}

export function ActionIconButton({
  onPress,
  accessibilityLabel,
  children,
  loading,
  disabled,
  style,
  tone = "default",
}: ActionIconButtonProps) {
  const isDisabled = disabled || loading;
  const tint = tone === "emerald" ? colors.chart2 : colors.foreground;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: !!loading }}
      android_ripple={{ color: "rgba(0,0,0,0.08)", borderless: true, radius: 18 }}
      style={({ pressed }) => [
        styles.btn,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      hitSlop={6}
    >
      {loading ? <ActivityIndicator size="small" color={tint} /> : <View>{children}</View>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { backgroundColor: colors.secondary },
  disabled: { opacity: 0.5 },
});
