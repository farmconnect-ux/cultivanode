import { WEATHER_THRESHOLDS, type PlaceForecast, type WeatherAlert, type WeatherKind } from "@cultivanode/shared";

const KIND_LABEL: Record<WeatherKind, string> = {
  clear: "Sunny",
  partly: "Partly cloudy",
  cloudy: "Cloudy",
  fog: "Fog",
  drizzle: "Drizzle",
  rain: "Rain",
  storm: "Thunderstorm",
  unknown: "—",
};

const ICON: Record<WeatherKind, string> = {
  clear: "M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z",
  partly: "M8 3v1.5M3.5 8H2M4.6 4.6l1 1M11.4 4.6l-1 1M6 11a3.5 3.5 0 1 1 5.4-3M8 20h9a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.4 1.6A3.3 3.3 0 0 0 8 20Z",
  cloudy: "M7 19h10a4.5 4.5 0 0 0 .6-9A6 6 0 0 0 6 11.5 3.8 3.8 0 0 0 7 19Z",
  fog: "M4 10h16M3 14h18M6 18h12M7 6h10",
  drizzle: "M7 15h10a4 4 0 0 0 .5-8A5.5 5.5 0 0 0 6.6 8.5 3.3 3.3 0 0 0 7 15ZM9 18v1M13 18v1M17 18v1",
  rain: "M7 14h10a4 4 0 0 0 .5-8A5.5 5.5 0 0 0 6.6 7.5 3.3 3.3 0 0 0 7 14ZM8 17l-1 3M12 17l-1 3M16 17l-1 3",
  storm: "M7 13h10a4 4 0 0 0 .5-8A5.5 5.5 0 0 0 6.6 6.5 3.3 3.3 0 0 0 7 13ZM12 14l-2 4h3l-2 4",
  unknown: "M12 12h.01",
};

function WeatherIcon({ kind, className = "size-6" }: { kind: WeatherKind; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICON[kind]} />
    </svg>
  );
}

const weekday = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });

function alertText(a: WeatherAlert): string {
  const on = a.date ? ` on ${weekday(a.date)}` : "";
  switch (a.kind) {
    case "heavy_rain":
      return `Heavy rain${on} (${Math.round(a.value)} mm): delay fertiliser and spraying, check drainage`;
    case "dry_week":
      return `Dry week ahead (${a.value} mm in 7 days): water young crops, hold planting`;
    case "heat":
      return `Heat${on} (${Math.round(a.value)}°C): work early, water nurseries`;
    case "strong_wind":
      return `Strong wind${on} (${Math.round(a.value)} km/h): no spraying`;
  }
}

const PROVIDER_CREDIT: Record<string, React.ReactNode> = {
  weatherapi: (
    <>
      Powered by{" "}
      <a href="https://www.weatherapi.com/" className="underline" rel="noopener noreferrer" target="_blank">WeatherAPI.com</a>.
    </>
  ),
  open_meteo: (
    <>
      Weather data by{" "}
      <a href="https://open-meteo.com/" className="underline" rel="noopener noreferrer" target="_blank">Open-Meteo.com</a> (CC BY 4.0).
    </>
  ),
};

type PanelProps = { forecasts: PlaceForecast[]; fetchedAt: string; provider: string; stale: boolean };

/** Current conditions, a daily forecast strip and farm alerts for each pilot state. */
export function WeatherPanel({ forecasts, fetchedAt, provider, stale }: PanelProps) {
  const withAlerts = forecasts.filter((f) => f.alerts.length > 0).length;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-on-surface-variant">
        {withAlerts > 0 ? `${withAlerts} of ${forecasts.length} pilot states have a farm alert in the forecast.` : "No farm alerts in the pilot states in the forecast."}{" "}
        Alerts: rain ≥ {WEATHER_THRESHOLDS.heavyRainMm} mm in a day, under {WEATHER_THRESHOLDS.dryWeekMm} mm in 7 days, ≥{" "}
        {WEATHER_THRESHOLDS.heatC}°C, wind ≥ {WEATHER_THRESHOLDS.strongWindKmh} km/h.
      </p>
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {forecasts.map((f) => {
          const nowKind: WeatherKind = f.now?.kind ?? "unknown";
          return (
            <li key={f.place.state} className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{f.place.state}</p>
                  <p className="text-sm text-on-surface-variant">{f.place.town}</p>
                </div>
                {f.now && (
                  <div className="flex items-center gap-2 text-right">
                    <WeatherIcon kind={nowKind} className="size-8 text-primary-container" />
                    <div>
                      <p className="text-2xl font-extrabold tabular-nums">{Math.round(f.now.tempC)}°C</p>
                      <p className="text-xs text-on-surface-variant">
                        {KIND_LABEL[nowKind]} · {Math.round(f.now.humidity)}% humid
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <table className="w-full table-fixed text-center text-xs">
                <caption className="sr-only">Forecast for {f.place.town}, {f.place.state}</caption>
                <thead>
                  <tr>
                    {f.days.map((d) => (
                      <th key={d.date} scope="col" className="font-semibold text-on-surface-variant">{weekday(d.date)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {f.days.map((d) => (
                      <td key={d.date} className="py-1">
                        <span className="flex justify-center text-primary-container" title={KIND_LABEL[d.kind]}>
                          <WeatherIcon kind={d.kind} className="size-5" />
                        </span>
                        <span className="sr-only">{KIND_LABEL[d.kind]}</span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    {f.days.map((d) => (
                      <td key={d.date} className="tabular-nums leading-tight">
                        <span className="block font-semibold">{Math.round(d.maxC)}°</span>
                        <span className="block text-on-surface-variant">{Math.round(d.minC)}°</span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    {f.days.map((d) => (
                      <td key={d.date} className={`tabular-nums ${d.rainMm >= WEATHER_THRESHOLDS.heavyRainMm ? "font-bold text-info" : "text-on-surface-variant"}`}>
                        {d.rainMm >= 0.5 ? `${Math.round(d.rainMm)}mm` : "–"}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
              {f.alerts.length > 0 && (
                <ul className="flex flex-col gap-1">
                  {f.alerts.map((a) => (
                    <li key={a.kind} className="flex items-start gap-2 rounded-md bg-caution-soft px-2 py-1.5 text-sm text-[#b45309]">
                      <svg viewBox="0 0 24 24" className="mt-0.5 size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M12 3 2 20h20L12 3ZM12 10v4M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span><span className="sr-only">Alert: </span>{alertText(a)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-on-surface-variant">
        {PROVIDER_CREDIT[provider] ?? <>Weather data from {provider}.</>} Updated{" "}
        {new Date(fetchedAt).toLocaleString("en-GB", { timeZone: "Africa/Lagos", hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })} (Lagos time).
        {stale && <strong className="ml-1 text-[#b45309]">The weather service did not answer, so this is the last forecast we received.</strong>}
      </p>
    </div>
  );
}
