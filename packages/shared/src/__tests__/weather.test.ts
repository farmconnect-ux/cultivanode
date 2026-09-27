import { describe, expect, it } from 'vitest';
import { PILOT_WEATHER_PLACES, WEATHER_THRESHOLDS, weatherAlerts, type WeatherDay } from '../weather';
import * as edge from '../../../../supabase/functions/_shared/providers/weather';

const day = (over: Partial<WeatherDay> = {}): WeatherDay => ({
  date: '2026-09-27', kind: 'partly', maxC: 30, minC: 22, rainMm: 3, rainChance: 40, windKmh: 12, ...over,
});

describe('weather rules', () => {
  it('raises heavy-rain, dry-week, heat and wind alerts', () => {
    expect(weatherAlerts([day({ rainMm: 31.2 })])).toEqual([{ kind: 'heavy_rain', date: '2026-09-27', value: 31.2 }]);
    const dry = Array.from({ length: 7 }, (_, i) => day({ date: `d${i}`, rainMm: 0.2 }));
    expect(weatherAlerts(dry).map((a) => a.kind)).toEqual(['dry_week']);
    expect(weatherAlerts(dry.slice(0, 3))).toEqual([]); // a 3-day forecast cannot show a dry week
    expect(weatherAlerts([day({ maxC: 37 }), day({ windKmh: 45 })]).map((a) => a.kind)).toEqual(['heat', 'strong_wind']);
    expect(weatherAlerts([day()])).toEqual([]);
  });

  it('matches the Edge Function copy (places, thresholds, alert rules)', () => {
    expect(edge.PILOT_PLACES).toEqual(PILOT_WEATHER_PLACES);
    expect(edge.THRESHOLDS).toEqual(WEATHER_THRESHOLDS);
    const days = [day({ rainMm: 40, maxC: 38, windKmh: 50 }), ...Array.from({ length: 6 }, () => day({ rainMm: 0 }))];
    expect(edge.weatherAlerts(days)).toEqual(weatherAlerts(days));
  });
});
