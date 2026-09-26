import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_SIGN_IN } from "./paths";

export type Staff = {
  userId: string;
  phone: string | null;
  name: string | null;
  permissions: string[];
};

/**
 * The signed-in staff member, or a redirect. Permissions come from the database (has_permission),
 * which also enforces them again on every call, so this only decides what the console shows.
 */
export async function requireStaff(): Promise<Staff | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(ADMIN_SIGN_IN);

  const [{ data: perms }, { data: profile }] = await Promise.all([
    supabase.rpc("my_permissions"),
    supabase.from("profiles").select("full_name").eq("id", data.user.id).maybeSingle(),
  ]);
  const permissions = (perms ?? []) as string[];
  if (permissions.length === 0) return null; // signed in, but not staff
  return { userId: data.user.id, phone: data.user.phone ?? null, name: profile?.full_name ?? null, permissions };
}

export function can(staff: Staff, permission: string): boolean {
  return staff.permissions.includes(permission);
}
