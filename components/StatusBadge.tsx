import { STATUS_LABELS } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

const STYLES: Record<OrderStatus, string> = {
  awaiting_payment: "bg-butter-soft text-ink",
  paid: "bg-berry/10 text-berry",
  ordered: "bg-ink/10 text-ink",
  delivered: "bg-sage/15 text-sage",
  cancelled: "bg-line text-ink-soft line-through",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
