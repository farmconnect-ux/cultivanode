"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import { Button } from "@/components/ui";

declare global {
  interface Window {
    google?: any;
    initGoogleMapCallback?: () => void;
  }
}

export type LatLng = { lat: number; lng: number };

export type MapPolygon = {
  id: string;
  name: string;
  subtext?: string;
  color: string;
  fillOpacity?: number;
  points: LatLng[];
};

export type GoogleMapViewProps = {
  center?: LatLng;
  zoom?: number;
  polygons?: MapPolygon[];
  editable?: boolean;
  onPolygonChange?: (points: LatLng[]) => void;
  className?: string;
  showLayerControls?: boolean;
};

const DEFAULT_CENTER: LatLng = { lat: 8.6672, lng: 3.3934 }; // Saki West, Oyo State

// Default sample farm boundaries if none provided
const DEFAULT_POLYGONS: MapPolygon[] = [
  {
    id: "field-01",
    name: "FIELD 01: MAIZE (SAMMAZ-15)",
    subtext: "12.4 Ha · NDVI 0.82",
    color: "#4edea3",
    fillOpacity: 0.45,
    points: [
      { lat: 8.6701, lng: 3.3910 },
      { lat: 8.6734, lng: 3.3915 },
      { lat: 8.6730, lng: 3.3960 },
      { lat: 8.6698, lng: 3.3955 },
    ],
  },
  {
    id: "field-02",
    name: "FIELD 02: CASSAVA (TME-419)",
    subtext: "16.2 Ha · Canopy Closure",
    color: "#31694c",
    fillOpacity: 0.4,
    points: [
      { lat: 8.6734, lng: 3.3915 },
      { lat: 8.6750, lng: 3.3920 },
      { lat: 8.6745, lng: 3.3965 },
      { lat: 8.6730, lng: 3.3960 },
    ],
  },
  {
    id: "field-03",
    name: "FIELD 03: RICE (FARO-44)",
    subtext: "8.5 Ha · Irrigated Basin",
    color: "#006c49",
    fillOpacity: 0.5,
    points: [
      { lat: 8.6698, lng: 3.3955 },
      { lat: 8.6730, lng: 3.3960 },
      { lat: 8.6725, lng: 3.3995 },
      { lat: 8.6690, lng: 3.3990 },
    ],
  },
];

export function GoogleMapView({
  center = DEFAULT_CENTER,
  zoom = 15,
  polygons = DEFAULT_POLYGONS,
  editable = false,
  onPolygonChange,
  className = "w-full h-full min-h-[500px]",
  showLayerControls = true,
}: GoogleMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const polygonInstancesRef = useRef<any[]>([]);

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapType, setMapType] = useState<"hybrid" | "satellite" | "roadmap">("hybrid");
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState<LatLng[]>([]);
  const [currentZoom, setCurrentZoom] = useState(zoom);

  // Fetch central Google Maps config from Super Admin API
  useEffect(() => {
    fetch("/api/maps/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.apiKey) {
          setApiKey(data.apiKey);
        }
      })
      .catch(() => {});
  }, []);

  // Load Google Maps Script when apiKey is available
  useEffect(() => {
    if (!apiKey) return;

    if (window.google?.maps) {
      initMap();
      return;
    }

    const scriptId = "google-maps-platform-script";
    if (document.getElementById(scriptId)) {
      const interval = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(interval);
          initMap();
        }
      }, 200);
      return () => clearInterval(interval);
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,drawing`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initMap();
    };
    document.head.appendChild(script);
  }, [apiKey]);

  function initMap() {
    if (!containerRef.current || !window.google?.maps) return;

    const map = new window.google.maps.Map(containerRef.current, {
      center,
      zoom,
      mapTypeId: mapType,
      disableDefaultUI: true,
      zoomControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      rotateControl: true,
      fullscreenControl: false,
    });

    mapInstanceRef.current = map;
    setMapLoaded(true);

    // Draw polygons
    renderPolygons(map);

    // Centroid marker
    new window.google.maps.Marker({
      position: center,
      map,
      title: "Oke-Ogun Cadastral Centroid (EPSG:4326)",
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 7,
        fillColor: "#006C49",
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 2,
      },
    });

    // Drawing click listener
    map.addListener("click", (e: any) => {
      if (!isDrawing) return;
      const pt: LatLng = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setDrawnPoints((prev) => {
        const next = [...prev, pt];
        onPolygonChange?.(next);
        return next;
      });
    });
  }

  function renderPolygons(map: any) {
    // Clear previous
    polygonInstancesRef.current.forEach((p) => p.setMap(null));
    polygonInstancesRef.current = [];

    polygons.forEach((poly) => {
      const gPoly = new window.google.maps.Polygon({
        paths: poly.points,
        strokeColor: poly.color,
        strokeOpacity: 0.9,
        strokeWeight: 2.5,
        fillColor: poly.color,
        fillOpacity: poly.fillOpacity ?? 0.35,
        map,
        editable,
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="padding:4px 8px; font-family:sans-serif; color:#0f172a;">
          <strong style="color:#006c49;">${poly.name}</strong><br/>
          <span style="font-size:11px; color:#64748b;">${poly.subtext ?? ""}</span>
        </div>`,
      });

      gPoly.addListener("mouseover", (e: any) => {
        infoWindow.setPosition(e.latLng);
        infoWindow.open(map);
      });

      gPoly.addListener("mouseout", () => {
        infoWindow.close();
      });

      polygonInstancesRef.current.push(gPoly);
    });
  }

  function handleZoomIn() {
    if (mapInstanceRef.current) {
      const z = mapInstanceRef.current.getZoom() + 1;
      mapInstanceRef.current.setZoom(z);
      setCurrentZoom(z);
    }
  }

  function handleZoomOut() {
    if (mapInstanceRef.current) {
      const z = mapInstanceRef.current.getZoom() - 1;
      mapInstanceRef.current.setZoom(z);
      setCurrentZoom(z);
    }
  }

  function handleTypeChange(type: "hybrid" | "satellite" | "roadmap") {
    setMapType(type);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(type);
    }
  }

  function toggleDrawing() {
    setIsDrawing((prev) => !prev);
    if (!isDrawing) {
      setDrawnPoints([]);
    }
  }

  return (
    <div className={`relative overflow-hidden rounded-xl bg-surface-container-high ${className}`}>
      {/* Map DOM Canvas */}
      <div ref={containerRef} className="w-full h-full min-h-[500px]" />

      {/* Fallback preview if Google Maps script not loaded or API key not set yet */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-surface-container-low/95 backdrop-blur-sm z-10">
          <div className="w-14 h-14 rounded-2xl bg-secondary-container/40 flex items-center justify-center text-primary mb-3">
            <Icon name="map" className="text-3xl" />
          </div>
          <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
            Google Maps Platform Integration
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md mt-1">
            Centrally configured in Super Admin for Cadastral Boundary Mapping, RTK GPS Delineation, and Satellite View.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 justify-center">
            <Link href="/admin/integrations">
              <Button variant="primary" size="sm">
                Open Admin Integrations &rarr;
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const manual = prompt("Enter Google Maps API Key to test live canvas:");
                if (manual) setApiKey(manual.trim());
              }}
            >
              Test with API Key
            </Button>
          </div>
          <p className="mt-3 text-xs text-on-surface-variant font-mono">
            Provider: Google Maps Platform (Maps JS, Geocoding, Places)
          </p>
        </div>
      )}

      {/* Floating Controls Bar */}
      {showLayerControls && (
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          {/* Map Layer Switcher */}
          <div className="bg-surface-container-lowest/95 backdrop-blur-md rounded-lg shadow-md p-1 flex items-center gap-1 border border-border">
            <button
              type="button"
              onClick={() => handleTypeChange("hybrid")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                mapType === "hybrid" ? "bg-primary text-white" : "text-on-surface hover:bg-surface-container-low"
              }`}
            >
              Hybrid
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("satellite")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                mapType === "satellite" ? "bg-primary text-white" : "text-on-surface hover:bg-surface-container-low"
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("roadmap")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                mapType === "roadmap" ? "bg-primary text-white" : "text-on-surface hover:bg-surface-container-low"
              }`}
            >
              Roadmap
            </button>
          </div>

          {/* Zoom controls */}
          <div className="bg-surface-container-lowest/95 backdrop-blur-md rounded-lg shadow-md p-1 flex flex-col items-center border border-border">
            <button
              type="button"
              onClick={handleZoomIn}
              className="w-8 h-8 flex items-center justify-center text-on-surface hover:bg-surface-container-low rounded font-bold transition-colors"
              title="Zoom In"
            >
              <Icon name="add" className="text-lg" />
            </button>
            <div className="w-5 h-px bg-border my-0.5" />
            <button
              type="button"
              onClick={handleZoomOut}
              className="w-8 h-8 flex items-center justify-center text-on-surface hover:bg-surface-container-low rounded font-bold transition-colors"
              title="Zoom Out"
            >
              <Icon name="remove" className="text-lg" />
            </button>
          </div>

          {/* Boundary Drawing / Walk tool */}
          <div className="bg-surface-container-lowest/95 backdrop-blur-md rounded-lg shadow-md p-1 flex flex-col items-center border border-border">
            <button
              type="button"
              onClick={toggleDrawing}
              className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                isDrawing ? "bg-secondary text-white font-bold" : "text-primary hover:bg-surface-container-low"
              }`}
              title={isDrawing ? "Finish Boundary Delineation" : "Walk / Draw Boundary"}
            >
              <Icon name="polyline" className="text-base" />
            </button>
          </div>
        </div>
      )}

      {/* Cadastral Coordinate Watermark */}
      <div className="absolute left-4 bottom-4 z-20 bg-surface-container-lowest/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-3 font-mono text-xs text-on-surface-variant border border-border">
        <span className="flex items-center gap-1 text-primary font-semibold">
          <Icon name="explore" className="text-sm" /> Google Maps EPSG:4326
        </span>
        <span>Lat: {center.lat.toFixed(4)}° N · Lon: {center.lng.toFixed(4)}° E</span>
        <span>Zoom: {currentZoom}x</span>
      </div>
    </div>
  );
}
