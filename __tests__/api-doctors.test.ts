import { getDoctor, updateDoctor } from "@/src/lib/api/doctors";

const mockChain = {
  select: jest.fn(),
  update: jest.fn(),
  eq: jest.fn(),
  single: jest.fn(),
  maybeSingle: jest.fn(),
};
const mockFrom = jest.fn((_table: string) => mockChain);

jest.mock("@/src/lib/supabase", () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

beforeEach(() => {
  Object.values(mockChain).forEach((m) => m.mockReset?.());
  mockChain.select.mockReturnValue(mockChain);
  mockChain.update.mockReturnValue(mockChain);
  mockChain.eq.mockReturnValue(mockChain);
});

describe("doctors api", () => {
  it("getDoctor returns row", async () => {
    mockChain.maybeSingle.mockResolvedValue({ data: { id: "d" }, error: null });
    expect(await getDoctor("d")).toEqual({ id: "d" });
  });

  it("getDoctor returns null on error", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockChain.maybeSingle.mockResolvedValue({ data: null, error: { message: "x" } });
    expect(await getDoctor("d")).toBeNull();
    (console.error as jest.Mock).mockRestore();
  });

  it("updateDoctor returns updated row", async () => {
    mockChain.single.mockResolvedValue({ data: { id: "d", name: "N" }, error: null });
    expect(await updateDoctor("d", { name: "N" })).toEqual({ id: "d", name: "N" });
  });

  it("updateDoctor returns null on error", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockChain.single.mockResolvedValue({ data: null, error: { message: "x" } });
    expect(await updateDoctor("d", { name: "N" })).toBeNull();
    (console.error as jest.Mock).mockRestore();
  });
});
