import {
  createInforme,
  deleteInforme,
  getInforme,
  listInformesByPatient,
  processInforme,
  updateInformeContent,
} from "@/src/lib/api/informes";

const mockChain = {
  insert: jest.fn(),
  select: jest.fn(),
  single: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
  eq: jest.fn(),
  order: jest.fn(),
  maybeSingle: jest.fn(),
};
const mockFrom = jest.fn((_table: string) => mockChain);

jest.mock("@/src/lib/supabase", () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

jest.mock("@/src/lib/api/client", () => ({
  api: { post: jest.fn() },
}));

import { api } from "@/src/lib/api/client";
const post = api.post as jest.Mock;

beforeEach(() => {
  Object.values(mockChain).forEach((m) => m.mockReset?.());
  mockChain.insert.mockReturnValue(mockChain);
  mockChain.select.mockReturnValue(mockChain);
  mockChain.delete.mockReturnValue(mockChain);
  mockChain.update.mockReturnValue(mockChain);
  mockChain.eq.mockReturnValue(mockChain);
  mockChain.order.mockReturnValue(mockChain);
  mockFrom.mockClear();
  post.mockReset();
});

describe("informes api", () => {
  it("createInforme inserts and returns row", async () => {
    mockChain.single.mockResolvedValue({ data: { id: "i" }, error: null });
    const out = await createInforme("d", "p");
    expect(out).toEqual({ id: "i" });
    expect(mockChain.insert).toHaveBeenCalledWith({
      doctor_id: "d",
      patient_id: "p",
      status: "recording",
    });
  });

  it("createInforme throws on error", async () => {
    mockChain.single.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(createInforme("d", null)).rejects.toThrow("boom");
  });

  it("processInforme posts with defaults", async () => {
    post.mockResolvedValue({ success: true });
    await processInforme({ informeId: "i", audioPath: "a" });
    expect(post).toHaveBeenCalledWith(
      "/api/process-informe",
      expect.objectContaining({ language: "es", browserTranscript: "" }),
    );
  });

  it("processInforme uses provided overrides", async () => {
    post.mockResolvedValue({});
    await processInforme({
      informeId: "i",
      audioPath: null,
      browserTranscript: "T",
      language: "en",
      recordingDuration: 60,
    });
    expect(post).toHaveBeenCalledWith(
      "/api/process-informe",
      expect.objectContaining({
        browserTranscript: "T",
        language: "en",
        recordingDuration: 60,
      }),
    );
  });

  it("deleteInforme resolves on success", async () => {
    mockChain.eq.mockResolvedValueOnce({ error: null });
    await expect(deleteInforme("x")).resolves.toBeUndefined();
  });

  it("deleteInforme throws on error", async () => {
    mockChain.eq.mockResolvedValueOnce({ error: { message: "nope" } });
    await expect(deleteInforme("x")).rejects.toThrow("nope");
  });

  it("updateInformeContent resolves on success", async () => {
    mockChain.eq.mockResolvedValueOnce({ error: null });
    await expect(
      updateInformeContent("x", { informe_doctor: "d" }),
    ).resolves.toBeUndefined();
  });

  it("updateInformeContent throws on error", async () => {
    mockChain.eq.mockResolvedValueOnce({ error: { message: "fail" } });
    await expect(updateInformeContent("x", {})).rejects.toThrow("fail");
  });

  it("getInforme returns data on success", async () => {
    mockChain.maybeSingle.mockResolvedValue({ data: { id: "i" }, error: null });
    expect(await getInforme("i")).toEqual({ id: "i" });
  });

  it("getInforme returns null on error", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockChain.maybeSingle.mockResolvedValue({ data: null, error: { message: "x" } });
    expect(await getInforme("i")).toBeNull();
    (console.error as jest.Mock).mockRestore();
  });

  it("listInformesByPatient returns rows", async () => {
    mockChain.order.mockResolvedValueOnce({ data: [{ id: "i" }], error: null });
    expect(await listInformesByPatient("p")).toEqual([{ id: "i" }]);
  });

  it("listInformesByPatient returns [] when data null", async () => {
    mockChain.order.mockResolvedValueOnce({ data: null, error: null });
    expect(await listInformesByPatient("p")).toEqual([]);
  });

  it("listInformesByPatient returns [] on error", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockChain.order.mockResolvedValueOnce({ data: null, error: { message: "x" } });
    expect(await listInformesByPatient("p")).toEqual([]);
    (console.error as jest.Mock).mockRestore();
  });
});
