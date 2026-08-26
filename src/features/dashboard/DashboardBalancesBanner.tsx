"use client";

import { useQuery } from "@tanstack/react-query";
import { MoneyText } from "@/src/components/MoneyText";
import { qk } from "@/src/core/sync/query-keys";
import { api } from "@/src/lib/api-client";

export function DashboardBalancesBanner() {
  const { data } = useQuery({
    queryKey: qk.dashboardBalances(),
    queryFn: () => api.dashboardBalances(),
  });

  if (!data) return null;

  if (data.mixed) {
    return (
      <div className="border border-dashed border-hairline px-5 py-4">
        <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
          Across groups
        </p>
        <p className="mt-2 text-muted">
          Groups use different base currencies — totals shown per currency.
        </p>
        <ul className="mt-3 space-y-2">
          {Object.entries(data.byCurrency).map(([currency, row]) => (
            <li key={currency} className="text-sm">
              <span className="font-mono">{currency}</span>: owed{" "}
              <MoneyText
                amount={row.owedToYou}
                currency={currency}
                className="text-balance-positive"
              />
              , owe{" "}
              <MoneyText
                amount={row.youOwe}
                currency={currency}
                className="text-balance-negative"
              />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!data.currency) return null;

  return (
    <div className="border border-dashed border-hairline px-5 py-4">
      <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
        Across groups
      </p>
      <p className="mt-2 flex flex-wrap gap-6 text-lg">
        <span className="text-balance-positive">
          You are owed{" "}
          <MoneyText
            amount={data.owedToYou ?? 0}
            currency={data.currency}
            className="font-bold"
          />
        </span>
        <span className="text-balance-negative">
          You owe{" "}
          <MoneyText
            amount={data.youOwe ?? 0}
            currency={data.currency}
            className="font-bold"
          />
        </span>
      </p>
    </div>
  );
}
