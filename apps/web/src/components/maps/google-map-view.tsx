"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { Icon } from "@/components/ds/icon";
import { Button } from "@/components/ui";

export type LatLng = google.maps.LatLngLiteral;

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
  mapId?: string;
};

const DEFAULT_CENTER: LatLng = { lat: 8.6672, lng: 3.3934 };

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
  mapId,
}: GoogleMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const polygonInstancesRef = useRef<google.maps.Polygon[]>([]);
  const infoWindowRefs = useRef<google.maps.InfoWindow[]>([]);
  const drawingListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<google.maps.MapTypeId>(
    google.maps.MapTypeId.HYBRID
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [publicConfig, setPublicConfig] = useState<{
    mapId?: string;
    defaultZoom: number;
    defaultCenter: LatLng;
    providerConfigured: boolean;
  } | null>(null);

  // Callback refs to avoid circular dependencies in useCallback
  const renderPolygonsRef = useRef<(map: google.maps.Map) => void>(() => {});
  const addCentroidMarkerRef = useRef<(map: google.maps.Map) => void>(() => {});
  const addClickListenerRef = useRef<(map: google.maps.Map) => void>(() => {});

  // Define renderPolygons
  const renderPolygons = useCallback(
    (map: google.maps.Map) => {
      // Clear previous polygons and info windows
      polygonInstancesRef.current.forEach((p) => p.setMap(null));
      polygonInstancesRef.current = [];

      infoWindowRefs.current.forEach((iw) => iw.close());
      infoWindowRefs.current = [];

      polygons.forEach((poly) => {
        const gPoly = new google.maps.Polygon({
          paths: poly.points,
          strokeColor: poly.color,
          strokeOpacity: 0.9,
          strokeWeight: 2.5,
          fillColor: poly.color,
          fillOpacity: poly.fillOpacity ?? 0.35,
          map,
          editable,
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `<div style="padding:4px 8px; font-family:sans-serif; color:#0f172a;">
            <strong style="color:#006c49;">${poly.name}</strong><br/>
            <span style="font-size:11px; color:#64748b;">${poly.subtext ?? ""}</span>
          </div>`,
        });

        const mouseoverListener = gPoly.addListener("mouseover", (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            infoWindow.setPosition(e.latLng);
            infoWindow.open(map);
          }
        });

        const mouseoutListener = gPoly.addListener("mouseout", () => {
          infoWindow.close();
        });

        // Store listeners for cleanup
        (gPoly as google.maps.Polygon & { _listeners?: google.maps.MapsEventListener[] })._listeners = [
          mouseoverListener,
          mouseoutListener,
        ];

        polygonInstancesRef.current.push(gPoly);
        infoWindowRefs.current.push(infoWindow);
      });
    },
    [polygons, editable]
  );

  // Define addCentroidMarker
  const addCentroidMarker = useCallback((map: google.maps.Map) => {
    new google.maps.Marker({
      position: center,
      map,
      title: "Oke-Ogun Cadastral Centroid (EPSG:4326)",
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 7,
        fillColor: "#006C49",
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 2,
      },
    });
  }, [center]);

  // Define addClickListener
  const addClickListener = useCallback(
    (map: google.maps.Map) => {
      if (drawingListenerRef.current) {
        google.maps.event.removeListener(drawingListenerRef.current);
      }

      drawingListenerRef.current = map.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (!isDrawing || !e.latLng) return;
        const pt: LatLng = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        onPolygonChange?.([pt]);
      });
    },
    [isDrawing, onPolygonChange]
  );

  // Sync refs with latest callbacks
  useEffect(() => {
    renderPolygonsRef.current = renderPolygons;
  }, [renderPolygons]);

  useEffect(() => {
    addCentroidMarkerRef.current = addCentroidMarker;
  }, [addCentroidMarker]);

  useEffect(() => {
    addClickListenerRef.current = addClickListener;
  }, [addClickListener]);

  // Fetch public config (without API key)
  useEffect(() => {
    fetch("/api/maps/config")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch config");
        return res.json();
      })
      .then((data) => {
        setPublicConfig(data);
      })
      .catch((err) => {
        console.error("Failed to load maps config:", err);
      });
  }, []);

  // Initialize map
  const initMap = useCallback(() => {
    if (!containerRef.current || !window.google?.maps) return;

    try {
      const mapOptions: google.maps.MapOptions = {
        center,
        zoom,
        mapTypeId: mapType,
        disableDefaultUI: true,
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        rotateControl: true,
        fullscreenControl: false,
      };

      if (mapId || publicConfig?.mapId) {
        mapOptions.mapId = mapId || publicConfig?.mapId;
      }

      const map = new google.maps.Map(containerRef.current, mapOptions);

      mapInstanceRef.current = map;
      setMapLoaded(true);
      setMapError(null);
      const initialZoom = map.getZoom();
      if (initialZoom !== undefined) setCurrentZoom(initialZoom);

      renderPolygonsRef.current?.(map);
      addCentroidMarkerRef.current?.(map);
      addClickListenerRef.current?.(map);

      // Sync zoom changes
      map.addListener("zoom_changed", () => {
        const z = map.getZoom();
        if (z !== undefined) setCurrentZoom(z);
      });
    } catch (err) {
      console.error("Failed to initialize map:", err);
      setMapError("Failed to initialize map.");
    }
  }, [center, zoom, mapType, mapId, publicConfig]);

  // Load Google Maps when API key and public config are available
  useEffect(() => {
    if (!apiKey || !publicConfig?.providerConfigured) return;

    setOptions({
      key: apiKey,
      v: "weekly",
      libraries: ["geometry", "drawing"],
      mapIds: mapId || publicConfig.mapId ? [mapId || publicConfig.mapId!] : [],
    });

    // Import the maps library to trigger loading
    importLibrary("maps")
      .then(() => {
        // Also import geometry and drawing libraries
        return Promise.all([
          importLibrary("geometry"),
          importLibrary("drawing"),
        ]);
      })
      .then(() => {
        initMap();
      })
      .catch((err: Error) => {
        console.error("Failed to load Google Maps:", err);
        setMapError("Failed to load Google Maps. Please check your API key.");
      });
  }, [apiKey, publicConfig?.providerConfigured, mapId, initMap]);

  // Re-render polygons when they change
  useEffect(() => {
    if (mapInstanceRef.current) {
      renderPolygonsRef.current?.(mapInstanceRef.current);
    }
  }, [polygons, editable]);

  // Update click listener when drawing mode changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      addClickListenerRef.current?.(mapInstanceRef.current);
    }
  }, [isDrawing]);

  // Update map type when it changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(mapType);
    }
  }, [mapType]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Remove drawing listener
      if (drawingListenerRef.current) {
        google.maps.event.removeListener(drawingListenerRef.current);
        drawingListenerRef.current = null;
      }

      // Close and clear info windows
      infoWindowRefs.current.forEach((iw) => iw.close());
      infoWindowRefs.current = [];

      // Clear polygons
      polygonInstancesRef.current.forEach((p) => p.setMap(null));
      polygonInstancesRef.current = [];

      // Clear map instance
      mapInstanceRef.current = null;
    };
  }, []);

  const handleZoomIn = useCallback(() => {
    if (mapInstanceRef.current) {
      const currentZoomLevel = mapInstanceRef.current.getZoom();
      if (currentZoomLevel !== undefined) {
        const z = currentZoomLevel + 1;
        mapInstanceRef.current.setZoom(z);
        setCurrentZoom(z);
      }
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (mapInstanceRef.current) {
      const currentZoomLevel = mapInstanceRef.current.getZoom();
      if (currentZoomLevel !== undefined) {
        const z = currentZoomLevel - 1;
        mapInstanceRef.current.setZoom(z);
        setCurrentZoom(z);
      }
    }
  }, []);

  const handleTypeChange = useCallback((type: google.maps.MapTypeId) => {
    setMapType(type);
  }, []);

  const toggleDrawing = useCallback(() => {
    setIsDrawing((prev) => !prev);
  }, []);

  // Set API key from parent or manual entry
  const setApiKeyManually = useCallback((key: string) => {
    setApiKey(key.trim());
  }, []);

  return (
    <div className={`relative overflow-hidden rounded-xl bg-surface-container-high ${className}`}>
      {/* Map DOM Canvas */}
      <div ref={containerRef} className="w-full h-full min-h-[500px]" />

      {/* Error state */}
      {mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-surface-container-low/95 backdrop-blur-sm z-10">
          <div className="w-14 h-14 rounded-2xl bg-error-container/40 flex items-center justify-center text-error mb-3">
            <Icon name="error" className="text-3xl" />
          </div>
          <h3 className="font-headline-sm text-headline-sm text-error font-bold">
            Map Load Error
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md mt-1">
            {mapError}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const manual = prompt("Enter Google Maps API Key to retry:");
              if (manual) setApiKeyManually(manual);
            }}
          >
            Retry with API Key
          </Button>
        </div>
      )}

      {/* Fallback preview if Google Maps not loaded */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-surface-container-low/95 backdrop-blur-sm z-10">
          <div className="w-14 h-14 rounded-2xl bg-secondary-container/40 flex items-center justify-center text-primary mb-3">
            <Icon name="map" className="text-3xl" />
          </div>
          <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
            Google Maps Platform Integration
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md mt-1">
            Centrally configured in Super Admin for Cadastral Boundary Mapping, RTK GPS Delineation,
            and Satellite View.
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
                if (manual) setApiKeyManually(manual);
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
      {showLayerControls && mapLoaded && (
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          {/* Map Layer Switcher */}
          <div className="bg-surface-container-lowest/95 backdrop-blur-md rounded-lg shadow-md p-1 flex items-center gap-1 border border-border">
            <button
              type="button"
              onClick={() => handleTypeChange(google.maps.MapTypeId.HYBRID)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                mapType === google.maps.MapTypeId.HYBRID
                  ? "bg-primary text-white"
                  : "text-on-surface hover:bg-surface-container-low"
              }`}
            >
              Hybrid
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange(google.maps.MapTypeId.SATELLITE)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                mapType === google.maps.MapTypeId.SATELLITE
                  ? "bg-primary text-white"
                  : "text-on-surface hover:bg-surface-container-low"
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange(google.maps.MapTypeId.ROADMAP)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                mapType === google.maps.MapTypeId.ROADMAP
                  ? "bg-primary text-white"
                  : "text-on-surface hover:bg-surface-container-low"
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
                isDrawing
                  ? "bg-secondary text-white font-bold"
                  : "text-primary hover:bg-surface-container-low"
              }`}
              title={isDrawing ? "Finish Boundary Delineation" : "Walk / Draw Boundary"}
            >
              <Icon name="polyline" className="text-base" />
            </button>
          </div>
        </div>
      )}

      {/* Cadastral Coordinate Watermark */}
      {mapLoaded && (
        <div className="absolute left-4 bottom-4 z-20 bg-surface-container-lowest/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-3 font-mono text-xs text-on-surface-variant border border-border">
          <span className="flex items-center gap-1 text-primary font-semibold">
            <Icon name="explore" className="text-sm" /> Google Maps EPSG:4326
          </span>
          <span>Lat: {center.lat.toFixed(4)}° N · Lon: {center.lng.toFixed(4)}° E</span>
          <span>Zoom: {currentZoom}x</span>
        </div>
      )}
    </div>
  );
}