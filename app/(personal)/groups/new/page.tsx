"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/PageHeader";
import { Button } from "@/src/components/ui/Button";
import { qk } from "@/src/core/sync/query-keys";
import { api } from "@/src/lib/api-client";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  icon: z.string().trim().max(32).optional(),
  color: z.string().trim().max(32).optional(),
  baseCurrency: z
    .string()
    .trim()
    .length(3, "Use a 3-letter currency code")
    .transform((v) => v.toUpperCase()),
});

type FormValues = z.input<typeof schema>;

export default function NewGroupPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      icon: "",
      color: "",
      baseCurrency: "USD",
    },
  });

  const mutation = useMutation({
    mutationFn: api.createGroup,
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: qk.groups });
      router.push(`/g/${data.group.id}`);
    },
  });

  return (
    <main className="mx-auto w-full max-w-lg px-6 py-8">
      <PageHeader
        kicker="Groups"
        title="New group"
        lead="A trip, roommates, or recurring friend circle."
      />

      <form
        className="mt-8 space-y-4 border border-dashed border-hairline bg-surface p-5"
        onSubmit={handleSubmit((values) =>
          mutation.mutate({
            name: values.name,
            icon: values.icon || null,
            color: values.color || null,
            baseCurrency: String(values.baseCurrency).toUpperCase(),
          }),
        )}
      >
        <label className="block">
          <span className="mb-1 block font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
            Name
          </span>
          <input
            className="h-10 w-full border border-dashed border-hairline bg-transparent px-3 text-sm outline-none focus:border-solid"
            {...register("name")}
            autoFocus
          />
          {errors.name ? (
            <span className="mt-1 block text-sm text-balance-negative">
              {errors.name.message}
            </span>
          ) : null}
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
              Icon
            </span>
            <input
              className="h-10 w-full border border-dashed border-hairline bg-transparent px-3 text-sm outline-none focus:border-solid"
              placeholder="🏠"
              {...register("icon")}
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
              Color
            </span>
            <input
              className="h-10 w-full border border-dashed border-hairline bg-transparent px-3 text-sm outline-none focus:border-solid"
              placeholder="#000000"
              {...register("color")}
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
            Base currency
          </span>
          <input
            className="h-10 w-full border border-dashed border-hairline bg-transparent px-3 font-mono text-sm uppercase outline-none focus:border-solid"
            {...register("baseCurrency")}
          />
          {errors.baseCurrency ? (
            <span className="mt-1 block text-sm text-balance-negative">
              {errors.baseCurrency.message}
            </span>
          ) : null}
        </label>

        {mutation.error ? (
          <p className="text-sm text-balance-negative" role="alert">
            {(mutation.error as Error).message}
          </p>
        ) : null}

        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? "Creating…" : "Create group"}
        </Button>
      </form>
    </main>
  );
}
