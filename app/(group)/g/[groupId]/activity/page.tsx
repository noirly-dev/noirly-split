"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatMoney } from "@/src/core/money";
import { qk } from "@/src/core/sync/query-keys";
import { api } from "@/src/lib/api-client";

function formatActivity(
  type: string,
  actor: string,
  payload: Record<string, unknown>,
): string {
  switch (type) {
    case "expense.added":
      return `${actor} added “${String(payload.description ?? "an expense")}”${
        typeof payload.amount === "number" && typeof payload.currency === "string"
          ? ` (${formatMoney(payload.amount, payload.currency)})`
          : ""
      }`;
    case "expense.updated":
      return `${actor} updated “${String(payload.description ?? "an expense")}”`;
    case "expense.deleted":
      return `${actor} deleted “${String(payload.description ?? "an expense")}”`;
    case "settlement.recorded":
      return `${actor} recorded a settlement${
        typeof payload.amount === "number" && typeof payload.currency === "string"
          ? ` of ${formatMoney(payload.amount, payload.currency)}`
          : ""
      }`;
    case "member.joined":
      return `${actor} joined the group`;
    case "group.updated":
      return `${actor} updated the group`;
    default:
      return `${actor} · ${type}`;
  }
}

export default function ActivityPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId;

  const activity = useQuery({
    queryKey: qk.activity(groupId),
    queryFn: () => api.listActivity(groupId),
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h2 className="font-display text-3xl font-bold tracking-[-0.04em] uppercase">
          Activity
        </h2>
        <p className="mt-2 text-muted">Recent changes in this group.</p>
      </div>

      {activity.isLoading ? (
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          Loading…
        </p>
      ) : null}

      {activity.error ? (
        <p className="text-balance-negative" role="alert">
          {(activity.error as Error).message}
        </p>
      ) : null}

      {activity.data && activity.data.items.length === 0 ? (
        <p className="border border-dashed border-hairline px-5 py-8 text-muted">
          No activity yet.
        </p>
      ) : null}

      {activity.data && activity.data.items.length > 0 ? (
        <ul className="divide-y divide-dashed divide-hairline border border-dashed border-hairline">
          {activity.data.items.map((item) => (
            <li key={item.id} className="px-5 py-4">
              <p>{formatActivity(item.type, item.actorDisplayName, item.payload)}</p>
              <p className="mt-1 font-mono text-[11px] tracking-[0.1em] uppercase text-muted">
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
