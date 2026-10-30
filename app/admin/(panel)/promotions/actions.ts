"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPercent, maxDiscountPercent } from "@/lib/format";
import type { FormState } from "@/lib/types";

export async function savePromotion(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "") || null;
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const discount = Number(formData.get("discount_percent"));
  const startsAt = String(formData.get("starts_at") ?? "") || null;
  const endsAt = String(formData.get("ends_at") ?? "") || null;
  const productIds = [...new Set(formData.getAll("product_ids").map(String))];
  const values = { title, description };

  if (!title) return { error: "Give the promotion a title. Customers see it in the popup.", values };
  if (!Number.isFinite(discount) || discount <= 0 || discount >= 100)
    return { error: "The discount must be more than 0% and less than 100%.", values };
  if (productIds.length === 0) return { error: "Select at least one product.", values };
  if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt))
    return { error: "The end date must be after the start date.", values };

  const admin = createAdminClient();

  // Friendly check first; the database enforces the same rule.
  const { data: products } = await admin.from("products").select("id, name, price, cost_price").in("id", productIds);
  const tooHigh = (products ?? []).filter((p) => discount > maxDiscountPercent(p.price, p.cost_price));
  if (tooHigh.length > 0) {
    const limit = Math.min(...tooHigh.map((p) => maxDiscountPercent(p.price, p.cost_price)));
    return {
      error: `${formatPercent(discount)}% is more than the markup on ${tooHigh.map((p) => p.name).join(", ")}. Lower the discount to ${formatPercent(limit)}% or less, or remove those products.`,
      values,
    };
  }

  const { error } = await admin.rpc("save_promotion", {
    p_id: id,
    p_title: title,
    p_description: description || null,
    p_discount: discount,
    p_starts: startsAt,
    p_ends: endsAt,
    p_active: formData.get("is_active") === "on",
    p_product_ids: productIds,
  });
  if (error) return { error: error.message, values };

  revalidatePath("/");
  revalidatePath("/admin/promotions");
  redirect("/admin/promotions");
}

export async function setPromotionActive(id: string, active: boolean) {
  await requireAdmin();
  await createAdminClient().from("promotions").update({ is_active: active }).eq("id", id);
  revalidatePath("/");
  revalidatePath("/admin/promotions");
}

export async function deletePromotion(id: string) {
  await requireAdmin();
  await createAdminClient().from("promotions").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/admin/promotions");
}
