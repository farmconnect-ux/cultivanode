"use client";

import { useEffect, useState, useCallback } from "react";
import type { WeatherResponse, PlaceForecast } from "@cultivanode/shared";

let memoryCache: { data: WeatherResponse; timestamp: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function useLiveWeather() {
  const [data, setData] = useState<WeatherResponse | null>(() => {
    if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_TTL_MS) {
      return memoryCache.data;
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(!data);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // If we have valid cached data, state is already initialized (loading = !data), no need to fetch
    if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_TTL_MS) {
      return;
    }

    async function fetchWeather() {
      try {
        setLoading(true);
        const res = await fetch("/api/weather", { cache: "default" });
        if (!res.ok) throw new Error(`Weather fetch status: ${res.status}`);
        const json: WeatherResponse = await res.json();
        if (!cancelled) {
          memoryCache = { data: json, timestamp: Date.now() };
          setData(json);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load weather");
          setLoading(false);
        }
      }
    }

    fetchWeather();

    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/weather", { cache: "no-store" });
      if (!res.ok) throw new Error(`Weather fetch status: ${res.status}`);
      const json: WeatherResponse = await res.json();
      memoryCache = { data: json, timestamp: Date.now() };
      setData(json);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load weather");
      setLoading(false);
    }
  }, []);

  const getPlaceForecast = (stateNameOrId?: string): PlaceForecast | null => {
    if (!data || !("ok" in data) || !data.ok || !data.forecasts) return null;
    if (!stateNameOrId) return data.forecasts[0] ?? null;

    const lower = stateNameOrId.toLowerCase();
    return (
      data.forecasts.find(
        (f) =>
          f.place.town.toLowerCase().includes(lower) ||
          f.place.state.toLowerCase().includes(lower)
      ) ?? data.forecasts[0] ?? null
    );
  };

  return { data, loading, error, refresh, getPlaceForecast };
}
