/* global Response */
import { render } from "@testing-library/react-native";

describe("getApiBaseUrl absolute URL pass-through", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("includes empty content-type fallback when no header is set", async () => {
    jest.doMock("expo-constants", () => ({
      __esModule: true,
      default: { expoConfig: { extra: { apiBaseUrl: "https://x.example" } } },
    }));
    jest.doMock("@/src/lib/supabase", () => ({
      supabase: { auth: { getSession: async () => ({ data: { session: null } }) } },
    }));
    const fetchMock = jest.fn();
    const originalFetch = global.fetch;
    global.fetch = fetchMock as unknown as typeof fetch;
    fetchMock.mockResolvedValueOnce(
      new Response("oh no", {
        status: 500,
        // No content-type header to hit the `?? ""` fallback on line 53.
        headers: {},
      }),
    );
    const { api } = require("@/src/lib/api/client");
    await expect(api.get("/x")).rejects.toMatchObject({ status: 500 });
    global.fetch = originalFetch;
  });
});

describe("i18n getLocales missing branch", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("works when expo-localization.getLocales is undefined", async () => {
    jest.doMock("@react-native-async-storage/async-storage", () => ({
      __esModule: true,
      default: {
        getItem: jest.fn().mockResolvedValue(null),
        setItem: jest.fn(),
      },
    }));
    // getLocales is intentionally absent to hit `getLocales?.() ?? []`.
    jest.doMock("expo-localization", () => ({}));
    const mockInit = jest.fn().mockResolvedValue(undefined);
    const mockI18n = {
      use: () => mockI18n,
      init: mockInit,
      changeLanguage: jest.fn().mockResolvedValue(undefined),
      language: "es",
    };
    jest.doMock("i18next", () => ({ __esModule: true, default: mockI18n }));
    jest.doMock("react-i18next", () => ({ initReactI18next: { type: "react" } }));
    const { initI18n } = require("@/src/i18n");
    await initI18n();
    expect(mockInit).toHaveBeenCalledWith(expect.objectContaining({ lng: "es" }));
  });
});

describe("informe-extract section header inside estudios", () => {
  it("breaks out of estudios loop when a new section header is encountered", () => {
    const { extractEstudiosSolicitados } = require("@/src/lib/informe-extract");
    const input =
      "PLAN:\n" +
      "Estudios:\n" +
      "- Hemograma\n" +
      "Tratamiento:\n" +
      "- Reposo\n";
    const result = extractEstudiosSolicitados(input);
    expect(result).toBe("- Hemograma");
  });

  it("ignores non-bullet, non-section-header lines inside estudios", () => {
    const { extractEstudiosSolicitados } = require("@/src/lib/informe-extract");
    // The line "(observations)" passes both startsWith('- ') and isSectionHeader as false,
    // exercising the false branch on the section-header check.
    const input =
      "PLAN:\n" +
      "Estudios:\n" +
      "- Hemograma\n" +
      "(observations)\n" +
      "- Radiografía\n";
    const result = extractEstudiosSolicitados(input);
    expect(result).toContain("Hemograma");
    expect(result).toContain("Radiografía");
  });
});

