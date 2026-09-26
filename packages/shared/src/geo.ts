// Helpers for sending coordinates to PostGIS columns (geography, SRID 4326).
// PostGIS expects LONGITUDE first; these helpers take latitude first, like phones and maps do.

export interface LatLng {
  lat: number;
  lng: number;
}

function assertValid({ lat, lng }: LatLng): void {
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new RangeError(`Invalid latitude: ${lat}`);
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) throw new RangeError(`Invalid longitude: ${lng}`);
}

/** EWKT point for an insert/update, e.g. { lat: 7.3775, lng: 3.8967 } -> "SRID=4326;POINT(3.8967 7.3775)". */
export function toPointEwkt(point: LatLng): string {
  assertValid(point);
  return `SRID=4326;POINT(${point.lng} ${point.lat})`;
}

/**
 * EWKT polygon from a walked boundary (at least 3 distinct points, in walking order).
 * The ring is closed automatically.
 */
export function toPolygonEwkt(points: LatLng[]): string {
  if (points.length < 3) throw new RangeError('A boundary needs at least 3 points.');
  points.forEach(assertValid);
  const ring = [...points];
  const first = ring[0]!;
  const last = ring[ring.length - 1]!;
  if (first.lat !== last.lat || first.lng !== last.lng) ring.push(first);
  if (ring.length < 4) throw new RangeError('A boundary needs at least 3 distinct points.');
  return `SRID=4326;POLYGON((${ring.map((p) => `${p.lng} ${p.lat}`).join(', ')}))`;
}
