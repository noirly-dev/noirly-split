export type WeeklyMonthlyRule = {
  frequency: "weekly" | "monthly";
  interval: number;
  endAt?: string | null;
};

export function addWeeklyMonthly(from: Date, rule: WeeklyMonthlyRule): Date {
  const interval = Math.max(1, rule.interval || 1);
  const next = new Date(from.getTime());
  if (rule.frequency === "weekly") {
    next.setDate(next.getDate() + 7 * interval);
  } else {
    next.setMonth(next.getMonth() + interval);
  }
  return next;
}

/** Advance until nextRunAt is today or later (date-only). */
export function nextWeeklyMonthlyRunAt(
  from: Date | string,
  rule: WeeklyMonthlyRule,
  now = new Date(),
): Date {
  const origin = typeof from === "string" ? new Date(from) : from;
  let next = Number.isNaN(origin.getTime())
    ? addWeeklyMonthly(now, rule)
    : new Date(origin.getTime());
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  let guard = 0;
  while (next < today && guard < 120) {
    next = addWeeklyMonthly(next, rule);
    guard += 1;
  }
  return next;
}

export function toISODate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
