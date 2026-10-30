import { ORDER_FLOW, STATUS_LABELS, formatDate } from "@/lib/format";
import type { Order } from "@/lib/types";

/** The real order sequence, so a stepped layout fits here. */
export function OrderStatusSteps({ order }: { order: Order }) {
  if (order.status === "cancelled") {
    return <p className="text-sm text-ink-soft">This order was cancelled{order.cancelled_at ? ` on ${formatDate(order.cancelled_at)}` : ""}.</p>;
  }
  const current = ORDER_FLOW.indexOf(order.status);
  const dates: Record<string, string | null> = {
    awaiting_payment: order.created_at,
    paid: order.paid_at,
    ordered: order.ordered_at,
    delivered: order.delivered_at,
  };
  return (
    <ol className="grid gap-3 sm:grid-cols-4">
      {ORDER_FLOW.map((s, i) => {
        const done = i <= current;
        return (
          <li key={s} className={`border-t-4 pt-2 ${done ? "border-berry" : "border-line"}`}>
            <p className={`text-sm font-medium ${done ? "text-ink" : "text-ink-soft"}`}>{STATUS_LABELS[s]}</p>
            {done && dates[s] ? <p className="text-xs text-ink-soft">{formatDate(dates[s]!, true)}</p> : null}
          </li>
        );
      })}
    </ol>
  );
}
