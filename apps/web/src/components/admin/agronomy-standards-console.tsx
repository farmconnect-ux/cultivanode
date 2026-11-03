"use client";

import { useState, useTransition } from "react";
import {
  adminCreateStandardDraft,
  adminSubmitStandardForReview,
  adminPublishStandard,
} from "@/actions/admin-console";
import { Badge, Button, Card, Field, Input, Select, TextArea } from "@/components/ui";

export type DbAgronomicStandard = {
  id: string;
  standard_code: string;
  crop_or_livestock_id: string;
  agro_zone: string;
  version: string;
  title: string;
  description: string | null;
  parameters: Record<string, unknown>;
  mandated_operations: string[];
  restricted_chemicals: string[];
  max_nitrogen_kg_ha: number | null;
  status: "draft" | "in_review" | "approved" | "published" | "superseded" | "retired";
  author_id: string | null;
  reviewer_id: string | null;
  approved_by_id: string | null;
  approved_by_name: string | null;
  external_partner_reference: string | null;
  change_notes: string | null;
  effective_from: string | null;
  effective_to: string | null;
  published_at: string | null;
  is_active: boolean;
  supersedes_id: string | null;
  created_at: string;
  updated_at: string;
};

type Props = {
  initialStandards: DbAgronomicStandard[];
  crops: { id: string; commonName: string; scientificName: string; category: string }[];
  canPublish: boolean;
  currentUserId: string;
  currentUserName: string;
};

export function AgronomyStandardsConsole({
  initialStandards,
  crops,
  canPublish,
  currentUserId,
  currentUserName,
}: Props) {
  const [standards, setStandards] = useState<DbAgronomicStandard[]>(initialStandards);
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [protocolModalOpen, setProtocolModalOpen] = useState(false);

  // Active items
  const [standardToPublish, setStandardToPublish] = useState<DbAgronomicStandard | null>(null);
  const [selectedCropProtocol, setSelectedCropProtocol] = useState<{ id: string; commonName: string; scientificName: string; category: string } | null>(null);

  // Draft Form states
  const [code, setCode] = useState("GAP_MAIZE_V1");
  const [cropId, setCropId] = useState("maize");
  const [agroZone, setAgroZone] = useState("rainforest");
  const [version, setVersion] = useState("1.0");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [maxNitrogen, setMaxNitrogen] = useState(120);
  const [mandatedOps, setMandatedOps] = useState("Ploughing & Harrowing, Planting & Basal Fertilisation, First Weeding");
  const [restrictedChems, setRestrictedChems] = useState("paraquat, carbofuran, monocrotophos, ddt");
  const [sourceAuthority, setSourceAuthority] = useState("IITA_NIHORT_GAP");
  const [supersedesId, setSupersedesId] = useState<string | null>(null);

  // Publish Form states
  const [approverTitle, setApproverTitle] = useState(currentUserName);
  const [partnerReference, setPartnerReference] = useState("IITA/GAP/2026/01");
  const [publishNotes, setPublishNotes] = useState("");

  function notify(type: "success" | "error", text: string) {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 7000);
  }

  function openCreateModal(baseStd?: DbAgronomicStandard) {
    if (baseStd) {
      // Bump to new draft version
      const nextVer = `${(parseFloat(baseStd.version) || 1) + 1}.0`;
      setCode(baseStd.standard_code);
      setCropId(baseStd.crop_or_livestock_id);
      setAgroZone(baseStd.agro_zone);
      setVersion(nextVer);
      setTitle(`Updated: ${baseStd.title}`);
      setDescription(baseStd.description ?? "");
      setMaxNitrogen(baseStd.max_nitrogen_kg_ha ?? 120);
      setMandatedOps((baseStd.mandated_operations || []).join(", "));
      setRestrictedChems((baseStd.restricted_chemicals || []).join(", "));
      setSourceAuthority(baseStd.approved_by_name ?? "IITA_NIHORT_GAP");
      setSupersedesId(baseStd.id);
    } else {
      setCode(`GAP_${cropId.toUpperCase()}_V1`);
      setCropId("maize");
      setAgroZone("rainforest");
      setVersion("1.0");
      setTitle("Good Agricultural Practices (GAP) Standard");
      setDescription("Regional standard guidelines for sustainable high yields");
      setMaxNitrogen(120);
      setMandatedOps("Ploughing & Harrowing, Planting & Basal Fertilisation, First Weeding");
      setRestrictedChems("paraquat, carbofuran, monocrotophos, ddt");
      setSourceAuthority("IITA_NIHORT_GAP");
      setSupersedesId(null);
    }
    setCreateModalOpen(true);
  }

  function handleCreateDraft(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      formData.set("standard_code", code);
      formData.set("crop_id", cropId);
      formData.set("agro_zone", agroZone);
      formData.set("version", version);
      formData.set("title", title);
      formData.set("description", description);
      formData.set("max_nitrogen_kg_ha", String(maxNitrogen));
      formData.set("mandated_operations", mandatedOps);
      formData.set("restricted_chemicals", restrictedChems);
      formData.set("source_authority", sourceAuthority);
      if (supersedesId) formData.set("supersedes_id", supersedesId);

      const res = await adminCreateStandardDraft(null, formData);
      if (res.ok) {
        notify("success", res.message);
        setCreateModalOpen(false);
      } else {
        notify("error", res.message);
      }
    });
  }

  function handleSubmitForReview(stdId: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("standard_id", stdId);
      formData.set("notes", "Submitted for agronomist peer review");

      const res = await adminSubmitStandardForReview(null, formData);
      if (res.ok) {
        setStandards((prev) =>
          prev.map((s) => (s.id === stdId ? { ...s, status: "in_review" } : s))
        );
        notify("success", res.message);
      } else {
        notify("error", res.message);
      }
    });
  }

  function openPublishModal(std: DbAgronomicStandard) {
    setStandardToPublish(std);
    setApproverTitle(currentUserName);
    setPartnerReference(std.external_partner_reference ?? "IITA/GAP/2026/01");
    setPublishNotes("");
    setPublishModalOpen(true);
  }

  function handlePublish(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!standardToPublish) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("standard_id", standardToPublish.id);
      formData.set("approver_title", approverTitle);
      formData.set("partner_reference", partnerReference);
      formData.set("notes", publishNotes);

      const res = await adminPublishStandard(null, formData);
      if (res.ok) {
        setStandards((prev) =>
          prev.map((s) =>
            s.id === standardToPublish.id
              ? {
                  ...s,
                  status: "published",
                  is_active: true,
                  approved_by_name: approverTitle,
                  external_partner_reference: partnerReference,
                  published_at: new Date().toISOString(),
                }
              : s.id === standardToPublish.supersedes_id
              ? { ...s, status: "superseded", is_active: false }
              : s
          )
        );
        notify("success", res.message);
        setPublishModalOpen(false);
      } else {
        notify("error", res.message);
      }
    });
  }

  function openProtocol(crop: { id: string; commonName: string; scientificName: string; category: string }) {
    setSelectedCropProtocol(crop);
    setProtocolModalOpen(true);
  }

  return (
    <div className="space-y-6">
      {notification && (
        <div
          role="status"
          className={`rounded-lg p-4 text-sm font-semibold flex items-center justify-between shadow-sm border ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-red-50 border-red-300 text-danger"
          }`}
        >
          <span>{notification.type === "success" ? "✓" : "⚠"} {notification.text}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="hover:opacity-75 font-bold text-lg"
          >
            &times;
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-leaf-900">Agronomy Standards &amp; Version Governance</h1>
          <p className="mt-1 text-muted">
            Agronomist-approved database standards, Good Agricultural Practice (GAP) guidelines, and four-eyes publishing governance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-leaf-100 text-leaf-800">Governance Engine: Option A &amp; B Ready</Badge>
          <Button variant="primary" size="sm" onClick={() => openCreateModal()} disabled={isPending}>
            + Create Standard Draft
          </Button>
        </div>
      </div>

      <div className="rounded-md border-l-4 border-l-harvest-500 bg-harvest-50 p-4 text-sm text-harvest-900">
        <p className="font-semibold">Agronomic Governance Notice: Controlled Database Lifecycle</p>
        <p className="mt-0.5 text-xs text-harvest-800">
          Published crop standards are immutable database records. Changes require authoring a draft version and peer review. Single-signer Super Admin override (Option B) is enabled for pilot deployment, with four-eyes agronomist verification (Option A) built in.
        </p>
      </div>

      {/* Database Standards Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-leaf-900">
            Agronomic Standards in Database ({standards.length})
          </h2>
          <span className="text-xs text-muted">
            {standards.filter((s) => s.status === "published").length} Published ·{" "}
            {standards.filter((s) => s.status === "draft").length} Drafts ·{" "}
            {standards.filter((s) => s.status === "in_review").length} In Review
          </span>
        </div>

        {standards.length === 0 ? (
          <Card className="p-8 text-center border border-dashed border-line">
            <p className="text-sm font-semibold text-muted">No standards registered in the database yet.</p>
            <Button variant="primary" size="sm" className="mt-3" onClick={() => openCreateModal()}>
              Create First Standard Draft
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {standards.map((std) => (
              <Card
                key={std.id}
                className="flex flex-col justify-between gap-4 border border-line hover:border-leaf-400 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-line pb-3">
                    <div>
                      <h3 className="text-lg font-bold text-leaf-900">{std.title}</h3>
                      <p className="text-xs font-semibold text-muted">
                        Code: <code className="text-xs font-mono">{std.standard_code}</code> • Crop:{" "}
                        <strong className="text-ink">{std.crop_or_livestock_id.toUpperCase()}</strong> • Zone:{" "}
                        <span className="capitalize">{std.agro_zone}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        className={
                          std.status === "published"
                            ? "bg-leaf-100 text-leaf-800"
                            : std.status === "in_review"
                            ? "bg-blue-100 text-blue-800"
                            : std.status === "superseded"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-amber-100 text-amber-800"
                        }
                      >
                        v{std.version} {std.status.toUpperCase()}
                      </Badge>
                      <span className="text-[11px] text-muted">
                        {std.published_at
                          ? `Published ${std.published_at.slice(0, 10)}`
                          : "Pending Approval"}
                      </span>
                    </div>
                  </div>

                  <div className="rounded bg-earth-50/60 p-3 text-xs space-y-1">
                    <p className="font-semibold text-ink">
                      Approved by: {std.approved_by_name ?? "Pending Certification"}
                    </p>
                    {std.external_partner_reference && (
                      <p className="text-muted">
                        Partner Reference: <strong className="text-ink">{std.external_partner_reference}</strong>
                      </p>
                    )}
                    <p className="text-muted">
                      Max Nitrogen Ceiling:{" "}
                      <strong className="text-ink">
                        {std.max_nitrogen_kg_ha != null ? `${std.max_nitrogen_kg_ha} kg N/ha` : "Uncapped"}
                      </strong>
                    </p>
                  </div>

                  {std.mandated_operations && std.mandated_operations.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted">
                        Mandated Farm Operations
                      </p>
                      <ul className="list-disc list-inside text-xs text-ink space-y-0.5">
                        {std.mandated_operations.map((op, idx) => (
                          <li key={idx}>{op}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {std.restricted_chemicals && std.restricted_chemicals.length > 0 && (
                    <div className="rounded bg-red-50 p-2.5 border border-red-200 text-xs text-danger space-y-1">
                      <p className="font-bold">Prohibited Active Chemical Ingredients:</p>
                      <p>{std.restricted_chemicals.join(", ")} (Strictly forbidden by NAFDAC / WHO Class 1)</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-line pt-3">
                  <span className="text-xs text-muted">
                    {std.is_active ? "● Live for farmers" : "○ Inactive / Governance locked"}
                  </span>
                  <div className="flex items-center gap-2">
                    {std.status === "draft" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleSubmitForReview(std.id)}
                      >
                        Submit for Review
                      </Button>
                    )}
                    {(std.status === "draft" || std.status === "in_review") && canPublish && (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isPending}
                        onClick={() => openPublishModal(std)}
                      >
                        Publish Standard
                      </Button>
                    )}
                    {std.status === "published" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isPending}
                        onClick={() => openCreateModal(std)}
                      >
                        Bump Version (New Draft)
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
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

      {/* Modal for Creating / Bumping Standard Draft */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl border border-line">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-xl font-bold text-leaf-900">
                {supersedesId ? `Create Next Version Draft (v${version})` : "Create New Agronomy Standard Draft"}
              </h2>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="rounded-lg p-1 text-muted hover:bg-surface-container hover:text-ink text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateDraft} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field id="std-code" label="Standard Code">
                  <Input
                    id="std-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. GAP_MAIZE_V1"
                    required
                  />
                </Field>

                <Field id="std-crop" label="Target Crop">
                  <Select id="std-crop" value={cropId} onChange={(e) => setCropId(e.target.value)}>
                    {crops.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.commonName}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field id="std-version" label="Version Tag">
                  <Input
                    id="std-version"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="1.0"
                    required
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="std-zone" label="Agro-Ecological Zone">
                  <Select id="std-zone" value={agroZone} onChange={(e) => setAgroZone(e.target.value)}>
                    <option value="rainforest">Rainforest</option>
                    <option value="derived_savanna">Derived Savanna</option>
                    <option value="all">All Zones</option>
                  </Select>
                </Field>

                <Field id="std-authority" label="Source Authority">
                  <Input
                    id="std-authority"
                    value={sourceAuthority}
                    onChange={(e) => setSourceAuthority(e.target.value)}
                    placeholder="IITA_NIHORT_GAP"
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

              <Field id="std-desc" label="Description / Summary">
                <TextArea
                  id="std-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed standard guidance and seasonal agronomy rules..."
                  rows={2}
                />
              </Field>

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
                <Button type="button" variant="ghost" onClick={() => setCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isPending}>
                  {isPending ? "Creating..." : "Create Draft Record"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Publishing Standard (Option A / Option B) */}
      {publishModalOpen && standardToPublish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-2xl border border-line">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-xl font-bold text-leaf-900">
                Publish Agronomic Standard (v{standardToPublish.version})
              </h2>
              <button
                type="button"
                onClick={() => setPublishModalOpen(false)}
                className="rounded-lg p-1 text-muted hover:bg-surface-container hover:text-ink text-xl"
              >
                &times;
              </button>
            </div>

            <div className="mt-3 rounded bg-leaf-50 p-3 text-xs text-leaf-900 border border-leaf-200">
              <p className="font-semibold">Option A &amp; Option B Governance Check</p>
              <p className="mt-0.5">
                Publishing certifies that this standard meets National / IITA Good Agricultural Practices. Once published, this version cannot be edited in place.
              </p>
            </div>

            <form onSubmit={handlePublish} className="mt-4 space-y-4">
              <Field id="pub-approver" label="Approving Agronomist / Title">
                <Input
                  id="pub-approver"
                  value={approverTitle}
                  onChange={(e) => setApproverTitle(e.target.value)}
                  placeholder="e.g. Dr. Adebayo Lead Agronomist or Super Admin"
                  required
                />
              </Field>

              <Field id="pub-partner" label="Regulatory / Partner Reference">
                <Input
                  id="pub-partner"
                  value={partnerReference}
                  onChange={(e) => setPartnerReference(e.target.value)}
                  placeholder="e.g. IITA/NIHORT/2026/01"
                />
              </Field>

              <Field id="pub-notes" label="Publishing & Audit Notes">
                <TextArea
                  id="pub-notes"
                  value={publishNotes}
                  onChange={(e) => setPublishNotes(e.target.value)}
                  placeholder="Review sign-off comments, verification notes..."
                  rows={2}
                />
              </Field>

              <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
                <Button type="button" variant="ghost" onClick={() => setPublishModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isPending}>
                  {isPending ? "Publishing..." : "Confirm & Publish Immutable Standard"}
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
