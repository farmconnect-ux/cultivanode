import type { Metadata } from "next";
import { requireStaff, can } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";
import { CROP_CATALOGUE } from "@cultivanode/shared";
import { AgronomyStandardsConsole, type DbAgronomicStandard } from "@/components/admin/agronomy-standards-console";

export const metadata: Metadata = { title: "Agronomy Standards | CultivaNode Admin" };

export default async function AdminAgronomyPage() {
  const staff = await requireStaff();
  if (!staff) return null;

  const supabase = await createClient();
  const { data: dbStandards } = await supabase
    .from("farm_agronomic_standards")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <AgronomyStandardsConsole
      initialStandards={((dbStandards as unknown) as DbAgronomicStandard[]) ?? []}
      crops={CROP_CATALOGUE.map((c) => ({
        id: c.id,
        commonName: c.commonName,
        scientificName: c.scientificName,
        category: c.category,
      }))}
      canPublish={can(staff, "standards.publish")}
      currentUserId={staff.userId}
      currentUserName={staff.name ?? "Staff Member"}
    />
  );
}
