import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Company } from "@/lib/types";

const FALLBACK: Company = {
  id: 1,
  name: "My store",
  tagline: null,
  legal_name: null,
  registration_number: null,
  vat_number: null,
  vat_percent: 15,
  currency: "ZAR",
  address_line1: null,
  address_line2: null,
  city: null,
  province: null,
  postal_code: null,
  country: null,
  email: null,
  phone: null,
  bank_details: null,
  logo_path: null,
};

export const getCompany = cache(async (): Promise<Company> => {
  const supabase = await createClient();
  const { data } = await supabase.from("company_settings").select("*").eq("id", 1).single();
  return (data as Company | null) ?? FALLBACK;
});
