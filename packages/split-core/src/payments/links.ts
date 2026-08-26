/** Non-custodial payment deep links for settle-up. */

export function venmoPayLink(opts: {
  amountMajor: number;
  note?: string;
  /** Venmo username without @ */
  recipients?: string;
}): string {
  const params = new URLSearchParams();
  params.set("txn", "pay");
  params.set("amount", opts.amountMajor.toFixed(2));
  if (opts.note) params.set("note", opts.note);
  if (opts.recipients) params.set("recipients", opts.recipients);
  return `https://venmo.com/?${params.toString()}`;
}

export function paypalMeLink(opts: {
  amountMajor: number;
  /** paypal.me handle without URL */
  handle?: string;
  currency?: string;
}): string | null {
  if (!opts.handle) return null;
  const handle = opts.handle.replace(/^@/, "");
  const currency = (opts.currency ?? "USD").toLowerCase();
  return `https://paypal.me/${handle}/${opts.amountMajor.toFixed(2)}${currency}`;
}

export function cashAppLink(opts: {
  amountMajor: number;
  cashtag?: string;
}): string | null {
  if (!opts.cashtag) return null;
  const tag = opts.cashtag.replace(/^\$/, "");
  return `https://cash.app/$${tag}/${opts.amountMajor.toFixed(2)}`;
}
