import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getCompany } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatMoney, formatPercent, maxDiscountPercent } from "@/lib/format";
import type { Product } from "@/lib/types";
import { setProductActive } from "./actions";

export default async function AdminProductsPage() {
  await requireAdmin();
  const company = await getCompany();
  const { data } = await createAdminClient().from("products").select("*").order("name");
  const products = (data ?? []) as Product[];
  const cur = company.currency;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">Products</h1>
        <Link href="/admin/products/new" className="btn btn-primary">Add product</Link>
      </div>

      <div className="panel overflow-x-auto p-0">
        {products.length === 0 ? (
          <p className="p-6 text-ink-soft">Add your first product to start selling.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th className="text-right">Cost</th>
                <th className="text-right">Price excl. VAT</th>
                <th className="text-right">Markup</th>
                <th className="text-right">Max discount</th>
                <th className="text-right">Stock</th>
                <th>In store</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className={p.is_active ? "" : "text-ink-soft"}>
                  <td>
                    <Link href={`/admin/products/${p.id}`} className="font-medium underline">{p.name}</Link>
                    {p.sku ? <span className="block text-xs text-ink-soft">{p.sku}</span> : null}
                  </td>
                  <td className="text-right tabular-nums">{formatMoney(p.cost_price, cur)}</td>
                  <td className="text-right tabular-nums">{formatMoney(p.price, cur)}</td>
                  <td className="text-right tabular-nums">{formatMoney(Number(p.price) - Number(p.cost_price), cur)}</td>
                  <td className="text-right tabular-nums">{formatPercent(maxDiscountPercent(p.price, p.cost_price))}%</td>
                  <td className={`text-right tabular-nums ${p.stock_qty === 0 ? "text-danger" : ""}`}>{p.stock_qty}</td>
                  <td>
                    <form action={setProductActive.bind(null, p.id, !p.is_active)}>
                      <button className="text-sm underline">{p.is_active ? "Shown, hide" : "Hidden, show"}</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
