import { StyleSheet, View } from "react-native";
import { colors } from "@/src/theme";

export function Divider({ style }: { style?: object }) {
  return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    width: "100%",
  },
});
