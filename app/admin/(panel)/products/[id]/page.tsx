import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getCompany } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Product } from "@/lib/types";
import { ProductForm } from "../ProductForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const company = await getCompany();
  const { data } = await createAdminClient().from("products").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const product = data as Product;
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Edit {product.name}</h1>
      <ProductForm product={product} vatPercent={Number(company.vat_percent)} currency={company.currency} />
    </div>
  );
}
