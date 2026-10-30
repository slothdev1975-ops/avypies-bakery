import { requireAdmin } from "@/lib/auth";
import { getCompany } from "@/lib/data";
import { ProductForm } from "../ProductForm";

export default async function NewProductPage() {
  await requireAdmin();
  const company = await getCompany();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Add product</h1>
      <ProductForm vatPercent={Number(company.vat_percent)} currency={company.currency} />
    </div>
  );
}
