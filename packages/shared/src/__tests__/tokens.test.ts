import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { colors } from '../design/tokens';
import { DbConstants } from '../index';
import { APP_LANGUAGES, APP_ROLES, PROVIDER_TYPES } from '../roles';

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

describe('colour contrast (WCAG AA, 4.5:1 for body text)', () => {
  const textColours = {
    ink: colors.ink,
    muted: colors.muted,
    'leaf-700': colors.leaf[700],
    'leaf-600': colors.leaf[600],
    danger: colors.danger,
    info: colors.info,
    'harvest-700': colors.harvest[700],
    'node-600': colors.node[600],
  };
  for (const [name, hex] of Object.entries(textColours)) {
    it(`${name} on cream and white`, () => {
      expect(contrast(hex, colors.cream)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(hex, colors.white)).toBeGreaterThanOrEqual(4.5);
    });
  }
  it('white text on the primary button (leaf-600) and its hover (leaf-700)', () => {
    expect(contrast(colors.white, colors.leaf[600])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.white, colors.leaf[700])).toBeGreaterThanOrEqual(4.5);
  });
  it('brand combinations: cyan on deep green, deep green on cyan buttons, off-white on deep green', () => {
    expect(contrast(colors.node[300], colors.leaf[800])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.leaf[900], colors.node[300])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.cream, colors.leaf[800])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.leaf[100], colors.leaf[800])).toBeGreaterThanOrEqual(4.5);
  });
  it('ink text on the harvest highlight (harvest-300)', () => {
    expect(contrast(colors.ink, colors.harvest[300])).toBeGreaterThanOrEqual(4.5);
  });
});

describe('web theme mirrors the tokens', () => {
  const css = readFileSync(resolve(__dirname, '../../../../apps/web/src/app/globals.css'), 'utf8');
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(colors)) {
    if (typeof v === 'string') flat[k] = v;
    else for (const [shade, hex] of Object.entries(v)) flat[`${k}-${shade}`] = hex;
  }
  for (const [name, hex] of Object.entries(flat)) {
    it(`--color-${name}`, () => {
      const m = css.match(new RegExp(`--color-${name}:\\s*(#[0-9A-Fa-f]{6})`));
      expect(m?.[1]?.toUpperCase()).toBe(hex.toUpperCase());
    });
  }
});

describe('generated database types match the shared constants', () => {
  it('roles, provider types and languages', () => {
    expect([...DbConstants.public.Enums.app_role]).toEqual([...APP_ROLES]);
    expect([...DbConstants.public.Enums.provider_type]).toEqual([...PROVIDER_TYPES]);
    expect([...DbConstants.public.Enums.app_language]).toEqual([...APP_LANGUAGES]);
  });
});
