import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getCompany } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { STATUS_LABELS, formatDate, formatMoney } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import type { Order, OrderStatus } from "@/lib/types";
import { OrderActions } from "./OrderActions";

const FILTERS: (OrderStatus | "all")[] = ["all", "awaiting_payment", "paid", "ordered", "delivered", "cancelled"];

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { status: raw } = await searchParams;
  const status = FILTERS.includes(raw as OrderStatus) ? (raw as OrderStatus | "all") : "all";
  const company = await getCompany();

  const admin = createAdminClient();
  let query = admin
    .from("orders")
    .select("id, order_number, created_at, customer_name, customer_email, total, status")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status !== "all") query = query.eq("status", status);
  const { data } = await query;
  const orders = (data ?? []) as Order[];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Orders</h1>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/admin/orders" : `/admin/orders?status=${f}`}
            aria-current={f === status ? "page" : undefined}
            className={`rounded-full border px-3 py-1 text-sm ${f === status ? "border-ink bg-ink text-white" : "border-line bg-white"}`}
          >
            {f === "all" ? "All" : STATUS_LABELS[f]}
          </Link>
        ))}
      </div>

      <div className="panel overflow-x-auto p-0">
        {orders.length === 0 ? (
          <p className="p-6 text-ink-soft">No orders with this status.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Placed</th>
                <th>Customer</th>
                <th className="text-right">Total</th>
                <th>Status</th>
                <th>Next step</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/orders/${o.id}`} className="font-medium underline">
                      #{o.order_number}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap">{formatDate(o.created_at, true)}</td>
                  <td>
                    {o.customer_name}
                    <span className="block text-xs text-ink-soft">{o.customer_email}</span>
                  </td>
                  <td className="text-right tabular-nums">{formatMoney(o.total, company.currency)}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td><OrderActions orderId={o.id} status={o.status} compact /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
