import { ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Button, Card, CardContent, Screen, Text } from "@/src/components/ui";
import { colors, spacing } from "@/src/theme";

const bot = require("@/assets/images/imi-bot-listening.webp");

export default function QuickInformeScreen() {
  const { t } = useTranslation();
  const { push, back } = useRouter();

  return (
    <Screen padded={false} hasHeader>
      <Stack.Screen
        options={{ title: t("informes.quick"), headerShown: true }}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Image source={bot} style={styles.image} contentFit="contain" />
        </View>
        <View style={styles.copy}>
          <Text variant="title" center>
            {t("informes.quick")}
          </Text>
          <Text variant="subtitle" center>
            {t("informes.quickDesc")}
          </Text>
        </View>

        <Card>
          <CardContent>
            <Text variant="label">{t("grabarPage.howItWorks")}</Text>
            <Text variant="bodyMuted">
              {t("quickInformePage.step2")}
            </Text>
            <Text variant="bodyMuted">
              {t("quickInformePage.step4")}
            </Text>
          </CardContent>
        </Card>

        <View style={styles.actions}>
          <Button
            title={t("informes.createQuick")}
            onPress={() =>
              push({
                pathname: "/record",
                params: { mode: "quick" },
              })
            }
            fullWidth
            size="lg"
          />
          <Button
            title={t("common.back")}
            variant="outline"
            onPress={() => back()}
            fullWidth
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, gap: spacing.lg },
  hero: { alignItems: "center", marginTop: spacing.lg },
  image: { width: 220, height: 220 },
  copy: { gap: spacing.xs, alignItems: "center" },
  actions: { marginTop: spacing.lg, backgroundColor: colors.background },
});
