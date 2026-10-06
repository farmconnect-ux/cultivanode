"use client";

import { useActionState } from "react";
import {
  addPlot,
  addSoilRecord,
  updateFarmBoundary,
  addLivestockAction,
  addFarmWorkerAction,
  addInventoryItemAction,
  recordFarmTransactionAction,
  addFarmRecordAction,
  type ActionState,
} from "@/actions/farm-operations";
import { Alert, Button, Input, Select } from "@/components/ui";

export function AddPlotForm({ farmId, lang }: { farmId: string; lang: string }) {
  const [state, formAction, pending] = useActionState(addPlot, {} as ActionState);

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

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Soil Texture</span>
          <Select name="soil_texture" defaultValue="sandy_loam">
            <option value="sandy_loam">Sandy Loam (Standard Savanna)</option>
            <option value="loam">Loam (Humid Forest)</option>
            <option value="clay_loam">Clay Loam (Lowland / Rice)</option>
            <option value="silt_loam">Silt Loam (Riverine)</option>
            <option value="loamy_sand">Loamy Sand</option>
            <option value="sandy">Sandy (Well-drained)</option>
            <option value="clay">Heavy Clay</option>
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Irrigation Method</span>
          <Select name="irrigation_type" defaultValue="rainfed">
            <option value="rainfed">Rainfed (Seasonal rains)</option>
            <option value="drip">Drip Irrigation (Dry season)</option>
            <option value="sprinkler">Sprinkler Irrigation</option>
            <option value="furrow">Furrow / Flood Irrigation</option>
            <option value="manual">Manual / Hose Watering</option>
          </Select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-xs font-semibold">
        <span>Field Notes &amp; Cropping History</span>
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
  const [state, formAction, pending] = useActionState(addSoilRecord, {} as ActionState);

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
  const [state, formAction, pending] = useActionState(updateFarmBoundary, {} as ActionState);

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

export function AddLivestockForm({ farmId, lang }: { farmId: string; lang: string }) {
  const [state, formAction, pending] = useActionState(addLivestockAction, {} as ActionState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="farm_id" value={farmId} />
      <input type="hidden" name="lang" value={lang} />

      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">Livestock group registered successfully in database.</Alert>}

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Animal Type *</span>
          <Select name="animal_type" defaultValue="cattle">
            <option value="cattle">Cattle / Beef & Dairy</option>
            <option value="poultry">Poultry / Layers & Broilers</option>
            <option value="goat">Goat (Red Sokoto / West African Dwarf)</option>
            <option value="sheep">Sheep (Yankasa / Balami)</option>
            <option value="pig">Pig</option>
            <option value="fish">Fish (Catfish / Tilapia)</option>
            <option value="snail">Snail (Archachatina)</option>
            <option value="rabbit">Rabbit</option>
            <option value="other">Other</option>
          </Select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Breed / Strain *</span>
          <Input name="breed" required placeholder="e.g. White Fulani, Noiler, Cobb 500" maxLength={80} />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Identifier / Tag / Pen *</span>
          <Input name="identifier" required placeholder="e.g. Pen A, Herd 1, Flock B" maxLength={80} />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Head Count / Stock Quantity *</span>
          <Input name="head_count" type="number" defaultValue="50" min="0" required />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Housing Location</span>
          <Input name="housing_location" placeholder="e.g. East Brooder House, Pasture North" maxLength={120} />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Production Purpose</span>
          <Select name="purpose" defaultValue="meat">
            <option value="meat">Meat / Finishing</option>
            <option value="eggs">Egg Production</option>
            <option value="dairy">Milk / Dairy</option>
            <option value="breeding">Breeding Stock</option>
            <option value="multi">Dual / Multi Purpose</option>
          </Select>
        </label>
      </div>

      <div className="pt-1">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Registering Livestock..." : "+ Register Livestock / Flock"}
        </Button>
      </div>
    </form>
  );
}

export function AddFarmWorkerForm({ farmId, lang }: { farmId: string; lang: string }) {
  const [state, formAction, pending] = useActionState(addFarmWorkerAction, {} as ActionState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="farm_id" value={farmId} />
      <input type="hidden" name="lang" value={lang} />

      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">Farm worker recorded in database.</Alert>}

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Full Name *</span>
          <Input name="full_name" required placeholder="e.g. Babatunde Alabi" maxLength={120} />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Phone Number</span>
          <Input name="phone" placeholder="e.g. 08031234567" maxLength={30} />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Assigned Role *</span>
          <Select name="role" defaultValue="field_worker">
            <option value="farm_manager">Farm Manager / Supervisor</option>
            <option value="tractor_operator">Tractor / Machine Operator</option>
            <option value="field_worker">Field Operations / Labourer</option>
            <option value="scout">Crop Scout / Agronomy Lead</option>
            <option value="harvester">Harvester</option>
            <option value="livestock_keeper">Livestock Keeper / Herder</option>
            <option value="security">Security / Farm Guard</option>
            <option value="casual">Casual / Day Labourer</option>
          </Select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Employment Agreement</span>
          <Select name="employment_type" defaultValue="permanent">
            <option value="permanent">Permanent / Full-Time</option>
            <option value="seasonal">Seasonal Contract</option>
            <option value="daily_casual">Daily Casual / Daily Paid</option>
          </Select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Daily Wage (₦)</span>
          <Input name="daily_wage_ngn" type="number" defaultValue="4500" min="0" placeholder="e.g. 4500" />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Emergency Contact</span>
          <Input name="emergency_contact" placeholder="Next of kin / phone" maxLength={120} />
        </label>
      </div>

      <div className="pt-1">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Adding Worker..." : "+ Add Farm Worker"}
        </Button>
      </div>
    </form>
  );
}

export function AddInventoryItemForm({ farmId, lang }: { farmId: string; lang: string }) {
  const [state, formAction, pending] = useActionState(addInventoryItemAction, {} as ActionState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="farm_id" value={farmId} />
      <input type="hidden" name="lang" value={lang} />

      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">Inventory item recorded in database.</Alert>}

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Item / Product Name *</span>
          <Input name="item_name" required placeholder="e.g. NPK 15-15-15, SC510 Seed" maxLength={120} />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Category *</span>
          <Select name="category" defaultValue="fertiliser">
            <option value="fertiliser">Fertiliser</option>
            <option value="seed">Certified Seeds / Planting Material</option>
            <option value="chemical">NAFDAC Cleared Agrochemicals</option>
            <option value="feed">Livestock / Fish Feed</option>
            <option value="tool_equipment">Hand Tools & Equipment</option>
            <option value="harvest_produce">Harvested Stored Produce</option>
            <option value="fuel">Diesel / Petrol / Fuel</option>
            <option value="other">Other Supply</option>
          </Select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Storage Location</span>
          <Input name="storage_location" placeholder="e.g. Store Room 1, Silo 3" maxLength={120} />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Stock Quantity *</span>
          <Input name="quantity" type="number" step="0.1" defaultValue="10" min="0" required />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Unit *</span>
          <Select name="unit" defaultValue="bags">
            <option value="bags">Bags (50kg)</option>
            <option value="kg">kg</option>
            <option value="liters">Liters</option>
            <option value="units">Units / Pieces</option>
            <option value="tons">Tons</option>
            <option value="crates">Crates</option>
            <option value="bundles">Bundles</option>
          </Select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Reorder Threshold</span>
          <Input name="reorder_threshold" type="number" step="0.1" defaultValue="2" min="0" />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Unit Purchase Cost (₦)</span>
          <Input name="unit_cost_ngn" type="number" defaultValue="35000" min="0" />
        </label>
      </div>

      <div className="pt-1">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving Stock..." : "+ Add Inventory Item"}
        </Button>
      </div>
    </form>
  );
}

export function RecordFarmTransactionForm({
  farmId,
  cropCycles,
  lang,
}: {
  farmId: string;
  cropCycles: Array<{ id: string; cropName: string }>;
  lang: string;
}) {
  const [state, formAction, pending] = useActionState(recordFarmTransactionAction, {} as ActionState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="farm_id" value={farmId} />
      <input type="hidden" name="lang" value={lang} />

      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">Transaction recorded in farm books.</Alert>}

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Transaction Type *</span>
          <Select name="type" defaultValue="expense">
            <option value="expense">Expense (Outflow)</option>
            <option value="income">Income / Revenue (Inflow)</option>
          </Select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Category *</span>
          <Select name="category" defaultValue="machinery_service">
            <option value="machinery_service">Machinery Hire / Tractor Service</option>
            <option value="labour_wages">Labour Wages & Daily Work</option>
            <option value="seeds">Seeds & Seedlings</option>
            <option value="fertilisers">Fertilisers & Nutrients</option>
            <option value="chemicals">Agrochemicals & Crop Protection</option>
            <option value="feed">Livestock Feed</option>
            <option value="fuel">Fuel & Energy</option>
            <option value="harvest_sale">Crop Harvest Sale (Revenue)</option>
            <option value="livestock_sale">Livestock Sale (Revenue)</option>
            <option value="repairs">Equipment Repairs & Maintenance</option>
            <option value="other">Other Operational Flow</option>
          </Select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Amount (₦) *</span>
          <Input name="amount_ngn" type="number" defaultValue="50000" min="1" required />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Transaction Date</span>
          <Input name="transaction_date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Payment Method</span>
          <Select name="payment_method" defaultValue="bank_transfer">
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cash">Cash</option>
            <option value="escrow">CultivaNode Escrow</option>
            <option value="mobile_money">Mobile Money</option>
          </Select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Link to Crop Cycle (Optional)</span>
          <Select name="crop_cycle_id" defaultValue="">
            <option value="">General Farm Level</option>
            {cropCycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.cropName}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-xs font-semibold">
        <span>Description / Notes *</span>
        <Input name="description" required placeholder="e.g. Paid for 4 ha disc plowing by local tractor provider" maxLength={500} />
      </label>

      <div className="pt-1">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Recording..." : "+ Record Transaction in Farm Books"}
        </Button>
      </div>
    </form>
  );
}

export function AddFarmRecordForm({ farmId, lang }: { farmId: string; lang: string }) {
  const [state, formAction, pending] = useActionState(addFarmRecordAction, {} as ActionState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="farm_id" value={farmId} />
      <input type="hidden" name="lang" value={lang} />

      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">Farm record / document saved in database.</Alert>}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Record Type *</span>
          <Select name="record_type" defaultValue="land_title">
            <option value="land_title">Land Title / Certificate of Occupancy</option>
            <option value="lease_agreement">Lease Agreement / Tenancy</option>
            <option value="water_source">Water Source / Borehole Log</option>
            <option value="irrigation_system">Irrigation Infrastructure Record</option>
            <option value="environmental_audit">Environmental & Soil Audit</option>
            <option value="certification">Agricultural Certification / Organic / GAP</option>
            <option value="inspection">Extension Agent Inspection Report</option>
            <option value="general">General Administrative Document</option>
          </Select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Record Title *</span>
          <Input name="title" required placeholder="e.g. 5-Year Farmland Lease Agreement" maxLength={150} />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-xs font-semibold">
        <span>Record Details &amp; Summary</span>
        <Input name="details" placeholder="e.g. Agreement with Iseyin Agricultural Community Council" maxLength={2000} />
      </label>

      <div className="pt-1">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving Record..." : "+ Save Farm Record"}
        </Button>
      </div>
    </form>
  );
}

export function PrintReportButton({ farmName }: { farmName: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="px-3 py-1.5 text-xs font-bold bg-leaf-600 hover:bg-leaf-700 text-white rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
      title={`Print or Export PDF Statement for ${farmName}`}
    >
      <span>🖨️</span>
      <span>Print / PDF Statement</span>
    </button>
  );
}
