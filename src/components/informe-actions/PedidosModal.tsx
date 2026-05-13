import { useCallback, useMemo, useReducer } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Button, Card, CardContent, FormField, Icon, Input, Text } from "@/src/components/ui";
import { sharePdf } from "@/src/lib/api/pdf";
import { sendPedidosWhatsApp } from "@/src/lib/api/whatsapp";
import {
  extractEstudiosSolicitados,
  parsePedidoItems,
} from "@/src/lib/informe-extract";
import { colors, spacing } from "@/src/theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  informeId: string;
  patientName: string;
  patientPhone: string | null;
  informeDoctor: string | null;
}

interface State {
  itemsText: string;
  waSending: boolean;
  generated: string[] | null;
  downloadingIndex: number | null;
  mergedBusy: boolean;
}

type Action =
  | { type: "reset"; defaultItems: string }
  | { type: "setItemsText"; value: string }
  | { type: "setGenerated"; items: string[] }
  | { type: "setDownloadingIndex"; index: number | null }
  | { type: "setMergedBusy"; busy: boolean }
  | { type: "setWaSending"; busy: boolean };

function initialState(defaultItems: string): State {
  return {
    itemsText: defaultItems,
    waSending: false,
    generated: null,
    downloadingIndex: null,
    mergedBusy: false,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "reset":
      return initialState(action.defaultItems);
    case "setItemsText":
      return { ...state, itemsText: action.value };
    case "setGenerated":
      return { ...state, generated: action.items };
    case "setDownloadingIndex":
      return { ...state, downloadingIndex: action.index };
    case "setMergedBusy":
      return { ...state, mergedBusy: action.busy };
    case "setWaSending":
      return { ...state, waSending: action.busy };
  }
}

interface PedidoRowProps {
  index: number;
  item: string;
  downloading: boolean;
  buttonLabel: string;
  onShare: (index: number) => void;
}

function PedidoRow({ index, item, downloading, buttonLabel, onShare }: PedidoRowProps) {
  const handlePress = useCallback(() => onShare(index), [index, onShare]);
  return (
    <View style={styles.itemRow}>
      <Text style={styles.itemText} numberOfLines={2}>
        {item}
      </Text>
      <Button
        title={buttonLabel}
        variant="outline"
        size="sm"
        loading={downloading}
        onPress={handlePress}
      />
    </View>
  );
}

export function PedidosModal({
  visible,
  onClose,
  informeId,
  patientName,
  patientPhone,
  informeDoctor,
}: Props) {
  const { t, i18n } = useTranslation();
  const defaultItems = useMemo(
    () => extractEstudiosSolicitados(informeDoctor),
    [informeDoctor],
  );
  const [state, dispatch] = useReducer(reducer, defaultItems, initialState);
  const { itemsText, waSending, generated, downloadingIndex, mergedBusy } = state;

  const items = parsePedidoItems(itemsText);
  const count = items.length;

  function handleGenerate() {
    dispatch({ type: "setGenerated", items });
  }

  const handleShareItem = useCallback(
    async (index: number) => {
      dispatch({ type: "setDownloadingIndex", index });
      try {
        await sharePdf({ kind: "pedido", informeId, item: items[index] });
      } catch (e) {
        Alert.alert(t("common.error"), e instanceof Error ? e.message : String(e));
      } finally {
        dispatch({ type: "setDownloadingIndex", index: null });
      }
    },
    [informeId, items, t],
  );

  async function handleShareMerged() {
    dispatch({ type: "setMergedBusy", busy: true });
    try {
      await sharePdf({ kind: "pedidos", informeId, items });
    } catch (e) {
      Alert.alert(t("common.error"), e instanceof Error ? e.message : String(e));
    } finally {
      dispatch({ type: "setMergedBusy", busy: false });
    }
  }

  async function handleSendWhatsApp() {
    dispatch({ type: "setWaSending", busy: true });
    try {
      const res = await sendPedidosWhatsApp({
        to: patientPhone!,
        informeId,
        patientName,
        locale: i18n.language ?? "es",
        pedidoItems: items,
      });
      if (res.success) {
        Alert.alert(
          t("whatsappPedidosButton.successTitle"),
          t("whatsappPedidosButton.successMessage", {
            patientName,
            count: items.length,
          }),
        );
      } else {
        Alert.alert(
          t("whatsappPedidosButton.errorTitle"),
          res.error ?? t("whatsappPedidosButton.errorMessage"),
        );
      }
    } catch (e) {
      Alert.alert(
        t("whatsappPedidosButton.errorTitle"),
        e instanceof Error ? e.message : t("whatsappPedidosButton.errorMessage"),
      );
    } finally {
      dispatch({ type: "setWaSending", busy: false });
    }
  }

  function resetForm() {
    dispatch({ type: "reset", defaultItems });
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onShow={() => dispatch({ type: "reset", defaultItems })}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text variant="title">{t("pedidos.title")}</Text>
            <Text variant="bodyMuted">
              {t("pedidos.description", { patientName })}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityLabel={t("common.cancel")}
            hitSlop={8}
            style={styles.closeBtn}
          >
            <Icon name="close" size={24} color={colors.foreground} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {generated ? (
            <Card>
              <CardContent>
                <Text variant="label">{t("pedidos.generatedTitle")}</Text>
                <Text variant="bodyMuted">
                  {t("pedidos.generatedDescription", { count: generated.length })}
                </Text>
                <View style={styles.itemList}>
                  {generated.map((item, idx) => (
                    <PedidoRow
                      key={item}
                      index={idx}
                      item={item}
                      downloading={downloadingIndex === idx}
                      buttonLabel={t("pedidos.viewOnline")}
                      onShare={handleShareItem}
                    />
                  ))}
                </View>
                <View style={styles.successActions}>
                  <Button
                    title={t("informePage.viewPdf")}
                    variant="outline"
                    leftIcon={
                      <Icon
                        name="documents-outline"
                        size={16}
                        color={colors.foreground}
                      />
                    }
                    onPress={handleShareMerged}
                    loading={mergedBusy}
                  />
                  {patientPhone ? (
                    <Button
                      title={t("whatsappPedidosButton.label")}
                      onPress={handleSendWhatsApp}
                      loading={waSending}
                      leftIcon={
                        <Icon
                          name="logo-whatsapp"
                          size={16}
                          color={colors.primaryForeground}
                        />
                      }
                    />
                  ) : null}
                  <Button
                    title={t("pedidos.generateAnother")}
                    variant="ghost"
                    onPress={resetForm}
                  />
                </View>
              </CardContent>
            </Card>
          ) : (
            <FormField
              label={t("pedidos.itemsLabel")}
              hint={t("pedidos.itemsHint", { count })}
            >
              <Input
                placeholder={t("pedidos.itemsPlaceholder")}
                value={itemsText}
                onChangeText={(value) => dispatch({ type: "setItemsText", value })}
                multiline
                numberOfLines={8}
                style={styles.multiline}
              />
            </FormField>
          )}
        </ScrollView>

        {!generated ? (
          <View style={styles.footer}>
            <Button
              title={t("pedidos.cancel")}
              variant="outline"
              onPress={onClose}
            />
            <Button
              title={t("pedidos.generate", { count })}
              onPress={handleGenerate}
              disabled={count === 0}
              leftIcon={
                <Icon
                  name="document-text-outline"
                  size={16}
                  color={colors.primaryForeground}
                />
              }
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: { flex: 1 },
  closeBtn: { padding: spacing.xs },
  body: { padding: spacing.xl, gap: spacing.lg },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  multiline: {
    minHeight: 160,
    textAlignVertical: "top",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    fontSize: 13,
  },
  itemList: { marginTop: spacing.md, gap: spacing.sm },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  itemText: { flex: 1 },
  successActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
