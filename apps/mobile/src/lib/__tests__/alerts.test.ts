import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRpc = vi.fn();
const query = {
  select: vi.fn(() => query),
  in: vi.fn(() => query),
  is: vi.fn(() => query),
  order: vi.fn(() => query),
  limit: vi.fn(),
};
const mockFrom = vi.fn(() => query);

vi.mock('../supabase', () => ({ supabase: { from: mockFrom, rpc: mockRpc } }));
vi.mock('../monitoring', () => ({ reportError: vi.fn() }));

const EVENT = '11111111-2222-4333-8444-555555555555';
const row = (over: Record<string, unknown> = {}, data: Record<string, unknown> = {}) => ({
  id: 'n1', kind: 'farm_weather_risk', created_at: '2026-11-24T05:00:00Z',
  data: { event_id: EVENT, farm_id: 'f1', title: 'Spray for armyworm', name: 'North farm', note: '32.5 mm of rain', job_date: '2026-11-26', ...data },
  ...over,
});

describe('farm alerts on the phone (Batch 05)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps only farm alerts for the chosen farm that carry an event', async () => {
    const { toFarmAlerts } = await import('../alerts');
    const alerts = toFarmAlerts([
      row(),
      row({ id: 'n2' }, { farm_id: 'other' }),
      row({ id: 'n3', kind: 'marketplace_order_placed' }),
      row({ id: 'n4' }, { event_id: 'not-a-uuid' }),
      row({ id: 'n5', kind: 'farm_stock_low' }, { job_date: undefined, note: '2 bags' }),
    ], 'f1');
    expect(alerts.map((a) => a.id)).toEqual(['n1', 'n5']);
    expect(alerts[0]).toMatchObject({ eventId: EVENT, kind: 'farm_weather_risk', date: '2026-11-26', note: '32.5 mm of rain' });
    expect(alerts[1]).toMatchObject({ date: null, note: '2 bags' });
  });

  it('loads unread farm alerts only', async () => {
    query.limit.mockResolvedValue({ data: [row()], error: null });
    const { loadFarmAlerts, FARM_ALERT_KINDS } = await import('../alerts');
    expect(await loadFarmAlerts('f1')).toHaveLength(1);
    expect(mockFrom).toHaveBeenCalledWith('notifications');
    expect(query.in).toHaveBeenCalledWith('kind', FARM_ALERT_KINDS);
    expect(query.is).toHaveBeenCalledWith('read_at', null);
  });

  it('answers through respond_to_intelligence_event, then marks the notification read', async () => {
    mockRpc.mockResolvedValue({ error: null });
    const { answerFarmAlert } = await import('../alerts');
    expect(await answerFarmAlert({ id: 'n1', eventId: EVENT }, 'not_useful')).toBe(true);
    expect(mockRpc.mock.calls).toEqual([
      ['respond_to_intelligence_event', { p_event_id: EVENT, p_response: 'not_useful' }],
      ['mark_notifications_read', { p_ids: ['n1'] }],
    ]);
  });

  it('leaves the alert unread when the answer fails', async () => {
    mockRpc.mockResolvedValue({ error: { message: 'Alert not found.' } });
    const { answerFarmAlert } = await import('../alerts');
    expect(await answerFarmAlert({ id: 'n1', eventId: EVENT }, 'done')).toBe(false);
    expect(mockRpc).toHaveBeenCalledTimes(1);
  });

  it('has English and Yorùbá text for every alert kind the monitors raise', async () => {
    const { FARM_ALERT_KINDS } = await import('../alerts');
    const migrations = ['20261126000000_batch_05_farm_monitors.sql', '20261127000000_batch_05_weather_and_stock_monitors.sql']
      .map((f) => readFileSync(resolve(__dirname, '../../../../../supabase/migrations', f), 'utf8'))
      .join('\n');
    for (const k of FARM_ALERT_KINDS) expect(migrations).toContain(`'${k}'`);
    const en = (await import('../../i18n/en')).default;
    const yo = (await import('../../i18n/yo')).default;
    for (const k of FARM_ALERT_KINDS) {
      expect(en.alerts.kinds[k]).toMatch(/\{title\}/);
      expect(yo.alerts.kinds[k]).toMatch(/\{title\}/);
    }
    expect(en.alerts.kinds.farm_weather_risk).not.toMatch(/has (attacked|damaged|destroyed)/i);
  });
});
