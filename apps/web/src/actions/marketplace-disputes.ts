"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FormResult } from "@/components/live/action-form";
import { actor, dbFail, fail, id, kobo, ok, optText, text } from "@/lib/account/act";

type R = Promise<FormResult>;

export async function openMarketplaceDisputeAction(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const orderId = id(form, "order_id");
  const fulfilmentId = id(form, "fulfilment_id");
  const reason = optText(form, "reason", 50) || "other";
  const notes = text(form, "notes", 2000);
  if (!notes || notes.length < 10) {
    return fail("Please give details of what went wrong (at least 10 characters).");
  }

  const claimKobo = kobo(form, "claim_amount_naira");

  if (!orderId) return fail("Order not found.");

  const loose = supabase as unknown as SupabaseClient;
  const { error } = await loose.rpc("open_marketplace_dispute", {
    p_order_id: orderId,
    p_fulfilment_id: fulfilmentId,
    p_reason: reason,
    p_notes: notes,
    p_claim_amount_kobo: claimKobo,
  });

  if (error) {
    if (["P0001", "P0002", "42501", "22023"].includes(error.code ?? "")) return fail(error.message);
    return dbFail(error, "open_marketplace_dispute");
  }

  revalidatePath("/[lang]/account/marketplace/orders/[id]", "page");
  revalidatePath("/[lang]/account/marketplace/seller", "page");
  revalidatePath("/[lang]/account/marketplace/orders", "page");
  return ok("Dispute submitted. Our arbitration team will review the details and reach out.");
}
