jest.mock("react-native-url-polyfill/auto", () => ({}));
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {},
}));

const mockCreateClient = jest.fn((_url: string, _key: string, _options: object) => ({ id: "client" }));
jest.mock("@supabase/supabase-js", () => ({
  createClient: (url: string, key: string, options: object) =>
    mockCreateClient(url, key, options),
}));

describe("supabase client", () => {
  beforeEach(() => {
    jest.resetModules();
    mockCreateClient.mockClear();
  });

  it("creates a client using env vars when provided", () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "anon";
    jest.doMock("expo-constants", () => ({ __esModule: true, default: { expoConfig: { extra: {} } } }));
    require("@/src/lib/supabase/client");
    expect(mockCreateClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "anon",
      expect.objectContaining({ auth: expect.any(Object) }),
    );
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  });

  it("falls back to extra config and warns when both empty", () => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    jest.doMock("expo-constants", () => ({ __esModule: true, default: { expoConfig: { extra: {} } } }));
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    require("@/src/lib/supabase/client");
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("re-exports supabase from index", () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "u";
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "k";
    jest.doMock("expo-constants", () => ({ __esModule: true, default: { expoConfig: { extra: {} } } }));
    const mod = require("@/src/lib/supabase");
    expect(mod.supabase).toBeDefined();
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  });
});
