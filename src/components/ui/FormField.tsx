import { StyleSheet, View, type ViewProps } from "react-native";
import { colors, spacing } from "@/src/theme";
import { Text } from "./Text";

interface FormFieldProps extends ViewProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
}

export function FormField({
  label,
  hint,
  error,
  required,
  children,
  style,
  ...rest
}: FormFieldProps) {
  return (
    <View style={[styles.field, style]} {...rest}>
      {label ? (
        <Text variant="label">
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}
      {children}
      {error ? (
        <Text variant="caption" style={styles.error}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption">{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  required: { color: colors.destructive },
  error: { color: colors.destructive },
});
