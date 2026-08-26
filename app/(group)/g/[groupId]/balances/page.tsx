"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/src/components/PageHeader";
import { MoneyText } from "@/src/components/MoneyText";
import { SettleUpDialog } from "@/src/features/settle-up/SettleUpDialog";
import { qk } from "@/src/core/sync/query-keys";
import { api } from "@/src/lib/api-client";

type SettleTarget = {
  fromUserId: string;
  toUserId: string;
  fromDisplayName: string;
  toDisplayName: string;
  amountInBase: number;
};

export default function BalancesPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId;
  const [settle, setSettle] = useState<SettleTarget | null>(null);

  const balances = useQuery({
    queryKey: qk.balances(groupId),
    queryFn: () => api.getBalances(groupId),
  });
  const me = useQuery({
    queryKey: qk.me,
    queryFn: () => api.me(),
  });

  if (balances.isLoading) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-8">
        <p className="text-sm text-muted">Loading balances…</p>
      </main>
    );
  }

  if (balances.error || !balances.data) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-8">
        <p className="text-sm text-balance-negative" role="alert">
          {(balances.error as Error)?.message ?? "Failed to load"}
        </p>
      </main>
    );
  }

  const data = balances.data;
  const yourNet = data.yourNet;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <PageHeader
        kicker="Balances"
        title="Who owes whom"
        lead={`Simplified settlements in ${data.baseCurrency}.`}
      />

      <div className="mt-8 border border-dashed border-hairline bg-panel p-5 text-panel-ink">
        <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-panel-ink/55">
          Your position
        </p>
        <p className="mt-3 font-display text-2xl font-bold tracking-[-0.03em] uppercase">
          {yourNet > 0
            ? "You are owed"
            : yourNet < 0
              ? "You owe"
              : "You are settled"}
        </p>
        <MoneyText
          amount={Math.abs(yourNet)}
          currency={data.baseCurrency}
          className="mt-2 block text-3xl font-bold"
        />
      </div>

      <section className="mt-10">
        <h2 className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted">
          Simplified debts
        </h2>
        {data.simplified.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Everyone is settled.</p>
        ) : (
          <ul className="mt-4 divide-y divide-dashed divide-hairline border border-dashed border-hairline">
            {data.simplified.map((debt) => (
              <li
                key={`${debt.fromUserId}-${debt.toUserId}`}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <p className="text-sm">
                  <span className="font-medium">{debt.fromDisplayName}</span>
                  <span className="text-muted"> owes </span>
                  <span className="font-medium">{debt.toDisplayName}</span>
                </p>
                <div className="flex items-center gap-4">
                  <MoneyText
                    amount={debt.amountInBase}
                    currency={data.baseCurrency}
                    className="text-sm font-semibold"
                  />
                  <button
                    type="button"
                    className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted hover:text-ink"
                    onClick={() => setSettle(debt)}
                  >
                    Settle
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted">
          Net by member
        </h2>
        <ul className="mt-4 divide-y divide-dashed divide-hairline border border-dashed border-hairline">
          {data.nets.map((net) => {
            const isYou = me.data?.user.id === net.userId;
            const color =
              net.netInBase > 0
                ? "text-balance-positive"
                : net.netInBase < 0
                  ? "text-balance-negative"
                  : "text-muted";
            return (
              <li
                key={net.userId}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm">
                  {net.displayName}
                  {isYou ? (
                    <span className="ml-2 font-mono text-[10px] uppercase text-muted">
                      you
                    </span>
                  ) : null}
                </span>
                <MoneyText
                  amount={net.netInBase}
                  currency={data.baseCurrency}
                  signed
                  className={`text-sm ${color}`}
                />
              </li>
            );
          })}
        </ul>
      </section>

      {settle ? (
        <SettleUpDialog
          groupId={groupId}
          baseCurrency={data.baseCurrency}
          fromUserId={settle.fromUserId}
          toUserId={settle.toUserId}
          fromDisplayName={settle.fromDisplayName}
          toDisplayName={settle.toDisplayName}
          defaultAmount={settle.amountInBase}
          onClose={() => setSettle(null)}
        />
      ) : null}
    </main>
  );
}
