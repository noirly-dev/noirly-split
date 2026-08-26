"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
    <div className="mx-auto w-full max-w-lg">
      <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted">
        Groups
      </p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-[-0.04em] uppercase">
        New group
      </h1>

      <form
        className="mt-10 flex flex-col gap-6"
        onSubmit={handleSubmit((values) =>
          mutation.mutate({
            name: values.name,
            icon: values.icon || null,
            color: values.color || null,
            baseCurrency: String(values.baseCurrency).toUpperCase(),
          }),
        )}
      >
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
            Name
          </span>
          <input
            className="h-12 border border-dashed border-hairline bg-transparent px-4 outline-none focus:border-solid"
            {...register("name")}
            autoFocus
          />
          {errors.name ? (
            <span className="text-sm text-balance-negative">
              {errors.name.message}
            </span>
          ) : null}
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-2">
            <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
              Icon
            </span>
            <input
              className="h-12 border border-dashed border-hairline bg-transparent px-4 outline-none focus:border-solid"
              placeholder="🏠"
              {...register("icon")}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
              Color
            </span>
            <input
              className="h-12 border border-dashed border-hairline bg-transparent px-4 outline-none focus:border-solid"
              placeholder="#000000"
              {...register("color")}
            />
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
            Base currency
          </span>
          <input
            className="h-12 border border-dashed border-hairline bg-transparent px-4 font-mono uppercase outline-none focus:border-solid"
            {...register("baseCurrency")}
          />
          {errors.baseCurrency ? (
            <span className="text-sm text-balance-negative">
              {errors.baseCurrency.message}
            </span>
          ) : null}
        </label>

        {mutation.error ? (
          <p className="text-balance-negative" role="alert">
            {(mutation.error as Error).message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="h-12 bg-panel font-mono text-[11px] font-semibold tracking-[0.16em] text-panel-ink uppercase disabled:opacity-50"
        >
          {mutation.isPending ? "Creating…" : "Create group"}
        </button>
      </form>
    </div>
  );
}
