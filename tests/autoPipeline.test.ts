import { describe, expect, it } from 'vitest';
import { createIsolatedDemoDataset } from '../src/data/demoScenario';
import {
  formatBatchStatus,
  formatFoodName,
  formatNutrientName,
  translateToastText,
  tx,
} from '../src/i18n/helpers';
import { isSupportedLanguage, LANGUAGE_OPTIONS, translations } from '../src/i18n/translations';
import {
  evaluateAutoFoodSafety,
  runAutoMatchForNewRequest,
  runAutoPipelineForBatch,
} from '../src/lib/autoPipeline';
import { analyzeCommunityNutritionalGaps } from '../src/lib/nutriLoopEngine';
import type { DonationBatch, MealRequest } from '../src/types/database';
import type { CommunityGapAnalysis } from '../src/types/nutriloop';

function buildGapMap(dataset: ReturnType<typeof createIsolatedDemoDataset>): Record<string, CommunityGapAnalysis> {
  const map: Record<string, CommunityGapAnalysis> = {};
  for (const cp of dataset.communityProfiles) {
    map[cp.org_id] = analyzeCommunityNutritionalGaps({
      profile: cp,
      inventory: dataset.communityInventory,
      foodCatalog: dataset.foodCatalog,
      nutrientConfigs: dataset.nutrientConfigs,
    });
  }
  return map;
}

describe('Automatic Rescue Workflow (Safety -> Match -> Driver Dispatch)', () => {
  it('passes safe hot cooked meals, safe chilled meals, and dry/produce items', () => {
    const now = Date.now();
    const futureIso = new Date(now + 180 * 60_000).toISOString();
    const pickupIso = new Date(now + 90 * 60_000).toISOString();

    const hotResult = evaluateAutoFoodSafety(
      {
        food_category: 'COOKED_MEALS',
        temp_celsius: 65,
        consume_by_time: futureIso,
        pickup_deadline: pickupIso,
        packaging_details: 'Sealed insulated steel containers',
      },
      now
    );
    expect(hotResult.passed).toBe(true);
    expect(hotResult.status).toBe('PASSED');

    const chilledResult = evaluateAutoFoodSafety(
      {
        food_category: 'CHILLED_MEALS',
        temp_celsius: 4,
        consume_by_time: futureIso,
        pickup_deadline: pickupIso,
        packaging_details: 'Cold-chain sealed trays',
      },
      now
    );
    expect(chilledResult.passed).toBe(true);

    const dryResult = evaluateAutoFoodSafety(
      {
        food_category: 'BAKERY_DRY',
        temp_celsius: null,
        consume_by_time: futureIso,
        pickup_deadline: pickupIso,
        packaging_details: 'Sealed dry cartons',
      },
      now
    );
    expect(dryResult.passed).toBe(true);
  });

  it('automatically blocks food in the 5C-60C danger zone or expiring under 30 minutes', () => {
    const now = Date.now();
    const dangerZone = evaluateAutoFoodSafety(
      {
        food_category: 'COOKED_MEALS',
        temp_celsius: 32,
        consume_by_time: new Date(now + 120 * 60_000).toISOString(),
        pickup_deadline: new Date(now + 60 * 60_000).toISOString(),
        packaging_details: 'Steel boxes',
      },
      now
    );
    expect(dangerZone.passed).toBe(false);
    expect(dangerZone.status).toBe('REJECTED');

    const expiringSoon = evaluateAutoFoodSafety(
      {
        food_category: 'COOKED_MEALS',
        temp_celsius: 66,
        consume_by_time: new Date(now + 15 * 60_000).toISOString(),
        pickup_deadline: new Date(now + 10 * 60_000).toISOString(),
        packaging_details: 'Steel boxes',
      },
      now
    );
    expect(expiringSoon.passed).toBe(false);
    expect(expiringSoon.packagingCondition).toBe('EXPIRED_WINDOW');
  });

  it('auto-verifies, auto-matches, and auto-dispatches a delivery route on new safe donation', () => {
    const ds = createIsolatedDemoDataset();
    const donor = ds.organisations.find((o) => o.org_type === 'FOOD_DONOR' && o.verification_status === 'verified')!;
    const now = Date.now();
    const nowIso = new Date(now).toISOString();

    const freshBatch: DonationBatch = {
      id: 'auto-test-batch-1',
      batch_code: 'HL-AUTO-1001',
      qr_token: 'hl_auto_test_token_1',
      donor_id: donor.id,
      created_by: ds.profiles.FOOD_DONOR.id,
      food_item: 'Palak Dal & Steamed Rice',
      food_category: 'COOKED_MEALS',
      dietary_type: 'VEGETARIAN',
      food_composition_id: null,
      portions_available: 90,
      portions_allocated: 0,
      prep_time: new Date(now - 20 * 60_000).toISOString(),
      pickup_deadline: new Date(now + 90 * 60_000).toISOString(),
      consume_by_time: new Date(now + 240 * 60_000).toISOString(),
      temp_celsius: 65.5,
      packaging_details: 'Insulated steel boxes',
      safety_gate_passed: false,
      status: 'PENDING_INSPECTION',
      cancellation_reason: null,
      pickup_address: donor.address,
      pickup_lat: donor.location_lat,
      pickup_lng: donor.location_lng,
      is_demo: true,
      created_at: nowIso,
      updated_at: nowIso,
    };

    const result = runAutoPipelineForBatch({
      batch: freshBatch,
      donor,
      requests: ds.requests,
      organisations: ds.organisations,
      existingAllocations: ds.allocations,
      communityGapAnalyses: buildGapMap(ds),
      foodCatalog: ds.foodCatalog,
      deliveryDriver: {
        id: ds.profiles.DELIVERY_PARTNER.id,
        fullName: ds.profiles.DELIVERY_PARTNER.full_name,
        vehicleCapacity: 150,
      },
      adminUserId: ds.profiles.ADMINISTRATOR.id,
      nowIso,
    });

    expect(result.safetyPassed).toBe(true);
    expect(result.updatedBatch.safety_gate_passed).toBe(true);
    expect(result.updatedBatch.status).toBe('DISPATCHED');
    expect(result.createdAllocations.length).toBeGreaterThanOrEqual(1);
    expect(result.updatedBatch.portions_allocated).toBeGreaterThan(0);
    expect(result.createdRoute).not.toBeNull();
    expect(result.createdRoute!.route_status).toBe('ASSIGNED');
    expect(result.createdRoute!.stops![0].stop_type).toBe('PICKUP');
    expect(result.createdRoute!.stops!.slice(1).every((s) => s.stop_type === 'DROPOFF')).toBe(true);
    expect(result.assignedDriverName).toBe(ds.profiles.DELIVERY_PARTNER.full_name);
    expect(result.notifications.length).toBeGreaterThanOrEqual(1);
    expect(result.auditLogs.some((a) => a.action === 'AUTO_PIPELINE_DISPATCHED')).toBe(true);
  });

  it('auto-matches and dispatches an existing safe batch when a shelter submits a new meal request', () => {
    const ds = createIsolatedDemoDataset();
    const shelter = ds.organisations.find(
      (o) => o.org_type === 'VERIFIED_NGO' && o.verification_status === 'verified'
    )!;
    const nowIso = new Date().toISOString();

    const newReq: MealRequest = {
      id: 'auto-req-1',
      org_id: shelter.id,
      submitted_by: ds.profiles.VERIFIED_NGO.id,
      portions_needed: 40,
      portions_fulfilled: 0,
      dietary_pref: 'VEGETARIAN',
      urgency_score: 0.9,
      wait_started_at: nowIso,
      intake_channel: 'WEB_PORTAL',
      required_by: new Date(Date.now() + 180 * 60_000).toISOString(),
      status: 'OPEN',
      idempotency_key: null,
      notes: 'Urgent evening meal need',
      is_demo: true,
      created_at: nowIso,
      updated_at: nowIso,
    };

    const match = runAutoMatchForNewRequest({
      request: newReq,
      recipientOrg: shelter,
      batches: ds.batches,
      organisations: ds.organisations,
      existingAllocations: ds.allocations,
      communityGapAnalyses: buildGapMap(ds),
      foodCatalog: ds.foodCatalog,
      deliveryDriver: {
        id: ds.profiles.DELIVERY_PARTNER.id,
        fullName: ds.profiles.DELIVERY_PARTNER.full_name,
        vehicleCapacity: 150,
      },
      adminUserId: ds.profiles.ADMINISTRATOR.id,
      nowIso,
    });

    expect(match.matchedBatch).not.toBeNull();
    expect(match.createdAllocation).not.toBeNull();
    expect(match.createdAllocation!.allocated_portions).toBe(40);
    expect(match.createdRoute).not.toBeNull();
    expect(match.createdRoute!.stops!.length).toBe(2);
    expect(match.createdRoute!.stops![0].stop_type).toBe('PICKUP');
    expect(match.createdRoute!.stops![1].stop_type).toBe('DROPOFF');
  });
});

describe('4-Language Support (English, Tamil, Hindi, Telugu)', () => {
  it('exposes all 4 supported languages with complete dictionaries', () => {
    expect(LANGUAGE_OPTIONS.map((o) => o.code)).toEqual(['en', 'ta', 'hi', 'te']);
    expect(isSupportedLanguage('hi')).toBe(true);
    expect(isSupportedLanguage('te')).toBe(true);
    expect(isSupportedLanguage('fr')).toBe(false);

    for (const lang of ['en', 'ta', 'hi', 'te'] as const) {
      expect(translations[lang].brand.length).toBeGreaterThan(0);
      expect(translations[lang].nav.dashboard.length).toBeGreaterThan(0);
      expect(translations[lang].nav.donations.length).toBeGreaterThan(0);
      expect(translations[lang].roles.DELIVERY_PARTNER.length).toBeGreaterThan(0);
    }
  });

  it('translates UI phrases, statuses, foods, nutrients, and auto-dispatch toasts into Hindi and Telugu', () => {
    expect(tx('hi', 'Home', 'முகப்பு')).not.toBe('Home');
    expect(tx('te', 'Home', 'முகப்பு')).not.toBe('Home');
    expect(formatBatchStatus('DISPATCHED', 'hi')).not.toBe('DISPATCHED');
    expect(formatBatchStatus('DISPATCHED', 'te')).not.toBe('DISPATCHED');
    expect(formatFoodName('Sambar Sadam, Curd Rice & Vegetable Poriyal', 'hi')).not.toBe(
      'Sambar Sadam, Curd Rice & Vegetable Poriyal'
    );
    expect(formatFoodName('Sambar Sadam, Curd Rice & Vegetable Poriyal', 'te')).not.toBe(
      'Sambar Sadam, Curd Rice & Vegetable Poriyal'
    );
    expect(formatNutrientName('Protein', 'hi')).not.toBe('Protein');
    expect(formatNutrientName('Protein', 'te')).not.toBe('Protein');
    expect(translateToastText('Auto-Dispatched: HL-DEMO-2026', 'hi')).toContain('HL-DEMO-2026');
    expect(translateToastText('Auto-Dispatched: HL-DEMO-2026', 'te')).toContain('HL-DEMO-2026');
  });
});
