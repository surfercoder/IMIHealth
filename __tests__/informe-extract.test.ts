import {
  extractDiagnosticoPresuntivo,
  extractEstudiosSolicitados,
  parsePedidoItems,
} from "@/src/lib/informe-extract";

describe("extractEstudiosSolicitados", () => {
  it("returns empty for nullish input", () => {
    expect(extractEstudiosSolicitados(null)).toBe("");
    expect(extractEstudiosSolicitados(undefined)).toBe("");
    expect(extractEstudiosSolicitados("")).toBe("");
  });

  it("returns empty when no PLAN header is present", () => {
    expect(extractEstudiosSolicitados("Sin plan\n- algo")).toBe("");
  });

  it("returns empty when PLAN present but no estudios section", () => {
    expect(extractEstudiosSolicitados("P - PLAN:\n- algo")).toBe("");
  });

  it("collects items under an Estudios section after PLAN", () => {
    const text = "P - PLAN:\nEstudios:\n- Hemograma\n- Radiografía\nOtra:\n- omitido";
    expect(extractEstudiosSolicitados(text)).toBe("- Hemograma\n- Radiografía");
  });

  it("treats PLAN: alone (no P -) as a plan header", () => {
    const text = "**PLAN:**\nEstudios solicitados:\n- A\n- B";
    expect(extractEstudiosSolicitados(text)).toBe("- A\n- B");
  });

  it("ignores blank lines while collecting", () => {
    const text = "PLAN:\nEstudios:\n\n- A\n\n- B";
    expect(extractEstudiosSolicitados(text)).toBe("- A\n- B");
  });
});

describe("parsePedidoItems", () => {
  it("returns empty array for empty input", () => {
    expect(parsePedidoItems("")).toEqual([]);
  });

  it("extracts dash-prefixed items", () => {
    expect(parsePedidoItems("- A\n- B\nnot an item")).toEqual(["A", "B"]);
  });

  it("trims whitespace", () => {
    expect(parsePedidoItems("  -   spaced  \n- B")).toEqual(["spaced", "B"]);
  });

  it("skips empty items", () => {
    expect(parsePedidoItems("-\n- value")).toEqual(["value"]);
  });
});

describe("extractDiagnosticoPresuntivo", () => {
  it("returns null for nullish input", () => {
    expect(extractDiagnosticoPresuntivo(null)).toBeNull();
    expect(extractDiagnosticoPresuntivo(undefined)).toBeNull();
    expect(extractDiagnosticoPresuntivo("")).toBeNull();
  });

  it("returns null when no diagnostico header is present", () => {
    expect(extractDiagnosticoPresuntivo("Something else\nNo header")).toBeNull();
  });

  it("extracts inline value after the header on the same line", () => {
    expect(
      extractDiagnosticoPresuntivo("Diagnóstico presuntivo: Otitis media"),
    ).toBe("Otitis media");
  });

  it("extracts multi-line values until next section", () => {
    const text = "Diagnóstico Presuntivo:\nFiebre alta\n- secundaria\nOtraSeccion:\n- ignorado";
    const result = extractDiagnosticoPresuntivo(text);
    expect(result).toContain("Fiebre alta");
    expect(result).toContain("secundaria");
  });

  it("trims at inline section break inside the value", () => {
    const out = extractDiagnosticoPresuntivo(
      "Diagnostico presuntivo: Bronquitis. Tratamiento: descanso",
    );
    expect(out).toBe("Bronquitis.");
  });

  it("returns null when only blank lines follow the header", () => {
    expect(extractDiagnosticoPresuntivo("Diagnóstico presuntivo:\n\n")).toBeNull();
  });
});
