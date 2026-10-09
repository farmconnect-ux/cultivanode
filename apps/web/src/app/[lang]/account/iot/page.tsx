import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import {
  Cpu,
  Wifi,
  Battery,
  Thermometer,
  Droplets,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  ArrowLeft,
  RefreshCw,
  Plus,
  Radio,
  Zap,
} from "lucide-react";

const devicesData = [
  {
    id: "SEN001",
    name: "Soil Probe Alpha",
    type: "Soil Moisture & Temp",
    location: "Plot A1 – Grain Zone",
    status: "online",
    battery: 88,
    lastReading: "2 mins ago",
    value: "65% moisture",
    connectivity: "LoRaWAN",
    firmware: "v2.1.3",
  },
  {
    id: "SEN002",
    name: "Weather Micro-Station",
    type: "Weather Monitor",
    location: "Plot A1 – Central Tower",
    status: "online",
    battery: 92,
    lastReading: "1 min ago",
    value: "33°C / 64% RH",
    connectivity: "LoRaWAN",
    firmware: "v1.8.2",
  },
  {
    id: "SEN003",
    name: "Greenhouse Climate Node",
    type: "Humidity & Temp",
    location: "Greenhouse Alpha",
    status: "online",
    battery: 76,
    lastReading: "4 mins ago",
    value: "76% RH / 26°C",
    connectivity: "Zigbee",
    firmware: "v2.0.1",
  },
  {
    id: "IRR001",
    name: "Smart Drip Valve Alpha",
    type: "Irrigation Actuator",
    location: "Plot B2 – Cassava Hub",
    status: "online",
    battery: 95,
    lastReading: "5 mins ago",
    value: "Closed (Scheduled)",
    connectivity: "WiFi",
    firmware: "v1.5.7",
  },
  {
    id: "SEN004",
    name: "Pasture Water Sensor",
    type: "Soil Moisture",
    location: "Pasture North",
    status: "warning",
    battery: 32,
    lastReading: "12 mins ago",
    value: "38% moisture",
    connectivity: "Cellular NB-IoT",
    firmware: "v1.4.0",
  },
];

export default async function IoTDevicesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireAccount(lang);

  const deviceStats = {
    total: devicesData.length,
    online: devicesData.filter((d) => d.status === "online").length,
    warning: devicesData.filter((d) => d.status === "warning").length,
    offline: devicesData.filter((d) => d.status === "offline").length,
    avgBattery: Math.round(
      devicesData.reduce((sum, d) => sum + d.battery, 0) / devicesData.length
    ),
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
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
            <RefreshCw className="h-3.5 w-3.5 text-muted" />
            Sync Gateway
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-leaf-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-leaf-800">
            <Plus className="h-3.5 w-3.5" />
            Provision Device
          </button>
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-leaf-800 sm:text-3xl">
          IoT Devices & Telemetry
        </h1>
        <p className="mt-1 text-sm text-muted">
          Real-time field probes, soil moisture sensors, weather stations & automated valve actuators.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="p-4 border border-line bg-white shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Total Nodes</p>
          <p className="mt-1 text-2xl font-extrabold text-leaf-800">{deviceStats.total}</p>
          <p className="mt-0.5 text-[11px] text-muted">LoRa & Cellular</p>
        </Card>

        <Card className="p-4 border border-line bg-white shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Online & Healthy</p>
          <p className="mt-1 text-2xl font-extrabold text-leaf-700">{deviceStats.online}</p>
          <p className="mt-0.5 text-[11px] text-leaf-700">100% active stream</p>
        </Card>

        <Card className="p-4 border border-line bg-white shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Action Required</p>
          <p className="mt-1 text-2xl font-extrabold text-harvest-700">{deviceStats.warning}</p>
          <p className="mt-0.5 text-[11px] text-harvest-700">1 low battery warning</p>
        </Card>

        <Card className="p-4 border border-line bg-white shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Offline Devices</p>
          <p className="mt-1 text-2xl font-extrabold text-ink">{deviceStats.offline}</p>
          <p className="mt-0.5 text-[11px] text-muted">Zero packet loss</p>
        </Card>

        <Card className="p-4 border border-line bg-white shadow-xs col-span-2 sm:col-span-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Fleet Battery Avg</p>
          <p className="mt-1 text-2xl font-extrabold text-node-800">{deviceStats.avgBattery}%</p>
          <p className="mt-0.5 text-[11px] text-node-700">Solar recharged</p>
        </Card>
      </div>

      {/* Device Roster Table */}
      <Card className="border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-ink">Connected Sensor Network</h2>
            <p className="text-xs text-muted">Autonomous periodic packet dispatch every 15 minutes</p>
          </div>
          <Badge tone="leaf" className="text-xs">LoRaWAN Gateway Active</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="pb-3 font-bold uppercase tracking-wider">Device ID & Name</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Sensor Type</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Plot / Zone</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Status</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Battery</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Latest Telemetry</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {devicesData.map((d) => (
                <tr key={d.id} className="hover:bg-cream/40 transition">
                  <td className="py-3">
                    <div className="font-bold text-ink">{d.id}</div>
                    <div className="text-[11px] text-muted">{d.name}</div>
                  </td>
                  <td className="py-3 font-medium text-ink">
                    <div className="flex items-center gap-1.5">
                      {d.type.includes("Moisture") ? (
                        <Droplets className="h-3.5 w-3.5 text-node-600" />
                      ) : d.type.includes("Weather") ? (
                        <Activity className="h-3.5 w-3.5 text-leaf-600" />
                      ) : (
                        <Cpu className="h-3.5 w-3.5 text-harvest-600" />
                      )}
                      <span>{d.type}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1 text-muted">
                      <MapPin className="h-3 w-3" />
                      <span>{d.location}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        d.status === "online"
                          ? "bg-leaf-100 text-leaf-800"
                          : "bg-harvest-100 text-harvest-800"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          d.status === "online" ? "bg-leaf-600" : "bg-harvest-500"
                        }`}
                      />
                      {d.status === "online" ? "Online" : "Warning"}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Battery
                        className={`h-3.5 w-3.5 ${
                          d.battery > 50
                            ? "text-leaf-600"
                            : d.battery > 25
                            ? "text-harvest-600"
                            : "text-red-600"
                        }`}
                      />
                      <span className="text-ink">{d.battery}%</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="font-bold text-leaf-800">{d.value}</div>
                    <div className="text-[10px] text-muted flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {d.lastReading}
                    </div>
                  </td>
                  <td className="py-3 font-medium text-muted">
                    <div className="flex items-center gap-1">
                      <Radio className="h-3 w-3 text-node-600" />
                      <span>{d.connectivity}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
