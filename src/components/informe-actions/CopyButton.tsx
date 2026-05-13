import { Alert } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useTranslation } from "react-i18next";
import { Icon } from "@/src/components/ui";
import { ActionIconButton } from "./ActionIconButton";
import { colors } from "@/src/theme";

export function CopyButton({ text, tone = "default" }: { text: string; tone?: "default" | "emerald" }) {
  const { t } = useTranslation();
  const tint = tone === "emerald" ? colors.chart2 : colors.foreground;

  async function handleCopy() {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert(t("common.copyToClipboard"), t("informes.copiedToClipboard"));
    } catch {
      Alert.alert(t("common.error"), t("informes.copyError"));
    }
  }

  return (
    <ActionIconButton onPress={handleCopy} accessibilityLabel={t("common.copyToClipboard")} tone={tone}>
      <Icon name="copy-outline" size={20} color={tint} />
    </ActionIconButton>
  );
}
