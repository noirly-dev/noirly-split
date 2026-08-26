"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/src/components/PageHeader";
import { Button } from "@/src/components/ui/Button";
import { MoneyText } from "@/src/components/MoneyText";
import { qk } from "@/src/core/sync/query-keys";
import { api } from "@/src/lib/api-client";

export default function GroupExpensesPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId;
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");

  const group = useQuery({
    queryKey: qk.group(groupId),
    queryFn: () => api.getGroup(groupId),
  });
  const expenses = useQuery({
    queryKey: [...qk.expenses(groupId), q, category],
    queryFn: () =>
      api.listExpenses(groupId, {
        q: q || undefined,
        category: category || undefined,
      }),
  });
  const members = useQuery({
    queryKey: qk.members(groupId),
    queryFn: () => api.listMembers(groupId),
  });

  const nameOf = (userId: string) =>
    members.data?.members.find((m) => m.userId === userId)?.displayName ??
    "Member";

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <PageHeader
        kicker="Expenses"
        title={group.data?.group.name ?? "Group"}
        lead="Shared costs in this group."
        action={
          <>
            <a
              href={api.exportCsvUrl(groupId)}
              className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted hover:text-ink"
            >
              Export CSV
            </a>
            <Link href={`/g/${groupId}/expenses/new`}>
              <Button>Add expense</Button>
            </Link>
          </>
        }
      />

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          className="h-10 flex-1 border border-dashed border-hairline bg-transparent px-3 text-sm outline-none focus:border-solid"
          placeholder="Search description"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="h-10 border border-dashed border-hairline bg-transparent px-3 text-sm outline-none"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All categories</option>
          <option value="food">Food</option>
          <option value="travel">Travel</option>
          <option value="rent">Rent</option>
          <option value="utilities">Utilities</option>
          <option value="other">Other</option>
        </select>
      </div>

      {expenses.isLoading ? (
        <p className="mt-6 text-sm text-muted">Loading expenses…</p>
      ) : null}
      {expenses.error ? (
        <p className="mt-6 text-sm text-balance-negative" role="alert">
          {(expenses.error as Error).message}
        </p>
      ) : null}

      {expenses.data && expenses.data.expenses.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No expenses yet.</p>
      ) : null}

      {expenses.data && expenses.data.expenses.length > 0 ? (
        <ul className="mt-6 divide-y divide-dashed divide-hairline border border-dashed border-hairline">
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
                  className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-surface"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {expense.description}
                    </p>
                    <p className="mt-1 font-mono text-[11px] tracking-[0.1em] uppercase text-muted">
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
    </main>
  );
}
