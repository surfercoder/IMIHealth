import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  Avatar,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Divider,
  Icon,
  Screen,
  Text,
} from "@/src/components/ui";
import { LanguageSwitcher } from "@/src/components/LanguageSwitcher";
import { SignaturePad } from "@/src/components/SignaturePad";
import { useAuth } from "@/src/providers/AuthProvider";
import { useDoctor } from "@/src/hooks/useDoctor";
import { useCheckout } from "@/src/hooks/useCheckout";
import { updateDoctor } from "@/src/lib/api/doctors";
import { triggerGoodbye } from "@/src/lib/authTransitions";
import { getDoctorInitials } from "@/src/utils/avatar";
import { colors, spacing } from "@/src/theme";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { doctor, loading, setDoctor } = useDoctor();
  const checkout = useCheckout();
  const [signingOut, setSigningOut] = useState(false);
  const [upgrading, setUpgrading] = useState<"pro_monthly" | "pro_yearly" | null>(null);

  async function handleSignatureChange(firmaDigital: string | null) {
    if (!user || !doctor) return;
    const previous = doctor.firma_digital;
    setDoctor((prev) =>
      prev ? { ...prev, firma_digital: firmaDigital } : prev,
    );
    const updated = await updateDoctor(user.id, { firma_digital: firmaDigital });
    if (!updated) {
      setDoctor((prev) =>
        prev ? { ...prev, firma_digital: previous } : prev,
      );
      Alert.alert(t("common.error"));
    }
  }

  async function handleUpgrade(plan: "pro_monthly" | "pro_yearly") {
    setUpgrading(plan);
    const result = await checkout.upgradeExisting(plan);
    setUpgrading(null);
    if (!result.ok && result.error) {
      Alert.alert(t("common.error"), result.error);
    }
  }

  function handleSignOut() {
    setSigningOut(true);
    triggerGoodbye();
  }

  return (
    <Screen padded={false} hasHeader>
      <Stack.Screen
        options={{ title: t("profilePage.title"), headerShown: true }}
      />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.summary}>
            <Avatar
              uri={doctor?.avatar}
              initials={getDoctorInitials(doctor?.name)}
              size={72}
            />
            <View style={styles.summaryText}>
              <Text variant="title">{doctor?.name ?? t("welcome.defaultName")}</Text>
              <Text variant="subtitle">{user?.email}</Text>
              {doctor?.especialidad ? (
                <Text variant="caption">{doctor.especialidad}</Text>
              ) : null}
            </View>
          </View>

          <Card>
            <CardHeader>
              <CardTitle>{t("profilePage.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Row label={t("signupForm.matricula")} value={doctor?.matricula} />
              <Divider />
              <Row label={t("signupForm.phone")} value={doctor?.phone} />
              {doctor?.dni ? (
                <>
                  <Divider />
                  <Row label={t("signupForm.dni")} value={doctor.dni} />
                </>
              ) : null}
              {doctor?.tagline ? (
                <>
                  <Divider />
                  <Row label={t("signupForm.tagline")} value={doctor.tagline} />
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("profilePage.signatureSection")}</CardTitle>
            </CardHeader>
            <CardContent>
              <SignaturePad
                value={doctor?.firma_digital ?? null}
                onChange={handleSignatureChange}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("nav.pricing")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Text variant="bodyMuted">
                {t("publicLanding.pricingHint", {
                  defaultValue: "Upgrade to Pro for unlimited reports.",
                })}
              </Text>
              <View style={styles.planButtons}>
                <Button
                  title={"Pro Monthly"}
                  variant="outline"
                  size="sm"
                  loading={upgrading === "pro_monthly"}
                  onPress={() => handleUpgrade("pro_monthly")}
                />
                <Button
                  title={"Pro Yearly"}
                  size="sm"
                  loading={upgrading === "pro_yearly"}
                  onPress={() => handleUpgrade("pro_yearly")}
                />
              </View>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("language.label")}</CardTitle>
            </CardHeader>
            <CardContent>
              <LanguageSwitcher />
            </CardContent>
          </Card>

          <Button
            title={t("nav.logout")}
            variant="destructive"
            loading={signingOut}
            onPress={handleSignOut}
            leftIcon={
              <Icon name="log-out-outline" size={18} color="#fff" />
            }
            fullWidth
            size="lg"
          />
        </ScrollView>
      )}
    </Screen>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.row}>
      <Text variant="label">{label}</Text>
      <Text variant="body" numberOfLines={2} style={styles.rowValue}>
        {value ?? "—"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, gap: spacing.lg },
  summary: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  summaryText: { flex: 1, gap: spacing.xs },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  rowValue: { flexShrink: 1, textAlign: "right" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  planButtons: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
