import Constants from "expo-constants";
import { supabase } from "@/src/lib/supabase";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

export function getApiBaseUrl(): string {
  return (
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    extra.apiBaseUrl ??
    ""
  ).replace(/\/$/, "");
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  json?: unknown;
  body?: BodyInit;
  signal?: AbortSignal;
}

async function request<T>(path: string, options: RequestOptions): Promise<T> {
  const url = path.startsWith("http") ? path : `${getApiBaseUrl()}${path}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string> | undefined),
    ...(await authHeaders()),
  };

  let body = options.body;
  if (options.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.json);
  }

  const res = await fetch(url, { ...options, headers, body });

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    const payload = isJson ? await safeJson(res) : await res.text().catch(() => "");
    const message =
      (isJson && (payload as { error?: string })?.error) ||
      (typeof payload === "string" && payload) ||
      `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status, payload);
  }

  if (!isJson) return undefined as T;
  return (await res.json()) as T;
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, json?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", json }),
  put: <T>(path: string, json?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", json }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),

  /**
   * Fetch raw bytes (e.g. PDFs) with auth applied. Returns a Blob and the
   * inferred filename from Content-Disposition (if present).
   */
  async fetchBlob(
    path: string,
    options?: RequestOptions,
  ): Promise<{ blob: Blob; filename: string }> {
    const url = path.startsWith("http") ? path : `${getApiBaseUrl()}${path}`;
    const headers: Record<string, string> = {
      ...(options?.headers as Record<string, string> | undefined),
      ...(await authHeaders()),
    };
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      throw new ApiError(`Request failed (${res.status})`, res.status, null);
    }
    const disposition = res.headers.get("content-disposition") ?? "";
    const match = /filename="?([^";]+)"?/i.exec(disposition);
    const filename = match?.[1] ?? "download";
    const blob = await res.blob();
    return { blob, filename };
  },
};
