import Link from "next/link";
import { requireCustomer } from "@/lib/auth";
import { getCompany } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MyOrdersPage() {
  const { supabase } = await requireCustomer("/account/orders");
  const company = await getCompany();
  const { data } = await supabase
    .from("orders")
    .select("id, order_number, created_at, total, status")
    .order("created_at", { ascending: false });
  const orders = (data ?? []) as Order[];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 font-display text-4xl">My orders</h1>
      {orders.length === 0 ? (
        <div className="panel">
          <p>You haven&rsquo;t placed an order yet.</p>
          <Link href="/" className="btn btn-primary mt-4">
            Browse products
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/account/orders/${o.id}`} className="flex flex-wrap items-center gap-4 py-4 hover:bg-mist">
                <span className="font-medium">Order #{o.order_number}</span>
                <span className="text-sm text-ink-soft">{formatDate(o.created_at)}</span>
                <StatusBadge status={o.status} />
                <span className="ml-auto font-medium tabular-nums">{formatMoney(o.total, company.currency)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
