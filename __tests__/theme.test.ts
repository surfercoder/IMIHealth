import * as theme from "@/src/theme";
import { colors } from "@/src/theme/colors";
import { fontSize, fontWeight, radius, spacing } from "@/src/theme/spacing";

describe("theme exports", () => {
  it("re-exports colors", () => {
    expect(theme.colors).toBe(colors);
  });

  it("re-exports the spacing scales", () => {
    expect(theme.spacing).toBe(spacing);
    expect(theme.radius).toBe(radius);
    expect(theme.fontSize).toBe(fontSize);
    expect(theme.fontWeight).toBe(fontWeight);
  });
});

describe("design tokens", () => {
  it("exposes the core color palette", () => {
    expect(colors.primary).toBeDefined();
    expect(colors.background).toBeDefined();
    expect(colors.destructive).toBeDefined();
    expect(colors.success).toBeDefined();
    expect(colors.overlay).toBeDefined();
  });

  it("provides numeric spacing/radius/fontSize scales", () => {
    expect(typeof spacing.md).toBe("number");
    expect(typeof spacing["3xl"]).toBe("number");
    expect(typeof radius.md).toBe("number");
    expect(typeof radius.full).toBe("number");
    expect(typeof fontSize.base).toBe("number");
    expect(typeof fontSize.md).toBe("number");
  });

  it("provides string font weights", () => {
    expect(typeof fontWeight.semibold).toBe("string");
  });
});
