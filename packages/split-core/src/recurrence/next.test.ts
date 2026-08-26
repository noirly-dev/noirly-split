import { describe, expect, it } from "vitest";
import {
  addWeeklyMonthly,
  nextWeeklyMonthlyRunAt,
  toISODate,
} from "./next";

describe("recurrence", () => {
  it("adds weekly and monthly intervals", () => {
    const start = new Date("2026-01-01T12:00:00Z");
    expect(toISODate(addWeeklyMonthly(start, { frequency: "weekly", interval: 1 }))).toBe(
      "2026-01-08",
    );
    expect(toISODate(addWeeklyMonthly(start, { frequency: "monthly", interval: 1 }))).toBe(
      "2026-02-01",
    );
  });

  it("skips forward to today or later", () => {
    const next = nextWeeklyMonthlyRunAt(
      "2020-01-01",
      { frequency: "monthly", interval: 1 },
      new Date("2026-08-26T12:00:00Z"),
    );
    expect(next.getTime()).toBeGreaterThanOrEqual(
      new Date("2026-08-26T00:00:00Z").getTime(),
    );
  });
});
