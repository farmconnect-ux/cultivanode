import { describe, it, expect } from 'vitest';
import { calculateCropHealthScore } from './health';

describe('Crop Management: Health Engine (CM-08)', () => {
  it('returns perfect score (1.00) and excellent status when no issues exist', () => {
    const result = calculateCropHealthScore({
      operations: [
        { status: 'pending', scheduledEndDate: '2026-10-15' },
        { status: 'completed', scheduledEndDate: '2026-10-01' },
      ],
      observations: [],
      alerts: [],
      asOfDate: '2026-10-06',
    });

    expect(result.score).toBe(1.0);
    expect(result.status).toBe('excellent');
    expect(result.factors).toHaveLength(0);
  });

  it('deducts points for overdue operations', () => {
    const result = calculateCropHealthScore({
      operations: [
        { status: 'pending', scheduledEndDate: '2026-10-01' }, // Overdue
        { status: 'pending', scheduledEndDate: '2026-10-03' }, // Overdue
      ],
      observations: [],
      alerts: [],
      asOfDate: '2026-10-06',
    });

    expect(result.score).toBe(0.9);
    expect(result.status).toBe('excellent');
    expect(result.factors).toHaveLength(1);
    expect(result.factors[0]?.code).toBe('OVERDUE_OPERATIONS');
  });

  it('correctly handles severe scouting observations and weather alerts', () => {
    const result = calculateCropHealthScore({
      operations: [
        { status: 'pending', scheduledEndDate: '2026-10-01' },
      ],
      observations: [
        {
          resolved: false,
          severity: 'severe',
          category: 'pest',
          description: 'Fall armyworm outbreak detected across 40% of crop canopy',
        },
        {
          resolved: false,
          severity: 'high',
          category: 'disease',
          description: 'Early signs of maize streak virus',
        },
      ],
      alerts: [
        {
          isDismissed: false,
          severity: 'critical',
          title: 'Extreme drought alert for Oyo state',
        },
      ],
      asOfDate: '2026-10-06',
    });

    // Deductions:
    // Overdue ops: -0.05
    // Severe obs: -0.25
    // High obs: -0.15
    // Critical alert: -0.15
    // Total deduction: 0.60 -> Score: 0.40 -> status 'critical'
    expect(result.score).toBe(0.4);
    expect(result.status).toBe('critical');
    expect(result.factors).toHaveLength(4);
  });

  it('ignores resolved observations and dismissed alerts', () => {
    const result = calculateCropHealthScore({
      operations: [],
      observations: [
        {
          resolved: true,
          severity: 'severe',
          category: 'pest',
          description: 'Resolved armyworm treatment completed',
        },
      ],
      alerts: [
        {
          isDismissed: true,
          severity: 'critical',
          title: 'Past heat wave warning',
        },
      ],
      asOfDate: '2026-10-06',
    });

    expect(result.score).toBe(1.0);
    expect(result.status).toBe('excellent');
    expect(result.factors).toHaveLength(0);
  });

  it('clamps lowest score to 0.00', () => {
    const result = calculateCropHealthScore({
      operations: [
        { status: 'pending', scheduledEndDate: '2026-09-01' },
        { status: 'pending', scheduledEndDate: '2026-09-02' },
        { status: 'pending', scheduledEndDate: '2026-09-03' },
        { status: 'pending', scheduledEndDate: '2026-09-04' },
      ],
      observations: [
        { resolved: false, severity: 'severe', category: 'pest', description: 'Total devastation 1' },
        { resolved: false, severity: 'severe', category: 'pest', description: 'Total devastation 2' },
        { resolved: false, severity: 'severe', category: 'pest', description: 'Total devastation 3' },
        { resolved: false, severity: 'severe', category: 'pest', description: 'Total devastation 4' },
      ],
      alerts: [
        { isDismissed: false, severity: 'critical', title: 'Flash flood disaster' },
      ],
      asOfDate: '2026-10-06',
    });

    expect(result.score).toBe(0.0);
    expect(result.status).toBe('critical');
  });
});
