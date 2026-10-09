"use server";

import { revalidatePath } from "next/cache";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";

export async function provisionDevice(formData: FormData): Promise<void> {
  const account = await requireAccount();
  const supabase = await createClient();

  const serialNumber = (formData.get("serial_number") as string)?.trim();
  const modelId = (formData.get("model_id") as string)?.trim();

  if (!serialNumber || !modelId) {
    throw new Error("Serial number and model ID are required");
  }

  const { error } = await supabase.from("devices").insert({
    serial_number: serialNumber,
    model_id: modelId,
    status: "provisioned",
    assigned_owner_id: account.userId,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/[lang]/account/iot", "page");
}

export async function installDeviceOnPlot(formData: FormData): Promise<void> {
  const account = await requireAccount();
  const supabase = await createClient();

  const deviceId = formData.get("device_id") as string;
  const farmId = formData.get("farm_id") as string;
  const plotId = formData.get("plot_id") as string;
  const probeDepthCm = formData.get("probe_depth_cm") ? Number(formData.get("probe_depth_cm")) : undefined;

  if (!deviceId || !farmId || !plotId) {
    throw new Error("Device, farm, and plot are required");
  }

  const { error: instError } = await supabase.from("device_installations").insert({
    device_id: deviceId,
    farm_id: farmId,
    plot_id: plotId,
    installed_by: account.userId,
    probe_depth_cm: probeDepthCm,
    is_active: true,
  });

  if (instError) {
    throw new Error(instError.message);
  }

  // Update device status to installed / assigned
  await supabase
    .from("devices")
    .update({ status: "installed" })
    .eq("id", deviceId);

  revalidatePath("/[lang]/account/iot", "page");
  revalidatePath("/[lang]/account", "page");
}

export async function acknowledgeDeviceAlert(formData: FormData): Promise<void> {
  const account = await requireAccount();
  const supabase = await createClient();

  const alertId = formData.get("alert_id") as string;
  if (!alertId) throw new Error("Alert ID is required");

  const { error } = await supabase
    .from("device_alerts")
    .update({
      status: "acknowledged",
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: account.userId,
    })
    .eq("id", alertId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/[lang]/account/iot", "page");
  revalidatePath("/[lang]/account", "page");
}
