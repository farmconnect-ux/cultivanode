"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import {
  approveStandard,
  createStandard,
  exportKnowledgePackage,
  getStandardHistory,
  publishApprovedStandards,
  queueStandardTranslations,
  requestTranslation,
  returnStandard,
  reviewAgrochemical,
  reviewTranslation,
  saveAgrochemical,
  saveStandardDraft,
  submitAgrochemical,
  submitStandard,
  submitTranslation,
  withdrawAgrochemical,
  type WorkbenchResult,
} from "@/actions/knowledge-workbench";
import { EmptyState } from "@/components/ds/empty-state";
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, showScreenToast } from "@/components/ds/screen-dialog";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Alert, Field, Input, Select, TextArea } from "@/components/ui";
import {
  AGRO_ZONES,
  HAZARD_CLASSES,
  PRODUCT_CATEGORIES,
  RATE_UNITS,
  TRANSLATION_DOMAINS,
  TRANSLATION_LANGS,
  diffStandards,
  nextVersion,
  readParameters,
  standardTranslationSources,
  toNumberOrNull,
  totalNitrogen,
  type AgrochemicalInput,
  type AgrochemicalRow,
  type HistoryEntry,
  type NutrientApplication,
  type ProtectionNote,
  type Stage,
  type StandardRow,
  type StandardStatus,
  type TranslationRow,
} from "@/lib/admin/knowledge";
import { downloadFile } from "@/lib/download";

type Perms = { edit: boolean; review: boolean; translate: boolean };
type Tone = "positive" | "caution" | "critical" | "neutral" | "brand" | "mint" | "atmos";

const STATUS_LABEL: Record<StandardStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  approved: "Approved, not yet published",
  published: "Published",
  superseded: "Superseded",
  retired: "Retired",
};
const STATUS_TONE: Record<StandardStatus, Tone> = {
  draft: "neutral",
  in_review: "caution",
  approved: "atmos",
  published: "positive",
  superseded: "neutral",
  retired: "neutral",
};
const CHEM_LABEL: Record<AgrochemicalRow["status"], string> = {
  draft: "Draft",
  pending_review: "Waiting for review",
  approved: "Approved",
  withdrawn: "Withdrawn",
};
const CHEM_TONE: Record<AgrochemicalRow["status"], Tone> = {
  draft: "neutral",
  pending_review: "caution",
  approved: "positive",
  withdrawn: "critical",
};
const TR_LABEL: Record<TranslationRow["status"], string> = {
  pending: "To translate",
  submitted: "Waiting for review",
  approved: "Approved",
  rejected: "Returned",
};
const TR_TONE: Record<TranslationRow["status"], Tone> = {
  pending: "neutral",
  submitted: "caution",
  approved: "positive",
  rejected: "critical",
};
const LANG_LABEL: Record<string, string> = Object.fromEntries(TRANSLATION_LANGS.map((l) => [l.id, l.label]));

type ReasonTarget =
  | { kind: "standard"; id: string; label: string }
  | { kind: "chemical-return"; id: string; label: string }
  | { kind: "chemical-withdraw"; id: string; label: string }
  | { kind: "translation"; id: string; label: string };

export function KnowledgeWorkbench({
  standards,
  agrochemicals,
  translations,
  counts,
  crops,
  perms,
  userId,
}: {
  standards: StandardRow[];
  agrochemicals: AgrochemicalRow[];
  translations: TranslationRow[];
  counts: { documents: number; passages: number; catalogueCrops: number };
  crops: { id: string; name: string }[];
  perms: Perms;
  userId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(
    () => (standards.find((s) => s.status === "draft") ?? standards[0])?.id ?? null,
  );
  const [newOpen, setNewOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [compareFor, setCompareFor] = useState<StandardRow | null>(null);
  const [reasonFor, setReasonFor] = useState<ReasonTarget | null>(null);
  const [chemForm, setChemForm] = useState<AgrochemicalRow | "new" | null>(null);
  const [translateFor, setTranslateFor] = useState<TranslationRow | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);

  const selected = standards.find((s) => s.id === selectedId) ?? null;
  const approvedList = standards.filter((s) => s.status === "approved");
  const reviewQueue = standards.filter((s) => s.status === "in_review" || s.status === "approved");

  /** Runs a server action, shows the result, and calls `then` on success. */
  function run<T>(action: () => Promise<WorkbenchResult<T>>, then?: (r: WorkbenchResult<T>) => void) {
    setError(null);
    startTransition(async () => {
      const r = await action();
      if (r.ok) {
        if (r.message) showScreenToast(r.message);
        then?.(r);
      } else {
        setError(r.message);
      }
    });
  }

  const standardCounts = countBy(standards, (s) => s.status);
  const chemCounts = countBy(agrochemicals, (c) => c.status);
  const trCounts = countBy(translations, (t) => t.status);

  return (
    <section aria-labelledby="kw-h" className="flex flex-col gap-space-lg pb-space-xl">
      <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-end">
        <div className="min-w-0 max-w-2xl">
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Knowledge &amp; agronomy</p>
          <h2 id="kw-h" className="font-headline-lg text-headline-lg text-on-surface">Standards, products and translations</h2>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Draft and review crop standards, keep the staff agrochemical register, and manage translations. Every approval
            needs a second person, and every change is recorded in the audit log.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:shrink-0 md:justify-end">
          {perms.edit && (
            <Button variant="secondary" size="sm" onClick={() => setNewOpen(true)} disabled={pending}>
              <Icon name="add_circle" /> New standard draft
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() =>
              run(exportKnowledgePackage, (r) => {
                if (r.data) downloadFile(r.data.filename, r.data.json, "application/json");
              })
            }
          >
            <Icon name="file_download" /> Export package (JSON)
          </Button>
          {perms.review && (
            <Button size="sm" onClick={() => setPublishOpen(true)} disabled={pending || approvedList.length === 0}>
              <Icon name="publish" /> Publish approved ({approvedList.length})
            </Button>
          )}
        </div>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      <div className="grid gap-space-md sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon="potted_plant" label="Crop catalogue" value={counts.catalogueCrops} foot="Crops with stages in the app" />
        <StatCard
          icon="verified_user"
          label="Standards"
          value={standardCounts.published ?? 0}
          foot={`published · ${standardCounts.in_review ?? 0} in review · ${standardCounts.approved ?? 0} approved · ${standardCounts.draft ?? 0} drafts`}
        />
        <StatCard
          icon="science"
          label="Agrochemical register"
          value={chemCounts.approved ?? 0}
          foot={perms.edit ? `approved · ${chemCounts.pending_review ?? 0} waiting · ${chemCounts.draft ?? 0} drafts` : "Staff only"}
        />
        <StatCard
          icon="translate"
          label="Translations"
          value={trCounts.approved ?? 0}
          foot={`approved · ${trCounts.submitted ?? 0} to review · ${(trCounts.pending ?? 0) + (trCounts.rejected ?? 0)} to translate`}
        />
        <StatCard icon="psychology" label="AI source documents" value={counts.documents} foot={`${counts.passages} indexed passages`} />
      </div>

      {perms.edit && (
        <StandardWorkbench
          standards={standards}
          selected={selected}
          onSelect={setSelectedId}
          crops={crops}
          perms={perms}
          userId={userId}
          translations={translations}
          pending={pending}
          run={run}
          onCompare={setCompareFor}
          onReturn={(s) => setReasonFor({ kind: "standard", id: s.id, label: `${s.standard_code} v${s.version}` })}
        />
      )}

      {perms.edit && (
        <ReviewQueue
          items={reviewQueue}
          perms={perms}
          userId={userId}
          pending={pending}
          onOpen={(s) => setSelectedId(s.id)}
          onCompare={setCompareFor}
          onApprove={(s) => run(() => approveStandard(s.id, ""))}
          onReturn={(s) => setReasonFor({ kind: "standard", id: s.id, label: `${s.standard_code} v${s.version}` })}
        />
      )}

      {perms.edit && (
        <AgrochemicalRegister
          items={agrochemicals}
          perms={perms}
          userId={userId}
          pending={pending}
          onAdd={() => setChemForm("new")}
          onEdit={(c) => setChemForm(c)}
          onSubmit={(c) => run(() => submitAgrochemical(c.id))}
          onApprove={(c) => run(() => reviewAgrochemical(c.id, true, ""))}
          onReturn={(c) => setReasonFor({ kind: "chemical-return", id: c.id, label: c.trade_name })}
          onWithdraw={(c) => setReasonFor({ kind: "chemical-withdraw", id: c.id, label: c.trade_name })}
        />
      )}

      <TranslationQueue
        items={translations}
        perms={perms}
        userId={userId}
        pending={pending}
        onAdd={() => setRequestOpen(true)}
        onTranslate={setTranslateFor}
        onApprove={(t) => run(() => reviewTranslation(t.id, true, ""))}
        onReturn={(t) => setReasonFor({ kind: "translation", id: t.id, label: t.source_key })}
      />

      <NewStandardDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        crops={crops}
        pending={pending}
        onCreate={(input) =>
          run(() => createStandard(input), (r) => {
            setNewOpen(false);
            if (r.data?.id) setSelectedId(r.data.id);
          })
        }
      />

      <Dialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        title="Publish approved revisions"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPublishOpen(false)}>Cancel</Button>
            <Button disabled={pending} onClick={() => run(publishApprovedStandards, () => setPublishOpen(false))}>
              Publish {approvedList.length}
            </Button>
          </>
        }
      >
        <p className="text-body-md text-on-surface-variant">
          These standards become visible to every signed-in user and replace any earlier published version with the same
          code and zone. You cannot publish a standard you wrote yourself.
        </p>
        <ul className="mt-3 flex flex-col gap-1.5">
          {approvedList.map((s) => (
            <li key={s.id} className="rounded-lg border border-border px-3 py-2 text-body-sm">
              <strong>{s.standard_code} v{s.version}</strong> · {s.title}
              {s.author_id === userId && <span className="ml-2 text-critical">(you wrote this; another reviewer must publish it)</span>}
            </li>
          ))}
        </ul>
      </Dialog>

      {compareFor && (
        <CompareDialog
          target={compareFor}
          standards={standards}
          canRestore={perms.edit}
          pending={pending}
          onClose={() => setCompareFor(null)}
          onRestore={(older) => {
            const versions = standards.filter((s) => s.standard_code === older.standard_code).map((s) => s.version);
            const live = standards.find((s) => s.standard_code === older.standard_code && s.status === "published");
            run(
              () =>
                createStandard({
                  standard_code: older.standard_code,
                  crop_or_livestock_id: older.crop_or_livestock_id,
                  agro_zone: older.agro_zone,
                  version: nextVersion(versions),
                  title: older.title,
                  source_authority: older.source_authority,
                  max_nitrogen_kg_ha: toNumberOrNull(older.max_nitrogen_kg_ha),
                  supersedes_id: live?.id ?? null,
                  copy_from_id: older.id,
                }),
              (r) => {
                setCompareFor(null);
                if (r.data?.id) setSelectedId(r.data.id);
              },
            );
          }}
        />
      )}

      {reasonFor && (
        <ReasonDialog
          target={reasonFor}
          pending={pending}
          onClose={() => setReasonFor(null)}
          onSubmit={(reason) => {
            const t = reasonFor;
            const done = () => setReasonFor(null);
            if (t.kind === "standard") run(() => returnStandard(t.id, reason), done);
            else if (t.kind === "chemical-return") run(() => reviewAgrochemical(t.id, false, reason), done);
            else if (t.kind === "chemical-withdraw") run(() => withdrawAgrochemical(t.id, reason), done);
            else run(() => reviewTranslation(t.id, false, reason), done);
          }}
        />
      )}

      {chemForm && (
        <AgrochemicalDialog
          initial={chemForm === "new" ? null : chemForm}
          pending={pending}
          onClose={() => setChemForm(null)}
          onSave={(input) => run(() => saveAgrochemical(input), () => setChemForm(null))}
        />
      )}

      {translateFor && (
        <TranslateDialog
          item={translateFor}
          pending={pending}
          onClose={() => setTranslateFor(null)}
          onSubmit={(text) => run(() => submitTranslation(translateFor.id, text), () => setTranslateFor(null))}
        />
      )}

      <RequestTranslationDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
        pending={pending}
        onSubmit={(input) => run(() => requestTranslation(input), () => setRequestOpen(false))}
      />
    </section>
  );
}

// ---------------------------------------------------------------------------------------------- standard workbench

function StandardWorkbench({
  standards,
  selected,
  onSelect,
  crops,
  perms,
  userId,
  translations,
  pending,
  run,
  onCompare,
  onReturn,
}: {
  standards: StandardRow[];
  selected: StandardRow | null;
  onSelect: (id: string) => void;
  crops: { id: string; name: string }[];
  perms: Perms;
  userId: string;
  translations: TranslationRow[];
  pending: boolean;
  run: <T>(action: () => Promise<WorkbenchResult<T>>, then?: (r: WorkbenchResult<T>) => void) => void;
  onCompare: (s: StandardRow) => void;
  onReturn: (s: StandardRow) => void;
}) {
  if (standards.length === 0) {
    return (
      <Card>
        <EmptyState icon="verified_user" title="No standards yet" description="Create a standard draft to start." />
      </Card>
    );
  }
  return (
    <Card>
      <div className="flex flex-col gap-space-md border-b border-border p-space-lg">
        <Field id="kw-standard" label="Standard">
          <Select id="kw-standard" value={selected?.id ?? ""} onChange={(e) => onSelect(e.target.value)}>
            {(["draft", "in_review", "approved", "published", "superseded", "retired"] as StandardStatus[]).map((st) => {
              const group = standards.filter((s) => s.status === st);
              if (group.length === 0) return null;
              return (
                <optgroup key={st} label={STATUS_LABEL[st]}>
                  {group.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.standard_code} v{s.version} · {s.title}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </Select>
        </Field>
      </div>
      {selected && (
        <StandardEditor
          key={`${selected.id}:${selected.status}`}
          std={selected}
          standards={standards}
          crops={crops}
          perms={perms}
          userId={userId}
          translations={translations}
          pending={pending}
          run={run}
          onCompare={onCompare}
          onReturn={onReturn}
        />
      )}
    </Card>
  );
}

type Tab = "stages" | "nutrients" | "protection" | "translations" | "history";

function StandardEditor({
  std,
  standards,
  crops,
  perms,
  userId,
  translations,
  pending,
  run,
  onCompare,
  onReturn,
}: {
  std: StandardRow;
  standards: StandardRow[];
  crops: { id: string; name: string }[];
  perms: Perms;
  userId: string;
  translations: TranslationRow[];
  pending: boolean;
  run: <T>(action: () => Promise<WorkbenchResult<T>>, then?: (r: WorkbenchResult<T>) => void) => void;
  onCompare: (s: StandardRow) => void;
  onReturn: (s: StandardRow) => void;
}) {
  const params = useMemo(() => readParameters(std.parameters), [std.parameters]);
  const editable = std.status === "draft" && perms.edit;
  const [tab, setTab] = useState<Tab>("stages");
  const [title, setTitle] = useState(std.title);
  const [description, setDescription] = useState(std.description ?? "");
  const [zone, setZone] = useState(std.agro_zone);
  const [source, setSource] = useState(std.source_authority);
  const [maxN, setMaxN] = useState<string>(std.max_nitrogen_kg_ha === null ? "" : String(std.max_nitrogen_kg_ha));
  const [stages, setStages] = useState<Stage[]>(params.stages);
  const [plan, setPlan] = useState<NutrientApplication[]>(params.nutrient_plan);
  const [notes, setNotes] = useState<ProtectionNote[]>(params.protection_notes);
  const [ops, setOps] = useState((std.mandated_operations ?? []).join("\n"));
  const [chems, setChems] = useState((std.restricted_chemicals ?? []).join(", "));
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [lang, setLang] = useState("yo");

  const versions = standards.filter((s) => s.standard_code === std.standard_code);
  const hasOtherVersions = versions.length > 1;
  const cropName = crops.find((c) => c.id === std.crop_or_livestock_id)?.name ?? std.crop_or_livestock_id;
  const nTotal = totalNitrogen(plan);
  const maxNum = maxN.trim() === "" ? null : Number(maxN);
  const overN = maxNum !== null && Number.isFinite(maxNum) && nTotal > maxNum;
  const live = versions.find((s) => s.status === "published");

  const save = () =>
    run(() =>
      saveStandardDraft({
        id: std.id,
        title,
        description,
        agro_zone: zone,
        source_authority: source,
        max_nitrogen_kg_ha: maxNum !== null && Number.isFinite(maxNum) ? maxNum : null,
        stages: stages.map((s) => ({ ...s, start_day: Number(s.start_day), end_day: Number(s.end_day) })),
        nutrient_plan: plan.map((a) => ({ ...a, rate_kg_ha: Number(a.rate_kg_ha), n_kg_ha: Number(a.n_kg_ha) })),
        protection_notes: notes,
        mandated_operations: ops.split("\n").map((s) => s.trim()).filter(Boolean),
        restricted_chemicals: chems.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    );

  const openHistory = () => {
    setTab("history");
    if (history === null) run(() => getStandardHistory(std.standard_code), (r) => setHistory(r.data ?? []));
  };

  const keyPrefix = `standard:${std.standard_code.toLowerCase()}:${std.version.replace(/[^0-9.]/g, "")}:`;
  const stdTranslations = translations.filter((t) => t.source_key.startsWith(keyPrefix));
  const translatable = standardTranslationSources(std).length;

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-space-md p-space-lg lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={STATUS_TONE[std.status]} dot>{STATUS_LABEL[std.status]}</Badge>
            <span className="font-mono text-label-sm text-on-surface-variant">{std.standard_code} v{std.version}</span>
          </div>
          <h3 className="mt-1 font-headline-md text-headline-md text-on-surface">{std.title}</h3>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            {cropName} · {AGRO_ZONES.find((z) => z.id === std.agro_zone)?.label ?? std.agro_zone} · Source label:{" "}
            {std.source_authority}
            {std.approved_by_name && std.status === "published" ? ` · Approved by ${std.approved_by_name}` : ""}
            {std.effective_from ? ` · Effective from ${std.effective_from}` : ""}
            {std.author_id === userId ? " · You wrote this" : ""}
          </p>
          {std.change_notes && std.status === "draft" && std.change_notes.startsWith("Returned for revision") && (
            <p className="mt-2 rounded-lg bg-caution-soft px-3 py-2 text-body-sm text-[#b45309]">{std.change_notes}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {hasOtherVersions && (
            <Button variant="secondary" size="sm" onClick={() => onCompare(std)}>
              <Icon name="history" /> Compare versions
            </Button>
          )}
          {editable && (
            <>
              <Button variant="secondary" size="sm" disabled={pending || overN} onClick={save}>
                <Icon name="save" /> Save draft
              </Button>
              <Button size="sm" disabled={pending} onClick={() => run(() => submitStandard(std.id, ""))}>
                <Icon name="send" /> Send for review
              </Button>
            </>
          )}
          {perms.review && (std.status === "in_review" || std.status === "approved") && (
            <>
              {std.status === "in_review" && (
                <Button
                  size="sm"
                  disabled={pending || std.author_id === userId}
                  title={std.author_id === userId ? "You wrote this standard; a different reviewer must approve it." : undefined}
                  onClick={() => run(() => approveStandard(std.id, ""))}
                >
                  <Icon name="task_alt" /> Approve
                </Button>
              )}
              <Button variant="secondary" size="sm" disabled={pending} onClick={() => onReturn(std)}>
                <Icon name="replay" /> Return for revision
              </Button>
            </>
          )}
          {perms.edit && std.status === "published" && (
            <Button
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() =>
                run(() =>
                  createStandard({
                    standard_code: std.standard_code,
                    crop_or_livestock_id: std.crop_or_livestock_id,
                    agro_zone: std.agro_zone,
                    version: nextVersion(versions.map((v) => v.version)),
                    title: std.title,
                    source_authority: std.source_authority,
                    max_nitrogen_kg_ha: toNumberOrNull(std.max_nitrogen_kg_ha),
                    supersedes_id: std.id,
                    copy_from_id: std.id,
                  }),
                )
              }
            >
              <Icon name="content_copy" /> New version
            </Button>
          )}
        </div>
      </div>

      {editable && (
        <div className="grid gap-4 border-t border-border p-space-lg md:grid-cols-2">
          <Field id="kw-title" label="Title">
            <Input id="kw-title" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field id="kw-source" label="Source label" hint="Which published guidance this draft is based on.">
            <Input id="kw-source" value={source} maxLength={200} onChange={(e) => setSource(e.target.value)} />
          </Field>
          <Field id="kw-zone" label="Agro-ecological zone">
            <Select id="kw-zone" value={zone} onChange={(e) => setZone(e.target.value)}>
              {AGRO_ZONES.map((z) => (
                <option key={z.id} value={z.id}>{z.label}</option>
              ))}
              {!AGRO_ZONES.some((z) => z.id === zone) && <option value={zone}>{zone}</option>}
            </Select>
          </Field>
          <Field id="kw-desc" label="Description" optional="optional">
            <TextArea id="kw-desc" rows={2} value={description} maxLength={2000} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto border-y border-border bg-surface-container-low px-space-lg" role="tablist">
        {(
          [
            ["stages", "Stages", "timeline"],
            ["nutrients", "Nutrients", "water_drop"],
            ["protection", "Protection & operations", "pest_control"],
            ["translations", "Translations", "translate"],
            ["history", "History", "manage_history"],
          ] as const
        ).map(([id, label, icon]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => (id === "history" ? openHistory() : setTab(id))}
            className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-3 font-label-md text-label-md ${
              tab === id ? "border-b-2 border-primary font-bold text-primary" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Icon name={icon} className="text-[18px]" /> {label}
          </button>
        ))}
      </div>

      <div className="p-space-lg">
        {tab === "stages" && (
          <RowsEditor
            editable={editable}
            rows={stages}
            onChange={setStages}
            empty="No stages yet."
            blank={{ name: "", start_day: 0, end_day: 0, description: "" }}
            addLabel="Add stage"
            render={(s, set, i) => (
              <div className="grid gap-3 md:grid-cols-[1fr_110px_110px]">
                <Field id={`st-name-${i}`} label={`Stage ${i + 1}`}>
                  <Input id={`st-name-${i}`} value={s.name} maxLength={120} disabled={!editable} onChange={(e) => set({ ...s, name: e.target.value })} />
                </Field>
                <Field id={`st-start-${i}`} label="Start day">
                  <Input id={`st-start-${i}`} type="number" value={s.start_day} disabled={!editable} onChange={(e) => set({ ...s, start_day: Number(e.target.value) })} />
                </Field>
                <Field id={`st-end-${i}`} label="End day">
                  <Input id={`st-end-${i}`} type="number" value={s.end_day} disabled={!editable} onChange={(e) => set({ ...s, end_day: Number(e.target.value) })} />
                </Field>
                <div className="md:col-span-3">
                  <Field id={`st-desc-${i}`} label="What to do" optional="optional">
                    <TextArea id={`st-desc-${i}`} rows={2} value={s.description ?? ""} maxLength={2000} disabled={!editable} onChange={(e) => set({ ...s, description: e.target.value })} />
                  </Field>
                </div>
              </div>
            )}
            hint="Days are counted from planting (negative days are before planting)."
          />
        )}

        {tab === "nutrients" && (
          <div className="flex flex-col gap-space-md">
            <div className="flex flex-wrap items-end gap-space-md">
              <Field id="kw-maxn" label="Maximum nitrogen (kg N/ha)" optional="leave empty if not set">
                <Input id="kw-maxn" type="number" min={0} max={500} value={maxN} disabled={!editable} onChange={(e) => setMaxN(e.target.value)} />
              </Field>
              <p className={`pb-3 text-body-md ${overN ? "font-semibold text-critical" : "text-on-surface-variant"}`}>
                Plan total: {nTotal} kg N/ha
                {overN ? " — above the maximum; the draft cannot be saved." : maxNum !== null ? " — within the maximum." : ""}
              </p>
            </div>
            <RowsEditor
              editable={editable}
              rows={plan}
              onChange={setPlan}
              empty="No nutrient applications yet."
              blank={{ timing: "", product: "", rate_kg_ha: 0, n_kg_ha: 0, notes: "" }}
              addLabel="Add application"
              render={(a, set, i) => (
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_120px_120px]">
                  <Field id={`np-t-${i}`} label="When">
                    <Input id={`np-t-${i}`} value={a.timing} maxLength={80} disabled={!editable} onChange={(e) => set({ ...a, timing: e.target.value })} />
                  </Field>
                  <Field id={`np-p-${i}`} label="Product">
                    <Input id={`np-p-${i}`} value={a.product} maxLength={120} disabled={!editable} onChange={(e) => set({ ...a, product: e.target.value })} />
                  </Field>
                  <Field id={`np-r-${i}`} label="Rate (kg/ha)">
                    <Input id={`np-r-${i}`} type="number" min={0} value={a.rate_kg_ha} disabled={!editable} onChange={(e) => set({ ...a, rate_kg_ha: Number(e.target.value) })} />
                  </Field>
                  <Field id={`np-n-${i}`} label="N supplied (kg/ha)">
                    <Input id={`np-n-${i}`} type="number" min={0} value={a.n_kg_ha} disabled={!editable} onChange={(e) => set({ ...a, n_kg_ha: Number(e.target.value) })} />
                  </Field>
                  <div className="md:col-span-4">
                    <Field id={`np-notes-${i}`} label="Notes" optional="optional">
                      <Input id={`np-notes-${i}`} value={a.notes ?? ""} maxLength={500} disabled={!editable} onChange={(e) => set({ ...a, notes: e.target.value })} />
                    </Field>
                  </div>
                </div>
              )}
              hint="Reference values for staff review. They are not used by the fertiliser calculator."
            />
          </div>
        )}

        {tab === "protection" && (
          <div className="flex flex-col gap-space-md">
            <div className="grid gap-4 md:grid-cols-2">
              <Field id="kw-ops" label="Mandated operations" hint="One per line.">
                <TextArea id="kw-ops" rows={4} value={ops} disabled={!editable} onChange={(e) => setOps(e.target.value)} />
              </Field>
              <Field id="kw-chems" label="Restricted chemicals" hint="Comma-separated active ingredients.">
                <TextArea id="kw-chems" rows={4} value={chems} disabled={!editable} onChange={(e) => setChems(e.target.value)} />
              </Field>
            </div>
            <RowsEditor
              editable={editable}
              rows={notes}
              onChange={setNotes}
              empty="No crop protection notes yet."
              blank={{ title: "", text: "" }}
              addLabel="Add note"
              render={(n, set, i) => (
                <div className="grid gap-3">
                  <Field id={`pn-t-${i}`} label="Pest, disease or topic">
                    <Input id={`pn-t-${i}`} value={n.title} maxLength={120} disabled={!editable} onChange={(e) => set({ ...n, title: e.target.value })} />
                  </Field>
                  <Field id={`pn-x-${i}`} label="Guidance">
                    <TextArea id={`pn-x-${i}`} rows={2} value={n.text} maxLength={2000} disabled={!editable} onChange={(e) => set({ ...n, text: e.target.value })} />
                  </Field>
                </div>
              )}
            />
          </div>
        )}

        {tab === "translations" && (
          <div className="flex flex-col gap-space-md">
            {perms.translate ? (
              <div className="flex flex-wrap items-end gap-2">
                <Field id="kw-lang" label="Language">
                  <Select id="kw-lang" value={lang} onChange={(e) => setLang(e.target.value)}>
                    {TRANSLATION_LANGS.map((l) => (
                      <option key={l.id} value={l.id}>{l.label}</option>
                    ))}
                  </Select>
                </Field>
                <Button
                  size="sm"
                  className="mb-1"
                  disabled={pending || translatable === 0}
                  onClick={() => run(() => queueStandardTranslations(std.id, lang))}
                >
                  <Icon name="post_add" /> Queue {translatable} text{translatable === 1 ? "" : "s"} for translation
                </Button>
              </div>
            ) : (
              <p className="text-body-sm text-on-surface-variant">You need the knowledge.manage permission to queue translations.</p>
            )}
            <p className="text-body-sm text-on-surface-variant">Stage names, stage guidance and protection notes are translated. Save the draft first.</p>
            {stdTranslations.length === 0 ? (
              <EmptyState icon="translate" title="No translations for this version" description="Queued texts appear here and in the translation queue below." />
            ) : (
              <ul className="flex flex-col gap-2">
                {stdTranslations.map((t) => (
                  <li key={t.id} className="rounded-lg border border-border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={TR_TONE[t.status]} dot>{TR_LABEL[t.status]}</Badge>
                      <span className="text-label-sm text-on-surface-variant">{LANG_LABEL[t.target_lang]}</span>
                    </div>
                    <p className="mt-1 text-body-sm text-on-surface-variant">{t.source_text}</p>
                    {t.translated_text && <p className="mt-1 text-body-md" lang={t.target_lang}>{t.translated_text}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "history" && (
          <div>
            {history === null ? (
              <p className="text-body-md text-on-surface-variant">Loading history…</p>
            ) : history.length === 0 ? (
              <EmptyState icon="manage_history" title="No recorded changes" description="Changes made through this workbench are recorded here." />
            ) : (
              <ol className="flex flex-col gap-2">
                {history.map((h, i) => (
                  <li key={`${h.happened_at}-${i}`} className="flex flex-col gap-0.5 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-body-md">
                      <strong>{describeAction(h.action)}</strong> · v{h.version} · {h.actor_name}
                      {typeof h.details?.reason === "string" ? ` — ${h.details.reason}` : ""}
                    </span>
                    <time className="tnum text-label-sm text-on-surface-variant" dateTime={h.happened_at}>
                      {new Date(h.happened_at).toLocaleString("en-GB", { timeZone: "Africa/Lagos" })} WAT
                    </time>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
      {live && live.id !== std.id && (
        <p className="border-t border-border px-space-lg py-3 text-body-sm text-on-surface-variant">
          The live version of this standard is v{live.version}.
        </p>
      )}
    </div>
  );
}

function describeAction(a: string): string {
  const map: Record<string, string> = {
    agronomy_standard_draft_created: "Draft created",
    agronomy_standard_draft_updated: "Draft edited",
    agronomy_standard_submitted_review: "Sent for review",
    agronomy_standard_approved: "Approved",
    agronomy_standard_returned: "Returned for revision",
    agronomy_standard_published: "Published",
  };
  return map[a] ?? a.replaceAll("_", " ");
}

function RowsEditor<T>({
  editable,
  rows,
  onChange,
  render,
  blank,
  empty,
  addLabel,
  hint,
}: {
  editable: boolean;
  rows: T[];
  onChange: (rows: T[]) => void;
  render: (row: T, set: (next: T) => void, index: number) => ReactNode;
  blank: T;
  empty: string;
  addLabel: string;
  hint?: string;
}) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= rows.length) return;
    const next = [...rows];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item as T);
    onChange(next);
  };
  return (
    <div className="flex flex-col gap-space-sm">
      {hint && <p className="text-body-sm text-on-surface-variant">{hint}</p>}
      {rows.length === 0 && <p className="text-body-md text-on-surface-variant">{empty}</p>}
      {rows.map((row, i) => (
        <div key={i} className="rounded-lg border border-border p-3">
          {render(row, (next) => onChange(rows.map((r, j) => (j === i ? next : r))), i)}
          {editable && (
            <div className="mt-2 flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up">
                <Icon name="arrow_upward" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => move(i, i + 1)} disabled={i === rows.length - 1} aria-label="Move down">
                <Icon name="arrow_downward" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onChange(rows.filter((_, j) => j !== i))}>
                <Icon name="delete" /> Remove
              </Button>
            </div>
          )}
        </div>
      ))}
      {editable && (
        <div>
          <Button variant="secondary" size="sm" onClick={() => onChange([...rows, { ...blank }])}>
            <Icon name="add" /> {addLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------- review queue

function ReviewQueue({
  items,
  perms,
  userId,
  pending,
  onOpen,
  onCompare,
  onApprove,
  onReturn,
}: {
  items: StandardRow[];
  perms: Perms;
  userId: string;
  pending: boolean;
  onOpen: (s: StandardRow) => void;
  onCompare: (s: StandardRow) => void;
  onApprove: (s: StandardRow) => void;
  onReturn: (s: StandardRow) => void;
}) {
  return (
    <Card>
      <CardHeader icon="rule" title="Standard review queue" note={`${items.filter((s) => s.status === "in_review").length} waiting for review`} />
      {items.length === 0 ? (
        <div className="p-space-lg">
          <EmptyState icon="task_alt" title="Nothing to review" description="Standards sent for review appear here." />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((s) => (
            <li key={s.id} className="flex flex-col gap-2 p-space-md md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={STATUS_TONE[s.status]} dot>{STATUS_LABEL[s.status]}</Badge>
                  <span className="font-mono text-label-sm text-on-surface-variant">{s.standard_code} v{s.version}</span>
                </div>
                <p className="mt-1 font-label-md text-label-md text-on-surface">{s.title}</p>
                {s.author_id === userId && <p className="text-body-sm text-on-surface-variant">You wrote this; a different reviewer must approve it.</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" size="sm" onClick={() => onOpen(s)}>Open</Button>
                <Button variant="secondary" size="sm" onClick={() => onCompare(s)}>Compare</Button>
                {perms.review && s.status === "in_review" && (
                  <Button size="sm" disabled={pending || s.author_id === userId} onClick={() => onApprove(s)}>Approve</Button>
                )}
                {perms.review && (
                  <Button variant="destructive" size="sm" disabled={pending} onClick={() => onReturn(s)}>Return</Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------------------------- agrochemicals

function AgrochemicalRegister({
  items,
  perms,
  userId,
  pending,
  onAdd,
  onEdit,
  onSubmit,
  onApprove,
  onReturn,
  onWithdraw,
}: {
  items: AgrochemicalRow[];
  perms: Perms;
  userId: string;
  pending: boolean;
  onAdd: () => void;
  onEdit: (c: AgrochemicalRow) => void;
  onSubmit: (c: AgrochemicalRow) => void;
  onApprove: (c: AgrochemicalRow) => void;
  onReturn: (c: AgrochemicalRow) => void;
  onWithdraw: (c: AgrochemicalRow) => void;
}) {
  const [filter, setFilter] = useState<"all" | AgrochemicalRow["status"]>("all");
  const shown = filter === "all" ? items : items.filter((c) => c.status === filter);
  return (
    <Card>
      <CardHeader
        icon="science"
        title="Agrochemical register"
        note="Staff-only reference list. Not shown to farmers or used by the AI assistant."
        action={
          <div className="flex flex-wrap gap-2">
            <Select className="w-auto" aria-label="Filter products" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
              <option value="all">All</option>
              {(Object.keys(CHEM_LABEL) as AgrochemicalRow["status"][]).map((k) => (
                <option key={k} value={k}>{CHEM_LABEL[k]}</option>
              ))}
            </Select>
            <Button size="sm" onClick={onAdd} disabled={pending}>
              <Icon name="add" /> Add product
            </Button>
          </div>
        }
      />
      {shown.length === 0 ? (
        <div className="p-space-lg">
          <EmptyState icon="science" title="No products" description="Add products from their label or the NAFDAC register." />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-body-sm">
            <thead className="bg-surface-container-low text-label-sm uppercase text-on-surface-variant">
              <tr>
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2">NAFDAC no.</th>
                <th className="px-4 py-2">Active ingredients</th>
                <th className="px-4 py-2">Label rate</th>
                <th className="px-4 py-2">REI / PHI</th>
                <th className="px-4 py-2">WHO class</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shown.map((c) => (
                <tr key={c.id} className="align-top">
                  <td className="px-4 py-3">
                    <span className="font-semibold text-on-surface">{c.trade_name}</span>
                    <span className="block text-on-surface-variant">
                      {c.product_category}
                      {c.formulation ? ` · ${c.formulation}` : ""}
                      {c.manufacturer ? ` · ${c.manufacturer}` : ""}
                    </span>
                    <span className="block text-[11px] text-outline">Source: {c.label_source}</span>
                  </td>
                  <td className="px-4 py-3 font-mono">{c.nafdac_reg_no ?? "—"}</td>
                  <td className="px-4 py-3">{c.active_ingredients}</td>
                  <td className="px-4 py-3">{c.label_rate_value !== null ? `${c.label_rate_value} ${c.label_rate_unit}` : "—"}</td>
                  <td className="px-4 py-3">
                    {c.rei_hours !== null ? `${c.rei_hours} h` : "—"} / {c.phi_days !== null ? `${c.phi_days} d` : "—"}
                  </td>
                  <td className="px-4 py-3">{c.who_hazard_class ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={CHEM_TONE[c.status]} dot>{CHEM_LABEL[c.status]}</Badge>
                    {c.review_notes && c.status === "draft" && <span className="mt-1 block text-[#b45309]">Returned: {c.review_notes}</span>}
                    {c.withdrawn_reason && <span className="mt-1 block text-on-surface-variant">{c.withdrawn_reason}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {c.status === "draft" && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => onEdit(c)}>Edit</Button>
                          <Button variant="secondary" size="sm" disabled={pending} onClick={() => onSubmit(c)}>Send for review</Button>
                        </>
                      )}
                      {c.status === "pending_review" && perms.review && (
                        <>
                          <Button
                            size="sm"
                            disabled={pending || c.created_by === userId}
                            title={c.created_by === userId ? "You added this product; a different reviewer must check it." : undefined}
                            onClick={() => onApprove(c)}
                          >
                            Approve
                          </Button>
                          <Button variant="destructive" size="sm" disabled={pending || c.created_by === userId} onClick={() => onReturn(c)}>
                            Return
                          </Button>
                        </>
                      )}
                      {c.status === "approved" && perms.review && (
                        <Button variant="destructive" size="sm" disabled={pending} onClick={() => onWithdraw(c)}>Withdraw</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function AgrochemicalDialog({
  initial,
  pending,
  onClose,
  onSave,
}: {
  initial: AgrochemicalRow | null;
  pending: boolean;
  onClose: () => void;
  onSave: (input: AgrochemicalInput) => void;
}) {
  const [f, setF] = useState({
    trade_name: initial?.trade_name ?? "",
    product_category: (initial?.product_category ?? "insecticide") as (typeof PRODUCT_CATEGORIES)[number],
    formulation: initial?.formulation ?? "",
    active_ingredients: initial?.active_ingredients ?? "",
    manufacturer: initial?.manufacturer ?? "",
    nafdac_reg_no: initial?.nafdac_reg_no ?? "",
    label_rate_value: initial?.label_rate_value === null || initial?.label_rate_value === undefined ? "" : String(initial.label_rate_value),
    label_rate_unit: initial?.label_rate_unit ?? "",
    rei_hours: initial?.rei_hours === null || initial?.rei_hours === undefined ? "" : String(initial.rei_hours),
    phi_days: initial?.phi_days === null || initial?.phi_days === undefined ? "" : String(initial.phi_days),
    who_hazard_class: initial?.who_hazard_class ?? "",
    target_crops: (initial?.target_crops ?? []).join(", "),
    target_pests: (initial?.target_pests ?? []).join(", "),
    label_source: initial?.label_source ?? "",
  });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const num = (v: string) => (v.trim() === "" ? null : Number(v));
  const list = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={initial ? "Edit product draft" : "Add product"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            disabled={pending}
            onClick={() =>
              onSave({
                id: initial?.id ?? null,
                trade_name: f.trade_name,
                product_category: f.product_category,
                formulation: f.formulation,
                active_ingredients: f.active_ingredients,
                manufacturer: f.manufacturer,
                nafdac_reg_no: f.nafdac_reg_no,
                label_rate_value: num(f.label_rate_value),
                label_rate_unit: f.label_rate_unit === "" ? null : (f.label_rate_unit as (typeof RATE_UNITS)[number]),
                rei_hours: num(f.rei_hours),
                phi_days: num(f.phi_days),
                who_hazard_class: f.who_hazard_class === "" ? null : (f.who_hazard_class as (typeof HAZARD_CLASSES)[number]),
                target_crops: list(f.target_crops),
                target_pests: list(f.target_pests),
                label_source: f.label_source,
              })
            }
          >
            Save draft
          </Button>
        </>
      }
    >
      <p className="mb-3 text-body-sm text-on-surface-variant">
        Copy details from the product label or the NAFDAC register. A different reviewer must approve the product before it
        counts as approved. Banned active ingredients cannot be added.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <Field id="ch-name" label="Trade name"><Input id="ch-name" value={f.trade_name} maxLength={120} onChange={set("trade_name")} /></Field>
        <Field id="ch-cat" label="Category">
          <Select id="ch-cat" value={f.product_category} onChange={set("product_category")}>
            {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <Field id="ch-ai" label="Active ingredients and strength"><Input id="ch-ai" value={f.active_ingredients} maxLength={300} onChange={set("active_ingredients")} /></Field>
        <Field id="ch-form" label="Formulation" optional="e.g. SC, EC, WDG"><Input id="ch-form" value={f.formulation} maxLength={40} onChange={set("formulation")} /></Field>
        <Field id="ch-maker" label="Manufacturer or distributor" optional="optional"><Input id="ch-maker" value={f.manufacturer} maxLength={160} onChange={set("manufacturer")} /></Field>
        <Field id="ch-nafdac" label="NAFDAC registration number" optional="as printed on the label"><Input id="ch-nafdac" value={f.nafdac_reg_no} maxLength={40} onChange={set("nafdac_reg_no")} /></Field>
        <Field id="ch-rate" label="Label rate" optional="optional"><Input id="ch-rate" type="number" min={0} value={f.label_rate_value} onChange={set("label_rate_value")} /></Field>
        <Field id="ch-unit" label="Rate unit">
          <Select id="ch-unit" value={f.label_rate_unit} onChange={set("label_rate_unit")}>
            <option value="">—</option>
            {RATE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </Select>
        </Field>
        <Field id="ch-rei" label="Re-entry interval (hours)" optional="optional"><Input id="ch-rei" type="number" min={0} max={720} value={f.rei_hours} onChange={set("rei_hours")} /></Field>
        <Field id="ch-phi" label="Pre-harvest interval (days)" optional="optional"><Input id="ch-phi" type="number" min={0} max={365} value={f.phi_days} onChange={set("phi_days")} /></Field>
        <Field id="ch-who" label="WHO hazard class">
          <Select id="ch-who" value={f.who_hazard_class} onChange={set("who_hazard_class")}>
            <option value="">—</option>
            {HAZARD_CLASSES.map((h) => <option key={h} value={h}>{h === "not_classified" ? "Not classified" : h}</option>)}
          </Select>
        </Field>
        <Field id="ch-crops" label="Crops on the label" optional="comma-separated"><Input id="ch-crops" value={f.target_crops} onChange={set("target_crops")} /></Field>
        <Field id="ch-pests" label="Pests on the label" optional="comma-separated"><Input id="ch-pests" value={f.target_pests} onChange={set("target_pests")} /></Field>
        <Field id="ch-src" label="Where the details come from" hint="e.g. product label photographed 2026-11-24, or a NAFDAC register link.">
          <Input id="ch-src" value={f.label_source} maxLength={500} onChange={set("label_source")} />
        </Field>
      </div>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------------------------- translations

function TranslationQueue({
  items,
  perms,
  userId,
  pending,
  onAdd,
  onTranslate,
  onApprove,
  onReturn,
}: {
  items: TranslationRow[];
  perms: Perms;
  userId: string;
  pending: boolean;
  onAdd: () => void;
  onTranslate: (t: TranslationRow) => void;
  onApprove: (t: TranslationRow) => void;
  onReturn: (t: TranslationRow) => void;
}) {
  const [lang, setLang] = useState("all");
  const [status, setStatus] = useState("open");
  const shown = items.filter(
    (t) => (lang === "all" || t.target_lang === lang) && (status === "all" || (status === "open" ? t.status !== "approved" : t.status === status)),
  );
  return (
    <Card>
      <CardHeader
        icon="translate"
        title="Translation queue"
        note="A different person must review every translation before it is approved."
        action={
          <div className="flex flex-wrap gap-2">
            <Select className="w-auto" aria-label="Language" value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="all">All languages</option>
              {TRANSLATION_LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </Select>
            <Select className="w-auto" aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="open">Open</option>
              <option value="all">All</option>
              {(Object.keys(TR_LABEL) as TranslationRow["status"][]).map((k) => <option key={k} value={k}>{TR_LABEL[k]}</option>)}
            </Select>
            {perms.translate && (
              <Button size="sm" onClick={onAdd} disabled={pending}>
                <Icon name="add" /> Add text
              </Button>
            )}
          </div>
        }
      />
      {shown.length === 0 ? (
        <div className="p-space-lg">
          <EmptyState icon="translate" title="Nothing here" description="Queue texts from a standard or add your own." />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {shown.map((t) => (
            <li key={t.id} className="flex flex-col gap-2 p-space-md md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={TR_TONE[t.status]} dot>{TR_LABEL[t.status]}</Badge>
                  <span className="text-label-sm text-on-surface-variant">{LANG_LABEL[t.target_lang]} · {t.domain}</span>
                  <span className="truncate font-mono text-[11px] text-outline">{t.source_key}</span>
                </div>
                <p className="mt-1 text-body-md text-on-surface">{t.source_text}</p>
                {t.translated_text && <p className="mt-1 text-body-md text-secondary" lang={t.target_lang}>{t.translated_text}</p>}
                {t.review_notes && t.status === "rejected" && <p className="mt-1 text-body-sm text-[#b45309]">Reviewer: {t.review_notes}</p>}
              </div>
              {perms.translate && (
                <div className="flex shrink-0 flex-wrap gap-2">
                  {t.status !== "approved" && (
                    <Button variant="secondary" size="sm" disabled={pending} onClick={() => onTranslate(t)}>
                      {t.translated_text ? "Edit translation" : "Translate"}
                    </Button>
                  )}
                  {t.status === "submitted" && (
                    <>
                      <Button
                        size="sm"
                        disabled={pending || t.translated_by === userId}
                        title={t.translated_by === userId ? "You wrote this translation; a different reviewer must check it." : undefined}
                        onClick={() => onApprove(t)}
                      >
                        Approve
                      </Button>
                      <Button variant="destructive" size="sm" disabled={pending || t.translated_by === userId} onClick={() => onReturn(t)}>
                        Return
                      </Button>
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function TranslateDialog({ item, pending, onClose, onSubmit }: { item: TranslationRow; pending: boolean; onClose: () => void; onSubmit: (text: string) => void }) {
  const [text, setText] = useState(item.translated_text ?? "");
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={`Translate into ${LANG_LABEL[item.target_lang]}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button disabled={pending || text.trim() === ""} onClick={() => onSubmit(text)}>Send for review</Button>
        </>
      }
    >
      <p className="rounded-lg bg-surface-container-low p-3 text-body-md">{item.source_text}</p>
      <div className="mt-3">
        <Field id="tr-text" label="Translation" hint="Keep numbers, units and product names exactly as in the English.">
          <TextArea id="tr-text" rows={4} lang={item.target_lang} value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} />
        </Field>
      </div>
    </Dialog>
  );
}

function RequestTranslationDialog({
  open,
  onOpenChange,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  pending: boolean;
  onSubmit: (input: { source_key: string; source_text: string; domain: string; target_lang: string }) => void;
}) {
  const [text, setText] = useState("");
  const [key, setKey] = useState("");
  const [domain, setDomain] = useState("general");
  const [lang, setLang] = useState("yo");
  const suggested = `${domain}:${text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "text"}`;
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add text to translate"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={pending || text.trim() === ""} onClick={() => onSubmit({ source_key: key.trim() || suggested, source_text: text, domain, target_lang: lang })}>
            Add to queue
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <Field id="rq-text" label="English text"><TextArea id="rq-text" rows={3} value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} /></Field>
        <div className="grid gap-3 md:grid-cols-2">
          <Field id="rq-domain" label="Topic">
            <Select id="rq-domain" value={domain} onChange={(e) => setDomain(e.target.value)}>
              {TRANSLATION_DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
          </Field>
          <Field id="rq-lang" label="Language">
            <Select id="rq-lang" value={lang} onChange={(e) => setLang(e.target.value)}>
              {TRANSLATION_LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </Select>
          </Field>
        </div>
        <Field id="rq-key" label="Key" optional={`leave empty to use ${suggested}`} hint="The same key and language replaces the earlier text.">
          <Input id="rq-key" value={key} maxLength={200} onChange={(e) => setKey(e.target.value)} />
        </Field>
      </div>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------------------------- dialogs

function NewStandardDialog({
  open,
  onOpenChange,
  crops,
  pending,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  crops: { id: string; name: string }[];
  pending: boolean;
  onCreate: (input: Parameters<typeof createStandard>[0]) => void;
}) {
  const [crop, setCrop] = useState(crops[0]?.id ?? "");
  const [otherCrop, setOtherCrop] = useState("");
  const [zone, setZone] = useState("derived_savanna");
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [maxN, setMaxN] = useState("");
  const cropId = crop === "__other" ? otherCrop.trim().toLowerCase() : crop;
  const code = `GAP_${cropId.toUpperCase()}_${zone === "all" ? "ALL" : zone === "rainforest" ? "RF" : "DS"}`;
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="New standard draft"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={pending || !cropId || title.trim().length < 3 || source.trim().length < 2}
            onClick={() =>
              onCreate({
                standard_code: code,
                crop_or_livestock_id: cropId,
                agro_zone: zone,
                version: "1.0",
                title,
                source_authority: source,
                max_nitrogen_kg_ha: maxN.trim() === "" ? null : Number(maxN),
                supersedes_id: null,
                copy_from_id: null,
              })
            }
          >
            Create draft
          </Button>
        </>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field id="ns-crop" label="Crop">
          <Select id="ns-crop" value={crop} onChange={(e) => setCrop(e.target.value)}>
            {crops.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            <option value="__other">Another crop…</option>
          </Select>
        </Field>
        {crop === "__other" ? (
          <Field id="ns-other" label="Crop identifier" hint="Lower-case, e.g. lettuce.">
            <Input id="ns-other" value={otherCrop} maxLength={80} onChange={(e) => setOtherCrop(e.target.value)} />
          </Field>
        ) : (
          <span />
        )}
        <Field id="ns-zone" label="Agro-ecological zone">
          <Select id="ns-zone" value={zone} onChange={(e) => setZone(e.target.value)}>
            {AGRO_ZONES.map((z) => <option key={z.id} value={z.id}>{z.label}</option>)}
          </Select>
        </Field>
        <Field id="ns-maxn" label="Maximum nitrogen (kg N/ha)" optional="optional">
          <Input id="ns-maxn" type="number" min={0} max={500} value={maxN} onChange={(e) => setMaxN(e.target.value)} />
        </Field>
        <div className="md:col-span-2">
          <Field id="ns-title" label="Title"><Input id="ns-title" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} /></Field>
        </div>
        <div className="md:col-span-2">
          <Field id="ns-source" label="Source label" hint="The published guidance this draft is based on.">
            <Input id="ns-source" value={source} maxLength={200} onChange={(e) => setSource(e.target.value)} />
          </Field>
        </div>
      </div>
      <p className="mt-3 text-body-sm text-on-surface-variant">Code: <span className="font-mono">{code}</span> · version 1.0. Add stages and nutrients after creating it.</p>
    </Dialog>
  );
}

function CompareDialog({
  target,
  standards,
  canRestore,
  pending,
  onClose,
  onRestore,
}: {
  target: StandardRow;
  standards: StandardRow[];
  canRestore: boolean;
  pending: boolean;
  onClose: () => void;
  onRestore: (older: StandardRow) => void;
}) {
  const others = standards.filter((s) => s.standard_code === target.standard_code && s.id !== target.id);
  const defaultOther = others.find((s) => s.id === target.supersedes_id) ?? others[0];
  const [otherId, setOtherId] = useState(defaultOther?.id ?? "");
  const other = others.find((s) => s.id === otherId);
  const lines = other ? diffStandards(other, target) : [];
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={`Compare ${target.standard_code} v${target.version}`}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          {canRestore && other && (
            <Button disabled={pending} onClick={() => onRestore(other)}>
              Restore v{other.version} as a new draft
            </Button>
          )}
        </>
      }
    >
      {others.length === 0 ? (
        <p className="text-body-md text-on-surface-variant">There is no other version to compare with.</p>
      ) : (
        <>
          <Field id="cmp-other" label="Compare with">
            <Select id="cmp-other" value={otherId} onChange={(e) => setOtherId(e.target.value)}>
              {others.map((s) => <option key={s.id} value={s.id}>v{s.version} · {STATUS_LABEL[s.status]}</option>)}
            </Select>
          </Field>
          {lines.length === 0 ? (
            <p className="mt-3 text-body-md text-on-surface-variant">No differences.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {lines.map((l) => (
                <li key={l.field} className="rounded-lg border border-border p-3 text-body-sm">
                  <p className="font-label-md text-label-md text-on-surface">{l.field}</p>
                  <p className="mt-1 text-critical"><span className="font-mono">− v{other?.version}:</span> {l.before || "(empty)"}</p>
                  <p className="text-[#047857]"><span className="font-mono">+ v{target.version}:</span> {l.after || "(empty)"}</p>
                </li>
              ))}
            </ul>
          )}
          {canRestore && other && (
            <p className="mt-3 text-body-sm text-on-surface-variant">
              Restoring copies v{other.version} into a new draft with the next version number. Nothing published changes until the
              new draft is reviewed, approved and published.
            </p>
          )}
        </>
      )}
    </Dialog>
  );
}

function ReasonDialog({ target, pending, onClose, onSubmit }: { target: ReasonTarget; pending: boolean; onClose: () => void; onSubmit: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  const title =
    target.kind === "chemical-withdraw" ? `Withdraw ${target.label}` : target.kind === "translation" ? "Return translation" : `Return ${target.label}`;
  const min = target.kind === "translation" ? 5 : 10;
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" disabled={pending || reason.trim().length < min} onClick={() => onSubmit(reason)}>
            {target.kind === "chemical-withdraw" ? "Withdraw" : "Return"}
          </Button>
        </>
      }
    >
      <Field id="rs-reason" label="Reason" hint={`At least ${min} characters. The author sees this.`}>
        <TextArea id="rs-reason" rows={3} value={reason} maxLength={1000} onChange={(e) => setReason(e.target.value)} />
      </Field>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------------------------- layout helpers

function Dialog({
  open,
  onOpenChange,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  children: ReactNode;
  footer: ReactNode;
  wide?: boolean;
}) {
  return (
    <ScreenDialog
      title={title}
      open={open}
      onOpenChange={onOpenChange}
      panel={
        <div className={`w-full ${wide ? "max-w-3xl" : "max-w-2xl"} overflow-y-auto rounded-xl bg-surface-container-lowest p-space-lg shadow-overlay`}>
          <h3 className="mb-space-md font-headline-sm text-headline-sm text-on-surface">{title}</h3>
          {children}
          <div className="mt-space-lg flex flex-wrap justify-end gap-2">{footer}</div>
        </div>
      }
    />
  );
}

function Card({ children }: { children: ReactNode }) {
  return <div className="overflow-hidden rounded-xl border border-border bg-surface-container-lowest shadow-card">{children}</div>;
}

function CardHeader({ icon, title, note, action }: { icon: string; title: string; note?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-space-sm border-b border-border p-space-lg md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-fixed/60 text-on-primary-fixed-variant">
          <Icon name={icon as Parameters<typeof Icon>[0]["name"]} className="text-xl" />
        </span>
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{title}</h3>
          {note && <p className="text-body-sm text-on-surface-variant">{note}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function StatCard({ icon, label, value, foot }: { icon: string; label: string; value: number; foot: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-surface-container-lowest p-space-md shadow-card">
      <div className="flex items-center justify-between">
        <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">{label}</span>
        <Icon name={icon as Parameters<typeof Icon>[0]["name"]} className="text-[18px] text-primary" />
      </div>
      <span className="tnum font-headline-md text-headline-md text-on-surface">{value.toLocaleString("en-GB")}</span>
      <span className="text-body-sm text-on-surface-variant">{foot}</span>
    </div>
  );
}

function countBy<T>(items: T[], key: (t: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const i of items) out[key(i)] = (out[key(i)] ?? 0) + 1;
  return out;
}
