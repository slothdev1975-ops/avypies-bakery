import type { Address, OrderStatus } from "@/lib/types";

export function formatMoney(amount: number | string, currency = "ZAR") {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency }).format(Number(amount));
}

export function formatPercent(n: number | string) {
  return Number(n).toLocaleString("en-ZA", { maximumFractionDigits: 2 });
}

export function formatDate(d: string | Date, withTime = false) {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" } : {}),
  }).format(new Date(d));
}

export function withVat(amountExcl: number, vatPercent: number) {
  return Math.round(Number(amountExcl) * (100 + Number(vatPercent))) / 100;
}

/** Highest promotion discount (percent) that keeps the price at or above cost. */
export function maxDiscountPercent(price: number, cost: number) {
  if (Number(price) <= 0) return 0;
  return Math.floor(((Number(price) - Number(cost)) / Number(price)) * 10000) / 100;
}

export function publicImageUrl(path?: string | null) {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-assets/${path}`;
}

export function addressLines(a: Partial<Address>) {
  return [
    a.address_line1,
    a.address_line2,
    [a.city, a.province].filter(Boolean).join(", "),
    [a.postal_code, a.country].filter(Boolean).join(" "),
  ].filter((l): l is string => !!l && l.trim() !== "");
}

export function safeNext(next?: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  awaiting_payment: "Awaiting payment",
  paid: "Paid",
  ordered: "Ordered",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  awaiting_payment: "paid",
  paid: "ordered",
  ordered: "delivered",
};

export const ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  paid: "Mark as paid",
  ordered: "Mark as ordered",
  delivered: "Mark as delivered",
};

export const ORDER_FLOW: OrderStatus[] = ["awaiting_payment", "paid", "ordered", "delivered"];

export const INVOICEABLE: OrderStatus[] = ["paid", "ordered", "delivered"];
