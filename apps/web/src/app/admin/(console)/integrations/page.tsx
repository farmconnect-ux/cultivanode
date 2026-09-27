import type { Metadata } from "next";
import { IntegrationsBoard, type Overview } from "@/components/admin/integrations";
import { Alert } from "@/components/ui";
import { can, requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Integrations" };

export default async function IntegrationsPage() {
  const staff = await requireStaff();
  if (!staff) return null;
  if (!can(staff, "integrations.manage")) {
    return <Alert tone="danger">You need the integrations permission to open this page.</Alert>;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_integration_overview");
  if (error || !data) return <Alert tone="danger">Could not load the integration settings. Refresh to try again.</Alert>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold text-leaf-800">Integrations</h1>
        <p className="mt-1 max-w-3xl text-muted">
          Pick which provider sends sign-in codes, which one checks NIN, BVN and bank accounts, and which one supplies weather. Keys are stored
          encrypted and can only be replaced, never read back. Test and live keep separate settings and keys.
        </p>
      </div>
      <IntegrationsBoard overview={data as unknown as Overview} />
    </div>
  );
}
