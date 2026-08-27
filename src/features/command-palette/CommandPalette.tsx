"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUIStore } from "@/src/stores/ui-store";
import { qk } from "@/src/core/sync/query-keys";
import { api } from "@/src/lib/api-client";
import { cn } from "@/src/lib/cn";

type Item = {
  id: string;
  label: string;
  hint?: string;
  href: string;
  group: string;
};

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const toggle = useUIStore((s) => s.toggleCommandPalette);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const groups = useQuery({
    queryKey: qk.groups,
    queryFn: () => api.listGroups(),
    enabled: open,
  });

  const groupMatch = pathname.match(/^\/g\/([^/]+)/);
  const activeGroupId = groupMatch?.[1] ?? null;

  const items = useMemo(() => {
    const list: Item[] = [
      { id: "dash", label: "Groups", href: "/", group: "Navigate" },
      {
        id: "new-group",
        label: "New group",
        href: "/groups/new",
        group: "Navigate",
      },
    ];

    if (activeGroupId) {
      list.push(
        {
          id: "add-exp",
          label: "Add expense",
          href: `/g/${activeGroupId}/expenses/new`,
          group: "Actions",
        },
        {
          id: "g-exp",
          label: "Expenses",
          href: `/g/${activeGroupId}`,
          group: "Group",
        },
        {
          id: "g-settings",
          label: "Group settings",
          href: `/g/${activeGroupId}/settings`,
          group: "Group",
        },
      );
    }

    for (const g of groups.data?.groups ?? []) {
      list.push({
        id: `grp-${g.id}`,
        label: g.name,
        hint: g.baseCurrency,
        href: `/g/${g.id}`,
        group: "Groups",
      });
    }

    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.hint?.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q),
    );
  }, [activeGroupId, groups.data?.groups, query]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  if (!open) return null;

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  const grouped = items.reduce<Record<string, Item[]>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-ink/50"
        aria-label="Close command palette"
        onClick={() => setOpen(false)}
      />
      <div className="relative mx-auto mt-24 w-full max-w-lg px-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          className="overflow-hidden border border-dashed border-hairline bg-canvas shadow-none"
        >
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search groups…"
            className="w-full border-b border-dashed border-hairline bg-transparent px-4 py-3 text-sm outline-none"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                setOpen(false);
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, items.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter" && items[active]) {
                e.preventDefault();
                go(items[active]!.href);
              }
            }}
          />
          <div className="max-h-80 overflow-y-auto p-2">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-sm text-muted">No results</p>
            ) : null}
            {Object.entries(grouped).map(([group, groupItems]) => (
              <div key={group} className="mb-2">
                <p className="px-3 py-1 font-mono text-[10px] tracking-[0.16em] uppercase text-muted">
                  {group}
                </p>
                <ul>
                  {groupItems.map((item) => {
                    const index = items.indexOf(item);
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={cn(
                            "flex w-full items-center justify-between px-3 py-2 text-left text-sm",
                            index === active
                              ? "bg-ink text-canvas"
                              : "hover:bg-surface",
                          )}
                          onMouseEnter={() => setActive(index)}
                          onClick={() => go(item.href)}
                        >
                          <span>{item.label}</span>
                          {item.hint ? (
                            <span className="font-mono text-[10px] uppercase opacity-70">
                              {item.hint}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
