"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/src/core/sync/query-keys";
import { api } from "@/src/lib/api-client";

export function NotificationBell() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: qk.notifications,
    queryFn: () => api.listNotifications(),
    refetchInterval: 60_000,
  });

  const markAll = useMutation({
    mutationFn: () => api.markNotificationsRead({ all: true }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: qk.notifications }),
  });

  const unread = data?.unreadCount ?? 0;

  return (
    <div className="relative">
      <Link
        href="/notifications"
        className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted transition-colors hover:text-ink"
      >
        Alerts{unread > 0 ? ` (${unread})` : ""}
      </Link>
      {unread > 0 ? (
        <button
          type="button"
          className="ml-2 font-mono text-[10px] tracking-[0.1em] uppercase text-muted"
          onClick={() => markAll.mutate()}
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}
