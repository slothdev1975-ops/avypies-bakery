"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { FormMessage } from "@/components/FormMessage";
import { formatMoney, formatPercent, maxDiscountPercent } from "@/lib/format";
import type { FormState, Product, Promotion } from "@/lib/types";
import { savePromotion } from "./actions";

/** ISO string → value for <input type="datetime-local"> in the browser's time zone. */
function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIso(local: string) {
  if (!local) return "";
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

export function PromotionForm({
  products,
  promotion,
  currency,
}: {
  products: Product[];
  promotion?: Promotion;
  currency: string;
}) {
  const [state, action, pending] = useActionState(savePromotion, {} as FormState);
  const [discount, setDiscount] = useState(promotion ? String(promotion.discount_percent) : "");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(promotion?.promotion_items.map((i) => i.product_id) ?? []),
  );
  const [search, setSearch] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  // Dates are set after mount so they use the admin's own time zone.
  useEffect(() => {
    setStart(toLocalInput(promotion?.starts_at ?? new Date().toISOString()));
    setEnd(promotion?.ends_at ? toLocalInput(promotion.ends_at) : "");
  }, [promotion?.id, promotion?.starts_at, promotion?.ends_at]);

  const pct = Number(discount);
  const chosen = products.filter((p) => selected.has(p.id));
  const tooHigh = chosen.filter((p) => pct > maxDiscountPercent(p.price, p.cost_price));
  const ceiling = chosen.length ? Math.min(...chosen.map((p) => maxDiscountPercent(p.price, p.cost_price))) : null;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? products.filter((p) => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)) : products;
  }, [products, search]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <form action={action} className="space-y-6">
      {promotion ? <input type="hidden" name="id" value={promotion.id} /> : null}
      <input type="hidden" name="starts_at" value={toIso(start)} />
      <input type="hidden" name="ends_at" value={toIso(end)} />
      {[...selected].map((id) => (
        <input key={id} type="hidden" name="product_ids" value={id} />
      ))}

      <section className="panel grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="title" className="label">Title</label>
          <input id="title" name="title" required defaultValue={state.values?.title ?? promotion?.title ?? ""} className="field" placeholder="Winter pie week" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="description" className="label">Message for customers <span className="font-normal text-ink-soft">(optional)</span></label>
          <textarea id="description" name="description" rows={2} defaultValue={state.values?.description ?? promotion?.description ?? ""} className="field" />
        </div>
        <div>
          <label htmlFor="discount" className="label">Discount %</label>
          <input id="discount" name="discount_percent" type="number" step="0.01" min="0.01" max="99.99" required value={discount} onChange={(e) => setDiscount(e.target.value)} className="field" />
          {ceiling !== null ? (
            <p className="mt-1 text-xs text-ink-soft">The selected products allow up to {formatPercent(ceiling)}%.</p>
          ) : null}
        </div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input type="checkbox" name="is_active" defaultChecked={promotion?.is_active ?? true} />
          Promotion is switched on
        </label>
        <div>
          <label htmlFor="start" className="label">Starts</label>
          <input id="start" type="datetime-local" required value={start} onChange={(e) => setStart(e.target.value)} className="field" />
        </div>
        <div>
          <label htmlFor="end" className="label">Ends <span className="font-normal text-ink-soft">(optional)</span></label>
          <input id="end" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="field" />
        </div>
      </section>

      <section className="panel space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl">Products</h2>
            <p className="text-sm text-ink-soft">{selected.size} selected</p>
          </div>
          <input type="search" aria-label="Search products" placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} className="field max-w-xs" />
        </div>

        <ul className="max-h-[28rem] divide-y divide-line overflow-y-auto rounded-xl border border-line">
          {visible.map((p) => {
            const max = maxDiscountPercent(p.price, p.cost_price);
            const over = selected.has(p.id) && pct > max;
            return (
              <li key={p.id}>
                <label className={`flex cursor-pointer items-center gap-3 px-4 py-3 ${over ? "bg-danger/5" : "hover:bg-mist"}`}>
                  <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
                  <span className="flex-1">
                    <span className="font-medium">{p.name}</span>
                    {!p.is_active ? <span className="ml-2 text-xs text-ink-soft">(hidden from store)</span> : null}
                    <span className="block text-xs text-ink-soft">
                      Price {formatMoney(p.price, currency)} excl. VAT, markup {formatMoney(Number(p.price) - Number(p.cost_price), currency)}
                    </span>
                  </span>
                  <span className={`text-right text-sm ${over ? "font-medium text-danger" : "text-ink-soft"}`}>
                    max {formatPercent(max)}%
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        {tooHigh.length > 0 ? (
          <p role="alert" className="text-sm text-danger">
            {formatPercent(pct)}% is more than the markup on {tooHigh.map((p) => p.name).join(", ")}. Lower the discount or
            remove {tooHigh.length === 1 ? "that product" : "those products"}.
          </p>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button disabled={pending || tooHigh.length > 0 || selected.size === 0} className="btn btn-primary">
          {pending ? "Saving…" : promotion ? "Save promotion" : "Create promotion"}
        </button>
        <Link href="/admin/promotions" className="text-sm underline">Cancel</Link>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
