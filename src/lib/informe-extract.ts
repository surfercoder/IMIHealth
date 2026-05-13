// Ported from web: imihealth-web/src/components/pedidos-button/use-pedidos.ts
// and imihealth-web/src/app/api/pdf/pedido/utils.ts. Keep in sync if the web
// versions evolve.

export function extractEstudiosSolicitados(text: string | null | undefined): string {
  if (!text) return "";
  const lines = text.split("\n");
  let inPlan = false;
  let inEstudiosSection = false;
  const items: string[] = [];

  const stripMd = (line: string): string =>
    line.replace(/^\*+/, "").replace(/\*+$/, "").trim();

  const isPlanHeader = (line: string): boolean => {
    const stripped = stripMd(line);
    return /^P\s*[-–—]\s*PLAN:?$/i.test(stripped) || /^PLAN:?$/i.test(stripped);
  };

  const isSectionHeader = (line: string): boolean => {
    if (line.startsWith("- ")) return false;
    return stripMd(line).endsWith(":");
  };

  const isEstudiosHeader = (line: string): boolean =>
    isSectionHeader(line) && /estudios?/i.test(stripMd(line));

  for (const line of lines) {
    const trimmed = line.trim();

    if (!inPlan) {
      if (isPlanHeader(trimmed)) inPlan = true;
      continue;
    }

    if (trimmed === "") continue;

    if (!inEstudiosSection) {
      if (isEstudiosHeader(trimmed)) inEstudiosSection = true;
      continue;
    }

    if (trimmed.startsWith("- ")) {
      items.push(trimmed);
      continue;
    }

    if (isSectionHeader(trimmed)) break;
  }

  return items.join("\n");
}

export function parsePedidoItems(text: string): string[] {
  return text.split("\n").flatMap((line) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("-")) return [];
    const item = trimmed.slice(1).trim();
    return item ? [item] : [];
  });
}

function cleanLine(s: string): string {
  return s.replace(/\*+/g, "").replace(/\\+\s*$/, "").trim();
}

function trimAtInlineSectionBreak(raw: string): string {
  const sectionBreak = raw.search(/[)\s.][A-ZÁÉÍÓÚÑ][a-záéíóúñ]+:/);
  if (sectionBreak > 0) {
    return raw.slice(0, sectionBreak + 1).trim();
  }
  return raw.trim();
}

const SECTION_HEADER_REGEX = /^[A-ZÁÉÍÓÚÑ][^:]*:\s*$/;
const HEADER_REGEX = /^diagn[oó]stico\s+presuntivo\s*:?\s*(.*)$/i;

export function extractDiagnosticoPresuntivo(text: string | null | undefined): string | null {
  if (!text) return null;
  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const trimmed = cleanLine(lines[i]);
    const headerMatch = trimmed.match(HEADER_REGEX);
    if (!headerMatch) continue;

    const inline = trimAtInlineSectionBreak(headerMatch[1]);
    if (inline) return inline;

    const collected: string[] = [];
    for (let j = i + 1; j < lines.length; j++) {
      const next = cleanLine(lines[j]);
      if (!next) {
        if (collected.length === 0) continue;
        break;
      }
      if (SECTION_HEADER_REGEX.test(next)) break;
      const stripped = next.replace(/^[-•*]\s*/, "").replace(/^\d+\.\s*/, "");
      collected.push(trimAtInlineSectionBreak(stripped));
    }

    if (collected.length > 0) return collected.join(". ");
  }

  return null;
}
