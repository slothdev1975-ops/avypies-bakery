"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendStatusEmail } from "@/lib/email";
import type { OrderStatus } from "@/lib/types";

const ALLOWED: OrderStatus[] = ["paid", "ordered", "delivered", "cancelled"];

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<{ error?: string }> {
  await requireAdmin();
  if (!ALLOWED.includes(status)) return { error: "Unknown status." };

  const admin = createAdminClient();
  // The database trigger enforces the order of statuses, issues the invoice number
  // when the order is paid, and returns stock when an order is cancelled.
  const { error } = await admin.from("orders").update({ status }).eq("id", orderId);
  if (error) return { error: error.message };

  try {
    await sendStatusEmail(orderId);
  } catch (e) {
    console.error("Status email failed", e);
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/");
  return {};
}
