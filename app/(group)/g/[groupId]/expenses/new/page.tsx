"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader } from "@noirly-dev/ui";
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
      <PageContainer size="sm">
        <p className="text-sm text-muted-foreground-foreground">Loading…</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="sm">
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
    </PageContainer>
  );
}
