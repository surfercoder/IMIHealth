import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  type ListRenderItem,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { colors, fontSize, radius, spacing } from "@/src/theme";
import { Text } from "./Text";
import { Input } from "./Input";
import { Icon } from "./Icon";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  value: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  invalid?: boolean;
  searchable?: boolean;
}

interface OptionRowProps {
  item: SelectOption;
  selected: boolean;
  onSelect: (value: string) => void;
}

function OptionRow({ item, selected, onSelect }: OptionRowProps) {
  const handlePress = useCallback(() => onSelect(item.value), [item.value, onSelect]);
  return (
    <Pressable
      onPress={handlePress}
      style={[styles.option, selected && styles.optionActive]}
    >
      <Text variant="body">{item.label}</Text>
      {selected ? (
        <Icon name="checkmark" size={18} color={colors.primary} />
      ) : null}
    </Pressable>
  );
}

export function Select({
  value,
  options,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  invalid,
  searchable = true,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!searchable || !q.trim()) return options;
    const needle = q.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(needle));
  }, [q, options, searchable]);

  const selected = options.find((o) => o.value === value);

  const handleSelect = useCallback(
    (nextValue: string) => {
      onChange(nextValue);
      setQ("");
      setOpen(false);
    },
    [onChange],
  );

  const renderItem = useCallback<ListRenderItem<SelectOption>>(
    ({ item }) => (
      <OptionRow item={item} selected={item.value === value} onSelect={handleSelect} />
    ),
    [value, handleSelect],
  );

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.trigger, invalid && styles.invalid]}
      >
        <Text
          style={selected ? styles.value : styles.placeholder}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder ?? ""}
        </Text>
        <Icon name="chevron-down" size={18} color={colors.mutedForeground} />
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            {searchable ? (
              <Input
                placeholder={searchPlaceholder}
                value={q}
                onChangeText={setQ}
                autoCapitalize="none"
              />
            ) : null}
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.value}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text variant="bodyMuted">{emptyLabel}</Text>
                </View>
              }
              renderItem={renderItem}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  invalid: { borderColor: colors.destructive },
  value: { color: colors.foreground, fontSize: fontSize.base, flex: 1 },
  placeholder: { color: colors.mutedForeground, fontSize: fontSize.base, flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing["2xl"],
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: "75%",
    gap: spacing.md,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  optionActive: {
    backgroundColor: colors.secondary,
  },
  empty: { padding: spacing.lg, alignItems: "center" },
});
