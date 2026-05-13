import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  FormField,
  Input,
} from "@/src/components/ui";
import type { PatientInput } from "@/src/lib/api/patients";
import { spacing } from "@/src/theme";

interface PatientFormProps {
  initial?: Partial<PatientInput>;
  onSubmit: (values: PatientInput) => Promise<void> | void;
  onCancel?: () => void;
  submitting?: boolean;
  submitLabel?: string;
}

interface FormValues {
  name: string;
  dni: string;
  dob: string;
  phone: string;
  email: string;
  obra_social: string;
  nro_afiliado: string;
  plan: string;
}

const empty: FormValues = {
  name: "",
  dni: "",
  dob: "",
  phone: "",
  email: "",
  obra_social: "",
  nro_afiliado: "",
  plan: "",
};

export function PatientForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
  submitLabel,
}: PatientFormProps) {
  const { t } = useTranslation();

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(2, t("nuevoInformeDialog.validation.nameTooShort")),
        dni: z
          .string()
          .trim()
          .regex(/^\d{7,8}$/u, t("nuevoInformeDialog.validation.dniInvalid"))
          .or(z.literal("")),
        dob: z.string(),
        phone: z
          .string()
          .trim()
          .regex(/^\+?[\d\s\-().]{0,20}$/u, t("nuevoInformeDialog.validation.phoneInvalid"))
          .or(z.literal("")),
        email: z
          .string()
          .trim()
          .email(t("nuevoInformeDialog.validation.emailInvalid"))
          .or(z.literal("")),
        obra_social: z.string(),
        nro_afiliado: z.string(),
        plan: z.string(),
      }),
    [t],
  );

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...empty,
      name: initial?.name ?? empty.name,
      dni: initial?.dni ?? empty.dni,
      dob: initial?.dob ?? empty.dob,
      phone: initial?.phone ?? empty.phone,
      email: initial?.email ?? empty.email,
      obra_social: initial?.obra_social ?? empty.obra_social,
      nro_afiliado: initial?.nro_afiliado ?? empty.nro_afiliado,
      plan: initial?.plan ?? empty.plan,
    },
  });

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="name"
        render={({ field: { value, onChange, onBlur }, fieldState }) => (
          <FormField
            label={t("nuevoInformeDialog.fullName")}
            error={fieldState.error?.message}
            required
          >
            <Input
              placeholder={t("nuevoInformeDialog.fullNamePlaceholder")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              invalid={!!fieldState.error}
              autoCapitalize="words"
            />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="dni"
        render={({ field: { value, onChange, onBlur }, fieldState }) => (
          <FormField
            label={t("nuevoInformeDialog.dni")}
            error={fieldState.error?.message}
          >
            <Input
              keyboardType="number-pad"
              placeholder={t("nuevoInformeDialog.dniPlaceholder")}
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
        name="phone"
        render={({ field: { value, onChange, onBlur }, fieldState }) => (
          <FormField
            label={t("nuevoInformeDialog.phone")}
            error={fieldState.error?.message}
            hint={t("nuevoInformeDialog.phoneHint")}
          >
            <Input
              keyboardType="phone-pad"
              placeholder={t("signupForm.phonePlaceholder")}
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
        name="email"
        render={({ field: { value, onChange, onBlur }, fieldState }) => (
          <FormField
            label={t("nuevoInformeDialog.email")}
            error={fieldState.error?.message}
          >
            <Input
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={t("nuevoInformeDialog.emailPlaceholder")}
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
        name="dob"
        render={({ field: { value, onChange, onBlur } }) => (
          <FormField label={t("nuevoInformeDialog.dob")}>
            <Input
              placeholder="YYYY-MM-DD"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="obra_social"
        render={({ field: { value, onChange, onBlur } }) => (
          <FormField label={t("nuevoInformeDialog.obraSocial")}>
            <Input
              placeholder={t("nuevoInformeDialog.obraSocialPlaceholder")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="nro_afiliado"
        render={({ field: { value, onChange, onBlur } }) => (
          <FormField label={t("nuevoInformeDialog.nroAfiliado")}>
            <Input
              placeholder={t("nuevoInformeDialog.nroAfiliadoPlaceholder")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="plan"
        render={({ field: { value, onChange, onBlur } }) => (
          <FormField label={t("nuevoInformeDialog.plan")}>
            <Input
              placeholder={t("nuevoInformeDialog.planPlaceholder")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          </FormField>
        )}
      />

      <View style={styles.actions}>
        {onCancel ? (
          <Button
            title={t("common.cancel")}
            variant="ghost"
            onPress={onCancel}
          />
        ) : null}
        <Button
          title={submitLabel ?? t("common.save")}
          loading={submitting}
          onPress={handleSubmit(async (values) => {
            await onSubmit({
              name: values.name,
              dni: values.dni || null,
              dob: values.dob || null,
              phone: values.phone || null,
              email: values.email || null,
              obra_social: values.obra_social || null,
              nro_afiliado: values.nro_afiliado || null,
              plan: values.plan || null,
            });
          })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
