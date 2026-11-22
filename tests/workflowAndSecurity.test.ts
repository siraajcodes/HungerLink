import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { computeRescueRoute, orderMultiStopWaypoints } from '../src/lib/routingService';
import { syncOfflineDraftQueue } from '../src/lib/offlineQueue';
import type { OfflineRequestDraft } from '../src/types/database';

describe('RescueRoute Multi-Stop Ordering & Feasibility', () => {
  it('always places PICKUP before DROPOFF stops and validates capacity & consume-by buffer', async () => {
    const nowMs = Date.now();
    const consumeBy = new Date(nowMs + 240 * 60_000).toISOString();

    const ordered = orderMultiStopWaypoints([
      {
        id: 'd2',
        label: 'Community Kitchen B',
        address: 'Velachery',
        stopType: 'DROPOFF',
        lat: 12.9815,
        lng: 80.218,
        portions: 30,
        consumeByTime: consumeBy,
      },
      {
        id: 'p1',
        label: 'Wedding Hall A',
        address: 'Guindy',
        stopType: 'PICKUP',
        lat: 13.0102,
        lng: 80.2155,
        portions: 90,
        consumeByTime: consumeBy,
      },
      {
        id: 'd1',
        label: 'Shelter A',
        address: 'Adyar',
        stopType: 'DROPOFF',
        lat: 13.0067,
        lng: 80.2571,
        portions: 60,
        consumeByTime: consumeBy,
      },
    ]);

    expect(ordered[0].stopType).toBe('PICKUP');

    const feasibleResult = await computeRescueRoute({
      waypoints: ordered,
      vehicleCapacityPortions: 120,
      safetyBufferMinutes: 45,
      nowMs,
    });
    expect(feasibleResult.feasible).toBe(true);
    expect(feasibleResult.provider).toBe('GEODESIC_FALLBACK');
    expect(feasibleResult.distanceKm).toBeGreaterThan(0);

    const overloadedResult = await computeRescueRoute({
      waypoints: ordered,
      vehicleCapacityPortions: 50,
      safetyBufferMinutes: 45,
      nowMs,
    });
    expect(overloadedResult.feasible).toBe(false);
    expect(overloadedResult.feasibilityIssues.join(' ')).toMatch(/exceeds vehicle capacity/i);
  });
});

describe('Offline Field Worker Queue Conflict & Idempotency', () => {
  it('syncs valid pending drafts with idempotency keys and flags expired drafts as CONFLICT', async () => {
    const futureIso = new Date(Date.now() + 180 * 60_000).toISOString();
    const expiredIso = new Date(Date.now() - 10 * 60_000).toISOString();

    const drafts: OfflineRequestDraft[] = [
      {
        idempotency_key: '11111111-1111-4111-8111-111111111111',
        org_id: 'org-1',
        org_name: 'Shelter A',
        portions_needed: 40,
        dietary_pref: 'VEGETARIAN',
        urgency_score: 0.85,
        intake_channel: 'FIELD_ASSISTED_PHONE',
        required_by: futureIso,
        notes: 'Phone request',
        created_at_local: new Date().toISOString(),
        sync_status: 'PENDING',
        attempts: 0,
      },
      {
        idempotency_key: '22222222-2222-4222-8222-222222222222',
        org_id: 'org-2',
        org_name: 'Kitchen B',
        portions_needed: 25,
        dietary_pref: 'VEGETARIAN',
        urgency_score: 0.7,
        intake_channel: 'FIELD_ASSISTED_WALKIN',
        required_by: expiredIso,
        notes: 'Expired offline draft',
        created_at_local: new Date().toISOString(),
        sync_status: 'PENDING',
        attempts: 0,
      },
    ];

    const syncedKeys: string[] = [];
    const results = await syncOfflineDraftQueue(drafts, async (draft) => {
      syncedKeys.push(draft.idempotency_key);
      return { status: 'SYNCED' };
    });

    expect(syncedKeys).toEqual(['11111111-1111-4111-8111-111111111111']);
    expect(results[0].sync_status).toBe('SYNCED');
    expect(results[1].sync_status).toBe('CONFLICT');
  });
});

describe('PostgreSQL Security & RLS Migration Verification', () => {
  const rlsSql = fs.readFileSync(
    path.resolve(process.cwd(), 'supabase/migrations/20261121000002_hungerlink_rls_and_security.sql'),
    'utf-8'
  );
  const rpcSql = fs.readFileSync(
    path.resolve(process.cwd(), 'supabase/migrations/20261121000003_hungerlink_rpcs_and_views.sql'),
    'utf-8'
  );

  it('enables RLS across all 14 operational tables', () => {
    const requiredTables = [
      'profiles',
      'organisations',
      'organisation_members',
      'donation_batches',
      'meal_requests',
      'allocations',
      'delivery_routes',
      'delivery_stops',
      'food_safety_checks',
      'mealtrace_events',
      'impact_records',
      'incidents',
      'notifications',
      'audit_logs',
    ];
    for (const tbl of requiredTables) {
      expect(rlsSql).toContain(`ALTER TABLE public.${tbl} ENABLE ROW LEVEL SECURITY;`);
    }
  });

  it('blocks self-elevation to ADMINISTRATOR, verification tampering, and ledger edits', () => {
    expect(rlsSql).toContain('prevent_profile_role_escalation');
    expect(rlsSql).toContain('prevent_org_verification_tampering');
    expect(rlsSql).toContain('enforce_append_only');
    expect(rlsSql).toContain("org-verification-docs'");
  });

  it('uses row-level FOR UPDATE locking in split allocation RPC and excludes is_demo from live views', () => {
    expect(rpcSql).toContain('FOR UPDATE');
    expect(rpcSql).toContain('WHERE db.is_demo = FALSE');
    expect(rpcSql).toContain('WHERE is_demo = FALSE');
  });
});
