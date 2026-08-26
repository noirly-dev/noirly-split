"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
        Loading…
      </p>
    );
  }

  if (balances.error || !balances.data) {
    return (
      <p className="text-balance-negative" role="alert">
        {(balances.error as Error)?.message ?? "Failed to load"}
      </p>
    );
  }

  const data = balances.data;
  const yourNet = data.yourNet;
  const yourClass =
    yourNet > 0
      ? "text-balance-positive"
      : yourNet < 0
        ? "text-balance-negative"
        : "text-balance-zero";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-10">
      <div>
        <h2 className="font-display text-3xl font-bold tracking-[-0.04em] uppercase">
          Balances
        </h2>
        <p className="mt-2 text-muted">
          Simplified settlements for {data.baseCurrency}.
        </p>
        <p className={`mt-4 text-lg ${yourClass}`}>
          {yourNet > 0
            ? "You are owed "
            : yourNet < 0
              ? "You owe "
              : "You are settled "}
          <MoneyText
            amount={Math.abs(yourNet)}
            currency={data.baseCurrency}
            className="text-xl font-bold"
          />
        </p>
      </div>

      <section>
        <h3 className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted">
          Who owes whom
        </h3>
        {data.simplified.length === 0 ? (
          <p className="mt-4 border border-dashed border-hairline px-5 py-8 text-muted">
            Everyone is settled.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-dashed divide-hairline border border-dashed border-hairline">
            {data.simplified.map((debt) => (
              <li
                key={`${debt.fromUserId}-${debt.toUserId}`}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <p>
                  <span className="font-medium">{debt.fromDisplayName}</span>
                  <span className="text-muted"> owes </span>
                  <span className="font-medium">{debt.toDisplayName}</span>
                </p>
                <div className="flex items-center gap-4">
                  <MoneyText
                    amount={debt.amountInBase}
                    currency={data.baseCurrency}
                    className="text-base font-semibold"
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

      <section>
        <h3 className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted">
          Net by member
        </h3>
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
                className="flex items-center justify-between px-5 py-4"
              >
                <span>
                  {net.displayName}
                  {isYou ? " (you)" : ""}
                </span>
                <MoneyText
                  amount={net.netInBase}
                  currency={data.baseCurrency}
                  signed
                  className={color}
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
    </div>
  );
}
