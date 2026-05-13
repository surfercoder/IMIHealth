/* global Response */
import { ApiError, api, getApiBaseUrl } from "@/src/lib/api/client";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiBaseUrl: "https://fallback.example" } } },
}));

const mockGetSession = jest.fn();
jest.mock("@/src/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
    },
  },
}));

const originalFetch = global.fetch;
const fetchMock = jest.fn();

beforeEach(() => {
  delete process.env.EXPO_PUBLIC_API_BASE_URL;
  global.fetch = fetchMock as unknown as typeof fetch;
  mockGetSession.mockResolvedValue({ data: { session: null } });
  fetchMock.mockReset();
});

afterAll(() => {
  global.fetch = originalFetch;
});

function jsonResponse(body: unknown, init: Partial<ResponseInit> = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

describe("getApiBaseUrl", () => {
  it("prefers env var over extra and strips trailing slash", () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://env.example/";
    expect(getApiBaseUrl()).toBe("https://env.example");
  });

  it("falls back to extra config when env not set", () => {
    expect(getApiBaseUrl()).toBe("https://fallback.example");
  });
});

describe("ApiError", () => {
  it("captures status and data", () => {
    const err = new ApiError("bad", 500, { x: 1 });
    expect(err.name).toBe("ApiError");
    expect(err.status).toBe(500);
    expect(err.data).toEqual({ x: 1 });
  });
});

describe("api", () => {
  it("get returns parsed JSON on 2xx", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ hello: "world" }));
    const res = await api.get<{ hello: string }>("/x");
    expect(res.hello).toBe("world");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/x"),
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("returns undefined when response is non-json", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("not json", { status: 200, headers: { "content-type": "text/plain" } }),
    );
    const res = await api.get<undefined>("/x");
    expect(res).toBeUndefined();
  });

  it("post serializes json body and sets content-type", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    await api.post("/p", { a: 1 });
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ a: 1 });
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });

  it("put and delete use correct methods", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}));
    fetchMock.mockResolvedValueOnce(jsonResponse({}));
    await api.put("/p", { a: 1 });
    await api.delete("/p");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "PUT" });
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: "DELETE" });
  });

  it("includes Authorization when session has token", async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: { access_token: "abc" } } });
    fetchMock.mockResolvedValueOnce(jsonResponse({}));
    await api.get("/x");
    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer abc");
  });

  it("throws ApiError with json error message on 4xx/5xx", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "bad input" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      }),
    );
    await expect(api.get("/x")).rejects.toMatchObject({
      status: 400,
      message: "bad input",
    });
  });

  it("throws ApiError with text body when not json", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("server exploded", {
        status: 500,
        headers: { "content-type": "text/plain" },
      }),
    );
    await expect(api.get("/x")).rejects.toMatchObject({
      status: 500,
      message: "server exploded",
    });
  });

  it("falls back to default message when error response has no body", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("", {
        status: 503,
        headers: { "content-type": "application/json" },
      }),
    );
    await expect(api.get("/x")).rejects.toMatchObject({ status: 503 });
  });

  it("passes through absolute URLs", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}));
    await api.get("https://other.example/x");
    expect(fetchMock.mock.calls[0][0]).toBe("https://other.example/x");
  });

  it("fetchBlob returns blob + filename", async () => {
    const blob = new Blob(["ok"]);
    const response = new Response(blob, {
      status: 200,
      headers: {
        "content-disposition": 'attachment; filename="hi.pdf"',
      },
    });
    fetchMock.mockResolvedValueOnce(response);
    const out = await api.fetchBlob("/file");
    expect(out.filename).toBe("hi.pdf");
    expect(out.blob).toBeInstanceOf(Blob);
  });

  it("fetchBlob defaults filename when no disposition header", async () => {
    fetchMock.mockResolvedValueOnce(new Response(new Blob(["x"]), { status: 200 }));
    const out = await api.fetchBlob("/file");
    expect(out.filename).toBe("download");
  });

  it("fetchBlob throws ApiError on non-2xx", async () => {
    fetchMock.mockResolvedValueOnce(new Response("", { status: 404 }));
    await expect(api.fetchBlob("/file")).rejects.toMatchObject({ status: 404 });
  });

  it("fetchBlob passes through absolute URLs", async () => {
    fetchMock.mockResolvedValueOnce(new Response(new Blob(["x"]), { status: 200 }));
    await api.fetchBlob("https://x.example/y");
    expect(fetchMock.mock.calls[0][0]).toBe("https://x.example/y");
  });
});
