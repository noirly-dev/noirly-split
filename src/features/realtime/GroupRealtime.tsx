"use client";

import {
  useChannel,
  useRealtimeClient,
  useRealtimeEvent,
} from "@noirly-dev/realtime-client/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Expense, Settlement } from "@/src/core/models/types";
import { splitChannel } from "@/src/core/realtime/channels";
import { qk } from "@/src/core/sync/query-keys";

function invalidateGroup(queryClient: ReturnType<typeof useQueryClient>, groupId: string) {
  void queryClient.invalidateQueries({ queryKey: qk.expenses(groupId) });
  void queryClient.invalidateQueries({ queryKey: qk.balances(groupId) });
  void queryClient.invalidateQueries({ queryKey: qk.activity(groupId) });
  void queryClient.invalidateQueries({ queryKey: qk.settlements(groupId) });
  void queryClient.invalidateQueries({ queryKey: qk.members(groupId) });
}

function GroupRealtimeInner({ groupId }: { groupId: string }) {
  const client = useRealtimeClient();
  const queryClient = useQueryClient();
  const channel = splitChannel.group(groupId);

  useEffect(() => {
    void client.connect();
  }, [client]);

  useChannel(channel, { presence: true });

  useRealtimeEvent<{ expense: Expense }>(channel, "expense.added", (data) => {
    if (!data?.expense) {
      invalidateGroup(queryClient, groupId);
      return;
    }
    queryClient.setQueryData<{ expenses: Expense[] }>(
      qk.expenses(groupId),
      (old) => {
        const list = old?.expenses ?? [];
        if (list.some((e) => e.id === data.expense.id)) {
          return {
            expenses: list.map((e) =>
              e.id === data.expense.id ? data.expense : e,
            ),
          };
        }
        return {
          expenses: [
            data.expense,
            ...list.filter((e) => !e.id.startsWith("temp-")),
          ],
        };
      },
    );
    queryClient.setQueryData(qk.expense(data.expense.id), {
      expense: data.expense,
    });
    void queryClient.invalidateQueries({ queryKey: qk.balances(groupId) });
    void queryClient.invalidateQueries({ queryKey: qk.activity(groupId) });
  });

  useRealtimeEvent<{ expense: Expense }>(channel, "expense.updated", (data) => {
    if (!data?.expense) {
      invalidateGroup(queryClient, groupId);
      return;
    }
    queryClient.setQueryData<{ expenses: Expense[] }>(
      qk.expenses(groupId),
      (old) => ({
        expenses: (old?.expenses ?? []).map((e) =>
          e.id === data.expense.id ? data.expense : e,
        ),
      }),
    );
    queryClient.setQueryData(qk.expense(data.expense.id), {
      expense: data.expense,
    });
    void queryClient.invalidateQueries({ queryKey: qk.balances(groupId) });
    void queryClient.invalidateQueries({ queryKey: qk.activity(groupId) });
  });

  useRealtimeEvent<{ expenseId: string }>(channel, "expense.deleted", (data) => {
    if (data?.expenseId) {
      queryClient.setQueryData<{ expenses: Expense[] }>(
        qk.expenses(groupId),
        (old) => ({
          expenses: (old?.expenses ?? []).filter(
            (e) => e.id !== data.expenseId,
          ),
        }),
      );
    }
    void queryClient.invalidateQueries({ queryKey: qk.balances(groupId) });
    void queryClient.invalidateQueries({ queryKey: qk.activity(groupId) });
  });

  useRealtimeEvent<{ settlement: Settlement }>(
    channel,
    "settlement.recorded",
    () => {
      void queryClient.invalidateQueries({ queryKey: qk.balances(groupId) });
      void queryClient.invalidateQueries({ queryKey: qk.settlements(groupId) });
      void queryClient.invalidateQueries({ queryKey: qk.activity(groupId) });
    },
  );

  useRealtimeEvent(channel, "member.joined", () => {
    void queryClient.invalidateQueries({ queryKey: qk.members(groupId) });
    void queryClient.invalidateQueries({ queryKey: qk.activity(groupId) });
  });

  return null;
}

export function GroupRealtime({ groupId }: { groupId: string }) {
  if (!process.env.NEXT_PUBLIC_REALTIME_WS_URL) {
    return null;
  }
  return <GroupRealtimeInner groupId={groupId} />;
}
