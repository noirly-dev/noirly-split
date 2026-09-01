"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button, PageContainer, PageHeader } from "@noirly-dev/ui";
import { DotMatrixNumeral } from "@/src/components/DotMatrix";
import { qk } from "@/src/core/sync/query-keys";
import { api } from "@/src/lib/api-client";

export default function HomePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: qk.groups,
    queryFn: () => api.listGroups(),
  });

  return (
    <PageContainer size="lg">
      <PageHeader
        kicker="Personal"
        title="Groups"
        lead="Create a group, invite people, and track shared expenses."
        action={
          <Link href="/groups/new">
            <Button>New group</Button>
          </Link>
        }
      />

      <div className="mt-8 border border border-[var(--hairline)] bg-[var(--surface)] p-5 sm:max-w-xs">
        <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground-foreground">
          Groups
        </p>
        <DotMatrixNumeral className="mt-3 text-3xl">
          {String(data?.groups.length ?? 0).padStart(2, "0")}
        </DotMatrixNumeral>
      </div>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted-foreground-foreground">
            Your groups
          </h2>
          <Link
            href="/groups/new"
            className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground-foreground hover:text-foreground"
          >
            Add →
          </Link>
        </div>

        {isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground-foreground">Loading groups…</p>
        ) : null}
        {error ? (
          <p className="mt-4 text-sm text-balance-negative" role="alert">
            {(error as Error).message}
          </p>
        ) : null}

        {data && data.groups.length === 0 ? (
          <div className="mt-4 border border border-[var(--hairline)] px-6 py-10">
            <p className="font-display text-2xl font-bold uppercase tracking-[-0.03em]">
              No groups yet
            </p>
            <p className="mt-2 text-sm text-muted-foreground-foreground">
              Create a group to start adding expenses.
            </p>
            <Link href="/groups/new" className="mt-6 inline-block">
              <Button>Create group</Button>
            </Link>
          </div>
        ) : null}

        {data && data.groups.length > 0 ? (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {data.groups.map((group) => (
              <li key={group.id}>
                <Link
                  href={`/g/${group.id}`}
                  className="block border border border-[var(--hairline)] bg-[var(--surface)] p-4 transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-bold tracking-[-0.03em] uppercase">
                        {group.icon ? `${group.icon} ` : ""}
                        {group.name}
                      </p>
                      <p className="mt-2 font-mono text-[11px] tracking-[0.12em] uppercase opacity-70">
                        {group.baseCurrency}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] tracking-[0.14em] uppercase opacity-70">
                      Open
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </PageContainer>
  );
}
