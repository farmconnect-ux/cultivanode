import { describe, it, expect } from 'vitest';
import {
  StandardPlanActualEngine,
  FarmInventoryEngine,
  FarmLivestockEngine,
  FarmMachineryEngine,
  FarmBudgetCostEngine,
  FarmAgronomicStandard,
  CropPlanInput,
  InventoryItemState,
  LivestockAnimalState,
  HealthTreatmentRecord,
  MachineryAssetState,
} from './index';

describe('StandardPlanActualEngine', () => {
  const maizeStandard: FarmAgronomicStandard = {
    id: 'std-maize-001',
    cropName: 'Maize',
    variety: 'SC 719 Hybrid',
    agroEcologicalZone: 'Guinea Savannah',
    version: 1,
    expectedYieldKgPerHa: 4500,
    expectedDurationDays: 120,
    seedRateKgPerHa: 20,
    recommendedOperations: [
      {
        stage: 'Planting',
        dayOffset: 0,
        activity: 'Mechanical planting and basal fertilizer',
        targetInputs: [
          { itemName: 'Hybrid Seed Maize', standardQuantityPerHa: 20, unit: 'kg' },
          { itemName: 'NPK 15:15:15', standardQuantityPerHa: 200, unit: 'kg' },
        ],
      },
      {
        stage: 'Vegetative V4',
        dayOffset: 21,
        activity: 'Urea top dressing',
        targetInputs: [
          { itemName: 'Urea 46% N', standardQuantityPerHa: 100, unit: 'kg' },
        ],
      },
    ],
  };

  it('correctly scales operations and inputs for a 5-hectare plan', () => {
    const planInput: CropPlanInput = {
      farmId: 'farm-1',
      plotId: 'plot-a',
      cropName: 'Maize',
      variety: 'SC 719 Hybrid',
      plantedAreaHectares: 5,
      startDate: '2026-05-01',
      budgetCapMinor: 50000000,
    };

    const result = StandardPlanActualEngine.generatePlanFromStandard(maizeStandard, planInput);

    expect(result.cropCycleInput.targetYieldKg).toBe(22500); // 4500 * 5
    expect(result.cropCycleInput.targetHarvestDate).toBe('2026-08-29'); // +120 days
    expect(result.recommendedOperations).toHaveLength(2);
    // Basal fertilizer for 5 ha = 200 * 5 = 1000 kg
    expect(result.recommendedOperations[0].recommendedInputs[1].recommendedQuantity).toBe(1000);
  });

  it('evaluates yield and cost variances accurately', () => {
    const yieldVariance = StandardPlanActualEngine.calculateVariance({
      cropCycleId: 'cc-1',
      metric: 'yield_kg',
      standardValue: 20000,
      plannedValue: 20000,
      actualValue: 23000,
    });

    expect(yieldVariance.varianceFromPlan).toBe(3000);
    expect(yieldVariance.percentageVariance).toBe(15);
    expect(yieldVariance.assessment).toBe('favorable');

    const costOverrun = StandardPlanActualEngine.calculateVariance({
      cropCycleId: 'cc-1',
      metric: 'cost_minor',
      standardValue: 10000000,
      plannedValue: 10000000,
      actualValue: 12500000,
    });

    expect(costOverrun.percentageVariance).toBe(25);
    expect(costOverrun.assessment).toBe('adverse');
  });
});

describe('FarmInventoryEngine', () => {
  const baseItem: InventoryItemState = {
    id: 'inv-item-1',
    farmId: 'farm-1',
    locationId: 'store-1',
    itemCategory: 'fertilizer',
    itemName: 'NPK 15:15:15 50kg Bag',
    currentQuantity: 100,
    reservedQuantity: 10,
    unit: 'bag',
    averageCostMinor: 3500000, // 35,000 NGN
  };

  it('enforces Zero Negative Stock invariant and rejects overdrafts', () => {
    // Available is 100 - 10 = 90
    expect(() => {
      FarmInventoryEngine.processMovement(baseItem, {
        inventoryItemId: baseItem.id,
        movementType: 'usage_out',
        quantity: 95,
      });
    }).toThrow(/Insufficient stock: Zero Negative Stock invariant violated/);
  });

  it('updates stock and calculates total cost on valid stock usage', () => {
    const result = FarmInventoryEngine.processMovement(baseItem, {
      inventoryItemId: baseItem.id,
      movementType: 'usage_out',
      quantity: 40,
    });

    expect(result.updatedItem.currentQuantity).toBe(60);
    expect(result.totalMovementCostMinor).toBe(40 * 3500000);
  });

  it('recalculates Weighted Average Cost (WAC) on new purchase', () => {
    // Current: 100 bags @ 35,000 = 3,500,000 minor * 100 = 350,000,000 minor
    // Incoming: 100 bags @ 45,000 = 4,500,000 minor * 100 = 450,000,000 minor
    // New total: 200 bags, new WAC: 800,000,000 / 200 = 4,000,000 minor (40,000 NGN)
    const result = FarmInventoryEngine.processMovement(baseItem, {
      inventoryItemId: baseItem.id,
      movementType: 'purchase_in',
      quantity: 100,
      unitCostMinor: 4500000,
    });

    expect(result.updatedItem.currentQuantity).toBe(200);
    expect(result.updatedItem.averageCostMinor).toBe(4000000);
  });
});

describe('FarmLivestockEngine', () => {
  it('calculates FCR and ADG accurately', () => {
    const fcr = FarmLivestockEngine.calculateFCR(1500, 750);
    expect(fcr).toBe(2);

    const adg = FarmLivestockEngine.calculateADG(20, 50, 60);
    expect(adg).toBe(0.5); // 30kg / 60 days = 0.5 kg/day
  });

  it('prevents slaughter or meat sale during active withdrawal period', () => {
    const animal: LivestockAnimalState = {
      id: 'cow-001',
      tagNumber: 'NG-BOV-089',
      species: 'cattle',
      sex: 'female',
      status: 'active',
      currentWeightKg: 420,
    };

    const treatmentDate = new Date();
    treatmentDate.setDate(treatmentDate.getDate() - 3); // 3 days ago

    const activeTreatment: HealthTreatmentRecord = {
      animalId: animal.id,
      treatmentName: 'Respiratory Antibiotic',
      medicationName: 'Oxytetracycline 20%',
      withdrawalDays: 14, // 14 days withdrawal
      administeredAt: treatmentDate,
    };

    const checkNow = FarmLivestockEngine.canSellOrSlaughter(animal, [activeTreatment], new Date());
    expect(checkNow.permitted).toBe(false);
    expect(checkNow.activeRestrictions[0].daysRemaining).toBe(11);

    // 15 days later
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);
    const checkFuture = FarmLivestockEngine.canSellOrSlaughter(animal, [activeTreatment], futureDate);
    expect(checkFuture.permitted).toBe(true);
  });
});

describe('FarmMachineryEngine', () => {
  const tractor: MachineryAssetState = {
    id: 'mach-1',
    name: 'Massey Ferguson 375 Tractor',
    category: 'tractor',
    totalOperatingHours: 495,
    nextServiceHours: 500,
    fuelConsumptionLitresPerHour: 8.5,
  };

  it('accurately computes session direct operating costs', () => {
    const cost = FarmMachineryEngine.calculateOperationCost({
      operatingHours: 10,
      fuelUsedLitres: 85,
      fuelCostPerLitreMinor: 110000, // 1,100 NGN
      operatorHourlyRateMinor: 250000, // 2,500 NGN
      hourlyDepreciationCostMinor: 150000,
    });

    // Fuel: 85 * 1,100 = 93,500 NGN (9,350,000 minor)
    // Operator: 10 * 2,500 = 25,000 NGN (2,500,000 minor)
    // Depreciation: 10 * 1,500 = 15,000 NGN (1,500,000 minor)
    // Total: 13,350,000 minor
    expect(cost.fuelCostMinor).toBe(9350000);
    expect(cost.operatorCostMinor).toBe(2500000);
    expect(cost.depreciationCostMinor).toBe(1500000);
    expect(cost.totalOperationCostMinor).toBe(13350000);
    expect(cost.effectiveHourlyCostMinor).toBe(1335000);
  });

  it('triggers maintenance alert when approaching service hours threshold', () => {
    const status = FarmMachineryEngine.evaluateMaintenanceStatus(tractor, 10);
    expect(status.serviceDue).toBe(true);
    expect(status.serviceOverdue).toBe(false);
    expect(status.hoursUntilService).toBe(5);
  });
});

describe('FarmBudgetCostEngine', () => {
  it('computes unit cost of production and enterprise margins', () => {
    const margin = FarmBudgetCostEngine.calculateEnterpriseMargin({
      enterpriseName: 'Commercial Maize Production',
      grossRevenueMinor: 450000000, // 4,500,000 NGN
      variableCostsMinor: 260000000, // 2,600,000 NGN
      fixedOverheadMinor: 40000000,   // 400,000 NGN
      unitsProduced: 150, // 150 bags of 100kg
      unitLabel: '100kg Bag',
    });

    expect(margin.grossMarginMinor).toBe(190000000); // 1,900,000 NGN
    expect(margin.netOperatingProfitMinor).toBe(150000000); // 1,500,000 NGN
    expect(margin.costPerUnitMinor).toBe(2000000); // 300,000,000 / 150 = 20,000 NGN per bag
  });
});
