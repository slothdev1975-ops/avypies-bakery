"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formValues } from "@/lib/forms";
import { uploadImage } from "@/lib/storage";
import type { FormState } from "@/lib/types";

const KEYS = ["name", "sku", "description", "cost_price", "price", "stock_qty"] as const;

export async function saveProduct(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "") || null;
  const values = formValues(formData, KEYS);
  const cost = Number(values.cost_price);
  const price = Number(values.price);
  const stock = Number(values.stock_qty || 0);

  if (!values.name) return { error: "Enter a product name.", values };
  if (values.cost_price === "" || !Number.isFinite(cost) || cost < 0) return { error: "Enter a valid cost price.", values };
  if (values.price === "" || !Number.isFinite(price) || price <= 0) return { error: "Enter a valid selling price.", values };
  if (price < cost) return { error: "The selling price can't be lower than the cost price.", values };
  if (!Number.isInteger(stock) || stock < 0) return { error: "Stock must be a whole number, 0 or more.", values };

  const admin = createAdminClient();
  const row: Record<string, unknown> = {
    name: values.name,
    sku: values.sku || null,
    description: values.description || null,
    cost_price: cost,
    price,
    stock_qty: stock,
    is_active: formData.get("is_active") === "on",
    updated_at: new Date().toISOString(),
  };

  try {
    const image = formData.get("image");
    if (image instanceof File && image.size > 0) row.image_path = await uploadImage(admin, image, "products");
    else if (formData.get("remove_image") === "on") row.image_path = null;
  } catch (e) {
    return { error: (e as Error).message, values };
  }

  const { error } = id
    ? await admin.from("products").update(row).eq("id", id)
    : await admin.from("products").insert(row);

  if (error) {
    if (error.code === "23505") return { error: "Another product already uses that SKU.", values };
    return { error: error.message, values };
  }

  revalidatePath("/");
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function setProductActive(id: string, active: boolean) {
  await requireAdmin();
  await createAdminClient().from("products").update({ is_active: active }).eq("id", id);
  revalidatePath("/");
  revalidatePath("/admin/products");
}
