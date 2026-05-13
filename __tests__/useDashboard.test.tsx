import { renderHook, waitFor, act } from "@testing-library/react-native";

const mockUser: { current: { id: string } | null } = { current: null };
jest.mock("@/src/providers/AuthProvider", () => ({
  useAuth: () => ({ user: mockUser.current }),
}));

const mockSummary = jest.fn();
const mockCharts = jest.fn();
jest.mock("@/src/lib/api/dashboard", () => ({
  getDashboardSummary: (...a: unknown[]) => mockSummary(...a),
  getDashboardChartData: (...a: unknown[]) => mockCharts(...a),
}));

import { useDashboard } from "@/src/hooks/useDashboard";

beforeEach(() => {
  mockSummary.mockReset();
  mockCharts.mockReset();
  mockUser.current = null;
});

describe("useDashboard", () => {
  it("loads summary and charts when user is present", async () => {
    mockUser.current = { id: "u" };
    mockSummary.mockResolvedValue({
      totalPatients: 1,
      totalInformes: 2,
      completedCount: 1,
      processingCount: 1,
      errorCount: 0,
    });
    mockCharts.mockResolvedValue({
      patientsOverTime: [],
      consultationTime: { avg: 0, min: 0, max: 0, data: [] },
      patientsAccumulator: { current: [], average: 0 },
      informTypes: [],
    });
    const { result } = renderHook(() => useDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.summary.totalPatients).toBe(1);
  });

  it("does nothing when no user", async () => {
    const { result } = renderHook(() => useDashboard());
    await waitFor(() => Promise.resolve());
    expect(result.current.summary.totalPatients).toBe(0);
  });

  it("refresh reuses load with refresh mode", async () => {
    mockUser.current = { id: "u" };
    mockSummary.mockResolvedValue({
      totalPatients: 0,
      totalInformes: 0,
      completedCount: 0,
      processingCount: 0,
      errorCount: 0,
    });
    mockCharts.mockResolvedValue({
      patientsOverTime: [],
      consultationTime: { avg: 0, min: 0, max: 0, data: [] },
      patientsAccumulator: { current: [], average: 0 },
      informTypes: [],
    });
    const { result } = renderHook(() => useDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.refresh();
    });
    expect(mockSummary).toHaveBeenCalledTimes(2);
  });
});
