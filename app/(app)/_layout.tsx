import { StyleSheet, View } from "react-native";
import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/src/providers/AuthProvider";
import { useDoctor } from "@/src/hooks/useDoctor";
import {
  clearGoodbye,
  clearWelcome,
  useAuthTransitions,
} from "@/src/lib/authTransitions";
import { WelcomeOverlay } from "@/src/components/WelcomeOverlay";
import { GoodbyeOverlay } from "@/src/components/GoodbyeOverlay";
import { colors } from "@/src/theme";

export default function AppLayout() {
  const { session, initialized, signOut } = useAuth();

  if (!initialized) return null;
  if (!session) return <Redirect href="/landing" />;

  return <AppLayoutInner signOut={signOut} />;
}

function AppLayoutInner({ signOut }: { signOut: () => Promise<void> }) {
  const { doctor } = useDoctor();
  const { welcome, goodbye } = useAuthTransitions();
  const firstName = doctor?.name?.split(" ")[0];

  return (
    <View style={styles.root}>
      <Stack
        screenOptions={{
          headerTintColor: colors.foreground,
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { fontWeight: "600" },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="profile" />
        <Stack.Screen name="patient/new" />
        <Stack.Screen name="patient/[id]/index" />
        <Stack.Screen name="patient/[id]/edit" />
        <Stack.Screen name="informe/[id]" />
        <Stack.Screen name="quick-informe" />
        <Stack.Screen name="record" />
      </Stack>

      {welcome ? (
        <WelcomeOverlay userName={firstName} onDone={clearWelcome} />
      ) : null}

      {goodbye ? (
        <GoodbyeOverlay
          userName={firstName}
          onDone={async () => {
            await signOut();
            clearGoodbye();
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
