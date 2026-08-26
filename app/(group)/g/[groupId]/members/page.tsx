"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <div>
        <h2 className="font-display text-3xl font-bold tracking-[-0.04em] uppercase">
          Members
        </h2>
        <p className="mt-2 text-muted">
          Anyone with the invite link can join. No roles — flat membership.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
            Email invite (optional)
          </span>
          <input
            type="email"
            className="h-11 border border-dashed border-hairline bg-transparent px-3 outline-none focus:border-solid"
            placeholder="friend@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="h-11 bg-panel px-5 font-mono text-[11px] font-semibold tracking-[0.16em] text-panel-ink uppercase disabled:opacity-50"
            disabled={createInvite.isPending}
            onClick={() => createInvite.mutate()}
          >
            {createInvite.isPending ? "Creating…" : "Create invite link"}
          </button>
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
          <>
            <code className="max-w-full truncate border border-dashed border-hairline px-3 py-2 font-mono text-xs">
              {inviteUrl}
            </code>
            <button
              type="button"
              className="self-start font-mono text-[11px] tracking-[0.14em] uppercase text-muted hover:text-ink"
              onClick={() => void copyLink()}
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </>
        ) : null}
      </div>

      {createInvite.error ? (
        <p className="text-balance-negative" role="alert">
          {(createInvite.error as Error).message}
        </p>
      ) : null}

      {members.data ? (
        <ul className="divide-y divide-dashed divide-hairline border border-dashed border-hairline">
          {members.data.members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between gap-4 px-5 py-4"
            >
              <div>
                <p className="font-medium">{member.displayName ?? "Member"}</p>
                <p className="font-mono text-[11px] text-muted">
                  {member.email}
                </p>
              </div>
              <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-muted">
                Joined {new Date(member.joinedAt).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap gap-3 border-t border-dashed border-hairline pt-6">
        <button
          type="button"
          className="h-11 border border-dashed border-hairline px-5 font-mono text-[11px] tracking-[0.14em] uppercase text-balance-negative disabled:opacity-50"
          disabled={leave.isPending}
          onClick={() => {
            if (window.confirm("Leave this group?")) leave.mutate();
          }}
        >
          Leave group
        </button>
        {isCreator ? (
          <button
            type="button"
            className="h-11 border border-dashed border-hairline px-5 font-mono text-[11px] tracking-[0.14em] uppercase disabled:opacity-50"
            disabled={archive.isPending}
            onClick={() => {
              if (window.confirm("Archive this group?")) archive.mutate();
            }}
          >
            Archive group
          </button>
        ) : null}
      </div>
    </div>
  );
}
