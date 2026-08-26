"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/PageHeader";
import { Button } from "@/src/components/ui/Button";
import { qk } from "@/src/core/sync/query-keys";
import { api } from "@/src/lib/api-client";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: qk.notifications,
    queryFn: () => api.listNotifications(),
  });

  const markAll = useMutation({
    mutationFn: () => api.markNotificationsRead({ all: true }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: qk.notifications }),
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <PageHeader
        kicker="Inbox"
        title="Alerts"
        lead="Invites, expenses, and settlements that need your eye."
        action={
          <Button
            variant="ghost"
            disabled={markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            Mark all read
          </Button>
        }
      />

      {isLoading ? (
        <p className="mt-8 text-sm text-muted">Loading…</p>
      ) : null}
      {error ? (
        <p className="mt-8 text-sm text-balance-negative" role="alert">
          {(error as Error).message}
        </p>
      ) : null}

      {data && data.items.length === 0 ? (
        <p className="mt-8 border border-dashed border-hairline px-5 py-8 text-sm text-muted">
          No notifications yet.
        </p>
      ) : null}

      {data && data.items.length > 0 ? (
        <ul className="mt-8 divide-y divide-dashed divide-hairline border border-dashed border-hairline">
          {data.items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className={`block px-4 py-4 transition-colors hover:bg-surface ${
                  item.readAt ? "opacity-60" : ""
                }`}
              >
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-1 text-sm text-muted">{item.body}</p>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
