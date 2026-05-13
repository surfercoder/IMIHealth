import { STRONG_PASSWORD_RE } from "@/src/utils/password";

describe("STRONG_PASSWORD_RE", () => {
  it("rejects too-short passwords", () => {
    expect(STRONG_PASSWORD_RE.test("Aa1!")).toBe(false);
  });

  it("rejects passwords missing complexity", () => {
    expect(STRONG_PASSWORD_RE.test("aaaaaaaaaa")).toBe(false);
    expect(STRONG_PASSWORD_RE.test("AAAA1111")).toBe(false);
    expect(STRONG_PASSWORD_RE.test("Aaaaaaaa")).toBe(false);
    expect(STRONG_PASSWORD_RE.test("Aaaaaaa1")).toBe(false);
  });

  it("accepts strong passwords", () => {
    expect(STRONG_PASSWORD_RE.test("Strong1!Password")).toBe(true);
    expect(STRONG_PASSWORD_RE.test("Aa1!aaaa")).toBe(true);
  });
});
