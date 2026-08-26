import type {
  ActivityEvent,
  Expense,
  Settlement,
} from "@/src/core/models/types";
import type {
  ActivityEventDocument,
  ExpenseDocument,
  SettlementDocument,
} from "@/src/server/models";

function idOf(value: { toString(): string } | string): string {
  return typeof value === "string" ? value : value.toString();
}

export function mapExpense(
  doc: ExpenseDocument | (ExpenseDocument & { _id: { toString(): string } }),
): Expense {
  return {
    id: doc._id.toString(),
    groupId: idOf(doc.groupId),
    amount: doc.amount,
    currency: doc.currency,
    fxRateToBase: doc.fxRateToBase,
    amountInBase: doc.amountInBase,
    description: doc.description,
    date: doc.date,
    category: doc.category ?? null,
    receiptUrl: doc.receiptUrl ?? null,
    splitMethod: doc.splitMethod,
    createdBy: idOf(doc.createdBy),
    isRecurring: Boolean(doc.isRecurring),
    recurrenceRule: doc.recurrenceRule
      ? {
          frequency: doc.recurrenceRule.frequency,
          interval: doc.recurrenceRule.interval,
          nextRunAt: new Date(doc.recurrenceRule.nextRunAt).toISOString(),
          endAt: doc.recurrenceRule.endAt
            ? new Date(doc.recurrenceRule.endAt).toISOString()
            : null,
        }
      : null,
    recurrenceParentId: doc.recurrenceParentId
      ? idOf(doc.recurrenceParentId)
      : null,
    payers: (doc.payers ?? []).map((p) => ({
      userId: idOf(p.userId),
      amountPaid: p.amountPaid,
      amountPaidInBase: p.amountPaidInBase,
    })),
    splits: (doc.splits ?? []).map((s) => ({
      userId: idOf(s.userId),
      amountOwed: s.amountOwed,
      amountOwedInBase: s.amountOwedInBase,
      percentage: s.percentage ?? null,
      shares: s.shares ?? null,
    })),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    deletedAt: doc.deletedAt ? doc.deletedAt.toISOString() : null,
  };
}

export function mapSettlement(doc: SettlementDocument): Settlement {
  return {
    id: doc._id.toString(),
    groupId: idOf(doc.groupId),
    fromUserId: idOf(doc.fromUserId),
    toUserId: idOf(doc.toUserId),
    amount: doc.amount,
    currency: doc.currency,
    note: doc.note ?? null,
    settledAt: doc.settledAt.toISOString(),
    createdBy: idOf(doc.createdBy),
    createdAt: doc.createdAt.toISOString(),
  };
}

export function mapActivity(doc: ActivityEventDocument): ActivityEvent {
  return {
    id: doc._id.toString(),
    groupId: idOf(doc.groupId),
    type: doc.type,
    actorId: idOf(doc.actorId),
    payload: (doc.payload ?? {}) as Record<string, unknown>,
    createdAt: doc.createdAt.toISOString(),
  };
}
