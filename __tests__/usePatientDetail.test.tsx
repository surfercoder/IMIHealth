import { renderHook, waitFor, act } from "@testing-library/react-native";

const mockGetPatient = jest.fn();
const mockListInformes = jest.fn();

jest.mock("@/src/lib/api/patients", () => ({
  getPatient: (...a: unknown[]) => mockGetPatient(...a),
}));
jest.mock("@/src/lib/api/informes", () => ({
  listInformesByPatient: (...a: unknown[]) => mockListInformes(...a),
}));

import { usePatientDetail } from "@/src/hooks/usePatientDetail";

beforeEach(() => {
  mockGetPatient.mockReset();
  mockListInformes.mockReset();
});

describe("usePatientDetail", () => {
  it("no-ops when patientId is undefined", async () => {
    const { result } = renderHook(() => usePatientDetail(undefined));
    expect(result.current.loading).toBe(true);
    expect(mockGetPatient).not.toHaveBeenCalled();
  });

  it("loads patient + informes", async () => {
    mockGetPatient.mockResolvedValue({ id: "p", name: "P" });
    mockListInformes.mockResolvedValue([{ id: "i1" }]);
    const { result } = renderHook(() => usePatientDetail("p"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.patient).toEqual({ id: "p", name: "P" });
    expect(result.current.informes).toEqual([{ id: "i1" }]);
  });

  it("ignores stale results after unmount", async () => {
    let resolvePatient!: (value: unknown) => void;
    mockGetPatient.mockReturnValue(new Promise((r) => (resolvePatient = r)));
    mockListInformes.mockResolvedValue([]);
    const { result, unmount } = renderHook(() => usePatientDetail("p"));
    unmount();
    await act(async () => {
      resolvePatient({ id: "x" });
    });
    expect(result.current.patient).toBeNull();
  });
});
