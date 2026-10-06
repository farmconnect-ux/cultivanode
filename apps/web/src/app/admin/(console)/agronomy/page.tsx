import type { Metadata } from "next";
import { Badge, Button, Card } from "@/components/ui";
import { requireStaff } from "@/lib/admin/staff";
import { CROP_CATALOGUE, PUBLISHED_STANDARDS } from "@cultivanode/shared";

export const metadata: Metadata = { title: "Agronomy Standards | CultivaNode Admin" };

export default async function AdminAgronomyPage() {
  const staff = await requireStaff();
  if (!staff) return null;

  const standardsList = Object.values(PUBLISHED_STANDARDS);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-leaf-900">Agronomy Standards &amp; Version Governance</h1>
          <p className="mt-1 text-muted">Immutable crop standards, Good Agricultural Practice (GAP) guidelines, and spray restrictions.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-leaf-100 text-leaf-800">Version Control: Active</Badge>
          <Button variant="primary" size="sm">+ Create Standard Draft</Button>
        </div>
      </div>

      <div className="rounded-md border-l-4 border-l-harvest-500 bg-harvest-50 p-4 text-sm text-harvest-900">
        <p className="font-semibold">Agronomic Invariant: Strict Version Immutability</p>
        <p className="mt-0.5 text-xs text-harvest-800">
          Published crop standards are cryptographically anchored and cannot be overwritten in place. Publishing creates a new immutable version (e.g., v1.0 &rarr; v1.1) ensuring historical farm advice and seasonal records remain audit-compliant.
        </p>
      </div>

      {/* Published Standards Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-leaf-900">Published GAP Standards</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {standardsList.map((std) => (
            <Card key={std.id} className="flex flex-col justify-between gap-4 border border-line hover:border-leaf-400 transition-colors">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-line pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-leaf-900">{std.title}</h3>
                    <p className="text-xs font-semibold text-muted">Standard ID: {std.id} • Crop: {std.cropId.toUpperCase()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className="bg-leaf-100 text-leaf-800">v{std.version}.0 Published</Badge>
                    <span className="text-[11px] text-muted">{std.approvedAt}</span>
                  </div>
                </div>

                <div className="rounded bg-earth-50/60 p-3 text-xs space-y-1">
                  <p className="font-semibold text-ink">Approved by: {std.approvedBy}</p>
                  <p className="text-muted">Max Nitrogen Ceiling: <strong className="text-ink">{std.maxFertiliserNitrogenKgPerHa} kg N/ha</strong></p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">Mandated Farm Operations</p>
                  <ul className="list-disc list-inside text-xs text-ink space-y-0.5">
                    {std.mandatedOperations.map((op, idx) => (
                      <li key={idx}>{op}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded bg-red-50 p-2.5 border border-red-200 text-xs text-danger space-y-1">
                  <p className="font-bold">Prohibited Active Chemical Ingredients:</p>
                  <p>{std.restrictedChemicals.join(", ")} (Strictly forbidden by NAFDAC / WHO Class 1)</p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-line pt-3">
                <span className="text-xs text-muted">Status: Active Reference</span>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm">Edit Draft</Button>
                  <Button variant="primary" size="sm">Publish Version</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Available Crops Reference */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-leaf-900">Supported Regional Crop Catalogue</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CROP_CATALOGUE.map((crop) => (
            <Card key={crop.id} className="flex flex-col justify-between gap-2 border border-line">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-leaf-900">{crop.commonName}</h3>
                  <Badge className="bg-line/60 text-ink text-[10px]">{crop.category.toUpperCase()}</Badge>
                </div>
                <p className="text-xs italic text-muted">{crop.scientificName}</p>
                <p className="mt-2 text-xs text-muted">
                  Zones: {crop.suitableZones.join(", ")}
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-[11px] font-bold text-muted uppercase">Recommended Varieties:</p>
                  <p className="text-xs text-ink">
                    {crop.varieties.map((v) => v.name).join(", ")}
                  </p>
                </div>
              </div>
              <div className="border-t border-line pt-2 text-right">
                <Button variant="ghost" size="sm">View Protocol &rarr;</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
