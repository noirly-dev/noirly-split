"use client";

import { usePresence, useRealtimeClient } from "@noirly-dev/realtime-client/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { splitChannel } from "@/src/core/realtime/channels";
import { qk } from "@/src/core/sync/query-keys";
import { api } from "@/src/lib/api-client";

/** Announce presence on the group channel while composing an expense. */
export function ExpensePresence({ groupId }: { groupId: string }) {
  if (!process.env.NEXT_PUBLIC_REALTIME_WS_URL) return null;
  return <ExpensePresenceInner groupId={groupId} />;
}

function ExpensePresenceInner({ groupId }: { groupId: string }) {
  const client = useRealtimeClient();
  const channel = splitChannel.group(groupId);
  const me = useQuery({ queryKey: qk.me, queryFn: () => api.me() });
  const { members, join, leave } = usePresence(channel, {
    collapseByUserId: true,
  });

  useEffect(() => {
    void client.connect();
  }, [client]);

  useEffect(() => {
    void join({ activity: "adding_expense" });
    return () => {
      void leave();
    };
  }, [join, leave]);

  const others = members.filter(
    (m) => m.userId !== me.data?.user.id,
  );

  if (others.length === 0) return null;

  return (
    <p
      className="font-mono text-[11px] tracking-[0.12em] uppercase text-muted"
      aria-live="polite"
    >
      {others.length === 1
        ? "Someone else is also here"
        : `${others.length} other members are here`}
    </p>
  );
}
