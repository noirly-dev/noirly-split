"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell as NoirlyAppShell, SidebarBrand, type AppNavItem } from "@noirly-dev/ui";
import { SignOutButton } from "@/src/features/auth/SignOutButton";
import { CommandPalette } from "@/src/features/command-palette/CommandPalette";
import { useUIStore } from "@/src/stores/ui-store";
import { qk } from "@/src/core/sync/query-keys";
import { api } from "@/src/lib/api-client";

type Props = {
  children: ReactNode;
};

export function AppShell({ children }: Props) {
  const pathname = usePathname();

  const me = useQuery({ queryKey: qk.me, queryFn: () => api.me() });
  const groups = useQuery({
    queryKey: qk.groups,
    queryFn: () => api.listGroups(),
  });

  const groupMatch = pathname.match(/^\/g\/([^/]+)/);
  const activeGroupId = groupMatch?.[1] ?? null;
  const activeGroup = groups.data?.groups.find((g) => g.id === activeGroupId);

  const navItems = useMemo<AppNavItem[]>(() => {
    const items: AppNavItem[] = (groups.data?.groups ?? []).slice(0, 12).map((group) => ({
      href: `/g/${group.id}`,
      label: group.name,
      match: "prefix" as const,
    }));

    if (activeGroupId) {
      items.push(
        { href: `/g/${activeGroupId}`, label: "Expenses", match: "exact" },
        { href: `/g/${activeGroupId}/settings`, label: "Group", match: "prefix" },
      );
    }

    items.push(
      { href: "/home", label: "Groups", match: "exact" },
      { href: "/groups/new", label: "New group", match: "prefix" },
    );

    return items;
  }, [activeGroupId, groups.data?.groups]);

  return (
    <>
      <NoirlyAppShell
        sidebar={{
          brand: (
            <Link href="/home">
              <SidebarBrand
                logo={
                  <span className="font-mono text-xs font-bold tracking-[0.12em]">NS</span>
                }
                title="Noirly Split"
                subtitle="Shared expenses"
              />
            </Link>
          ),
          children: (
            <button
              type="button"
              onClick={() => useUIStore.getState().setCommandPaletteOpen(true)}
              className="flex w-full items-center justify-between rounded-xl border border-[var(--hairline)] bg-[var(--surface-2)] px-3 py-2 text-left text-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
            >
              <span>Search</span>
              <span className="font-mono text-[10px]">⌘K</span>
            </button>
          ),
          items: navItems,
          footer: (
            <div>
              <p className="truncate text-sm text-[var(--foreground)]">
                {me.data?.user.displayName ?? "…"}
              </p>
              <p className="truncate font-mono text-[11px] text-[var(--muted-foreground)]">
                {me.data?.user.email ?? ""}
              </p>
              <div className="mt-3">
                <SignOutButton />
              </div>
            </div>
          ),
        }}
        header={{
          brand: (
            <p className="font-display truncate text-sm font-semibold tracking-tight">
              {activeGroup?.name ?? "Noirly Split"}
            </p>
          ),
        }}
      >
        {children}
      </NoirlyAppShell>
      <CommandPalette />
    </>
  );
}
