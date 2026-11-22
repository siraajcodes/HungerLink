import type {
  DietaryPreference,
  DietaryType,
  DonationBatch,
  MatchExplanation,
  MealRequest,
  Organisation,
} from '../types/database';
import type {
  CommunityGapAnalysis,
  FoodCompositionItem,
  NutrientConfig,
} from '../types/nutriloop';
import { evaluateBatchNutritionalContribution } from './nutriLoopEngine';

export const MATCHING_ALGORITHM_VERSION = 'hungerlink-match-v2.1.0-nutriloop';
export const DEFAULT_SAFETY_BUFFER_MINUTES = 45;
export const MAX_SCORING_DISTANCE_KM = 25;
export const AVERAGE_CITY_SPEED_KMH = 24;
export const PICKUP_HANDOVER_OVERHEAD_MIN = 15;

export interface MatchingNutritionContext {
  communityAnalysesByOrgId: Record<string, CommunityGapAnalysis>;
  foodCatalog: FoodCompositionItem[];
  nutrientConfigs: NutrientConfig[];
}

export interface MatchingInput {
  batch: DonationBatch;
  donorOrg: Organisation | undefined;
  requests: Array<{
    request: MealRequest;
    recipientOrg: Organisation | undefined;
  }>;
  deliveryCapacityPortions: number;
  safetyBufferMinutes?: number;
  nowMs?: number;
  nutritionContext?: MatchingNutritionContext;
}

export interface RejectedCandidate {
  meal_request_id: string;
  org_id: string;
  org_name: string;
  reasons: string[];
}

export interface ProposedAllocationCandidate {
  donation_batch_id: string;
  meal_request_id: string;
  org_id: string;
  org_name: string;
  portions_needed: number;
  allocated_portions: number;
  match_score: number;
  match_explanation: MatchExplanation;
}

export interface MatchingResult {
  algorithm_version: string;
  calculated_at: string;
  portions_available: number;
  total_proposed: number;
  remaining_unallocated: number;
  proposals: ProposedAllocationCandidate[];
  rejected_candidates: RejectedCandidate[];
  batch_hard_errors: string[];
}

export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isDietaryCompatible(
  batchDietary: DietaryType,
  requestPref: DietaryPreference
): boolean {
  if (requestPref === 'ANY') return true;
  if (requestPref === batchDietary) return true;
  // Strict dietary compatibility: Vegan & Jain satisfy Vegetarian; Jain is strictly Jain
  if (requestPref === 'VEGETARIAN' && (batchDietary === 'VEGAN' || batchDietary === 'JAIN')) {
    return true;
  }
  return false;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/**
 * Deterministic rule-based Smart Surplus Matching Engine.
 *
 * Hard Eligibility Gate (FAIL-CLOSED):
 * 1. Donor organisation verified
 * 2. Recipient organisation verified
 * 3. Safety gate passed AND explicit temperature reading present (missing/uncertain fails closed)
 * 4. Pickup deadline not passed
 * 5. Estimated delivery occurs before consume_by_time - safety_buffer_minutes
 * 6. Dietary requirements compatible
 * 7. Receiving organisation has sufficient daily capacity
 * 8. Available delivery capacity is sufficient
 *
 * Scoring Formula:
 *   S = 0.35L + 0.30U + 0.20Q + 0.15T
 *   where L, U, Q, T in [0, 1]
 */
export function runSmartMatchingEngine(input: MatchingInput): MatchingResult {
  const nowMs = input.nowMs ?? Date.now();
  const safetyBufferMinutes = input.safetyBufferMinutes ?? DEFAULT_SAFETY_BUFFER_MINUTES;
  const calculatedAt = new Date(nowMs).toISOString();

  const { batch, donorOrg, requests, deliveryCapacityPortions } = input;
  const remainingAvailable = Math.max(0, batch.portions_available - batch.portions_allocated);

  const batchHardErrors: string[] = [];

  if (!donorOrg || donorOrg.verification_status !== 'verified') {
    batchHardErrors.push('Donor organisation is not verified.');
  }

  // Fail-closed safety gate: missing temperature or unpassed safety gate strictly rejects
  if (
    batch.safety_gate_passed !== true ||
    batch.temp_celsius === null ||
    batch.temp_celsius === undefined ||
    !Number.isFinite(batch.temp_celsius)
  ) {
    batchHardErrors.push(
      'Food safety eligibility failed or temperature reading is missing/uncertain (fail-closed).'
    );
  }

  const pickupDeadlineMs = new Date(batch.pickup_deadline).getTime();
  const consumeByMs = new Date(batch.consume_by_time).getTime();
  if (!Number.isFinite(pickupDeadlineMs) || pickupDeadlineMs <= nowMs) {
    batchHardErrors.push('Pickup deadline has already passed.');
  }
  if (!Number.isFinite(consumeByMs) || consumeByMs <= nowMs) {
    batchHardErrors.push('Consume-by time has already passed.');
  }
  if (remainingAvailable <= 0) {
    batchHardErrors.push('No unallocated portions remain in this batch.');
  }
  if (deliveryCapacityPortions <= 0) {
    batchHardErrors.push('Available delivery capacity is insufficient (0 portions).');
  }

  const rejectedCandidates: RejectedCandidate[] = [];

  if (batchHardErrors.length > 0) {
    for (const item of requests) {
      rejectedCandidates.push({
        meal_request_id: item.request.id,
        org_id: item.request.org_id,
        org_name: item.recipientOrg?.name ?? 'Unknown organisation',
        reasons: [...batchHardErrors],
      });
    }
    return {
      algorithm_version: MATCHING_ALGORITHM_VERSION,
      calculated_at: calculatedAt,
      portions_available: remainingAvailable,
      total_proposed: 0,
      remaining_unallocated: remainingAvailable,
      proposals: [],
      rejected_candidates: rejectedCandidates,
      batch_hard_errors: batchHardErrors,
    };
  }

  const eligibleScored: Array<{
    request: MealRequest;
    recipientOrg: Organisation;
    needed: number;
    score: number;
    explanation: MatchExplanation;
  }> = [];

  const safeLatestDeliveryMs = consumeByMs - safetyBufferMinutes * 60_000;

  for (const item of requests) {
    const { request, recipientOrg } = item;
    const reasons: string[] = [];
    const needed = Math.max(0, request.portions_needed - request.portions_fulfilled);

    if (request.status !== 'OPEN' && request.status !== 'PARTIALLY_ALLOCATED') {
      reasons.push(`Request status is ${request.status} (not open).`);
    }
    if (needed <= 0) {
      reasons.push('Request has 0 remaining portions needed.');
    }
    if (!recipientOrg || recipientOrg.verification_status !== 'verified') {
      reasons.push('Recipient organisation is not verified.');
    }
    if (!isDietaryCompatible(batch.dietary_type, request.dietary_pref)) {
      reasons.push(
        `Dietary conflict: batch is ${batch.dietary_type}, request requires ${request.dietary_pref}.`
      );
    }

    const distKm = recipientOrg
      ? haversineDistanceKm(
          batch.pickup_lat,
          batch.pickup_lng,
          recipientOrg.location_lat,
          recipientOrg.location_lng
        )
      : 9999;

    const estTransitMinutes = Math.round(
      (distKm / AVERAGE_CITY_SPEED_KMH) * 60 + PICKUP_HANDOVER_OVERHEAD_MIN
    );
    const estDeliveryMs = nowMs + estTransitMinutes * 60_000;

    if (estDeliveryMs > safeLatestDeliveryMs) {
      reasons.push(
        `Estimated delivery (${estTransitMinutes} min) cannot complete before consume-by time with ${safetyBufferMinutes} min safety buffer.`
      );
    }

    const requiredByMs = new Date(request.required_by).getTime();
    if (Number.isFinite(requiredByMs) && requiredByMs < nowMs) {
      reasons.push('Recipient required-by window has already elapsed.');
    }

    const minimumServiceable = Math.min(needed, remainingAvailable);
    if (!recipientOrg || recipientOrg.daily_capacity < minimumServiceable) {
      reasons.push(
        `Insufficient receiving capacity: org capacity ${recipientOrg?.daily_capacity ?? 0} < ${minimumServiceable} portions.`
      );
    }

    if (reasons.length > 0 || !recipientOrg) {
      rejectedCandidates.push({
        meal_request_id: request.id,
        org_id: request.org_id,
        org_name: recipientOrg?.name ?? 'Unknown organisation',
        reasons,
      });
      continue;
    }

    // Factor L: Location suitability (closer distance -> closer to 1)
    const L = round4(clamp01(1 - distKm / MAX_SCORING_DISTANCE_KM));

    // Factor U: Urgency (validated 0..1, factoring wait time slightly if within bounds)
    const baseUrgency = clamp01(Number(request.urgency_score));
    const waitHours = Math.max(
      0,
      (nowMs - new Date(request.wait_started_at).getTime()) / 3_600_000
    );
    const waitBonus = Math.min(0.1, waitHours * 0.025);
    const U = round4(clamp01(baseUrgency + waitBonus * (1 - baseUrgency)));

    // Factor Q: Quantity compatibility (ratio of overlap to larger quantity)
    const Q = round4(
      clamp01(
        Math.min(needed, remainingAvailable) / Math.max(needed, remainingAvailable, 1)
      )
    );

    // Factor T: Time suitability (how comfortably delivery fits inside safe window)
    const availableWindowMin = Math.max(1, (safeLatestDeliveryMs - nowMs) / 60_000);
    const T = round4(
      clamp01(1 - estTransitMinutes / (availableWindowMin + estTransitMinutes))
    );

    // Optional NutriLoop Nutrition-Aware Factor N (runs STRICTLY after safety & eligibility gates pass)
    const orgAnalysis = input.nutritionContext?.communityAnalysesByOrgId?.[request.org_id];
    let totalScore: number;
    let N: number | undefined;
    let nutritionMode = false;
    let nutritionSummary: string | undefined;
    let nutritionAddressedGaps:
      | Array<{ nutrient: string; closurePct: number; addedAmount: number; unit: string }>
      | undefined;

    if (input.nutritionContext && orgAnalysis) {
      const deliverablePortions = Math.min(needed, remainingAvailable, recipientOrg.daily_capacity);
      const evalNutr = evaluateBatchNutritionalContribution({
        batch,
        portionsToDeliver: deliverablePortions,
        communityAnalysis: orgAnalysis,
        foodCatalog: input.nutritionContext.foodCatalog,
        nutrientConfigs: input.nutritionContext.nutrientConfigs,
      });
      N = round4(clamp01(evalNutr.scoreN));
      nutritionMode = true;
      nutritionSummary = evalNutr.explanation;
      nutritionAddressedGaps = evalNutr.addressedGaps;
      // Nutrition-aware deterministic weights: 0.25L + 0.20U + 0.15Q + 0.15T + 0.25N
      totalScore = round4(0.25 * L + 0.20 * U + 0.15 * Q + 0.15 * T + 0.25 * N);
    } else {
      // Standard HungerLink deterministic formula: 0.35L + 0.30U + 0.20Q + 0.15T
      totalScore = round4(0.35 * L + 0.30 * U + 0.20 * Q + 0.15 * T);
    }

    const explanation: MatchExplanation = {
      L,
      U,
      Q,
      T,
      ...(nutritionMode
        ? {
            N,
            nutrition_mode: true,
            nutrition_summary: nutritionSummary,
            nutrition_addressed_gaps: nutritionAddressedGaps,
          }
        : {}),
      total_score: totalScore,
      distance_km: Math.round(distKm * 100) / 100,
      est_transit_minutes: estTransitMinutes,
      safety_buffer_minutes: safetyBufferMinutes,
      algorithm_version: MATCHING_ALGORITHM_VERSION,
      calculated_at: calculatedAt,
      summary: nutritionMode && nutritionSummary
        ? `Distance ${distKm.toFixed(1)} km (~${estTransitMinutes}m transit), urgency ${(
            U * 100
          ).toFixed(0)}%, quantity fit ${(Q * 100).toFixed(0)}%. ${nutritionSummary}`
        : `Distance ${distKm.toFixed(1)} km (~${estTransitMinutes}m transit), urgency ${(
            U * 100
          ).toFixed(0)}%, quantity fit ${(Q * 100).toFixed(0)}%, time margin ${(T * 100).toFixed(0)}%.`,
    };

    eligibleScored.push({
      request,
      recipientOrg,
      needed,
      score: totalScore,
      explanation,
    });
  }

  // Deterministic sort: highest score first, then oldest wait_started_at, then request id
  eligibleScored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const waitDiff =
      new Date(a.request.wait_started_at).getTime() -
      new Date(b.request.wait_started_at).getTime();
    if (waitDiff !== 0) return waitDiff;
    return a.request.id.localeCompare(b.request.id);
  });

  // Split-batch allocation strictly bounded by remainingAvailable AND deliveryCapacityPortions
  let allocatablePool = Math.min(remainingAvailable, deliveryCapacityPortions);
  const proposals: ProposedAllocationCandidate[] = [];

  for (const cand of eligibleScored) {
    if (allocatablePool <= 0) break;
    const maxForOrg = Math.min(cand.needed, cand.recipientOrg.daily_capacity);
    const allocated = Math.min(allocatablePool, maxForOrg);
    if (allocated > 0) {
      proposals.push({
        donation_batch_id: batch.id,
        meal_request_id: cand.request.id,
        org_id: cand.request.org_id,
        org_name: cand.recipientOrg.name,
        portions_needed: cand.needed,
        allocated_portions: allocated,
        match_score: cand.score,
        match_explanation: cand.explanation,
      });
      allocatablePool -= allocated;
    }
  }

  const totalProposed = proposals.reduce((sum, p) => sum + p.allocated_portions, 0);

  return {
    algorithm_version: MATCHING_ALGORITHM_VERSION,
    calculated_at: calculatedAt,
    portions_available: remainingAvailable,
    total_proposed: totalProposed,
    remaining_unallocated: Math.max(0, remainingAvailable - totalProposed),
    proposals,
    rejected_candidates: rejectedCandidates,
    batch_hard_errors: [],
  };
}

/**
 * Validates that a set of split allocations never exceeds available portions
 * and contains no duplicate meal_request_ids.
 */
export function validateSplitAllocationBatch(
  portionsAvailable: number,
  alreadyAllocated: number,
  proposals: Array<{ meal_request_id: string; allocated_portions: number }>
): { valid: boolean; error?: string } {
  const seen = new Set<string>();
  let sum = alreadyAllocated;
  for (const p of proposals) {
    if (seen.has(p.meal_request_id)) {
      return { valid: false, error: 'Duplicate meal request in allocation batch.' };
    }
    seen.add(p.meal_request_id);
    if (!Number.isInteger(p.allocated_portions) || p.allocated_portions <= 0) {
      return { valid: false, error: 'Allocated portions must be a positive integer.' };
    }
    sum += p.allocated_portions;
  }
  if (sum > portionsAvailable) {
    return {
      valid: false,
      error: `Over-allocation blocked: total ${sum} exceeds available ${portionsAvailable} portions.`,
    };
  }
  return { valid: true };
}

/**
 * Generates RFC 4180 escaped CSV text for authorized report exports.
 */
export function buildCsvDocument(headers: string[], rows: Array<Array<string | number | null | undefined>>): string {
  const escapeCell = (val: string | number | null | undefined): string => {
    const str = val === null || val === undefined ? '' : String(val);
    // Neutralize CSV formula injection for spreadsheet safety
    const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
    if (/[",\n\r]/.test(safe)) {
      return `"${safe.replace(/"/g, '""')}"`;
    }
    return safe;
  };
  const lines = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ];
  return lines.join('\r\n');
}
