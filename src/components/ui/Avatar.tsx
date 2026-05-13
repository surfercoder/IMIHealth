import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { colors, fontSize, fontWeight, radius } from "@/src/theme";
import { Text } from "./Text";

interface AvatarProps {
  uri?: string | null;
  initials?: string;
  size?: number;
}

export function Avatar({ uri, initials, size = 36 }: AvatarProps) {
  const dimension = { width: size, height: size, borderRadius: radius.full };
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, dimension]}
        accessibilityIgnoresInvertColors
      />
    );
  }
  return (
    <View style={[styles.fallback, dimension]}>
      <Text style={[styles.initials, { fontSize: Math.max(11, size * 0.4) }]}>
        {(initials ?? "").slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.secondary,
  },
  fallback: {
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: colors.secondaryForeground,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.sm,
  },
});
