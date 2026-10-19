import * as Location from 'expo-location';
import { Magnetometer, Accelerometer } from 'expo-sensors';
import type { LatLng } from '@cultivanode/shared';

export interface GpsAccuracyReading {
  latitude: number;
  longitude: number;
  accuracy: number; // in meters (lower is better, <5m is high precision)
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null; // degrees 0-360
  speed: number | null; // meters/sec
  timestamp: number;
  compassHeading?: number | null;
  isMoving?: boolean;
}

export interface BoundaryPoint extends LatLng {
  accuracy: number;
  altitude: number | null;
  heading: number | null;
  timestamp: number;
}

/**
 * Calculates geodesic distance in meters between two lat/lng coordinates (Haversine formula).
 */
export function calculateDistanceMeters(p1: LatLng, p2: LatLng): number {
  const R = 6371000; // Earth's mean radius in meters
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimates polygon area in hectares from an array of ordered boundary coordinates (Shoelace on Spherical projection).
 */
export function calculatePolygonAreaHectares(points: LatLng[]): number {
  if (points.length < 3) return 0;

  const R = 6378137; // WGS84 semi-major axis in meters
  let total = 0;
  const len = points.length;

  for (let i = 0; i < len; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % len];

    const lat1 = (p1.lat * Math.PI) / 180;
    const lat2 = (p2.lat * Math.PI) / 180;
    const lng1 = (p1.lng * Math.PI) / 180;
    const lng2 = (p2.lng * Math.PI) / 180;

    total += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  total = Math.abs((total * R * R) / 2.0);
  const squareMeters = total;
  return squareMeters / 10000; // 1 Hectare = 10,000 m²
}

/**
 * Request high-precision location and hardware sensor permissions.
 */
export async function requestLocationAndSensorPermissions(): Promise<boolean> {
  try {
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    return fgStatus === 'granted';
  } catch {
    return false;
  }
}

/**
 * Subscribes to real-time high precision GPS and phone magnetometer for orientation.
 */
export class BoundaryTracker {
  private locationSub: Location.LocationSubscription | null = null;
  private magSub: { remove: () => void } | null = null;
  private currentHeading: number | null = null;
  private onReadingCallback: (reading: GpsAccuracyReading) => void;

  constructor(onReading: (reading: GpsAccuracyReading) => void) {
    this.onReadingCallback = onReading;
  }

  async start(): Promise<boolean> {
    const hasPermission = await requestLocationAndSensorPermissions();
    if (!hasPermission) return false;

    // 1. Subscribe to Magnetometer (compass) for true orientation
    try {
      const isMagAvailable = await Magnetometer.isAvailableAsync();
      if (isMagAvailable) {
        Magnetometer.setUpdateInterval(500);
        this.magSub = Magnetometer.addListener((data) => {
          let angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
          if (angle < 0) angle += 360;
          this.currentHeading = Math.round(angle);
        });
      }
    } catch {
      // Hardware magnetometer fallback to GPS heading
    }

    // 2. High-accuracy continuous GPS tracking
    try {
      this.locationSub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 1.5, // updates every 1.5 meters walked
        },
        (loc) => {
          this.onReadingCallback({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy ?? 99,
            altitude: loc.coords.altitude,
            altitudeAccuracy: loc.coords.altitudeAccuracy,
            heading: loc.coords.heading ?? this.currentHeading,
            speed: loc.coords.speed,
            timestamp: loc.timestamp,
            compassHeading: this.currentHeading,
            isMoving: (loc.coords.speed ?? 0) > 0.3,
          });
        }
      );
      return true;
    } catch {
      return false;
    }
  }

  stop() {
    if (this.locationSub) {
      this.locationSub.remove();
      this.locationSub = null;
    }
    if (this.magSub) {
      this.magSub.remove();
      this.magSub = null;
    }
  }
}
