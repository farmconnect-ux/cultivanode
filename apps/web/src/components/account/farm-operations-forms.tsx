"use client";

import { useActionState } from "react";
import { addPlot, addSoilRecord, updateFarmBoundary, type ActionState } from "@/actions/farm-operations";
import { Alert, Button, Input, Select } from "@/components/ui";

export function AddPlotForm({ farmId, lang }: { farmId: string; lang: string }) {
  const [state, formAction, pending] = useActionState(addPlot, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="farm_id" value={farmId} />
      <input type="hidden" name="lang" value={lang} />

      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">Plot created successfully in database.</Alert>}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Plot Name *</span>
          <Input name="name" required placeholder="e.g. Plot 1 - North Maize" maxLength={80} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Area (Hectares)</span>
          <Input name="area_ha" type="number" step="0.01" min="0.01" placeholder="e.g. 2.5" />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-xs font-semibold">
        <span>Field Notes &amp; History</span>
        <Input name="notes" placeholder="e.g. Fallowed last season, planned for SC510 planting" maxLength={500} />
      </label>

      <div className="pt-1">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving Plot..." : "+ Add Plot to Farm"}
        </Button>
      </div>
    </form>
  );
}

export function AddSoilRecordForm({
  plots,
  lang,
}: {
  plots: Array<{ id: string; name: string }>;
  lang: string;
}) {
  const [state, formAction, pending] = useActionState(addSoilRecord, {});

  if (plots.length === 0) {
    return (
      <div className="rounded border border-line bg-surface p-4 text-xs text-muted">
        Create at least one plot above before logging soil test results.
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="lang" value={lang} />

      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">Soil test record saved successfully in database.</Alert>}

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Target Plot *</span>
          <Select name="plot_id" required defaultValue={plots[0]?.id}>
            {plots.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Soil Classification</span>
          <Select name="soil_type" defaultValue="Sandy Loam">
            <option value="Sandy Loam">Sandy Loam</option>
            <option value="Clay Loam">Clay Loam</option>
            <option value="Loamy Sand">Loamy Sand</option>
            <option value="Silty Clay">Silty Clay</option>
            <option value="Ferric Luvisol">Ferric Luvisol</option>
          </Select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Soil pH (0 - 14)</span>
          <Input name="ph" type="number" step="0.1" min="0" max="14" placeholder="e.g. 6.4" />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Nitrogen (%)</span>
          <Input name="nitrogen_pct" type="number" step="0.01" min="0" placeholder="e.g. 0.15" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Phosphorus (ppm)</span>
          <Input name="phosphorus_ppm" type="number" step="0.1" min="0" placeholder="e.g. 14.2" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Potassium (cmol/kg)</span>
          <Input name="potassium_cmol_kg" type="number" step="0.01" min="0" placeholder="e.g. 0.35" />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Laboratory / Extension Centre</span>
          <Input name="lab_name" placeholder="e.g. IITA Soil Lab / State Ministry" maxLength={100} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Date Tested</span>
          <Input name="tested_on" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
        </label>
      </div>

      <div className="pt-1">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving Soil Record..." : "Record Soil Test"}
        </Button>
      </div>
    </form>
  );
}

export function UpdateBoundaryForm({
  farmId,
  currentBoundary,
  lang,
}: {
  farmId: string;
  currentBoundary?: string | null;
  lang: string;
}) {
  const [state, formAction, pending] = useActionState(updateFarmBoundary, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="farm_id" value={farmId} />
      <input type="hidden" name="lang" value={lang} />

      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">Boundary updated in database. Hectares recalculated automatically.</Alert>}

      <label className="flex flex-col gap-1 text-xs font-semibold">
        <span>PostGIS Boundary Polygon (EWKT format)</span>
        <Input
          name="boundary_wkt"
          required
          defaultValue={
            currentBoundary ||
            "SRID=4326;POLYGON((3.8967 7.3775, 3.8990 7.3775, 3.8990 7.3750, 3.8967 7.3750, 3.8967 7.3775))"
          }
          placeholder="SRID=4326;POLYGON((lng lat, lng lat, ..., lng lat))"
        />
        <span className="text-[11px] text-muted">
          Coordinates must form a closed polygon (first point matches last point). Postgres PostGIS calculates measured hectares automatically.
        </span>
      </label>

      <div className="pt-1">
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Saving Boundary..." : "Update PostGIS Boundary"}
        </Button>
      </div>
    </form>
  );
}
