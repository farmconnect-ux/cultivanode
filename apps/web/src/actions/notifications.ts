"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { defaultLocale, hasLocale, type Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

export async function openMarketplaceOrderNotification(formData: FormData): Promise<never> {
  const rawLang = String(formData.get("lang") ?? "").trim().toLowerCase();
  const lang: Locale = hasLocale(rawLang) ? rawLang : defaultLocale;
  const notificationId = String(formData.get("notification_id") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(notificationId)) redirect(`/${lang}/account/inbox`);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${lang}/sign-in`);
  const { data: notification, error } = await supabase.from("notifications").select("kind, data").eq("id", notificationId).eq("profile_id", user.id).maybeSingle();
  const orderId = notification?.kind?.startsWith("marketplace_order_") ? (notification.data as { order_id?: unknown } | null)?.order_id : null;
  if (error || typeof orderId !== "string" || !/^[0-9a-f-]{36}$/i.test(orderId)) redirect(`/${lang}/account/inbox`);
  const { error: readError } = await supabase.rpc("mark_notifications_read", { p_ids: [notificationId] });
  if (readError) throw new Error("Could not mark this notification as read.");
  revalidatePath(`/${lang}/account/inbox`);
  revalidatePath(`/${lang}/account`);
  if (notification?.kind === "marketplace_order_placed") redirect(`/${lang}/account/marketplace/seller?order=${orderId}`);
  redirect(`/${lang}/account/marketplace/orders/${orderId}`);
}

/** Batch 05: farm alert emails on or off for the signed-in person. */
export async function setFarmAlertEmail(formData: FormData): Promise<void> {
  const rawLang = String(formData.get("lang") ?? "").trim().toLowerCase();
  const lang: Locale = hasLocale(rawLang) ? rawLang : defaultLocale;
  const on = String(formData.get("on") ?? "");
  if (on !== "true" && on !== "false") return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${lang}/sign-in`);
  const { error } = await supabase.rpc("set_farm_alert_email", { p_on: on === "true" });
  if (error) throw new Error("Could not save your email choice.");
  revalidatePath(`/${lang}/account/inbox`);
}

/** Batch 05: the farmer answers a farm alert (useful / not useful / done). Marks the notification read. */
export async function respondToFarmAlert(formData: FormData): Promise<void> {
  const rawLang = String(formData.get("lang") ?? "").trim().toLowerCase();
  const lang: Locale = hasLocale(rawLang) ? rawLang : defaultLocale;
  const notificationId = String(formData.get("notification_id") ?? "").trim();
  const response = String(formData.get("response") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(notificationId) || !["useful", "not_useful", "done"].includes(response)) return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${lang}/sign-in`);
  const { data: notification } = await supabase
    .from("notifications")
    .select("kind, data")
    .eq("id", notificationId)
    .eq("profile_id", user.id)
    .maybeSingle();
  const eventId = notification?.kind?.startsWith("farm_") ? (notification.data as { event_id?: unknown } | null)?.event_id : null;
  if (typeof eventId !== "string" || !/^[0-9a-f-]{36}$/i.test(eventId)) return;
  const { error } = await supabase.rpc("respond_to_intelligence_event", { p_event_id: eventId, p_response: response });
  if (error) throw new Error("Could not save your answer to this alert.");
  await supabase.rpc("mark_notifications_read", { p_ids: [notificationId] });
  revalidatePath(`/${lang}/account/inbox`);
  revalidatePath(`/${lang}/account`);
}
