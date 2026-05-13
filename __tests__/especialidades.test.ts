import { ESPECIALIDADES } from "@/src/lib/especialidades";

describe("ESPECIALIDADES", () => {
  it("exports the static list of specialties", () => {
    expect(Array.isArray(ESPECIALIDADES)).toBe(true);
    expect(ESPECIALIDADES.length).toBeGreaterThan(20);
    expect(ESPECIALIDADES).toContain("Cardiología");
  });
});
