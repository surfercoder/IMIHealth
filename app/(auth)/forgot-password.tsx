import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  FormField,
  Icon,
  Input,
  Screen,
  Text,
} from "@/src/components/ui";
import { supabase } from "@/src/lib/supabase";
import { colors, spacing } from "@/src/theme";

type Values = { email: string };

export default function ForgotPasswordScreen() {
  const { back, replace } = useRouter();
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schema = z.object({
    email: z
      .string()
      .min(1, t("validation.emailRequired"))
      .email(t("validation.emailInvalid")),
  });

  const { control, handleSubmit } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: Values) {
    setError(null);
    setSubmitting(true);
    const { error: e } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: "imihealth://auth/confirm?next=/reset-password",
    });
    setSubmitting(false);
    if (e) {
      setError(e.message);
      return;
    }
    setSuccess(true);
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
          <Pressable onPress={() => back()} hitSlop={8} style={styles.back}>
            <Icon name="arrow-back" size={20} color={colors.foreground} />
          </Pressable>

          <View style={styles.heading}>
            <Text variant="title">{t("forgotPasswordForm.title")}</Text>
            <Text variant="subtitle">
              {t("forgotPasswordForm.description")}
            </Text>
          </View>

          {success ? (
            <View style={styles.successBox}>
              <Text variant="label">{t("forgotPasswordForm.successTitle")}</Text>
              <Text variant="bodyMuted" style={styles.successBody}>
                {t("forgotPasswordForm.successMessage")}
              </Text>
              <Button
                title={t("forgotPasswordForm.backToLogin")}
                variant="outline"
                fullWidth
                onPress={() => replace("/login")}
              />
            </View>
          ) : (
            <View style={styles.form}>
              <Controller
                control={control}
                name="email"
                render={({ field: { value, onChange, onBlur }, fieldState }) => (
                  <FormField
                    label={t("forgotPasswordForm.email")}
                    error={fieldState.error?.message}
                  >
                    <Input
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholder={t("forgotPasswordForm.emailPlaceholder")}
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
                    ? t("forgotPasswordForm.submitting")
                    : t("forgotPasswordForm.submit")
                }
                onPress={handleSubmit(onSubmit)}
                loading={submitting}
                fullWidth
                size="lg"
              />
            </View>
          )}
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
  back: { alignSelf: "flex-start" },
  heading: { gap: spacing.xs, marginTop: spacing.md },
  form: { gap: spacing.md, marginTop: spacing.lg },
  successBox: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    gap: spacing.md,
  },
  successBody: { lineHeight: 20 },
  error: { color: colors.destructive },
});
