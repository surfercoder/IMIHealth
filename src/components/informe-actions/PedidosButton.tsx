import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/src/components/ui";
import { ActionIconButton } from "./ActionIconButton";
import { PedidosModal } from "./PedidosModal";
import { colors } from "@/src/theme";

interface Props {
  informeId: string;
  patientName: string;
  patientPhone: string | null;
  informeDoctor: string | null;
}

export function PedidosButton(props: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <ActionIconButton
        onPress={() => setOpen(true)}
        accessibilityLabel={t("informeEditor.generatePedidos")}
        tone="emerald"
      >
        <Icon name="clipboard-outline" size={20} color={colors.chart2} />
      </ActionIconButton>
      <PedidosModal visible={open} onClose={() => setOpen(false)} {...props} />
    </>
  );
}
