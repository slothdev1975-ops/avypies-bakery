import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCompany } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { INVOICEABLE } from "@/lib/format";
import { Invoice } from "@/components/Invoice";
import { PrintButton } from "@/components/PrintButton";
import type { OrderWithItems } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, profile } = await getSession();
  if (!user) redirect(`/login?next=/invoice/${id}`);

  const isAdmin = profile?.role === "admin";
  // Customers read through RLS (own orders only); admins read any order.
  const db = (isAdmin ? createAdminClient() : supabase) as typeof supabase;
  const { data } = await db.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const order = data as OrderWithItems;
  const back = isAdmin ? `/admin/orders/${id}` : `/account/orders/${id}`;

  if (!INVOICEABLE.includes(order.status)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <h1 className="font-display text-3xl">The invoice isn&rsquo;t ready yet</h1>
        <p className="mt-3 text-ink-soft">An invoice is issued once the order has been paid.</p>
        <Link href={back} className="btn btn-primary mt-6">
          Back to order
        </Link>
      </div>
    );
  }

  const company = await getCompany();

  return (
    <div className="min-h-screen bg-mist py-8 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-4">
        <Link href={back} className="text-sm underline">
          Back to order
        </Link>
        <PrintButton />
      </div>
      <Invoice order={order} company={company} />
    </div>
  );
}
