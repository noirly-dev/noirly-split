"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoneyText } from "@/src/components/MoneyText";
import { qk } from "@/src/core/sync/query-keys";
import { api } from "@/src/lib/api-client";

export default function ExpenseDetailPage() {
  const params = useParams<{ groupId: string; expenseId: string }>();
  const { groupId, expenseId } = params;
  const router = useRouter();
  const queryClient = useQueryClient();

  const expense = useQuery({
    queryKey: qk.expense(expenseId),
    queryFn: () => api.getExpense(groupId, expenseId),
  });
  const group = useQuery({
    queryKey: qk.group(groupId),
    queryFn: () => api.getGroup(groupId),
  });
  const members = useQuery({
    queryKey: qk.members(groupId),
    queryFn: () => api.listMembers(groupId),
  });
  const me = useQuery({
    queryKey: qk.me,
    queryFn: () => api.me(),
  });

  const del = useMutation({
    mutationFn: () => api.deleteExpense(groupId, expenseId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.expenses(groupId) }),
        queryClient.invalidateQueries({ queryKey: qk.balances(groupId) }),
        queryClient.invalidateQueries({ queryKey: qk.activity(groupId) }),
      ]);
      router.push(`/g/${groupId}`);
    },
  });

  const nameOf = (userId: string) =>
    members.data?.members.find((m) => m.userId === userId)?.displayName ??
    "Member";

  if (expense.isLoading) {
    return (
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
        Loading…
      </p>
    );
  }

  if (expense.error || !expense.data) {
    return (
      <p className="text-balance-negative" role="alert">
        {(expense.error as Error)?.message ?? "Not found"}
      </p>
    );
  }

  const e = expense.data.expense;
  const baseCurrency = group.data?.group.baseCurrency ?? e.currency;
  const canEdit = me.data?.user.id === e.createdBy;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <Link
        href={`/g/${groupId}`}
        className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted"
      >
        ← Expenses
      </Link>
      <div>
        <h2 className="font-display text-3xl font-bold tracking-[-0.04em] uppercase">
          {e.description}
        </h2>
        <p className="mt-2 font-mono text-[11px] tracking-[0.12em] uppercase text-muted">
          {e.date}
          {e.category ? ` · ${e.category}` : ""} · {e.splitMethod} split
        </p>
      </div>

      <MoneyText
        amount={e.amount}
        currency={e.currency}
        className="text-3xl font-bold"
      />

      {e.currency !== baseCurrency || e.fxRateToBase !== 1 ? (
        <p className="text-sm text-muted">
          ≈ <MoneyText amount={e.amountInBase} currency={baseCurrency} />
          {e.fxRateToBase !== 1 ? ` at rate ${e.fxRateToBase}` : ""}
        </p>
      ) : null}

      {e.receiptUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={e.receiptUrl}
          alt="Receipt"
          className="max-h-56 border border-dashed border-hairline object-contain"
        />
      ) : null}

      <div>
        <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
          Paid by
        </p>
        <ul className="mt-2 space-y-1">
          {e.payers.map((p) => (
            <li key={p.userId} className="flex justify-between">
              <span>{nameOf(p.userId)}</span>
              <MoneyText amount={p.amountPaid} currency={e.currency} />
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
          Split
        </p>
        <ul className="mt-2 space-y-1">
          {e.splits.map((s) => (
            <li key={s.userId} className="flex justify-between">
              <span>{nameOf(s.userId)}</span>
              <MoneyText amount={s.amountOwed} currency={e.currency} />
            </li>
          ))}
        </ul>
      </div>

      {canEdit ? (
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/g/${groupId}/expenses/${expenseId}/edit`}
            className="inline-flex h-11 items-center bg-panel px-5 font-mono text-[11px] font-semibold tracking-[0.16em] text-panel-ink uppercase"
          >
            Edit
          </Link>
          <button
            type="button"
            className="h-11 border border-dashed border-hairline px-5 font-mono text-[11px] tracking-[0.14em] uppercase text-balance-negative disabled:opacity-50"
            disabled={del.isPending}
            onClick={() => {
              if (window.confirm("Delete this expense?")) del.mutate();
            }}
          >
            {del.isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      ) : null}

      {del.error ? (
        <p className="text-balance-negative" role="alert">
          {(del.error as Error).message}
        </p>
      ) : null}
    </div>
  );
}
