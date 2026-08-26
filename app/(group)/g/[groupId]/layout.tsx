"use client";

import { AppShell } from "@/src/components/AppShell";
import { GroupRealtime } from "@/src/features/realtime/GroupRealtime";
import { useParams } from "next/navigation";

export default function GroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId;

  return (
    <AppShell>
      <GroupRealtime groupId={groupId} />
      {children}
    </AppShell>
  );
}
