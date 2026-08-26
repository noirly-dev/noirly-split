"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/PageHeader";
import { MoneyText } from "@/src/components/MoneyText";
import { DotMatrixNumeral } from "@/src/components/DotMatrix";
import { api } from "@/src/lib/api-client";

export default function ReportsPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId;
  const report = useQuery({
    queryKey: ["reports", groupId],
    queryFn: () => api.getReport(groupId),
  });

  if (report.isLoading) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-8">
        <p className="text-sm text-muted">Loading…</p>
      </main>
    );
  }

  if (report.error || !report.data) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-8">
        <p className="text-sm text-balance-negative" role="alert">
          {(report.error as Error)?.message ?? "Failed"}
        </p>
      </main>
    );
  }

  const data = report.data;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <PageHeader
        kicker="Reports"
        title="Spend"
        lead={`${data.expenseCount} expenses in ${data.baseCurrency}.`}
      />

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="border border-dashed border-hairline bg-surface p-5">
          <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted">
            Expenses
          </p>
          <DotMatrixNumeral className="mt-3 text-3xl">
            {String(data.expenseCount).padStart(2, "0")}
          </DotMatrixNumeral>
        </div>
        <div className="border border-dashed border-hairline bg-panel p-5 text-panel-ink">
          <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-panel-ink/55">
            Total
          </p>
          <MoneyText
            amount={data.totalInBase}
            currency={data.baseCurrency}
            className="mt-3 block text-2xl font-bold"
          />
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted">
          By category
        </h2>
        <ul className="mt-4 divide-y divide-dashed divide-hairline border border-dashed border-hairline">
          {data.byCategory.map((row) => (
            <li
              key={row.category}
              className="flex items-center justify-between px-4 py-3"
            >
              <span className="text-sm capitalize">{row.category}</span>
              <MoneyText
                amount={row.amountInBase}
                currency={data.baseCurrency}
                className="text-sm font-semibold"
              />
            </li>
          ))}
          {data.byCategory.length === 0 ? (
            <li className="px-4 py-8 text-sm text-muted">
              No categorized spend yet.
            </li>
          ) : null}
        </ul>
      </section>
    </main>
  );
}
