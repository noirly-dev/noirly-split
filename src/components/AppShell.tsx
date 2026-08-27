"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { SignOutButton } from "@/src/features/auth/SignOutButton";
import { CommandPalette } from "@/src/features/command-palette/CommandPalette";
import { useUIStore } from "@/src/stores/ui-store";
import { qk } from "@/src/core/sync/query-keys";
import { api } from "@/src/lib/api-client";
import { cn } from "@/src/lib/cn";

function navClass(active: boolean) {
  return cn(
    "block border border-transparent px-3 py-2 text-sm",
    active
      ? "bg-ink text-canvas"
      : "text-muted hover:bg-ink hover:text-canvas",
  );
}

type Props = {
  children: ReactNode;
};

export function AppShell({ children }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const me = useQuery({ queryKey: qk.me, queryFn: () => api.me() });
  const groups = useQuery({
    queryKey: qk.groups,
    queryFn: () => api.listGroups(),
  });

  const groupMatch = pathname.match(/^\/g\/([^/]+)/);
  const activeGroupId = groupMatch?.[1] ?? null;
  const activeGroup = groups.data?.groups.find((g) => g.id === activeGroupId);

  const groupLinks = activeGroupId
    ? [
        { href: `/g/${activeGroupId}`, label: "Expenses", exact: true },
        { href: `/g/${activeGroupId}/settings`, label: "Group" },
      ]
    : [];

  return (
    <div className="flex min-h-full">
      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-dashed border-hairline bg-canvas transition-transform md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="border-b border-dashed border-hairline px-5 py-5">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3"
          >
            <span className="flex h-10 w-10 items-center justify-center border border-dashed border-hairline font-mono text-xs font-bold tracking-[0.12em]">
              NS
            </span>
            <p className="font-display text-lg font-bold tracking-[-0.04em] uppercase">
              Noirly Split
            </p>
          </Link>
          <button
            type="button"
            onClick={() => useUIStore.getState().setCommandPaletteOpen(true)}
            className="mt-3 flex w-full items-center justify-between border border-dashed border-hairline bg-surface px-3 py-2 text-left text-sm text-muted hover:bg-ink hover:text-canvas"
          >
            <span>Search</span>
            <span className="font-mono text-[10px]">⌘K</span>
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
          <section>
            <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              Groups
            </p>
            <ul className="flex flex-col gap-1">
              {(groups.data?.groups ?? []).slice(0, 12).map((group) => (
                <li key={group.id}>
                  <Link
                    href={`/g/${group.id}`}
                    onClick={() => setOpen(false)}
                    className={navClass(activeGroupId === group.id)}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate">{group.name}</span>
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide opacity-70">
                        {group.baseCurrency}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
              {(groups.data?.groups.length ?? 0) === 0 ? (
                <li className="px-3 py-2 text-sm text-muted">No groups yet</li>
              ) : null}
            </ul>
          </section>

          {activeGroup ? (
            <section>
              <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                {activeGroup.name}
              </p>
              <ul className="flex flex-col gap-1">
                {groupLinks.map((link) => {
                  const active = link.exact
                    ? pathname === link.href
                    : pathname.startsWith(link.href);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className={navClass(active)}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <section>
            <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              Navigate
            </p>
            <ul className="flex flex-col gap-1">
              <li>
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className={navClass(pathname === "/")}
                >
                  Groups
                </Link>
              </li>
              <li>
                <Link
                  href="/groups/new"
                  onClick={() => setOpen(false)}
                  className={navClass(pathname.startsWith("/groups/new"))}
                >
                  New group
                </Link>
              </li>
            </ul>
          </section>
        </nav>

        <div className="border-t border-dashed border-hairline px-4 py-4">
          <p className="truncate text-sm text-ink">
            {me.data?.user.displayName ?? "…"}
          </p>
          <p className="truncate font-mono text-[11px] text-muted">
            {me.data?.user.email ?? ""}
          </p>
          <div className="mt-3">
            <SignOutButton />
          </div>
        </div>
      </aside>

      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-dashed border-hairline px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="border border-dashed border-hairline px-3 py-1.5 text-sm text-ink"
          >
            Menu
          </button>
          <p className="font-display text-sm font-bold tracking-[-0.04em] uppercase">
            {activeGroup?.name ?? "Noirly Split"}
          </p>
        </header>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
      <CommandPalette />
    </div>
  );
}
