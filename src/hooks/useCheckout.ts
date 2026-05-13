import { useState } from "react";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import {
  startMobileProCheckout,
  startMobileSignup,
  type MobileSignupPayload,
  type ProPlanTier,
} from "@/src/lib/api/billing";

const RETURN_URL = "imihealth://billing/return";

interface CheckoutResult {
  ok: boolean;
  error?: string;
}

/**
 * Opens MercadoPago in an authenticated in-app browser. When MP eventually
 * redirects back, we navigate to /billing/return?ref=<ref> ourselves —
 * MP strips external_reference for plan-based subscriptions, so we use the
 * ref returned by our server.
 */
export function useCheckout() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function openCheckout(initPoint: string, ref: string): Promise<CheckoutResult> {
    setBusy(true);
    try {
      const result = await WebBrowser.openAuthSessionAsync(initPoint, RETURN_URL);
      // Regardless of whether MP redirected back or the user dismissed, jump
      // to billing/return so the polling UI takes over. signup-status will
      // tell us "processing" until the webhook completes, then "ready".
      router.replace({
        pathname: "/billing/return",
        params: { ref },
      });
      return { ok: result.type === "success" };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    } finally {
      setBusy(false);
    }
  }

  async function upgradeExisting(plan: ProPlanTier): Promise<CheckoutResult> {
    try {
      const { initPoint, ref } = await startMobileProCheckout(plan);
      return openCheckout(initPoint, ref);
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  async function signupPro(payload: MobileSignupPayload): Promise<CheckoutResult> {
    try {
      const { initPoint, ref } = await startMobileSignup(payload);
      return openCheckout(initPoint, ref);
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  return { busy, upgradeExisting, signupPro };
}
