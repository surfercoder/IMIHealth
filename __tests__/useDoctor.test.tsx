import { renderHook, act, waitFor } from "@testing-library/react-native";

const mockUser: { current: { id: string } | null } = { current: null };
jest.mock("@/src/providers/AuthProvider", () => ({
  useAuth: () => ({ user: mockUser.current }),
}));

const mockGetDoctor = jest.fn();
jest.mock("@/src/lib/api/doctors", () => ({
  getDoctor: (...a: unknown[]) => mockGetDoctor(...a),
}));

import { useDoctor } from "@/src/hooks/useDoctor";

beforeEach(() => {
  mockGetDoctor.mockReset();
  mockUser.current = null;
});

describe("useDoctor", () => {
  it("clears state when no user", async () => {
    const { result } = renderHook(() => useDoctor());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.doctor).toBeNull();
  });

  it("loads doctor when user is present", async () => {
    mockUser.current = { id: "u" };
    mockGetDoctor.mockResolvedValue({ id: "d", name: "Dr X" });
    const { result } = renderHook(() => useDoctor());
    await waitFor(() => expect(result.current.doctor?.id).toBe("d"));
    expect(mockGetDoctor).toHaveBeenCalledWith("u");
  });

  it("setDoctor accepts value", async () => {
    const { result } = renderHook(() => useDoctor());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setDoctor({ id: "x" } as never));
    expect(result.current.doctor).toEqual({ id: "x" });
  });

  it("setDoctor accepts function updater", async () => {
    const { result } = renderHook(() => useDoctor());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setDoctor({ id: "a", name: "A" } as never));
    act(() =>
      result.current.setDoctor((prev) =>
        prev ? ({ ...prev, name: "B" } as never) : prev,
      ),
    );
    expect(result.current.doctor).toEqual({ id: "a", name: "B" });
  });

  it("ignores stale getDoctor when unmounted", async () => {
    mockUser.current = { id: "u" };
    let resolveFn!: (value: unknown) => void;
    mockGetDoctor.mockReturnValue(new Promise((r) => (resolveFn = r)));
    const { result, unmount } = renderHook(() => useDoctor());
    unmount();
    await act(async () => {
      resolveFn({ id: "late" });
    });
    expect(result.current.doctor).toBeNull();
  });

  it("setDoctor functional updater is invoked with the current null state", async () => {
    const { result } = renderHook(() => useDoctor());
    await waitFor(() => expect(result.current.loading).toBe(false));
    let observed: unknown = "untouched";
    act(() => {
      result.current.setDoctor((prev) => {
        observed = prev;
        return prev;
      });
    });
    expect(observed).toBeNull();
  });
});
