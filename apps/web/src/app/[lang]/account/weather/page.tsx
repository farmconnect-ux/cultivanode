import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import {
  CloudRain,
  Sun,
  Wind,
  Droplets,
  Thermometer,
  Eye,
  ArrowLeft,
  Compass,
  AlertTriangle,
  Calendar,
  CheckCircle2,
} from "lucide-react";

const forecast = [
  { day: "Mon", high: 33, low: 23, condition: "☀️", rain: 5, label: "Sunny" },
  { day: "Tue", high: 32, low: 24, condition: "⛅", rain: 15, label: "Partly Cloudy" },
  { day: "Wed", high: 30, low: 22, condition: "🌧️", rain: 75, label: "Afternoon Showers" },
  { day: "Thu", high: 28, low: 21, condition: "🌧️", rain: 85, label: "Thunderstorms" },
  { day: "Fri", high: 31, low: 23, condition: "⛅", rain: 30, label: "Scattered Clouds" },
  { day: "Sat", high: 34, low: 24, condition: "☀️", rain: 10, label: "Dry & Clear" },
  { day: "Sun", high: 35, low: 25, condition: "☀️", rain: 0, label: "Full Sun" },
];

export default async function WeatherStationPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireAccount(lang);

  const currentWeather = {
    temp: 33,
    condition: "Sunny & Clear",
    feelsLike: 36,
    wind: "12 km/h ENE",
    humidity: "62%",
    visibility: "10 km",
    pressure: "1012 hPa",
    solarRadiation: "850 W/m²",
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
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
          <span className="text-xs font-bold text-muted">Intelligence & Microclimate</span>
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-leaf-800 sm:text-3xl">
          Farm Weather & Microclimate Station
        </h1>
        <p className="mt-1 text-sm text-muted">
          Hyperlocal meteorological telemetry, evapotranspiration rates & Good Agricultural Practices (GAP) spray windows.
        </p>
      </div>

      {/* Current Weather Station Block */}
      <Card className="border border-line bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Main Temp & Condition */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-leaf-200 bg-gradient-to-br from-leaf-50 to-cream p-6 text-center">
            <Sun className="h-16 w-16 text-harvest-500 mb-3 animate-pulse" />
            <div className="text-4xl font-extrabold text-leaf-900">{currentWeather.temp}°C</div>
            <p className="mt-1 font-bold text-leaf-800">{currentWeather.condition}</p>
            <p className="text-xs text-muted">Feels like {currentWeather.feelsLike}°C · Solar Rad: {currentWeather.solarRadiation}</p>
          </div>

          {/* Telemetry Sensor Metrics */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Wind, label: "Wind & Direction", value: currentWeather.wind, color: "text-node-700" },
              { icon: Droplets, label: "Relative Humidity", value: currentWeather.humidity, color: "text-node-700" },
              { icon: Eye, label: "Atmospheric Visibility", value: currentWeather.visibility, color: "text-leaf-700" },
              { icon: Thermometer, label: "Barometric Pressure", value: currentWeather.pressure, color: "text-harvest-700" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center justify-center rounded-xl border border-line/60 bg-cream/30 p-3.5 text-center transition hover:bg-cream"
              >
                <item.icon className={`h-6 w-6 mb-2 ${item.color}`} />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">{item.label}</span>
                <span className="mt-0.5 text-sm font-extrabold text-ink">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 7-Day Agro Forecast */}
      <Card className="border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-ink">7-Day Agricultural Outlook</h2>
          <span className="text-xs text-muted">Precipitation probability & diurnal ranges</span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {forecast.map((day, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-line/60 bg-cream/30 p-3 text-center transition hover:bg-cream/70"
            >
              <span className="text-xs font-bold text-muted">{day.day}</span>
              <span className="my-2 block text-2xl">{day.condition}</span>
              <div className="text-sm font-extrabold text-ink">{day.high}°</div>
              <div className="text-[11px] text-muted">{day.low}°</div>
              <div className="mt-2 text-xs font-bold text-node-700">{day.rain}% rain</div>
            </div>
          ))}
        </div>
      </Card>

      {/* GAP Spray Suitability & Agronomic Growing Conditions */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="border border-line bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-ink mb-3">Field Working Conditions</h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-line/40 pb-2">
              <span className="text-muted">Tillage Soil Moisture Window</span>
              <Badge tone="leaf">Optimal (42% moisture)</Badge>
            </div>
            <div className="flex items-center justify-between border-b border-line/40 pb-2">
              <span className="text-muted">Chemical Spray Suitability</span>
              <Badge tone="leaf">Safe Until 4:00 PM (Wind &lt; 15 km/h)</Badge>
            </div>
            <div className="flex items-center justify-between border-b border-line/40 pb-2">
              <span className="text-muted">Evapotranspiration Index (ET0)</span>
              <span className="font-bold text-ink">4.8 mm/day</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Heat Stress Index for Livestock</span>
              <Badge tone="warning">Moderate (Ensure Shades & Water)</Badge>
            </div>
          </div>
        </Card>

        <Card className="border border-line bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-ink mb-3">Agronomic Action Alerts</h3>
          <div className="space-y-2.5 text-xs">
            <div className="rounded-xl border border-harvest-200 bg-harvest-50 p-3 text-harvest-900">
              <strong>Precipitation Alert:</strong> High rainfall expected Wednesday & Thursday. Complete any open furrow planting or fertilizer topdressing before Tuesday evening.
            </div>
            <div className="rounded-xl border border-leaf-200 bg-leaf-50 p-3 text-leaf-900">
              <strong>Grain Drying Window:</strong> Full sun and low humidity through Monday afternoon provide ideal solar drying conditions for harvested maize cobs.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
