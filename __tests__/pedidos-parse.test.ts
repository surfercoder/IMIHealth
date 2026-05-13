import {
  itemsToText,
  parseDictation,
  parseItemsText,
} from "@/src/lib/pedidos-parse";

describe("parseDictation", () => {
  it("returns empty when input is empty", () => {
    expect(parseDictation("")).toEqual({ items: [], diagnostico: null });
  });

  it("returns empty when no markers are present", () => {
    expect(parseDictation("Buenos días paciente")).toEqual({
      items: [],
      diagnostico: null,
    });
  });

  it("captures items between Solicito markers and diagnostico tail", () => {
    const text =
      "Solicito resonancia magnética. Solicito análisis de orina. Diagnóstico lumbalgia crónica";
    expect(parseDictation(text)).toEqual({
      items: ["resonancia magnética", "análisis de orina"],
      diagnostico: "lumbalgia crónica",
    });
  });

  it("handles solicito without accent and trims punctuation", () => {
    const text = "solicito hemograma, solicito glucemia.";
    expect(parseDictation(text)).toEqual({
      items: ["hemograma", "glucemia"],
      diagnostico: null,
    });
  });

  it("returns null diagnostico when diagnostico marker is empty tail", () => {
    const text = "Solicito ecografía. Diagnóstico";
    expect(parseDictation(text)).toEqual({
      items: ["ecografía"],
      diagnostico: null,
    });
  });

  it("ignores empty fragments between consecutive solicito markers", () => {
    const text = "Solicito Solicito Solicito hemograma";
    expect(parseDictation(text).items).toEqual(["hemograma"]);
  });

  it("does not match solicito embedded in larger words", () => {
    const text = "solicitoso solicitorio resolicito hemograma";
    expect(parseDictation(text)).toEqual({ items: [], diagnostico: null });
  });
});

describe("parseItemsText / itemsToText", () => {
  it("parses hyphen-prefixed lines", () => {
    expect(parseItemsText("- Hemograma\n- Radiografía\n  ignored")).toEqual([
      "Hemograma",
      "Radiografía",
    ]);
  });

  it("skips hyphen-only lines (empty value after the hyphen)", () => {
    expect(parseItemsText("- \n-  \n- Real")).toEqual(["Real"]);
  });

  it("returns empty for blank input", () => {
    expect(parseItemsText("")).toEqual([]);
  });

  it("renders items as hyphen-prefixed lines", () => {
    expect(itemsToText(["A", "B"])).toBe("- A\n- B");
  });
});
