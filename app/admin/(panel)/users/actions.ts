"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FormState } from "@/lib/types";

const MIN_PASSWORD = 10;

/** Creates an admin account with a password, or upgrades an existing customer account. */
export async function addAdmin(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const values = { email };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address.", values };
  if (password.length < MIN_PASSWORD) return { error: `Use a password of at least ${MIN_PASSWORD} characters.`, values };

  const admin = createAdminClient();
  const { data: existing } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();

  let userId: string;
  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
    if (error) return { error: error.message, values };
    userId = existing.id;
  } else {
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) return { error: error?.message ?? "The account could not be created.", values };
    userId = data.user.id;
  }

  const { error } = await admin.from("profiles").update({ role: "admin" }).eq("id", userId);
  if (error) return { error: error.message, values };

  revalidatePath("/admin/users");
  return { ok: `${email} can now sign in at /admin/login with that password.` };
}

export async function removeAdmin(userId: string) {
  const { user } = await requireAdmin();
  if (userId === user.id) return; // can't remove yourself
  await createAdminClient().from("profiles").update({ role: "customer" }).eq("id", userId);
  revalidatePath("/admin/users");
}

export async function changeOwnPassword(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < MIN_PASSWORD) return { error: `Use a password of at least ${MIN_PASSWORD} characters.` };
  if (password !== confirm) return { error: "The two passwords don't match." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { ok: "Password changed." };
}
