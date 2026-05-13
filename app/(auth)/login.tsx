import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  FormField,
  Input,
  PasswordInput,
  Screen,
  Text,
} from "@/src/components/ui";
import { supabase } from "@/src/lib/supabase";
import { triggerWelcome } from "@/src/lib/authTransitions";
import { colors, spacing } from "@/src/theme";

const logo = require("@/assets/images/imihealth-logo.png");

type Values = { email: string; password: string };

export default function LoginScreen() {
  const { replace } = useRouter();
  const { t } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const schema = z.object({
    email: z
      .string()
      .min(1, t("validation.emailRequired"))
      .email(t("validation.emailInvalid")),
    password: z.string().min(1, t("validation.passwordRequired")),
  });

  const { control, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: Values) {
    setServerError(null);
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(values);
    setSubmitting(false);
    if (error) {
      setServerError(error.message);
      return;
    }
    triggerWelcome();
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
          <Image source={logo} style={styles.logo} contentFit="contain" />
          <View style={styles.heading}>
            <Text variant="title" center>
              {t("loginForm.title")}
            </Text>
            <Text variant="subtitle" center>
              {t("loginForm.description")}
            </Text>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { value, onChange, onBlur }, fieldState }) => (
                <FormField
                  label={t("loginForm.email")}
                  error={fieldState.error?.message}
                >
                  <Input
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    autoComplete="email"
                    textContentType="emailAddress"
                    placeholder={t("loginForm.emailPlaceholder")}
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
              name="password"
              render={({ field: { value, onChange, onBlur }, fieldState }) => (
                <FormField
                  label={t("loginForm.password")}
                  error={fieldState.error?.message}
                >
                  <PasswordInput
                    placeholder={t("loginForm.passwordPlaceholder")}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoComplete="current-password"
                    textContentType="password"
                    invalid={!!fieldState.error}
                  />
                </FormField>
              )}
            />

            {serverError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{serverError}</Text>
              </View>
            ) : null}

            <Button
              title={submitting ? t("loginForm.submitting") : t("loginForm.submit")}
              onPress={handleSubmit(onSubmit)}
              loading={submitting || formState.isSubmitting}
              fullWidth
              size="lg"
            />

            <Link href="/forgot-password" style={styles.forgot}>
              <Text variant="small">{t("loginForm.forgotPassword")}</Text>
            </Link>

            <View style={styles.footer}>
              <Text variant="small" color={colors.mutedForeground}>
                {t("loginForm.noAccount")}{" "}
              </Text>
              <Link href="/signup">
                <Text variant="small" weight="semibold">
                  {t("loginForm.register")}
                </Text>
              </Link>
            </View>
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
    paddingTop: spacing.xl,
    paddingBottom: spacing["3xl"],
    gap: spacing.lg,
  },
  logo: { width: 120, height: 38, alignSelf: "center" },
  heading: { gap: spacing.xs, marginTop: spacing.md },
  form: { gap: spacing.md, marginTop: spacing.lg },
  errorBox: {
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  errorText: { color: "#991b1b" },
  forgot: { alignSelf: "center", marginTop: spacing.xs },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
});
