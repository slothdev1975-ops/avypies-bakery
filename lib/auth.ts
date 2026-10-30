import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null };
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return { supabase, user, profile: (data as Profile | null) ?? null };
}

/** Use at the top of every admin page AND every admin server action. */
export async function requireAdmin() {
  const session = await getSession();
  if (!session.user || session.profile?.role !== "admin") redirect("/admin/login");
  return { ...session, user: session.user!, profile: session.profile! };
}

export async function requireCustomer(next: string) {
  const session = await getSession();
  if (!session.user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return { ...session, user: session.user! };
}

export function isProfileComplete(p: Profile | null) {
  return !!(p?.first_name && p.last_name && p.phone && p.address_line1 && p.city);
}
