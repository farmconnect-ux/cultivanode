import { describe, expect, it } from 'vitest';
import { formatNaira, nairaToKobo, percentOfKobo, toPointEwkt, toPolygonEwkt, ROLE_LABELS, PROVIDER_TYPE_LABELS, APP_ROLES, PROVIDER_TYPES } from '../index';

describe('money', () => {
  it('converts typed naira to kobo', () => {
    expect(nairaToKobo('25,000')).toBe(2_500_000);
    expect(nairaToKobo('₦1,250.5')).toBe(125_050);
    expect(nairaToKobo('0.05')).toBe(5);
    expect(nairaToKobo(300)).toBe(30_000);
  });
  it('rejects bad input', () => {
    expect(nairaToKobo('12.345')).toBeNull();
    expect(nairaToKobo('-5')).toBeNull();
    expect(nairaToKobo('abc')).toBeNull();
  });
  it('formats kobo', () => {
    expect(formatNaira(2_500_000)).toBe('₦25,000');
    expect(formatNaira(125_050)).toBe('₦1,250.50');
    expect(formatNaira(-5)).toBe('-₦0.05');
  });
  it('takes a percentage without floating-point drift', () => {
    expect(percentOfKobo(2_500_000, 10)).toBe(250_000);
    expect(percentOfKobo(333, 15)).toBe(50);
  });
});

describe('geo', () => {
  it('puts longitude first', () => {
    expect(toPointEwkt({ lat: 7.3775, lng: 3.8967 })).toBe('SRID=4326;POINT(3.8967 7.3775)');
  });
  it('closes a walked boundary', () => {
    expect(
      toPolygonEwkt([
        { lat: 7.3775, lng: 3.8967 },
        { lat: 7.3775, lng: 3.8976 },
        { lat: 7.3784, lng: 3.8976 },
      ]),
    ).toBe('SRID=4326;POLYGON((3.8967 7.3775, 3.8976 7.3775, 3.8976 7.3784, 3.8967 7.3775))');
  });
  it('rejects impossible coordinates', () => {
    expect(() => toPointEwkt({ lat: 95, lng: 3.9 })).toThrow(RangeError);
    expect(() => toPolygonEwkt([{ lat: 7, lng: 3 }, { lat: 7.1, lng: 3 }])).toThrow(RangeError);
  });
});

describe('roles', () => {
  it('has a label for every database role and provider type', () => {
    expect(Object.keys(ROLE_LABELS).sort()).toEqual([...APP_ROLES].sort());
    expect(Object.keys(PROVIDER_TYPE_LABELS).sort()).toEqual([...PROVIDER_TYPES].sort());
  });
  it('uses the specification names', () => {
    expect(APP_ROLES).toContain('buyer_offtaker');
    expect(PROVIDER_TYPES).toContain('extension_agent');
    expect(PROVIDER_TYPES).toContain('vet');
  });
});
