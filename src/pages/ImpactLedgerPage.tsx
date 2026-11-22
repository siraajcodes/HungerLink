import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { buildCsvDocument } from '../lib/matchingEngine';

export const ImpactLedgerPage: React.FC = () => {
  const {
    batches,
    organisations,
    impactRecords,
    routes,
    mealtraceEvents,
    isDemoMode,
    t,
  } = useApp();

  const [orgFilter, setOrgFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      if (orgFilter !== 'ALL' && b.donor_id !== orgFilter) return false;
      const ts = new Date(b.created_at).getTime();
      if (dateFrom && ts < new Date(dateFrom).getTime()) return false;
      if (dateTo && ts > new Date(`${dateTo}T23:59:59`).getTime()) return false;
      return true;
    });
  }, [batches, orgFilter, dateFrom, dateTo]);

  const filteredImpact = useMemo(() => {
    const batchIds = new Set(filteredBatches.map((b) => b.id));
    return impactRecords.filter((ir) => {
      if (orgFilter !== 'ALL' && ir.organisation_id !== orgFilter && !batchIds.has(ir.donation_batch_id)) {
        return false;
      }
      const ts = new Date(ir.confirmed_at).getTime();
      if (dateFrom && ts < new Date(dateFrom).getTime()) return false;
      if (dateTo && ts > new Date(`${dateTo}T23:59:59`).getTime()) return false;
      return true;
    });
  }, [impactRecords, filteredBatches, orgFilter, dateFrom, dateTo]);

  const metrics = useMemo(() => {
    const offered = filteredBatches.reduce((s, b) => s + b.portions_available, 0);
    const allocated = filteredBatches.reduce((s, b) => s + b.portions_allocated, 0);
    const delivered = filteredImpact.reduce((s, ir) => s + ir.portions_delivered, 0);
    const rejected = filteredBatches
      .filter((b) => b.status === 'INSPECTION_REJECTED')
      .reduce((s, b) => s + b.portions_available, 0);
    const unallocated = filteredBatches.reduce(
      (s, b) => s + Math.max(0, b.portions_available - b.portions_allocated),
      0
    );

    const completionRate = allocated > 0 ? Math.round((delivered / allocated) * 1000) / 10 : 0;

    // Calculate average pickup time from MealTrace SUBMITTED -> PICKUP_SCANNED events
    const pickupDurations: number[] = [];
    for (const batch of filteredBatches) {
      const pickupEv = mealtraceEvents.find(
        (e) => e.donation_batch_id === batch.id && e.event_type === 'PICKUP_SCANNED'
      );
      if (pickupEv) {
        const diffMin = Math.max(
          1,
          Math.round(
            (new Date(pickupEv.created_at).getTime() - new Date(batch.created_at).getTime()) / 60_000
          )
        );
        pickupDurations.push(diffMin);
      }
    }
    const avgPickupMinutes =
      pickupDurations.length > 0
        ? Math.round(pickupDurations.reduce((a, b) => a + b, 0) / pickupDurations.length)
        : null;

    // Repeat donors (>= 2 non-cancelled batches)
    const donorCounts = new Map<string, number>();
    for (const b of filteredBatches) {
      if (b.status !== 'CANCELLED') {
        donorCounts.set(b.donor_id, (donorCounts.get(b.donor_id) ?? 0) + 1);
      }
    }
    const repeatDonors = Array.from(donorCounts.values()).filter((c) => c >= 2).length;
    const recipientOrgsServed = new Set(filteredImpact.map((ir) => ir.organisation_id)).size;
    const completedShifts = routes.filter((r) => r.route_status === 'COMPLETED').length;

    return {
      offered,
      allocated,
      delivered,
      rejected,
      unallocated,
      completionRate,
      avgPickupMinutes,
      repeatDonors,
      recipientOrgsServed,
      completedShifts,
    };
  }, [filteredBatches, filteredImpact, mealtraceEvents, routes]);

  const chartData = [
    { stage: 'Offered', portions: metrics.offered, color: '#123B35' },
    { stage: 'Allocated', portions: metrics.allocated, color: '#1E544C' },
    { stage: 'Delivered', portions: metrics.delivered, color: '#6FA32C' },
    { stage: 'Unallocated', portions: metrics.unallocated, color: '#64748B' },
    { stage: 'Rejected', portions: metrics.rejected, color: '#FF795C' },
  ];

  const handleExportCsv = () => {
    const csv = buildCsvDocument(
      ['Impact Record ID', 'Batch Code', 'Recipient Organisation', 'Portions Delivered', 'Distribution Area', 'Confirmed At', 'Scope'],
      filteredImpact.map((ir) => {
        const batch = batches.find((b) => b.id === ir.donation_batch_id);
        const org = organisations.find((o) => o.id === ir.organisation_id);
        return [
          ir.id,
          batch?.batch_code ?? ir.donation_batch_id,
          org?.name ?? ir.organisation_id,
          ir.portions_delivered,
          ir.distribution_area,
          ir.confirmed_at,
          ir.is_demo ? 'DEMO' : 'LIVE',
        ];
      })
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hungerlink-impactledger-${isDemoMode ? 'demo-' : ''}${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold font-display text-[#123B35]">{t.impact.title}</h2>
          <p className="mt-1 text-sm text-[#64748B]">
            Verified surplus food rescue analytics computed strictly from confirmed records.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723]"
        >
          <Download className="w-4 h-4" />
          {t.common.exportCsv}
        </button>
      </div>

      {/* Strict Quantity Distinction Notice */}
      <div className="rounded-2xl bg-white border border-[#123B35]/15 p-4 flex items-start gap-3 text-xs text-[#64748B]">
        <Info className="w-4 h-4 text-[#123B35] shrink-0 mt-0.5" />
        <span>{t.impact.distinctionNotice}</span>
      </div>

      {/* Date & Organisation Filters */}
      <div className="rounded-2xl bg-white border border-[#123B35]/10 p-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="md:col-span-2">
          <label htmlFor="il-org" className="block text-xs font-semibold text-[#123B35] mb-1">
            Filter by Organisation
          </label>
          <select
            id="il-org"
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-xs"
          >
            <option value="ALL">All Organisations ({organisations.length})</option>
            {organisations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({o.org_type})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="il-from" className="block text-xs font-semibold text-[#123B35] mb-1">
            From Date
          </label>
          <input
            id="il-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-xs font-mono"
          />
        </div>

        <div>
          <label htmlFor="il-to" className="block text-xs font-semibold text-[#123B35] mb-1">
            To Date
          </label>
          <input
            id="il-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-xs font-mono"
          />
        </div>
      </div>

      {/* Primary Verified Metrics Grid */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: t.impact.offered, value: metrics.offered },
          { label: t.impact.allocated, value: metrics.allocated },
          { label: t.impact.delivered, value: metrics.delivered },
          { label: t.impact.unallocated, value: metrics.unallocated },
          { label: t.impact.rejected, value: metrics.rejected },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl bg-white border border-[#123B35]/10 p-5">
            <div className="text-xs font-medium text-[#64748B]">{item.label}</div>
            <div className="mt-2 text-3xl font-extrabold font-display tabular-nums text-[#123B35]">
              {item.value}
            </div>
            <div className="mt-1 text-[11px] text-[#64748B]">{t.common.portions}</div>
          </div>
        ))}
      </section>

      {/* Secondary Performance Metrics */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-2xl bg-white border border-[#123B35]/10 p-4">
          <div className="text-xs text-[#64748B]">{t.impact.completionRate}</div>
          <div className="mt-1.5 text-xl font-bold font-mono tabular-nums text-[#123B35]">
            {metrics.completionRate}%
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-[#123B35]/10 p-4">
          <div className="text-xs text-[#64748B]">{t.impact.avgPickupTime}</div>
          <div className="mt-1.5 text-xl font-bold font-mono tabular-nums text-[#123B35]">
            {metrics.avgPickupMinutes !== null ? `${metrics.avgPickupMinutes} min` : 'No scans'}
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-[#123B35]/10 p-4">
          <div className="text-xs text-[#64748B]">{t.impact.repeatDonors}</div>
          <div className="mt-1.5 text-xl font-bold font-mono tabular-nums text-[#123B35]">
            {metrics.repeatDonors}
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-[#123B35]/10 p-4">
          <div className="text-xs text-[#64748B]">{t.impact.orgsServed}</div>
          <div className="mt-1.5 text-xl font-bold font-mono tabular-nums text-[#123B35]">
            {metrics.recipientOrgsServed}
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-[#123B35]/10 p-4">
          <div className="text-xs text-[#64748B]">{t.impact.shiftsCompleted}</div>
          <div className="mt-1.5 text-xl font-bold font-mono tabular-nums text-[#123B35]">
            {metrics.completedShifts}
          </div>
        </div>
      </section>

      {/* Portion Funnel Chart */}
      <section className="rounded-2xl bg-white border border-[#123B35]/10 p-6">
        <h3 className="text-base font-bold font-display text-[#123B35]">
          Surplus Portion Accounting Breakdown
        </h3>
        <p className="mt-0.5 text-xs text-[#64748B]">
          Comparison of offered, allocated, confirmed delivered, unallocated, and safety-rejected portions.
        </p>

        <div className="mt-6 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="stage" tick={{ fontSize: 12, fill: '#123B35' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748B' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(18,59,53,0.15)',
                  borderRadius: '10px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="portions" radius={[8, 8, 0, 0]} maxBarSize={64}>
                {chartData.map((entry) => (
                  <Cell key={entry.stage} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Confirmed Handover Ledger */}
      <section className="rounded-2xl bg-white border border-[#123B35]/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#123B35]/10">
          <h3 className="text-base font-bold font-display text-[#123B35]">
            Confirmed Impact Records ({filteredImpact.length})
          </h3>
        </div>
        {filteredImpact.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#64748B]">
            No confirmed deliveries recorded yet. Complete a MealTrace handover confirmation to
            record verified impact.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#123B35]/10 bg-[#FFF9EF]/60 text-xs font-semibold text-[#64748B]">
                  <th className="py-3 px-6">Batch</th>
                  <th className="py-3 px-4">Receiving Organisation</th>
                  <th className="py-3 px-4">Distribution Area</th>
                  <th className="py-3 px-4 text-right">Confirmed Portions</th>
                  <th className="py-3 px-6 text-right">Confirmed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#123B35]/8 text-sm">
                {filteredImpact.map((ir) => {
                  const batch = batches.find((b) => b.id === ir.donation_batch_id);
                  const org = organisations.find((o) => o.id === ir.organisation_id);
                  return (
                    <tr key={ir.id}>
                      <td className="py-3.5 px-6 font-mono text-xs font-semibold text-[#123B35]">
                        {batch?.batch_code ?? ir.donation_batch_id.slice(0, 8)}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#123B35]">
                        {org?.name ?? ir.organisation_id}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#64748B]">{ir.distribution_area}</td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-[#123B35]">
                        {ir.portions_delivered}
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono tabular-nums text-xs text-[#64748B]">
                        {new Date(ir.confirmed_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
