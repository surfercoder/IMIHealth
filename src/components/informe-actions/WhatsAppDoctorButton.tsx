import { Alert, Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "@/src/components/ui";
import { ActionIconButton } from "./ActionIconButton";
import { colors } from "@/src/theme";

interface Props {
  phone: string;
  doctorName: string;
  reportContent: string;
}

export function WhatsAppDoctorButton({ phone, doctorName, reportContent }: Props) {
  const { t } = useTranslation();

  async function handlePress() {
    const message = t("doctorWhatsappButton.message", { doctorName, reportContent });
    const sanitized = phone.replace(/[^\d+]/g, "");
    const url = `https://wa.me/${sanitized}?text=${encodeURIComponent(message)}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert(t("doctorWhatsappButton.successTitle"), url);
        return;
      }
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert(
        t("common.error"),
        e instanceof Error ? e.message : String(e),
      );
    }
  }

  return (
    <ActionIconButton
      onPress={handlePress}
      accessibilityLabel={t("informeEditor.sendWhatsApp")}
    >
      <Icon name="logo-whatsapp" size={20} color={colors.foreground} />
    </ActionIconButton>
  );
}
