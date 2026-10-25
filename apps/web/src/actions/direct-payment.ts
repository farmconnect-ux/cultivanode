"use server";

// Buyer side of direct payment, used while escrow is switched off (Admin → Feature switches): the buyer
// transfers money to the seller's bank account, tells the seller, and confirms when the goods arrive.
// The database functions check that the order belongs to the signed-in buyer.
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FormResult } from "@/components/live/action-form";
import { actor, dbFail, fail, id, ok, optText } from "@/lib/account/act";

type R = Promise<FormResult>;

function refreshOrder(orderId: string | null) {
  revalidatePath("/[lang]/account/marketplace/orders/[id]", "page");
  revalidatePath("/[lang]/account/marketplace/seller", "page");
  if (orderId) revalidatePath("/[lang]/account/marketplace/orders", "page");
}

/** "I've sent the money" — the seller is then asked to confirm it arrived. */
export async function reportDirectPayment(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const fulfilmentId = id(form, "fulfilment_id");
  if (!fulfilmentId) return fail("Order not found.");
  const loose = supabase as unknown as SupabaseClient;
  const { error } = await loose.rpc("buyer_report_direct_payment", {
    p_fulfilment_id: fulfilmentId,
    p_reference: optText(form, "reference", 120) ?? "",
  });
  if (error) {
    if (["P0001", "P0002", "22023"].includes(error.code ?? "")) return fail(error.message);
    return dbFail(error, "report_direct_payment");
  }
  refreshOrder(id(form, "order_id"));
  return ok("Thanks. We've told the seller. They'll confirm once the money shows in their account.");
}

/** "I received it" — closes this seller's part of the order. */
export async function confirmDirectDelivery(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const fulfilmentId = id(form, "fulfilment_id");
  if (!fulfilmentId) return fail("Order not found.");
  const loose = supabase as unknown as SupabaseClient;
  const { error } = await loose.rpc("buyer_confirm_direct_delivery", { p_fulfilment_id: fulfilmentId });
  if (error) {
    if (["P0001", "P0002"].includes(error.code ?? "")) return fail(error.message);
    return dbFail(error, "confirm_direct_delivery");
  }
  refreshOrder(id(form, "order_id"));
  return ok("Marked as received. Thank you!");
}
