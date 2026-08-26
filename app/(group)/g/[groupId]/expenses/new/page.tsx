"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
        Loading…
      </p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted">
        Expenses
      </p>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.04em] uppercase">
        Add expense
      </h2>
      <div className="mt-8">
        <ExpenseForm
          groupId={groupId}
          baseCurrency={group.data.group.baseCurrency}
          currentUserId={me.data.user.id}
        />
      </div>
    </div>
  );
}
