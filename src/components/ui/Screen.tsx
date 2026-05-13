import { StyleSheet, View, type ViewProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { colors, spacing } from "@/src/theme";

interface ScreenProps extends ViewProps {
  padded?: boolean;
  edges?: Edge[];
  scroll?: boolean;
  /**
   * Set when the route renders a native Stack header — the header already
   * accounts for the top safe-area inset, so SafeAreaView should not add it
   * again.
   */
  hasHeader?: boolean;
}

export function Screen({
  padded = true,
  edges,
  hasHeader = false,
  style,
  children,
  ...rest
}: ScreenProps) {
  const resolvedEdges =
    edges ?? (hasHeader ? ["left", "right"] : ["top", "left", "right"]);
  return (
    <SafeAreaView edges={resolvedEdges} style={styles.safe}>
      <View
        style={[styles.container, padded && styles.padded, style]}
        {...rest}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  padded: { paddingHorizontal: spacing.xl },
});
