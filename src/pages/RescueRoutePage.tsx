import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { AlertTriangle, CheckCircle2, Navigation, Route, Truck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { computeRescueRoute, type ComputedRouteResult, type RouteWaypoint } from '../lib/routingService';
import { supabaseConfigStatus } from '../lib/supabase';
import type { RouteStatus } from '../types/database';

export const RescueRoutePage: React.FC = () => {
  const {
    profile,
    organisations,
    batches,
    requests,
    allocations,
    routes,
    assignDeliveryRoute,
    updateRouteStatus,
  } = useApp();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [selectedAllocIds, setSelectedAllocIds] = useState<string[]>([]);
  const [vehicleCapacity, setVehicleCapacity] = useState('120');
  const [safetyBufferMin, setSafetyBufferMin] = useState(String(supabaseConfigStatus.safetyBufferMinutes));
  const [customOsrmUrl, setCustomOsrmUrl] = useState(supabaseConfigStatus.osrmBaseUrl ?? '');
  const [payoutRef, setPayoutRef] = useState(() => `SHIFT-${new Date().toISOString().slice(0, 10)}-01`);
  const [computed, setComputed] = useState<ComputedRouteResult | null>(null);
  const [computing, setComputing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const dispatchableAllocations = useMemo(
    () => allocations.filter((a) => a.status === 'APPROVED' || a.status === 'ACCEPTED'),
    [allocations]
  );

  // Initialize Leaflet map with OpenStreetMap tiles
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [13.005, 80.23],
      zoom: 12,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  // Sync markers and computed route polyline onto Leaflet layer
  useEffect(() => {
    const group = layerGroupRef.current;
    const map = mapInstanceRef.current;
    if (!group || !map) return;

    group.clearLayers();
    const boundsPoints: Array<[number, number]> = [];

    for (const org of organisations) {
      if (org.verification_status !== 'verified') continue;
      const isDonor = org.org_type === 'FOOD_DONOR';
      const marker = L.circleMarker([org.location_lat, org.location_lng], {
        radius: isDonor ? 9 : 8,
        fillColor: isDonor ? '#123B35' : '#FF795C',
        color: '#FFFFFF',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.95,
      });
      const popupEl = document.createElement('div');
      const titleEl = document.createElement('strong');
      titleEl.textContent = org.name;
      const typeEl = document.createElement('div');
      typeEl.textContent = org.org_type.replace(/_/g, ' ');
      const addrEl = document.createElement('div');
      addrEl.textContent = org.address;
      popupEl.append(titleEl, typeEl, addrEl);
      marker.bindPopup(popupEl);
      marker.addTo(group);
      boundsPoints.push([org.location_lat, org.location_lng]);
    }

    if (computed && computed.coordinates.length >= 2) {
      L.polyline(computed.coordinates, {
        color: '#123B35',
        weight: 4,
        opacity: 0.9,
        dashArray: computed.provider === 'GEODESIC_FALLBACK' ? '8, 6' : undefined,
      }).addTo(group);
      for (const coord of computed.coordinates) {
        boundsPoints.push(coord);
      }
    }

    if (boundsPoints.length >= 2) {
      map.fitBounds(L.latLngBounds(boundsPoints), { padding: [36, 36] });
    }
  }, [organisations, computed]);

  const toggleAlloc = (id: string) => {
    setSelectedAllocIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleComputeRoute = async () => {
    setErrorMsg(null);
    const chosen =
      selectedAllocIds.length > 0
        ? allocations.filter((a) => selectedAllocIds.includes(a.id))
        : dispatchableAllocations;

    if (chosen.length === 0) {
      setErrorMsg('Approve or accept at least one allocation before computing a rescue route.');
      return;
    }

    const firstBatch = batches.find((b) => b.id === chosen[0].donation_batch_id);
    if (!firstBatch) return;
    const donorOrg = organisations.find((o) => o.id === firstBatch.donor_id);

    const waypoints: RouteWaypoint[] = [
      {
        id: `pickup-${firstBatch.id}`,
        label: donorOrg?.name ?? 'Donor Pickup',
        address: firstBatch.pickup_address,
        stopType: 'PICKUP',
        lat: firstBatch.pickup_lat,
        lng: firstBatch.pickup_lng,
        portions: chosen.reduce((s, a) => s + a.allocated_portions, 0),
        consumeByTime: firstBatch.consume_by_time,
      },
      ...chosen.map((alloc) => {
        const req = requests.find((r) => r.id === alloc.meal_request_id);
        const org = organisations.find((o) => o.id === req?.org_id);
        return {
          id: `drop-${alloc.id}`,
          label: org?.name ?? 'Recipient Drop-off',
          address: org?.address ?? '',
          stopType: 'DROPOFF' as const,
          lat: org?.location_lat ?? 13.0,
          lng: org?.location_lng ?? 80.22,
          portions: alloc.allocated_portions,
          consumeByTime: firstBatch.consume_by_time,
        };
      }),
    ];

    setComputing(true);
    try {
      const routeResult = await computeRescueRoute({
        waypoints,
        vehicleCapacityPortions: Math.max(1, Number(vehicleCapacity) || 120),
        safetyBufferMinutes: Math.max(15, Number(safetyBufferMin) || 45),
        customOsrmBaseUrl: customOsrmUrl.trim() || undefined,
      });
      setComputed(routeResult);
      if (selectedAllocIds.length === 0) {
        setSelectedAllocIds(chosen.map((a) => a.id));
      }
    } finally {
      setComputing(false);
    }
  };

  const handleDispatch = async () => {
    if (!computed || !computed.feasible) {
      setErrorMsg('Resolve route feasibility issues (vehicle capacity or time buffer) before dispatch.');
      return;
    }
    const res = await assignDeliveryRoute({
      allocationIds: selectedAllocIds,
      deliveryPartnerId: 'demo-user-delivery',
      deliveryPartnerName: 'Senthil Kumar (Rescue Van #04)',
      estimatedDistance: computed.distanceKm,
      estimatedDuration: computed.durationMinutes,
      vehicleCapacity: Number(vehicleCapacity) || 120,
      shiftPayoutReference: payoutRef.trim() || 'SHIFT-ASSIGNED',
    });
    if (res.error) setErrorMsg(res.error);
    else {
      setSelectedAllocIds([]);
      setComputed(null);
    }
  };

  const isAdmin = profile?.role === 'ADMINISTRATOR';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold font-display text-[#123B35]">
          RescueRoute Logistics &amp; Live Map
        </h2>
        <p className="mt-1 text-sm text-[#64748B]">
          OpenStreetMap + Leaflet geospatial view with configurable OSRM routing, multi-stop
          ordering, vehicle capacity validation, and consume-by buffer checks.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-[#FF795C] bg-[#FF795C]/10 px-4 py-3 text-xs font-medium text-[#123B35]">
          {errorMsg}
        </div>
      )}

      {/* Map + Planner Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-7 rounded-2xl bg-white border border-[#123B35]/10 overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-[#123B35]/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-[#123B35]">OpenStreetMap Operational View</span>
            <span className="text-[#64748B]">
              Dark Green: Verified Donor · Coral: Verified NGO / Kitchen
            </span>
          </div>
          <div ref={mapContainerRef} className="w-full h-[420px]" aria-label="RescueRoute interactive map" />
        </div>

        {/* Route Builder & Feasibility Panel */}
        <section className="xl:col-span-5 rounded-2xl bg-white border border-[#123B35]/10 p-6 space-y-5">
          <div className="flex items-center gap-2 text-sm font-bold font-display text-[#123B35]">
            <Route className="w-4 h-4" />
            Multi-Stop Route Planner
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#123B35]">
              Approved Allocations Ready for Dispatch ({dispatchableAllocations.length})
            </div>
            {dispatchableAllocations.length === 0 ? (
              <p className="text-xs text-[#64748B]">
                No approved allocations waiting for dispatch. Approve proposed matches in Smart
                Matching first.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {dispatchableAllocations.map((alloc) => {
                  const req = requests.find((r) => r.id === alloc.meal_request_id);
                  const org = organisations.find((o) => o.id === req?.org_id);
                  const checked = selectedAllocIds.includes(alloc.id);
                  return (
                    <label
                      key={alloc.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[#123B35]/12 bg-[#FFF9EF]/40 px-3 py-2 text-xs cursor-pointer"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAlloc(alloc.id)}
                          className="accent-[#123B35]"
                        />
                        <span className="font-medium text-[#123B35] truncate">
                          {org?.name ?? 'Recipient'}
                        </span>
                      </span>
                      <span className="font-mono tabular-nums font-semibold text-[#123B35] shrink-0">
                        {alloc.allocated_portions} portions
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="rr-cap" className="block text-xs font-semibold text-[#123B35] mb-1">
                Vehicle Capacity (portions)
              </label>
              <input
                id="rr-cap"
                type="number"
                min={10}
                value={vehicleCapacity}
                onChange={(e) => setVehicleCapacity(e.target.value)}
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-xs font-mono tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="rr-buf" className="block text-xs font-semibold text-[#123B35] mb-1">
                Safety Buffer (min)
              </label>
              <input
                id="rr-buf"
                type="number"
                min={15}
                value={safetyBufferMin}
                onChange={(e) => setSafetyBufferMin(e.target.value)}
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-xs font-mono tabular-nums"
              />
            </div>
          </div>

          <div>
            <label htmlFor="rr-osrm" className="block text-xs font-semibold text-[#123B35] mb-1">
              Configurable OSRM Base URL (Optional)
            </label>
            <input
              id="rr-osrm"
              type="url"
              value={customOsrmUrl}
              onChange={(e) => setCustomOsrmUrl(e.target.value)}
              placeholder="https://your-managed-osrm.org/route/v1/driving"
              className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-xs font-mono"
            />
          </div>

          <button
            type="button"
            disabled={computing || dispatchableAllocations.length === 0}
            onClick={() => void handleComputeRoute()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723] disabled:opacity-40"
          >
            <Navigation className="w-3.5 h-3.5" />
            {computing ? 'Computing Route...' : 'Compute Multi-Stop Route & Feasibility'}
          </button>

          {computed && (
            <div className="rounded-xl bg-[#FFF9EF] border border-[#123B35]/15 p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#123B35]">
                  Provider: {computed.provider === 'OSRM' ? 'Live OSRM' : 'Geodesic Fallback'}
                </span>
                <span
                  className={`font-bold inline-flex items-center gap-1 ${
                    computed.feasible ? 'text-[#16A34A]' : 'text-[#FF795C]'
                  }`}
                >
                  {computed.feasible ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Feasible
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" /> Blocked
                    </>
                  )}
                </span>
              </div>
              <p className="text-[#64748B] leading-relaxed">{computed.providerNotice}</p>

              <div className="grid grid-cols-3 gap-2 font-mono tabular-nums pt-1">
                <div>
                  <div className="text-[#64748B]">Distance</div>
                  <div className="font-bold text-[#123B35]">{computed.distanceKm} km</div>
                </div>
                <div>
                  <div className="text-[#64748B]">Est. ETA</div>
                  <div className="font-bold text-[#123B35]">{computed.durationMinutes} min</div>
                </div>
                <div>
                  <div className="text-[#64748B]">Load</div>
                  <div className="font-bold text-[#123B35]">{computed.totalPortions} port.</div>
                </div>
              </div>

              {computed.feasibilityIssues.length > 0 && (
                <ul className="list-disc pl-4 text-[#FF795C] font-medium">
                  {computed.feasibilityIssues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              )}

              <ol className="space-y-1 pt-2 border-t border-[#123B35]/10">
                {computed.orderedWaypoints.map((wp, idx) => (
                  <li key={wp.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">
                      <span className="font-mono font-bold">{idx + 1}.</span> [{wp.stopType}] {wp.label}
                    </span>
                    <span className="font-mono text-[#64748B] shrink-0">{wp.portions}p</span>
                  </li>
                ))}
              </ol>

              {isAdmin && computed.feasible && (
                <div className="pt-2 space-y-2">
                  <input
                    type="text"
                    value={payoutRef}
                    onChange={(e) => setPayoutRef(e.target.value)}
                    placeholder="Shift Payout Reference"
                    className="w-full rounded-lg border border-[#123B35]/20 bg-white px-2.5 py-1.5 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => void handleDispatch()}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#D7F36B] text-[#123B35] text-xs font-bold hover:bg-[#C8E655]"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    Dispatch Route to Delivery Partner
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Active & Completed Delivery Routes */}
      <section className="rounded-2xl bg-white border border-[#123B35]/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#123B35]/10">
          <h3 className="text-base font-bold font-display text-[#123B35]">
            Dispatched Delivery Shifts ({routes.length})
          </h3>
        </div>
        {routes.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#64748B]">
            No delivery routes dispatched yet. Compute a feasible multi-stop route above to dispatch.
          </div>
        ) : (
          <div className="divide-y divide-[#123B35]/8">
            {routes.map((route) => (
              <div key={route.id} className="p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-[#123B35]">
                      {route.delivery_partner_name ?? 'Assigned Delivery Partner'} ·{' '}
                      <span className="font-mono">{route.shift_payout_reference ?? route.id.slice(0, 8)}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-[#64748B] font-mono tabular-nums">
                      Status: <strong className="text-[#123B35]">{route.route_status}</strong> ·{' '}
                      {route.estimated_distance} km · ~{route.estimated_duration} min · Cap:{' '}
                      {route.vehicle_capacity_portions} portions
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {(['ACCEPTED', 'EN_ROUTE_PICKUP', 'PICKED_UP', 'EN_ROUTE_DROPOFF', 'COMPLETED'] as RouteStatus[]).map(
                      (nextStatus) => (
                        <button
                          key={nextStatus}
                          type="button"
                          disabled={route.route_status === nextStatus}
                          onClick={() => void updateRouteStatus(route.id, nextStatus)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                            route.route_status === nextStatus
                              ? 'bg-[#123B35] text-white border-[#123B35]'
                              : 'border-[#123B35]/20 text-[#123B35] hover:bg-[#FFF9EF]'
                          }`}
                        >
                          {nextStatus.replace(/_/g, ' ')}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {route.stops && route.stops.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {route.stops.map((stop) => (
                      <div
                        key={stop.id}
                        className="rounded-xl bg-[#FFF9EF] border border-[#123B35]/10 p-3.5 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-semibold text-[#123B35]">
                          <span>
                            Stop {stop.stop_order} · {stop.stop_type}
                          </span>
                          <span className="font-mono">{stop.status}</span>
                        </div>
                        <div className="font-medium text-[#123B35]">{stop.label ?? 'Stop Location'}</div>
                        <div className="text-[#64748B]">{stop.address}</div>
                        {stop.portions && (
                          <div className="font-mono text-[#123B35]">{stop.portions} portions</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
