"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function openMarketplaceOrderNotification(formData: FormData): Promise<never> {
  const lang = String(formData.get("lang") ?? "en").slice(0, 5);
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
