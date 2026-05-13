import { useEffect, type PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";
import * as Notifications from "expo-notifications";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/providers/AuthProvider";
import type { Informe } from "@/src/types";

export function RealtimeProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (!user) return undefined;

    const channel = supabase
      .channel(`informes:doctor=${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "informes",
          filter: `doctor_id=eq.${user.id}`,
        },
        (payload) => {
          const newRow = payload.new as Informe;
          const oldRow = payload.old as Informe;
          if (!newRow) return;
          const justCompleted =
            newRow.status === "completed" && oldRow?.status !== "completed";
          const justErrored =
            newRow.status === "error" && oldRow?.status !== "error";
          if (!justCompleted && !justErrored) return;

          Notifications.scheduleNotificationAsync({
            content: {
              title: t("informePage.title"),
              body: justCompleted
                ? (t("audioRecorder.stateDone") as string)
                : (t("informePage.errorProcessing") as string),
              data: { informeId: newRow.id },
            },
            trigger: null,
          }).catch(() => {});
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [user, t]);

  return <>{children}</>;
}
