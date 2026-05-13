import { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { colors, radius, spacing } from "@/src/theme";
import { Icon, Text } from "@/src/components/ui";
import { setAppLocale, SUPPORTED_LOCALES, type AppLocale } from "@/src/i18n";

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const current = (i18n.language?.split("-")[0] as AppLocale) ?? "es";

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={styles.trigger}
        accessibilityRole="button"
        accessibilityLabel={t("language.toggle")}
      >
        <Icon name="language" size={16} color={colors.foreground} />
        <Text variant="small" style={styles.label}>
          {current.toUpperCase()}
        </Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text variant="title">{t("language.label")}</Text>
            {SUPPORTED_LOCALES.map((code) => (
              <Pressable
                key={code}
                onPress={async () => {
                  await setAppLocale(code);
                  setOpen(false);
                }}
                style={[
                  styles.option,
                  current === code && styles.optionActive,
                ]}
              >
                <Text variant="body">{t(`language.${code}`)}</Text>
                {current === code ? (
                  <Icon name="checkmark" size={18} color={colors.primary} />
                ) : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { fontWeight: "500" },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.background,
    padding: spacing.xl,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    gap: spacing.md,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  optionActive: {
    backgroundColor: colors.secondary,
  },
});
