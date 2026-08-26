import { cn } from "@/src/lib/cn";
import type { ReactNode } from "react";

type Props = {
  kicker?: string;
  title: string;
  lead?: string;
  action?: ReactNode;
  className?: string;
};

/** Ledger-style page header: mono kicker → display title → muted lead + action. */
export function PageHeader({ kicker, title, lead, action, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-4",
        className,
      )}
    >
      <div className="min-w-0">
        {kicker ? (
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted">
            {kicker}
          </p>
        ) : null}
        <h1
          className={cn(
            "font-display text-2xl font-bold tracking-[-0.04em] uppercase md:text-3xl",
            kicker ? "mt-2" : "",
          )}
        >
          {title}
        </h1>
        {lead ? <p className="mt-2 max-w-xl text-sm text-muted">{lead}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap items-center gap-3">{action}</div> : null}
    </div>
  );
}
