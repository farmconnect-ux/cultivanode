import { describe, it, expect } from 'vitest';
import { CROP_CATALOGUE, getCropById } from './catalogue';
import { generatePlantingSchedule } from './schedule-generator';
import { validateAgainstStandard } from './standards';

describe('Agronomy Crop Catalogue', () => {
  it('contains at least 15 core Nigerian crops', () => {
    expect(CROP_CATALOGUE.length).toBeGreaterThanOrEqual(15);
    const maize = getCropById('maize');
    expect(maize).toBeDefined();
    expect(maize?.scientificName).toBe('Zea mays');
    expect(maize?.varieties.length).toBeGreaterThan(0);
  });
});

describe('Planting Schedule Generator', () => {
  it('generates a complete calendar for maize in Rainforest zone', () => {
    const schedule = generatePlantingSchedule({
      cropId: 'maize',
      varietyId: 'sammaz-15',
      farmAreaHectares: 2.5,
      plantingDate: '2026-04-15',
      zone: 'rainforest',
      season: 'early_rainy',
    });

    expect(schedule.cropId).toBe('maize');
    expect(schedule.farmAreaHectares).toBe(2.5);
    expect(schedule.plantingDate).toBe('2026-04-15');
    expect(schedule.harvestEstimatedDate).toBe('2026-07-29'); // 105 days after April 15

    // Check pre-planting operations
    const ploughOp = schedule.operations.find((op) => op.name.includes('Ploughing'));
    expect(ploughOp).toBeDefined();
    expect(ploughOp?.startDate).toBe('2026-04-01'); // 14 days before planting
    expect(ploughOp?.requirements.equipment).toContain('tractor');

    // Check planting operation
    const plantOp = schedule.operations.find((op) => op.name.includes('Planting'));
    expect(plantOp).toBeDefined();
    expect(plantOp?.startDate).toBe('2026-04-15');
  });

  it('generates a calendar for tomato with nursery timing', () => {
    const schedule = generatePlantingSchedule({
      cropId: 'tomato',
      varietyId: 'coba-f1',
      farmAreaHectares: 1.0,
      plantingDate: '2026-05-01',
      zone: 'rainforest',
    });

    const nurseryOp = schedule.operations.find((op) => op.name.includes('Nursery'));
    expect(nurseryOp).toBeDefined();
    expect(nurseryOp?.startDate).toBe('2026-04-03'); // 28 days before transplanting
  });
});

describe('Standards Engine', () => {
  it('passes GAP compliance when rules are met', () => {
    const result = validateAgainstStandard(
      'maize_gap_v1',
      ['Ploughing & Harrowing', 'Planting & Basal Fertilisation', 'First Weeding / Post-emergence Spray'],
      ['atrazine'],
      90
    );

    expect(result.compliant).toBe(true);
    expect(result.violations.length).toBe(0);
  });

  it('detects banned chemicals and missing mandatory operations', () => {
    const result = validateAgainstStandard(
      'maize_gap_v1',
      ['Planting & Basal Fertilisation'], // Missing ploughing and weeding
      ['paraquat', 'glyphosate'], // Paraquat is banned
      160 // Exceeds 120 kg/ha limit
    );

    expect(result.compliant).toBe(false);
    expect(result.violations).toContain('Restricted/banned agrochemical used: paraquat');
    expect(result.violations).toContain('Mandated operation missing: Ploughing & Harrowing');
    expect(result.violations.some((v) => v.includes('exceeds GAP standard cap'))).toBe(true);
  });
});
