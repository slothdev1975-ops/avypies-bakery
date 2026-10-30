"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Field } from "@/components/admin/Field";
import { FormMessage } from "@/components/FormMessage";
import { formatMoney, formatPercent, maxDiscountPercent, publicImageUrl, withVat } from "@/lib/format";
import type { FormState, Product } from "@/lib/types";
import { saveProduct } from "./actions";

export function ProductForm({ product, vatPercent, currency }: { product?: Product; vatPercent: number; currency: string }) {
  const [state, action, pending] = useActionState(saveProduct, {} as FormState);
  const [cost, setCost] = useState(product ? String(product.cost_price) : "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const v = (k: keyof Product) => state.values?.[k] ?? (product?.[k] as string | number | null) ?? "";

  const c = Number(cost);
  const p = Number(price);
  const valid = cost !== "" && price !== "" && p > 0 && c >= 0;
  const image = publicImageUrl(product?.image_path);

  return (
    <form action={action} className="space-y-6">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      <section className="panel grid gap-4 sm:grid-cols-2">
        <Field label="Product name" name="name" defaultValue={v("name")} required />
        <Field label="SKU" name="sku" defaultValue={v("sku")} hint="Optional product code." />
        <Field label="Description" name="description" textarea defaultValue={v("description")} className="sm:col-span-2" />
      </section>

      <section className="panel grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="cost_price" className="label">Cost price (excl. VAT)</label>
          <input id="cost_price" name="cost_price" type="number" step="0.01" min="0" required value={cost} onChange={(e) => setCost(e.target.value)} className="field" />
        </div>
        <div>
          <label htmlFor="price" className="label">Selling price (excl. VAT)</label>
          <input id="price" name="price" type="number" step="0.01" min="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} className="field" />
        </div>
        <Field label="Stock on hand" name="stock_qty" type="number" step="1" min="0" defaultValue={v("stock_qty") || "0"} required />

        <div className="rounded-xl bg-mist p-4 text-sm sm:col-span-3">
          {!valid ? (
            <p className="text-ink-soft">Enter the cost and selling price to see the markup.</p>
          ) : p < c ? (
            <p className="text-danger">The selling price is below cost.</p>
          ) : (
            <dl className="grid gap-2 sm:grid-cols-3">
              <div>
                <dt className="text-ink-soft">Markup</dt>
                <dd className="font-medium">{formatMoney(p - c, currency)}</dd>
              </div>
              <div>
                <dt className="text-ink-soft">Highest promotion discount</dt>
                <dd className="font-medium">{formatPercent(maxDiscountPercent(p, c))}%</dd>
              </div>
              <div>
                <dt className="text-ink-soft">Store price incl. {formatPercent(vatPercent)}% VAT</dt>
                <dd className="font-medium">{formatMoney(withVat(p, vatPercent), currency)}</dd>
              </div>
            </dl>
          )}
        </div>
      </section>

      <section className="panel space-y-4">
        <div className="flex flex-wrap items-center gap-6">
          {image ? <img src={image} alt="" className="h-24 w-32 rounded-lg object-cover" /> : null}
          <div className="space-y-2">
            <label htmlFor="image" className="label">Photo</label>
            <input id="image" type="file" name="image" accept="image/png,image/jpeg,image/webp" className="text-sm" />
            {image ? (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="remove_image" /> Remove the current photo
              </label>
            ) : null}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_active" defaultChecked={product?.is_active ?? true} />
          Show this product in the store
        </label>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button disabled={pending} className="btn btn-primary">
          {pending ? "Saving…" : product ? "Save product" : "Add product"}
        </button>
        <Link href="/admin/products" className="text-sm underline">Cancel</Link>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
