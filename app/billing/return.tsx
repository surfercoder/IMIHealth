import { useEffect, useReducer } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Button, Icon, Screen, Text } from "@/src/components/ui";
import { api, ApiError } from "@/src/lib/api/client";
import { colors, spacing } from "@/src/theme";

type Status =
  | { kind: "processing" }
  | { kind: "ready" }
  | { kind: "unknown" }
  | { kind: "error"; message: string };

type Action = { type: "set"; state: Status };

function reducer(_: Status, action: Action): Status {
  return action.state;
}

const POLL_MS = 2500;
const MAX_POLLS = 30;

export default function BillingReturnScreen() {
  const { t } = useTranslation();
  const { replace } = useRouter();
  const params = useLocalSearchParams<{ ref?: string }>();
  const [state, dispatch] = useReducer(reducer, { kind: "processing" } as Status);

  useEffect(() => {
    if (!params.ref) {
      dispatch({ type: "set", state: { kind: "unknown" } });
      return undefined;
    }
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    async function poll() {
      attempts += 1;
      try {
        const res = await api.get<{ state: "processing" | "ready" | "unknown" }>(
          `/api/billing/signup-status?ref=${encodeURIComponent(params.ref!)}`,
        );
        if (cancelled) return;
        if (res.state === "ready") {
          dispatch({ type: "set", state: { kind: "ready" } });
          return;
        }
        if (res.state === "unknown") {
          dispatch({ type: "set", state: { kind: "unknown" } });
          return;
        }
        if (attempts >= MAX_POLLS) {
          dispatch({ type: "set", state: { kind: "processing" } });
          return;
        }
        timer = setTimeout(poll, POLL_MS);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof ApiError ? e.message : String(e);
        dispatch({ type: "set", state: { kind: "error", message: msg } });
      }
    }

    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [params.ref]);

  return (
    <Screen>
      <View style={styles.center}>
        {state.kind === "processing" && (
          <>
            <ActivityIndicator color={colors.primary} />
            <Text variant="title" center>
              {t("signupForm.redirectingTitle")}
            </Text>
            <Text variant="subtitle" center>
              {t("signupForm.redirectingMessage")}
            </Text>
          </>
        )}
        {state.kind === "ready" && (
          <>
            <Icon name="checkmark-circle" size={64} color={colors.success} />
            <Text variant="title" center>
              {t("signupForm.successTitle")}
            </Text>
            <Text variant="subtitle" center>
              {t("signupForm.successMessage")}
            </Text>
            <Button
              title={t("signupForm.backToLogin")}
              onPress={() => replace("/login")}
              fullWidth
            />
          </>
        )}
        {state.kind === "unknown" && (
          <>
            <Icon name="alert-circle" size={64} color={colors.warning} />
            <Text variant="title" center>
              {t("common.error")}
            </Text>
            <Button
              title={t("signupForm.backToLogin")}
              variant="outline"
              onPress={() => replace("/login")}
              fullWidth
            />
          </>
        )}
        {state.kind === "error" && (
          <>
            <Icon name="warning" size={48} color={colors.destructive} />
            <Text variant="title" center>
              {t("common.error")}
            </Text>
            <Text variant="subtitle" center>
              {state.message}
            </Text>
            <Button
              title={t("common.back")}
              variant="outline"
              onPress={() => replace("/landing")}
              fullWidth
            />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
});
