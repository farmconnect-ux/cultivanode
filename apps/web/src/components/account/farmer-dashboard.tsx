import Link from "next/link";
import { formatNaira } from "@cultivanode/shared";
import { Alert, Badge, Card } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { BookingSummary } from "@/lib/account/bookings";
import type { Account } from "@/lib/account/session";
import {
  MapPin,
  TrendingUp,
  Wrench,
  Heart,
  Droplets,
  AlertTriangle,
  Wheat,
  CloudRain,
  ArrowUpRight,
  Activity,
  BrainCircuit,
  Zap,
  DollarSign,
  Sun,
  Wind,
  CheckCircle2,
  Cpu,
  Layers,
  Calendar,
  Clock,
  Sparkles,
  Thermometer,
  Battery,
} from "lucide-react";

type Farm = {
  id: string;
  name: string;
  state: string | null;
  lga: string | null;
  area_ha: number | null;
};

// IoT Telemetry Readings modeled from IoT sensor grid
const mockSensorReadings = [
  { id: "SEN-01", location: "Plot A1 – Grain Zone", soilMoisture: 65, temp: 28, humidity: 72, ph: 6.8, battery: 88, status: "optimal" },
  { id: "SEN-02", location: "Plot B2 – Cassava Hub", soilMoisture: 42, temp: 32, humidity: 55, ph: 7.1, battery: 92, status: "low-moisture" },
  { id: "SEN-03", location: "Greenhouse Alpha", soilMoisture: 76, temp: 26, humidity: 82, ph: 6.5, battery: 74, status: "optimal" },
  { id: "SEN-04", location: "Pasture North", soilMoisture: 38, temp: 34, humidity: 48, ph: 6.9, battery: 32, status: "low-battery" },
];

const mockRecentSales = [
  { crop: "Yellow Maize", quantity: "2,500 kg", price: 640, revenue: 1600000, buyer: "Premier Feedmills Ibadan", date: "2026-10-06", icon: "🌽" },
  { crop: "White Garri", quantity: "1,200 kg", price: 1100, revenue: 1320000, buyer: "Oshodi Wholesale Hub", date: "2026-10-04", icon: "🥔" },
  { crop: "Soybeans", quantity: "3,000 kg", price: 850, revenue: 2550000, buyer: "Grand Cereals Kano", date: "2026-09-29", icon: "🌱" },
];

const mockUpcomingTasks = [
  { task: "Drip Irrigation – Plot A1", priority: "high", dueDate: "Today, 2:00 PM", assignee: "Ibrahim Musa", link: "/account/tasks" },
  { task: "Maize Harvest (Cycle MZ-26)", priority: "high", dueDate: "Tomorrow, 6:30 AM", assignee: "Harvester Crew", link: "/account/crops" },
  { task: "Tractor Service (TAFE 45 DI)", priority: "medium", dueDate: "Oct 12, 10:00 AM", assignee: "Service Bay", link: "/account/machinery" },
  { task: "Poultry Newcastle Booster", priority: "low", dueDate: "Oct 15, 9:00 AM", assignee: "Vet Team", link: "/account/livestock" },
];

const mockWeatherOutlook = [
  { day: "Today", high: 33, low: 24, icon: "☀️", rain: 10, condition: "Sunny" },
  { day: "Sat", high: 31, low: 23, icon: "⛅", rain: 35, condition: "Partly Cloudy" },
  { day: "Sun", high: 28, low: 22, icon: "🌧️", rain: 80, condition: "Thunderstorms" },
  { day: "Mon", high: 30, low: 23, icon: "⛅", rain: 25, condition: "Overcast" },
  { day: "Tue", high: 32, low: 24, icon: "☀️", rain: 5, condition: "Clear Sky" },
];

export function FarmerDashboard({
  lang,
  account,
  t,
  farms,
  bookings,
}: {
  lang: Locale;
  account: Account;
  t: Dictionary;
  farms: Farm[];
  bookings: BookingSummary[];
}) {
  const firstName = account.profile.full_name?.split(" ")[0] ?? "Farmer";
  const tier = account.profile.verification_tier;

  const totalAreaHa = farms.reduce((sum, f) => sum + (Number(f.area_ha) || 0), 0);

  // Operational partitioning of jobs
  const activeJobs = bookings.filter((b) =>
    ["requested", "accepted", "in_progress", "awaiting_confirmation", "disputed"].includes(b.status)
  );

  return (
    <div className="space-y-6">
      {/* Verification Notice if Tier < 1 */}
      {tier < 1 && (
        <Alert tone="warning">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span>
              <strong>Identity Verification Needed:</strong> Add your National Identification Number (NIN) to unlock tractor & farm equipment booking.
            </span>
            <Link
              href={`/${lang}/account/verification?ws=farmer`}
              className="font-bold underline text-harvest-800 hover:text-harvest-900"
            >
              Verify Identity →
            </Link>
          </div>
        </Alert>
      )}

      {/* Header Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-leaf-800 sm:text-3xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Digital farm operating system — real-time operations, telemetry & enterprise intelligence.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/${lang}/account/crops?ws=farmer`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-leaf-700 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-leaf-800 transition"
          >
            <Zap className="h-3.5 w-3.5 text-harvest-300" />
            + New Crop Cycle
          </Link>
          <Link
            href={`/${lang}/account/iot?ws=farmer`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-xs font-bold text-ink shadow-sm hover:bg-cream transition"
          >
            <Cpu className="h-3.5 w-3.5 text-node-600" />
            IoT Telemetry
          </Link>
        </div>
      </div>

      {/* Top Executive Metric Cards with Geometry Accents (in CultivaNode Colors) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {/* Farm Land */}
        <Link
          href={`/${lang}/account/farms?ws=farmer`}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-leaf-800 to-leaf-600 p-4 text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-white/10" />
          <div className="absolute -right-1 top-6 h-8 w-8 rounded-full bg-white/10" />
          <div className="mb-2 inline-flex rounded-lg bg-white/20 p-2">
            <MapPin className="h-4 w-4 text-white" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-leaf-100">Farm Land</p>
          <p className="mt-0.5 text-xl font-extrabold sm:text-2xl">
            {totalAreaHa > 0 ? `${totalAreaHa.toFixed(1)} ha` : `${farms.length} Farms`}
          </p>
          <p className="mt-0.5 text-[11px] text-leaf-100 flex items-center gap-0.5">
            <ArrowUpRight className="h-3 w-3" />
            {farms.length} active registered parcels
          </p>
        </Link>

        {/* Projected Revenue */}
        <Link
          href={`/${lang}/account/finance?ws=farmer`}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-node-800 to-node-600 p-4 text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-white/10" />
          <div className="absolute -right-1 top-6 h-8 w-8 rounded-full bg-white/10" />
          <div className="mb-2 inline-flex rounded-lg bg-white/20 p-2">
            <DollarSign className="h-4 w-4 text-white" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-node-100">Cycle Revenue</p>
          <p className="mt-0.5 text-xl font-extrabold sm:text-2xl">₦5.47M</p>
          <p className="mt-0.5 text-[11px] text-node-100 flex items-center gap-0.5">
            <ArrowUpRight className="h-3 w-3" />
            +18.4% vs last cycle
          </p>
        </Link>

        {/* Operating Margin */}
        <Link
          href={`/${lang}/account/variance?ws=farmer`}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-leaf-700 to-leaf-500 p-4 text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-white/10" />
          <div className="absolute -right-1 top-6 h-8 w-8 rounded-full bg-white/10" />
          <div className="mb-2 inline-flex rounded-lg bg-white/20 p-2">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-leaf-100">Gross Margin</p>
          <p className="mt-0.5 text-xl font-extrabold sm:text-2xl">41.2%</p>
          <p className="mt-0.5 text-[11px] text-leaf-100">Cost-of-production safe</p>
        </Link>

        {/* Machinery Fleet */}
        <Link
          href={`/${lang}/account/machinery?ws=farmer`}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-soil-800 to-soil-600 p-4 text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-white/10" />
          <div className="absolute -right-1 top-6 h-8 w-8 rounded-full bg-white/10" />
          <div className="mb-2 inline-flex rounded-lg bg-white/20 p-2">
            <Wrench className="h-4 w-4 text-white" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-soil-100">Equipment Fleet</p>
          <p className="mt-0.5 text-xl font-extrabold sm:text-2xl">
            {activeJobs.length > 0 ? `${activeJobs.length} Booked` : "3 Ready"}
          </p>
          <p className="mt-0.5 text-[11px] text-soil-100">Telematics & hours logged</p>
        </Link>

        {/* Livestock Headcount */}
        <Link
          href={`/${lang}/account/livestock?ws=farmer`}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-harvest-700 to-harvest-500 p-4 text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg col-span-2 sm:col-span-1"
        >
          <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-white/10" />
          <div className="absolute -right-1 top-6 h-8 w-8 rounded-full bg-white/10" />
          <div className="mb-2 inline-flex rounded-lg bg-white/20 p-2">
            <Heart className="h-4 w-4 text-white" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-harvest-100">Livestock Herd</p>
          <p className="mt-0.5 text-xl font-extrabold sm:text-2xl">100% Cleared</p>
          <p className="mt-0.5 text-[11px] text-harvest-100">Zero withdrawal lock</p>
        </Link>
      </div>

      {/* AI Agronomic Advisory Block */}
      <Card className="border border-line bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-leaf-100 text-leaf-800">
              <BrainCircuit className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">AI Agronomic Recommendations</h2>
              <p className="text-[11px] text-muted">Machine intelligence grounded on microclimate, GAP guidelines & field scouting</p>
            </div>
          </div>
          <Badge tone="leaf" className="text-xs">3 Active Insights</Badge>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Recommendation 1: Irrigation */}
          <div className="rounded-xl border border-node-200 bg-node-50 p-3.5 transition hover:shadow-sm">
            <div className="flex items-start gap-2.5">
              <div className="rounded-lg bg-white p-2 shadow-xs text-node-700 shrink-0">
                <Droplets className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-node-900 leading-snug">
                  Plot B2 cassava soil moisture dropped to <strong>42%</strong>. Drip irrigation recommended within 8 hours to avoid root moisture stress.
                </p>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[11px] text-node-700">
                    <Activity className="h-3 w-3" />
                    89% confidence
                  </span>
                  <Link
                    href={`/${lang}/account/irrigation?ws=farmer`}
                    className="text-[11px] font-bold text-node-700 hover:underline"
                  >
                    Schedule Run →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation 2: Pest & Disease */}
          <div className="rounded-xl border border-harvest-200 bg-harvest-50 p-3.5 transition hover:shadow-sm">
            <div className="flex items-start gap-2.5">
              <div className="rounded-lg bg-white p-2 shadow-xs text-harvest-700 shrink-0">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-harvest-900 leading-snug">
                  Relative humidity rising above 80% with rain forecast on Sunday. High risk of Fall Armyworm egg hatch. Scout maize whorls today.
                </p>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[11px] text-harvest-700">
                    <Activity className="h-3 w-3" />
                    94% confidence
                  </span>
                  <Link
                    href={`/${lang}/account/crops?ws=farmer`}
                    className="text-[11px] font-bold text-harvest-700 hover:underline"
                  >
                    Log Scouting →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation 3: Harvest Window */}
          <div className="rounded-xl border border-leaf-200 bg-leaf-50 p-3.5 transition hover:shadow-sm">
            <div className="flex items-start gap-2.5">
              <div className="rounded-lg bg-white p-2 shadow-xs text-leaf-700 shrink-0">
                <Wheat className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-leaf-900 leading-snug">
                  Yellow Maize Cycle MZ-26 at 13.2% kernel moisture. Dry window open through Saturday before heavy precipitation.
                </p>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[11px] text-leaf-700">
                    <Activity className="h-3 w-3" />
                    92% confidence
                  </span>
                  <Link
                    href={`/${lang}/account/crops?ws=farmer`}
                    className="text-[11px] font-bold text-leaf-700 hover:underline"
                  >
                    Plan Harvest →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Middle Grid: Real-Time IoT Sensors | Weather Station | Upcoming Tasks */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* 1. Real-Time IoT Sensor Telemetry */}
        <Card className="flex flex-col justify-between border border-line bg-white p-5 shadow-sm">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-node-600" />
                <h3 className="text-sm font-bold text-ink">Field Sensors & IoT</h3>
              </div>
              <Link
                href={`/${lang}/account/iot?ws=farmer`}
                className="text-xs font-bold text-leaf-700 hover:underline"
              >
                View Telemetry →
              </Link>
            </div>
            <p className="mb-3 text-xs text-muted">
              Live LoRaWAN telemetry from soil probes and micro-stations
            </p>

            <div className="space-y-2.5">
              {mockSensorReadings.map((sensor) => (
                <div
                  key={sensor.id}
                  className="rounded-xl border border-line/60 bg-cream/40 p-2.5 text-xs transition hover:bg-cream"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink">{sensor.location}</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        sensor.status === "optimal"
                          ? "bg-leaf-100 text-leaf-800"
                          : sensor.status === "low-moisture"
                          ? "bg-harvest-100 text-harvest-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          sensor.status === "optimal"
                            ? "bg-leaf-600"
                            : sensor.status === "low-moisture"
                            ? "bg-harvest-500"
                            : "bg-red-600"
                        }`}
                      />
                      {sensor.status === "optimal" ? "Optimal" : sensor.status === "low-moisture" ? "Low Moisture" : "Low Battery"}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-4 gap-2 text-[11px] text-muted">
                    <div>
                      <span className="block text-[10px] uppercase">Moisture</span>
                      <strong className="text-ink">{sensor.soilMoisture}%</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase">Temp</span>
                      <strong className="text-ink">{sensor.temp}°C</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase">pH</span>
                      <strong className="text-ink">{sensor.ph}</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase">Battery</span>
                      <strong className="text-ink">{sensor.battery}%</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs text-muted">
            <span>4 probes connected</span>
            <span className="text-leaf-700 font-semibold">100% gateway uptime</span>
          </div>
        </Card>

        {/* 2. Microclimate Weather Station */}
        <Card className="flex flex-col justify-between border border-line bg-white p-5 shadow-sm">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CloudRain className="h-4 w-4 text-node-600" />
                <h3 className="text-sm font-bold text-ink">Farm Microclimate</h3>
              </div>
              <Link
                href={`/${lang}/account/weather?ws=farmer`}
                className="text-xs font-bold text-leaf-700 hover:underline"
              >
                Detailed Station →
              </Link>
            </div>

            {/* Current Condition Card */}
            <div className="rounded-xl border border-leaf-200 bg-gradient-to-br from-leaf-50 to-node-50 p-3.5 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-leaf-800">Current Weather</span>
                  <div className="text-2xl font-extrabold text-leaf-900">33°C</div>
                  <span className="text-xs text-muted">Clear & Sunny · Feels like 35°C</span>
                </div>
                <Sun className="h-10 w-10 text-harvest-500 animate-pulse" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-leaf-200/60 pt-2 text-xs text-muted">
                <div className="flex items-center gap-1.5">
                  <Wind className="h-3.5 w-3.5 text-node-600" />
                  <span>Wind: 11 km/h ENE</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Droplets className="h-3.5 w-3.5 text-node-600" />
                  <span>Humidity: 64%</span>
                </div>
              </div>
            </div>

            {/* 5-Day Agro Forecast */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">5-Day Spray & Field Window</span>
              <div className="grid grid-cols-5 gap-1 pt-1 text-center text-xs">
                {mockWeatherOutlook.map((day) => (
                  <div key={day.day} className="rounded-lg border border-line/60 bg-cream/30 p-1.5">
                    <span className="block text-[10px] font-bold text-muted">{day.day}</span>
                    <span className="my-1 block text-base">{day.icon}</span>
                    <span className="block text-[11px] font-bold text-ink">{day.high}°</span>
                    <span className="block text-[10px] font-medium text-node-700">{day.rain}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs">
            <span className="text-muted">Spray window suitability:</span>
            <Badge tone="leaf" className="text-[11px]">Optimal Until 4:00 PM</Badge>
          </div>
        </Card>

        {/* 3. Upcoming Operational Tasks */}
        <Card className="flex flex-col justify-between border border-line bg-white p-5 shadow-sm">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-leaf-700" />
                <h3 className="text-sm font-bold text-ink">Field Tasks & Roster</h3>
              </div>
              <Link
                href={`/${lang}/account/tasks?ws=farmer`}
                className="text-xs font-bold text-leaf-700 hover:underline"
              >
                Task Board →
              </Link>
            </div>
            <p className="mb-3 text-xs text-muted">
              Scheduled GAP farm operations and worker assignments
            </p>

            <div className="space-y-2">
              {mockUpcomingTasks.map((t, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between rounded-xl border border-line/60 bg-cream/30 p-2.5 text-xs transition hover:bg-cream"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-ink">{t.task}</div>
                    <div className="text-[11px] text-muted flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted" />
                      {t.dueDate} · {t.assignee}
                    </div>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      t.priority === "high"
                        ? "bg-red-100 text-red-800"
                        : t.priority === "medium"
                        ? "bg-harvest-100 text-harvest-800"
                        : "bg-leaf-100 text-leaf-800"
                    }`}
                  >
                    {t.priority.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs">
            <span className="text-muted">Labor attendance today:</span>
            <span className="font-bold text-leaf-700">6 of 6 Present</span>
          </div>
        </Card>
      </div>

      {/* Bottom Grid: Recent Produce Offtake Sales & Fleet Telematics */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Recent Produce Sales */}
        <Card className="border border-line bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-node-600" />
              <h3 className="text-sm font-bold text-ink">Recent Produce Sales & Offtake</h3>
            </div>
            <Link
              href={`/${lang}/account/marketplace/seller?ws=farmer`}
              className="text-xs font-bold text-leaf-700 hover:underline"
            >
              Seller Ledger →
            </Link>
          </div>
          <div className="space-y-2">
            {mockRecentSales.map((sale, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-line/60 bg-cream/30 p-3 text-xs transition hover:bg-cream"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{sale.icon}</span>
                  <div>
                    <div className="font-bold text-ink">{sale.crop}</div>
                    <div className="text-[11px] text-muted">
                      {sale.quantity} · {sale.buyer}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-leaf-800">{formatNaira(sale.revenue)}</div>
                  <div className="text-[10px] text-muted">{sale.date}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Machinery Fleet Telematics */}
        <Card className="border border-line bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-soil-700" />
              <h3 className="text-sm font-bold text-ink">Fleet Telematics & Maintenance</h3>
            </div>
            <Link
              href={`/${lang}/account/machinery?ws=farmer`}
              className="text-xs font-bold text-leaf-700 hover:underline"
            >
              Fleet Dashboard →
            </Link>
          </div>
          <div className="space-y-2.5">
            {[
              { name: "TAFE 45 DI 4WD", status: "Operational", hours: "1,245 hrs", plot: "Plot A1 (Tillage)", color: "leaf" },
              { name: "John Deere 5050D", status: "Operational", hours: "890 hrs", plot: "Barn Equipment Shed", color: "leaf" },
              { name: "Boom Sprayer 600L", status: "Service Needed", hours: "450 hrs", plot: "Service Bay (Filter Check)", color: "harvest" },
            ].map((mach, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-line/60 bg-cream/30 p-3 text-xs transition hover:bg-cream"
              >
                <div>
                  <div className="font-bold text-ink">{mach.name}</div>
                  <div className="text-[11px] text-muted">{mach.hours} · {mach.plot}</div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    mach.color === "leaf"
                      ? "bg-leaf-100 text-leaf-800"
                      : "bg-harvest-100 text-harvest-800"
                  }`}
                >
                  {mach.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
