import { renderHook, act } from "@testing-library/react-native";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockOpenAuth = jest.fn();
jest.mock("expo-web-browser", () => ({
  openAuthSessionAsync: (...a: unknown[]) => mockOpenAuth(...a),
}));

const mockProCheckout = jest.fn();
const mockSignup = jest.fn();
jest.mock("@/src/lib/api/billing", () => ({
  startMobileProCheckout: (...a: unknown[]) => mockProCheckout(...a),
  startMobileSignup: (...a: unknown[]) => mockSignup(...a),
}));

import { useCheckout } from "@/src/hooks/useCheckout";

beforeEach(() => {
  mockReplace.mockReset();
  mockOpenAuth.mockReset();
  mockProCheckout.mockReset();
  mockSignup.mockReset();
});

describe("useCheckout", () => {
  it("upgradeExisting opens the browser and navigates to return", async () => {
    mockProCheckout.mockResolvedValue({ initPoint: "url", ref: "r" });
    mockOpenAuth.mockResolvedValue({ type: "success" });
    const { result } = renderHook(() => useCheckout());
    let out: { ok: boolean; error?: string } | undefined;
    await act(async () => {
      out = await result.current.upgradeExisting("pro_monthly");
    });
    expect(out?.ok).toBe(true);
    expect(mockReplace).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/billing/return" }),
    );
  });

  it("upgradeExisting returns error on api failure", async () => {
    mockProCheckout.mockRejectedValue(new Error("api"));
    const { result } = renderHook(() => useCheckout());
    let out: { ok: boolean; error?: string } | undefined;
    await act(async () => {
      out = await result.current.upgradeExisting("pro_yearly");
    });
    expect(out?.ok).toBe(false);
    expect(out?.error).toBe("api");
  });

  it("upgradeExisting wraps non-Error throws", async () => {
    mockProCheckout.mockRejectedValue("plain");
    const { result } = renderHook(() => useCheckout());
    let out: { ok: boolean; error?: string } | undefined;
    await act(async () => {
      out = await result.current.upgradeExisting("pro_monthly");
    });
    expect(out?.error).toBe("plain");
  });

  it("signupPro calls startMobileSignup and opens browser", async () => {
    mockSignup.mockResolvedValue({ initPoint: "u", ref: "r" });
    mockOpenAuth.mockResolvedValue({ type: "dismiss" });
    const { result } = renderHook(() => useCheckout());
    let out: { ok: boolean; error?: string } | undefined;
    await act(async () => {
      out = await result.current.signupPro({
        name: "n",
        email: "e",
        password: "p",
        confirmPassword: "p",
        matricula: "1",
        phone: "1",
        especialidad: "x",
        plan: "pro_monthly",
      });
    });
    expect(mockSignup).toHaveBeenCalled();
    expect(out?.ok).toBe(false);
  });

  it("signupPro propagates errors", async () => {
    mockSignup.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useCheckout());
    let out: { ok: boolean; error?: string } | undefined;
    await act(async () => {
      out = await result.current.signupPro({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        matricula: "",
        phone: "",
        especialidad: "",
        plan: "pro_yearly",
      });
    });
    expect(out?.error).toBe("boom");
  });

  it("openCheckout returns error when browser throws", async () => {
    mockProCheckout.mockResolvedValue({ initPoint: "u", ref: "r" });
    mockOpenAuth.mockRejectedValue(new Error("browser"));
    const { result } = renderHook(() => useCheckout());
    let out: { ok: boolean; error?: string } | undefined;
    await act(async () => {
      out = await result.current.upgradeExisting("pro_monthly");
    });
    expect(out?.error).toBe("browser");
  });

  it("openCheckout wraps non-Error browser throws", async () => {
    mockProCheckout.mockResolvedValue({ initPoint: "u", ref: "r" });
    mockOpenAuth.mockRejectedValue("plain");
    const { result } = renderHook(() => useCheckout());
    let out: { ok: boolean; error?: string } | undefined;
    await act(async () => {
      out = await result.current.upgradeExisting("pro_monthly");
    });
    expect(out?.error).toBe("plain");
  });
});
