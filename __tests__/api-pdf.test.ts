import { sharePdf } from "@/src/lib/api/pdf";

const mockGetSession = jest.fn();
jest.mock("@/src/lib/supabase", () => ({
  supabase: { auth: { getSession: () => mockGetSession() } },
}));

jest.mock("@/src/lib/api/client", () => ({
  getApiBaseUrl: () => "https://api.example",
}));

const mockDownloadAsync = jest.fn();
jest.mock("expo-file-system/legacy", () => ({
  cacheDirectory: "/cache/",
  documentDirectory: "/docs/",
  downloadAsync: (...a: unknown[]) => mockDownloadAsync(...a),
}));

const mockIsAvailable = jest.fn();
const mockShareAsync = jest.fn();
jest.mock("expo-sharing", () => ({
  isAvailableAsync: () => mockIsAvailable(),
  shareAsync: (...a: unknown[]) => mockShareAsync(...a),
}));

beforeEach(() => {
  mockGetSession.mockReset();
  mockDownloadAsync.mockReset();
  mockIsAvailable.mockReset();
  mockShareAsync.mockReset();
  mockGetSession.mockResolvedValue({ data: { session: { access_token: "tok" } } });
});

describe("sharePdf", () => {
  it("does nothing if sharing is unavailable", async () => {
    mockIsAvailable.mockResolvedValue(false);
    await sharePdf({ kind: "patient", informeId: "i" });
    expect(mockDownloadAsync).not.toHaveBeenCalled();
    expect(mockShareAsync).not.toHaveBeenCalled();
  });

  it("downloads and shares for doctor variant", async () => {
    mockIsAvailable.mockResolvedValue(true);
    mockDownloadAsync.mockResolvedValue({ uri: "/cache/x.pdf", status: 200 });
    await sharePdf({ kind: "doctor", informeId: "i" });
    expect(mockDownloadAsync.mock.calls[0][0]).toContain("/api/pdf/informe?id=i");
    expect(mockShareAsync).toHaveBeenCalledWith("/cache/x.pdf", expect.any(Object));
  });

  it("builds certificado URL with options", async () => {
    mockIsAvailable.mockResolvedValue(true);
    mockDownloadAsync.mockResolvedValue({ uri: "u", status: 200 });
    await sharePdf({
      kind: "certificado",
      informeId: "i",
      options: { daysOff: 3, diagnosis: "d", observations: "o" },
    });
    expect(mockDownloadAsync.mock.calls[0][0]).toContain("daysOff=3");
    expect(mockDownloadAsync.mock.calls[0][0]).toContain("diagnosis=d");
    expect(mockDownloadAsync.mock.calls[0][0]).toContain("observations=o");
  });

  it("certificado URL omits empty options", async () => {
    mockIsAvailable.mockResolvedValue(true);
    mockDownloadAsync.mockResolvedValue({ uri: "u", status: 200 });
    await sharePdf({ kind: "certificado", informeId: "i" });
    expect(mockDownloadAsync.mock.calls[0][0]).not.toContain("daysOff");
  });

  it("builds pedido URL with item", async () => {
    mockIsAvailable.mockResolvedValue(true);
    mockDownloadAsync.mockResolvedValue({ uri: "u", status: 200 });
    await sharePdf({ kind: "pedido", informeId: "i", item: "Hemograma" });
    expect(mockDownloadAsync.mock.calls[0][0]).toContain("item=Hemograma");
  });

  it("builds pedido URL without item", async () => {
    mockIsAvailable.mockResolvedValue(true);
    mockDownloadAsync.mockResolvedValue({ uri: "u", status: 200 });
    await sharePdf({ kind: "pedido", informeId: "i" });
    expect(mockDownloadAsync.mock.calls[0][0]).toContain("/api/pdf/pedido");
  });

  it("builds pedidos URL with items[]", async () => {
    mockIsAvailable.mockResolvedValue(true);
    mockDownloadAsync.mockResolvedValue({ uri: "u", status: 200 });
    await sharePdf({ kind: "pedidos", informeId: "i", items: ["A", "B"] });
    expect(mockDownloadAsync.mock.calls[0][0]).toContain("item=A");
    expect(mockDownloadAsync.mock.calls[0][0]).toContain("item=B");
  });

  it("builds pedidos URL without items", async () => {
    mockIsAvailable.mockResolvedValue(true);
    mockDownloadAsync.mockResolvedValue({ uri: "u", status: 200 });
    await sharePdf({ kind: "pedidos", informeId: "i" });
    expect(mockDownloadAsync.mock.calls[0][0]).toContain("/api/pdf/pedidos");
  });

  it("builds pedidos-patient URL", async () => {
    mockIsAvailable.mockResolvedValue(true);
    mockDownloadAsync.mockResolvedValue({ uri: "u", status: 200 });
    await sharePdf({ kind: "pedidos-patient", patientId: "p" });
    expect(mockDownloadAsync.mock.calls[0][0]).toContain("patientId=p");
  });

  it("throws on non-2xx download", async () => {
    mockIsAvailable.mockResolvedValue(true);
    mockDownloadAsync.mockResolvedValue({ uri: "u", status: 500 });
    await expect(sharePdf({ kind: "patient", informeId: "i" })).rejects.toThrow(
      "PDF download failed (500)",
    );
  });

  it("includes Authorization header when token present", async () => {
    mockIsAvailable.mockResolvedValue(true);
    mockDownloadAsync.mockResolvedValue({ uri: "u", status: 200 });
    await sharePdf({ kind: "patient", informeId: "i" });
    expect(mockDownloadAsync.mock.calls[0][2]).toEqual({
      headers: { Authorization: "Bearer tok" },
    });
  });

  it("omits Authorization when no session", async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null } });
    mockIsAvailable.mockResolvedValue(true);
    mockDownloadAsync.mockResolvedValue({ uri: "u", status: 200 });
    await sharePdf({ kind: "patient", informeId: "i" });
    expect(mockDownloadAsync.mock.calls[0][2]).toEqual({ headers: undefined });
  });
});
