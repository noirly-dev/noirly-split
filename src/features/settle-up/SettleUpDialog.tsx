"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoneyText, parseMajorToMinor } from "@/src/components/MoneyText";
import { Button } from "@/src/components/ui/Button";
import { venmoPayLink } from "@/src/core/payments/links";
import { qk } from "@/src/core/sync/query-keys";
import { api } from "@/src/lib/api-client";

type Props = {
  groupId: string;
  baseCurrency: string;
  fromUserId: string;
  toUserId: string;
  fromDisplayName: string;
  toDisplayName: string;
  defaultAmount: number;
  onClose: () => void;
};

export function SettleUpDialog({
  groupId,
  baseCurrency,
  fromUserId,
  toUserId,
  fromDisplayName,
  toDisplayName,
  defaultAmount,
  onClose,
}: Props) {
  const titleId = useId();
  const firstField = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [amountMajor, setAmountMajor] = useState(
    (defaultAmount / 100).toFixed(2),
  );
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    firstField.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const mutation = useMutation({
    mutationFn: (amount: number) =>
      api.createSettlement(groupId, {
        fromUserId,
        toUserId,
        amount,
        note: note.trim() || null,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.balances(groupId) }),
        queryClient.invalidateQueries({ queryKey: qk.settlements(groupId) }),
        queryClient.invalidateQueries({ queryKey: qk.activity(groupId) }),
        queryClient.invalidateQueries({ queryKey: qk.dashboardBalances() }),
      ]);
      onClose();
    },
    onError: (err) => setError((err as Error).message),
  });

  const amountNum = Number(amountMajor) || defaultAmount / 100;
  const venmo = venmoPayLink({
    amountMajor: amountNum,
    note: note || `Noirly Split · ${fromDisplayName} → ${toDisplayName}`,
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md border border-dashed border-hairline bg-canvas p-6 shadow-none"
      >
        <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted">
          Settlement
        </p>
        <h2
          id={titleId}
          className="mt-2 font-display text-2xl font-bold tracking-[-0.03em] uppercase"
        >
          Settle up
        </h2>
        <p className="mt-2 text-sm text-muted">
          {fromDisplayName} pays {toDisplayName}
        </p>

        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            const amount = parseMajorToMinor(amountMajor);
            if (amount == null || amount <= 0) {
              setError("Enter a valid amount");
              return;
            }
            mutation.mutate(amount);
          }}
        >
          <label className="flex flex-col gap-2">
            <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
              Amount ({baseCurrency})
            </span>
            <input
              ref={firstField}
              className="h-12 border border-dashed border-hairline bg-transparent px-4 font-mono outline-none focus:border-solid"
              value={amountMajor}
              onChange={(e) => setAmountMajor(e.target.value)}
              inputMode="decimal"
            />
            <MoneyText
              amount={parseMajorToMinor(amountMajor) ?? 0}
              currency={baseCurrency}
              className="text-sm text-muted"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
              Note (optional)
            </span>
            <input
              className="h-12 border border-dashed border-hairline bg-transparent px-4 outline-none focus:border-solid"
              placeholder="Paid via Venmo"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>

          <a
            href={venmo}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[11px] tracking-[0.12em] uppercase text-muted hover:text-ink"
          >
            Open Venmo pay link →
          </a>

          {error ? (
            <p className="text-balance-negative" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-2 flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving…" : "Record payment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
