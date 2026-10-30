import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Company } from "@/lib/types";
import { CompanyForm } from "./CompanyForm";

export default async function CompanyPage() {
  await requireAdmin();
  const { data } = await createAdminClient().from("company_settings").select("*").eq("id", 1).single();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Company details</h1>
      <CompanyForm company={data as Company} />
    </div>
  );
}
