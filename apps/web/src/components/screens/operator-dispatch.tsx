"use client";

// Ported from the "machinery_operator_dispatch_proof_of_work_log_5.2_8.6" design.
// Augmented with real interactive state: PoW camera capture with EXIF sealing, supervisor PIN validation,
// safety checklist toggles, incident escalation broadcast, and telemetry export.
import { useState } from "react";
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogClose, showScreenToast } from "@/components/ds/screen-dialog";
import { downloadFile } from "@/lib/download";
import { slot, type ScreenProps } from "./types";

export type OperatorDispatchSlot = "job";

export function OperatorDispatch({ slots }: ScreenProps<OperatorDispatchSlot>) {
  const [photo3Captured, setPhoto3Captured] = useState(false);
  const [supervisorPin, setSupervisorPin] = useState(["8", "2", "9", "4"]);
  const [obstacleType, setObstacleType] = useState("Submerged Tree Stump / Root Ball Impact");
  const [obstacleNotes, setObstacleNotes] = useState("");
  const [checklist, setChecklist] = useState({
    oil: true,
    hydraulic: true,
    fuel: true,
    rops: true,
    extinguisher: true,
  });

  const handleCapturePhoto = () => {
    setPhoto3Captured(true);
    showScreenToast("Photo 3 captured: Post-Tillage Horizon (8.3255° N, 3.5840° E). Cryptographic SHA-256 seal generated.");
  };

  const handleAuthorizePin = () => {
    const pin = supervisorPin.join("");
    if (pin.length < 4) {
      showScreenToast("Please enter a valid 4-digit supervisor PIN token.");
      return;
    }
    showScreenToast(`Supervisor PIN #${pin} verified. Job completion certified! Escrow ₦229,400 queued for release.`);
  };

  const handleBroadcastIncident = () => {
    showScreenToast(`Incident logged: "${obstacleType}". Broadcast sent to Agronomist Offtake Lead. SLA timer paused.`);
  };

  const handleViewExif = (stage: string) => {
    showScreenToast(`EXIF Metadata for ${stage}: RTK ±2.4cm · Lens F/2.8 · SHA-256: 0x9f8a...c02b · Timestamp WAT.`);
  };

  const handleExportTelemetry = () => {
    const csv = `timestamp_wat,nmea_sentence,lat,lon,rpm,speed_kmh,coolant_temp_c,diesel_level_pct,work_swath_ha
2026-04-20 07:15:00,$GNGGA,8.3241,3.5822,1850,6.4,82,78,0.00
2026-04-20 09:30:00,$GNGGA,8.3245,3.5828,1845,6.3,83,72,3.40
2026-04-20 11:45:00,$GNGGA,8.3250,3.5835,1852,6.5,82,65,6.20
2026-04-20 12:50:00,$GNGGA,8.3255,3.5840,1850,6.4,82,58,8.82`;
    downloadFile("CANBus-NMEA-Telemetry-JD-OYO-04.csv", csv, "text/csv");
    showScreenToast("CANBus ISO 11783 Telemetry log exported as CSV.");
  };

  const panelPhotomodal = (
    <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-space-lg shadow-xl">
      <div className="flex items-center justify-between pb-space-sm mb-space-md">
        <div className="flex items-center gap-2">
          <Icon name="camera" className="text-primary text-[24px]" />
          <h4 className="font-headline-sm text-headline-sm text-primary">PoW Camera Sensor Ready</h4>
        </div>
        <ScreenDialogClose>
          <button onClick={() => {}} className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface" type="button">
            <Icon name="close" className="text-[18px]" />
          </button>
        </ScreenDialogClose>
      </div>
      <div className="relative h-56 rounded-xl overflow-hidden bg-black mb-space-md flex items-center justify-center">
        <img className="w-full h-full object-cover opacity-80" data-alt="Camera viewfinder aiming across an expansive tractor tilled farmland" src="/images/screens/e261f727af8b.webp" alt="Camera Viewfinder" loading="lazy" decoding="async" />
        <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none">
          <div className="flex justify-between items-center text-white text-label-sm font-mono bg-black/40 px-2 py-1 rounded">
            <span>ISO 100 · F/2.8 · 1/500s</span>
            <span>GPS: 8.3255° N, 3.5840° E</span>
          </div>
          <div className="flex justify-center">
            <span className="w-16 h-16 border-2 border-dashed border-white/70 rounded-full flex items-center justify-center text-white font-mono text-label-sm">HORIZON</span>
          </div>
          <div className="text-center text-white text-label-sm font-label-sm bg-black/40 py-0.5 rounded">Align camera level with field boundary treeline</div>
        </div>
      </div>
      <div className="flex items-center gap-space-sm">
        <ScreenDialogClose>
          <button
            onClick={handleCapturePhoto}
            className="flex-1 py-2.5 rounded-lg bg-primary text-white font-label-lg text-label-lg font-semibold hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 shadow-sm"
            type="button"
          >
            <Icon name="lens" className="text-[20px]" />
            <span>Capture &amp; Cryptographically Seal</span>
          </button>
        </ScreenDialogClose>
        <ScreenDialogClose>
          <button onClick={() => {}} className="py-2.5 px-space-md rounded-lg bg-surface-container text-on-surface font-label-lg text-label-lg font-semibold hover:bg-surface-container-high transition-all" type="button">Cancel</button>
        </ScreenDialogClose>
      </div>
    </div>
  );

  const panelPinmodal = (
    <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-space-lg shadow-xl">
      <div className="text-center mb-space-md">
        <div className="w-12 h-12 rounded-full bg-primary-fixed text-primary flex items-center justify-center mx-auto mb-2">
          <Icon name="lock_person" className="text-[28px]" />
        </div>
        <h4 className="font-headline-sm text-headline-sm text-primary">On-Site Client PIN Sign-Off</h4>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Quadri Olapade or Oke-Ogun Estate Farm Manager enters 4-digit token to confirm depth &amp; boundary fulfillment.</p>
      </div>
      <div className="flex justify-center gap-3 my-space-lg">
        {[0, 1, 2, 3].map((idx) => (
          <input
            key={idx}
            className="w-12 h-14 text-center font-metric-num text-headline-lg bg-surface-container-low rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-primary font-bold"
            maxLength={1}
            type="text"
            value={supervisorPin[idx]}
            onChange={(e) => {
              const val = e.target.value;
              setSupervisorPin((prev) => {
                const next = [...prev];
                next[idx] = val;
                return next;
              });
            }}
          />
        ))}
      </div>
      <div className="flex items-center gap-space-sm">
        <ScreenDialogClose>
          <button
            onClick={handleAuthorizePin}
            className="flex-1 py-2.5 rounded-lg bg-primary text-white font-label-lg text-label-lg font-semibold hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 shadow-sm"
            type="button"
          >
            <span>Authorize Instant Completion</span>
          </button>
        </ScreenDialogClose>
        <ScreenDialogClose>
          <button onClick={() => {}} className="py-2.5 px-space-md rounded-lg bg-surface-container text-on-surface font-label-lg text-label-lg font-semibold hover:bg-surface-container-high transition-all" type="button">Dismiss</button>
        </ScreenDialogClose>
      </div>
    </div>
  );

  const panelObstaclemodal = (
    <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-space-lg shadow-xl">
      <div className="flex items-center gap-2 text-error mb-2">
        <Icon name="fmd_bad" className="text-[26px]" />
        <h4 className="font-headline-sm text-headline-sm text-error">Log Field Obstacle / Equipment Pause</h4>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">Notify the Agronomist Offtake Lead and machinery syndicate manager. This pauses the operational SLA stopwatch without penalty.</p>
      <div className="space-y-space-md mb-space-lg">
        <div>
          <label className="block text-label-sm font-label-sm font-semibold text-on-surface mb-1">Obstacle Category</label>
          <select
            value={obstacleType}
            onChange={(e) => setObstacleType(e.target.value)}
            className="w-full bg-surface-container-low text-body-sm font-body-sm text-on-surface rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option>Submerged Tree Stump / Root Ball Impact</option>
            <option>Rock Outcrop / Granite Slab &gt; 30cm</option>
            <option>Hydraulic Hose Puncture / Disc Bearing Play</option>
            <option>Severe Soil Waterlogging / Implement Bogged Down</option>
            <option>Unmapped Cadastral Boundary Encroachment</option>
          </select>
        </div>
        <div>
          <label className="block text-label-sm font-label-sm font-semibold text-on-surface mb-1">Operator Voice/Text Remark</label>
          <textarea
            value={obstacleNotes}
            onChange={(e) => setObstacleNotes(e.target.value)}
            className="w-full bg-surface-container-low text-body-sm font-body-sm text-on-surface rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Describe coordinate and whether tractor remains safely operable..."
            rows={3}
          />
        </div>
      </div>
      <div className="flex items-center gap-space-sm">
        <ScreenDialogClose>
          <button
            onClick={handleBroadcastIncident}
            className="flex-1 py-2.5 rounded-lg bg-error text-white font-label-lg text-label-lg font-semibold hover:bg-red-700 transition-all flex items-center justify-center gap-1.5 shadow-sm"
            type="button"
          >
            <Icon name="send" className="text-[20px]" />
            <span>Broadcast High-Priority Incident Flag</span>
          </button>
        </ScreenDialogClose>
        <ScreenDialogClose>
          <button onClick={() => {}} className="py-2.5 px-space-md rounded-lg bg-surface-container text-on-surface font-label-lg text-label-lg font-semibold hover:bg-surface-container-high transition-all" type="button">Cancel</button>
        </ScreenDialogClose>
      </div>
    </div>
  );

  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        {/* Header telemetry banner */}
        <div className="relative overflow-hidden bg-surface-container-lowest rounded-xl p-space-lg shadow-sm mb-space-lg">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-lg">
            <div className="flex flex-col gap-space-xs">
              <div className="flex flex-wrap items-center gap-space-sm">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-secondary-fixed text-on-secondary-fixed font-semibold">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" /> Active On-Site Job · Tillage &amp; Deep Ripping
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-surface-container text-on-surface-variant font-medium">
                  <Icon name="satellite_alt" className="text-[15px] text-secondary" /> RTK Fixed (±2.4cm Lat/Long)
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-surface-container text-on-surface-variant font-medium">
                  <Icon name="memory" className="text-[15px] text-primary-container" /> CANbus ISO 11783 Link Active
                </span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight mt-1">
                Machinery Operator Dispatch &amp; Field Proof-of-Work (PoW) Console <span className="font-body-md text-body-md text-outline font-normal ml-1">(§5.2 &amp; §8.6)</span>
              </h1>
              <div className="flex flex-wrap items-center gap-space-md text-body-sm font-body-sm text-on-surface-variant">
                <div className="flex items-center gap-1.5">
                  <Icon name="agriculture" className="text-[18px] text-secondary" />
                  <span className="font-semibold text-on-surface">John Deere 5075E 4WD (75 HP)</span>
                  <span className="text-outline">·</span>
                  <span>Baldan 3-Disc Heavy Plow</span>
                  <span className="px-1.5 py-0.5 rounded bg-surface-container text-label-sm font-label-sm font-bold text-primary">#JD-OYO-04</span>
                </div>
                <span className="text-outline">|</span>
                <div className="flex items-center gap-1.5">
                  <Icon name="badge" className="text-[18px] text-primary" />
                  <span className="font-semibold text-on-surface">Segun Oladipo</span>
                  <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-label-sm font-label-sm font-semibold">Tier 2 Certified Lead</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm bg-surface-container-low p-space-md rounded-xl">
              <div className="flex flex-col">
                <span className="text-label-sm font-label-sm text-outline uppercase tracking-wider">Engine RPM</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-metric-num text-headline-sm text-primary font-bold">1,850</span>
                  <span className="text-label-sm font-label-sm text-on-surface-variant">rpm</span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: "74%" }} />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-label-sm font-label-sm text-outline uppercase tracking-wider">Diesel Level</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-metric-num text-headline-sm text-primary font-bold">78%</span>
                  <span className="text-label-sm font-label-sm text-on-surface-variant">53.0 L</span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: "78%" }} />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-label-sm font-label-sm text-outline uppercase tracking-wider">Coolant Temp</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-metric-num text-headline-sm text-primary font-bold">82°C</span>
                  <span className="text-label-sm font-label-sm text-secondary font-semibold">Nominal</span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: "58%" }} />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-label-sm font-label-sm text-outline uppercase tracking-wider">Ground Speed</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-metric-num text-headline-sm text-primary font-bold">6.4</span>
                  <span className="text-label-sm font-label-sm text-on-surface-variant">km/h</span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-primary-container h-full rounded-full" style={{ width: "64%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Job Details Card */}
        {slot(slots, "job", (
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm mb-space-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-space-md mb-space-md gap-space-md">
              <div className="flex items-center gap-space-md">
                <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
                  <Icon name="lock" className="text-[28px]" />
                </div>
                <div>
                  <div className="flex items-center gap-space-xs">
                    <span className="text-label-sm font-label-sm uppercase tracking-wider font-semibold text-secondary">Verified Escrow Booking</span>
                    <span className="text-outline">·</span>
                    <span className="font-label-sm font-mono text-outline font-semibold">#BK-2026-0419</span>
                  </div>
                  <h2 className="font-headline-md text-headline-md text-primary mt-0.5">Oke-Ogun Pioneer Agrarian Estate</h2>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-space-md">
                <div className="px-space-md py-2 bg-surface-container-low rounded-lg text-right">
                  <span className="text-label-sm font-label-sm text-outline uppercase">Total Job Escrow Locked</span>
                  <div className="font-metric-num text-headline-md text-primary font-bold">₦229,400.00</div>
                  <span className="text-label-sm font-label-sm text-secondary font-medium">Providus Bank Escrow Custody</span>
                </div>
                <div className="px-space-md py-2 bg-surface-container-low rounded-lg text-right">
                  <span className="text-label-sm font-label-sm text-outline uppercase">Unit Benchmark Rate</span>
                  <div className="font-metric-num text-headline-md text-on-surface font-semibold">₦18,500 <span className="text-body-sm font-normal text-outline">/ Ha</span></div>
                  <span className="text-label-sm font-label-sm text-on-surface-variant">Standard Cross-Ridge Depth</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md pt-space-xs">
              <div className="p-space-md bg-surface-container-low rounded-lg flex flex-col justify-between">
                <div className="flex items-center justify-between text-outline text-label-sm font-label-sm">
                  <span>TARGET PARCEL</span>
                  <Icon name="map" className="text-[16px]" />
                </div>
                <div className="mt-2">
                  <div className="font-headline-sm text-headline-sm text-on-surface">Field 01 · North Ridge</div>
                  <span className="text-body-sm font-body-sm text-on-surface-variant">12.40 Total Cadastral Hectares</span>
                </div>
              </div>
              <div className="p-space-md bg-surface-container-low rounded-lg flex flex-col justify-between">
                <div className="flex items-center justify-between text-outline text-label-sm font-label-sm">
                  <span>TASK TYPE &amp; SPEC</span>
                  <Icon name="tune" className="text-[16px]" />
                </div>
                <div className="mt-2">
                  <div className="font-headline-sm text-headline-sm text-on-surface">2nd Stage Disc Plowing</div>
                  <span className="text-body-sm font-body-sm text-on-surface-variant">Min Target Depth: 25.0 cm</span>
                </div>
              </div>
              <div className="p-space-md bg-surface-container-low rounded-lg flex flex-col justify-between">
                <div className="flex items-center justify-between text-outline text-label-sm font-label-sm">
                  <span>SCHEDULE DISPATCH</span>
                  <Icon name="schedule" className="text-[16px]" />
                </div>
                <div className="mt-2">
                  <div className="font-headline-sm text-headline-sm text-on-surface">Today · 07:30 – 16:00 WAT</div>
                  <span className="text-body-sm font-body-sm text-secondary font-medium">On Schedule · 5h 20m Elapsed</span>
                </div>
              </div>
              <div className="p-space-md bg-surface-container-low rounded-lg flex flex-col justify-between">
                <div className="flex items-center justify-between text-outline text-label-sm font-label-sm">
                  <span>SWATH COMPLETION</span>
                  <span className="text-label-sm font-label-sm font-bold text-secondary">{photo3Captured ? "100% DONE" : "71% DONE"}</span>
                </div>
                <div className="mt-2">
                  <div className="font-headline-sm text-headline-sm text-secondary">{photo3Captured ? "12.4 / 12.4 Ha" : "8.8 / 12.4 Ha"}</div>
                  <div className="w-full bg-surface-container h-2 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-secondary h-full rounded-full transition-all duration-500" style={{ width: photo3Captured ? "100%" : "71%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Safety Checklist and GPS Map Row */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg mb-space-lg">
          <div className="xl:col-span-5 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-space-sm mb-space-md">
                <div className="flex items-center gap-2">
                  <Icon name="fact_check" className="text-secondary text-[22px]" />
                  <h3 className="font-headline-sm text-headline-sm text-primary">Pre-Operation Safety Checklist</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-label-sm font-label-sm font-bold">5/5 Verified</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">Mandatory ISO 4254-1 farm implement pre-ignition checks completed and signed off prior to engine mobilization.</p>
              <div className="space-y-space-sm" id="preChecklistGroup">
                <div
                  onClick={() => setChecklist((c) => ({ ...c, oil: !c.oil }))}
                  className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low transition-colors hover:bg-surface-container cursor-pointer"
                >
                  <div className="flex items-center gap-space-sm">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${checklist.oil ? "bg-secondary" : "bg-surface-container-highest text-outline"}`}>
                      <Icon name="check" className="text-[16px]" />
                    </span>
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg font-semibold text-on-surface">Engine Oil &amp; Coolant Level</span>
                      <span className="font-body-sm text-label-sm text-outline">Viscosity 15W-40 · Fluid dipstick at max mark</span>
                    </div>
                  </div>
                  <span className="text-label-sm font-label-sm font-semibold text-secondary">{checklist.oil ? "OK 07:12" : "UNCHECKED"}</span>
                </div>
                <div
                  onClick={() => setChecklist((c) => ({ ...c, hydraulic: !c.hydraulic }))}
                  className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low transition-colors hover:bg-surface-container cursor-pointer"
                >
                  <div className="flex items-center gap-space-sm">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${checklist.hydraulic ? "bg-secondary" : "bg-surface-container-highest text-outline"}`}>
                      <Icon name="check" className="text-[16px]" />
                    </span>
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg font-semibold text-on-surface">Hydraulic Disc Cylinder Pressure</span>
                      <span className="font-body-sm text-label-sm text-outline">2,400 PSI gauge verified · Zero line leakage</span>
                    </div>
                  </div>
                  <span className="text-label-sm font-label-sm font-semibold text-secondary">{checklist.hydraulic ? "OK 07:15" : "UNCHECKED"}</span>
                </div>
                <div
                  onClick={() => setChecklist((c) => ({ ...c, fuel: !c.fuel }))}
                  className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low transition-colors hover:bg-surface-container cursor-pointer"
                >
                  <div className="flex items-center gap-space-sm">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${checklist.fuel ? "bg-secondary" : "bg-surface-container-highest text-outline"}`}>
                      <Icon name="check" className="text-[16px]" />
                    </span>
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg font-semibold text-on-surface">Fuel Water Separator Purged</span>
                      <span className="font-body-sm text-label-sm text-outline">Sediment bowl drained clean of condensation</span>
                    </div>
                  </div>
                  <span className="text-label-sm font-label-sm font-semibold text-secondary">{checklist.fuel ? "OK 07:18" : "UNCHECKED"}</span>
                </div>
                <div
                  onClick={() => setChecklist((c) => ({ ...c, rops: !c.rops }))}
                  className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low transition-colors hover:bg-surface-container cursor-pointer"
                >
                  <div className="flex items-center gap-space-sm">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${checklist.rops ? "bg-secondary" : "bg-surface-container-highest text-outline"}`}>
                      <Icon name="check" className="text-[16px]" />
                    </span>
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg font-semibold text-on-surface">ROPS Canopy &amp; Seatbelt Lock</span>
                      <span className="font-body-sm text-label-sm text-outline">Latch engaged · Rollbar pins fastened</span>
                    </div>
                  </div>
                  <span className="text-label-sm font-label-sm font-semibold text-secondary">{checklist.rops ? "OK 07:22" : "UNCHECKED"}</span>
                </div>
                <div
                  onClick={() => setChecklist((c) => ({ ...c, extinguisher: !c.extinguisher }))}
                  className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low transition-colors hover:bg-surface-container cursor-pointer"
                >
                  <div className="flex items-center gap-space-sm">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${checklist.extinguisher ? "bg-secondary" : "bg-surface-container-highest text-outline"}`}>
                      <Icon name="check" className="text-[16px]" />
                    </span>
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg font-semibold text-on-surface">Dry Powder Fire Extinguisher (4kg)</span>
                      <span className="font-body-sm text-label-sm text-outline">Pressure dial in green zone · Pin sealed</span>
                    </div>
                  </div>
                  <span className="text-label-sm font-label-sm font-semibold text-secondary">{checklist.extinguisher ? "OK 07:25" : "UNCHECKED"}</span>
                </div>
              </div>
            </div>
            <div className="mt-space-md pt-space-sm bg-surface-container-low rounded-lg p-space-sm flex items-center justify-between">
              <div className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant">
                <Icon name="verified_user" className="text-[18px] text-primary" />
                <span>Operator Digital Signature Token:</span>
              </div>
              <span className="font-mono text-label-sm font-label-sm text-primary font-bold">SO-8921-OKG</span>
            </div>
          </div>
          <div className="xl:col-span-7 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-sm mb-space-md gap-2">
                <div className="flex items-center gap-2">
                  <Icon name="polyline" className="text-secondary text-[22px]" />
                  <h3 className="font-headline-sm text-headline-sm text-primary">Live GPS Tillage Swath &amp; Cadastral Boundary</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportTelemetry}
                    className="inline-flex items-center gap-1 text-label-sm font-label-sm px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-primary font-semibold transition-colors"
                    type="button"
                  >
                    <Icon name="download" className="text-[14px]" />
                    <span>NMEA Export</span>
                  </button>
                  <span className="inline-flex items-center gap-1 text-label-sm font-label-sm px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> 0 Out-of-bounds Traversal
                  </span>
                  <span className="text-label-sm font-label-sm text-outline font-mono">RTK 10Hz Sync</span>
                </div>
              </div>
              <div className="relative w-full h-80 rounded-xl overflow-hidden bg-inverse-surface">
                <div className="w-full h-full bg-cover bg-center opacity-60" data-location="Oke-Ogun, Oyo State, Nigeria" style={{ backgroundImage: "url('/images/screens/e491d0c70573.webp')" }} />
                <svg className="absolute inset-0 w-full h-full pointer-events-none" fill="none" preserveAspectRatio="none" viewBox="0 0 700 320">
                  <polygon fill="#134e33" fillOpacity="0.12" points="40,30 650,25 670,290 80,285" stroke="#6cf8bb" strokeDasharray="6 4" strokeWidth="2.5" />
                  <g opacity="0.85" stroke="#006c49" strokeLinecap="round" strokeWidth="9">
                    <line x1="60" x2="630" y1="50" y2="48" />
                    <line x1="65" x2="635" y1="72" y2="70" />
                    <line x1="70" x2="638" y1="94" y2="92" />
                    <line x1="73" x2="642" y1="116" y2="114" />
                    <line x1="76" x2="646" y1="138" y2="136" />
                    <line x1="80" x2="650" y1="160" y2="158" />
                    <line x1="83" x2="653" y1="182" y2="180" />
                    <line x1="86" x2="656" y1="204" y2="202" />
                    <line x1="90" x2={photo3Captured ? "658" : "520"} y1="226" y2="225" />
                  </g>
                  {!photo3Captured && (
                    <line stroke="#ff9939" strokeDasharray="4 2" strokeWidth="7" x1="520" x2="658" y1="225" y2="224" />
                  )}
                  <g transform={`translate(${photo3Captured ? "658" : "520"}, 225)`}>
                    <circle fill="#003620" fillOpacity="0.5" r="14" />
                    <circle fill="#6cf8bb" r="7" />
                    <line markerEnd="url(#arrow)" stroke="#ffffff" strokeWidth="2" x1="0" x2="16" y1="0" y2="0" />
                  </g>
                </svg>
                <div className="absolute top-3 left-3 bg-surface-container-lowest/95 backdrop-blur-md px-space-md py-2 rounded-lg shadow-sm flex items-center gap-space-md">
                  <div>
                    <span className="text-label-sm font-label-sm text-outline block">VERIFIED WORK AREA</span>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">{photo3Captured ? "12.40 Ha" : "8.82 Ha"}</span>
                  </div>
                  <div className="h-6 w-px bg-surface-container" />
                  <div>
                    <span className="text-label-sm font-label-sm text-outline block">REMAINING AREA</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">{photo3Captured ? "0.00 Ha" : "3.58 Ha"}</span>
                  </div>
                </div>
                <div className="absolute bottom-3 right-3 bg-surface-container-lowest/95 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-2">
                  <Icon name="route" className="text-secondary text-[16px]" />
                  <span className="text-label-sm font-label-sm font-medium text-on-surface">Deadhead Yard Transit: <strong className="text-primary">2.1 km</strong></span>
                </div>
                <div className="absolute bottom-3 left-3 bg-primary/90 text-on-primary px-3 py-1.5 rounded-lg text-label-sm font-label-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-ping" />
                  <span>Broadcasting NMEA: Lat 8.3241° N · Lon 3.5822° E</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-space-sm mt-space-md pt-space-xs">
              <div className="p-2.5 rounded-lg bg-surface-container-low text-center">
                <span className="text-label-sm font-label-sm text-outline block">Implement Width</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">1.95 m</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-container-low text-center">
                <span className="text-label-sm font-label-sm text-outline block">Average Overlap</span>
                <span className="font-headline-sm text-headline-sm text-secondary font-semibold">4.8 cm</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-container-low text-center">
                <span className="text-label-sm font-label-sm text-outline block">Tillage Efficiency</span>
                <span className="font-headline-sm text-headline-sm text-primary font-semibold">1.65 Ha/hr</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cryptographic Proof-of-Work Photos and Settlement Sign-Off */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg mb-space-lg">
          <div className="xl:col-span-7 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-sm mb-space-md gap-2">
                <div className="flex items-center gap-2">
                  <Icon name="photo_camera" className="text-secondary text-[22px]" />
                  <h3 className="font-headline-sm text-headline-sm text-primary">Cryptographic Proof-of-Work Photos</h3>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-container text-on-primary-container text-label-sm font-label-sm font-semibold">
                  <Icon name="verified" className="text-[15px]" />
                  <span>EXIF SHA-256 Validated</span>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
                Mandatory tripartite photographic evidence required under Master Agreement §8.6. Every capture binds hardware timestamp, GPS RTK coordinates, and lens elevation.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                {/* Photo 1 */}
                <div className="group relative rounded-xl overflow-hidden bg-surface-container flex flex-col">
                  <div className="relative h-44 w-full">
                    <img className="w-full h-full object-cover" data-alt="Agricultural tractor stationed before plowing" src="/images/screens/334155a70fe8.webp" alt="Pre-tillage" loading="lazy" decoding="async" />
                    <div className="absolute top-2 left-2 bg-secondary text-white text-label-sm font-label-sm font-bold px-2 py-0.5 rounded shadow">1. PRE-TILLAGE</div>
                    <div className="absolute top-2 right-2 bg-primary/80 backdrop-blur-sm text-white rounded-full p-1">
                      <Icon name="check_circle" className="text-[16px] block" />
                    </div>
                  </div>
                  <div className="p-space-sm bg-surface-container-low flex flex-col gap-1">
                    <span className="text-label-sm font-label-sm font-bold text-on-surface">Baseline Vegetation</span>
                    <div className="text-label-sm font-label-sm text-on-surface-variant flex items-center gap-1">
                      <Icon name="schedule" className="text-[14px] text-outline" />
                      <span>07:42 WAT</span>
                    </div>
                    <div className="text-label-sm font-label-sm text-outline font-mono truncate">8.3241°N, 3.5822°E</div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-label-sm font-label-sm font-semibold text-secondary">Verified Clean</span>
                      <button onClick={() => handleViewExif("Photo 1 (Pre-Tillage)")} className="text-label-sm font-label-sm text-primary hover:underline font-semibold" type="button">View EXIF</button>
                    </div>
                  </div>
                </div>

                {/* Photo 2 */}
                <div className="group relative rounded-xl overflow-hidden bg-surface-container flex flex-col">
                  <div className="relative h-44 w-full">
                    <img className="w-full h-full object-cover" data-alt="Furrow depth gauge ruler in soil" src="/images/screens/8a02f9736f56.webp" alt="Furrow Depth" loading="lazy" decoding="async" />
                    <div className="absolute top-2 left-2 bg-secondary text-white text-label-sm font-label-sm font-bold px-2 py-0.5 rounded shadow">2. DEPTH GAUGE</div>
                    <div className="absolute top-2 right-2 bg-primary/80 backdrop-blur-sm text-white rounded-full p-1">
                      <Icon name="check_circle" className="text-[16px] block" />
                    </div>
                  </div>
                  <div className="p-space-sm bg-surface-container-low flex flex-col gap-1">
                    <span className="text-label-sm font-label-sm font-bold text-on-surface">Furrow Depth Ruler</span>
                    <div className="text-label-sm font-label-sm text-on-surface-variant flex items-center gap-1">
                      <Icon name="straighten" className="text-[14px] text-outline" />
                      <span>26.0 cm (Target ≥25cm)</span>
                    </div>
                    <div className="text-label-sm font-label-sm text-outline font-mono truncate">8.3248°N, 3.5831°E</div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-label-sm font-label-sm font-semibold text-secondary">Spec Met (+1cm)</span>
                      <button onClick={() => handleViewExif("Photo 2 (Depth Gauge)")} className="text-label-sm font-label-sm text-primary hover:underline font-semibold" type="button">View EXIF</button>
                    </div>
                  </div>
                </div>

                {/* Photo 3: Dynamic State */}
                {photo3Captured ? (
                  <div className="group relative rounded-xl overflow-hidden bg-surface-container flex flex-col">
                    <div className="relative h-44 w-full">
                      <img className="w-full h-full object-cover" data-alt="Post-Tillage Horizon pan across field" src="/images/screens/e261f727af8b.webp" alt="Post-Tillage" loading="lazy" decoding="async" />
                      <div className="absolute top-2 left-2 bg-secondary text-white text-label-sm font-label-sm font-bold px-2 py-0.5 rounded shadow">3. HORIZON PAN</div>
                      <div className="absolute top-2 right-2 bg-primary/80 backdrop-blur-sm text-white rounded-full p-1">
                        <Icon name="check_circle" className="text-[16px] block" />
                      </div>
                    </div>
                    <div className="p-space-sm bg-surface-container-low flex flex-col gap-1">
                      <span className="text-label-sm font-label-sm font-bold text-on-surface">12.4 Ha Boundary Pan</span>
                      <div className="text-label-sm font-label-sm text-on-surface-variant flex items-center gap-1">
                        <Icon name="schedule" className="text-[14px] text-outline" />
                        <span>13:10 WAT (Sealed)</span>
                      </div>
                      <div className="text-label-sm font-label-sm text-outline font-mono truncate">8.3255°N, 3.5840°E</div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-label-sm font-label-sm font-semibold text-secondary">PoW Sealed OK</span>
                        <button onClick={() => handleViewExif("Photo 3 (Horizon Pan)")} className="text-label-sm font-label-sm text-primary hover:underline font-semibold" type="button">View EXIF</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden bg-surface-container-low flex flex-col justify-center items-center p-space-md text-center min-h-[220px]">
                    <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-outline mb-2">
                      <Icon name="add_a_photo" className="text-[28px]" />
                    </div>
                    <span className="font-headline-sm text-headline-sm text-on-surface">3. Post-Tillage Horizon</span>
                    <p className="text-label-sm font-label-sm text-on-surface-variant mt-1 mb-space-md">Final wide-angle pan required upon reaching 12.4 Ha cadastral boundary mark.</p>
                    <ScreenDialog title="PoW Camera Sensor Ready" side="center" panel={panelPhotomodal}>
                      <button onClick={() => {}} className="w-full py-2 px-3 rounded-lg bg-primary text-white font-label-lg text-label-lg font-semibold hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 shadow-sm" type="button">
                        <Icon name="photo_camera" className="text-[18px]" />
                        <span>Launch Camera</span>
                      </button>
                    </ScreenDialog>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-space-md p-space-sm bg-surface-container-low rounded-lg flex items-center gap-2">
              <Icon name="encrypted" className="text-[18px] text-tertiary-container" />
              <span className="text-label-sm font-label-sm text-on-surface-variant">Immutable cryptographic receipt recorded on decentralized PoW Ledger upon completing Photo 3.</span>
            </div>
          </div>
          <div className="xl:col-span-5 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-space-sm mb-space-md">
                <div className="flex items-center gap-2">
                  <Icon name="payments" className="text-secondary text-[22px]" />
                  <h3 className="font-headline-sm text-headline-sm text-primary">Job Settlement &amp; Sign-Off</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">Stage 4 / 5</span>
              </div>
              <div className="bg-surface-container-low rounded-xl p-space-md mb-space-md space-y-space-sm">
                <div className="flex items-center justify-between text-body-sm font-body-sm">
                  <span className="text-on-surface-variant">Total Target Workload:</span>
                  <span className="font-semibold text-on-surface">12.40 Hectares</span>
                </div>
                <div className="flex items-center justify-between text-body-sm font-body-sm">
                  <span className="text-on-surface-variant">Current RTK Swath Cleared:</span>
                  <span className="font-semibold text-secondary">{photo3Captured ? "12.40 Hectares (100.0%)" : "8.82 Hectares (71.1%)"}</span>
                </div>
                <div className="flex items-center justify-between text-body-sm font-body-sm">
                  <span className="text-on-surface-variant">Diesel Fuel Burned:</span>
                  <span className="font-semibold text-on-surface">38.5 Liters (3.12 L/Ha)</span>
                </div>
                <div className="flex items-center justify-between text-body-sm font-body-sm">
                  <span className="text-on-surface-variant">Total Operating Time:</span>
                  <span className="font-semibold text-on-surface">5 hrs 20 mins</span>
                </div>
                <div className="pt-space-xs flex items-center justify-between">
                  <span className="font-label-lg text-label-lg font-bold text-primary">Net Operator Payout:</span>
                  <span className="font-headline-sm text-headline-sm font-bold text-primary">₦229,400.00</span>
                </div>
              </div>
              <div className="space-y-space-sm mb-space-md">
                <ScreenDialog title="On-Site Client PIN Sign-Off" side="center" panel={panelPinmodal}>
                  <button onClick={() => {}} className="w-full py-2.5 px-space-md rounded-lg bg-primary text-white font-label-lg text-label-lg font-semibold hover:bg-primary-container transition-all flex items-center justify-center gap-2 shadow-sm" type="button">
                    <Icon name="pin" className="text-[20px]" />
                    <span>Request Farmer / Supervisor On-Site PIN</span>
                  </button>
                </ScreenDialog>
                <ScreenDialog title="Log Field Obstacle / Equipment Pause" side="center" panel={panelObstaclemodal}>
                  <button onClick={() => {}} className="w-full py-2.5 px-space-md rounded-lg bg-surface-container-low text-on-surface font-label-lg text-label-lg font-semibold hover:bg-surface-container transition-all flex items-center justify-center gap-2" type="button">
                    <Icon name="warning" className="text-[20px] text-error" />
                    <span>Report Field Obstacle / Equipment Breakdown</span>
                  </button>
                </ScreenDialog>
              </div>
            </div>
            <div className="bg-secondary-fixed/30 rounded-xl p-space-md">
              <div className="flex items-start gap-2.5">
                <Icon name="info" className="text-secondary text-[20px] mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-label-sm font-semibold text-on-secondary-fixed uppercase tracking-wider">Statutory 48-Hour Auto-Settlement Notice</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    Upon final supervisor PIN entry or submission of complete 3-photo PoW, the client has <strong>48 hours</strong> to lodge an agronomic dispute. If no dispute is filed, escrowed funds automatically release to Segun Oladipo’s registered Providus / Wema Bank commercial payout account.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
