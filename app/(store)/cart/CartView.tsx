"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { formatMoney, formatPercent, withVat } from "@/lib/format";
import { placeOrder } from "./actions";

export function CartView({
  signedIn,
  profileComplete,
  vatPercent,
  currency,
}: {
  signedIn: boolean;
  profileComplete: boolean;
  vatPercent: number;
  currency: string;
}) {
  const router = useRouter();
  const { lines, setQty, remove, clear, ready } = useCart();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!ready) return null;

  if (lines.length === 0) {
    return (
      <div className="panel">
        <p>Your cart is empty.</p>
        <Link href="/" className="btn btn-primary mt-4">
          Browse products
        </Link>
      </div>
    );
  }

  const subtotal = Math.round(lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0) * 100) / 100;
  const vat = Math.round(subtotal * vatPercent) / 100;

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await placeOrder(lines.map((l) => ({ productId: l.productId, quantity: l.quantity })));
      if (res.error || !res.orderId) {
        setError(res.error ?? "The order could not be placed. Try again.");
        return;
      }
      clear();
      router.push(`/account/orders/${res.orderId}?placed=1`);
    });
  }

  return (
    <div className="space-y-8">
      <ul className="divide-y divide-line border-y border-line">
        {lines.map((l) => (
          <li key={l.productId} className="flex flex-wrap items-center gap-4 py-4">
            {l.imageUrl ? (
              <img src={l.imageUrl} alt="" className="h-16 w-16 rounded-xl object-cover" />
            ) : (
              <span aria-hidden className="grid h-16 w-16 place-items-center rounded-xl bg-mist font-display text-xl text-ink/30">
                {l.name.charAt(0)}
              </span>
            )}
            <div className="min-w-40 flex-1">
              <p className="font-medium">{l.name}</p>
              <p className="text-sm text-ink-soft">{formatMoney(withVat(l.unitPrice, vatPercent), currency)} each incl. VAT</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={`One less ${l.name}`}
                className="btn btn-secondary btn-sm"
                onClick={() => setQty(l.productId, l.quantity - 1)}
              >
                −
              </button>
              <span className="w-8 text-center tabular-nums" aria-live="polite">
                {l.quantity}
              </span>
              <button
                type="button"
                aria-label={`One more ${l.name}`}
                className="btn btn-secondary btn-sm"
                disabled={l.quantity >= l.maxQty}
                onClick={() => setQty(l.productId, l.quantity + 1)}
              >
                +
              </button>
            </div>
            <p className="w-28 text-right font-medium tabular-nums">
              {formatMoney(withVat(l.unitPrice * l.quantity, vatPercent), currency)}
            </p>
            <button type="button" className="text-sm text-ink-soft underline" onClick={() => remove(l.productId)}>
              Remove
            </button>
          </li>
        ))}
      </ul>

      <dl className="ml-auto max-w-xs space-y-1 text-sm">
        <div className="flex justify-between">
          <dt>Subtotal (excl. VAT)</dt>
          <dd className="tabular-nums">{formatMoney(subtotal, currency)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>VAT ({formatPercent(vatPercent)}%)</dt>
          <dd className="tabular-nums">{formatMoney(vat, currency)}</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatMoney(subtotal + vat, currency)}</dd>
        </div>
      </dl>

      <div className="flex flex-col items-end gap-3">
        {error ? (
          <p role="alert" className="max-w-md text-right text-sm text-danger">
            {error}
          </p>
        ) : null}
        {!signedIn ? (
          <Link href="/login?next=/cart" className="btn btn-primary">
            Sign in to order
          </Link>
        ) : !profileComplete ? (
          <>
            <p className="text-sm text-ink-soft">Add your delivery details before ordering.</p>
            <Link href="/account/profile?next=/cart" className="btn btn-primary">
              Add delivery details
            </Link>
          </>
        ) : (
          <button type="button" onClick={submit} disabled={pending} className="btn btn-primary">
            {pending ? "Placing order…" : "Place order"}
          </button>
        )}
        <p className="max-w-sm text-right text-xs text-ink-soft">
          Final prices are confirmed when you place the order. You&rsquo;ll get payment details by email.
        </p>
      </div>
    </div>
  );
}
