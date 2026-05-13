import { useState, type Ref } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";
import { colors, fontSize, radius, spacing } from "@/src/theme";
import { Icon } from "./Icon";

interface InputProps extends TextInputProps {
  invalid?: boolean;
  leftIcon?: React.ReactNode;
  rightAdornment?: React.ReactNode;
  ref?: Ref<TextInput>;
}

export function Input({
  invalid,
  leftIcon,
  rightAdornment,
  style,
  onFocus,
  onBlur,
  ref,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.wrap,
        focused && styles.wrapFocused,
        invalid && styles.wrapInvalid,
      ]}
    >
      {leftIcon ? <View style={styles.left}>{leftIcon}</View> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.mutedForeground}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[styles.input, leftIcon ? styles.inputWithLeft : null, style]}
        {...rest}
      />
      {rightAdornment ? <View style={styles.right}>{rightAdornment}</View> : null}
    </View>
  );
}

type PasswordInputProps = Omit<InputProps, "secureTextEntry">;

export function PasswordInput(props: PasswordInputProps) {
  const [show, setShow] = useState(false);
  return (
    <Input
      {...props}
      secureTextEntry={!show}
      autoCapitalize="none"
      autoCorrect={false}
      rightAdornment={
        <Pressable
          onPress={() => setShow((v) => !v)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={show ? "Hide password" : "Show password"}
        >
          <Icon
            name={show ? "eye-off-outline" : "eye-outline"}
            size={18}
            color={colors.mutedForeground}
          />
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  wrapFocused: {
    borderColor: colors.ring,
  },
  wrapInvalid: {
    borderColor: colors.destructive,
  },
  input: {
    flex: 1,
    color: colors.foreground,
    fontSize: fontSize.base,
    paddingVertical: spacing.sm,
  },
  inputWithLeft: { marginLeft: spacing.sm },
  left: { marginRight: spacing.sm },
  right: { marginLeft: spacing.sm },
});
