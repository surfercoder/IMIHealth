/* global Response */

// --- api client low-level branches (uses jest.resetModules) ---
describe("api client low-level branches", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("absolute URL pass-through (no base URL applied)", async () => {
    jest.doMock("expo-constants", () => ({
      __esModule: true,
      default: { expoConfig: { extra: { apiBaseUrl: "https://x.example" } } },
    }));
    jest.doMock("@/src/lib/supabase", () => ({
      supabase: { auth: { getSession: async () => ({ data: { session: null } }) } },
    }));
    const fetchMock = jest.fn().mockResolvedValue(
      new Response("{}", {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const originalFetch = global.fetch;
    global.fetch = fetchMock as unknown as typeof fetch;
    const { api } = require("@/src/lib/api/client");
    await api.get("https://other.example/x");
    expect(fetchMock.mock.calls[0][0]).toBe("https://other.example/x");
    global.fetch = originalFetch;
  });

  it("handles missing content-type header via the `?? \"\"` fallback", async () => {
    jest.doMock("expo-constants", () => ({
      __esModule: true,
      default: { expoConfig: { extra: { apiBaseUrl: "https://x.example" } } },
    }));
    jest.doMock("@/src/lib/supabase", () => ({
      supabase: { auth: { getSession: async () => ({ data: { session: null } }) } },
    }));
    // Forge a response whose headers.get returns null (no content-type set).
    const stubRes = {
      ok: true,
      status: 200,
      headers: { get: () => null },
      text: async () => "",
      json: async () => ({}),
    } as unknown as Response;
    const fetchMock = jest.fn().mockResolvedValue(stubRes);
    const originalFetch = global.fetch;
    global.fetch = fetchMock as unknown as typeof fetch;
    const { api } = require("@/src/lib/api/client");
    const result = await api.get("/x");
    expect(result).toBeUndefined();
    global.fetch = originalFetch;
  });

  it("text() rejection on non-json error response falls back to empty string", async () => {
    jest.doMock("expo-constants", () => ({
      __esModule: true,
      default: { expoConfig: { extra: { apiBaseUrl: "https://x.example" } } },
    }));
    jest.doMock("@/src/lib/supabase", () => ({
      supabase: { auth: { getSession: async () => ({ data: { session: null } }) } },
    }));
    const stubRes = {
      ok: false,
      status: 500,
      headers: { get: () => "text/plain" },
      text: () => Promise.reject(new Error("read-fail")),
    } as unknown as Response;
    const fetchMock = jest.fn().mockResolvedValue(stubRes);
    const originalFetch = global.fetch;
    global.fetch = fetchMock as unknown as typeof fetch;
    const { api } = require("@/src/lib/api/client");
    await expect(api.get("/x")).rejects.toMatchObject({ status: 500 });
    global.fetch = originalFetch;
  });

  it("safeJson swallows JSON parse failures in 4xx/5xx responses", async () => {
    jest.doMock("expo-constants", () => ({
      __esModule: true,
      default: { expoConfig: { extra: { apiBaseUrl: "https://x.example" } } },
    }));
    jest.doMock("@/src/lib/supabase", () => ({
      supabase: { auth: { getSession: async () => ({ data: { session: null } }) } },
    }));
    const fetchMock = jest.fn().mockResolvedValue(
      new Response("not-json{", {
        status: 500,
        headers: { "content-type": "application/json" },
      }),
    );
    const originalFetch = global.fetch;
    global.fetch = fetchMock as unknown as typeof fetch;
    const { api } = require("@/src/lib/api/client");
    await expect(api.get("/x")).rejects.toMatchObject({ status: 500 });
    global.fetch = originalFetch;
  });
});
