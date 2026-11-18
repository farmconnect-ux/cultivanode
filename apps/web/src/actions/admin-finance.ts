"use server";

import { revalidatePath } from "next/cache";
import type { AdminResult } from "@/actions/admin-console";
import { can, requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SettlementStatusTarget = "processing" | "completed" | "failed";

export async function processSettlementAction(
  _: AdminResult | null,
  form: FormData,
): Promise<AdminResult> {
  const staff = await requireStaff();
  if (!staff || !can(staff, "payouts.approve")) {
    return { ok: false, message: "You need the payouts.approve permission.", at: Date.now() };
  }

  const settlementId = String(form.get("settlement_id") ?? "").trim();
  const status = String(form.get("status") ?? "").trim() as SettlementStatusTarget;
  const note = String(form.get("note") ?? "").trim().slice(0, 500) || null;

  if (!UUID.test(settlementId)) {
    return { ok: false, message: "Invalid settlement ID.", at: Date.now() };
  }
  if (!["processing", "completed", "failed"].includes(status)) {
    return { ok: false, message: "Invalid settlement status.", at: Date.now() };
  }

  const supabase = await createClient();
  const { error } = await (supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ error: { message: string } | null }>)("admin_process_marketplace_settlement", {
    p_settlement_id: settlementId,
    p_status: status,
    p_note: note ?? undefined,
  });

  if (error) {
    return { ok: false, message: error.message || "Could not update settlement.", at: Date.now() };
  }

  revalidatePath("/admin/finance");
  return { ok: true, message: `Settlement marked ${status}.`, at: Date.now() };
}
