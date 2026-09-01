"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@noirly-dev/ui";
import { ExpenseForm } from "@/src/features/expenses/ExpenseForm";
import { qk } from "@/src/core/sync/query-keys";
import { api } from "@/src/lib/api-client";

export default function EditExpensePage() {
  const params = useParams<{ groupId: string; expenseId: string }>();
  const { groupId, expenseId } = params;

  const group = useQuery({
    queryKey: qk.group(groupId),
    queryFn: () => api.getGroup(groupId),
  });
  const me = useQuery({
    queryKey: qk.me,
    queryFn: () => api.me(),
  });
  const expense = useQuery({
    queryKey: qk.expense(expenseId),
    queryFn: () => api.getExpense(groupId, expenseId),
  });

  if (!group.data || !me.data || !expense.data) {
    return (
      <main className="mx-auto w-full max-w-lg px-6 py-8">
        <p className="text-sm text-muted-foreground-foreground">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg px-6 py-8">
      <PageHeader
        kicker="Expense"
        title="Edit expense"
        lead={expense.data.expense.description}
      />
      <div className="mt-8">
        <ExpenseForm
          groupId={groupId}
          baseCurrency={group.data.group.baseCurrency}
          currentUserId={me.data.user.id}
          initial={expense.data.expense}
        />
      </div>
    </main>
  );
}
