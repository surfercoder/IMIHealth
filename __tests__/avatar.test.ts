import { getDoctorInitials } from "@/src/utils/avatar";

describe("getDoctorInitials", () => {
  it("returns DR for null/undefined", () => {
    expect(getDoctorInitials(undefined)).toBe("DR");
    expect(getDoctorInitials(null)).toBe("DR");
  });

  it("returns DR for empty string", () => {
    expect(getDoctorInitials("")).toBe("DR");
  });

  it("returns DR for whitespace-only string", () => {
    expect(getDoctorInitials("   ")).toBe("DR");
  });

  it("returns first two letters for a single name", () => {
    expect(getDoctorInitials("Maria")).toBe("MA");
  });

  it("uppercases lower-case single names", () => {
    expect(getDoctorInitials("ana")).toBe("AN");
  });

  it("returns first letter of first and last name for full names", () => {
    expect(getDoctorInitials("Maria Garcia")).toBe("MG");
    expect(getDoctorInitials("Maria del Carmen Garcia")).toBe("MG");
  });
});
