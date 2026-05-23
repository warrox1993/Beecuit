export function formatOrderNumber(sequence: number, now: Date = new Date()): string {
  const year = now.getUTCFullYear();
  const padded = String(sequence).padStart(6, "0");
  return `BCT-${year}-${padded}`;
}
