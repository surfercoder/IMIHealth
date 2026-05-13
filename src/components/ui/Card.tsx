import { StyleSheet, View, type ViewProps } from "react-native";
import { colors, radius, spacing } from "@/src/theme";
import { Text } from "./Text";

export function Card({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[styles.card, style]} />;
}

export function CardHeader({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[styles.header, style]} />;
}

export function CardContent({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[styles.content, style]} />;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text variant="title" style={styles.title}>
      {children}
    </Text>
  );
}

export function CardDescription({ children }: { children: React.ReactNode }) {
  return (
    <Text variant="subtitle" style={styles.description}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  header: {
    padding: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  content: {
    padding: spacing.xl,
    paddingTop: 0,
    gap: spacing.md,
  },
  title: { fontSize: 18, lineHeight: 24 },
  description: { marginTop: 2 },
});
