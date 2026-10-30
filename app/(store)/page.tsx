import { createClient } from "@/lib/supabase/server";
import { getCompany } from "@/lib/data";
import { formatDate, formatPercent, publicImageUrl } from "@/lib/format";
import { ProductCard, type CardProduct } from "@/components/ProductCard";
import { PromoPopup, type PopupPromotion } from "@/components/PromoPopup";
import type { ActivePromotion, StoreProduct } from "@/lib/types";

export const dynamic = "force-dynamic";

function toCard(p: StoreProduct): CardProduct {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    imageUrl: publicImageUrl(p.image_path),
    price: Number(p.price),
    salePrice: Number(p.sale_price),
    discountPercent: Number(p.discount_percent),
    stock: p.stock_qty,
  };
}

export default async function StorePage() {
  const supabase = await createClient();
  const company = await getCompany();
  const [{ data: productRows }, { data: promoRows }] = await Promise.all([
    supabase.from("store_products").select("*").order("name"),
    supabase.from("active_promotions").select("*").order("discount_percent", { ascending: false }),
  ]);

  const products = ((productRows ?? []) as StoreProduct[]).map(toCard);
  const promotions = (promoRows ?? []) as ActivePromotion[];
  const deals = products.filter((p) => p.discountPercent > 0);
  const vat = Number(company.vat_percent);
  const currency = company.currency || "ZAR";

  const popup: PopupPromotion[] = promotions
    .map((pr) => ({
      id: pr.id,
      title: pr.title,
      description: pr.description,
      discountPercent: Number(pr.discount_percent),
      endsAt: pr.ends_at,
      products: deals.filter((p) => pr.product_ids.includes(p.id)),
    }))
    .filter((pr) => pr.products.length > 0);

  const lead = popup[0];

  return (
    <>
      <PromoPopup promotions={popup} vatPercent={vat} currency={currency} />

      <section className="mb-14 grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-end">
        <div>
          <h1 className="font-display text-5xl leading-[1.02] sm:text-7xl">{company.name}</h1>
          {company.tagline ? <p className="mt-5 max-w-xl text-lg text-ink-soft">{company.tagline}</p> : null}
        </div>
        {lead ? (
          <a href="#deals" className="block rounded-[2rem] bg-butter p-7 transition-transform hover:-rotate-1">
            <p className="font-display text-5xl leading-none">{formatPercent(lead.discountPercent)}% off</p>
            <p className="mt-3 text-lg font-medium">{lead.title}</p>
            {lead.description ? <p className="mt-1 text-sm">{lead.description}</p> : null}
            {lead.endsAt ? <p className="mt-3 text-sm">Until {formatDate(lead.endsAt)}</p> : null}
          </a>
        ) : null}
      </section>

      {deals.length > 0 ? (
        <section id="deals" className="mb-16 scroll-mt-6">
          <h2 className="mb-6 font-display text-3xl">On promotion</h2>
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {deals.map((p) => (
              <ProductCard key={p.id} product={p} vatPercent={vat} currency={currency} />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-6 font-display text-3xl">{deals.length > 0 ? "Everything else" : "Our products"}</h2>
        {products.length === 0 ? (
          <p className="text-ink-soft">Products will appear here once they are added in the admin area.</p>
        ) : (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {products
              .filter((p) => p.discountPercent === 0)
              .map((p) => (
                <ProductCard key={p.id} product={p} vatPercent={vat} currency={currency} />
              ))}
          </div>
        )}
      </section>
    </>
  );
}
