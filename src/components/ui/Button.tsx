import { cn } from "@/src/lib/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "danger" | "ticket";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-ink px-4 text-canvas hover:bg-transparent hover:text-ink hover:outline hover:outline-1 hover:outline-dashed hover:outline-hairline",
  ghost:
    "border border-dashed border-hairline bg-transparent px-4 text-ink hover:bg-ink hover:text-canvas",
  danger:
    "border border-dashed border-balance-negative px-4 text-balance-negative hover:bg-balance-negative hover:text-canvas",
  ticket:
    "h-12 w-full bg-panel-ink px-5 font-mono text-[11px] font-semibold tracking-[0.16em] text-panel uppercase hover:bg-transparent hover:text-panel-ink hover:outline hover:outline-1 hover:outline-dashed hover:outline-panel-ink",
};

export function Button({
  variant = "primary",
  className,
  children,
  type = "button",
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-10 items-center justify-center font-mono text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
