"use server";

import { revalidatePath } from "next/cache";
import type { AdminActionState } from "@/components/admin/admin-form";
import { can, requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SettlementStatusTarget = "processing" | "completed" | "failed";

export async function processSettlementAction(
  _: AdminActionState,
  form: FormData,
): Promise<AdminActionState> {
  const staff = await requireStaff();
  if (!staff || !can(staff, "payouts.approve")) {
    return { ok: false, error: "You need the payouts.approve permission." };
  }

  const settlementId = String(form.get("settlement_id") ?? "").trim();
  const status = String(form.get("status") ?? "").trim() as SettlementStatusTarget;
  const note = String(form.get("note") ?? "").trim().slice(0, 500) || null;

  if (!UUID.test(settlementId)) {
    return { ok: false, error: "Invalid settlement ID." };
  }
  if (!["processing", "completed", "failed"].includes(status)) {
    return { ok: false, error: "Invalid settlement status." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_process_marketplace_settlement", {
    p_settlement_id: settlementId,
    p_status: status,
    p_note: note ?? undefined,
  });

  if (error) {
    return { ok: false, error: error.message || "Could not update settlement." };
  }

  revalidatePath("/admin/finance");
  return { ok: true, message: `Settlement marked ${status}.` };
}
