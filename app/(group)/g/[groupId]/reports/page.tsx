"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MoneyText } from "@/src/components/MoneyText";
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
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
        Loading…
      </p>
    );
  }

  if (report.error || !report.data) {
    return (
      <p className="text-balance-negative" role="alert">
        {(report.error as Error)?.message ?? "Failed"}
      </p>
    );
  }

  const data = report.data;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <div>
        <h2 className="font-display text-3xl font-bold tracking-[-0.04em] uppercase">
          Reports
        </h2>
        <p className="mt-2 text-muted">
          {data.expenseCount} expenses ·{" "}
          <MoneyText amount={data.totalInBase} currency={data.baseCurrency} />{" "}
          total
        </p>
      </div>

      <section>
        <h3 className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted">
          By category
        </h3>
        <ul className="mt-4 divide-y divide-dashed divide-hairline border border-dashed border-hairline">
          {data.byCategory.map((row) => (
            <li
              key={row.category}
              className="flex items-center justify-between px-5 py-4"
            >
              <span className="capitalize">{row.category}</span>
              <MoneyText
                amount={row.amountInBase}
                currency={data.baseCurrency}
              />
            </li>
          ))}
          {data.byCategory.length === 0 ? (
            <li className="px-5 py-8 text-muted">No categorized spend yet.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
