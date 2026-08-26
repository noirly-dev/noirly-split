"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/src/components/PageHeader";
import { Button } from "@/src/components/ui/Button";
import { qk } from "@/src/core/sync/query-keys";
import { api } from "@/src/lib/api-client";

export default function MembersPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [mailto, setMailto] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);

  const members = useQuery({
    queryKey: qk.members(groupId),
    queryFn: () => api.listMembers(groupId),
  });
  const group = useQuery({
    queryKey: qk.group(groupId),
    queryFn: () => api.getGroup(groupId),
  });
  const me = useQuery({
    queryKey: qk.me,
    queryFn: () => api.me(),
  });

  const createInvite = useMutation({
    mutationFn: () =>
      api.createInvite(groupId, { email: email.trim() || null }),
    onSuccess: (data) => {
      setInviteUrl(data.invite.url);
      setMailto(data.invite.mailto);
      setCopied(false);
    },
  });

  const leave = useMutation({
    mutationFn: () => api.leaveGroup(groupId),
    onSuccess: () => router.push("/"),
  });

  const archive = useMutation({
    mutationFn: () => api.archiveGroup(groupId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.groups });
      router.push("/");
    },
  });

  async function copyLink() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
  }

  const isCreator = me.data?.user.id === group.data?.group.createdBy;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <PageHeader
        kicker="Members"
        title="People"
        lead="Anyone with the invite link can join. Flat membership — no roles."
      />

      <section className="mt-8 border border-dashed border-hairline bg-surface p-5">
        <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted">
          Invite
        </p>
        <label className="mt-4 block">
          <span className="mb-1 block font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
            Email (optional)
          </span>
          <input
            type="email"
            className="h-10 w-full border border-dashed border-hairline bg-transparent px-3 text-sm outline-none focus:border-solid"
            placeholder="friend@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            disabled={createInvite.isPending}
            onClick={() => createInvite.mutate()}
          >
            {createInvite.isPending ? "Creating…" : "Create invite link"}
          </Button>
          {mailto ? (
            <a
              href={mailto}
              className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted hover:text-ink"
            >
              Open email draft
            </a>
          ) : null}
        </div>
        {inviteUrl ? (
          <div className="mt-4 space-y-2">
            <code className="block max-w-full truncate border border-dashed border-hairline bg-canvas px-3 py-2 font-mono text-xs">
              {inviteUrl}
            </code>
            <button
              type="button"
              className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted hover:text-ink"
              onClick={() => void copyLink()}
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        ) : null}
        {createInvite.error ? (
          <p className="mt-3 text-sm text-balance-negative" role="alert">
            {(createInvite.error as Error).message}
          </p>
        ) : null}
      </section>

      {members.data ? (
        <ul className="mt-8 divide-y divide-dashed divide-hairline border border-dashed border-hairline">
          {members.data.members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">
                  {member.displayName ?? "Member"}
                </p>
                <p className="font-mono text-[11px] text-muted">{member.email}</p>
              </div>
              <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-muted">
                Joined {new Date(member.joinedAt).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-10 flex flex-wrap gap-3 border-t border-dashed border-hairline pt-6">
        <Button
          variant="danger"
          disabled={leave.isPending}
          onClick={() => {
            if (window.confirm("Leave this group?")) leave.mutate();
          }}
        >
          Leave group
        </Button>
        {isCreator ? (
          <Button
            variant="ghost"
            disabled={archive.isPending}
            onClick={() => {
              if (window.confirm("Archive this group?")) archive.mutate();
            }}
          >
            Archive group
          </Button>
        ) : null}
      </div>
    </main>
  );
}
