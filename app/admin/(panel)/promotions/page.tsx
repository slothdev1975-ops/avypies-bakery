import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatPercent } from "@/lib/format";
import type { Promotion } from "@/lib/types";
import { deletePromotion, setPromotionActive } from "./actions";

function state(p: Promotion) {
  const now = Date.now();
  if (!p.is_active) return { label: "Switched off", cls: "bg-line text-ink-soft" };
  if (new Date(p.starts_at).getTime() > now) return { label: "Scheduled", cls: "bg-ink/10 text-ink" };
  if (p.ends_at && new Date(p.ends_at).getTime() <= now) return { label: "Ended", cls: "bg-line text-ink-soft" };
  return { label: "Live", cls: "bg-butter text-ink" };
}

export default async function AdminPromotionsPage() {
  await requireAdmin();
  const { data } = await createAdminClient()
    .from("promotions")
    .select("*, promotion_items(product_id, products(name))")
    .order("starts_at", { ascending: false });
  const promotions = (data ?? []) as Promotion[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">Promotions</h1>
        <Link href="/admin/promotions/new" className="btn btn-primary">Create promotion</Link>
      </div>

      {promotions.length === 0 ? (
        <div className="panel text-ink-soft">
          Promotions show on the store with a sale price, and pop up when customers sign in.
        </div>
      ) : (
        <ul className="space-y-3">
          {promotions.map((p) => {
            const s = state(p);
            return (
              <li key={p.id} className="panel flex flex-wrap items-start gap-4">
                <div className="min-w-60 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link href={`/admin/promotions/${p.id}`} className="font-display text-xl underline">{p.title}</Link>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>
                  </div>
                  <p className="mt-1 text-sm">
                    {formatPercent(p.discount_percent)}% off, from {formatDate(p.starts_at, true)}
                    {p.ends_at ? ` to ${formatDate(p.ends_at, true)}` : ", no end date"}
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {p.promotion_items.map((i) => i.products?.name).filter(Boolean).join(", ")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={setPromotionActive.bind(null, p.id, !p.is_active)}>
                    <button className="btn btn-secondary btn-sm">{p.is_active ? "Switch off" : "Switch on"}</button>
                  </form>
                  <form action={deletePromotion.bind(null, p.id)}>
                    <button className="btn btn-secondary btn-sm">Delete</button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
