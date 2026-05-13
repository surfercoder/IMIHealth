import { ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Button, Screen, Text } from "@/src/components/ui";
import { LanguageSwitcher } from "@/src/components/LanguageSwitcher";
import { colors, spacing } from "@/src/theme";

const logo = require("@/assets/images/imi-bot-look-front-transparent.webp");
const hero = require("@/assets/images/imi-bot-welcome.webp");

export default function LandingScreen() {
  const { push } = useRouter();
  const { t } = useTranslation();

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <Image source={logo} style={styles.logo} contentFit="contain" />
        <LanguageSwitcher />
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroWrap}>
          <Image source={hero} style={styles.hero} contentFit="contain" />
        </View>
        <View style={styles.copy}>
          <Text variant="display" center>
            {t("publicLanding.headline", { defaultValue: "Tu trabajo, simplificado." })}
          </Text>
          <Text variant="subtitle" center style={styles.subtitle}>
            {t("publicLanding.subheadline", {
              defaultValue:
                "Generá informes médicos profesionales en segundos, dictando o escribiendo.",
            })}
          </Text>
        </View>
        <View style={styles.actions}>
          <Button
            title={t("nav.signIn")}
            onPress={() => push("/login")}
            fullWidth
            size="lg"
          />
          <Button
            title={t("nav.signUp")}
            variant="outline"
            onPress={() => push("/signup")}
            fullWidth
            size="lg"
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: { width: 40, height: 40 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["3xl"],
    paddingTop: spacing.lg,
  },
  heroWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.lg,
  },
  hero: { width: 240, height: 240 },
  copy: { gap: spacing.sm },
  subtitle: { marginTop: spacing.xs },
  actions: { marginTop: spacing["2xl"], gap: spacing.md },
});
