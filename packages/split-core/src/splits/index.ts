import { z } from "zod";
import type { MinorAmount } from "../models/types";
import { allocateEvenly, sumMinor } from "../money/index";

export type SplitShare = {
  userId: string;
  amountOwed: MinorAmount;
};

export function calculateEqualSplit(
  total: MinorAmount,
  userIds: string[],
): SplitShare[] {
  if (userIds.length === 0) {
    throw new Error("at least one participant is required");
  }
  const parts = allocateEvenly(total, userIds.length);
  return userIds.map((userId, i) => ({ userId, amountOwed: parts[i]! }));
}

export function calculateUnequalSplit(
  total: MinorAmount,
  allocations: Array<{ userId: string; amountOwed: MinorAmount }>,
): SplitShare[] {
  const sum = sumMinor(allocations.map((a) => a.amountOwed));
  if (sum !== total) {
    throw new Error(
      `unequal split must sum to total (got ${sum}, expected ${total})`,
    );
  }
  return allocations.map((a) => ({
    userId: a.userId,
    amountOwed: a.amountOwed,
  }));
}

export function calculatePercentageSplit(
  total: MinorAmount,
  allocations: Array<{ userId: string; percentage: number }>,
): SplitShare[] {
  const pctSum = allocations.reduce((acc, a) => acc + a.percentage, 0);
  if (Math.abs(pctSum - 100) > 1e-6) {
    throw new Error(`percentages must sum to 100 (got ${pctSum})`);
  }
  const raw = allocations.map((a) => ({
    userId: a.userId,
    amountOwed: Math.floor((total * a.percentage) / 100),
  }));
  let remainder = total - sumMinor(raw.map((r) => r.amountOwed));
  for (let i = 0; i < raw.length && remainder > 0; i += 1) {
    raw[i]!.amountOwed += 1;
    remainder -= 1;
  }
  return raw;
}

export function calculateSharesSplit(
  total: MinorAmount,
  allocations: Array<{ userId: string; shares: number }>,
): SplitShare[] {
  const shareTotal = allocations.reduce((acc, a) => acc + a.shares, 0);
  if (shareTotal <= 0) {
    throw new Error("total shares must be positive");
  }
  const raw = allocations.map((a) => ({
    userId: a.userId,
    amountOwed: Math.floor((total * a.shares) / shareTotal),
  }));
  let remainder = total - sumMinor(raw.map((r) => r.amountOwed));
  for (let i = 0; i < raw.length && remainder > 0; i += 1) {
    raw[i]!.amountOwed += 1;
    remainder -= 1;
  }
  return raw;
}

export const unequalSplitSchema = z
  .object({
    total: z.number().int().nonnegative(),
    allocations: z
      .array(
        z.object({
          userId: z.string().min(1),
          amountOwed: z.number().int().nonnegative(),
        }),
      )
      .min(1),
  })
  .superRefine((val, ctx) => {
    const sum = sumMinor(val.allocations.map((a) => a.amountOwed));
    if (sum !== val.total) {
      ctx.addIssue({
        code: "custom",
        message: `Split amounts must sum to ${val.total} (got ${sum})`,
        path: ["allocations"],
      });
    }
  });
