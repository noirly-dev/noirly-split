"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { DotMatrixClock } from "@/src/components/DotMatrix";
import { qk } from "@/src/core/sync/query-keys";
import { api } from "@/src/lib/api-client";

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const preview = useQuery({
    queryKey: qk.invite(token),
    queryFn: () => api.getInvite(token),
  });

  const accept = useMutation({
    mutationFn: () => api.acceptInvite(token),
    onSuccess: (data) => {
      router.push(`/g/${data.groupId}`);
    },
    onError: (err) => {
      const message = (err as Error).message;
      if (
        message.toLowerCase().includes("sign in") ||
        message.toLowerCase().includes("unauthorized")
      ) {
        router.push(`/login?next=${encodeURIComponent(`/invites/${token}`)}`);
        return;
      }
      setError(message);
    },
  });

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-dashed border-hairline px-5 py-5 md:px-10">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center border border-dashed border-hairline font-mono text-xs font-bold tracking-[0.12em]">
            NS
          </span>
          <p className="font-display text-lg font-bold tracking-[-0.04em] uppercase md:text-2xl">
            Noirly Split
          </p>
        </Link>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="pointer-events-none hidden w-10 shrink-0 items-center justify-center border-r border-dashed border-hairline lg:flex">
          <span className="font-mono text-[10px] font-medium tracking-[0.28em] uppercase [writing-mode:vertical-rl] rotate-180">
            Invite
          </span>
        </div>

        <section className="flex flex-1 flex-col justify-between gap-12 px-5 py-10 md:px-12 md:py-16">
          {preview.isLoading ? (
            <p className="text-sm text-muted">Loading invite…</p>
          ) : null}
          {preview.error ? (
            <p className="text-sm text-balance-negative" role="alert">
              {(preview.error as Error).message}
            </p>
          ) : null}
          {preview.data ? (
            <div>
              <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted">
                Join group
              </p>
              <h1 className="text-perforated mt-4 font-display text-5xl leading-[0.9] font-bold tracking-[-0.05em] uppercase md:text-7xl">
                {preview.data.group.name}
              </h1>
              <p className="mt-6 max-w-md text-base text-muted">
                You’ve been invited to split expenses. Base currency{" "}
                <span className="font-mono">
                  {preview.data.group.baseCurrency}
                </span>
                .
              </p>
              {preview.data.email ? (
                <p className="mt-3 text-sm text-muted">
                  Sent for{" "}
                  <span className="font-mono">{preview.data.email}</span>.
                </p>
              ) : null}
            </div>
          ) : null}
          <DotMatrixClock className="text-6xl md:text-8xl" />
        </section>

        <section className="flex w-full flex-col justify-center gap-6 bg-panel px-5 py-10 text-panel-ink md:px-12 md:py-16 lg:w-[42%] lg:max-w-xl">
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-panel-ink/55">
            Continue
          </p>
          {error ? (
            <p className="text-sm text-panel-ink/80" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            variant="ticket"
            disabled={!preview.data || accept.isPending}
            onClick={() => {
              setError(null);
              accept.mutate();
            }}
          >
            {accept.isPending ? "Joining…" : "Accept invite"}
          </Button>
          <Link
            href={`/login?next=${encodeURIComponent(`/invites/${token}`)}`}
            className="font-mono text-[11px] tracking-[0.14em] uppercase text-panel-ink/55 hover:text-panel-ink"
          >
            Sign in first if needed →
          </Link>
        </section>
      </div>
    </div>
  );
}
