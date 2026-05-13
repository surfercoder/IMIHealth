import { api } from "@/src/lib/api/client";

export type ProPlanTier = "pro_monthly" | "pro_yearly";

interface CheckoutResponse {
  initPoint: string;
  ref: string;
}

export async function startMobileProCheckout(
  plan: ProPlanTier,
): Promise<CheckoutResponse> {
  return api.post<CheckoutResponse>("/api/billing/start-checkout", { plan });
}

export interface MobileSignupPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  matricula: string;
  phone: string;
  especialidad: string;
  plan: ProPlanTier;
  dni?: string;
  tagline?: string;
  firmaDigital?: string;
  avatar?: string;
}

export async function startMobileSignup(
  payload: MobileSignupPayload,
): Promise<CheckoutResponse> {
  return api.post<CheckoutResponse>("/api/billing/mobile-signup", payload);
}

