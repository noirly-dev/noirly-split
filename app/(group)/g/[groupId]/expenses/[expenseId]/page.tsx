"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, PageContainer, PageHeader } from "@noirly-dev/ui";
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
      <PageContainer size="md">
        <p className="text-sm text-muted-foreground-foreground">Loading…</p>
      </PageContainer>
    );
  }

  if (expense.error || !expense.data) {
    return (
      <PageContainer size="md">
        <p className="text-sm text-balance-negative" role="alert">
          {(expense.error as Error)?.message ?? "Not found"}
        </p>
      </PageContainer>
    );
  }

  const e = expense.data.expense;
  const baseCurrency = group.data?.group.baseCurrency ?? e.currency;
  const canEdit = me.data?.user.id === e.createdBy;

  return (
    <PageContainer size="md">
      <Link
        href={`/g/${groupId}`}
        className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground-foreground hover:text-foreground"
      >
        ← Expenses
      </Link>

      <PageHeader
        kicker="Expense"
        title={e.description}
        lead={`${e.date}${e.category ? ` · ${e.category}` : ""} · ${e.splitMethod} split`}
        className="mt-4"
        action={
          canEdit ? (
            <>
              <Link href={`/g/${groupId}/expenses/${expenseId}/edit`}>
                <Button variant="ghost">Edit</Button>
              </Link>
              <Button
                variant="destructive"
                disabled={del.isPending}
                onClick={() => {
                  if (window.confirm("Delete this expense?")) del.mutate();
                }}
              >
                {del.isPending ? "Deleting…" : "Delete"}
              </Button>
            </>
          ) : null
        }
      />

      <div className="mt-8 border border border-[var(--hairline)] bg-[var(--surface)] p-5">
        <MoneyText
          amount={e.amount}
          currency={e.currency}
          className="text-3xl font-bold"
        />
        {e.currency !== baseCurrency || e.fxRateToBase !== 1 ? (
          <p className="mt-2 text-sm text-muted-foreground-foreground">
            ≈ <MoneyText amount={e.amountInBase} currency={baseCurrency} />
            {e.fxRateToBase !== 1 ? ` at rate ${e.fxRateToBase}` : ""}
          </p>
        ) : null}
      </div>

      {e.receiptUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={e.receiptUrl}
          alt="Receipt"
          className="mt-6 max-h-56 border border border-[var(--hairline)] object-contain"
        />
      ) : null}

      <section className="mt-8">
        <h2 className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted-foreground-foreground">
          Paid by
        </h2>
        <ul className="mt-3 divide-y divide-dashed divide-[var(--hairline)] border border border-[var(--hairline)]">
          {e.payers.map((p) => (
            <li key={p.userId} className="flex justify-between px-4 py-3 text-sm">
              <span>{nameOf(p.userId)}</span>
              <MoneyText amount={p.amountPaid} currency={e.currency} />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted-foreground-foreground">
          Split
        </h2>
        <ul className="mt-3 divide-y divide-dashed divide-[var(--hairline)] border border border-[var(--hairline)]">
          {e.splits.map((s) => (
            <li key={s.userId} className="flex justify-between px-4 py-3 text-sm">
              <span>{nameOf(s.userId)}</span>
              <MoneyText amount={s.amountOwed} currency={e.currency} />
            </li>
          ))}
        </ul>
      </section>

      {del.error ? (
        <p className="mt-4 text-sm text-balance-negative" role="alert">
          {(del.error as Error).message}
        </p>
      ) : null}
    </PageContainer>
  );
}
