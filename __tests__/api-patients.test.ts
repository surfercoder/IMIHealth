import {
  createPatient,
  deletePatient,
  getPatient,
  listPatientsWithStats,
  updatePatient,
} from "@/src/lib/api/patients";

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
  supabase: { from: (table: string) => mockFrom(table) },
}));

beforeEach(() => {
  Object.values(mockChain).forEach((m) => m.mockReset?.());
  mockChain.insert.mockReturnValue(mockChain);
  mockChain.select.mockReturnValue(mockChain);
  mockChain.delete.mockReturnValue(mockChain);
  mockChain.update.mockReturnValue(mockChain);
  mockChain.eq.mockReturnValue(mockChain);
  mockChain.order.mockReturnValue(mockChain);
  mockFrom.mockClear();
});

describe("patients api", () => {
  it("createPatient inserts cleaned input", async () => {
    mockChain.single.mockResolvedValue({ data: { id: "p" }, error: null });
    const out = await createPatient("d", {
      name: "  Ana  ",
      dni: "  ",
      email: null,
      phone: "1",
    });
    expect(out).toEqual({ id: "p" });
    expect(mockChain.insert).toHaveBeenCalledWith({
      doctor_id: "d",
      name: "Ana",
      dni: null,
      dob: null,
      email: null,
      phone: "1",
      obra_social: null,
      nro_afiliado: null,
      plan: null,
    });
  });

  it("createPatient throws on error", async () => {
    mockChain.single.mockResolvedValue({ data: null, error: { message: "x" } });
    await expect(createPatient("d", { name: "N" })).rejects.toThrow("x");
  });

  it("updatePatient succeeds", async () => {
    mockChain.single.mockResolvedValue({ data: { id: "p" }, error: null });
    expect(await updatePatient("p", { name: "N" })).toEqual({ id: "p" });
  });

  it("updatePatient throws on error", async () => {
    mockChain.single.mockResolvedValue({ data: null, error: { message: "x" } });
    await expect(updatePatient("p", { name: "N" })).rejects.toThrow("x");
  });

  it("deletePatient resolves on success", async () => {
    mockChain.eq.mockResolvedValueOnce({ error: null });
    await expect(deletePatient("p")).resolves.toBeUndefined();
  });

  it("deletePatient throws on error", async () => {
    mockChain.eq.mockResolvedValueOnce({ error: { message: "fail" } });
    await expect(deletePatient("p")).rejects.toThrow("fail");
  });

  it("listPatientsWithStats maps informes into counts and last_at", async () => {
    const oldStamp = "2024-01-01T00:00:00Z";
    const newStamp = "2024-02-01T00:00:00Z";
    mockChain.order.mockResolvedValueOnce({
      data: [
        {
          id: "p1",
          name: "A",
          dni: null,
          email: null,
          phone: null,
          dob: null,
          obra_social: null,
          nro_afiliado: null,
          plan: null,
          created_at: oldStamp,
          informes: [
            { created_at: oldStamp, status: "completed" },
            { created_at: newStamp, status: "processing" },
          ],
        },
      ],
      error: null,
    });
    const out = await listPatientsWithStats("d");
    expect(out[0].informe_count).toBe(2);
    expect(out[0].last_informe_at).toBe(newStamp);
    expect(out[0].last_informe_status).toBe("processing");
  });

  it("listPatientsWithStats handles row without informes", async () => {
    mockChain.order.mockResolvedValueOnce({
      data: [
        {
          id: "p",
          name: "N",
          dni: null,
          email: null,
          phone: null,
          dob: null,
          obra_social: null,
          nro_afiliado: null,
          plan: null,
          created_at: "2024-01-01",
        },
      ],
      error: null,
    });
    const out = await listPatientsWithStats("d");
    expect(out[0].informe_count).toBe(0);
    expect(out[0].last_informe_at).toBeNull();
  });

  it("listPatientsWithStats returns [] on error", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockChain.order.mockResolvedValueOnce({ data: null, error: { message: "x" } });
    expect(await listPatientsWithStats("d")).toEqual([]);
    (console.error as jest.Mock).mockRestore();
  });

  it("listPatientsWithStats handles null data", async () => {
    mockChain.order.mockResolvedValueOnce({ data: null, error: null });
    expect(await listPatientsWithStats("d")).toEqual([]);
  });

  it("getPatient returns data", async () => {
    mockChain.maybeSingle.mockResolvedValue({ data: { id: "p" }, error: null });
    expect(await getPatient("p")).toEqual({ id: "p" });
  });

  it("getPatient returns null on error", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockChain.maybeSingle.mockResolvedValue({ data: null, error: { message: "x" } });
    expect(await getPatient("p")).toBeNull();
    (console.error as jest.Mock).mockRestore();
  });
});
