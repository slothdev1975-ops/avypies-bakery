import { addressLines, formatDate, formatMoney, formatPercent, publicImageUrl } from "@/lib/format";
import type { Company, OrderWithItems } from "@/lib/types";

/** Uses the company details captured when the order was paid, so old invoices never change. */
export function Invoice({ order, company: current }: { order: OrderWithItems; company: Company }) {
  const company: Company = { ...current, ...(order.company_snapshot ?? {}) } as Company;
  const logo = publicImageUrl(company.logo_path);
  const cur = company.currency || "ZAR";

  return (
    <article className="mx-auto max-w-[210mm] bg-white p-8 text-sm leading-relaxed sm:p-12 print:max-w-none print:p-0">
      <header className="flex flex-wrap items-start justify-between gap-8 border-b-2 border-ink pb-8">
        <div>
          {logo ? <img src={logo} alt={company.name} className="mb-4 h-20 w-auto max-w-[220px] object-contain" /> : null}
          <p className="font-display text-xl">{company.legal_name || company.name}</p>
          {addressLines(company).map((l) => (
            <p key={l}>{l}</p>
          ))}
          {company.vat_number ? <p>VAT no. {company.vat_number}</p> : null}
          {company.registration_number ? <p>Reg. no. {company.registration_number}</p> : null}
          {company.phone ? <p>{company.phone}</p> : null}
          {company.email ? <p>{company.email}</p> : null}
        </div>
        <div className="text-right">
          <h1 className="font-display text-4xl">Tax invoice</h1>
          <dl className="mt-4 grid grid-cols-[auto_auto] justify-end gap-x-6 gap-y-1">
            <dt className="text-ink-soft">Invoice no.</dt>
            <dd className="font-medium">{order.invoice_number}</dd>
            <dt className="text-ink-soft">Invoice date</dt>
            <dd>{order.paid_at ? formatDate(order.paid_at) : ""}</dd>
            <dt className="text-ink-soft">Order no.</dt>
            <dd>{order.order_number}</dd>
          </dl>
        </div>
      </header>

      <section className="py-8">
        <h2 className="mb-1 font-semibold">Bill to</h2>
        <p>{order.customer_name}</p>
        <p>{order.delivery_address}</p>
        <p>{order.customer_email}</p>
        <p>{order.customer_phone}</p>
      </section>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-ink text-left">
            <th className="py-2 font-semibold">Description</th>
            <th className="py-2 text-right font-semibold">Qty</th>
            <th className="py-2 text-right font-semibold">Unit price</th>
            <th className="py-2 text-right font-semibold">Discount</th>
            <th className="py-2 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.order_items.map((i) => (
            <tr key={i.id} className="border-b border-line">
              <td className="py-2">
                {i.product_name}
                {i.sku ? <span className="text-ink-soft"> ({i.sku})</span> : null}
              </td>
              <td className="py-2 text-right tabular-nums">{i.quantity}</td>
              <td className="py-2 text-right tabular-nums">{formatMoney(i.unit_price, cur)}</td>
              <td className="py-2 text-right tabular-nums">
                {Number(i.discount_percent) > 0 ? `${formatPercent(i.discount_percent)}%` : ""}
              </td>
              <td className="py-2 text-right tabular-nums">{formatMoney(i.line_total, cur)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-ink-soft">Amounts exclude VAT.</p>

      <dl className="ml-auto mt-6 max-w-xs space-y-1">
        {Number(order.discount_total) > 0 ? (
          <div className="flex justify-between text-ink-soft">
            <dt>Discount given</dt>
            <dd className="tabular-nums">{formatMoney(order.discount_total, cur)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between">
          <dt>Subtotal excl. VAT</dt>
          <dd className="tabular-nums">{formatMoney(order.subtotal, cur)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>VAT ({formatPercent(order.vat_percent)}%)</dt>
          <dd className="tabular-nums">{formatMoney(order.vat_amount, cur)}</dd>
        </div>
        <div className="flex justify-between border-t-2 border-ink pt-2 text-base font-semibold">
          <dt>Total incl. VAT</dt>
          <dd className="tabular-nums">{formatMoney(order.total, cur)}</dd>
        </div>
        <div className="flex justify-between text-sage">
          <dt>Paid</dt>
          <dd className="tabular-nums">{formatMoney(order.total, cur)}</dd>
        </div>
      </dl>

      <p className="mt-12 text-xs text-ink-soft">Thank you for your order.</p>
    </article>
  );
}
