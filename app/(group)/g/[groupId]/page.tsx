"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MoneyText } from "@/src/components/MoneyText";
import { qk } from "@/src/core/sync/query-keys";
import { api } from "@/src/lib/api-client";

export default function GroupExpensesPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId;
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");

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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-[-0.04em] uppercase">
            Expenses
          </h2>
          <p className="mt-2 text-muted">Shared costs in this group.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/g/${groupId}/reports`}
            className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted hover:text-ink"
          >
            Reports
          </Link>
          <a
            href={api.exportCsvUrl(groupId)}
            className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted hover:text-ink"
          >
            Export CSV
          </a>
          <Link
            href={`/g/${groupId}/expenses/new`}
            className="inline-flex h-11 items-center bg-panel px-5 font-mono text-[11px] font-semibold tracking-[0.16em] text-panel-ink uppercase"
          >
            Add expense
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          className="h-10 flex-1 border border-dashed border-hairline bg-transparent px-3 outline-none focus:border-solid"
          placeholder="Search description"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="h-10 border border-dashed border-hairline bg-transparent px-3 outline-none"
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
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          Loading…
        </p>
      ) : null}

      {expenses.error ? (
        <p className="text-balance-negative" role="alert">
          {(expenses.error as Error).message}
        </p>
      ) : null}

      {expenses.data && expenses.data.expenses.length === 0 ? (
        <div className="border border-dashed border-hairline px-6 py-10">
          <p className="font-display text-2xl font-bold uppercase tracking-[-0.03em]">
            No expenses yet
          </p>
        </div>
      ) : null}

      {expenses.data && expenses.data.expenses.length > 0 ? (
        <ul className="divide-y divide-dashed divide-hairline border border-dashed border-hairline">
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
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface"
                >
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <p className="mt-1 font-mono text-[11px] tracking-[0.1em] uppercase text-muted">
                      {expense.date}
                      {expense.category ? ` · ${expense.category}` : ""}
                      {" · "}
                      paid by {nameOf(expense.payers[0]?.userId ?? "")}
                      {syncing ? " · syncing" : ""}
                    </p>
                  </div>
                  <MoneyText
                    amount={expense.amount}
                    currency={expense.currency}
                    className="text-base"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
