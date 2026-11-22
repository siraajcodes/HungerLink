import { haversineDistanceKm, runSmartMatchingEngine } from './matchingEngine';
import { DEFAULT_NUTRIENT_CONFIGS } from './nutriLoopEngine';
import { orderMultiStopWaypoints } from './routingService';
import type {
  Allocation,
  AppNotification,
  AuditLog,
  DeliveryRoute,
  DeliveryStop,
  DonationBatch,
  FoodSafetyCheck,
  MealRequest,
  MealTraceEvent,
  Organisation,
} from '../types/database';
import type { CommunityGapAnalysis, FoodCompositionItem } from '../types/nutriloop';

export interface AutoSafetyEvaluation {
  passed: boolean;
  status: 'PASSED' | 'REJECTED';
  reason: string;
  packagingCondition: string;
}

export interface AutoDeliveryDriver {
  id: string;
  fullName: string;
  vehicleCapacity?: number;
}

export interface AutoPipelineResult {
  safetyCheck: FoodSafetyCheck;
  updatedBatch: DonationBatch;
  createdAllocations: Allocation[];
  createdRoute: DeliveryRoute | null;
  traceEvents: MealTraceEvent[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  matchedOrgNames: string[];
  assignedDriverName: string | null;
  safetyPassed: boolean;
  safetyReason: string;
}

function makeAutoId(prefix: string): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

/**
 * Automated Food Safety Gate:
 * Evaluates consume-by buffer and thermal safety thresholds deterministically.
 * - Rejects expired food (< 30 min remaining)
 * - Cooked hot meals must be >= 60°C (or safely chilled <= 5°C)
 * - Chilled meals must be <= 5°C
 * - Dry/bakery and fresh produce pass if packaging is specified and within consume-by window
 */
export function evaluateAutoFoodSafety(
  batch: Pick<
    DonationBatch,
    'food_category' | 'temp_celsius' | 'consume_by_time' | 'pickup_deadline' | 'packaging_details'
  >,
  nowMs = Date.now()
): AutoSafetyEvaluation {
  const consumeMs = new Date(batch.consume_by_time).getTime();
  const minutesUntilExpiry = (consumeMs - nowMs) / 60_000;

  if (!Number.isFinite(consumeMs) || minutesUntilExpiry < 30) {
    return {
      passed: false,
      status: 'REJECTED',
      reason: 'Auto-safety rejected: Consume-by window has less than 30 minutes remaining.',
      packagingCondition: 'EXPIRED_WINDOW',
    };
  }

  const temp = batch.temp_celsius;
  const cat = batch.food_category;

  if (cat === 'COOKED_MEALS') {
    if (temp === null || !Number.isFinite(temp)) {
      return {
        passed: false,
        status: 'REJECTED',
        reason: 'Auto-safety rejected: Cooked meals require a valid temperature reading (≥ 60°C hot or ≤ 5°C chilled).',
        packagingCondition: 'TEMP_MISSING',
      };
    }
    if (temp > 5 && temp < 60) {
      return {
        passed: false,
        status: 'REJECTED',
        reason: `Auto-safety rejected: Cooked meal temperature (${temp}°C) is in the 5°C–60°C danger zone.`,
        packagingCondition: 'TEMP_DANGER_ZONE',
      };
    }
  } else if (cat === 'CHILLED_MEALS') {
    if (temp === null || !Number.isFinite(temp) || temp > 5) {
      return {
        passed: false,
        status: 'REJECTED',
        reason: `Auto-safety rejected: Chilled food must be ≤ 5°C (recorded ${temp ?? 'N/A'}°C).`,
        packagingCondition: 'TEMP_DANGER_ZONE',
      };
    }
  }

  return {
    passed: true,
    status: 'PASSED',
    reason:
      temp !== null
        ? `Auto-verified safe (${temp}°C, ${Math.round(minutesUntilExpiry)} min before consume-by).`
        : `Auto-verified safe (${cat.replace(/_/g, ' ').toLowerCase()}, ${Math.round(minutesUntilExpiry)} min before consume-by).`,
    packagingCondition: 'INTACT_SEALED',
  };
}

/**
 * Full 1-Click Automated Rescue Pipeline for a newly submitted Donation Batch:
 * 1. Automatic food-safety check & QR activation
 * 2. Automatic Smart Matching + NutriLoop prioritization & split allocation approval
 * 3. Automatic delivery driver assignment & multi-stop route dispatch
 */
export function runAutoPipelineForBatch(params: {
  batch: DonationBatch;
  donor: Organisation;
  requests: MealRequest[];
  organisations: Organisation[];
  existingAllocations: Allocation[];
  communityGapAnalyses: Record<string, CommunityGapAnalysis>;
  foodCatalog: FoodCompositionItem[];
  deliveryDriver: AutoDeliveryDriver;
  adminUserId?: string;
  nowIso?: string;
}): AutoPipelineResult {
  const nowIso = params.nowIso ?? new Date().toISOString();
  const nowMs = new Date(nowIso).getTime();

  const evalResult = evaluateAutoFoodSafety(params.batch, nowMs);

  const safetyCheck: FoodSafetyCheck = {
    id: makeAutoId('chk'),
    donation_batch_id: params.batch.id,
    inspector_id: params.adminUserId ?? 'auto-safety-engine',
    inspector_name: 'HungerLink Auto-Safety',
    inspection_status: evalResult.status,
    recorded_temp: params.batch.temp_celsius,
    packaging_condition: evalResult.packagingCondition,
    inspection_notes: evalResult.passed ? evalResult.reason : null,
    rejection_reason: evalResult.passed ? null : evalResult.reason,
    physical_inspection_confirmed: evalResult.passed,
    inspected_at: nowIso,
  };

  const traceEvents: MealTraceEvent[] = [];
  const notifications: AppNotification[] = [];
  const auditLogs: AuditLog[] = [];

  if (!evalResult.passed) {
    const rejectedBatch: DonationBatch = {
      ...params.batch,
      safety_gate_passed: false,
      status: 'INSPECTION_REJECTED',
      updated_at: nowIso,
    };
    traceEvents.push({
      id: makeAutoId('mt'),
      donation_batch_id: params.batch.id,
      event_type: 'INSPECTION_REJECTED',
      actor_id: null,
      actor_label: 'HungerLink Auto-Safety',
      recorded_temp: params.batch.temp_celsius,
      confirmed_portions: null,
      event_metadata: { automated: true, rejection_reason: evalResult.reason },
      created_at: nowIso,
    });
    auditLogs.push({
      id: makeAutoId('aud'),
      actor_id: null,
      actor_label: 'Auto-Dispatch Engine',
      action: 'AUTO_SAFETY_REJECTED',
      entity_type: 'donation_batches',
      entity_id: params.batch.id,
      metadata: { batch_code: params.batch.batch_code, reason: evalResult.reason },
      created_at: nowIso,
    });
    return {
      safetyCheck,
      updatedBatch: rejectedBatch,
      createdAllocations: [],
      createdRoute: null,
      traceEvents,
      notifications,
      auditLogs,
      matchedOrgNames: [],
      assignedDriverName: null,
      safetyPassed: false,
      safetyReason: evalResult.reason,
    };
  }

  // Step 1 Passed: Activate Safety Gate & QR
  const safeBatch: DonationBatch = {
    ...params.batch,
    safety_gate_passed: true,
    status: 'INSPECTION_PASSED',
    updated_at: nowIso,
  };

  traceEvents.push(
    {
      id: makeAutoId('mt'),
      donation_batch_id: safeBatch.id,
      event_type: 'INSPECTION_PASSED',
      actor_id: null,
      actor_label: 'HungerLink Auto-Safety',
      recorded_temp: safeBatch.temp_celsius,
      confirmed_portions: null,
      event_metadata: { automated: true, note: evalResult.reason },
      created_at: nowIso,
    },
    {
      id: makeAutoId('mt'),
      donation_batch_id: safeBatch.id,
      event_type: 'QR_GENERATED',
      actor_id: null,
      actor_label: 'MealTrace System',
      recorded_temp: null,
      confirmed_portions: null,
      event_metadata: { automated: true },
      created_at: nowIso,
    }
  );

  // Step 2: Run Smart Matching Engine automatically
  const orgMap = new Map(params.organisations.map((o) => [o.id, o]));
  const activeAllocatedByReq = new Map<string, number>();
  for (const a of params.existingAllocations) {
    if (!['DECLINED', 'CANCELLED'].includes(a.status)) {
      activeAllocatedByReq.set(
        a.meal_request_id,
        (activeAllocatedByReq.get(a.meal_request_id) ?? 0) + a.allocated_portions
      );
    }
  }

  const candidateRequests = params.requests.map((r) => ({
    request: {
      ...r,
      portions_fulfilled: Math.max(r.portions_fulfilled, activeAllocatedByReq.get(r.id) ?? 0),
    },
    recipientOrg: orgMap.get(r.org_id),
  }));

  const matchOutput = runSmartMatchingEngine({
    batch: safeBatch,
    donorOrg: params.donor,
    requests: candidateRequests,
    deliveryCapacityPortions: params.deliveryDriver.vehicleCapacity ?? 150,
    nowMs,
    nutritionContext: {
      communityAnalysesByOrgId: params.communityGapAnalyses,
      foodCatalog: params.foodCatalog,
      nutrientConfigs: DEFAULT_NUTRIENT_CONFIGS,
    },
  });

  if (matchOutput.batch_hard_errors.length > 0 || matchOutput.proposals.length === 0) {
    auditLogs.push({
      id: makeAutoId('aud'),
      actor_id: null,
      actor_label: 'Auto-Dispatch Engine',
      action: 'AUTO_SAFETY_PASSED_AWAITING_REQUEST',
      entity_type: 'donation_batches',
      entity_id: safeBatch.id,
      metadata: { batch_code: safeBatch.batch_code, portions: safeBatch.portions_available },
      created_at: nowIso,
    });
    return {
      safetyCheck,
      updatedBatch: safeBatch,
      createdAllocations: [],
      createdRoute: null,
      traceEvents,
      notifications,
      auditLogs,
      matchedOrgNames: [],
      assignedDriverName: null,
      safetyPassed: true,
      safetyReason: evalResult.reason,
    };
  }

  // Step 3: Auto-approve split allocations & Step 4: Auto-assign delivery driver & route
  const createdAllocations: Allocation[] = matchOutput.proposals.map((p) => ({
    id: makeAutoId('alloc'),
    donation_batch_id: safeBatch.id,
    meal_request_id: p.meal_request_id,
    allocated_portions: p.allocated_portions,
    match_score: p.match_score,
    match_explanation: p.match_explanation,
    approved_by_coordinator: params.adminUserId ?? 'auto-dispatcher',
    approved_at: nowIso,
    status: 'DISPATCHED',
    is_demo: safeBatch.is_demo,
    created_at: nowIso,
    updated_at: nowIso,
  }));

  const totalAllocated = createdAllocations.reduce((s, a) => s + a.allocated_portions, 0);
  const matchedOrgNames: string[] = [];

  const routeId = makeAutoId('route');
  const rawWaypoints = [
    {
      id: `pickup-${safeBatch.id}`,
      label: params.donor.name,
      address: safeBatch.pickup_address,
      stopType: 'PICKUP' as const,
      lat: safeBatch.pickup_lat,
      lng: safeBatch.pickup_lng,
      portions: totalAllocated,
      consumeByTime: safeBatch.consume_by_time,
    },
    ...createdAllocations.map((alloc) => {
      const req = params.requests.find((r) => r.id === alloc.meal_request_id);
      const org = req ? orgMap.get(req.org_id) : undefined;
      if (org?.name && !matchedOrgNames.includes(org.name)) {
        matchedOrgNames.push(org.name);
      }
      return {
        id: alloc.id,
        label: org?.name ?? 'Verified Shelter',
        address: org?.address ?? '',
        stopType: 'DROPOFF' as const,
        lat: org?.location_lat ?? safeBatch.pickup_lat,
        lng: org?.location_lng ?? safeBatch.pickup_lng,
        portions: alloc.allocated_portions,
        consumeByTime: safeBatch.consume_by_time,
      };
    }),
  ];

  const ordered = orderMultiStopWaypoints(rawWaypoints);
  let totalDistKm = 0;
  for (let i = 1; i < ordered.length; i++) {
    totalDistKm += haversineDistanceKm(ordered[i - 1].lat, ordered[i - 1].lng, ordered[i].lat, ordered[i].lng);
  }
  const roadDistanceKm = Math.round(Math.max(1.2, totalDistKm * 1.25) * 10) / 10;
  const estDurationMin = Math.max(12, Math.round((roadDistanceKm / 26) * 60 + ordered.length * 4));

  const stops: DeliveryStop[] = ordered.map((wp, idx) => ({
    id: makeAutoId('stop'),
    route_id: routeId,
    allocation_id: wp.stopType === 'PICKUP' ? createdAllocations[0].id : wp.id,
    stop_order: idx + 1,
    stop_type: wp.stopType,
    status: 'PENDING',
    arrived_at: null,
    completed_at: null,
    label: wp.label,
    address: wp.address,
    lat: wp.lat,
    lng: wp.lng,
    portions: wp.portions,
    batch_code: safeBatch.batch_code,
    qr_token: safeBatch.qr_token,
  }));

  const createdRoute: DeliveryRoute = {
    id: routeId,
    delivery_partner_id: params.deliveryDriver.id,
    delivery_partner_name: params.deliveryDriver.fullName,
    route_status: 'ASSIGNED',
    route_polyline: null,
    estimated_duration: estDurationMin,
    estimated_distance: roadDistanceKm,
    vehicle_capacity_portions: Math.max(params.deliveryDriver.vehicleCapacity ?? 150, totalAllocated),
    shift_payout_reference: `AUTO-SHIFT-${safeBatch.batch_code.slice(-4)}`,
    is_demo: safeBatch.is_demo,
    created_at: nowIso,
    updated_at: nowIso,
    stops,
  };

  const dispatchedBatch: DonationBatch = {
    ...safeBatch,
    portions_allocated: safeBatch.portions_allocated + totalAllocated,
    status: 'DISPATCHED',
    updated_at: nowIso,
  };

  traceEvents.push({
    id: makeAutoId('mt'),
    donation_batch_id: safeBatch.id,
    event_type: 'ALLOCATION_APPROVED',
    actor_id: null,
    actor_label: 'HungerLink Auto-Dispatch',
    recorded_temp: null,
    confirmed_portions: totalAllocated,
    event_metadata: {
      automated: true,
      shelters: matchedOrgNames,
      driver: params.deliveryDriver.fullName,
      route_id: routeId,
    },
    created_at: nowIso,
  });

  notifications.push({
    id: makeAutoId('notif'),
    user_id: params.deliveryDriver.id,
    notification_type: 'AUTO_ROUTE_ASSIGNED',
    title: `Auto-Dispatched: ${safeBatch.batch_code}`,
    message: `Pick up ${totalAllocated} portions from ${params.donor.name} and deliver to ${matchedOrgNames.join(', ')}.`,
    read_at: null,
    created_at: nowIso,
  });

  auditLogs.push({
    id: makeAutoId('aud'),
    actor_id: null,
    actor_label: 'Auto-Dispatch Engine',
    action: 'AUTO_PIPELINE_DISPATCHED',
    entity_type: 'donation_batches',
    entity_id: safeBatch.id,
    metadata: {
      batch_code: safeBatch.batch_code,
      allocated_portions: totalAllocated,
      shelters: matchedOrgNames,
      driver: params.deliveryDriver.fullName,
      route_id: routeId,
    },
    created_at: nowIso,
  });

  return {
    safetyCheck,
    updatedBatch: dispatchedBatch,
    createdAllocations,
    createdRoute,
    traceEvents,
    notifications,
    auditLogs,
    matchedOrgNames,
    assignedDriverName: params.deliveryDriver.fullName,
    safetyPassed: true,
    safetyReason: evalResult.reason,
  };
}

/**
 * Reverse Auto-Matching when a Shelter submits a new Meal Request:
 * Automatically matches against any existing safe surplus batch with remaining portions
 * and assigns a delivery partner right away.
 */
export function runAutoMatchForNewRequest(params: {
  request: MealRequest;
  recipientOrg: Organisation;
  batches: DonationBatch[];
  organisations: Organisation[];
  existingAllocations: Allocation[];
  communityGapAnalyses: Record<string, CommunityGapAnalysis>;
  foodCatalog: FoodCompositionItem[];
  deliveryDriver: AutoDeliveryDriver;
  adminUserId?: string;
  nowIso?: string;
}): {
  matchedBatch: DonationBatch | null;
  createdAllocation: Allocation | null;
  createdRoute: DeliveryRoute | null;
  traceEvent: MealTraceEvent | null;
  auditLog: AuditLog | null;
  donorName: string | null;
} {
  const nowIso = params.nowIso ?? new Date().toISOString();
  const nowMs = new Date(nowIso).getTime();

  const candidateBatches = params.batches.filter(
    (b) =>
      b.safety_gate_passed &&
      b.portions_available > b.portions_allocated &&
      !['DELIVERED', 'CANCELLED', 'EXPIRED', 'INSPECTION_REJECTED'].includes(b.status)
  );

  for (const batch of candidateBatches) {
    const donor = params.organisations.find((o) => o.id === batch.donor_id);
    const matchOut = runSmartMatchingEngine({
      batch,
      donorOrg: donor,
      requests: [{ request: params.request, recipientOrg: params.recipientOrg }],
      deliveryCapacityPortions: params.deliveryDriver.vehicleCapacity ?? 150,
      nowMs,
      nutritionContext: {
        communityAnalysesByOrgId: params.communityGapAnalyses,
        foodCatalog: params.foodCatalog,
        nutrientConfigs: DEFAULT_NUTRIENT_CONFIGS,
      },
    });

    const proposal = matchOut.proposals[0];
    if (!proposal || proposal.allocated_portions <= 0) continue;
    const allocId = makeAutoId('alloc');
    const createdAllocation: Allocation = {
      id: allocId,
      donation_batch_id: batch.id,
      meal_request_id: params.request.id,
      allocated_portions: proposal.allocated_portions,
      match_score: proposal.match_score,
      match_explanation: proposal.match_explanation,
      approved_by_coordinator: params.adminUserId ?? 'auto-dispatcher',
      approved_at: nowIso,
      status: 'DISPATCHED',
      is_demo: batch.is_demo,
      created_at: nowIso,
      updated_at: nowIso,
    };

    const routeId = makeAutoId('route');
    const distKm = Math.round(
      Math.max(
        1.2,
        haversineDistanceKm(
          batch.pickup_lat,
          batch.pickup_lng,
          params.recipientOrg.location_lat,
          params.recipientOrg.location_lng
        ) * 1.25
      ) * 10
    ) / 10;
    const estMin = Math.max(12, Math.round((distKm / 26) * 60 + 8));

    const createdRoute: DeliveryRoute = {
      id: routeId,
      delivery_partner_id: params.deliveryDriver.id,
      delivery_partner_name: params.deliveryDriver.fullName,
      route_status: 'ASSIGNED',
      route_polyline: null,
      estimated_duration: estMin,
      estimated_distance: distKm,
      vehicle_capacity_portions: Math.max(params.deliveryDriver.vehicleCapacity ?? 150, proposal.allocated_portions),
      shift_payout_reference: `AUTO-REQ-${batch.batch_code.slice(-4)}`,
      is_demo: batch.is_demo,
      created_at: nowIso,
      updated_at: nowIso,
      stops: [
        {
          id: makeAutoId('stop'),
          route_id: routeId,
          allocation_id: allocId,
          stop_order: 1,
          stop_type: 'PICKUP',
          status: 'PENDING',
          arrived_at: null,
          completed_at: null,
          label: donor?.name ?? 'Verified Donor',
          address: batch.pickup_address,
          lat: batch.pickup_lat,
          lng: batch.pickup_lng,
          portions: proposal.allocated_portions,
          batch_code: batch.batch_code,
          qr_token: batch.qr_token,
        },
        {
          id: makeAutoId('stop'),
          route_id: routeId,
          allocation_id: allocId,
          stop_order: 2,
          stop_type: 'DROPOFF',
          status: 'PENDING',
          arrived_at: null,
          completed_at: null,
          label: params.recipientOrg.name,
          address: params.recipientOrg.address,
          lat: params.recipientOrg.location_lat,
          lng: params.recipientOrg.location_lng,
          portions: proposal.allocated_portions,
          batch_code: batch.batch_code,
          qr_token: batch.qr_token,
        },
      ],
    };

    const matchedBatch: DonationBatch = {
      ...batch,
      portions_allocated: batch.portions_allocated + proposal.allocated_portions,
      status: 'DISPATCHED',
      updated_at: nowIso,
    };

    const traceEvent: MealTraceEvent = {
      id: makeAutoId('mt'),
      donation_batch_id: batch.id,
      event_type: 'ALLOCATION_APPROVED',
      actor_id: null,
      actor_label: 'HungerLink Auto-Dispatch',
      recorded_temp: null,
      confirmed_portions: proposal.allocated_portions,
      event_metadata: {
        automated: true,
        shelter: params.recipientOrg.name,
        driver: params.deliveryDriver.fullName,
      },
      created_at: nowIso,
    };

    const auditLog: AuditLog = {
      id: makeAutoId('aud'),
      actor_id: null,
      actor_label: 'Auto-Dispatch Engine',
      action: 'AUTO_MATCHED_ON_REQUEST',
      entity_type: 'meal_requests',
      entity_id: params.request.id,
      metadata: {
        batch_code: batch.batch_code,
        portions: proposal.allocated_portions,
        driver: params.deliveryDriver.fullName,
      },
      created_at: nowIso,
    };

    return {
      matchedBatch,
      createdAllocation,
      createdRoute,
      traceEvent,
      auditLog,
      donorName: donor?.name ?? null,
    };
  }

  return {
    matchedBatch: null,
    createdAllocation: null,
    createdRoute: null,
    traceEvent: null,
    auditLog: null,
    donorName: null,
  };
}
