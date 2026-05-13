import { useState } from "react";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "@/src/components/ui";
import { ActionIconButton } from "./ActionIconButton";
import { sendInformeWhatsApp } from "@/src/lib/api/whatsapp";
import { colors } from "@/src/theme";

interface Props {
  phone: string;
  patientName: string;
  informeId: string;
}

export function WhatsAppPatientButton({ phone, patientName, informeId }: Props) {
  const { t, i18n } = useTranslation();
  const [busy, setBusy] = useState(false);

  async function handleSend() {
    setBusy(true);
    try {
      const res = await sendInformeWhatsApp({
        to: phone,
        informeId,
        patientName,
        locale: i18n.language ?? "es",
      });
      if (res.success) {
        Alert.alert(
          t("whatsappButton.successTitle"),
          t("whatsappButton.successMessage", { patientName }),
        );
      } else {
        Alert.alert(
          t("whatsappButton.errorTitle"),
          res.error ?? t("whatsappButton.errorMessage"),
        );
      }
    } catch (e) {
      Alert.alert(
        t("whatsappButton.errorTitle"),
        e instanceof Error ? e.message : t("whatsappButton.errorMessage"),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <ActionIconButton
      onPress={handleSend}
      loading={busy}
      accessibilityLabel={t("informeEditor.sendWhatsApp")}
      tone="emerald"
    >
      <Icon name="logo-whatsapp" size={20} color={colors.chart2} />
    </ActionIconButton>
  );
}
