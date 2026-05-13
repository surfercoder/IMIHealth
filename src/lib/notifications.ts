import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { supabase } from "@/src/lib/supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Asks for permission, fetches the Expo push token, and writes it to
 * doctors.push_token. Safe to call on every app launch — Supabase only
 * notices a difference when the token rotates.
 */
export async function registerPushToken(doctorId: string): Promise<void> {
  if (!Device.isDevice) return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== "granted") return;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId) {
    console.warn("[notifications] No EAS projectId; skipping push token registration");
    return;
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
  const pushToken = tokenResponse.data;
  if (!pushToken) return;

  // Best-effort write; ignore errors (column may not exist yet on first deploy).
  await supabase
    .from("doctors")
    .update({ push_token: pushToken } as never)
    .eq("id", doctorId);
}
