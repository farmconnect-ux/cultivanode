"use client";

import { useState } from "react";
import type { AgronomicStandard } from "@cultivanode/shared";
import { Badge, Button, Card, Field, Input, Select } from "@/components/ui";

type StandardItem = AgronomicStandard;

type Props = {
  initialStandards: AgronomicStandard[];
  crops: { id: string; commonName: string; scientificName: string; category: string }[];
};

export function AgronomyStandardsConsole({ initialStandards, crops }: Props) {
  const [standards, setStandards] = useState<StandardItem[]>(
    initialStandards.map((s) => ({ ...s, status: s.status ?? "published" }))
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [protocolModalOpen, setProtocolModalOpen] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState<StandardItem | null>(null);
  const [selectedCropProtocol, setSelectedCropProtocol] = useState<{ id: string; commonName: string; scientificName: string; category: string } | null>(null);

  // Form states
  const [cropId, setCropId] = useState("cassava");
  const [title, setTitle] = useState("");
  const [version, setVersion] = useState(1);
  const [maxNitrogen, setMaxNitrogen] = useState(120);
  const [approvedBy, setApprovedBy] = useState("CultivaNode Agronomy Advisory Board & NCRI");
  const [mandatedOps, setMandatedOps] = useState("Land Preparation, Ridge Formation, Certified Planting Material, Pre-emergence Weed Control");
  const [restrictedChems, setRestrictedChems] = useState("paraquat, carbofuran, monocrotophos, ddt");
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  function openCreateModal() {
    setIsEditing(false);
    setSelectedStandard(null);
    setCropId("cassava");
    setTitle("Nigerian GAP Standard for High-Yield Cassava (TME-419)");
    setVersion(1);
    setMaxNitrogen(100);
    setApprovedBy("Federal Ministry of Agriculture & Food Security / IITA");
    setMandatedOps("Deep Tillage & Bunding, Certified TME-419 Stem Cutting, Basal NPK 15:15:15, Pre-harvest Tuber MRL Inspection");
    setRestrictedChems("paraquat, endosulfan, monocrotophos");
    setModalOpen(true);
  }

  function openEditModal(std: StandardItem) {
    setIsEditing(true);
    setSelectedStandard(std);
    setCropId(std.cropId);
    setTitle(std.title);
    setVersion(std.version);
    setMaxNitrogen(std.maxFertiliserNitrogenKgPerHa);
    setApprovedBy(std.approvedBy);
    setMandatedOps(std.mandatedOperations.join(", "));
    setRestrictedChems(std.restrictedChemicals.join(", "));
    setModalOpen(true);
  }

  function handleSave(publishDirectly: boolean) {
    const opsArray = mandatedOps.split(",").map((s) => s.trim()).filter(Boolean);
    const chemsArray = restrictedChems.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

    if (isEditing && selectedStandard) {
      setStandards((prev) =>
        prev.map((item) =>
          item.id === selectedStandard.id
            ? {
                ...item,
                cropId,
                title,
                version: publishDirectly ? item.version + 1 : item.version,
                status: publishDirectly ? "published" : "draft",
                maxFertiliserNitrogenKgPerHa: maxNitrogen,
                approvedBy,
                mandatedOperations: opsArray,
                restrictedChemicals: chemsArray,
                approvedAt: new Date().toISOString().slice(0, 10),
              }
            : item
        )
      );
      setNotification(
        publishDirectly
          ? `Standard "${title}" version ${selectedStandard.version + 1}.0 published successfully!`
          : `Standard draft "${title}" updated.`
      );
    } else {
      const newId = `${cropId}_gap_v${version}_${Date.now().toString().slice(-4)}`;
      const newItem: StandardItem = {
        id: newId,
        cropId,
        title,
        version,
        status: publishDirectly ? "published" : "draft",
        maxFertiliserNitrogenKgPerHa: maxNitrogen,
        approvedBy,
        mandatedOperations: opsArray,
        restrictedChemicals: chemsArray,
        approvedAt: new Date().toISOString().slice(0, 10),
      };
      setStandards((prev) => [newItem, ...prev]);
      setNotification(
        publishDirectly
          ? `New Standard "${title}" v${version}.0 published to network!`
          : `New Standard draft "${title}" created.`
      );
    }

    setModalOpen(false);
    setTimeout(() => setNotification(null), 5000);
  }

  function publishStandard(std: StandardItem) {
    setStandards((prev) =>
      prev.map((item) =>
        item.id === std.id
          ? {
              ...item,
              version: item.status === "published" ? item.version + 1 : item.version,
              status: "published",
              approvedAt: new Date().toISOString().slice(0, 10),
            }
          : item
      )
    );
    setNotification(`Standard "${std.title}" version updated and published!`);
    setTimeout(() => setNotification(null), 5000);
  }

  function openProtocol(crop: { id: string; commonName: string; scientificName: string; category: string }) {
    setSelectedCropProtocol(crop);
    setProtocolModalOpen(true);
  }

  return (
    <div className="space-y-6">
      {notification && (
        <div role="status" className="rounded-lg bg-emerald-50 border border-emerald-300 p-4 text-sm font-semibold text-emerald-900 flex items-center justify-between shadow-sm">
          <span>✓ {notification}</span>
          <button type="button" onClick={() => setNotification(null)} className="text-emerald-700 hover:text-emerald-950 font-bold">&times;</button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-leaf-900">Agronomy Standards &amp; Version Governance</h1>
          <p className="mt-1 text-muted">Immutable crop standards, Good Agricultural Practice (GAP) guidelines, and chemical restrictions.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-leaf-100 text-leaf-800">Version Control: Active</Badge>
          <Button variant="primary" size="sm" onClick={openCreateModal}>
            + Create Standard Draft
          </Button>
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
        <h2 className="text-xl font-bold text-leaf-900">Good Agricultural Practice (GAP) Standards ({standards.length})</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {standards.map((std) => (
            <Card key={std.id} className="flex flex-col justify-between gap-4 border border-line hover:border-leaf-400 transition-colors">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-line pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-leaf-900">{std.title}</h3>
                    <p className="text-xs font-semibold text-muted">Standard ID: {std.id} • Crop: {std.cropId.toUpperCase()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={std.status === "published" ? "bg-leaf-100 text-leaf-800" : "bg-amber-100 text-amber-800"}>
                      v{std.version}.0 {std.status === "published" ? "Published" : "Draft"}
                    </Badge>
                    <span className="text-[11px] text-muted">{std.approvedAt ?? "Pending Approval"}</span>
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
                <span className="text-xs text-muted">Status: {std.status === "published" ? "Active Reference" : "Draft In Review"}</span>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => openEditModal(std)}>
                    Edit Draft
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => publishStandard(std)}>
                    {std.status === "published" ? "Bump Version" : "Publish Version"}
                  </Button>
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
          {crops.map((crop) => (
            <Card key={crop.id} className="flex flex-col justify-between gap-2 border border-line">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-leaf-900">{crop.commonName}</h3>
                  <Badge className="bg-line/60 text-ink text-[10px]">{crop.category.toUpperCase()}</Badge>
                </div>
                <p className="text-xs italic text-muted">{crop.scientificName}</p>
                <div className="mt-3 space-y-1">
                  <p className="text-[11px] font-bold text-muted uppercase">Recommended Agro-Ecological Zones:</p>
                  <p className="text-xs text-ink">Derived Savanna, Rainforest Belt (South-West NG)</p>
                </div>
              </div>
              <div className="border-t border-line pt-2 text-right">
                <Button variant="ghost" size="sm" onClick={() => openProtocol(crop)}>
                  View Protocol &rarr;
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal for Creating / Editing Standards */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl border border-line">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-xl font-bold text-leaf-900">
                {isEditing ? `Edit Agronomy Standard (v${version})` : "Create New Agronomy Standard Draft"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-muted hover:bg-surface-container hover:text-ink text-xl"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave(false);
              }}
              className="mt-4 space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="std-crop" label="Target Crop">
                  <Select id="std-crop" value={cropId} onChange={(e) => setCropId(e.target.value)}>
                    {crops.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.commonName} ({c.scientificName})
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field id="std-version" label="Standard Version">
                  <Input
                    id="std-version"
                    type="number"
                    min={1}
                    value={version}
                    onChange={(e) => setVersion(Number(e.target.value))}
                    required
                  />
                </Field>
              </div>

              <Field id="std-title" label="Standard Title">
                <Input
                  id="std-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Nigerian GAP Standard for Commercial Maize"
                  required
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="std-nitrogen" label="Max Nitrogen Ceiling (kg N/ha)">
                  <Input
                    id="std-nitrogen"
                    type="number"
                    min={0}
                    value={maxNitrogen}
                    onChange={(e) => setMaxNitrogen(Number(e.target.value))}
                    required
                  />
                </Field>

                <Field id="std-approver" label="Approving Regulatory Authority">
                  <Input
                    id="std-approver"
                    value={approvedBy}
                    onChange={(e) => setApprovedBy(e.target.value)}
                    required
                  />
                </Field>
              </div>

              <Field id="std-mandated" label="Mandated Farm Operations (Comma-separated)">
                <Input
                  id="std-mandated"
                  value={mandatedOps}
                  onChange={(e) => setMandatedOps(e.target.value)}
                  placeholder="Ploughing & Harrowing, Planting, Weed Control, Harvesting"
                  required
                />
              </Field>

              <Field id="std-restricted" label="Restricted / Prohibited Chemicals (NAFDAC / WHO Class 1)">
                <Input
                  id="std-restricted"
                  value={restrictedChems}
                  onChange={(e) => setRestrictedChems(e.target.value)}
                  placeholder="paraquat, carbofuran, monocrotophos, ddt"
                  required
                />
              </Field>

              <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
                <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="secondary">
                  Save as Draft
                </Button>
                <Button type="button" variant="primary" onClick={() => handleSave(true)}>
                  Publish Immutable Version
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Protocol Modal */}
      {protocolModalOpen && selectedCropProtocol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl border border-line">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h2 className="text-xl font-bold text-leaf-900">{selectedCropProtocol.commonName} Protocol</h2>
                <p className="text-xs italic text-muted">{selectedCropProtocol.scientificName}</p>
              </div>
              <button
                type="button"
                onClick={() => setProtocolModalOpen(false)}
                className="rounded-lg p-1 text-muted hover:bg-surface-container hover:text-ink text-xl"
              >
                &times;
              </button>
            </div>
            <div className="mt-4 space-y-4 text-sm text-ink">
              <div className="rounded-lg bg-leaf-50 p-3 border border-leaf-200">
                <p className="font-semibold text-leaf-900">Good Agricultural Practices Summary</p>
                <p className="mt-1 text-xs text-leaf-800">
                  Standard agronomic protocol governing seed bed preparation, vegetative growth, nutrient scheduling, and post-harvest MRL clearance in South-West Nigeria.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-leaf-900">Phenological Stages</h4>
                <ul className="mt-1 list-disc list-inside space-y-1 text-xs text-muted">
                  <li><strong>Stage 0 (Germination &amp; Emergence):</strong> Days 1–10. Requires soil moisture &gt; 50% field capacity.</li>
                  <li><strong>Stage 1 (Vegetative Canopy):</strong> Days 11–45. First weed control window, basal split-N application.</li>
                  <li><strong>Stage 2 (Reproductive &amp; Flowering):</strong> Days 46–75. Critical water stress guardrail. Strictly zero Class-1 insecticides.</li>
                  <li><strong>Stage 3 (Maturity &amp; Desiccation):</strong> Days 76–110. Pre-Harvest Interval (PHI) lockout compliance before mechanical harvesting.</li>
                </ul>
              </div>
              <div className="border-t border-line pt-3 text-right">
                <Button variant="primary" size="sm" onClick={() => setProtocolModalOpen(false)}>
                  Close Protocol
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
