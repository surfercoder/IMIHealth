import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Notifications from "expo-notifications";
import { AuthProvider, useAuth } from "@/src/providers/AuthProvider";
import { RealtimeProvider } from "@/src/providers/RealtimeProvider";
import { initI18n } from "@/src/i18n";
import { registerPushToken } from "@/src/lib/notifications";
import { colors } from "@/src/theme";

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initI18n().finally(() => setReady(true));
  }, []);

  return ready ? (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <RealtimeProvider>
            <PushBridge />
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(app)" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="auth/confirm" />
              <Stack.Screen name="billing/return" />
            </Stack>
          </RealtimeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  ) : (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

function PushBridge() {
  const { user } = useAuth();
  const { push } = useRouter();
  const registeredForUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      registeredForUserId.current = null;
      return;
    }
    if (registeredForUserId.current === user.id) return;
    registeredForUserId.current = user.id;
    registerPushToken(user.id).catch(() => {});
  }, [user]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { informeId?: string };
      if (data?.informeId) {
        push({
          pathname: "/informe/[id]",
          params: { id: data.informeId },
        });
      }
    });
    return () => sub.remove();
  }, [push]);

  return null;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
