import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { AppHeader } from "@/src/components/AppHeader";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Icon,
  Screen,
  Text,
} from "@/src/components/ui";
import { colors, spacing } from "@/src/theme";

export default function InformesTab() {
  const { t } = useTranslation();
  const { push } = useRouter();

  return (
    <Screen padded={false}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heading}>
          <Text variant="title">{t("informes.title")}</Text>
          <Text variant="subtitle">{t("informes.subtitle")}</Text>
        </View>

        <Card style={styles.card}>
          <CardHeader>
            <View style={styles.cardHead}>
              <View style={styles.iconChip}>
                <Icon name="people" size={20} color={colors.primary} />
              </View>
              <View style={styles.cardHeadText}>
                <CardTitle>{t("informes.classic")}</CardTitle>
                <CardDescription>{t("informes.classicDesc")}</CardDescription>
              </View>
            </View>
          </CardHeader>
          <CardContent>
            <Button
              title={t("informes.createClassic")}
              onPress={() => push("/patients")}
              fullWidth
            />
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <CardHeader>
            <View style={styles.cardHead}>
              <View style={styles.iconChip}>
                <Icon name="flash" size={20} color={colors.primary} />
              </View>
              <View style={styles.cardHeadText}>
                <CardTitle>{t("informes.quick")}</CardTitle>
                <CardDescription>{t("informes.quickDesc")}</CardDescription>
              </View>
            </View>
          </CardHeader>
          <CardContent>
            <Button
              title={t("informes.createQuick")}
              variant="outline"
              onPress={() => push("/quick-informe")}
              fullWidth
            />
          </CardContent>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  heading: { gap: spacing.xs, marginBottom: spacing.xs },
  card: {},
  cardHead: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary,
  },
  cardHeadText: { flex: 1, gap: spacing.xs },
});
