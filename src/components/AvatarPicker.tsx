import { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Avatar, Icon, Text } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme";

interface AvatarPickerProps {
  value?: string | null;
  initials?: string;
  onChange: (base64DataUrl: string | null) => void;
}

const MAX_BYTES = 5 * 1024 * 1024;

export function AvatarPicker({ value, initials, onChange }: AvatarPickerProps) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  async function pick() {
    setBusy(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("avatarUpload.invalidType"),
          "Please grant photo library access in Settings to upload an avatar.",
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];

      // Resize/compress for parity with web's sharp-based avatar pipeline.
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );
      if (!manipulated.base64) {
        Alert.alert(t("avatarUpload.processingFailed"));
        return;
      }
      const approxBytes = Math.floor((manipulated.base64.length * 3) / 4);
      if (approxBytes > MAX_BYTES) {
        Alert.alert(t("avatarUpload.tooLarge"));
        return;
      }
      onChange(`data:image/jpeg;base64,${manipulated.base64}`);
    } catch (e) {
      Alert.alert(
        t("avatarUpload.processingFailed"),
        e instanceof Error ? e.message : String(e),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Avatar uri={value ?? null} initials={initials} size={72} />
      <View style={styles.actions}>
        <Pressable onPress={pick} disabled={busy} hitSlop={8} style={styles.btn}>
          <Icon
            name={value ? "camera-reverse-outline" : "camera-outline"}
            size={16}
            color={colors.foreground}
          />
          <Text variant="small" weight="medium">
            {value ? t("avatarUpload.change") : t("avatarUpload.upload")}
          </Text>
        </Pressable>
        {value ? (
          <Pressable onPress={() => onChange(null)} hitSlop={8} style={styles.btn}>
            <Text style={styles.remove}>{t("avatarUpload.remove")}</Text>
          </Pressable>
        ) : null}
      </View>
      <Text variant="caption">{t("avatarUpload.hint")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: spacing.sm },
  actions: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  remove: { color: colors.destructive, fontWeight: "500" },
});
