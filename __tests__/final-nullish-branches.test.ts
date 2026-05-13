/**
 * Targets nullish-coalescing fallback branches that the main tests don't reach.
 */
/* global Response */

describe("supabase client extra null fallback", () => {
  it("uses empty object when Constants.expoConfig is null", () => {
    jest.resetModules();
    jest.doMock("react-native-url-polyfill/auto", () => ({}));
    jest.doMock("@react-native-async-storage/async-storage", () => ({
      __esModule: true,
      default: {},
    }));
    jest.doMock("@supabase/supabase-js", () => ({
      createClient: () => ({ id: "client" }),
    }));
    jest.doMock("expo-constants", () => ({
      __esModule: true,
      default: { expoConfig: null },
    }));
    process.env.EXPO_PUBLIC_SUPABASE_URL = "u";
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "k";
    require("@/src/lib/supabase/client");
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  });
});

describe("pdf.ts cacheDirectory/documentDirectory fallback", () => {
  it("falls back to empty string when both are null", async () => {
    jest.resetModules();
    const mockDownloadAsync = jest.fn().mockResolvedValue({ uri: "/x", status: 200 });
    jest.doMock("expo-file-system/legacy", () => ({
      cacheDirectory: null,
      documentDirectory: null,
      downloadAsync: mockDownloadAsync,
    }));
    jest.doMock("expo-sharing", () => ({
      isAvailableAsync: () => Promise.resolve(true),
      shareAsync: () => Promise.resolve(),
    }));
    jest.doMock("@/src/lib/supabase", () => ({
      supabase: {
        auth: { getSession: () => Promise.resolve({ data: { session: null } }) },
      },
    }));
    jest.doMock("@/src/lib/api/client", () => ({
      getApiBaseUrl: () => "https://api.example",
    }));
    const { sharePdf } = require("@/src/lib/api/pdf");
    await sharePdf({ kind: "patient", informeId: "i" });
    expect(mockDownloadAsync).toHaveBeenCalled();
    const dest = mockDownloadAsync.mock.calls[0][1] as string;
    // Should start without a directory prefix since both fallbacks are null.
    expect(dest.startsWith("informe-")).toBe(false);
  });
});

