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
  addMachineryAction,
  logMachineryUsageAction,
  logMachineryMaintenanceAction,
  addEquipmentAction,
  recordAttendanceAction,
  addOperationalTaskAction,
  updateOperationalTaskAction,
  addIndividualLivestockAction,
  logLivestockHealthAction,
  logLivestockFeedingAction,
  logLivestockProductionAction,
  moveInventoryTransactionalAction,
  recordPlanActualVarianceAction,
  addFarmBudgetAction,
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

/* ------------------------------------------------------------------ Machinery & Equipment Forms */

export function AddMachineryForm({ farmId, lang }: { farmId: string; lang: string }) {
  const [state, formAction, pending] = useActionState(addMachineryAction, {} as ActionState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="farm_id" value={farmId} />
      <input type="hidden" name="lang" value={lang} />

      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">Machinery registered successfully.</Alert>}

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Asset Code *</span>
          <Input name="asset_code" required placeholder="e.g. TRAC-01" maxLength={40} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Type</span>
          <Select name="machinery_type" defaultValue="tractor">
            <option value="tractor">Tractor</option>
            <option value="plough">Plough (Disc/Chisel)</option>
            <option value="harrow">Harrow</option>
            <option value="ridger">Ridger</option>
            <option value="planter">Planter / Seeder</option>
            <option value="harvester">Harvester / Thresher</option>
            <option value="sprayer">Boom Sprayer</option>
            <option value="pump">Irrigation Water Pump</option>
            <option value="generator">Generator</option>
            <option value="trailer">Farm Trailer</option>
            <option value="processing">Processing Machine</option>
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Fuel Type</span>
          <Select name="fuel_type" defaultValue="diesel">
            <option value="diesel">Diesel</option>
            <option value="petrol">Petrol</option>
            <option value="electric">Solar / Electric</option>
            <option value="manual">Manual / PTO</option>
          </Select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Manufacturer / Make *</span>
          <Input name="make" required placeholder="e.g. Massey Ferguson" maxLength={80} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Model *</span>
          <Input name="model" required placeholder="e.g. MF 375 (75 HP)" maxLength={80} />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Current Engine Hours</span>
          <Input name="engine_hours" type="number" step="0.1" min="0" placeholder="e.g. 350.5" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Purchase Cost (₦)</span>
          <Input name="purchase_cost_ngn" type="number" min="0" placeholder="e.g. 15000000" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Reg Number</span>
          <Input name="registration_number" placeholder="e.g. OYO-842-AB" maxLength={40} />
        </label>
      </div>

      <div className="pt-1">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Registering..." : "+ Register Machinery"}
        </Button>
      </div>
    </form>
  );
}

export function LogMachineryUsageForm({
  farmId,
  machinery,
  workers,
  plots,
  lang,
}: {
  farmId: string;
  machinery: Array<{ id: string; asset_code: string; make: string; model: string; engine_hours: number }>;
  workers: Array<{ id: string; full_name: string }>;
  plots: Array<{ id: string; name: string }>;
  lang: string;
}) {
  const [state, formAction, pending] = useActionState(logMachineryUsageAction, {} as ActionState);

  if (machinery.length === 0) {
    return <div className="p-3 text-xs text-muted">Register at least one machine first.</div>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="farm_id" value={farmId} />
      <input type="hidden" name="lang" value={lang} />

      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">Machinery usage log saved.</Alert>}

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Machine *</span>
          <Select name="machinery_id" required defaultValue={machinery[0]?.id}>
            {machinery.map((m) => (
              <option key={m.id} value={m.id}>
                {m.asset_code} - {m.make} {m.model} ({m.engine_hours} hrs)
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Operator</span>
          <Select name="operator_id" defaultValue="">
            <option value="">-- Select Operator --</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.full_name}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Field / Plot</span>
          <Select name="plot_id" defaultValue="">
            <option value="">-- Whole Farm / Non-field --</option>
            {plots.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Start Hours *</span>
          <Input name="start_engine_hours" type="number" step="0.1" required placeholder="e.g. 350.0" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>End Hours *</span>
          <Input name="end_engine_hours" type="number" step="0.1" required placeholder="e.g. 356.5" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Area Covered (ha)</span>
          <Input name="area_covered_ha" type="number" step="0.01" placeholder="e.g. 4.0" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Fuel Consumed (L)</span>
          <Input name="fuel_consumed_liters" type="number" step="0.5" placeholder="e.g. 32" />
        </label>
      </div>

      <div className="pt-1">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving..." : "+ Record Machinery Operation"}
        </Button>
      </div>
    </form>
  );
}

export function AddEquipmentForm({ farmId, lang }: { farmId: string; lang: string }) {
  const [state, formAction, pending] = useActionState(addEquipmentAction, {} as ActionState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="farm_id" value={farmId} />
      <input type="hidden" name="lang" value={lang} />

      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">Equipment registered successfully.</Alert>}

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Equipment Name *</span>
          <Input name="equipment_name" required placeholder="e.g. Knapsack Sprayer 16L" maxLength={120} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Category</span>
          <Select name="category" defaultValue="sprayer">
            <option value="sprayer">Knapsack / Power Sprayer</option>
            <option value="pump">Water Pump (Small)</option>
            <option value="scale">Weighing Scale</option>
            <option value="ppe">Protective Gear (PPE)</option>
            <option value="hand_tool">Hand Tool (Cutlass, Hoe, etc)</option>
            <option value="irrigation_part">Drip / Pipe Fitting</option>
            <option value="testing_instrument">Testing Meter (pH, EC)</option>
            <option value="other">Other</option>
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Quantity</span>
          <Input name="quantity" type="number" min="1" defaultValue="1" />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Condition</span>
          <Select name="condition" defaultValue="good">
            <option value="new">Brand New</option>
            <option value="good">Good Working Condition</option>
            <option value="fair">Fair (Minor Wear)</option>
            <option value="needs_repair">Needs Repair</option>
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Storage Location</span>
          <Input name="storage_location" placeholder="e.g. Tool Shed #1" maxLength={120} />
        </label>
      </div>

      <div className="pt-1">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving..." : "+ Add Equipment Asset"}
        </Button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ Attendance & Tasks Forms */

export function RecordAttendanceForm({
  farmId,
  workers,
  lang,
}: {
  farmId: string;
  workers: Array<{ id: string; full_name: string; daily_wage_kobo: number }>;
  lang: string;
}) {
  const [state, formAction, pending] = useActionState(recordAttendanceAction, {} as ActionState);

  if (workers.length === 0) {
    return <div className="p-3 text-xs text-muted">Register farm workers first.</div>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="farm_id" value={farmId} />
      <input type="hidden" name="lang" value={lang} />

      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">Attendance recorded successfully.</Alert>}

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Worker *</span>
          <Select name="worker_id" required defaultValue={workers[0]?.id}>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.full_name} (₦{(w.daily_wage_kobo / 100).toLocaleString()}/day)
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Attendance Status</span>
          <Select name="status" defaultValue="present">
            <option value="present">Present (Full Day)</option>
            <option value="half_day">Half Day</option>
            <option value="late">Late Arrival</option>
            <option value="excused_leave">Excused Leave</option>
            <option value="absent">Absent</option>
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Date</span>
          <Input name="attendance_date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Overtime (Minutes)</span>
          <Input name="overtime_minutes" type="number" min="0" placeholder="e.g. 60" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Custom Daily Wage (₦)</span>
          <Input name="daily_wage_ngn" type="number" placeholder="Leave blank to use default" />
        </label>
      </div>

      <div className="pt-1">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Logging..." : "+ Record Worker Attendance"}
        </Button>
      </div>
    </form>
  );
}

export function AddOperationalTaskForm({
  farmId,
  workers,
  plots,
  cropCycles,
  lang,
}: {
  farmId: string;
  workers: Array<{ id: string; full_name: string }>;
  plots: Array<{ id: string; name: string }>;
  cropCycles: Array<{ id: string; crop_id: string; current_stage: string }>;
  lang: string;
}) {
  const [state, formAction, pending] = useActionState(addOperationalTaskAction, {} as ActionState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="farm_id" value={farmId} />
      <input type="hidden" name="lang" value={lang} />

      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">Operational task assigned.</Alert>}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Task Title *</span>
          <Input name="title" required placeholder="e.g. Apply pre-emergence herbicide on Plot 1" maxLength={140} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Priority</span>
          <Select name="priority" defaultValue="medium">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Assignee</span>
          <Select name="assigned_worker_id" defaultValue="">
            <option value="">-- Unassigned --</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.full_name}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Field / Plot</span>
          <Select name="plot_id" defaultValue="">
            <option value="">-- Not field specific --</option>
            {plots.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Crop Cycle</span>
          <Select name="crop_cycle_id" defaultValue="">
            <option value="">-- None --</option>
            {cropCycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.crop_id} ({c.current_stage})
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Start Date *</span>
          <Input name="start_date" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Due Date *</span>
          <Input name="due_date" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Est Duration (Hours)</span>
          <Input name="estimated_duration_hours" type="number" step="0.5" placeholder="e.g. 4.0" />
        </label>
      </div>

      <div className="pt-1">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Creating..." : "+ Assign Operational Task"}
        </Button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ Livestock Deep Domain Forms */

export function AddIndividualLivestockForm({ farmId, lang }: { farmId: string; lang: string }) {
  const [state, formAction, pending] = useActionState(addIndividualLivestockAction, {} as ActionState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="farm_id" value={farmId} />
      <input type="hidden" name="lang" value={lang} />

      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">Animal registered with individual pedigree tracking.</Alert>}

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Tag Number *</span>
          <Input name="tag_number" required placeholder="e.g. CTL-042" maxLength={60} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>RFID / Microchip</span>
          <Input name="rfid_number" placeholder="e.g. 9820004128912" maxLength={60} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Species</span>
          <Select name="animal_type" defaultValue="cattle">
            <option value="cattle">Cattle (Cow/Bull)</option>
            <option value="goat">Goat</option>
            <option value="sheep">Sheep</option>
            <option value="pig">Pig</option>
            <option value="rabbit">Rabbit</option>
            <option value="other">Other</option>
          </Select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Breed *</span>
          <Input name="breed" required placeholder="e.g. White Fulani / Bunaji" maxLength={80} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Sex</span>
          <Select name="sex" defaultValue="female">
            <option value="female">Female</option>
            <option value="male">Male</option>
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Current Weight (kg)</span>
          <Input name="current_weight_kg" type="number" step="0.1" placeholder="e.g. 320.5" />
        </label>
      </div>

      <div className="pt-1">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Registering..." : "+ Register Individual Animal"}
        </Button>
      </div>
    </form>
  );
}

export function LogLivestockHealthForm({
  farmId,
  animals,
  groups,
  lang,
}: {
  farmId: string;
  animals: Array<{ id: string; tag_number: string; breed: string }>;
  groups: Array<{ id: string; identifier: string; animal_type: string }>;
  lang: string;
}) {
  const [state, formAction, pending] = useActionState(logLivestockHealthAction, {} as ActionState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="farm_id" value={farmId} />
      <input type="hidden" name="lang" value={lang} />

      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">Health & veterinary event recorded.</Alert>}

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Target Animal / Group</span>
          <Select name="animal_id" defaultValue="">
            <option value="">-- Entire Group / Herd (Select below) --</option>
            {animals.map((a) => (
              <option key={a.id} value={a.id}>
                Individual: {a.tag_number} ({a.breed})
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Group (if whole pen)</span>
          <Select name="group_id" defaultValue="">
            <option value="">-- Not group-wide --</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.identifier} ({g.animal_type})
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Event Type</span>
          <Select name="event_type" defaultValue="vaccination">
            <option value="vaccination">Vaccination</option>
            <option value="treatment">Treatment / Antibiotic</option>
            <option value="vet_visit">Veterinary Inspection</option>
            <option value="disease_symptom">Observed Disease / Symptom</option>
            <option value="routine_check">Routine Health Check</option>
          </Select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Medication / Vaccine</span>
          <Input name="medication_name" placeholder="e.g. CBPP Vaccine / Oxytetracycline" maxLength={120} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Dosage</span>
          <Input name="dosage" placeholder="e.g. 5ml intramuscular" maxLength={80} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Withdrawal Period (Days)</span>
          <Input name="withdrawal_period_days" type="number" min="0" defaultValue="0" />
        </label>
      </div>

      <div className="pt-1">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving..." : "+ Record Health Event"}
        </Button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ Multi-Location Inventory Movement */

export function MoveInventoryTransactionalForm({
  farmId,
  items,
  lang,
}: {
  farmId: string;
  items: Array<{ id: string; item_name: string; quantity: number; unit: string }>;
  lang: string;
}) {
  const [state, formAction, pending] = useActionState(moveInventoryTransactionalAction, {} as ActionState);

  if (items.length === 0) {
    return <div className="p-3 text-xs text-muted">Add inventory items first.</div>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="farm_id" value={farmId} />
      <input type="hidden" name="lang" value={lang} />

      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">Transactional stock movement recorded safely in ledger.</Alert>}

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Item *</span>
          <Select name="inventory_id" required defaultValue={items[0]?.id}>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.item_name} ({Number(i.quantity).toLocaleString()} {i.unit} in stock)
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Movement Type</span>
          <Select name="transaction_type" defaultValue="ISSUE">
            <option value="ISSUE">Issue to Field / Crop</option>
            <option value="CONSUMPTION">Livestock Feeding Consumption</option>
            <option value="PURCHASE">Procurement Receipt (+)</option>
            <option value="DAMAGE">Damage / Waste Write-off (-)</option>
            <option value="RETURN">Return to Warehouse (+)</option>
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Quantity *</span>
          <Input name="quantity" type="number" step="0.01" min="0.01" required placeholder="e.g. 5" />
        </label>
      </div>

      <div className="pt-1">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Executing Movement..." : "+ Record Stock Movement"}
        </Button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ Standard Plan Actual Variance Form */

export function RecordPlanActualVarianceForm({
  farmId,
  lang,
}: {
  farmId: string;
  lang: string;
}) {
  const [state, formAction, pending] = useActionState(recordPlanActualVarianceAction, {} as ActionState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="farm_id" value={farmId} />
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="entity_id" value={farmId} />

      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">Farmer override &amp; variance recorded in agronomy engine.</Alert>}

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Metric Name *</span>
          <Input name="metric_name" required placeholder="e.g. Basal NPK Rate" maxLength={60} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Unit *</span>
          <Input name="unit" required placeholder="e.g. kg/ha" maxLength={30} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Farmer Override?</span>
          <Select name="is_farmer_override" defaultValue="true">
            <option value="true">Yes (Farmer Decision)</option>
            <option value="false">No (Followed Standard)</option>
          </Select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Standard Recommendation</span>
          <Input name="standard_value" type="number" step="0.01" placeholder="e.g. 200" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Farmer Plan</span>
          <Input name="plan_value" type="number" step="0.01" placeholder="e.g. 150" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Actual Field Result</span>
          <Input name="actual_value" type="number" step="0.01" placeholder="e.g. 165" />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-xs font-semibold">
        <span>Farmer Reason / Observation</span>
        <Input name="farmer_deviation_reason" placeholder="e.g. Applied less fertiliser due to heavy organic matter in Plot 2" maxLength={1000} />
      </label>

      <div className="pt-1">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving..." : "+ Save Variance Record"}
        </Button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ Farm Budget Form */

export function AddFarmBudgetForm({ farmId, lang }: { farmId: string; lang: string }) {
  const [state, formAction, pending] = useActionState(addFarmBudgetAction, {} as ActionState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="farm_id" value={farmId} />
      <input type="hidden" name="lang" value={lang} />

      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">Farm enterprise budget established.</Alert>}

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Budget Name *</span>
          <Input name="name" required placeholder="e.g. 2026 Rainy Season Crop Budget" maxLength={120} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Fiscal Year</span>
          <Input name="fiscal_year" type="number" defaultValue={new Date().getFullYear()} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Enterprise</span>
          <Select name="enterprise_type" defaultValue="whole_farm">
            <option value="whole_farm">Whole Farm Operations</option>
            <option value="crop">Crop Enterprise</option>
            <option value="livestock">Livestock Enterprise</option>
            <option value="machinery">Machinery & Fleet</option>
          </Select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Budgeted Expenses (₦)</span>
          <Input name="total_budgeted_expense_ngn" type="number" min="0" placeholder="e.g. 2500000" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Target Revenue (₦)</span>
          <Input name="total_budgeted_income_ngn" type="number" min="0" placeholder="e.g. 6000000" />
        </label>
      </div>

      <div className="pt-1">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Creating..." : "+ Establish Farm Budget"}
        </Button>
      </div>
    </form>
  );
}

