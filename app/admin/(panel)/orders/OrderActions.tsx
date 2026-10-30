"use client";

import { useState, useTransition } from "react";
import { ACTION_LABELS, NEXT_STATUS } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";
import { updateOrderStatus } from "./actions";

export function OrderActions({ orderId, status, compact }: { orderId: string; status: OrderStatus; compact?: boolean }) {
  const next = NEXT_STATUS[status];
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(target: OrderStatus) {
    setError(null);
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, target);
      if (res.error) setError(res.error);
    });
  }

  if (!next && status !== "awaiting_payment") return null;
  const size = compact ? "btn-sm" : "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {next ? (
        <button
          type="button"
          disabled={pending}
          className={`btn btn-primary ${size}`}
          onClick={() => {
            if (next === "paid" && !confirm("Confirm the payment has reflected? This issues the tax invoice.")) return;
            run(next);
          }}
        >
          {pending ? "Saving…" : ACTION_LABELS[next]}
        </button>
      ) : null}
      {status === "awaiting_payment" && !compact ? (
        <button
          type="button"
          disabled={pending}
          className={`btn btn-secondary ${size}`}
          onClick={() => {
            if (confirm("Cancel this order? The items go back into stock.")) run("cancelled");
          }}
        >
          Cancel order
        </button>
      ) : null}
      {error ? <p role="alert" className="w-full text-sm text-danger">{error}</p> : null}
    </div>
  );
}
