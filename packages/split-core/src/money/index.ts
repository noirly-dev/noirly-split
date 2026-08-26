import type { MinorAmount } from "../models/types";

/** Split total into n parts; remainder cents go to the first recipients. */
export function allocateEvenly(
  total: MinorAmount,
  count: number,
): MinorAmount[] {
  if (count <= 0) return [];
  if (!Number.isInteger(total) || total < 0) {
    throw new Error("total must be a non-negative integer (minor units)");
  }
  const base = Math.floor(total / count);
  const remainder = total - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}

/** Apply FX rate and round to nearest minor unit. */
export function applyFx(amount: MinorAmount, rate: number): MinorAmount {
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("fx rate must be a positive finite number");
  }
  return Math.round(amount * rate);
}

export function sumMinor(amounts: readonly MinorAmount[]): MinorAmount {
  return amounts.reduce((acc, n) => acc + n, 0);
}

export function formatMoney(
  amount: MinorAmount,
  currency: string,
  locale = "en-US",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount / 100);
}
