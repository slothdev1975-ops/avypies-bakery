import { formatMoney, formatPercent } from "@/lib/format";
import type { OrderWithItems } from "@/lib/types";

export function OrderItemsTable({ order, currency }: { order: OrderWithItems; currency: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Item</th>
            <th className="text-right">Qty</th>
            <th className="text-right">Unit price excl. VAT</th>
            <th className="text-right">Amount excl. VAT</th>
          </tr>
        </thead>
        <tbody>
          {order.order_items.map((i) => (
            <tr key={i.id}>
              <td>
                {i.product_name}
                {Number(i.discount_percent) > 0 ? (
                  <span className="ml-2 rounded-full bg-butter px-2 py-0.5 text-xs">-{formatPercent(i.discount_percent)}%</span>
                ) : null}
              </td>
              <td className="text-right tabular-nums">{i.quantity}</td>
              <td className="text-right tabular-nums">{formatMoney(i.unit_price_after_discount, currency)}</td>
              <td className="text-right tabular-nums">{formatMoney(i.line_total, currency)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="text-sm">
          <tr>
            <td colSpan={3} className="text-right">Subtotal</td>
            <td className="text-right tabular-nums">{formatMoney(order.subtotal, currency)}</td>
          </tr>
          <tr>
            <td colSpan={3} className="text-right">VAT ({formatPercent(order.vat_percent)}%)</td>
            <td className="text-right tabular-nums">{formatMoney(order.vat_amount, currency)}</td>
          </tr>
          <tr>
            <td colSpan={3} className="text-right font-semibold">Total</td>
            <td className="text-right font-semibold tabular-nums">{formatMoney(order.total, currency)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
