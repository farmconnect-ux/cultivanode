import { describe, expect, it } from 'vitest';
import {
  StandardPlanActualEngine,
  FarmMultiLocationInventoryEngine,
  LivestockAnalyticsEngine,
  MachineryFleetEngine,
  FarmBudgetCostEngine,
} from './index';
import type { AgronomicStandardDefinition } from './types';

describe('Farm Management Core Engines', () => {
  describe('Standard -> Plan -> Actual Engine', () => {
    const maizeStandard: AgronomicStandardDefinition = {
      id: 'STD_MAIZE_GAP_V1',
      category: 'fertiliser',
      cropId: 'maize',
      title: 'Maize GAP Basal & Topdress Standard',
      version: 1,
      effectiveFrom: '2026-01-01',
      baselineParameters: {
        basal_fertiliser_npk_kg_ha: 200,
        topdress_urea_kg_ha: 100,
        seed_rate_kg_ha: 20,
      },
      mandatedOperations: ['Ploughing', 'Planting with NPK', 'Topdressing'],
      restrictedInputs: ['paraquat'],
      approvedBy: 'IITA / FMARD',
      status: 'published',
    };

    it('generates scaled advisory recommendations without mandating values', () => {
      const engine = new StandardPlanActualEngine([maizeStandard]);
      const recs = engine.generateRecommendation('STD_MAIZE_GAP_V1', 2.5); // 2.5 hectares

      expect(recs.basal_fertiliser_npk_kg_ha).toBe(500); // 200 * 2.5
      expect(recs.topdress_urea_kg_ha).toBe(250); // 100 * 2.5
      expect(recs.seed_rate_kg_ha).toBe(50); // 20 * 2.5
    });

    it('prevents mutation of published standards in place', () => {
      const engine = new StandardPlanActualEngine([maizeStandard]);
      expect(() => {
        engine.registerStandard({
          ...maizeStandard,
          baselineParameters: { basal_fertiliser_npk_kg_ha: 180 }, // Attempting in-place change
        });
      }).toThrowError(/IMMUTABLE_STANDARD_VIOLATION/);
    });

    it('calculates multi-dimensional variance preserving farmer plans and actual field results', () => {
      // Example: Recommended 200 kg/ha, Farmer planned 150 kg/ha, Actual applied 165 kg/ha
      const variance = StandardPlanActualEngine.calculateVariance({
        entityType: 'input_application',
        metricName: 'basal_npk_rate',
        unit: 'kg/ha',
        standardValue: 200,
        planValue: 150,
        actualValue: 165,
        isFarmerOverride: true,
        deviationReason: 'Adjusted for sandy loam soil with pre-existing compost',
      });

      expect(variance.standardVsPlanVariance).toBe(-50); // Planned 50 kg less than standard
      expect(variance.standardVsActualVariance).toBe(-35); // Applied 35 kg less than standard
      expect(variance.planVsActualVariance).toBe(15); // Applied 15 kg more than planned
      expect(variance.planDeviationPct).toBe(-25); // -25% from standard
      expect(variance.actualDeviationPct).toBe(10); // +10% from farmer plan
      expect(variance.isFarmerOverride).toBe(true);
      expect(variance.deviationReason).toContain('sandy loam');
    });
  });

  describe('Multi-Location Concurrency-Safe Inventory Engine', () => {
    it('executes atomic receipts, transfers, and issues without negative stock', () => {
      const engine = new FarmMultiLocationInventoryEngine([
        {
          id: 'item-npk-01',
          farmId: 'farm-01',
          locationId: 'loc-main-store',
          sku: 'NPK-15-15-15-50KG',
          itemName: 'NPK 15-15-15 Fertiliser',
          category: 'fertiliser',
          quantityOnHand: 40,
          reservedQuantity: 0,
          unit: 'bags',
          reorderThreshold: 10,
          unitCostKobo: 4500000, // N45,000 / bag
        },
      ]);

      // 1. Initial available stock
      expect(engine.getAvailableQuantity('item-npk-01')).toBe(40);

      // 2. Reserve 15 bags for upcoming planting operation
      const resTx = engine.recordMovement({
        farmId: 'farm-01',
        itemId: 'item-npk-01',
        transactionType: 'RESERVATION',
        quantity: 15,
      });
      expect(resTx.balanceAfter).toBe(40);
      expect(engine.getAvailableQuantity('item-npk-01')).toBe(25);

      // 3. Reject over-reservation
      expect(() => {
        engine.recordMovement({
          farmId: 'farm-01',
          itemId: 'item-npk-01',
          transactionType: 'RESERVATION',
          quantity: 30, // Only 25 available
        });
      }).toThrowError(/INSUFFICIENT_AVAILABLE_STOCK/);

      // 4. Issue 15 bags to Field Plot A
      const issueTx = engine.recordMovement({
        farmId: 'farm-01',
        itemId: 'item-npk-01',
        transactionType: 'ISSUE',
        quantity: 15,
        destinationEntityType: 'crop_cycle',
        destinationEntityId: 'cycle-maize-01',
      });
      expect(issueTx.balanceAfter).toBe(25);
      expect(issueTx.totalCostKobo).toBe(15 * 4500000);

      // 5. Strictly prohibit negative stock
      expect(() => {
        engine.recordMovement({
          farmId: 'farm-01',
          itemId: 'item-npk-01',
          transactionType: 'CONSUMPTION',
          quantity: 30, // Only 25 left
        });
      }).toThrowError(/INSUFFICIENT_STOCK/);
    });
  });

  describe('Livestock Analytics Engine', () => {
    it('computes Feed Conversion Ratio (FCR) correctly', () => {
      // 1000 broilers consumed 3300 kg feed, total weight gain was 2000 kg
      const fcr = LivestockAnalyticsEngine.computeFeedConversionRatio(3300, 2000);
      expect(fcr).toBe(1.65);
    });

    it('calculates flock mortality rate and triggers alert severity thresholds', () => {
      const normalMortality = LivestockAnalyticsEngine.computeMortalityRate(500, 5); // 1%
      expect(normalMortality.ratePct).toBe(1.0);
      expect(normalMortality.severity).toBe('normal');

      const warningMortality = LivestockAnalyticsEngine.computeMortalityRate(500, 18); // 3.6%
      expect(warningMortality.severity).toBe('warning');

      const criticalMortality = LivestockAnalyticsEngine.computeMortalityRate(500, 35); // 7.0%
      expect(criticalMortality.severity).toBe('critical');
    });

    it('verifies veterinary drug withdrawal periods for food safety', () => {
      // Tylosin administered on 2026-10-01 with 7-day withdrawal period
      const checkActive = LivestockAnalyticsEngine.verifyWithdrawalPeriod(
        '2026-10-01',
        7,
        'Tylosin Tartrate',
        '2026-10-05'
      );
      expect(checkActive.isSafeForHarvestOrConsumption).toBe(false);
      expect(checkActive.remainingDays).toBe(3);

      const checkCleared = LivestockAnalyticsEngine.verifyWithdrawalPeriod(
        '2026-10-01',
        7,
        'Tylosin Tartrate',
        '2026-10-09'
      );
      expect(checkCleared.isSafeForHarvestOrConsumption).toBe(true);
      expect(checkCleared.remainingDays).toBe(0);
    });

    it('calculates species gestation and expected birth dates', () => {
      const cattleServiceDate = '2026-01-01';
      const expectedCalving = LivestockAnalyticsEngine.estimateBirthDate('cattle', cattleServiceDate);
      expect(expectedCalving).toBe('2026-10-11'); // 283 days

      const pigServiceDate = '2026-01-01';
      const expectedFarrowing = LivestockAnalyticsEngine.estimateBirthDate('pig', pigServiceDate);
      expect(expectedFarrowing).toBe('2026-04-25'); // 114 days
    });
  });

  describe('Machinery Fleet Engine', () => {
    it('computes fuel efficiency and operating cost per hectare', () => {
      // 50 ha ploughed over 25 engine hours, consuming 200 litres diesel at N300,000 total cost
      const metrics = MachineryFleetEngine.computeEfficiencyMetrics({
        hoursOperated: 25,
        areaCoveredHa: 50,
        fuelConsumedLiters: 200,
        totalCostKobo: 30000000,
      });

      expect(metrics.fuelLitersPerHour).toBe(8); // 200 / 25
      expect(metrics.fuelLitersPerHectare).toBe(4); // 200 / 50
      expect(metrics.costPerHourKobo).toBe(1200000); // N12,000 / hr
      expect(metrics.costPerHectareKobo).toBe(600000); // N6,000 / ha
    });

    it('triggers maintenance due alerts based on engine hours and calendar limits', () => {
      // Due at 250 hours, current is 255 hours
      const hourAlert = MachineryFleetEngine.checkMaintenanceDue({
        machineryId: 'mach-tractor-01',
        currentEngineHours: 255,
        nextServiceDueHours: 250,
      });
      expect(hourAlert.isDue).toBe(true);
      expect(hourAlert.dueReason).toBe('engine_hours_exceeded');

      // Due on 2026-10-01, current is 2026-10-08
      const dateAlert = MachineryFleetEngine.checkMaintenanceDue({
        machineryId: 'mach-pump-01',
        currentEngineHours: 80,
        nextServiceDueDate: '2026-10-01',
        currentDate: '2026-10-08',
      });
      expect(dateAlert.isDue).toBe(true);
      expect(dateAlert.dueReason).toBe('calendar_date_passed');
    });
  });

  describe('Farm Budget & Cost Engine', () => {
    it('calculates enterprise gross margin and net margin with overhead allocation', () => {
      const report = FarmBudgetCostEngine.computeEnterpriseProfitability({
        enterpriseId: 'crop-maize-season-1',
        enterpriseType: 'crop',
        totalRevenueKobo: 80000000, // N800,000
        totalDirectCostKobo: 45000000, // N450,000
        allocatedOverheadKobo: 5000000, // N50,000
      });

      expect(report.grossMarginKobo).toBe(35000000); // N350,000
      expect(report.grossMarginPct).toBe(43.8); // 43.8%
      expect(report.netMarginKobo).toBe(30000000); // N300,000
    });

    it('calculates budget vs actual expense variance and sets status', () => {
      const onTrack = FarmBudgetCostEngine.computeBudgetVariance(
        'bgt-2026',
        100000000, // N1,000,000 budgeted
        102000000 // N1,020,000 actual (+2%)
      );
      expect(onTrack.status).toBe('on_track');

      const overBudget = FarmBudgetCostEngine.computeBudgetVariance(
        'bgt-2026',
        100000000,
        115000000 // +15%
      );
      expect(overBudget.status).toBe('over_budget');
      expect(overBudget.variancePct).toBe(15.0);
    });
  });
});
