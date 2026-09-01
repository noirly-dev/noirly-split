"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button, PageHeader } from "@noirly-dev/ui";
import { qk } from "@/src/core/sync/query-keys";
import { api } from "@/src/lib/api-client";

export default function GroupSettingsPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [mailto, setMailto] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState("");
  const [baseCurrency, setBaseCurrency] = useState("USD");

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

  useEffect(() => {
    if (!group.data) return;
    setName(group.data.group.name);
    setIcon(group.data.group.icon ?? "");
    setColor(group.data.group.color ?? "");
    setBaseCurrency(group.data.group.baseCurrency);
  }, [group.data]);

  const createInvite = useMutation({
    mutationFn: () =>
      api.createInvite(groupId, { email: email.trim() || null }),
    onSuccess: (data) => {
      setInviteUrl(data.invite.url);
      setMailto(data.invite.mailto);
      setCopied(false);
    },
  });

  const update = useMutation({
    mutationFn: () =>
      api.updateGroup(groupId, {
        name: name.trim(),
        icon: icon.trim() || null,
        color: color.trim() || null,
        baseCurrency: baseCurrency.trim().toUpperCase(),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.group(groupId) }),
        queryClient.invalidateQueries({ queryKey: qk.groups }),
      ]);
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

  const remove = useMutation({
    mutationFn: () => api.deleteGroup(groupId),
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
  const canLeave = !(isCreator && (members.data?.members.length ?? 0) > 1);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <PageHeader
        kicker="Group"
        title="Settings"
        lead="Edit the group, invite people, or remove it."
      />

      <form
        className="mt-8 space-y-4 border border border-[var(--hairline)] bg-[var(--surface)] p-5"
        onSubmit={(e) => {
          e.preventDefault();
          update.mutate();
        }}
      >
        <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted-foreground-foreground">
          Details
        </p>
        <label className="block">
          <span className="mb-1 block font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground-foreground">
            Name
          </span>
          <input
            className="h-10 w-full border border border-[var(--hairline)] bg-transparent px-3 text-sm outline-none focus:border-solid"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground-foreground">
              Icon
            </span>
            <input
              className="h-10 w-full border border border-[var(--hairline)] bg-transparent px-3 text-sm outline-none focus:border-solid"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground-foreground">
              Color
            </span>
            <input
              className="h-10 w-full border border border-[var(--hairline)] bg-transparent px-3 text-sm outline-none focus:border-solid"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground-foreground">
            Base currency
          </span>
          <input
            className="h-10 w-full border border border-[var(--hairline)] bg-transparent px-3 font-mono text-sm uppercase outline-none focus:border-solid"
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value.toUpperCase())}
            maxLength={3}
            required
          />
        </label>
        {update.error ? (
          <p className="text-sm text-balance-negative" role="alert">
            {(update.error as Error).message}
          </p>
        ) : null}
        {update.isSuccess ? (
          <p className="text-sm text-muted-foreground-foreground">Saved.</p>
        ) : null}
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? "Saving…" : "Save group"}
        </Button>
      </form>

      <section className="mt-8 border border border-[var(--hairline)] bg-[var(--surface)] p-5">
        <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted-foreground-foreground">
          Invite
        </p>
        <label className="mt-4 block">
          <span className="mb-1 block font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground-foreground">
            Email (optional)
          </span>
          <input
            type="email"
            className="h-10 w-full border border border-[var(--hairline)] bg-transparent px-3 text-sm outline-none focus:border-solid"
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
              className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground-foreground hover:text-foreground"
            >
              Open email draft
            </a>
          ) : null}
        </div>
        {inviteUrl ? (
          <div className="mt-4 space-y-2">
            <code className="block max-w-full truncate border border border-[var(--hairline)] bg-background px-3 py-2 font-mono text-xs">
              {inviteUrl}
            </code>
            <button
              type="button"
              className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground-foreground hover:text-foreground"
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
        <ul className="mt-8 divide-y divide-dashed divide-[var(--hairline)] border border border-[var(--hairline)]">
          {members.data.members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">
                  {member.displayName ?? "Member"}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground-foreground">{member.email}</p>
              </div>
              <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-muted-foreground-foreground">
                Joined {new Date(member.joinedAt).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-10 flex flex-wrap gap-3 border-t border border-[var(--hairline)] pt-6">
        <Button
          variant="destructive"
          disabled={!canLeave || leave.isPending}
          onClick={() => {
            if (window.confirm("Leave this group?")) leave.mutate();
          }}
        >
          Leave group
        </Button>
        {isCreator ? (
          <>
            <Button
              variant="ghost"
              disabled={archive.isPending || remove.isPending}
              onClick={() => {
                if (window.confirm("Archive this group?")) archive.mutate();
              }}
            >
              Archive group
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending || archive.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    "Delete this group permanently? Expenses cannot be recovered.",
                  )
                ) {
                  remove.mutate();
                }
              }}
            >
              {remove.isPending ? "Deleting…" : "Delete group"}
            </Button>
          </>
        ) : null}
        {!canLeave ? (
          <p className="w-full text-sm text-muted-foreground-foreground">
            As creator, archive or delete the group instead of leaving while
            others remain.
          </p>
        ) : null}
        {leave.error ? (
          <p className="w-full text-sm text-balance-negative" role="alert">
            {(leave.error as Error).message}
          </p>
        ) : null}
        {remove.error ? (
          <p className="w-full text-sm text-balance-negative" role="alert">
            {(remove.error as Error).message}
          </p>
        ) : null}
      </div>

      <p className="mt-8">
        <Link
          href={`/g/${groupId}`}
          className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground-foreground hover:text-foreground"
        >
          ← Back to expenses
        </Link>
      </p>
    </main>
  );
}
