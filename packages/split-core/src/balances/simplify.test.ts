import { describe, expect, it } from "vitest";
import { allocateEvenly, applyFx, sumMinor } from "../money/index";
import {
  calculateEqualSplit,
  calculateUnequalSplit,
  unequalSplitSchema,
} from "../splits/index";
import { computeNets } from "./net";
import { simplifyDebts } from "./simplify";

describe("allocateEvenly", () => {
  it("distributes remainder to the first recipients", () => {
    expect(allocateEvenly(100, 3)).toEqual([34, 33, 33]);
    expect(sumMinor(allocateEvenly(100, 3))).toBe(100);
  });
});

describe("applyFx", () => {
  it("rounds to nearest minor unit", () => {
    expect(applyFx(5000, 0.73)).toBe(3650);
  });
});

describe("equal split", () => {
  it("covers remainder cents", () => {
    const splits = calculateEqualSplit(100, ["a", "b", "c"]);
    expect(splits.map((s) => s.amountOwed)).toEqual([34, 33, 33]);
  });
});

describe("unequal split", () => {
  it("rejects sums that do not match total", () => {
    expect(() =>
      calculateUnequalSplit(100, [
        { userId: "a", amountOwed: 40 },
        { userId: "b", amountOwed: 40 },
      ]),
    ).toThrow(/sum/);

    const parsed = unequalSplitSchema.safeParse({
      total: 100,
      allocations: [
        { userId: "a", amountOwed: 40 },
        { userId: "b", amountOwed: 40 },
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts exact sums", () => {
    expect(
      calculateUnequalSplit(100, [
        { userId: "a", amountOwed: 60 },
        { userId: "b", amountOwed: 40 },
      ]),
    ).toHaveLength(2);
  });
});

describe("architecture §4 worked example", () => {
  const alex = "alex";
  const sam = "sam";
  const jordan = "jordan";

  it("nets to Alex +15, Sam -15, Jordan 0 and simplifies to one debt", () => {
    const nets = computeNets({
      memberIds: [alex, sam, jordan],
      expenses: [
        {
          deletedAt: null,
          payers: [{ userId: alex, amountPaid: 6000, amountPaidInBase: 6000 }],
          splits: [
            { userId: alex, amountOwed: 2000, amountOwedInBase: 2000, percentage: null, shares: null },
            { userId: sam, amountOwed: 2000, amountOwedInBase: 2000, percentage: null, shares: null },
            { userId: jordan, amountOwed: 2000, amountOwedInBase: 2000, percentage: null, shares: null },
          ],
        },
        {
          deletedAt: null,
          payers: [{ userId: sam, amountPaid: 3000, amountPaidInBase: 3000 }],
          splits: [
            { userId: alex, amountOwed: 1500, amountOwedInBase: 1500, percentage: null, shares: null },
            { userId: sam, amountOwed: 1500, amountOwedInBase: 1500, percentage: null, shares: null },
          ],
        },
        {
          deletedAt: null,
          payers: [{ userId: jordan, amountPaid: 4000, amountPaidInBase: 4000 }],
          splits: [
            { userId: alex, amountOwed: 1000, amountOwedInBase: 1000, percentage: null, shares: null },
            { userId: sam, amountOwed: 1000, amountOwedInBase: 1000, percentage: null, shares: null },
            { userId: jordan, amountOwed: 2000, amountOwedInBase: 2000, percentage: null, shares: null },
          ],
        },
      ],
      settlements: [],
    });

    const byId = Object.fromEntries(nets.map((n) => [n.userId, n.netInBase]));
    expect(byId[alex]).toBe(1500);
    expect(byId[sam]).toBe(-1500);
    expect(byId[jordan]).toBe(0);

    expect(simplifyDebts(nets)).toEqual([
      { fromUserId: sam, toUserId: alex, amountInBase: 1500 },
    ]);
  });
});
