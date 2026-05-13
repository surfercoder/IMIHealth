import { startMobileProCheckout, startMobileSignup } from "@/src/lib/api/billing";

jest.mock("@/src/lib/api/client", () => ({
  api: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    fetchBlob: jest.fn(),
  },
  ApiError: class ApiError extends Error {},
  getApiBaseUrl: () => "",
}));

import { api } from "@/src/lib/api/client";

const post = api.post as jest.Mock;

beforeEach(() => post.mockReset());

describe("billing api", () => {
  it("startMobileProCheckout posts the plan", async () => {
    post.mockResolvedValue({ initPoint: "url", ref: "abc" });
    const res = await startMobileProCheckout("pro_yearly");
    expect(post).toHaveBeenCalledWith("/api/billing/start-checkout", { plan: "pro_yearly" });
    expect(res.ref).toBe("abc");
  });

  it("startMobileSignup posts the payload", async () => {
    post.mockResolvedValue({ initPoint: "url", ref: "ref" });
    await startMobileSignup({
      name: "n",
      email: "e@e",
      password: "p",
      confirmPassword: "p",
      matricula: "1",
      phone: "1",
      especialidad: "x",
      plan: "pro_monthly",
    });
    expect(post).toHaveBeenCalledWith(
      "/api/billing/mobile-signup",
      expect.objectContaining({ plan: "pro_monthly" }),
    );
  });
});
