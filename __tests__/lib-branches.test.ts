/* global Response */
import { doctorReportEmail } from "@/src/lib/email-template";
import { extractDiagnosticoPresuntivo } from "@/src/lib/informe-extract";

describe("email-template default footerTagline", () => {
  it("uses the default tagline when omitted", () => {
    const html = doctorReportEmail({
      reportContent: "body",
      labels: {
        greeting: "g",
        intro: "i",
        disclaimer: "d",
        preheader: "p",
        // footerTagline omitted to hit the default-parameter branch.
      } as never,
    });
    expect(html).toContain("AI-powered");
  });
});

describe("informe-extract continue-vs-break inside collection", () => {
  it("breaks out of the collection loop when a blank follows existing items", () => {
    const text = "Diagnostico Presuntivo:\nFiebre\n\nOtraSeccion:\n";
    const out = extractDiagnosticoPresuntivo(text);
    expect(out).toContain("Fiebre");
  });

  it("returns null when only blank lines follow header and nothing else", () => {
    const text = "Diagnostico Presuntivo:\n\n\n";
    expect(extractDiagnosticoPresuntivo(text)).toBeNull();
  });
});

describe("api client request branches", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("uses Response without a content-type header as non-json", async () => {
    jest.doMock("expo-constants", () => ({
      __esModule: true,
      default: { expoConfig: { extra: {} } },
    }));
    jest.doMock("@/src/lib/supabase", () => ({
      supabase: { auth: { getSession: () => Promise.resolve({ data: { session: null } }) } },
    }));
    const { api } = require("@/src/lib/api/client");
    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValueOnce(
      new Response("plain text", { status: 200 }),
    );
    global.fetch = fetchMock as never;
    const out = await api.get("/x");
    expect(out).toBeUndefined();
    global.fetch = originalFetch;
  });
});

describe("notifications handler", () => {
  it("invokes handleNotification factory", async () => {
    const handlerRef: { current: (() => Promise<unknown>) | null } = { current: null };
    jest.resetModules();
    jest.doMock("expo-notifications", () => ({
      setNotificationHandler: (cfg: { handleNotification: () => Promise<unknown> }) => {
        handlerRef.current = cfg.handleNotification;
      },
      setNotificationChannelAsync: jest.fn(),
      getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
      requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
      getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: "tok" }),
      AndroidImportance: { DEFAULT: 3 },
    }));
    jest.doMock("expo-device", () => ({ isDevice: true }));
    jest.doMock("react-native", () => ({ Platform: { OS: "ios" } }));
    jest.doMock("expo-constants", () => ({
      __esModule: true,
      default: { expoConfig: { extra: { eas: { projectId: "p" } } }, easConfig: null },
    }));
    jest.doMock("@/src/lib/supabase", () => ({
      supabase: {
        from: () => ({ update: () => ({ eq: () => Promise.resolve({ error: null }) }) }),
      },
    }));
    require("@/src/lib/notifications");
    expect(typeof handlerRef.current).toBe("function");
    const result = await handlerRef.current?.();
    expect(result).toMatchObject({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    });
  });
});
