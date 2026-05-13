import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Controller, type Control } from "react-hook-form";
import { FormField, Input, PasswordInput, Select } from "@/src/components/ui";
import { AvatarPicker } from "@/src/components/AvatarPicker";
import { SignaturePad } from "@/src/components/SignaturePad";
import { ESPECIALIDADES } from "@/src/lib/especialidades";
import { getDoctorInitials } from "@/src/utils/avatar";
import { spacing } from "@/src/theme";

export interface SignupFormValues {
  name: string;
  email: string;
  dni: string;
  matricula: string;
  phone: string;
  especialidad: string;
  tagline: string;
  avatar: string;
  firmaDigital: string;
  password: string;
  confirmPassword: string;
}

interface SignupFieldsProps {
  control: Control<SignupFormValues>;
  nameValue: string;
}

export function SignupFields({ control, nameValue }: SignupFieldsProps) {
  const { t } = useTranslation();

  const especialidadOptions = useMemo(
    () =>
      ESPECIALIDADES.map((value) => ({
        value,
        label: t(`signupForm.specialties.${value}` as never, {
          defaultValue: value,
        }) as string,
      })),
    [t],
  );

  return (
    <>
      <Controller
        control={control}
        name="avatar"
        render={({ field: { value, onChange } }) => (
          <FormField label={t("signupForm.avatar")}>
            <AvatarPicker
              value={value || null}
              initials={getDoctorInitials(nameValue)}
              onChange={(dataUrl) => onChange(dataUrl ?? "")}
            />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="name"
        render={({ field: { value, onChange, onBlur }, fieldState }) => (
          <FormField
            label={t("signupForm.fullName")}
            error={fieldState.error?.message}
            required
          >
            <Input
              placeholder={t("signupForm.fullNamePlaceholder")}
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
            label={t("signupForm.dni")}
            error={fieldState.error?.message}
          >
            <Input
              keyboardType="number-pad"
              placeholder={t("signupForm.dniPlaceholder")}
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
            label={t("signupForm.email")}
            error={fieldState.error?.message}
            required
          >
            <Input
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={t("signupForm.emailPlaceholder")}
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
            label={t("signupForm.phone")}
            error={fieldState.error?.message}
            required
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
        name="matricula"
        render={({ field: { value, onChange, onBlur }, fieldState }) => (
          <FormField
            label={t("signupForm.matricula")}
            error={fieldState.error?.message}
            required
          >
            <Input
              keyboardType="number-pad"
              placeholder={t("signupForm.matriculaPlaceholder")}
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
        name="especialidad"
        render={({ field: { value, onChange }, fieldState }) => (
          <FormField
            label={t("signupForm.specialty")}
            error={fieldState.error?.message}
            required
          >
            <Select
              value={value || null}
              onChange={onChange}
              options={especialidadOptions}
              placeholder={t("signupForm.specialtyPlaceholder")}
              searchPlaceholder={t("signupForm.searchSpecialty")}
              emptyLabel={t("signupForm.specialtyNotFound")}
              invalid={!!fieldState.error}
            />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="tagline"
        render={({ field: { value, onChange, onBlur }, fieldState }) => (
          <FormField
            label={t("signupForm.tagline")}
            hint={t("signupForm.taglineHint")}
            error={fieldState.error?.message}
          >
            <Input
              placeholder={t("signupForm.taglinePlaceholder")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              invalid={!!fieldState.error}
              multiline
              numberOfLines={2}
              maxLength={200}
              style={styles.textarea}
            />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="firmaDigital"
        render={({ field: { value, onChange } }) => (
          <FormField label={t("signatureField.label")}>
            <SignaturePad
              value={value || null}
              onChange={(dataUrl) => onChange(dataUrl ?? "")}
            />
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { value, onChange, onBlur }, fieldState }) => (
          <FormField
            label={t("signupForm.password")}
            error={fieldState.error?.message}
            required
          >
            <PasswordInput
              placeholder={t("signupForm.passwordPlaceholder")}
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
            label={t("signupForm.confirmPassword")}
            error={fieldState.error?.message}
            required
          >
            <PasswordInput
              placeholder={t("signupForm.confirmPasswordPlaceholder")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              invalid={!!fieldState.error}
            />
          </FormField>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  textarea: {
    minHeight: 60,
    textAlignVertical: "top",
    paddingTop: spacing.sm,
  },
});
