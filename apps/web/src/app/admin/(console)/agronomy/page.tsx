import type { Metadata } from "next";
import { requireStaff } from "@/lib/admin/staff";
import { CROP_CATALOGUE, PUBLISHED_STANDARDS } from "@cultivanode/shared";
import { AgronomyStandardsConsole } from "@/components/admin/agronomy-standards-console";

export const metadata: Metadata = { title: "Agronomy Standards | CultivaNode Admin" };

export default async function AdminAgronomyPage() {
  const staff = await requireStaff();
  if (!staff) return null;

  const standardsList = Object.values(PUBLISHED_STANDARDS);

  return (
    <AgronomyStandardsConsole
      initialStandards={standardsList}
      crops={CROP_CATALOGUE.map((c) => ({
        id: c.id,
        commonName: c.commonName,
        scientificName: c.scientificName,
        category: c.category,
      }))}
    />
  );
}
