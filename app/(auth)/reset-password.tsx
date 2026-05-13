import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  FormField,
  PasswordInput,
  Screen,
  Text,
} from "@/src/components/ui";
import { supabase } from "@/src/lib/supabase";
import { STRONG_PASSWORD_RE } from "@/src/utils/password";
import { colors, spacing } from "@/src/theme";

type Values = { password: string; confirmPassword: string };

export default function ResetPasswordScreen() {
  const { replace } = useRouter();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const schema = z
    .object({
      password: z
        .string()
        .min(8, t("validation.passwordMin"))
        .regex(STRONG_PASSWORD_RE, t("validation.passwordWeak")),
      confirmPassword: z.string().min(1, t("validation.confirmPasswordRequired")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("validation.passwordsMismatch"),
      path: ["confirmPassword"],
    });

  const { control, handleSubmit } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: Values) {
    setError(null);
    setSubmitting(true);
    const { error: e } = await supabase.auth.updateUser({
      password: values.password,
    });
    setSubmitting(false);
    if (e) {
      setError(e.message);
      return;
    }
    replace("/");
  }

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heading}>
            <Text variant="title">{t("resetPasswordForm.title")}</Text>
            <Text variant="subtitle">{t("resetPasswordForm.description")}</Text>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="password"
              render={({ field: { value, onChange, onBlur }, fieldState }) => (
                <FormField
                  label={t("resetPasswordForm.newPassword")}
                  error={fieldState.error?.message}
                >
                  <PasswordInput
                    placeholder={t("resetPasswordForm.newPasswordPlaceholder")}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    invalid={!!fieldState.error}
                  />
                </FormField>
              )}
            />
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { value, onChange, onBlur }, fieldState }) => (
                <FormField
                  label={t("resetPasswordForm.confirmPassword")}
                  error={fieldState.error?.message}
                >
                  <PasswordInput
                    placeholder={t("resetPasswordForm.confirmPasswordPlaceholder")}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    invalid={!!fieldState.error}
                  />
                </FormField>
              )}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              title={
                submitting
                  ? t("resetPasswordForm.submitting")
                  : t("resetPasswordForm.submit")
              }
              onPress={handleSubmit(onSubmit)}
              loading={submitting}
              fullWidth
              size="lg"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing["3xl"],
    gap: spacing.lg,
  },
  heading: { gap: spacing.xs },
  form: { gap: spacing.md, marginTop: spacing.md },
  error: { color: colors.destructive },
});
