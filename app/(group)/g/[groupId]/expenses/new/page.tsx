"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/PageHeader";
import { ExpenseForm } from "@/src/features/expenses/ExpenseForm";
import { qk } from "@/src/core/sync/query-keys";
import { api } from "@/src/lib/api-client";

export default function NewExpensePage() {
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId;

  const group = useQuery({
    queryKey: qk.group(groupId),
    queryFn: () => api.getGroup(groupId),
  });
  const me = useQuery({
    queryKey: qk.me,
    queryFn: () => api.me(),
  });

  if (!group.data || !me.data) {
    return (
      <main className="mx-auto w-full max-w-lg px-6 py-8">
        <p className="text-sm text-muted">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg px-6 py-8">
      <PageHeader
        kicker="Expense"
        title="Add expense"
        lead={`Base currency ${group.data.group.baseCurrency}.`}
      />
      <div className="mt-8">
        <ExpenseForm
          groupId={groupId}
          baseCurrency={group.data.group.baseCurrency}
          currentUserId={me.data.user.id}
        />
      </div>
    </main>
  );
}
