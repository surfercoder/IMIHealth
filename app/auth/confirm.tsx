import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import type { EmailOtpType } from "@supabase/supabase-js";
import { Button, Screen, Text } from "@/src/components/ui";
import { supabase } from "@/src/lib/supabase";
import { colors, spacing } from "@/src/theme";

// Supabase email confirmation links open imihealth://auth/confirm?... — this
// screen exchanges the link for a real session, mirroring web /auth/confirm.
export default function AuthConfirmScreen() {
  const params = useLocalSearchParams<{
    token_hash?: string;
    type?: string;
    code?: string;
    next?: string;
    error?: string;
    error_description?: string;
  }>();
  const { replace } = useRouter();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (params.error) {
        setError(params.error_description ?? params.error);
        return;
      }
      try {
        if (params.token_hash && params.type) {
          const { error: e } = await supabase.auth.verifyOtp({
            type: params.type as EmailOtpType,
            token_hash: params.token_hash,
          });
          if (e) throw e;
        } else if (params.code) {
          const { error: e } = await supabase.auth.exchangeCodeForSession(
            params.code,
          );
          if (e) throw e;
        } else {
          throw new Error("Missing confirmation token");
        }
        if (cancelled) return;
        const next = params.next ?? "/";
        replace(next as never);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Unknown error");
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [params.code, params.token_hash, params.type, params.next, params.error, params.error_description, replace]);

  return (
    <Screen>
      <View style={styles.center}>
        {error ? (
          <>
            <Text variant="title" center>
              {t("common.error")}
            </Text>
            <Text variant="subtitle" center>
              {error}
            </Text>
            <Button
              title={t("common.back")}
              variant="outline"
              onPress={() => replace("/landing")}
              fullWidth
            />
          </>
        ) : (
          <>
            <ActivityIndicator color={colors.primary} />
            <Text variant="subtitle">{t("common.loading")}</Text>
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
    gap: spacing.lg,
  },
});
