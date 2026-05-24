export function nextFirstOfMonth(from: Date = new Date()): Date {
  const y = from.getUTCFullYear();
  const m = from.getUTCMonth();
  return new Date(Date.UTC(y, m + 1, 1, 0, 0, 0));
}

export function formatYearMonth(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function currentYearMonth(d: Date = new Date()): string {
  return formatYearMonth(d);
}

export function nextYearMonth(d: Date = new Date()): string {
  return formatYearMonth(nextFirstOfMonth(d));
}

// For cycleYearMonth "2026-07", deadline is the 25th of the PREVIOUS month (2026-06-25).
export function compositionDeadlineFor(cycleYearMonth: string): Date {
  const [yStr, mStr] = cycleYearMonth.split("-");
  const y = Number(yStr);
  const m = Number(mStr) - 1;
  const prevYear = m === 0 ? y - 1 : y;
  const prevMonth = m === 0 ? 11 : m - 1;
  return new Date(Date.UTC(prevYear, prevMonth, 25, 0, 0, 0));
}

export function isComposingPhase(now: Date = new Date()): boolean {
  return now.getUTCDate() === 1;
}
export function isReminderPhase(now: Date = new Date()): boolean {
  return now.getUTCDate() === 22;
}
export function isLockPhase(now: Date = new Date()): boolean {
  return now.getUTCDate() === 25;
}
