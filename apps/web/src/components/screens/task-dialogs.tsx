"use client";

import { useState } from "react";
import { Icon } from "@/components/ds/icon";
import { ScreenDialogClose, showScreenToast } from "@/components/ds/screen-dialog";
import { createFarmTask, createFarmWorker, assignWorkersToTask } from "@/actions/farm-tasks";

export interface CycleOpOption {
  id: string;
  crop_cycle_id: string;
  name: string;
  operation_type?: string;
  stage?: string;
  scheduled_date?: string;
  required_inputs?: any;
  crop_name?: string;
  variety?: string;
  farm_id?: string;
  plot_id?: string;
  plot_name?: string;
}

export interface TaskDialogProps {
  farms: Array<{ id: string; name: string }>;
  plots: Array<{ id: string; farm_id: string; name: string; area_ha?: number | null }>;
  workers: Array<{ id: string; farm_id: string; full_name: string; role: string; daily_rate_minor?: number }>;
  cycleOperations?: CycleOpOption[];
}

export function ScheduleTaskModal({ farms, plots, workers, cycleOperations = [] }: TaskDialogProps) {
  const [selectedFarm, setSelectedFarm] = useState<string>(farms[0]?.id || "");
  const [selectedPlot, setSelectedPlot] = useState<string>("");
  const [cycleId, setCycleId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [priority, setPriority] = useState<string>("medium");
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [directCostMinor, setDirectCostMinor] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedCycleOpId, setSelectedCycleOpId] = useState<string>("");

  const farmPlots = plots.filter((p) => !selectedFarm || p.farm_id === selectedFarm);
  const farmWorkers = workers.filter((w) => !selectedFarm || w.farm_id === selectedFarm);

  const handleCycleOpSelect = (opId: string) => {
    setSelectedCycleOpId(opId);
    if (!opId) return;

    const op = cycleOperations.find((c) => c.id === opId);
    if (!op) return;

    setTitle(op.name);
    if (op.farm_id) setSelectedFarm(op.farm_id);
    if (op.plot_id) setSelectedPlot(op.plot_id);
    if (op.crop_cycle_id) setCycleId(op.crop_cycle_id);
    if (op.scheduled_date) setDueDate(op.scheduled_date);

    let desc = `[Plant Cycle: ${op.crop_name || "Crop"} (${op.variety || "Active"})] Stage: ${op.stage || "Field"}.`;
    if (Array.isArray(op.required_inputs) && op.required_inputs.length > 0) {
      const inputsText = op.required_inputs
        .map((i: any) => `${i.standardQuantityPerHa || i.quantity || ""} ${i.unit || ""} ${i.itemName || ""}`.trim())
        .join(", ");
      desc += ` Inputs: ${inputsText}`;
    }
    setDescription(desc);
    showScreenToast(`Auto-populated from planting cycle: ${op.name}`);
  };

  const handleToggleWorker = (workerId: string) => {
    if (selectedWorkerIds.includes(workerId)) {
      setSelectedWorkerIds(selectedWorkerIds.filter((id) => id !== workerId));
    } else {
      setSelectedWorkerIds([...selectedWorkerIds, workerId]);
    }
  };

  const handleSelectAllWorkers = () => {
    if (selectedWorkerIds.length === farmWorkers.length) {
      setSelectedWorkerIds([]);
    } else {
      setSelectedWorkerIds(farmWorkers.map((w) => w.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFarm) {
      showScreenToast("Please select a target farm.");
      return;
    }
    if (!title.trim()) {
      showScreenToast("Please enter an operation title.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("farm_id", selectedFarm);
      if (selectedPlot) formData.set("plot_id", selectedPlot);
      if (cycleId) formData.set("crop_cycle_id", cycleId);
      formData.set("title", title.trim());
      formData.set("priority", priority);
      formData.set("due_date", dueDate);
      if (directCostMinor) formData.set("direct_cost_minor", directCostMinor);
      if (description.trim()) formData.set("description", description.trim());

      selectedWorkerIds.forEach((id) => {
        formData.append("assigned_worker_ids", id);
      });
      if (selectedWorkerIds[0]) {
        formData.set("assigned_worker_id", selectedWorkerIds[0]);
      }

      await createFarmTask(formData);
      showScreenToast(`Operation scheduled successfully with ${selectedWorkerIds.length} worker${selectedWorkerIds.length === 1 ? "" : "s"}.`);
      // Reset form
      setTitle("");
      setDescription("");
      setSelectedWorkerIds([]);
      setSelectedCycleOpId("");
    } catch {
      showScreenToast("Failed to schedule task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-xl max-w-xl w-full mx-4 shadow-xl space-y-space-md max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between pb-2 border-b border-surface-container">
        <div className="flex items-center gap-space-xs">
          <Icon name="add_task" className="text-primary text-2xl" />
          <h3 className="font-headline-md text-headline-md text-primary font-bold">
            Schedule Field Operation / Task
          </h3>
        </div>
        <ScreenDialogClose className="p-1 text-on-surface-variant hover:text-on-surface">
          <Icon name="close" />
        </ScreenDialogClose>
      </div>

      {cycleOperations.length > 0 && (
        <div className="p-3 rounded-lg bg-primary-container/20 border border-primary/20 space-y-1.5">
          <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
            <Icon name="psychology" className="text-sm" />
            <span>Auto-populate from Active Planting Cycles ({cycleOperations.length} Available)</span>
          </div>
          <select
            value={selectedCycleOpId}
            onChange={(e) => handleCycleOpSelect(e.target.value)}
            className="w-full h-9 px-3 bg-surface-container-lowest rounded-md text-on-surface font-body-sm text-body-sm border border-primary/30 focus:outline-none"
          >
            <option value="">-- Click to choose from your current planting cycles --</option>
            {cycleOperations.map((op) => (
              <option key={op.id} value={op.id}>
                {op.crop_name ? `[${op.crop_name}] ` : ""}{op.name} • {op.plot_name || "Field"} • (Due: {op.scheduled_date || "Upcoming"})
              </option>
            ))}
          </select>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              Target Farm <span className="text-error">*</span>
            </label>
            <select
              value={selectedFarm}
              onChange={(e) => setSelectedFarm(e.target.value)}
              required
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-sm border border-outline-variant focus:outline-none"
            >
              {farms.length === 0 && <option value="">No farms registered</option>}
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">Plot Location</label>
            <select
              value={selectedPlot}
              onChange={(e) => setSelectedPlot(e.target.value)}
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-sm border border-outline-variant focus:outline-none"
            >
              <option value="">Whole Farm (No specific plot)</option>
              {farmPlots.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.area_ha ? `(${p.area_ha} Ha)` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1">
            Operation Title <span className="text-error">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            type="text"
            placeholder="e.g. Basal NPK Application, Weed clearance, Irrigation inspection"
            required
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-sm border border-outline-variant focus:outline-none"
          />
        </div>

        {/* Multi-Staff Crew Assignment Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-on-surface">
              Assign Staff / Crew ({selectedWorkerIds.length} Selected)
            </label>
            {farmWorkers.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllWorkers}
                className="text-xs text-primary font-medium hover:underline"
              >
                {selectedWorkerIds.length === farmWorkers.length ? "Deselect All" : "Select All Crew"}
              </button>
            )}
          </div>

          {farmWorkers.length === 0 ? (
            <div className="p-3 rounded-lg bg-surface-container-low text-xs text-on-surface-variant flex items-center justify-between">
              <span>No workers registered for this farm yet.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-surface-container-low rounded-lg border border-outline-variant/30">
              {farmWorkers.map((w) => {
                const isChecked = selectedWorkerIds.includes(w.id);
                return (
                  <label
                    key={w.id}
                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors text-xs font-medium ${
                      isChecked
                        ? "bg-secondary-container/60 text-on-secondary-container font-semibold"
                        : "hover:bg-surface-container text-on-surface"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleWorker(w.id)}
                      className="rounded text-primary focus:ring-primary w-4 h-4"
                    />
                    <div className="flex flex-col truncate">
                      <span className="truncate">{w.full_name}</span>
                      <span className="text-[10px] text-on-surface-variant capitalize">{w.role.replace(/_/g, " ")}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-sm border border-outline-variant focus:outline-none"
            >
              <option value="low">Low (Routine)</option>
              <option value="medium">Medium (Standard)</option>
              <option value="high">High (Time-Sensitive)</option>
              <option value="urgent">Urgent (Immediate Hold)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">Target Execution Date</label>
            <input
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              type="date"
              required
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-sm border border-outline-variant focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1">Direct Budget / Labor Cost (Minor / Kobo)</label>
          <input
            value={directCostMinor}
            onChange={(e) => setDirectCostMinor(e.target.value)}
            type="number"
            placeholder="e.g. 500000 (₦5,000)"
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-sm border border-outline-variant focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1">Instructions / Description / Inputs</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Equipment needed, safety guardrails, PPE, or planting inputs required..."
            className="w-full p-2.5 bg-surface-container-low rounded-lg text-on-surface font-body-sm border border-outline-variant focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-surface-container">
          <ScreenDialogClose className="px-4 py-2 bg-surface-container text-on-surface rounded-lg font-label-md text-label-md">
            Cancel
          </ScreenDialogClose>
          <button
            type="submit"
            disabled={isSubmitting || farms.length === 0}
            className="px-5 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary-container font-semibold shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? "Scheduling..." : "Schedule Task"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function WorkerRegisterModal({ farms }: { farms: Array<{ id: string; name: string }> }) {
  const [farmId, setFarmId] = useState<string>(farms[0]?.id || "");
  const [fullName, setFullName] = useState<string>("");
  const [role, setRole] = useState<string>("labourer");
  const [employmentType, setEmploymentType] = useState<string>("permanent");
  const [phone, setPhone] = useState<string>("");
  const [dailyRateMinor, setDailyRateMinor] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!farmId) {
      showScreenToast("Please select a target farm enterprise.");
      return;
    }
    if (!fullName.trim()) {
      showScreenToast("Worker full name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("farm_id", farmId);
      formData.set("full_name", fullName.trim());
      formData.set("role", role);
      formData.set("employment_type", employmentType);
      if (phone.trim()) formData.set("phone", phone.trim());
      if (dailyRateMinor) formData.set("daily_rate_minor", dailyRateMinor);

      await createFarmWorker(formData);
      showScreenToast(`Registered worker ${fullName.trim()} successfully!`);
      setFullName("");
      setPhone("");
      setDailyRateMinor("");
    } catch {
      showScreenToast("Could not register worker. Please check connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-xl max-w-xl w-full mx-4 shadow-xl space-y-space-md">
      <div className="flex items-center justify-between pb-2 border-b border-surface-container">
        <div className="flex items-center gap-space-xs">
          <Icon name="person_add" className="text-secondary text-2xl" />
          <h3 className="font-headline-md text-headline-md text-primary font-bold">
            Add Farm Worker / Labourer
          </h3>
        </div>
        <ScreenDialogClose className="p-1 text-on-surface-variant hover:text-on-surface">
          <Icon name="close" />
        </ScreenDialogClose>
      </div>

      {farms.length === 0 ? (
        <div className="p-4 rounded-lg bg-error-container/20 border border-error/30 text-center space-y-2">
          <p className="text-sm font-semibold text-error">No farm enterprise found.</p>
          <p className="text-xs text-on-surface-variant">You must create a farm before adding staff or workers.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              Farm Enterprise <span className="text-error">*</span>
            </label>
            <select
              value={farmId}
              onChange={(e) => setFarmId(e.target.value)}
              required
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-sm border border-outline-variant focus:outline-none"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              Worker Full Name <span className="text-error">*</span>
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              type="text"
              placeholder="e.g. Babatunde Gbadamosi"
              required
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-sm border border-outline-variant focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Role / Job Title</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-sm border border-outline-variant focus:outline-none"
              >
                <option value="labourer">Field Labourer</option>
                <option value="operator">Tractor / Machinery Operator</option>
                <option value="agronomist">Field Agronomist</option>
                <option value="storekeeper">Inventory Storekeeper</option>
                <option value="farm_manager">Farm Supervisor / Manager</option>
                <option value="vet_assistant">Veterinary Assistant</option>
                <option value="other">Other Specialist</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Employment Type</label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-sm border border-outline-variant focus:outline-none"
              >
                <option value="permanent">Permanent / Full-Time</option>
                <option value="seasonal">Seasonal</option>
                <option value="casual">Casual Daily Worker</option>
                <option value="contractor">Contractor</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Phone Number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                placeholder="e.g. +234 803 123 4567"
                className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-sm border border-outline-variant focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Daily Wage / Rate (Minor / Kobo)</label>
              <input
                value={dailyRateMinor}
                onChange={(e) => setDailyRateMinor(e.target.value)}
                type="number"
                placeholder="e.g. 350000 (₦3,500/day)"
                className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-sm border border-outline-variant focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-surface-container">
            <ScreenDialogClose className="px-4 py-2 bg-surface-container text-on-surface rounded-lg font-label-md text-label-md">
              Cancel
            </ScreenDialogClose>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-secondary text-on-secondary rounded-lg font-label-md text-label-md hover:bg-primary font-semibold shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Add Worker"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export function AssignStaffModal({
  taskId,
  taskTitle,
  currentWorkerIds = [],
  workers = [],
}: {
  taskId: string;
  taskTitle: string;
  currentWorkerIds?: string[];
  workers: Array<{ id: string; full_name: string; role: string }>;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(currentWorkerIds);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const toggleWorker = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("task_id", taskId);
      selectedIds.forEach((id) => formData.append("assigned_worker_ids", id));
      if (selectedIds[0]) formData.set("assigned_worker_id", selectedIds[0]);

      await assignWorkersToTask(formData);
      showScreenToast(`Updated staff assignment for ${taskTitle}.`);
    } catch {
      showScreenToast("Failed to assign staff.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-md max-w-md w-full mx-4 shadow-2xl space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-surface-container">
        <div className="flex items-center gap-2">
          <Icon name="group_add" className="text-primary text-xl" />
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface truncate">
            Assign Staff to: {taskTitle}
          </h3>
        </div>
        <ScreenDialogClose className="p-1 text-on-surface-variant hover:text-on-surface">
          <Icon name="close" />
        </ScreenDialogClose>
      </div>

      <p className="text-xs text-on-surface-variant">
        Select one or more farm workers to assign to this operation:
      </p>

      <div className="max-h-60 overflow-y-auto space-y-1.5 p-1">
        {workers.length === 0 ? (
          <p className="text-xs text-on-surface-variant py-4 text-center">No farm workers available.</p>
        ) : (
          workers.map((w) => {
            const isChecked = selectedIds.includes(w.id);
            return (
              <label
                key={w.id}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs font-medium border ${
                  isChecked
                    ? "bg-secondary-container/50 border-secondary text-on-secondary-container font-semibold"
                    : "bg-surface-container-low border-outline-variant/30 text-on-surface hover:bg-surface-container"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleWorker(w.id)}
                    className="rounded text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>{w.full_name}</span>
                </div>
                <span className="text-[10px] text-on-surface-variant uppercase px-2 py-0.5 rounded bg-surface-container">
                  {w.role.replace(/_/g, " ")}
                </span>
              </label>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-surface-container">
        <span className="text-xs font-semibold text-primary">{selectedIds.length} worker{selectedIds.length === 1 ? "" : "s"} assigned</span>
        <div className="flex gap-2">
          <ScreenDialogClose className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface text-label-sm font-medium">
            Cancel
          </ScreenDialogClose>
          <ScreenDialogClose>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-primary text-on-primary text-label-sm font-semibold hover:bg-primary-container"
            >
              {isSubmitting ? "Saving..." : "Apply Assignment"}
            </button>
          </ScreenDialogClose>
        </div>
      </div>
    </div>
  );
}
