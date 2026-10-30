import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCustomer } from "@/lib/auth";
import { getCompany } from "@/lib/data";
import { INVOICEABLE, formatMoney } from "@/lib/format";
import { OrderStatusSteps } from "@/components/OrderStatusSteps";
import { OrderItemsTable } from "@/components/OrderItemsTable";
import type { OrderWithItems } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MyOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const { id } = await params;
  const { placed } = await searchParams;
  const { supabase } = await requireCustomer(`/account/orders/${id}`);
  const company = await getCompany();

  const { data } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const order = data as OrderWithItems;
  const currency = company.currency || "ZAR";

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        {placed ? <p className="mb-2 text-sage">Thanks, your order has been placed.</p> : null}
        <h1 className="font-display text-4xl">Order #{order.order_number}</h1>
      </div>

      <OrderStatusSteps order={order} />

      {order.status === "awaiting_payment" ? (
        <section className="rounded-2xl bg-butter-soft p-6">
          <h2 className="font-display text-2xl">How to pay</h2>
          <p className="mt-2">
            Pay <strong>{formatMoney(order.total, currency)}</strong> by EFT and use <strong>{order.order_number}</strong> as
            the payment reference. We&rsquo;ll email you when it reflects.
          </p>
          {company.bank_details ? (
            <pre className="mt-4 whitespace-pre-wrap font-sans text-sm">{company.bank_details}</pre>
          ) : null}
        </section>
      ) : null}

      {INVOICEABLE.includes(order.status) ? (
        <Link href={`/invoice/${order.id}`} className="btn btn-primary">
          View invoice {order.invoice_number}
        </Link>
      ) : null}

      <OrderItemsTable order={order} currency={currency} />

      <section className="text-sm">
        <h2 className="mb-1 font-display text-xl">Delivery to</h2>
        <p>{order.customer_name}</p>
        <p>{order.delivery_address}</p>
        <p>{order.customer_phone}</p>
      </section>
    </div>
  );
}
