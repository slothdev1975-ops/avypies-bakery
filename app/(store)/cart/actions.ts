"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendOrderPlacedEmails } from "@/lib/email";

export async function placeOrder(
  items: { productId: string; quantity: number }[],
): Promise<{ orderId?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to place your order." };

  // Only ids and quantities are sent. Prices, promotions and VAT are worked out in the database.
  const payload = items.map((i) => ({ product_id: i.productId, quantity: Math.floor(Number(i.quantity)) }));
  const { data, error } = await supabase.rpc("place_order", { p_items: payload });
  if (error) return { error: error.message };

  const orderId = data as string;
  try {
    await sendOrderPlacedEmails(orderId);
  } catch (e) {
    console.error("Order email failed", e);
  }

  revalidatePath("/");
  return { orderId };
}
