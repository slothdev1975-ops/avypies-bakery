"use client";

import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { formatMoney, formatPercent, withVat } from "@/lib/format";

export type CardProduct = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number; // excl. VAT
  salePrice: number; // excl. VAT
  discountPercent: number;
  stock: number;
};

export function ProductCard({
  product,
  vatPercent,
  currency,
}: {
  product: CardProduct;
  vatPercent: number;
  currency: string;
}) {
  const { add, lines } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const inCart = lines.find((l) => l.productId === product.id)?.quantity ?? 0;
  const soldOut = product.stock <= 0;
  const maxed = inCart >= product.stock;
  const onPromo = product.discountPercent > 0;

  function handleAdd() {
    add({
      productId: product.id,
      name: product.name,
      unitPrice: product.salePrice,
      imageUrl: product.imageUrl,
      maxQty: product.stock,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  }

  return (
    <article className="flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-mist">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div aria-hidden className="grid h-full place-items-center font-display text-6xl text-ink/15">
            {product.name.charAt(0)}
          </div>
        )}
        {onPromo ? (
          <span className="absolute left-3 top-3 grid h-14 w-14 -rotate-6 place-items-center rounded-full bg-butter text-sm font-semibold text-ink">
            -{formatPercent(product.discountPercent)}%
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 font-display text-lg leading-snug">{product.name}</h3>
      {product.description ? <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{product.description}</p> : null}

      <p className="mt-2 flex items-baseline gap-2">
        <span className="text-lg font-semibold">{formatMoney(withVat(product.salePrice, vatPercent), currency)}</span>
        {onPromo ? (
          <s className="text-sm text-ink-soft">{formatMoney(withVat(product.price, vatPercent), currency)}</s>
        ) : null}
      </p>
      <p className="text-xs text-ink-soft">incl. VAT</p>

      <div className="mt-auto pt-4">
        <button type="button" onClick={handleAdd} disabled={soldOut || maxed} className="btn btn-primary">
          {soldOut ? "Sold out" : maxed ? "All stock in cart" : justAdded ? "Added to cart" : "Add to cart"}
        </button>
      </div>
    </article>
  );
}
