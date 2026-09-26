import { describe, expect, it } from 'vitest';
import { formatNgPhone, isValidEmail, normalizeNgPhone } from '../phone';

describe('normalizeNgPhone', () => {
  it.each([
    ['0803 123 4567', '2348031234567'],
    ['+234 803-123-4567', '2348031234567'],
    ['2348031234567', '2348031234567'],
    ['8031234567', '2348031234567'],
    ['07061234567', '2347061234567'],
  ])('%s -> %s', (input, expected) => {
    expect(normalizeNgPhone(input)).toBe(expected);
  });
  it('treats empty input as no phone', () => {
    expect(normalizeNgPhone('')).toBeNull();
    expect(normalizeNgPhone('  ')).toBeNull();
    expect(normalizeNgPhone(undefined)).toBeNull();
  });
  it('rejects numbers that are not Nigerian mobiles', () => {
    expect(normalizeNgPhone('12345')).toBe('invalid');
    expect(normalizeNgPhone('+44 7700 900123')).toBe('invalid');
  });
});

describe('formatting and email', () => {
  it('formats for display', () => expect(formatNgPhone('2348031234567')).toBe('0803 123 4567'));
  it('checks email shape', () => {
    expect(isValidEmail('ade@example.com')).toBe(true);
    expect(isValidEmail('ade@example')).toBe(false);
  });
});
