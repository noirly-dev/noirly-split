import { Types } from "mongoose";
import {
  assertObjectId,
  jsonError,
  jsonOk,
  requireSplitSession,
} from "@/src/server/api/http";
import { withDb } from "@/src/server/db/mongodb";
import { requireGroupMembership } from "@/src/server/groups/access";
import { mapExpense } from "@/src/server/mappers";
import { Expense } from "@/src/server/models";

type Params = { params: Promise<{ groupId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireSplitSession();
    const { groupId } = await params;
    await assertObjectId(groupId, "groupId");

    const report = await withDb(async () => {
      const { group } = await requireGroupMembership(groupId, ctx.userId);
      const expenses = await Expense.find({
        groupId: new Types.ObjectId(groupId),
        deletedAt: null,
        isRecurring: { $ne: true },
      }).lean();

      const byCategory: Record<string, number> = {};
      let totalInBase = 0;
      for (const e of expenses) {
        const key = e.category ?? "uncategorized";
        byCategory[key] = (byCategory[key] ?? 0) + e.amountInBase;
        totalInBase += e.amountInBase;
      }

      return {
        baseCurrency: group.baseCurrency,
        expenseCount: expenses.length,
        totalInBase,
        byCategory: Object.entries(byCategory)
          .map(([category, amountInBase]) => ({ category, amountInBase }))
          .sort((a, b) => b.amountInBase - a.amountInBase),
        recent: expenses
          .slice()
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 5)
          .map((doc) =>
            mapExpense(
              doc as typeof doc & { createdAt: Date; updatedAt: Date },
            ),
          ),
      };
    });

    return jsonOk(report);
  } catch (error) {
    return jsonError(error);
  }
}
