import type {
  Expense,
  MinorAmount,
  NetBalance,
  Settlement,
} from "../models/types";

export type BalanceInput = {
  memberIds: string[];
  expenses: Pick<Expense, "payers" | "splits" | "deletedAt">[];
  settlements: Pick<Settlement, "fromUserId" | "toUserId" | "amount">[];
};

/** Net in base currency: positive = owed to them; negative = they owe. */
export function computeNets(input: BalanceInput): NetBalance[] {
  const nets = new Map<string, MinorAmount>();
  for (const id of input.memberIds) {
    nets.set(id, 0);
  }

  const bump = (userId: string, delta: MinorAmount) => {
    nets.set(userId, (nets.get(userId) ?? 0) + delta);
  };

  for (const expense of input.expenses) {
    if (expense.deletedAt) continue;
    for (const payer of expense.payers) {
      bump(payer.userId, payer.amountPaidInBase);
    }
    for (const split of expense.splits) {
      bump(split.userId, -split.amountOwedInBase);
    }
  }

  for (const settlement of input.settlements) {
    bump(settlement.fromUserId, settlement.amount);
    bump(settlement.toUserId, -settlement.amount);
  }

  return [...nets.entries()].map(([userId, netInBase]) => ({
    userId,
    netInBase,
  }));
}
