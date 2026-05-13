import { useMemo, useReducer } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Icon, Screen, Text } from "@/src/components/ui";
import { PlanChip } from "@/src/components/signup/PlanChip";
import {
  SignupFields,
  type SignupFormValues,
} from "@/src/components/signup/SignupFields";
import { supabase } from "@/src/lib/supabase";
import { ESPECIALIDADES } from "@/src/lib/especialidades";
import { STRONG_PASSWORD_RE } from "@/src/utils/password";
import { useCheckout } from "@/src/hooks/useCheckout";
import type { ProPlanTier } from "@/src/lib/api/billing";
import { colors, spacing } from "@/src/theme";

type Plan = "free" | ProPlanTier;

interface SignupState {
  plan: Plan;
  submitting: boolean;
  serverError: string | null;
  success: boolean;
}

type SignupAction =
  | { type: "setPlan"; plan: Plan }
  | { type: "submitStart" }
  | { type: "submitError"; message: string }
  | { type: "submitSuccess" }
  | { type: "submitDone" };

function reducer(state: SignupState, action: SignupAction): SignupState {
  switch (action.type) {
    case "setPlan":
      return { ...state, plan: action.plan };
    case "submitStart":
      return { ...state, submitting: true, serverError: null };
    case "submitError":
      return { ...state, submitting: false, serverError: action.message };
    case "submitSuccess":
      return { ...state, submitting: false, success: true };
    case "submitDone":
      return { ...state, submitting: false };
  }
}

const initialState: SignupState = {
  plan: "free",
  submitting: false,
  serverError: null,
  success: false,
};

export default function SignupScreen() {
  const { back, replace } = useRouter();
  const { t } = useTranslation();
  const checkout = useCheckout();
  const [state, dispatch] = useReducer(reducer, initialState);
  const { plan, submitting, serverError, success } = state;

  const schema = useMemo(
    () =>
      z
        .object({
          name: z.string().trim().min(2, t("validation.nameMin")),
          email: z
            .string()
            .min(1, t("validation.emailRequired"))
            .email(t("validation.emailInvalid")),
          dni: z
            .string()
            .trim()
            .refine((v) => v === "" || /^\d{7,8}$/.test(v), {
              message: t("validation.dniFormat"),
            }),
          matricula: z
            .string()
            .trim()
            .min(1, t("validation.matriculaRequired"))
            .regex(/^\d+$/, t("validation.matriculaFormat")),
          phone: z
            .string()
            .trim()
            .min(1, t("validation.phoneRequired"))
            .regex(/^\+?[\d\s\-().]{7,20}$/, t("validation.phoneInvalid")),
          especialidad: z
            .string()
            .min(1, t("validation.specialtyRequired"))
            .refine((v) => (ESPECIALIDADES as readonly string[]).includes(v), {
              message: t("validation.specialtyInvalid"),
            }),
          tagline: z.string().max(200, t("validation.taglineMax")),
          avatar: z.string(),
          firmaDigital: z.string(),
          password: z
            .string()
            .min(8, t("validation.passwordMin"))
            .regex(STRONG_PASSWORD_RE, t("validation.passwordWeak")),
          confirmPassword: z
            .string()
            .min(1, t("validation.confirmPasswordRequired")),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t("validation.passwordsMismatch"),
          path: ["confirmPassword"],
        }),
    [t],
  );

  const { control, handleSubmit, watch } = useForm<SignupFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      dni: "",
      matricula: "",
      phone: "",
      especialidad: "",
      tagline: "",
      avatar: "",
      firmaDigital: "",
      password: "",
      confirmPassword: "",
    },
  });

  const nameValue = watch("name");

  async function onSubmit(values: SignupFormValues) {
    dispatch({ type: "submitStart" });
    if (plan === "free") {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: "imihealth://auth/confirm?next=/",
          data: {
            name: values.name,
            dni: values.dni || null,
            matricula: values.matricula,
            phone: values.phone,
            especialidad: values.especialidad,
            tagline: values.tagline || null,
            avatar: values.avatar || null,
            firma_digital: values.firmaDigital || null,
          },
        },
      });
      if (error) {
        dispatch({ type: "submitError", message: error.message });
        return;
      }
      dispatch({ type: "submitSuccess" });
      return;
    }

    const result = await checkout.signupPro({
      name: values.name,
      email: values.email,
      password: values.password,
      confirmPassword: values.confirmPassword,
      matricula: values.matricula,
      phone: values.phone,
      especialidad: values.especialidad,
      dni: values.dni || undefined,
      tagline: values.tagline || undefined,
      avatar: values.avatar || undefined,
      firmaDigital: values.firmaDigital || undefined,
      plan,
    });
    if (!result.ok) {
      dispatch({
        type: "submitError",
        message: result.error ?? "Could not start checkout",
      });
    } else {
      dispatch({ type: "submitDone" });
    }
  }

  return success ? (
    <Screen>
      <View style={styles.successWrap}>
        <Icon name="mail-open-outline" size={64} color={colors.primary} />
        <Text variant="title" center>
          {t("signupForm.successTitle")}
        </Text>
        <Text variant="subtitle" center>
          {t("signupForm.successMessage")}
        </Text>
        <Button
          title={t("signupForm.backToLogin")}
          variant="outline"
          onPress={() => replace("/login")}
          fullWidth
        />
      </View>
    </Screen>
  ) : (
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
            <Text variant="title">{t("signupForm.title")}</Text>
            <Text variant="subtitle">{t("signupForm.description")}</Text>
          </View>

          <View style={styles.planRow}>
            <PlanChip
              label={t("planBadge.free")}
              active={plan === "free"}
              onPress={() => dispatch({ type: "setPlan", plan: "free" })}
            />
            <PlanChip
              label={"Pro Monthly"}
              active={plan === "pro_monthly"}
              onPress={() => dispatch({ type: "setPlan", plan: "pro_monthly" })}
            />
            <PlanChip
              label={"Pro Yearly"}
              active={plan === "pro_yearly"}
              onPress={() => dispatch({ type: "setPlan", plan: "pro_yearly" })}
            />
          </View>

          <View style={styles.form}>
            <SignupFields control={control} nameValue={nameValue} />

            {serverError ? (
              <Text style={styles.error}>{serverError}</Text>
            ) : null}

            <Button
              title={
                submitting
                  ? t("signupForm.creating")
                  : t("signupForm.submit")
              }
              loading={submitting}
              onPress={handleSubmit(onSubmit)}
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
  back: { alignSelf: "flex-start" },
  heading: { gap: spacing.xs, marginTop: spacing.md },
  form: { gap: spacing.md, marginTop: spacing.md },
  error: { color: colors.destructive },
  successWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  planRow: { flexDirection: "row", gap: spacing.sm },
});
