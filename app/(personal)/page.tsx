"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DashboardBalancesBanner } from "@/src/features/dashboard/DashboardBalancesBanner";
import { qk } from "@/src/core/sync/query-keys";
import { api } from "@/src/lib/api-client";

export default function HomePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: qk.groups,
    queryFn: () => api.listGroups(),
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div>
        <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted">
          Dashboard
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-[-0.04em] uppercase md:text-5xl">
          Your groups
        </h1>
        <p className="mt-3 max-w-lg text-muted">
          Trips, roommates, and friend circles — split costs and settle up.
        </p>
      </div>

      <DashboardBalancesBanner />

      {isLoading ? (
        <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
          Loading…
        </p>
      ) : null}

      {error ? (
        <p className="text-balance-negative" role="alert">
          {(error as Error).message}
        </p>
      ) : null}

      {data && data.groups.length === 0 ? (
        <div className="border border-dashed border-hairline px-6 py-10">
          <p className="font-display text-2xl font-bold uppercase tracking-[-0.03em]">
            No groups yet
          </p>
          <p className="mt-2 text-muted">
            Create a group to start splitting costs.
          </p>
          <Link
            href="/groups/new"
            className="mt-6 inline-flex h-11 items-center bg-panel px-5 font-mono text-[11px] font-semibold tracking-[0.16em] text-panel-ink uppercase"
          >
            Create group
          </Link>
        </div>
      ) : null}

      {data && data.groups.length > 0 ? (
        <ul className="divide-y divide-dashed divide-hairline border border-dashed border-hairline">
          {data.groups.map((group) => (
            <li key={group.id}>
              <Link
                href={`/g/${group.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center border border-dashed border-hairline font-mono text-sm"
                    style={
                      group.color
                        ? { borderColor: group.color, color: group.color }
                        : undefined
                    }
                  >
                    {group.icon ?? group.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <p className="font-display text-lg font-bold tracking-[-0.03em]">
                      {group.name}
                    </p>
                    <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-muted">
                      {group.baseCurrency}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
                  Open →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
