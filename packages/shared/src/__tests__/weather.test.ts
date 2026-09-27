import { describe, expect, it } from 'vitest';
import { openMeteoUrl, parseOpenMeteo, PILOT_WEATHER_PLACES, weatherAlerts, weatherKind, type WeatherDay } from '../weather';

const day = (over: Partial<WeatherDay> = {}): WeatherDay => ({
  date: '2026-09-27', code: 2, maxC: 30, minC: 22, rainMm: 3, rainChance: 40, windKmh: 12, ...over,
});

describe('weather', () => {
  it('asks Open-Meteo for all pilot states in one Lagos-time request', () => {
    const url = new URL(openMeteoUrl(PILOT_WEATHER_PLACES));
    expect(url.host).toBe('api.open-meteo.com');
    expect(url.searchParams.get('latitude')!.split(',')).toHaveLength(6);
    expect(url.searchParams.get('timezone')).toBe('Africa/Lagos');
    expect(url.searchParams.get('apikey')).toBeNull();
    const paid = new URL(openMeteoUrl(PILOT_WEATHER_PLACES.slice(0, 1), 'k'));
    expect(paid.host).toBe('customer-api.open-meteo.com');
    expect(paid.searchParams.get('apikey')).toBe('k');
  });

  it('parses a multi-place response and drops broken days', () => {
    const places = PILOT_WEATHER_PLACES.slice(0, 2);
    const raw = [
      {
        current: { temperature_2m: 27.4, relative_humidity_2m: 81, weather_code: 3, wind_speed_10m: 9 },
        daily: {
          time: ['2026-09-27', '2026-09-28'],
          weather_code: [61, 2],
          temperature_2m_max: [29.1, null],
          temperature_2m_min: [22.3, 21],
          precipitation_sum: [31.2, 0],
          precipitation_probability_max: [90, 10],
          wind_speed_10m_max: [18, 10],
        },
      },
      { daily: { time: [] } },
    ];
    const [a, b] = parseOpenMeteo(raw, places);
    expect(a!.place.town).toBe('Ibadan');
    expect(a!.now).toEqual({ tempC: 27.4, humidity: 81, code: 3, windKmh: 9 });
    expect(a!.days).toHaveLength(1);
    expect(a!.alerts).toEqual([{ kind: 'heavy_rain', date: '2026-09-27', value: 31.2 }]);
    expect(b!.now).toBeNull();
    expect(b!.days).toEqual([]);
    expect(() => parseOpenMeteo(raw, PILOT_WEATHER_PLACES)).toThrow('weather_response_mismatch');
  });

  it('raises dry-week, heat and wind alerts', () => {
    const dry = Array.from({ length: 7 }, (_, i) => day({ date: `d${i}`, rainMm: 0.2 }));
    expect(weatherAlerts(dry).map((a) => a.kind)).toEqual(['dry_week']);
    expect(weatherAlerts([day({ maxC: 37 }), day({ windKmh: 45 })]).map((a) => a.kind)).toEqual(['heat', 'strong_wind']);
    expect(weatherAlerts([day()])).toEqual([]);
  });

  it('names WMO weather codes', () => {
    expect([0, 2, 3, 45, 53, 63, 81, 95, 7].map(weatherKind)).toEqual([
      'clear', 'partly', 'cloudy', 'fog', 'drizzle', 'rain', 'rain', 'storm', 'unknown',
    ]);
  });
});
