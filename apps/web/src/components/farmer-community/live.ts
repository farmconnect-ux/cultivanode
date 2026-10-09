import type { BookingSummary } from "@/lib/account/bookings";

export type LiveFarm = {
  id: string;
  name: string;
  state: string | null;
  lga: string | null;
  area_ha: number | null;
};

export type FarmerLive = {
  lang: string;
  farms: LiveFarm[];
  bookings: BookingSummary[];
};

export const OPEN_JOB = new Set<BookingSummary["status"]>([
  "requested",
  "accepted",
  "in_progress",
  "awaiting_confirmation",
  "disputed",
]);

export function hectares(farms: LiveFarm[]): number {
  return farms.reduce((sum, farm) => sum + (Number(farm.area_ha) || 0), 0);
}
