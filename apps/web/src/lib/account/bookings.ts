// Shapes returned by my_bookings() and booking_detail(), and how each status is shown.

export type BookingStatus =
  | "requested" | "accepted" | "in_progress" | "awaiting_confirmation"
  | "confirmed" | "disputed" | "completed" | "declined" | "cancelled" | "expired";

export type BookingSummary = {
  id: string;
  my_side: "farmer" | "provider";
  status: BookingStatus;
  title: string;
  kind: "equipment" | "service";
  equipment_type: string | null;
  provider_type: string | null;
  job_date: string;
  unit: "hour" | "day" | "hectare" | "job";
  quantity: number;
  rate_kobo: number;
  total_kobo: number;
  distance_km: number;
  farm_name: string;
  job_state: string | null;
  job_lga: string | null;
  expires_at: string;
  created_at: string;
  other_name: string;
};

export type Proof = {
  id: string;
  kind: "before" | "after" | "extra" | "evidence";
  path: string;
  taken_at: string;
  gps_distance_m: number | null;
  hectares: number | null;
  by: "farmer" | "provider";
};

export type DisputeCategory = "job_not_done" | "poor_quality" | "wrong_area" | "damage" | "no_show";
export const DISPUTE_CATEGORIES: DisputeCategory[] = ["job_not_done", "poor_quality", "wrong_area", "damage", "no_show"];

export type Rating = { stars: number; tags: string[]; comment: string | null };

export type BookingDetail = Omit<BookingSummary, "my_side" | "other_name"> & {
  my_side: "farmer" | "provider" | "staff";
  listing_id: string | null;
  farmer_note: string | null;
  responded_at: string | null;
  closed_reason: string | null;
  cancelled_by_me: boolean;
  checked_in_at: string | null;
  check_in_distance_m: number | null;
  work_submitted_at: string | null;
  confirm_by: string | null;
  hectares_done: number | null;
  disputed_at: string | null;
  dispute_reason: string | null;
  dispute_category: DisputeCategory | null;
  disputed_by: "farmer" | "provider" | "staff" | null;
  dispute: {
    outcome: "uphold_provider" | "uphold_farmer" | "settlement";
    decision: string | null;
    settlement_kobo: number | null;
    decided_at: string | null;
  } | null;
  payment: {
    mine: { at: string; kobo: number } | { farmer: number | null; provider: number | null } | null;
    theirs_marked: boolean | null;
    disputed: boolean;
  };
  other: { name: string | null; phone: string | null; tier: number } | null;
  location: { lat: number; lng: number; hint: string | null } | null;
  proofs: Proof[];
  my_rating: Rating | null;
  their_rating: Rating | null;
  can: {
    accept: boolean; decline: boolean; cancel: boolean;
    check_in: boolean; submit_proof: boolean; confirm: boolean; dispute: boolean; add_evidence: boolean;
    mark_paid: boolean; rate: boolean;
  };
  events: { event: string; at: string; note: string | null; by: "farmer" | "provider" | "system" | "staff" }[];
};

export const BOOKING_TONE: Record<BookingStatus, string> = {
  requested: "bg-tertiary-fixed/60 text-[#b45309]",
  accepted: "bg-secondary-container/40 text-primary",
  in_progress: "bg-node-50 text-node-700",
  awaiting_confirmation: "bg-tertiary-fixed/60 text-[#b45309]",
  confirmed: "bg-secondary-container/40 text-primary",
  disputed: "bg-red-50 text-critical",
  completed: "bg-secondary-container/40 text-primary",
  declined: "bg-surface-container/60 text-on-surface",
  cancelled: "bg-surface-container/60 text-on-surface",
  expired: "bg-surface-container/60 text-on-surface",
};

/** "2.5" for 2.50, "1" for 1.00. */
export const qty = (n: number) => String(Number(n));
