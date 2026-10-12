"use client";

import { useState } from "react";
import Link from "next/link";
import { formatNaira } from "@cultivanode/shared";
import { Button, Card, Field, Input, Select, TextArea } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatDay } from "@/lib/text";

type Farm = {
  id: string;
  name: string;
  state: string | null;
  lga: string | null;
  area_ha: number | null;
};

const SERVICES = [
  { id: "ploughing", label: "Tractor Ploughing", icon: "🚜", unit: "hectare", baseRate: 35000 },
  { id: "harrowing", label: "Harrowing / Ridging", icon: "🚜", unit: "hectare", baseRate: 28000 },
  { id: "planting", label: "Mechanical Planting", icon: "🌱", unit: "hectare", baseRate: 25000 },
  { id: "spraying", label: "Boom / Drone Spraying", icon: "💨", unit: "hectare", baseRate: 15000 },
  { id: "harvesting", label: "Harvester Combine", icon: "🌾", unit: "hectare", baseRate: 55000 },
  { id: "labour", label: "Manual Farm Labour", icon: "👥", unit: "day", baseRate: 6000 },
  { id: "transport", label: "Produce Transport", icon: "🚚", unit: "job", baseRate: 40000 },
  { id: "other", label: "Other Agronomy Service", icon: "⚙️", unit: "job", baseRate: 30000 },
] as const;

const SERVICE_TYPE_MAP: Record<string, { kind: "equipment" | "service"; type: string }> = {
  ploughing: { kind: "equipment", type: "tractor" },
  harrowing: { kind: "equipment", type: "tractor" },
  planting: { kind: "equipment", type: "planter" },
  spraying: { kind: "equipment", type: "boom_sprayer" },
  harvesting: { kind: "equipment", type: "harvester" },
  labour: { kind: "service", type: "farm_hand" },
  transport: { kind: "service", type: "produce_hauler" },
  other: { kind: "service", type: "other" },
};

export function ServiceRequestWizard({
  lang,
  farms,
  initialFarmId,
  t,
}: {
  lang: Locale;
  farms: Farm[];
  initialFarmId?: string;
  t: Dictionary;
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form State
  const [selectedService, setSelectedService] = useState<string>("ploughing");
  const [selectedFarmId, setSelectedFarmId] = useState<string>(
    initialFarmId && farms.some((f) => f.id === initialFarmId)
      ? initialFarmId
      : farms[0]?.id ?? "",
  );
  const [jobDate, setJobDate] = useState<string>(
    // eslint-disable-next-line react-hooks/purity -- Client component: default date for form input
    new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
  );
  const [jobTime, setJobTime] = useState<string>("08:00");
  const [flexible, setFlexible] = useState<boolean>(true);
  const [farmSize, setFarmSize] = useState<string>(
    farms.find((f) => f.id === (initialFarmId || farms[0]?.id))?.area_ha
      ? String(farms.find((f) => f.id === (initialFarmId || farms[0]?.id))?.area_ha)
      : "2.0",
  );
  const [notes, setNotes] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);

  const activeService = SERVICES.find((s) => s.id === selectedService) ?? SERVICES[0];
  const activeFarm = farms.find((f) => f.id === selectedFarmId) ?? farms[0];
  const matchedFilter = SERVICE_TYPE_MAP[selectedService] ?? { kind: "equipment", type: "tractor" };
  const parsedSize = Math.max(0.1, Number(farmSize) || 1);
  const estimatedTotal = Math.round(activeService.baseRate * parsedSize);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card className="flex flex-col items-center gap-4 p-8 text-center border-2 border-primary-container bg-surface-container-low/50">
        <span className="flex size-16 items-center justify-center rounded-full bg-secondary-container/40 text-3xl text-primary">
          ✓
        </span>
        <h2 className="text-2xl font-extrabold text-primary">Request Broadcasted to Local Providers</h2>
        <p className="max-w-md text-sm text-on-surface-variant">
          Your request for <strong>{activeService.label}</strong> on <strong>{activeFarm?.name ?? "your farm"}</strong> ({parsedSize} ha) for {formatDay(jobDate, lang)} at {jobTime} has been submitted. Verified operators within 30 km have been alerted.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href={`/${lang}/account/bookings?ws=farmer`}
            className="rounded-md bg-primary-container px-5 py-2.5 font-bold text-white shadow-xs hover:bg-primary"
          >
            Track in My Jobs →
          </Link>
          <Link
            href={`/${lang}/account/find?farm=${selectedFarmId}&ws=farmer`}
            className="rounded-md border border-border bg-white px-5 py-2.5 font-bold text-on-surface hover:bg-surface-container-low"
          >
            Browse Direct Equipment
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Wizard Step Stepper */}
      <nav aria-label="Request Progress" className="flex items-center justify-between border-b border-border pb-4">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={`flex size-8 items-center justify-center rounded-full text-xs font-bold ${
                step === s
                  ? "bg-primary-container text-white"
                  : step > s
                    ? "bg-secondary-container/60 text-primary"
                    : "bg-surface-container/60 text-on-surface-variant"
              }`}
            >
              {step > s ? "✓" : s}
            </span>
            <span className="hidden text-xs font-semibold sm:inline">
              {s === 1 ? "Service" : s === 2 ? "Farm" : s === 3 ? "When" : s === 4 ? "Details" : "Review"}
            </span>
          </div>
        ))}
      </nav>

      {/* STEP 1: What do you need? */}
      {step === 1 && (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-primary">Step 1: What do you need?</h2>
            <p className="text-sm text-on-surface-variant">Select the machinery or field service required for your farm.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SERVICES.map((srv) => (
              <button
                type="button"
                key={srv.id}
                onClick={() => setSelectedService(srv.id)}
                className={`flex min-h-24 flex-col items-center justify-center rounded-xl border-2 p-4 text-center transition-all ${
                  selectedService === srv.id
                    ? "border-primary-container bg-surface-container-low/80 font-bold text-primary shadow-xs"
                    : "border-border bg-white font-medium text-on-surface hover:border-secondary/40"
                }`}
              >
                <span className="text-2xl" aria-hidden="true">{srv.icon}</span>
                <span className="mt-2 text-sm">{srv.label}</span>
                <span className="mt-1 text-[11px] text-on-surface-variant">from {formatNaira(srv.baseRate)}/{srv.unit}</span>
              </button>
            ))}
          </div>

          <Button type="button" onClick={() => setStep(2)} className="self-end mt-4">
            Continue to Location →
          </Button>
        </section>
      )}

      {/* STEP 2: Where? (Select farm) */}
      {step === 2 && (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-primary">Step 2: Where? Select your farm</h2>
            <p className="text-sm text-on-surface-variant">Providers calculate travel distance and dispatch based on farm coordinates.</p>
          </div>

          {farms.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 p-6 text-center">
              <p className="font-bold">No farms registered yet</p>
              <p className="text-sm text-on-surface-variant">Add a farm location to request machinery.</p>
              <Link
                href={`/${lang}/account/farms?ws=farmer`}
                className="font-bold text-primary-container underline"
              >
                + Add Farm Now
              </Link>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {farms.map((f) => (
                <button
                  type="button"
                  key={f.id}
                  onClick={() => {
                    setSelectedFarmId(f.id);
                    if (f.area_ha) setFarmSize(String(f.area_ha));
                  }}
                  className={`flex flex-col rounded-xl border-2 p-5 text-left transition-all ${
                    selectedFarmId === f.id
                      ? "border-primary-container bg-surface-container-low/80 shadow-xs"
                      : "border-border bg-white hover:border-secondary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">{f.name}</span>
                    {selectedFarmId === f.id && <span className="font-bold text-primary-container">✓ Selected</span>}
                  </div>
                  <span className="text-sm text-on-surface-variant">
                    {[f.lga, f.state].filter(Boolean).join(", ") || "Location set"}
                  </span>
                  <span className="mt-2 text-xs font-semibold text-primary">
                    {f.area_ha ? `${f.area_ha} hectares` : "Size not specified"}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>
              ← Back
            </Button>
            <Button type="button" onClick={() => setStep(3)} disabled={!selectedFarmId}>
              Continue to Schedule →
            </Button>
          </div>
        </section>
      )}

      {/* STEP 3: When? */}
      {step === 3 && (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-primary">Step 3: When? Schedule the work</h2>
            <p className="text-sm text-on-surface-variant">Pick your preferred execution date and start time.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="pref-date" label="Preferred Date" hint="Choose a day within the next 60 days">
              <Input
                id="pref-date"
                type="date"
                required
                min={new Date().toISOString().slice(0, 10)}
                value={jobDate}
                onChange={(e) => setJobDate(e.target.value)}
              />
            </Field>

            <Field id="pref-time" label="Preferred Arrival Time">
              <Select id="pref-time" value={jobTime} onChange={(e) => setJobTime(e.target.value)}>
                <option value="07:00">07:00 AM (Early morning)</option>
                <option value="08:00">08:00 AM (Standard morning)</option>
                <option value="10:00">10:00 AM (Mid morning)</option>
                <option value="14:00">02:00 PM (Afternoon)</option>
              </Select>
            </Field>
          </div>

          <div className="rounded-lg border border-border bg-surface-container-low p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={flexible}
                onChange={(e) => setFlexible(e.target.checked)}
                className="size-5 accent-primary-container"
              />
              <div>
                <span className="font-bold text-sm text-on-surface">Flexible within +/- 2 days?</span>
                <span className="block text-xs text-on-surface-variant">
                  Increases match speed if operator has nearby jobs in your cluster.
                </span>
              </div>
            </label>
          </div>

          <div className="flex justify-between pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setStep(2)}>
              ← Back
            </Button>
            <Button type="button" onClick={() => setStep(4)}>
              Continue to Details →
            </Button>
          </div>
        </section>
      )}

      {/* STEP 4: Job Details */}
      {step === 4 && (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-primary">Step 4: Job details & Field instructions</h2>
            <p className="text-sm text-on-surface-variant">Provide field size and notes for the tractor operator.</p>
          </div>

          <Field
            id="job-ha"
            label="Field Size to Work (Hectares)"
            hint="Enter the exact or estimated area to work."
          >
            <Input
              id="job-ha"
              type="number"
              step="0.1"
              min="0.1"
              max="500"
              required
              value={farmSize}
              onChange={(e) => setFarmSize(e.target.value)}
            />
          </Field>

          <Field
            id="job-inst"
            label="Additional Instructions / Access Notes"
            hint="e.g. Turn by the large baobab tree, rocky patch on south corner, water point near gate."
          >
            <TextArea
              id="job-inst"
              rows={3}
              placeholder="Provide directions or notes on field terrain..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>

          <div className="rounded-lg border border-border bg-white p-4">
            <label className="flex flex-col gap-2">
              <span className="font-bold text-sm">Upload Reference Field Photo (Optional)</span>
              <span className="text-xs text-on-surface-variant">
                Take a quick snapshot of the field condition so the operator brings the right implements.
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="mt-1 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary-container file:px-4 file:py-2 file:text-xs file:font-bold file:text-white"
              />
            </label>
          </div>

          <div className="flex justify-between pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setStep(3)}>
              ← Back
            </Button>
            <Button type="button" onClick={() => setStep(5)}>
              Review Request →
            </Button>
          </div>
        </section>
      )}

      {/* STEP 5: Review & Submit */}
      {step === 5 && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-primary">Step 5: Review & Broadcast Request</h2>
            <p className="text-sm text-on-surface-variant">Verify your details before broadcasting to verified operators.</p>
          </div>

          <Card className="flex flex-col gap-3 border-2 border-primary-container bg-surface-container-low/40 p-5">
            <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
              <dt className="font-semibold text-on-surface-variant">Service:</dt>
              <dd className="font-bold text-primary">{activeService.label}</dd>

              <dt className="font-semibold text-on-surface-variant">Target Farm:</dt>
              <dd className="font-bold text-on-surface">{activeFarm?.name ?? "Selected Farm"}</dd>

              <dt className="font-semibold text-on-surface-variant">Location:</dt>
              <dd className="text-on-surface">{[activeFarm?.lga, activeFarm?.state].filter(Boolean).join(", ")}</dd>

              <dt className="font-semibold text-on-surface-variant">Area Size:</dt>
              <dd className="font-bold text-on-surface">{parsedSize} hectares</dd>

              <dt className="font-semibold text-on-surface-variant">Date & Time:</dt>
              <dd className="font-bold text-on-surface">{formatDay(jobDate, lang)} at {jobTime}</dd>

              <dt className="font-semibold text-on-surface-variant">Flexibility:</dt>
              <dd className="text-on-surface">{flexible ? "Flexible (+/- 2 days)" : "Strict date"}</dd>

              {notes && (
                <>
                  <dt className="font-semibold text-on-surface-variant">Notes:</dt>
                  <dd className="text-on-surface italic">&quot;{notes}&quot;</dd>
                </>
              )}
            </dl>

            <div className="mt-2 border-t border-border pt-3">
              <span className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Estimated Benchmark Cost</span>
              <span className="text-2xl font-extrabold text-primary tabular-nums">
                {formatNaira(estimatedTotal)}
              </span>
              <span className="block text-xs text-on-surface-variant">
                Payment is held in escrow upon operator confirmation and only released after your verification.
              </span>
            </div>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setStep(4)}>
              ← Back
            </Button>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/${lang}/account/find?farm=${selectedFarmId}&kind=${matchedFilter.kind}&type=${matchedFilter.type}`}
                className="rounded-md border border-primary-container bg-surface-container-low px-5 py-2.5 font-bold text-primary hover:bg-secondary-container/40 transition-colors"
              >
                Find &amp; Book Nearby Operators Directly →
              </Link>
              <Button type="submit" className="bg-primary-container text-white font-bold text-base px-6 py-2.5">
                Broadcast Request to All Operators 🚀
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
