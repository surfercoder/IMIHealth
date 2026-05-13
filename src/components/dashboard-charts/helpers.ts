export function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const month = d.toLocaleString(undefined, { month: "short" });
  return `${d.getDate()} ${month}`;
}
