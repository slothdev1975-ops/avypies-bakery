import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getCompany } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { INVOICEABLE } from "@/lib/format";
import { OrderStatusSteps } from "@/components/OrderStatusSteps";
import { OrderItemsTable } from "@/components/OrderItemsTable";
import { StatusBadge } from "@/components/StatusBadge";
import type { OrderWithItems } from "@/lib/types";
import { OrderActions } from "../OrderActions";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const company = await getCompany();
  const { data } = await createAdminClient().from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const order = data as OrderWithItems;

  return (
    <div className="space-y-8">
      <Link href="/admin/orders" className="text-sm underline">All orders</Link>

      <div className="flex flex-wrap items-center gap-4">
        <h1 className="font-display text-3xl">Order #{order.order_number}</h1>
        <StatusBadge status={order.status} />
        {INVOICEABLE.includes(order.status) ? (
          <Link href={`/invoice/${order.id}`} className="btn btn-secondary btn-sm">
            Invoice {order.invoice_number}
          </Link>
        ) : null}
      </div>

      <div className="panel space-y-6">
        <OrderStatusSteps order={order} />
        <OrderActions orderId={order.id} status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="panel">
          <OrderItemsTable order={order} currency={company.currency || "ZAR"} />
        </div>
        <div className="panel text-sm">
          <h2 className="mb-2 font-display text-xl">Customer</h2>
          <p className="font-medium">{order.customer_name}</p>
          <p><a href={`mailto:${order.customer_email}`} className="underline">{order.customer_email}</a></p>
          <p>{order.customer_phone}</p>
          <h3 className="mb-1 mt-4 font-medium">Delivery address</h3>
          <p>{order.delivery_address}</p>
          <h3 className="mb-1 mt-4 font-medium">Payment reference</h3>
          <p>{order.order_number}</p>
        </div>
      </div>
    </div>
  );
}
