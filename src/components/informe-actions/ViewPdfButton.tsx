import { useState } from "react";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "@/src/components/ui";
import { ActionIconButton } from "./ActionIconButton";
import { sharePdf } from "@/src/lib/api/pdf";
import { colors } from "@/src/theme";

export function ViewPdfButton({ informeId }: { informeId: string }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  async function handlePress() {
    setBusy(true);
    try {
      await sharePdf({ kind: "patient", informeId });
    } catch (e) {
      Alert.alert(t("common.error"), e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ActionIconButton
      onPress={handlePress}
      loading={busy}
      accessibilityLabel={t("informeEditor.viewPdf")}
      tone="emerald"
    >
      <Icon name="eye-outline" size={20} color={colors.chart2} />
    </ActionIconButton>
  );
}
