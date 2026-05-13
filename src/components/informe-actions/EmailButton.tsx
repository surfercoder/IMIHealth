import { useState } from "react";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "@/src/components/ui";
import { ActionIconButton } from "./ActionIconButton";
import { sendEmail } from "@/src/lib/api/email";
import { doctorReportEmail, patientReportEmail } from "@/src/lib/email-template";
import { colors } from "@/src/theme";

type Variant = "doctor" | "patient";

interface EmailButtonProps {
  variant: Variant;
  email: string;
  doctorName: string;
  patientName?: string;
  reportContent: string;
}

export function EmailButton({
  variant,
  email,
  doctorName,
  patientName,
  reportContent,
}: EmailButtonProps) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const tone = variant === "patient" ? "emerald" : "default";
  const tint = tone === "emerald" ? colors.chart2 : colors.foreground;

  async function handleSend() {
    setBusy(true);
    try {
      const html =
        variant === "doctor"
          ? doctorReportEmail({
              reportContent,
              labels: {
                greeting: t("emailButton.emailGreeting", { doctorName }),
                intro: t("emailButton.emailIntro"),
                disclaimer: t("emailButton.emailDisclaimer"),
                preheader: t("emailButton.emailPreheader", { doctorName }),
                footerTagline: t("emailButton.emailFooterTagline"),
              },
            })
          : patientReportEmail({
              reportContent,
              labels: {
                greeting: t("patientEmailButton.emailGreeting", {
                  patientName: patientName ?? "",
                }),
                intro: t("patientEmailButton.emailIntro", { doctorName }),
                disclaimer: t("patientEmailButton.emailDisclaimer"),
                preheader: t("patientEmailButton.emailPreheader", {
                  patientName: patientName ?? "",
                }),
                footerTagline: t("patientEmailButton.emailFooterTagline"),
              },
            });

      const subject =
        variant === "doctor"
          ? t("emailButton.subject", { doctorName })
          : t("patientEmailButton.subject", { doctorName });

      const res = await sendEmail({
        to: email,
        subject,
        text: reportContent,
        html,
      });

      if (res.success) {
        Alert.alert(
          variant === "doctor"
            ? t("emailButton.successTitle")
            : t("patientEmailButton.successTitle"),
          variant === "doctor"
            ? t("emailButton.successMessage", { doctorName })
            : t("patientEmailButton.successMessage", { patientName: patientName ?? "" }),
        );
      } else {
        Alert.alert(
          t("informeEditor.emailError"),
          res.error ?? t("informeEditor.emailSendFailed"),
        );
      }
    } catch {
      Alert.alert(t("informeEditor.emailError"), t("informeEditor.emailErrorUnexpected"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ActionIconButton
      onPress={handleSend}
      loading={busy}
      accessibilityLabel={t("informeEditor.sendEmail")}
      tone={tone}
    >
      <Icon name="mail-outline" size={20} color={tint} />
    </ActionIconButton>
  );
}
