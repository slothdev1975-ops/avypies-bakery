"use client";

import { useEffect, useRef } from "react";
import { formatDate, formatMoney, formatPercent, withVat } from "@/lib/format";
import type { CardProduct } from "@/components/ProductCard";

export type PopupPromotion = {
  id: string;
  title: string;
  description: string | null;
  discountPercent: number;
  endsAt: string | null;
  products: CardProduct[];
};

/** The login form sets sessionStorage "show-promos"; the popup shows once, then clears it. */
export const PROMO_FLAG = "show-promos";

export function PromoPopup({
  promotions,
  vatPercent,
  currency,
}: {
  promotions: PopupPromotion[];
  vatPercent: number;
  currency: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (promotions.length === 0) return;
    if (sessionStorage.getItem(PROMO_FLAG) !== "1") return;
    sessionStorage.removeItem(PROMO_FLAG);
    ref.current?.showModal();
  }, [promotions.length]);

  if (promotions.length === 0) return null;

  return (
    <dialog
      ref={ref}
      aria-labelledby="promo-title"
      className="m-auto w-[min(92vw,34rem)] rounded-3xl p-0 text-ink backdrop:bg-ink/50"
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
    >
      <div className="bg-butter px-7 pb-6 pt-7">
        <h2 id="promo-title" className="font-display text-3xl leading-tight">
          {promotions.length === 1 ? promotions[0].title : "This week's deals"}
        </h2>
        {promotions.length === 1 && promotions[0].description ? (
          <p className="mt-2">{promotions[0].description}</p>
        ) : null}
      </div>

      <div className="max-h-[50vh] space-y-6 overflow-y-auto px-7 py-6">
        {promotions.map((promo) => (
          <section key={promo.id}>
            {promotions.length > 1 ? (
              <h3 className="font-display text-lg">
                {promo.title}, {formatPercent(promo.discountPercent)}% off
              </h3>
            ) : null}
            {promo.endsAt ? <p className="text-xs text-ink-soft">Until {formatDate(promo.endsAt)}</p> : null}
            <ul className="mt-2 divide-y divide-line">
              {promo.products.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <span aria-hidden className="grid h-12 w-12 place-items-center rounded-lg bg-mist font-display text-ink/30">
                      {p.name.charAt(0)}
                    </span>
                  )}
                  <span className="flex-1 text-sm font-medium">{p.name}</span>
                  <span className="text-right text-sm">
                    <span className="font-semibold">{formatMoney(withVat(p.salePrice, vatPercent), currency)}</span>{" "}
                    <s className="text-ink-soft">{formatMoney(withVat(p.price, vatPercent), currency)}</s>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="flex justify-end border-t border-line px-7 py-4">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            ref.current?.close();
            document.getElementById("deals")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          Shop the deals
        </button>
      </div>
    </dialog>
  );
}
