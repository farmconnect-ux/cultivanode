import { Badge } from "@/components/ui";

export type LifecycleStage =
  | "requested"
  | "matching"
  | "accepted"
  | "confirmed"
  | "arrived"
  | "started"
  | "proof_submitted"
  | "farmer_confirmed"
  | "completed";

const STAGES: { id: LifecycleStage; label: string; icon: string }[] = [
  { id: "requested", label: "Requested", icon: "📝" },
  { id: "matching", label: "Matching", icon: "🔍" },
  { id: "accepted", label: "Provider Accepted", icon: "🤝" },
  { id: "confirmed", label: "Confirmed", icon: "📅" },
  { id: "arrived", label: "Provider Arrived", icon: "📍" },
  { id: "started", label: "Job Started", icon: "🚜" },
  { id: "proof_submitted", label: "Proof Submitted", icon: "📸" },
  { id: "farmer_confirmed", label: "Farmer Sign-Off", icon: "✍️" },
  { id: "completed", label: "Completed", icon: "✅" },
];

export function JobLifecycleTracker({
  status,
  hasCheckedIn,
  hasProof,
  isDisputed,
  isCompleted,
}: {
  status: string;
  hasCheckedIn?: boolean;
  hasProof?: boolean;
  isDisputed?: boolean;
  isCompleted?: boolean;
}) {
  // Determine current active step index (0 to 8)
  let currentIndex = 0;

  if (isDisputed) {
    currentIndex = 6; // At proof / review stage
  } else if (isCompleted || status === "completed") {
    currentIndex = 8;
  } else if (status === "confirmed") {
    currentIndex = 7;
  } else if (status === "awaiting_confirmation" || hasProof) {
    currentIndex = 6;
  } else if (status === "in_progress") {
    currentIndex = hasCheckedIn ? 5 : 4;
  } else if (status === "accepted") {
    currentIndex = hasCheckedIn ? 4 : 3;
  } else if (status === "requested") {
    currentIndex = 1;
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          Execution Lifecycle
        </span>
        {isDisputed ? (
          <Badge className="bg-red-100 text-danger font-bold">⚠️ Under Dispute Review</Badge>
        ) : (
          <Badge className="bg-leaf-100 text-leaf-800 font-bold">
            Step {currentIndex + 1} of 9
          </Badge>
        )}
      </div>

      {/* Progress Track */}
      <ol className="relative grid grid-cols-3 gap-2 sm:grid-cols-9">
        {STAGES.map((stg, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <li
              key={stg.id}
              className={`flex flex-col items-center rounded-lg p-2 text-center text-xs transition-colors ${
                isCurrent
                  ? isDisputed
                    ? "border-2 border-danger bg-red-50 font-bold text-danger"
                    : "border-2 border-leaf-700 bg-leaf-50 font-extrabold text-leaf-900 shadow-xs"
                  : isDone
                    ? "border border-leaf-200 bg-leaf-50/50 font-semibold text-leaf-700"
                    : "border border-line/60 bg-cream/50 text-muted opacity-70"
              }`}
            >
              <span className="text-base" aria-hidden="true">
                {isDone ? "✓" : stg.icon}
              </span>
              <span className="mt-1 leading-tight text-[11px]">{stg.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
