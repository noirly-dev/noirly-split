import { formatMoney } from "@/src/core/money";

export function MoneyText({
  amount,
  currency,
  className = "",
  signed = false,
}: {
  amount: number;
  currency: string;
  className?: string;
  signed?: boolean;
}) {
  const prefix = signed && amount > 0 ? "+" : "";
  return (
    <span
      className={`font-mono tabular-nums tracking-wide ${className}`}
    >
      {prefix}
      {formatMoney(amount, currency)}
    </span>
  );
}

/** Parse a major-unit decimal string (e.g. "12.50") to minor units. */
export function parseMajorToMinor(input: string): number | null {
  const cleaned = input.trim().replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, frac = ""] = cleaned.split(".");
  const cents = (frac + "00").slice(0, 2);
  return Number(whole) * 100 + Number(cents);
}

export function todayISODate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
