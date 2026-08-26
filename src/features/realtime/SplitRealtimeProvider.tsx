"use client";

import { RealtimeClient } from "@noirly-dev/realtime-client";
import { RealtimeProvider } from "@noirly-dev/realtime-client/react";
import { useMemo, type ReactNode } from "react";

async function fetchRealtimeToken(): Promise<string> {
  const res = await fetch("/api/realtime/token");
  if (!res.ok) {
    throw new Error("Failed to mint realtime token");
  }
  const json = (await res.json()) as { token: string };
  return json.token;
}

export function SplitRealtimeProvider({ children }: { children: ReactNode }) {
  const url = process.env.NEXT_PUBLIC_REALTIME_WS_URL;
  const client = useMemo(() => {
    if (!url) return null;
    return new RealtimeClient({
      url,
      getToken: fetchRealtimeToken,
    });
  }, [url]);

  if (!client) return children;

  return (
    <RealtimeProvider client={client} autoConnect={false}>
      {children}
    </RealtimeProvider>
  );
}
