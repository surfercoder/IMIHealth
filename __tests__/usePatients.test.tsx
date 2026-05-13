import { renderHook, waitFor, act } from "@testing-library/react-native";

const mockUser: { current: { id: string } | null } = { current: null };
jest.mock("@/src/providers/AuthProvider", () => ({
  useAuth: () => ({ user: mockUser.current }),
}));

const mockList = jest.fn();
jest.mock("@/src/lib/api/patients", () => ({
  listPatientsWithStats: (...a: unknown[]) => mockList(...a),
}));

import { usePatients } from "@/src/hooks/usePatients";

beforeEach(() => {
  mockList.mockReset();
  mockUser.current = null;
});

describe("usePatients", () => {
  it("loads when user is present", async () => {
    mockUser.current = { id: "u" };
    mockList.mockResolvedValue([{ id: "p" }]);
    const { result } = renderHook(() => usePatients());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.patients).toEqual([{ id: "p" }]);
  });

  it("no-ops when no user", async () => {
    const { result } = renderHook(() => usePatients());
    await waitFor(() => Promise.resolve());
    expect(mockList).not.toHaveBeenCalled();
    expect(result.current.patients).toEqual([]);
  });

  it("refresh sets refreshing true then loads", async () => {
    mockUser.current = { id: "u" };
    mockList.mockResolvedValue([]);
    const { result } = renderHook(() => usePatients());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.refresh();
    });
    expect(mockList).toHaveBeenCalledTimes(2);
    expect(result.current.refreshing).toBe(false);
  });
});
