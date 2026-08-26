import type { MinorAmount, NetBalance, SimplifiedDebt } from "../models/types";

type Bucket = { userId: string; remaining: MinorAmount };

/**
 * Greedy settle: repeatedly match largest debtor with largest creditor.
 * Returns minimal display transactions for typical group sizes.
 */
export function simplifyDebts(nets: NetBalance[]): SimplifiedDebt[] {
  const debtors: Bucket[] = [];
  const creditors: Bucket[] = [];

  for (const { userId, netInBase } of nets) {
    if (netInBase < 0) {
      debtors.push({ userId, remaining: -netInBase });
    } else if (netInBase > 0) {
      creditors.push({ userId, remaining: netInBase });
    }
  }

  const sortDesc = (a: Bucket, b: Bucket) => b.remaining - a.remaining;
  debtors.sort(sortDesc);
  creditors.sort(sortDesc);

  const result: SimplifiedDebt[] = [];

  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]!;
    const creditor = creditors[j]!;
    const amount = Math.min(debtor.remaining, creditor.remaining);
    if (amount > 0) {
      result.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amountInBase: amount,
      });
    }
    debtor.remaining -= amount;
    creditor.remaining -= amount;
    if (debtor.remaining === 0) i += 1;
    if (creditor.remaining === 0) j += 1;
  }

  return result;
}
