import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Text } from "@/src/components/ui";
import { MarkdownView } from "./MarkdownView";
import { colors, fontSize, radius, spacing } from "@/src/theme";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  minHeight?: number;
}

type Mode = "edit" | "preview";

export function MarkdownEditor({
  value,
  onChange,
  disabled,
  minHeight = 240,
}: MarkdownEditorProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>("edit");

  return (
    <View>
      <View style={styles.tabs}>
        <Tab
          label={t("common.edit")}
          active={mode === "edit"}
          onPress={() => setMode("edit")}
        />
        <Tab
          label={t("informePage.transcript", { defaultValue: "Preview" })}
          active={mode === "preview"}
          onPress={() => setMode("preview")}
        />
      </View>
      {mode === "edit" ? (
        <TextInput
          value={value}
          onChangeText={onChange}
          multiline
          editable={!disabled}
          textAlignVertical="top"
          style={[styles.input, { minHeight }]}
          placeholder=""
          placeholderTextColor={colors.mutedForeground}
        />
      ) : (
        <View style={[styles.preview, { minHeight }]}>
          {value.trim() ? (
            <MarkdownView content={value} />
          ) : (
            <Text variant="bodyMuted">{t("common.noContent")}</Text>
          )}
        </View>
      )}
    </View>
  );
}

function Tab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tab, active && styles.tabActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text
        style={[styles.tabLabel, active && styles.tabLabelActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.sm,
    alignSelf: "flex-start",
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: colors.background,
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
  },
  tabLabel: { fontSize: fontSize.sm, color: colors.mutedForeground },
  tabLabelActive: { color: colors.foreground, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.foreground,
    fontSize: fontSize.base,
    lineHeight: 22,
    backgroundColor: colors.background,
  },
  preview: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
});
