"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formValues } from "@/lib/forms";
import { safeNext } from "@/lib/format";
import type { FormState } from "@/lib/types";

const KEYS = ["first_name", "last_name", "phone", "address_line1", "address_line2", "city", "province", "postal_code"] as const;

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session has expired. Sign in again." };

  const values = formValues(formData, KEYS);
  if (!values.first_name || !values.last_name || !values.phone || !values.address_line1 || !values.city || !values.postal_code) {
    return { error: "Fill in your name, phone number and delivery address.", values };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      ...values,
      address_line2: values.address_line2 || null,
      province: values.province || null,
    })
    .eq("id", user.id);
  if (error) return { error: error.message, values };

  revalidatePath("/", "layout");
  const next = safeNext(String(formData.get("next") ?? ""));
  if (next) redirect(next);
  return { ok: "Details saved.", values };
}
