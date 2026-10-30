import "server-only";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatMoney, formatPercent } from "@/lib/format";
import type { Company, OrderWithItems } from "@/lib/types";

const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

function esc(value: unknown) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

async function send(to: string | string[], subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    console.warn("Email not sent: set RESEND_API_KEY and EMAIL_FROM.");
    return;
  }
  const resend = new Resend(key);
  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) console.error("Resend error:", error);
}

async function loadOrder(orderId: string) {
  const admin = createAdminClient();
  const [{ data: order }, { data: company }] = await Promise.all([
    admin.from("orders").select("*, order_items(*)").eq("id", orderId).single(),
    admin.from("company_settings").select("*").eq("id", 1).single(),
  ]);
  return { order: order as OrderWithItems | null, company: company as Company };
}

function shell(company: Company, body: string) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#34182F;line-height:1.5">
  <h2 style="margin:0 0 20px;font-family:Georgia,serif">${esc(company.name)}</h2>
  ${body}
  <p style="color:#6B5466;font-size:12px;margin-top:32px">${esc(company.name)}${company.phone ? ` | ${esc(company.phone)}` : ""}${company.email ? ` | ${esc(company.email)}` : ""}</p>
</div>`;
}

function itemsTable(order: OrderWithItems, currency: string) {
  const rows = order.order_items
    .map(
      (i) => `<tr>
  <td style="padding:6px 0">${esc(i.product_name)} × ${i.quantity}${Number(i.discount_percent) > 0 ? ` <span style="color:#7A2E5C">(-${formatPercent(i.discount_percent)}%)</span>` : ""}</td>
  <td style="padding:6px 0;text-align:right">${formatMoney(i.line_total, currency)}</td>
</tr>`,
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">
  ${rows}
  <tr><td style="padding:6px 0;border-top:1px solid #E4DAE2">Subtotal (excl. VAT)</td><td style="padding:6px 0;border-top:1px solid #E4DAE2;text-align:right">${formatMoney(order.subtotal, currency)}</td></tr>
  <tr><td style="padding:6px 0">VAT (${formatPercent(order.vat_percent)}%)</td><td style="padding:6px 0;text-align:right">${formatMoney(order.vat_amount, currency)}</td></tr>
  <tr><td style="padding:6px 0;font-weight:bold">Total</td><td style="padding:6px 0;text-align:right;font-weight:bold">${formatMoney(order.total, currency)}</td></tr>
</table>`;
}

export async function sendOrderPlacedEmails(orderId: string) {
  const { order, company } = await loadOrder(orderId);
  if (!order) return;
  const currency = company.currency || "ZAR";
  const link = `${siteUrl()}/account/orders/${order.id}`;

  const payment = company.bank_details
    ? `<p><strong>How to pay:</strong> make an EFT of <strong>${formatMoney(order.total, currency)}</strong> using reference <strong>${order.order_number}</strong>.</p>
       <pre style="font-family:inherit;background:#F4EFF3;padding:12px;border-radius:8px;white-space:pre-wrap">${esc(company.bank_details)}</pre>`
    : "";

  if (order.customer_email) {
    await send(
      order.customer_email,
      `Order #${order.order_number} received`,
      shell(
        company,
        `<p>Hi ${esc(order.customer_name)},</p>
         <p>Thanks for your order. We'll start on it as soon as your payment reflects.</p>
         ${itemsTable(order, currency)}
         ${payment}
         <p><a href="${link}" style="color:#7A2E5C">View your order</a></p>`,
      ),
    );
  }

  if (company.email) {
    await send(
      company.email,
      `New order #${order.order_number} from ${order.customer_name ?? "a customer"}`,
      shell(
        company,
        `<p>New order from ${esc(order.customer_name)} (${esc(order.customer_email)}, ${esc(order.customer_phone)}).</p>
         <p>Delivery address: ${esc(order.delivery_address)}</p>
         ${itemsTable(order, currency)}
         <p><a href="${siteUrl()}/admin/orders/${order.id}" style="color:#7A2E5C">Open in admin</a></p>`,
      ),
    );
  }
}

const STATUS_COPY: Record<string, { subject: string; body: string }> = {
  paid: {
    subject: "Payment received for order #{n}",
    body: "We've received your payment. Your tax invoice is ready to view and print.",
  },
  ordered: {
    subject: "Order #{n} is being prepared",
    body: "Your order is confirmed and we're preparing it now.",
  },
  delivered: {
    subject: "Order #{n} has been delivered",
    body: "Your order has been delivered. Enjoy, and thanks for shopping with us.",
  },
  cancelled: {
    subject: "Order #{n} was cancelled",
    body: "Your order was cancelled. If you think this is a mistake, reply to this email.",
  },
};

export async function sendStatusEmail(orderId: string) {
  const { order, company } = await loadOrder(orderId);
  if (!order?.customer_email) return;
  const copy = STATUS_COPY[order.status];
  if (!copy) return;

  const invoiceLink =
    order.status === "paid"
      ? `<p><a href="${siteUrl()}/invoice/${order.id}" style="color:#7A2E5C">View and print invoice ${esc(order.invoice_number)}</a></p>`
      : "";

  await send(
    order.customer_email,
    copy.subject.replace("{n}", String(order.order_number)),
    shell(
      company,
      `<p>Hi ${esc(order.customer_name)},</p>
       <p>${copy.body}</p>
       ${invoiceLink}
       <p><a href="${siteUrl()}/account/orders/${order.id}" style="color:#7A2E5C">View your order</a></p>`,
    ),
  );
}
