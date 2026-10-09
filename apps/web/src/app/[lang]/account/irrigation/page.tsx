import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import {
  Droplets,
  Activity,
  TrendingDown,
  Clock,
  MapPin,
  ArrowLeft,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  Gauge,
  Sliders,
} from "lucide-react";

const irrigationZones = [
  { id: "Zone 1", location: "Plot A1 – North (Maize)", status: "active", duration: 45, remaining: 15, moisture: 45, flowRate: "32 L/min" },
  { id: "Zone 2", location: "Plot A1 – South (Sorghum)", status: "scheduled", duration: 30, remaining: 0, moisture: 38, flowRate: "28 L/min" },
  { id: "Zone 3", location: "Plot B2 – Cassava Hub", status: "active", duration: 60, remaining: 35, moisture: 42, flowRate: "40 L/min" },
  { id: "Zone 4", location: "Greenhouse Alpha (Tomatoes)", status: "idle", duration: 0, remaining: 0, moisture: 76, flowRate: "0 L/min" },
  { id: "Zone 5", location: "Vegetable Garden Nursery", status: "idle", duration: 0, remaining: 0, moisture: 68, flowRate: "0 L/min" },
  { id: "Zone 6", location: "Orchard Sector East", status: "scheduled", duration: 40, remaining: 0, moisture: 35, flowRate: "35 L/min" },
];

export default async function IrrigationPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireAccount(lang);

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={`/${lang}/account?ws=farmer`}
            className="inline-flex items-center gap-1 text-xs font-bold text-leaf-700 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Link>
          <span className="text-muted">/</span>
          <span className="text-xs font-bold text-muted">Intelligence & IoT</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink shadow-xs hover:bg-cream">
            <Sliders className="h-3.5 w-3.5 text-muted" />
            Calibrate Flow
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-node-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-node-800">
            <Droplets className="h-3.5 w-3.5" />
            Schedule Run
          </button>
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-leaf-800 sm:text-3xl">
          Irrigation & Water Management
        </h1>
        <p className="mt-1 text-sm text-muted">
          Smart valve actuators, soil-moisture triggers & precision drip distribution across farm zones.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border border-line bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted uppercase font-bold tracking-wider">Daily Usage</p>
              <p className="mt-1 text-2xl font-extrabold text-node-800">2,340 L</p>
              <p className="text-xs text-leaf-700 font-semibold">-5% vs yesterday (rain saver)</p>
            </div>
            <div className="rounded-xl bg-node-100 p-2.5 text-node-700">
              <Droplets className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-line bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted uppercase font-bold tracking-wider">Active Zones</p>
              <p className="mt-1 text-2xl font-extrabold text-leaf-800">2 of 6</p>
              <p className="text-xs text-leaf-700 font-semibold">Pump Pressure: 2.8 Bar</p>
            </div>
            <div className="rounded-xl bg-leaf-100 p-2.5 text-leaf-700">
              <Activity className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-line bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted uppercase font-bold tracking-wider">Water Efficiency</p>
              <p className="mt-1 text-2xl font-extrabold text-leaf-800">94.2%</p>
              <p className="text-xs text-leaf-700 font-semibold">Zero runoff detected</p>
            </div>
            <div className="rounded-xl bg-harvest-100 p-2.5 text-harvest-700">
              <TrendingDown className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-line bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted uppercase font-bold tracking-wider">Next Auto Schedule</p>
              <p className="mt-1 text-2xl font-extrabold text-ink">5:30 AM</p>
              <p className="text-xs text-node-700 font-semibold">Zone 2 (Moisture Trigger)</p>
            </div>
            <div className="rounded-xl bg-cream p-2.5 text-muted">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Irrigation Zone Grid */}
      <Card className="border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-ink">Drip & Sprinkler Zones</h2>
            <p className="text-xs text-muted">Automated threshold triggers via PostGIS plot probes</p>
          </div>
          <Badge tone="leaf" className="text-xs">Main Borehole Active</Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {irrigationZones.map((z) => (
            <div
              key={z.id}
              className="rounded-2xl border border-line/60 bg-cream/30 p-4 transition hover:bg-cream/60 hover:shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-ink text-sm">{z.id}</h3>
                  <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {z.location}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    z.status === "active"
                      ? "bg-leaf-100 text-leaf-800"
                      : z.status === "scheduled"
                      ? "bg-node-100 text-node-800"
                      : "bg-gray-100 text-muted"
                  }`}
                >
                  {z.status.toUpperCase()}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-muted block">Soil Moisture</span>
                  <span className="font-extrabold text-ink">{z.moisture}%</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-muted block">Flow Rate</span>
                  <span className="font-extrabold text-node-800">{z.flowRate}</span>
                </div>
              </div>

              {z.status === "active" && (
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-[11px] text-muted">
                    <span>Cycle Progress</span>
                    <span>{z.remaining}m remaining</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-line overflow-hidden">
                    <div
                      className="h-full bg-leaf-600 rounded-full"
                      style={{ width: `${((z.duration - z.remaining) / z.duration) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs">
                <span className="text-muted">Target: 65% RH</span>
                <button className="text-xs font-bold text-leaf-700 hover:underline">
                  {z.status === "active" ? "Pause Zone" : "Manual Pulse →"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
