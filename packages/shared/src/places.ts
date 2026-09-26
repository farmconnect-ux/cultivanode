// Nigeria's 36 states and the FCT, for state pickers on the web and in the app.
export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta',
  'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
  'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
] as const;
export type NigerianState = (typeof NIGERIAN_STATES)[number];

/** Rough bounding box of Nigeria, to catch swapped or mistyped coordinates. */
export const NIGERIA_BOUNDS = { minLat: 4.0, maxLat: 14.0, minLng: 2.6, maxLng: 14.8 } as const;

export function isInNigeria(lat: number, lng: number): boolean {
  const b = NIGERIA_BOUNDS;
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
}

export const ACRES_PER_HECTARE = 2.4710538;
