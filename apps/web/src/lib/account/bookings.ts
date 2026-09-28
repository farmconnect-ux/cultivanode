// Shapes returned by my_bookings() and booking_detail(), and how each status is shown.

export type BookingStatus = "requested" | "accepted" | "declined" | "cancelled" | "expired";

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

export type BookingDetail = Omit<BookingSummary, "my_side" | "other_name"> & {
  my_side: "farmer" | "provider" | "staff";
  listing_id: string | null;
  farmer_note: string | null;
  responded_at: string | null;
  closed_reason: string | null;
  cancelled_by_me: boolean;
  other: { name: string | null; phone: string | null; tier: number } | null;
  location: { lat: number; lng: number; hint: string | null } | null;
  can: { accept: boolean; decline: boolean; cancel: boolean };
  events: { event: BookingStatus; at: string; note: string | null; by: "farmer" | "provider" | "system" | "staff" }[];
};

export const BOOKING_TONE: Record<BookingStatus, string> = {
  requested: "bg-harvest-100 text-harvest-700",
  accepted: "bg-leaf-100 text-leaf-800",
  declined: "bg-line/60 text-ink",
  cancelled: "bg-red-50 text-danger",
  expired: "bg-line/60 text-ink",
};

/** "2.5" for 2.50, "1" for 1.00. */
export const qty = (n: number) => String(Number(n));
