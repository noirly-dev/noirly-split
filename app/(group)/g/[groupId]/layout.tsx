"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/src/core/sync/query-keys";
import { api } from "@/src/lib/api-client";
import { GroupRealtime } from "@/src/features/realtime/GroupRealtime";
import { SignOutButton } from "@/src/features/auth/SignOutButton";

const tabs = [
  { href: "", label: "Expenses" },
  { href: "/balances", label: "Balances" },
  { href: "/activity", label: "Activity" },
  { href: "/reports", label: "Reports" },
  { href: "/members", label: "Members" },
] as const;

export default function GroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId;
  const pathname = usePathname();

  const { data } = useQuery({
    queryKey: qk.group(groupId),
    queryFn: () => api.getGroup(groupId),
  });

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <GroupRealtime groupId={groupId} />
      <header className="border-b border-dashed border-hairline px-5 py-4 md:px-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted"
            >
              ← All groups
            </Link>
            <h1 className="mt-2 font-display text-2xl font-bold tracking-[-0.04em] uppercase md:text-3xl">
              {data?.group.name ?? "Group"}
            </h1>
          </div>
          <SignOutButton />
        </div>
        <nav className="mt-6 flex gap-4 overflow-x-auto">
          {tabs.map((tab) => {
            const href = `/g/${groupId}${tab.href}`;
            const active =
              tab.href === ""
                ? pathname === `/g/${groupId}`
                : pathname.startsWith(href);
            return (
              <Link
                key={tab.href}
                href={href}
                className={`font-mono text-[11px] tracking-[0.14em] uppercase whitespace-nowrap ${
                  active ? "text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="flex flex-1 flex-col px-5 py-8 md:px-10 md:py-10">
        {children}
      </main>
    </div>
  );
}
