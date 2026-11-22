import { haversineDistanceKm } from './matchingEngine';
import { supabaseConfigStatus } from './supabase';

export interface RouteWaypoint {
  id: string;
  label: string;
  address: string;
  stopType: 'PICKUP' | 'DROPOFF';
  lat: number;
  lng: number;
  portions: number;
  consumeByTime?: string;
}

export interface ComputedRouteResult {
  provider: 'OSRM' | 'GEODESIC_FALLBACK';
  providerNotice: string;
  coordinates: Array<[number, number]>; // [lat, lng] pairs for Leaflet Polyline
  distanceKm: number;
  durationMinutes: number;
  orderedWaypoints: RouteWaypoint[];
  feasible: boolean;
  feasibilityIssues: string[];
  totalPortions: number;
}

/**
 * Orders multi-stop routes so PICKUP precedes DROPOFFs, and drop-offs are ordered
 * by nearest-neighbor greedy path from pickup for reduced transit duration.
 */
export function orderMultiStopWaypoints(waypoints: RouteWaypoint[]): RouteWaypoint[] {
  const pickups = waypoints.filter((w) => w.stopType === 'PICKUP');
  const dropoffs = waypoints.filter((w) => w.stopType === 'DROPOFF');

  if (pickups.length === 0) return [...dropoffs];

  const ordered: RouteWaypoint[] = [...pickups];
  const remaining = [...dropoffs];
  let current = ordered[ordered.length - 1];

  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineDistanceKm(current.lat, current.lng, remaining[i].lat, remaining[i].lng);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const next = remaining.splice(bestIdx, 1)[0];
    ordered.push(next);
    current = next;
  }

  return ordered;
}

/**
 * Computes road route via configurable OSRM provider (VITE_OSRM_BASE_URL).
 * Never hardcodes a demo server as a guaranteed production SLA; gracefully falls back
 * to road-adjusted geodesic estimation if OSRM is unconfigured or unreachable.
 */
export async function computeRescueRoute(params: {
  waypoints: RouteWaypoint[];
  vehicleCapacityPortions: number;
  safetyBufferMinutes?: number;
  nowMs?: number;
  customOsrmBaseUrl?: string;
}): Promise<ComputedRouteResult> {
  const nowMs = params.nowMs ?? Date.now();
  const safetyBufferMinutes =
    params.safetyBufferMinutes ?? supabaseConfigStatus.safetyBufferMinutes;
  const ordered = orderMultiStopWaypoints(params.waypoints);

  const totalDropoffPortions = ordered
    .filter((w) => w.stopType === 'DROPOFF')
    .reduce((sum, w) => sum + w.portions, 0);

  const feasibilityIssues: string[] = [];
  if (totalDropoffPortions > params.vehicleCapacityPortions) {
    feasibilityIssues.push(
      `Total assigned load (${totalDropoffPortions} portions) exceeds vehicle capacity (${params.vehicleCapacityPortions} portions).`
    );
  }

  const osrmBase = params.customOsrmBaseUrl?.trim() || supabaseConfigStatus.osrmBaseUrl;
  let provider: 'OSRM' | 'GEODESIC_FALLBACK' = 'GEODESIC_FALLBACK';
  let providerNotice = osrmBase
    ? `Routing via configured OSRM endpoint (${osrmBase}).`
    : 'VITE_OSRM_BASE_URL is not configured; using road-adjusted geodesic estimation (1.28x Haversine) until a managed OSRM service is connected.';
  let coordinates: Array<[number, number]> = ordered.map((w) => [w.lat, w.lng]);
  let distanceKm = 0;
  let durationMinutes = 0;

  // Attempt live OSRM road routing if configured and at least 2 points exist
  if (osrmBase && ordered.length >= 2) {
    try {
      const coordString = ordered.map((w) => `${w.lng},${w.lat}`).join(';');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(
        `${osrmBase.replace(/\/+$/, '')}/${coordString}?overview=full&geometries=geojson`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        const route = json?.routes?.[0];
        if (route?.geometry?.coordinates?.length) {
          provider = 'OSRM';
          providerNotice = 'Live road geometry and ETA computed via configured OSRM routing server.';
          coordinates = route.geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng]
          );
          distanceKm = Math.round((route.distance / 1000) * 100) / 100;
          durationMinutes = Math.max(5, Math.round(route.duration / 60) + ordered.length * 6);
        } else {
          providerNotice = 'OSRM responded without a valid route geometry; falling back to geodesic road estimate.';
        }
      } else {
        providerNotice = `Configured OSRM server returned HTTP ${response.status}; using geodesic road estimate.`;
      }
    } catch {
      providerNotice =
        'Configured OSRM routing server is currently unreachable; using graceful geodesic road estimation.';
    }
  }

  // Fallback geodesic road-adjusted calculation
  if (provider === 'GEODESIC_FALLBACK' && ordered.length >= 2) {
    let rawKm = 0;
    for (let i = 0; i < ordered.length - 1; i++) {
      rawKm += haversineDistanceKm(
        ordered[i].lat,
        ordered[i].lng,
        ordered[i + 1].lat,
        ordered[i + 1].lng
      );
    }
    distanceKm = Math.round(rawKm * 1.28 * 100) / 100;
    durationMinutes = Math.max(8, Math.round((distanceKm / 24) * 60) + ordered.length * 6);
  }

  // Check consume-by safety buffer across all waypoints
  const earliestConsumeBy = ordered
    .map((w) => (w.consumeByTime ? new Date(w.consumeByTime).getTime() : Infinity))
    .reduce((min, v) => Math.min(min, v), Infinity);

  if (Number.isFinite(earliestConsumeBy)) {
    const projectedCompletionMs = nowMs + durationMinutes * 60_000;
    const safeCutoffMs = earliestConsumeBy - safetyBufferMinutes * 60_000;
    if (projectedCompletionMs > safeCutoffMs) {
      feasibilityIssues.push(
        `Route ETA (${durationMinutes} min) exceeds consume-by safety buffer (${safetyBufferMinutes} min).`
      );
    }
  }

  return {
    provider,
    providerNotice,
    coordinates,
    distanceKm,
    durationMinutes,
    orderedWaypoints: ordered,
    feasible: feasibilityIssues.length === 0,
    feasibilityIssues,
    totalPortions: totalDropoffPortions,
  };
}
