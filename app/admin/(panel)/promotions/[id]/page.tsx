import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getCompany } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Product, Promotion } from "@/lib/types";
import { PromotionForm } from "../PromotionForm";

export default async function EditPromotionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const company = await getCompany();
  const admin = createAdminClient();
  const [{ data: promo }, { data: products }] = await Promise.all([
    admin.from("promotions").select("*, promotion_items(product_id, products(name))").eq("id", id).maybeSingle(),
    admin.from("products").select("*").order("name"),
  ]);
  if (!promo) notFound();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Edit promotion</h1>
      <PromotionForm promotion={promo as Promotion} products={(products ?? []) as Product[]} currency={company.currency} />
    </div>
  );
}
