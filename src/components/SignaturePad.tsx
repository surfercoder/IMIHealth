import { useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import SignatureScreen, { type SignatureViewRef } from "react-native-signature-canvas";
import { Button, Icon, Text } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme";

interface SignaturePadProps {
  value?: string | null;
  onChange: (base64DataUrl: string | null) => void;
}

export function SignaturePad({ value, onChange }: SignaturePadProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const signatureRef = useRef<SignatureViewRef>(null);

  const handleOK = (signature: string) => {
    onChange(signature);
    setOpen(false);
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
  };

  const handleConfirm = () => {
    signatureRef.current?.readSignature();
  };

  return (
    <View>
      {value ? (
        <View style={styles.preview}>
          <Text variant="caption" color={colors.mutedForeground}>
            {t("profilePage.currentSignature")}
          </Text>
          <View style={styles.imageWrap}>
            <Image
              source={{ uri: value }}
              style={styles.image}
              contentFit="contain"
              accessibilityLabel={t("profilePage.signatureAlt")}
            />
          </View>
          <View style={styles.previewActions}>
            <Button
              title={t("profilePage.changeSignature")}
              variant="outline"
              size="sm"
              onPress={() => setOpen(true)}
            />
            <Pressable onPress={() => onChange(null)} hitSlop={8}>
              <Text style={styles.linkDestructive}>{t("common.delete")}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable onPress={() => setOpen(true)} style={styles.placeholder}>
          <Icon name="brush-outline" size={20} color={colors.mutedForeground} />
          <Text variant="bodyMuted">{t("signatureField.placeholder")}</Text>
        </Pressable>
      )}

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text variant="title">{t("signatureField.label")}</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <Icon name="close" size={24} color={colors.foreground} />
              </Pressable>
            </View>
            <View style={styles.canvasWrap}>
              <SignatureScreen
                ref={signatureRef}
                onOK={handleOK}
                webStyle={`.m-signature-pad { box-shadow: none; border: none; }
                  .m-signature-pad--body { border: 1px solid ${colors.border}; border-radius: 12px; }
                  .m-signature-pad--footer { display: none; }`}
                imageType="image/png"
                backgroundColor="rgba(255,255,255,1)"
                penColor={colors.foreground}
              />
            </View>
            <View style={styles.modalActions}>
              <Button title={t("signatureField.clear")} variant="outline" onPress={handleClear} />
              <Button title={t("common.save")} onPress={handleConfirm} />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    gap: spacing.sm,
  },
  imageWrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: "#ffffff",
    padding: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: "100%", height: 96 },
  previewActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  linkDestructive: { color: colors.destructive, fontWeight: "500" },
  placeholder: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  safeArea: { flex: 1, backgroundColor: colors.background },
  modal: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, gap: spacing.lg },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  canvasWrap: { flex: 1 },
  modalActions: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
});
