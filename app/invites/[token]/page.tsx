"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
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
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-6 px-5 py-16">
      <Link
        href="/"
        className="font-display text-lg font-bold tracking-[-0.04em] uppercase"
      >
        Noirly Split
      </Link>
      <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted">
        Invite
      </p>
      {preview.isLoading ? (
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          Loading…
        </p>
      ) : null}
      {preview.error ? (
        <p className="text-balance-negative" role="alert">
          {(preview.error as Error).message}
        </p>
      ) : null}
      {preview.data ? (
        <>
          <h1 className="font-display text-4xl font-bold tracking-[-0.04em] uppercase">
            Join {preview.data.group.name}
          </h1>
          <p className="text-muted">
            You&apos;ve been invited to split expenses together. Base currency{" "}
            <span className="font-mono">{preview.data.group.baseCurrency}</span>.
          </p>
          {preview.data.email ? (
            <p className="text-sm text-muted">
              This invite was sent for{" "}
              <span className="font-mono">{preview.data.email}</span>.
            </p>
          ) : null}
          {error ? (
            <p className="text-balance-negative" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            className="h-12 bg-panel font-mono text-[11px] font-semibold tracking-[0.16em] text-panel-ink uppercase disabled:opacity-50"
            disabled={accept.isPending}
            onClick={() => {
              setError(null);
              accept.mutate();
            }}
          >
            {accept.isPending ? "Joining…" : "Accept invite"}
          </button>
          <Link
            href={`/login?next=${encodeURIComponent(`/invites/${token}`)}`}
            className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted"
          >
            Sign in first if needed →
          </Link>
        </>
      ) : null}
    </div>
  );
}
