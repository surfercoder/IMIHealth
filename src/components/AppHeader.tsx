import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Avatar, Text } from "@/src/components/ui";
import { LanguageSwitcher } from "@/src/components/LanguageSwitcher";
import { useDoctor } from "@/src/hooks/useDoctor";
import { getDoctorInitials } from "@/src/utils/avatar";
import { colors, spacing } from "@/src/theme";

const logo = require("@/assets/images/imihealth-logo.png");

interface AppHeaderProps {
  showLogo?: boolean;
  title?: string;
}

export function AppHeader({ showLogo = true, title }: AppHeaderProps) {
  const { push } = useRouter();
  const { t } = useTranslation();
  const { doctor } = useDoctor();

  return (
    <View style={styles.header}>
      {showLogo ? (
        <Image source={logo} style={styles.logo} contentFit="contain" />
      ) : (
        <Text variant="title" numberOfLines={1} style={styles.title}>
          {title}
        </Text>
      )}
      <View style={styles.right}>
        <LanguageSwitcher />
        <Pressable
          onPress={() => push("/profile")}
          accessibilityRole="button"
          accessibilityLabel={t("nav.greeting", { name: doctor?.name ?? "" })}
          style={styles.avatarBtn}
        >
          <Avatar
            uri={doctor?.avatar}
            initials={getDoctorInitials(doctor?.name)}
            size={34}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  logo: { width: 110, height: 32 },
  title: { fontSize: 18 },
  right: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  avatarBtn: {},
});
