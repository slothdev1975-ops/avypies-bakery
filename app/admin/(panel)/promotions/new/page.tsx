import { requireAdmin } from "@/lib/auth";
import { getCompany } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Product } from "@/lib/types";
import { PromotionForm } from "../PromotionForm";

export default async function NewPromotionPage() {
  await requireAdmin();
  const company = await getCompany();
  const { data } = await createAdminClient().from("products").select("*").order("name");
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Create promotion</h1>
      <PromotionForm products={(data ?? []) as Product[]} currency={company.currency} />
    </div>
  );
}
