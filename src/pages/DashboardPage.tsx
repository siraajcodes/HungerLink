import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock, PackagePlus, QrCode, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const DashboardPage: React.FC = () => {
  const {
    profile,
    activeOrganisation,
    organisations,
    batches,
    requests,
    allocations,
    routes,
    impactRecords,
    incidents,
    auditLogs,
    dataLoading,
    t,
  } = useApp();

  const role = profile?.role ?? 'FOOD_DONOR';

  const donorBatches =
    role === 'FOOD_DONOR' && activeOrganisation
      ? batches.filter((b) => b.donor_id === activeOrganisation.id)
      : batches;

  const orgRequests =
    (role === 'VERIFIED_NGO' || role === 'COMMUNITY_KITCHEN') && activeOrganisation
      ? requests.filter((r) => r.org_id === activeOrganisation.id)
      : requests;

  const orgAllocations =
    (role === 'VERIFIED_NGO' || role === 'COMMUNITY_KITCHEN') && activeOrganisation
      ? allocations.filter((a) => orgRequests.some((r) => r.id === a.meal_request_id))
      : allocations;

  const partnerRoutes =
    role === 'DELIVERY_PARTNER' && profile
      ? routes.filter((r) => r.delivery_partner_id === profile.id)
      : routes;

  const confirmedMealsDelivered = impactRecords.reduce((s, r) => s + r.portions_delivered, 0);

  // Build role-specific verified KPI strip (strictly computed from actual state/Supabase records)
  const kpis: Array<{ label: string; value: number | string; subtext: string }> = (() => {
    if (role === 'ADMINISTRATOR') {
      return [
        {
          label: 'Registered Organisations',
          value: organisations.length,
          subtext: `${organisations.filter((o) => o.verification_status === 'pending').length} pending verification`,
        },
        {
          label: 'Active Donations',
          value: batches.filter((b) => !['DELIVERED', 'CANCELLED', 'EXPIRED', 'INSPECTION_REJECTED'].includes(b.status)).length,
          subtext: `${batches.filter((b) => b.status === 'INSPECTION_REJECTED').length} rejected by safety gate`,
        },
        {
          label: 'Proposed Allocations',
          value: allocations.filter((a) => a.status === 'PROPOSED').length,
          subtext: `${requests.filter((r) => r.status === 'OPEN' || r.status === 'PARTIALLY_ALLOCATED').length} open requests`,
        },
        {
          label: 'Deliveries In Progress',
          value: routes.filter((r) => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(r.route_status)).length,
          subtext: `${incidents.filter((i) => i.status === 'OPEN' || i.status === 'INVESTIGATING').length} open incidents`,
        },
        {
          label: 'Confirmed Meals Delivered',
          value: confirmedMealsDelivered,
          subtext: 'Verified handover confirmations only',
        },
      ];
    }

    if (role === 'FOOD_DONOR') {
      const allocatedPortions = donorBatches.reduce((s, b) => s + b.portions_allocated, 0);
      return [
        {
          label: 'Active Donations',
          value: donorBatches.filter((b) => !['DELIVERED', 'CANCELLED', 'EXPIRED', 'INSPECTION_REJECTED'].includes(b.status)).length,
          subtext: `${donorBatches.filter((b) => b.status === 'PENDING_INSPECTION').length} awaiting inspection`,
        },
        {
          label: 'Allocated Portions',
          value: allocatedPortions,
          subtext: `of ${donorBatches.reduce((s, b) => s + b.portions_available, 0)} offered`,
        },
        {
          label: 'Completed Donations',
          value: donorBatches.filter((b) => b.status === 'DELIVERED').length,
          subtext: 'Full handover verified',
        },
        {
          label: 'Confirmed Meals Delivered',
          value: impactRecords
            .filter((ir) => donorBatches.some((b) => b.id === ir.donation_batch_id))
            .reduce((s, ir) => s + ir.portions_delivered, 0),
          subtext: 'Recorded in ImpactLedger',
        },
      ];
    }

    if (role === 'VERIFIED_NGO' || role === 'COMMUNITY_KITCHEN') {
      return [
        {
          label: 'Active Meal Requests',
          value: orgRequests.filter((r) => r.status === 'OPEN' || r.status === 'PARTIALLY_ALLOCATED').length,
          subtext: `${activeOrganisation?.daily_capacity ?? 0} daily capacity`,
        },
        {
          label: 'Proposed / Approved Matches',
          value: orgAllocations.filter((a) => ['PROPOSED', 'APPROVED', 'ACCEPTED'].includes(a.status)).length,
          subtext: `${orgAllocations.reduce((s, a) => s + a.allocated_portions, 0)} portions allocated`,
        },
        {
          label: 'Incoming Deliveries',
          value: orgAllocations.filter((a) => a.status === 'DISPATCHED' || a.status === 'PICKED_UP').length,
          subtext: 'Track live in RescueRoute',
        },
        {
          label: 'Confirmed Received Portions',
          value: impactRecords
            .filter((ir) => !activeOrganisation || ir.organisation_id === activeOrganisation.id)
            .reduce((s, ir) => s + ir.portions_delivered, 0),
          subtext: 'Verified via MealTrace handover',
        },
      ];
    }

    if (role === 'DELIVERY_PARTNER') {
      const allStops = partnerRoutes.flatMap((r) => r.stops ?? []);
      return [
        {
          label: 'Assigned Routes',
          value: partnerRoutes.filter((r) => r.route_status !== 'COMPLETED' && r.route_status !== 'CANCELLED').length,
          subtext: 'Active rescue assignments',
        },
        {
          label: 'Pending Pickups',
          value: allStops.filter((s) => s.stop_type === 'PICKUP' && s.status !== 'COMPLETED').length,
          subtext: 'Scan QR on collection',
        },
        {
          label: 'Pending Drop-offs',
          value: allStops.filter((s) => s.stop_type === 'DROPOFF' && s.status !== 'COMPLETED').length,
          subtext: 'Handover to verified org',
        },
        {
          label: 'Completed Shifts',
          value: partnerRoutes.filter((r) => r.route_status === 'COMPLETED').length,
          subtext: 'Payout references recorded',
        },
      ];
    }

    // FIELD_WORKER
    const fieldRequests = requests.filter((r) => r.intake_channel.startsWith('FIELD_ASSISTED'));
    return [
      {
        label: 'Assisted Requests Logged',
        value: fieldRequests.length,
        subtext: 'Non-smartphone community intake',
      },
      {
        label: 'Open Assisted Requests',
        value: fieldRequests.filter((r) => r.status === 'OPEN' || r.status === 'PARTIALLY_ALLOCATED').length,
        subtext: 'Awaiting surplus match',
      },
      {
        label: 'Verified Partner Organisations',
        value: organisations.filter((o) => o.verification_status === 'verified' && o.org_type !== 'FOOD_DONOR').length,
        subtext: 'Eligible receiving partners',
      },
      {
        label: 'Confirmed Meals Delivered',
        value: confirmedMealsDelivered,
        subtext: 'Verified community impact',
      },
    ];
  })();

  if (dataLoading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-28 rounded-2xl bg-white border border-[#123B35]/10 animate-pulse" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-white border border-[#123B35]/10 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Summary + Primary Contextual Action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#64748B]">
            {t.roles[role]}
            {activeOrganisation ? ` · ${activeOrganisation.name}` : ''}
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold font-display text-[#123B35]">
            Operational Overview
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {role === 'FOOD_DONOR' && (
            <Link
              to="/donations"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#123B35] text-white text-sm font-semibold hover:bg-[#0B2723] transition-colors whitespace-nowrap"
            >
              <PackagePlus className="w-4 h-4" />
              New Food Donation
            </Link>
          )}
          {(role === 'VERIFIED_NGO' || role === 'COMMUNITY_KITCHEN') && (
            <Link
              to="/requests"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#123B35] text-white text-sm font-semibold hover:bg-[#0B2723] transition-colors whitespace-nowrap"
            >
              Submit Meal Request
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          {role === 'ADMINISTRATOR' && (
            <Link
              to="/matching"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#123B35] text-white text-sm font-semibold hover:bg-[#0B2723] transition-colors whitespace-nowrap"
            >
              Run Smart Matching
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          {role === 'DELIVERY_PARTNER' && (
            <Link
              to="/routes"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#123B35] text-white text-sm font-semibold hover:bg-[#0B2723] transition-colors whitespace-nowrap"
            >
              Open RescueRoute Map
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          {role === 'FIELD_WORKER' && (
            <Link
              to="/field-intake"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#123B35] text-white text-sm font-semibold hover:bg-[#0B2723] transition-colors whitespace-nowrap"
            >
              Log Assisted Request
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Verification Gate Notice for Non-Verified Organisations */}
      {activeOrganisation && activeOrganisation.verification_status !== 'verified' && role !== 'ADMINISTRATOR' && (
        <div className="rounded-2xl bg-white border border-[#FF795C] p-5 flex items-start gap-3.5">
          <ShieldAlert className="w-5 h-5 text-[#FF795C] shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-[#123B35]">
              Organisation Verification Status: {activeOrganisation.verification_status}
            </h3>
            <p className="mt-1 text-xs text-[#64748B] leading-relaxed">
              Only verified organisations may participate in live surplus food allocation. An
              administrator must review your submitted credentials before donations or requests become match-eligible.
            </p>
          </div>
        </div>
      )}

      {/* KPI Strip — Flat Single Elevation, Strict Tabular Figures */}
      <section aria-label="Verified operational metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl bg-white border border-[#123B35]/10 p-5 flex flex-col justify-between"
          >
            <div className="text-xs font-medium text-[#64748B]">{kpi.label}</div>
            <div className="mt-3 text-3xl font-extrabold font-display tabular-nums text-[#123B35]">
              {kpi.value}
            </div>
            <div className="mt-2 text-xs text-[#64748B]">{kpi.subtext}</div>
          </div>
        ))}
      </section>

      {/* Primary Operational Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Active Batches or Assigned Tasks */}
        <section className="xl:col-span-8 rounded-2xl bg-white border border-[#123B35]/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-[#123B35]/10 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold font-display text-[#123B35]">
                {role === 'DELIVERY_PARTNER' ? 'Assigned Delivery Routes' : 'Active Surplus Batches'}
              </h3>
              <p className="text-xs text-[#64748B]">
                Live status, safety inspection state, and split-batch allocation balance.
              </p>
            </div>
            <Link
              to={role === 'DELIVERY_PARTNER' ? '/routes' : '/donations'}
              className="text-xs font-semibold text-[#123B35] hover:underline whitespace-nowrap"
            >
              View all
            </Link>
          </div>

          {role === 'DELIVERY_PARTNER' ? (
            partnerRoutes.length === 0 ? (
              <div className="p-10 text-center text-sm text-[#64748B]">
                No delivery routes are currently assigned to your account.
              </div>
            ) : (
              <div className="divide-y divide-[#123B35]/8">
                {partnerRoutes.map((route) => (
                  <div key={route.id} className="px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-[#123B35] font-mono">
                        {route.shift_payout_reference || route.id.slice(0, 8)}
                      </div>
                      <div className="mt-1 text-xs text-[#64748B]">
                        {route.route_status} · {route.estimated_distance} km · ~{route.estimated_duration} min ·{' '}
                        {route.stops?.length ?? 0} stops
                      </div>
                    </div>
                    <Link
                      to="/routes"
                      className="px-3 py-1.5 rounded-lg bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723]"
                    >
                      Open Route
                    </Link>
                  </div>
                ))}
              </div>
            )
          ) : donorBatches.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-[#64748B]">{t.common.noRecords}</p>
              <Link
                to="/donations"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#123B35] text-white text-xs font-semibold"
              >
                Submit First Donation
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#123B35]/10 text-xs font-semibold text-[#64748B] bg-[#FFF9EF]/60">
                    <th className="py-3 px-6">Batch</th>
                    <th className="py-3 px-4">Food Item</th>
                    <th className="py-3 px-4 text-right">Portions</th>
                    <th className="py-3 px-4">Safety Gate</th>
                    <th className="py-3 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#123B35]/8 text-sm">
                  {donorBatches.slice(0, 8).map((batch) => {
                    const donor = organisations.find((o) => o.id === batch.donor_id);
                    const remaining = batch.portions_available - batch.portions_allocated;
                    return (
                      <tr key={batch.id} className="hover:bg-[#FFF9EF]/50 transition-colors">
                        <td className="py-3.5 px-6 font-mono text-xs font-semibold text-[#123B35] whitespace-nowrap">
                          {batch.batch_code}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[#123B35]">{batch.food_item}</div>
                          <div className="text-xs text-[#64748B]">
                            {donor?.name ?? 'Verified Donor'} · {batch.dietary_type}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs">
                          <div className="font-semibold text-[#123B35]">
                            {batch.portions_allocated}/{batch.portions_available}
                          </div>
                          <div className="text-[#64748B]">{remaining} unallocated</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          {batch.safety_gate_passed ? (
                            <span className="inline-flex items-center gap-1.5 text-[#123B35] font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                              Passed ({batch.temp_celsius ?? '—'}°C)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[#64748B]">
                              <Clock className="w-3.5 h-3.5 text-[#D97706]" />
                              {batch.status === 'INSPECTION_REJECTED' ? 'Rejected' : 'Pending'}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 text-xs font-medium text-[#123B35] whitespace-nowrap">
                          {batch.status.replace(/_/g, ' ')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Right: Quick Workflow Pipeline & Recent Audit Activity */}
        <section className="xl:col-span-4 space-y-6">
          <div className="rounded-2xl bg-[#123B35] text-white p-6">
            <h3 className="text-base font-bold font-display text-white">
              End-to-End Rescue Workflow
            </h3>
            <p className="mt-1 text-xs text-white/75">
              Every surplus batch passes strict verification, matching, and QR chain-of-custody milestones.
            </p>
            <ol className="mt-4 space-y-2.5 text-xs text-white/90">
              <li className="flex items-center justify-between gap-2 py-1.5 border-b border-white/10">
                <span>1. Physical Food Safety Inspection</span>
                <Link to="/safety" className="text-[#D7F36B] font-semibold hover:underline">
                  Inspect
                </Link>
              </li>
              <li className="flex items-center justify-between gap-2 py-1.5 border-b border-white/10">
                <span>2. Smart Matching (0.35L+0.30U+0.20Q+0.15T)</span>
                <Link to="/matching" className="text-[#D7F36B] font-semibold hover:underline">
                  Match
                </Link>
              </li>
              <li className="flex items-center justify-between gap-2 py-1.5 border-b border-white/10">
                <span>3. RescueRoute Dispatch &amp; OSRM ETA</span>
                <Link to="/routes" className="text-[#D7F36B] font-semibold hover:underline">
                  Dispatch
                </Link>
              </li>
              <li className="flex items-center justify-between gap-2 py-1.5">
                <span>4. MealTrace QR Handover &amp; ImpactLedger</span>
                <Link to="/mealtrace" className="text-[#D7F36B] font-semibold hover:underline inline-flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5" />
                  Scan
                </Link>
              </li>
            </ol>
          </div>

          <div className="rounded-2xl bg-white border border-[#123B35]/10 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-display text-[#123B35]">Recent Audit Trail</h3>
              {role === 'ADMINISTRATOR' && (
                <Link to="/admin" className="text-xs font-semibold text-[#123B35] hover:underline">
                  Audit log
                </Link>
              )}
            </div>
            {auditLogs.length === 0 ? (
              <p className="mt-4 text-xs text-[#64748B]">No audit events recorded yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-[#123B35]/8">
                {auditLogs.slice(0, 5).map((log) => (
                  <li key={log.id} className="py-2.5">
                    <div className="text-xs font-semibold text-[#123B35]">
                      {log.action.replace(/_/g, ' ')}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#64748B] font-mono tabular-nums">
                      {log.entity_type} · {new Date(log.created_at).toLocaleTimeString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
