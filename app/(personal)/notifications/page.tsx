"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-4xl font-bold tracking-[-0.04em] uppercase">
          Alerts
        </h1>
        <button
          type="button"
          className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted hover:text-ink"
          onClick={() => markAll.mutate()}
        >
          Mark all read
        </button>
      </div>

      {isLoading ? (
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          Loading…
        </p>
      ) : null}
      {error ? (
        <p className="text-balance-negative" role="alert">
          {(error as Error).message}
        </p>
      ) : null}

      {data && data.items.length === 0 ? (
        <p className="border border-dashed border-hairline px-5 py-8 text-muted">
          No notifications yet.
        </p>
      ) : null}

      {data && data.items.length > 0 ? (
        <ul className="divide-y divide-dashed divide-hairline border border-dashed border-hairline">
          {data.items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className={`block px-5 py-4 transition-colors hover:bg-surface ${
                  item.readAt ? "opacity-60" : ""
                }`}
              >
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-sm text-muted">{item.body}</p>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
