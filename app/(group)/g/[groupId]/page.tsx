"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button, PageContainer, PageHeader } from "@noirly-dev/ui";
import { MoneyText } from "@/src/components/MoneyText";
import { qk } from "@/src/core/sync/query-keys";
import { api } from "@/src/lib/api-client";

export default function GroupExpensesPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId;

  const group = useQuery({
    queryKey: qk.group(groupId),
    queryFn: () => api.getGroup(groupId),
  });
  const expenses = useQuery({
    queryKey: qk.expenses(groupId),
    queryFn: () => api.listExpenses(groupId),
  });
  const members = useQuery({
    queryKey: qk.members(groupId),
    queryFn: () => api.listMembers(groupId),
  });

  const nameOf = (userId: string) =>
    members.data?.members.find((m) => m.userId === userId)?.displayName ??
    "Member";

  return (
    <PageContainer size="md">
      <PageHeader
        kicker="Expenses"
        title={group.data?.group.name ?? "Group"}
        lead="Add, edit, or remove shared costs."
        action={
          <Link href={`/g/${groupId}/expenses/new`}>
            <Button>Add expense</Button>
          </Link>
        }
      />

      {expenses.isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground-foreground">Loading expenses…</p>
      ) : null}
      {expenses.error ? (
        <p className="mt-6 text-sm text-balance-negative" role="alert">
          {(expenses.error as Error).message}
        </p>
      ) : null}

      {expenses.data && expenses.data.expenses.length === 0 ? (
        <div className="mt-6 border border border-[var(--hairline)] px-6 py-10">
          <p className="font-display text-2xl font-bold uppercase tracking-[-0.03em]">
            No expenses yet
          </p>
          <p className="mt-2 text-sm text-muted-foreground-foreground">
            Add the first shared cost for this group.
          </p>
          <Link href={`/g/${groupId}/expenses/new`} className="mt-6 inline-block">
            <Button>Add expense</Button>
          </Link>
        </div>
      ) : null}

      {expenses.data && expenses.data.expenses.length > 0 ? (
        <ul className="mt-6 divide-y divide-dashed divide-[var(--hairline)] border border border-[var(--hairline)]">
          {expenses.data.expenses.map((expense) => {
            const syncing = expense.id.startsWith("temp-");
            return (
              <li key={expense.id}>
                <Link
                  href={
                    syncing
                      ? `/g/${groupId}`
                      : `/g/${groupId}/expenses/${expense.id}`
                  }
                  className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-[var(--surface)]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {expense.description}
                    </p>
                    <p className="mt-1 font-mono text-[11px] tracking-[0.1em] uppercase text-muted-foreground-foreground">
                      {expense.date}
                      {expense.category ? ` · ${expense.category}` : ""}
                      {" · "}
                      {nameOf(expense.payers[0]?.userId ?? "")}
                      {syncing ? " · syncing" : ""}
                    </p>
                  </div>
                  <MoneyText
                    amount={expense.amount}
                    currency={expense.currency}
                    className="shrink-0 text-sm"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </PageContainer>
  );
}
