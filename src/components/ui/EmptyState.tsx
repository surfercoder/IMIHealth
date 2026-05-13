import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { spacing } from "@/src/theme";
import { Text } from "./Text";

interface EmptyStateProps {
  title: string;
  description?: string;
  image?: number;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, image, action }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      {image ? <Image source={image} style={styles.image} contentFit="contain" /> : null}
      <Text variant="title" center>
        {title}
      </Text>
      {description ? (
        <Text variant="subtitle" center>
          {description}
        </Text>
      ) : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: spacing["3xl"],
    paddingHorizontal: spacing.lg,
  },
  image: {
    width: 160,
    height: 160,
    marginBottom: spacing.sm,
  },
  action: { marginTop: spacing.lg },
});
