import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createIsolatedDemoDataset } from '../src/data/demoScenario';
import { runSmartMatchingEngine } from '../src/lib/matchingEngine';
import {
  analyzeCommunityNutritionalGaps,
  calculateCommunityRequirements,
  DEFAULT_NUTRIENT_CONFIGS,
  estimateNutrientsForPortions,
  evaluateBatchNutritionalContribution,
  generateTargetedDonationRequests,
  resolveFoodCompositionForBatch,
  VALIDATED_FOOD_COMPOSITION_TABLE,
} from '../src/lib/nutriLoopEngine';
import type { DonationBatch } from '../src/types/database';
import type {
  CommunityFoodInventoryRecord,
  CommunityNutritionProfile,
  NutrientConfig,
} from '../src/types/nutriloop';

describe('NutriLoop — Nutritional Gap Detection, Targeted Requests & Nutrition-Aware Matching', () => {
  it('completes the full 9-step NutriLoop + HungerLink redistribution workflow end-to-end', () => {
    const demo = createIsolatedDemoDataset();
    const shelterOrg = demo.organisations.find((o) => o.id === '11111111-1111-4111-8111-111111111102')!;
    const kitchenOrg = demo.organisations.find((o) => o.id === '11111111-1111-4111-8111-111111111103')!;
    const donorOrg = demo.organisations.find((o) => o.id === '11111111-1111-4111-8111-111111111101')!;

    // Step 1-3: NGO rice-only inventory -> Nutritional Estimate -> Gap Detection G(j) = max(0, R(j) - A(j))
    const shelterProfile = demo.communityProfiles.find((p) => p.org_id === shelterOrg.id)!;
    const beforeAnalysis = analyzeCommunityNutritionalGaps({
      profile: shelterProfile,
      inventory: demo.communityInventory,
      foodCatalog: demo.foodCatalog,
      nutrientConfigs: demo.nutrientConfigs,
    });

    expect(beforeAnalysis.total_beneficiaries).toBe(60);
    expect(beforeAnalysis.total_portions_available).toBe(240);
    expect(beforeAnalysis.unmapped_inventory_count).toBe(0);

    const proteinBefore = beforeAnalysis.nutrients.find((n) => n.nutrient_key === 'protein_g')!;
    expect(proteinBefore.gap).toBeGreaterThan(300); // Significant protein gap on rice-heavy stock
    expect(proteinBefore.gap).toBeCloseTo(
      Math.max(0, proteinBefore.requirement - (proteinBefore.available + proteinBefore.distributed)),
      1
    );

    // Step 4: Targeted Donation Request Generator respects dietary restrictions & creates DRAFT_GENERATED
    const drafts = generateTargetedDonationRequests({
      analysis: beforeAnalysis,
      profile: shelterProfile,
      orgName: shelterOrg.name,
      foodCatalog: demo.foodCatalog,
      maxRequests: 3,
    });
    expect(drafts.length).toBeGreaterThan(0);
    expect(drafts.every((d) => d.status === 'DRAFT_GENERATED')).toBe(true);
    // Shelter A is VEGETARIAN -> must never recommend Boiled Eggs (EGGETARIAN)
    for (const draft of drafts) {
      expect(draft.recommended_items.some((i) => i.toLowerCase().includes('egg'))).toBe(false);
    }

    // Step 5-6: Protein-rich donor batch matched with NutriLoop nutrition-aware prioritization
    const soyaBatch = demo.batches.find((b) => b.id === '22222222-2222-4222-8222-222222222202')!;
    const safetyPassedSoyaBatch: DonationBatch = {
      ...soyaBatch,
      temp_celsius: 65.0,
      safety_gate_passed: true,
      status: 'INSPECTION_PASSED',
    };

    const kitchenProfile = demo.communityProfiles.find((p) => p.org_id === kitchenOrg.id)!;
    const kitchenAnalysis = analyzeCommunityNutritionalGaps({
      profile: kitchenProfile,
      inventory: demo.communityInventory,
      foodCatalog: demo.foodCatalog,
      nutrientConfigs: demo.nutrientConfigs,
    });

    const matchResult = runSmartMatchingEngine({
      batch: safetyPassedSoyaBatch,
      donorOrg,
      requests: demo.requests
        .filter((r) => r.status === 'OPEN')
        .map((r) => ({
          request: r,
          recipientOrg: demo.organisations.find((o) => o.id === r.org_id),
        })),
      deliveryCapacityPortions: 120,
      nutritionContext: {
        communityAnalysesByOrgId: {
          [shelterOrg.id]: beforeAnalysis,
          [kitchenOrg.id]: kitchenAnalysis,
        },
        foodCatalog: demo.foodCatalog,
        nutrientConfigs: demo.nutrientConfigs,
      },
    });

    expect(matchResult.batch_hard_errors).toHaveLength(0);
    expect(matchResult.proposals.length).toBeGreaterThan(0);
    const shelterProposal = matchResult.proposals.find((p) => p.org_id === shelterOrg.id)!;
    expect(shelterProposal.match_explanation.nutrition_mode).toBe(true);
    expect((shelterProposal.match_explanation.N ?? 0)).toBeGreaterThan(0.2);
    expect(shelterProposal.match_explanation.nutrition_summary).toContain('Soya Chunks');

    // Step 7-9: Verified delivery adds inventory -> Before vs After nutritional improvement measured
    const deliveredRecord: CommunityFoodInventoryRecord = {
      id: 'inv-delivered-soya',
      org_id: shelterOrg.id,
      food_composition_id: 'fc-soya-chunks',
      custom_food_name: safetyPassedSoyaBatch.food_item,
      quantity_portions: shelterProposal.allocated_portions,
      portion_grams: 180,
      inventory_stage: 'AVAILABLE',
      source_batch_id: safetyPassedSoyaBatch.id,
      recorded_by: 'demo-user-ngo',
      recorded_at: new Date().toISOString(),
      is_demo: true,
    };

    const afterAnalysis = analyzeCommunityNutritionalGaps({
      profile: shelterProfile,
      inventory: [deliveredRecord, ...demo.communityInventory],
      foodCatalog: demo.foodCatalog,
      nutrientConfigs: demo.nutrientConfigs,
    });

    const proteinAfter = afterAnalysis.nutrients.find((n) => n.nutrient_key === 'protein_g')!;
    expect(proteinAfter.gap).toBeLessThan(proteinBefore.gap);
    expect(afterAnalysis.overall_adequacy_pct).toBeGreaterThan(beforeAnalysis.overall_adequacy_pct);
  });

  it('NEVER allows nutritional priority to override fail-closed food safety gates', () => {
    const demo = createIsolatedDemoDataset();
    const shelterOrg = demo.organisations.find((o) => o.id === '11111111-1111-4111-8111-111111111102')!;
    const donorOrg = demo.organisations.find((o) => o.id === '11111111-1111-4111-8111-111111111101')!;
    const shelterProfile = demo.communityProfiles.find((p) => p.org_id === shelterOrg.id)!;
    const analysis = analyzeCommunityNutritionalGaps({
      profile: shelterProfile,
      inventory: demo.communityInventory,
      foodCatalog: demo.foodCatalog,
      nutrientConfigs: demo.nutrientConfigs,
    });

    // Unsafe / uninspected high-protein batch
    const uninspectedBatch: DonationBatch = {
      ...demo.batches[1],
      safety_gate_passed: false,
      status: 'PENDING_INSPECTION',
    };

    const resUninspected = runSmartMatchingEngine({
      batch: uninspectedBatch,
      donorOrg,
      requests: demo.requests.map((r) => ({
        request: r,
        recipientOrg: demo.organisations.find((o) => o.id === r.org_id),
      })),
      deliveryCapacityPortions: 120,
      nutritionContext: {
        communityAnalysesByOrgId: { [shelterOrg.id]: analysis },
        foodCatalog: demo.foodCatalog,
        nutrientConfigs: demo.nutrientConfigs,
      },
    });
    expect(resUninspected.proposals).toHaveLength(0);
    expect(resUninspected.batch_hard_errors.length).toBeGreaterThan(0);

    // Expired high-protein batch
    const expiredBatch: DonationBatch = {
      ...demo.batches[1],
      temp_celsius: 65.0,
      safety_gate_passed: true,
      consume_by_time: new Date(Date.now() - 30 * 60_000).toISOString(),
    };
    const resExpired = runSmartMatchingEngine({
      batch: expiredBatch,
      donorOrg,
      requests: demo.requests.map((r) => ({
        request: r,
        recipientOrg: demo.organisations.find((o) => o.id === r.org_id),
      })),
      deliveryCapacityPortions: 120,
      nutritionContext: {
        communityAnalysesByOrgId: { [shelterOrg.id]: analysis },
        foodCatalog: demo.foodCatalog,
        nutrientConfigs: demo.nutrientConfigs,
      },
    });
    expect(resExpired.proposals).toHaveLength(0);
    expect(resExpired.batch_hard_errors.some((e) => e.toLowerCase().includes('consume-by'))).toBe(true);
  });

  it('handles missing nutritional data honestly without fabricating nutrient estimates', () => {
    const unknownBatch = {
      food_composition_id: null,
      food_item: 'Mystery Assorted Festival Sweet Box',
      dietary_type: 'VEGETARIAN' as const,
    };

    expect(resolveFoodCompositionForBatch(unknownBatch, VALIDATED_FOOD_COMPOSITION_TABLE)).toBeNull();

    const profile: CommunityNutritionProfile = {
      id: 'p-1',
      org_id: 'org-1',
      children_1_9_count: 10,
      adolescents_10_18_count: 0,
      adults_19_59_count: 20,
      pregnant_lactating_count: 0,
      elderly_60_plus_count: 0,
      dietary_restriction: 'VEGETARIAN',
      planning_horizon_days: 1,
      notes: null,
      is_demo: true,
      updated_at: new Date().toISOString(),
    };

    const analysis = analyzeCommunityNutritionalGaps({
      profile,
      inventory: [
        {
          id: 'inv-unknown',
          org_id: 'org-1',
          food_composition_id: null,
          custom_food_name: 'Unmapped Homemade Snack',
          quantity_portions: 50,
          portion_grams: 200,
          inventory_stage: 'AVAILABLE',
          source_batch_id: null,
          recorded_by: null,
          recorded_at: new Date().toISOString(),
          is_demo: true,
        },
      ],
      foodCatalog: VALIDATED_FOOD_COMPOSITION_TABLE,
      nutrientConfigs: DEFAULT_NUTRIENT_CONFIGS,
    });

    expect(analysis.unmapped_inventory_count).toBe(1);
    expect(analysis.overall_adequacy_pct).toBe(0);

    const contrib = evaluateBatchNutritionalContribution({
      batch: unknownBatch,
      portionsToDeliver: 40,
      communityAnalysis: analysis,
      foodCatalog: VALIDATED_FOOD_COMPOSITION_TABLE,
      nutrientConfigs: DEFAULT_NUTRIENT_CONFIGS,
    });
    expect(contrib.scoreN).toBe(0);
    expect(contrib.compositionName).toBeNull();
    expect(contrib.explanation.toLowerCase()).toContain('not mapped');
  });

  it('handles invalid/zero quantities safely and separates AVAILABLE, DISTRIBUTED, and REPORTED_CONSUMED stages', () => {
    const rice = VALIDATED_FOOD_COMPOSITION_TABLE[0];
    expect(estimateNutrientsForPortions(rice, 0, DEFAULT_NUTRIENT_CONFIGS).protein_g).toBe(0);
    expect(estimateNutrientsForPortions(rice, -25, DEFAULT_NUTRIENT_CONFIGS).calories_kcal).toBe(0);
    expect(estimateNutrientsForPortions(rice, Number.NaN, DEFAULT_NUTRIENT_CONFIGS).iron_mg).toBe(0);

    const profile: CommunityNutritionProfile = {
      id: 'p-stage',
      org_id: 'org-stage',
      children_1_9_count: 0,
      adolescents_10_18_count: 0,
      adults_19_59_count: 10,
      pregnant_lactating_count: 0,
      elderly_60_plus_count: 0,
      dietary_restriction: 'ANY',
      planning_horizon_days: 1,
      notes: null,
      is_demo: true,
      updated_at: new Date().toISOString(),
    };

    const analysis = analyzeCommunityNutritionalGaps({
      profile,
      inventory: [
        {
          id: 'i-avail',
          org_id: 'org-stage',
          food_composition_id: 'fc-toor-dal',
          custom_food_name: 'Dal',
          quantity_portions: 10,
          portion_grams: 200,
          inventory_stage: 'AVAILABLE',
          source_batch_id: null,
          recorded_by: null,
          recorded_at: new Date().toISOString(),
          is_demo: true,
        },
        {
          id: 'i-consumed',
          org_id: 'org-stage',
          food_composition_id: 'fc-toor-dal',
          custom_food_name: 'Dal Consumed',
          quantity_portions: 8,
          portion_grams: 200,
          inventory_stage: 'REPORTED_CONSUMED',
          source_batch_id: null,
          recorded_by: null,
          recorded_at: new Date().toISOString(),
          is_demo: true,
        },
        {
          id: 'i-invalid',
          org_id: 'org-stage',
          food_composition_id: 'fc-toor-dal',
          custom_food_name: 'Invalid Negative',
          quantity_portions: -5,
          portion_grams: 200,
          inventory_stage: 'AVAILABLE',
          source_batch_id: null,
          recorded_by: null,
          recorded_at: new Date().toISOString(),
          is_demo: true,
        },
      ],
      foodCatalog: VALIDATED_FOOD_COMPOSITION_TABLE,
      nutrientConfigs: DEFAULT_NUTRIENT_CONFIGS,
    });

    expect(analysis.total_portions_available).toBe(10);
    expect(analysis.total_portions_reported_consumed).toBe(8);
    const protein = analysis.nutrients.find((n) => n.nutrient_key === 'protein_g')!;
    // 10 portions * 200g = 2000g -> 20 * 7.4g = 148g available (REPORTED_CONSUMED kept strictly separate)
    expect(protein.available).toBeCloseTo(148, 1);
    expect(protein.reported_consumed).toBeCloseTo(118.4, 1);
  });

  it('scales requirements by demographic composition and supports admin-configured extra nutrients', () => {
    const pregnantGroup: CommunityNutritionProfile = {
      id: 'p-preg',
      org_id: 'org-preg',
      children_1_9_count: 0,
      adolescents_10_18_count: 0,
      adults_19_59_count: 0,
      pregnant_lactating_count: 20,
      elderly_60_plus_count: 0,
      dietary_restriction: 'VEGETARIAN',
      planning_horizon_days: 1,
      notes: null,
      is_demo: true,
      updated_at: new Date().toISOString(),
    };
    const childGroup: CommunityNutritionProfile = {
      ...pregnantGroup,
      id: 'p-child',
      org_id: 'org-child',
      children_1_9_count: 20,
      pregnant_lactating_count: 0,
    };

    const customVitC: NutrientConfig = {
      id: 'nutr-vitc',
      nutrient_key: 'vitamin_c_mg',
      display_name: 'Vitamin C',
      unit: 'mg',
      adult_daily_rda: 80,
      priority_weight: 0.1,
      source_guideline: 'ICMR-NIN RDA 2020',
      is_core: false,
      is_enabled: true,
    };
    const configs = [...DEFAULT_NUTRIENT_CONFIGS, customVitC];

    const pregReqs = calculateCommunityRequirements(pregnantGroup, configs);
    const childReqs = calculateCommunityRequirements(childGroup, configs);

    expect(pregReqs.requirements.protein_g).toBeGreaterThan(childReqs.requirements.protein_g);
    expect(pregReqs.requirements.iron_mg).toBeGreaterThan(childReqs.requirements.iron_mg);
    expect(pregReqs.requirements.vitamin_c_mg).toBeGreaterThan(0);

    // Leafy greens (fc-keerai-poriyal) has 38 mg Vitamin C per 100g in extra_nutrients_per_100g
    const keerai = VALIDATED_FOOD_COMPOSITION_TABLE.find((f) => f.id === 'fc-keerai-poriyal')!;
    const contrib = estimateNutrientsForPortions(keerai, 10, configs);
    // 10 * 150g = 1500g -> 15 * 38mg = 570mg Vitamin C
    expect(contrib.vitamin_c_mg).toBeCloseTo(570, 1);
  });

  it('enforces PostgreSQL RLS, non-PII schema, and audited RPC approval in NutriLoop migration SQL', () => {
    const sqlPath = path.resolve(
      process.cwd(),
      'supabase/migrations/20261122000004_nutriloop_schema_and_rls.sql'
    );
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const expectedTables = [
      'food_composition_reference',
      'nutrient_configurations',
      'community_nutrition_profiles',
      'community_food_inventory',
      'targeted_donation_requests',
      'nutritional_impact_snapshots',
    ];

    for (const table of expectedTables) {
      expect(sql).toContain(`CREATE TABLE IF NOT EXISTS public.${table}`);
      expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
    }

    // Approval RPC must be SECURITY DEFINER, check role/membership, and write to audit_logs
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.approve_targeted_donation_request');
    expect(sql).toContain('SECURITY DEFINER');
    expect(sql).toContain('INSERT INTO public.audit_logs');

    // Community profiles must NEVER store personal beneficiary PII columns
    expect(sql).not.toMatch(/beneficiary_name|aadhaar|patient_name|date_of_birth/i);
  });
});
