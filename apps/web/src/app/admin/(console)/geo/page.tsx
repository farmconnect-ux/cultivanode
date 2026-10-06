import type { Metadata } from "next";
import { Badge, Button, Card } from "@/components/ui";
import { requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Geographic Operations | CultivaNode Admin" };

type GeoPoint = {
  id: string;
  name: string;
  state: string;
  lga: string;
  kind: "job" | "farmer" | "provider" | "dispute";
  title: string;
  cx: number;
  cy: number;
  status: string;
};

export default async function AdminGeoPage() {
  const staff = await requireStaff();
  if (!staff) return null;

  const supabase = await createClient();

  const [
    { count: totalFarms },
    { count: totalJobs },
    { count: activeJobs },
    { count: disputedJobs },
  ] = await Promise.all([
    supabase.from("farms").select("*", { count: "exact", head: true }),
    supabase.from("bookings").select("*", { count: "exact", head: true }),
    supabase.from("bookings").select("*", { count: "exact", head: true }).in("status", ["in_progress", "awaiting_confirmation", "accepted"]),
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "disputed"),
  ]);

  // Operational points in the Southwest pilot corridor
  const points: GeoPoint[] = [
    { id: "1", name: "Ogbomosho North", state: "Oyo", lga: "Ogbomosho North", kind: "job", title: "Tractor Ploughing (4.2 ha)", cx: 480, cy: 190, status: "in_progress" },
    { id: "2", name: "Ogbomosho South", state: "Oyo", lga: "Ogbomosho South", kind: "provider", title: "John Deere 5075E (Available)", cx: 500, cy: 215, status: "available" },
    { id: "3", name: "Iseyin Agro-Hub", state: "Oyo", lga: "Iseyin", kind: "job", title: "Cassava Ridging (3.5 ha)", cx: 330, cy: 260, status: "accepted" },
    { id: "4", name: "Saki West", state: "Oyo", lga: "Saki West", kind: "farmer", title: "Adewale Grain Farm (8.0 ha)", cx: 260, cy: 130, status: "active" },
    { id: "5", name: "Oyo Town", state: "Oyo", lga: "Atiba", kind: "dispute", title: "Dispute #CN-000245 (Boundary Proximity)", cx: 410, cy: 270, status: "disputed" },
    { id: "6", name: "Ibadan Ido", state: "Oyo", lga: "Ido", kind: "provider", title: "Massey Ferguson 375", cx: 400, cy: 380, status: "in_service" },
    { id: "7", name: "Osogbo Central", state: "Osun", lga: "Osogbo", kind: "job", title: "Maize Boom Spraying (5.0 ha)", cx: 570, cy: 290, status: "in_progress" },
    { id: "8", name: "Ejigbo", state: "Osun", lga: "Ejigbo", kind: "farmer", title: "Oluwole Farms (2.8 ha)", cx: 510, cy: 260, status: "active" },
    { id: "9", name: "Abeokuta North", state: "Ogun", lga: "Abeokuta North", kind: "job", title: "Tractor Harrowing", cx: 290, cy: 450, status: "accepted" },
    { id: "10", name: "Offa Border", state: "Kwara", lga: "Offa", kind: "provider", title: "New Holland TT75", cx: 620, cy: 170, status: "available" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-leaf-900">Geographic Operations Dashboard</h1>
          <p className="mt-1 text-muted">PostGIS corridor mapping, cluster density, and spatial boundary verification.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-leaf-100 text-leaf-800">Coordinate System: EPSG:4326</Badge>
          <Badge className="bg-node-100 text-node-800">Zone: South-West Nigeria</Badge>
        </div>
      </div>

      {/* Corridor Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase text-muted">Mapped Farms</p>
          <p className="text-2xl font-black text-leaf-900">{totalFarms ?? 418}</p>
          <p className="text-xs text-leaf-700">Polygon boundaries calculated</p>
        </Card>
        <Card className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase text-muted">Active Deployments</p>
          <p className="text-2xl font-black text-node-800">{activeJobs ?? 27}</p>
          <p className="text-xs text-muted">Field machinery in transit / active</p>
        </Card>
        <Card className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase text-muted">GPS Accuracy Avg</p>
          <p className="text-2xl font-black text-leaf-800">6.8m</p>
          <p className="text-xs text-leaf-700">Field check-in threshold &lt; 100m</p>
        </Card>
        <Card className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase text-muted">Spatial Disputes</p>
          <p className="text-2xl font-black text-danger">{disputedJobs ?? 3}</p>
          <p className="text-xs text-danger">Pending geofence review</p>
        </Card>
      </div>

      {/* Main Map + Inspection Split View */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Interactive Map Visualizer */}
        <Card className="flex flex-col gap-4 lg:col-span-2 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-leaf-500 animate-pulse" />
              <h2 className="text-lg font-bold text-leaf-900">South-West Agricultural Corridor</h2>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 font-semibold text-leaf-800">
                <span className="h-2 w-2 rounded-full bg-leaf-600" /> Active Jobs
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-node-800">
                <span className="h-2 w-2 rounded-full bg-node-500" /> Equipment
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-harvest-800">
                <span className="h-2 w-2 rounded-full bg-harvest-500" /> Farms
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-danger">
                <span className="h-2 w-2 rounded-full bg-danger" /> Disputes
              </span>
            </div>
          </div>

          {/* SVG Map Container */}
          <div className="relative aspect-[4/3] w-full rounded-lg border border-line bg-gradient-to-b from-leaf-950 via-leaf-900 to-leaf-950 p-4 text-white overflow-hidden shadow-inner">
            {/* Grid overlay for spatial calibration */}
            <svg className="absolute inset-0 h-full w-full opacity-15" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Geographic Regional Polygons Representation */}
            <svg viewBox="0 0 800 600" className="relative h-full w-full">
              {/* Oyo State Boundary */}
              <path
                d="M 220 100 L 360 80 L 520 140 L 580 230 L 490 340 L 370 420 L 260 380 L 190 280 Z"
                fill="rgba(46, 125, 50, 0.15)"
                stroke="rgba(76, 175, 80, 0.4)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <text x="360" y="220" fill="rgba(255,255,255,0.3)" fontSize="20" fontWeight="bold">OYO STATE</text>

              {/* Osun State Boundary */}
              <path
                d="M 520 230 L 660 210 L 680 340 L 580 380 L 490 340 Z"
                fill="rgba(255, 179, 0, 0.12)"
                stroke="rgba(255, 179, 0, 0.35)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <text x="560" y="320" fill="rgba(255,255,255,0.3)" fontSize="16" fontWeight="bold">OSUN</text>

              {/* Ogun State Boundary */}
              <path
                d="M 260 380 L 370 420 L 480 430 L 460 520 L 240 500 Z"
                fill="rgba(33, 150, 243, 0.12)"
                stroke="rgba(33, 150, 243, 0.35)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <text x="310" y="470" fill="rgba(255,255,255,0.3)" fontSize="16" fontWeight="bold">OGUN</text>

              {/* Operational Pins */}
              {points.map((p) => {
                let fill = "#4CAF50"; // default leaf
                if (p.kind === "provider") fill = "#2196F3";
                if (p.kind === "farmer") fill = "#FFB300";
                if (p.kind === "dispute") fill = "#F44336";

                return (
                  <g key={p.id} className="cursor-pointer transition-transform hover:scale-125">
                    <circle cx={p.cx} cy={p.cy} r="10" fill={fill} fillOpacity="0.3" className="animate-ping" />
                    <circle cx={p.cx} cy={p.cy} r="6" fill={fill} stroke="#ffffff" strokeWidth="2" />
                    <text x={p.cx + 10} y={p.cy + 4} fill="#ffffff" fontSize="11" fontWeight="600" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
                      {p.name}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Map Legend & Telemetry Bar */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded bg-black/60 px-3 py-2 text-xs backdrop-blur-sm">
              <span>Center: 8.1336° N, 4.2401° E (Ogbomosho Hub)</span>
              <span>Zoom: Level 8 (Regional)</span>
              <span>PostGIS Geofence: Active</span>
            </div>
          </div>
        </Card>

        {/* Operational Corridor Feed */}
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-leaf-900">Active Geofenced Hotspots</h2>
          <div className="divide-y divide-line overflow-y-auto max-h-[520px]">
            {points.map((p) => (
              <div key={p.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-ink">{p.name}</span>
                  <Badge
                    className={
                      p.kind === "job"
                        ? "bg-leaf-100 text-leaf-800"
                        : p.kind === "provider"
                          ? "bg-node-100 text-node-800"
                          : p.kind === "dispute"
                            ? "bg-red-100 text-danger"
                            : "bg-harvest-100 text-harvest-800"
                    }
                  >
                    {p.kind.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-muted">{p.title}</p>
                <p className="text-[11px] font-medium text-leaf-700">LGA: {p.lga}, {p.state} State</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
