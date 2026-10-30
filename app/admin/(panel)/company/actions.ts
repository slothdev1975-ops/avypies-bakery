"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { emptyToNull, formValues } from "@/lib/forms";
import { uploadImage } from "@/lib/storage";
import type { FormState } from "@/lib/types";

const KEYS = [
  "name", "tagline", "legal_name", "registration_number", "vat_number", "vat_percent", "currency",
  "address_line1", "address_line2", "city", "province", "postal_code", "country",
  "email", "phone", "bank_details",
] as const;

export async function saveCompany(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const values = formValues(formData, KEYS);
  const vat = Number(values.vat_percent);

  if (!values.name) return { error: "Enter the business name.", values };
  if (values.vat_percent === "" || !Number.isFinite(vat) || vat < 0 || vat > 100)
    return { error: "VAT percentage must be a number from 0 to 100.", values };
  if (!/^[A-Za-z]{3}$/.test(values.currency || "ZAR"))
    return { error: "Currency must be a 3-letter code, for example ZAR.", values };

  const admin = createAdminClient();
  const update: Record<string, unknown> = {
    ...emptyToNull(values),
    name: values.name,
    vat_percent: vat,
    currency: (values.currency || "ZAR").toUpperCase(),
    updated_at: new Date().toISOString(),
  };

  try {
    const logo = formData.get("logo");
    if (logo instanceof File && logo.size > 0) update.logo_path = await uploadImage(admin, logo, "logos");
    else if (formData.get("remove_logo") === "on") update.logo_path = null;
  } catch (e) {
    return { error: (e as Error).message, values };
  }

  const { error } = await admin.from("company_settings").update(update).eq("id", 1);
  if (error) return { error: error.message, values };

  revalidatePath("/", "layout");
  return { ok: "Company details saved. New invoices will use them.", values };
}
