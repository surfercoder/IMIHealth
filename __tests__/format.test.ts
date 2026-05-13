import { formatDate, formatDateTime } from "@/src/utils/format";

describe("formatDate", () => {
  it("returns empty for null/undefined/empty input", () => {
    expect(formatDate(null, "en")).toBe("");
    expect(formatDate(undefined, "en")).toBe("");
    expect(formatDate("", "en")).toBe("");
  });

  it("returns empty for invalid date strings", () => {
    expect(formatDate("not-a-date", "en")).toBe("");
  });

  it("formats ISO date strings", () => {
    const out = formatDate("2025-01-15T00:00:00.000Z", "en");
    expect(typeof out).toBe("string");
    expect(out.length).toBeGreaterThan(0);
  });

  it("formats Date instances", () => {
    const out = formatDate(new Date("2025-01-15T00:00:00.000Z"), "en");
    expect(typeof out).toBe("string");
    expect(out.length).toBeGreaterThan(0);
  });
});

describe("formatDateTime", () => {
  it("returns empty for nullish input", () => {
    expect(formatDateTime(null, "en")).toBe("");
    expect(formatDateTime(undefined, "en")).toBe("");
    expect(formatDateTime("", "en")).toBe("");
  });

  it("returns empty for invalid date strings", () => {
    expect(formatDateTime("nope", "en")).toBe("");
  });

  it("formats ISO date-time strings", () => {
    const out = formatDateTime("2025-01-15T12:30:00.000Z", "en");
    expect(typeof out).toBe("string");
    expect(out.length).toBeGreaterThan(0);
  });

  it("formats Date instances", () => {
    const out = formatDateTime(new Date("2025-01-15T12:30:00.000Z"), "es");
    expect(typeof out).toBe("string");
    expect(out.length).toBeGreaterThan(0);
  });
});
