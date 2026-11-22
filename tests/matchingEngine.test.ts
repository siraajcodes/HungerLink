import { describe, expect, it } from 'vitest';
import { createIsolatedDemoDataset } from '../src/data/demoScenario';
import {
  buildCsvDocument,
  isDietaryCompatible,
  MATCHING_ALGORITHM_VERSION,
  runSmartMatchingEngine,
  validateSplitAllocationBatch,
} from '../src/lib/matchingEngine';

describe('Smart Surplus Matching Engine', () => {
  it('computes exact split-batch allocation for Wedding Hall A (100) -> Shelter A (60) + Kitchen B (30) + 10 remaining', () => {
    const demo = createIsolatedDemoDataset();
    const batch = demo.batches[0]; // 100 vegetarian portions, safety_gate_passed = true
    const donorOrg = demo.organisations.find((o) => o.id === batch.donor_id);
    const reqs = demo.requests.map((r) => ({
      request: r,
      recipientOrg: demo.organisations.find((o) => o.id === r.org_id),
    }));

    const result = runSmartMatchingEngine({
      batch,
      donorOrg,
      requests: reqs,
      deliveryCapacityPortions: 120,
      safetyBufferMinutes: 45,
    });

    expect(result.batch_hard_errors).toHaveLength(0);
    expect(result.algorithm_version).toBe(MATCHING_ALGORITHM_VERSION);
    expect(result.portions_available).toBe(100);
    expect(result.proposals).toHaveLength(2);
    expect(result.total_proposed).toBe(90);
    expect(result.remaining_unallocated).toBe(10);

    const shelterProposal = result.proposals.find((p) => p.org_name.includes('Shelter A'));
    const kitchenProposal = result.proposals.find((p) => p.org_name.includes('Community Kitchen B'));
    expect(shelterProposal?.allocated_portions).toBe(60);
    expect(kitchenProposal?.allocated_portions).toBe(30);

    // Verify S = 0.35L + 0.30U + 0.20Q + 0.15T math on every proposal
    for (const prop of result.proposals) {
      const { L, U, Q, T, total_score } = prop.match_explanation;
      expect(L).toBeGreaterThanOrEqual(0);
      expect(L).toBeLessThanOrEqual(1);
      expect(U).toBeGreaterThanOrEqual(0);
      expect(U).toBeLessThanOrEqual(1);
      expect(Q).toBeGreaterThanOrEqual(0);
      expect(Q).toBeLessThanOrEqual(1);
      expect(T).toBeGreaterThanOrEqual(0);
      expect(T).toBeLessThanOrEqual(1);
      const expected = Math.round((0.35 * L + 0.30 * U + 0.20 * Q + 0.15 * T) * 10000) / 10000;
      expect(total_score).toBeCloseTo(expected, 4);
      expect(prop.match_score).toBe(total_score);
    }
  });

  it('fails closed when temperature reading is missing or safety gate has not passed', () => {
    const demo = createIsolatedDemoDataset();
    const uninspectedBatch = { ...demo.batches[0], temp_celsius: null, safety_gate_passed: true };
    const donorOrg = demo.organisations.find((o) => o.id === uninspectedBatch.donor_id);
    const reqs = demo.requests.map((r) => ({
      request: r,
      recipientOrg: demo.organisations.find((o) => o.id === r.org_id),
    }));

    const result = runSmartMatchingEngine({
      batch: uninspectedBatch,
      donorOrg,
      requests: reqs,
      deliveryCapacityPortions: 120,
    });

    expect(result.proposals).toHaveLength(0);
    expect(result.batch_hard_errors.length).toBeGreaterThan(0);
    expect(result.batch_hard_errors[0]).toMatch(/fail-closed/i);
  });

  it('rejects unverified donor or unverified recipient organisations', () => {
    const demo = createIsolatedDemoDataset();
    const batch = demo.batches[0];
    const donorOrg = demo.organisations.find((o) => o.id === batch.donor_id)!;
    const pendingRecipient = demo.organisations.find((o) => o.verification_status === 'pending')!;

    const result = runSmartMatchingEngine({
      batch,
      donorOrg,
      requests: [
        {
          request: { ...demo.requests[0], org_id: pendingRecipient.id },
          recipientOrg: pendingRecipient,
        },
      ],
      deliveryCapacityPortions: 120,
    });

    expect(result.proposals).toHaveLength(0);
    expect(result.rejected_candidates).toHaveLength(1);
    expect(result.rejected_candidates[0].reasons.join(' ')).toMatch(/not verified/i);
  });

  it('rejects batches whose estimated delivery violates consume-by safety buffer', () => {
    const demo = createIsolatedDemoDataset();
    const nowMs = Date.now();
    const tightBatch = {
      ...demo.batches[0],
      pickup_deadline: new Date(nowMs + 20 * 60_000).toISOString(),
      consume_by_time: new Date(nowMs + 30 * 60_000).toISOString(),
    };
    const donorOrg = demo.organisations.find((o) => o.id === tightBatch.donor_id);
    const reqs = demo.requests.map((r) => ({
      request: r,
      recipientOrg: demo.organisations.find((o) => o.id === r.org_id),
    }));

    const result = runSmartMatchingEngine({
      batch: tightBatch,
      donorOrg,
      requests: reqs,
      deliveryCapacityPortions: 120,
      safetyBufferMinutes: 45,
      nowMs,
    });

    expect(result.proposals).toHaveLength(0);
    expect(result.rejected_candidates[0].reasons.join(' ')).toMatch(/safety buffer/i);
  });

  it('enforces dietary compatibility rules strictly', () => {
    expect(isDietaryCompatible('VEGETARIAN', 'VEGETARIAN')).toBe(true);
    expect(isDietaryCompatible('VEGAN', 'VEGETARIAN')).toBe(true);
    expect(isDietaryCompatible('NON_VEGETARIAN', 'VEGETARIAN')).toBe(false);
    expect(isDietaryCompatible('VEGETARIAN', 'JAIN')).toBe(false);
    expect(isDietaryCompatible('NON_VEGETARIAN', 'ANY')).toBe(true);
  });

  it('blocks over-allocation and duplicate meal requests in split validation', () => {
    const over = validateSplitAllocationBatch(100, 40, [
      { meal_request_id: 'r1', allocated_portions: 70 },
    ]);
    expect(over.valid).toBe(false);
    expect(over.error).toMatch(/Over-allocation/i);

    const dup = validateSplitAllocationBatch(100, 0, [
      { meal_request_id: 'r1', allocated_portions: 30 },
      { meal_request_id: 'r1', allocated_portions: 20 },
    ]);
    expect(dup.valid).toBe(false);
    expect(dup.error).toMatch(/Duplicate/i);

    const valid = validateSplitAllocationBatch(100, 0, [
      { meal_request_id: 'r1', allocated_portions: 60 },
      { meal_request_id: 'r2', allocated_portions: 30 },
    ]);
    expect(valid.valid).toBe(true);
  });

  it('neutralizes CSV formula injection in exports', () => {
    const csv = buildCsvDocument(['Name', 'Note'], [['=CMD()', 'Normal text']]);
    expect(csv).toContain("'=CMD()");
  });
});
