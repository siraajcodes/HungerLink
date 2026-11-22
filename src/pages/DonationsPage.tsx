import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Edit3, PackagePlus, QrCode, XCircle } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useApp } from '../context/AppContext';
import { buildCsvDocument } from '../lib/matchingEngine';
import type { DietaryType, DonationBatch } from '../types/database';

function toLocalDateTimeInput(offsetMinutes: number): string {
  const dt = new Date(Date.now() + offsetMinutes * 60_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(
    dt.getMinutes()
  )}`;
}

export const DonationsPage: React.FC = () => {
  const {
    profile,
    activeOrganisation,
    organisations,
    batches,
    allocations,
    createDonationBatch,
    updateDonationBatch,
    cancelDonationBatch,
    t,
  } = useApp();

  const verifiedDonors = organisations.filter(
    (o) => o.org_type === 'FOOD_DONOR' && o.verification_status === 'verified'
  );

  const defaultDonorId =
    activeOrganisation?.org_type === 'FOOD_DONOR'
      ? activeOrganisation.id
      : verifiedDonors[0]?.id ?? '';

  const [showForm, setShowForm] = useState(false);
  const [donorId, setDonorId] = useState(defaultDonorId);
  const [foodItem, setFoodItem] = useState('');
  const [foodCategory, setFoodCategory] = useState('COOKED_MEALS');
  const [dietaryType, setDietaryType] = useState<DietaryType>('VEGETARIAN');
  const [portionsAvailable, setPortionsAvailable] = useState('50');
  const [prepTime, setPrepTime] = useState(() => toLocalDateTimeInput(-30));
  const [pickupDeadline, setPickupDeadline] = useState(() => toLocalDateTimeInput(120));
  const [consumeByTime, setConsumeByTime] = useState(() => toLocalDateTimeInput(240));
  const [tempCelsius, setTempCelsius] = useState('64.0');
  const [packagingDetails, setPackagingDetails] = useState(
    'Food-grade insulated stainless steel containers, tamper-sealed'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Edit & Cancel states
  const [editingBatch, setEditingBatch] = useState<DonationBatch | null>(null);
  const [editFoodItem, setEditFoodItem] = useState('');
  const [editPortions, setEditPortions] = useState('');
  const [cancellingBatch, setCancellingBatch] = useState<DonationBatch | null>(null);

  const visibleBatches = useMemo(() => {
    const scoped =
      profile?.role === 'FOOD_DONOR' && activeOrganisation
        ? batches.filter((b) => b.donor_id === activeOrganisation.id)
        : batches;

    return scoped.filter((b) => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          b.batch_code.toLowerCase().includes(q) ||
          b.food_item.toLowerCase().includes(q) ||
          b.dietary_type.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [batches, profile, activeOrganisation, statusFilter, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const chosenDonor = organisations.find((o) => o.id === (donorId || defaultDonorId));
    if (!chosenDonor) {
      setErrorMsg('Select a verified donor organisation before submitting.');
      return;
    }

    const prepIso = new Date(prepTime).toISOString();
    const pickupIso = new Date(pickupDeadline).toISOString();
    const consumeIso = new Date(consumeByTime).toISOString();

    if (new Date(consumeIso) <= new Date(prepIso)) {
      setErrorMsg('Consume-by time must be after preparation time.');
      return;
    }
    if (new Date(pickupIso) > new Date(consumeIso)) {
      setErrorMsg('Pickup deadline cannot be later than consume-by time.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createDonationBatch({
        donor_id: chosenDonor.id,
        food_item: foodItem.trim(),
        food_category: foodCategory,
        dietary_type: dietaryType,
        portions_available: Number(portionsAvailable),
        prep_time: prepIso,
        pickup_deadline: pickupIso,
        consume_by_time: consumeIso,
        temp_celsius: tempCelsius.trim() ? Number(tempCelsius) : null,
        packaging_details: packagingDetails.trim(),
        pickup_address: chosenDonor.address,
        pickup_lat: chosenDonor.location_lat,
        pickup_lng: chosenDonor.location_lng,
      });
      if (res.error) setErrorMsg(res.error);
      else {
        setFoodItem('');
        setShowForm(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;
    const res = await updateDonationBatch(editingBatch.id, {
      food_item: editFoodItem.trim(),
      portions_available: Number(editPortions),
    });
    if (res.error) setErrorMsg(res.error);
    else setEditingBatch(null);
  };

  const exportCsv = () => {
    const csv = buildCsvDocument(
      [
        'Batch Code',
        'Food Item',
        'Dietary Type',
        'Portions Available',
        'Portions Allocated',
        'Temp (C)',
        'Safety Gate',
        'Status',
        'Consume By',
      ],
      visibleBatches.map((b) => [
        b.batch_code,
        b.food_item,
        b.dietary_type,
        b.portions_available,
        b.portions_allocated,
        b.temp_celsius ?? '',
        b.safety_gate_passed ? 'PASSED' : 'NOT_PASSED',
        b.status,
        b.consume_by_time,
      ])
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hungerlink-donations-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold font-display text-[#123B35]">
            Surplus Food Donations
          </h2>
          <p className="mt-1 text-sm text-[#64748B]">
            Submit verified surplus batches, track safety gate clearance, inspect split allocations,
            and download donor handover reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#123B35]/20 bg-white text-xs font-semibold text-[#123B35] hover:bg-[#F7EFE0]"
          >
            <Download className="w-4 h-4" />
            {t.common.exportCsv}
          </button>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723]"
          >
            <PackagePlus className="w-4 h-4" />
            {showForm ? 'Close Form' : 'Submit Donation'}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-[#FF795C] bg-[#FF795C]/10 px-4 py-3 text-xs font-medium text-[#123B35]">
          {errorMsg}
        </div>
      )}

      {/* New Donation Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white border border-[#123B35]/15 p-6 space-y-5"
        >
          <h3 className="text-base font-bold font-display text-[#123B35]">
            Log Surplus Food Batch
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="don-org" className="block text-xs font-semibold text-[#123B35] mb-1">
                Verified Donor Organisation *
              </label>
              <select
                id="don-org"
                required
                value={donorId || defaultDonorId}
                onChange={(e) => setDonorId(e.target.value)}
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm"
              >
                {verifiedDonors.length === 0 && (
                  <option value="">No verified donor organisation available</option>
                )}
                {verifiedDonors.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="don-item" className="block text-xs font-semibold text-[#123B35] mb-1">
                Food Item Description *
              </label>
              <input
                id="don-item"
                type="text"
                required
                value={foodItem}
                onChange={(e) => setFoodItem(e.target.value)}
                placeholder="e.g. Vegetable Biryani, Raita & Boiled Dal"
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="don-diet" className="block text-xs font-semibold text-[#123B35] mb-1">
                Dietary Classification *
              </label>
              <select
                id="don-diet"
                value={dietaryType}
                onChange={(e) => setDietaryType(e.target.value as DietaryType)}
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm"
              >
                <option value="VEGETARIAN">Vegetarian</option>
                <option value="VEGAN">Vegan</option>
                <option value="JAIN">Jain</option>
                <option value="EGGETARIAN">Eggetarian</option>
                <option value="HALAL">Halal</option>
                <option value="NON_VEGETARIAN">Non-Vegetarian</option>
              </select>
            </div>

            <div>
              <label htmlFor="don-portions" className="block text-xs font-semibold text-[#123B35] mb-1">
                Available Portions *
              </label>
              <input
                id="don-portions"
                type="number"
                min={5}
                max={5000}
                required
                value={portionsAvailable}
                onChange={(e) => setPortionsAvailable(e.target.value)}
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm font-mono tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="don-temp" className="block text-xs font-semibold text-[#123B35] mb-1">
                Donor-Measured Temp (°C)
              </label>
              <input
                id="don-temp"
                type="number"
                step="0.1"
                value={tempCelsius}
                onChange={(e) => setTempCelsius(e.target.value)}
                placeholder="e.g. 64.5"
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm font-mono tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="don-prep" className="block text-xs font-semibold text-[#123B35] mb-1">
                Preparation Time *
              </label>
              <input
                id="don-prep"
                type="datetime-local"
                required
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm font-mono"
              />
            </div>

            <div>
              <label htmlFor="don-pickup" className="block text-xs font-semibold text-[#123B35] mb-1">
                Pickup Deadline *
              </label>
              <input
                id="don-pickup"
                type="datetime-local"
                required
                value={pickupDeadline}
                onChange={(e) => setPickupDeadline(e.target.value)}
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm font-mono"
              />
            </div>

            <div>
              <label htmlFor="don-consume" className="block text-xs font-semibold text-[#123B35] mb-1">
                Consume-By Time *
              </label>
              <input
                id="don-consume"
                type="datetime-local"
                required
                value={consumeByTime}
                onChange={(e) => setConsumeByTime(e.target.value)}
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm font-mono"
              />
            </div>

            <div>
              <label htmlFor="don-cat" className="block text-xs font-semibold text-[#123B35] mb-1">
                Food Category *
              </label>
              <select
                id="don-cat"
                value={foodCategory}
                onChange={(e) => setFoodCategory(e.target.value)}
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm"
              >
                <option value="COOKED_MEALS">Cooked Hot Meals</option>
                <option value="CHILLED_MEALS">Chilled Prepared Food</option>
                <option value="BAKERY_DRY">Bakery &amp; Dry Packaged</option>
                <option value="FRESH_PRODUCE">Fresh Produce</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="don-pack" className="block text-xs font-semibold text-[#123B35] mb-1">
                Packaging &amp; Seal Details *
              </label>
              <input
                id="don-pack"
                type="text"
                required
                value={packagingDetails}
                onChange={(e) => setPackagingDetails(e.target.value)}
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-[#64748B]">
              Submitted batches enter <span className="font-mono">PENDING_INSPECTION</span> until an
              authorised inspector records physical inspection clearance.
            </p>
            <button
              type="submit"
              disabled={submitting || verifiedDonors.length === 0}
              className="px-5 py-2.5 rounded-xl bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723] disabled:opacity-40"
            >
              {submitting ? 'Submitting...' : 'Submit Batch'}
            </button>
          </div>
        </form>
      )}

      {/* Search & Status Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.common.searchPlaceholder}
          className="sm:max-w-xs w-full rounded-xl border border-[#123B35]/15 bg-white px-3.5 py-2 text-sm"
        />
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-white border border-[#123B35]/10">
          {['ALL', 'PENDING_INSPECTION', 'INSPECTION_PASSED', 'ALLOCATED', 'DELIVERED', 'INSPECTION_REJECTED'].map(
            (st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-[#123B35] text-white'
                    : 'text-[#64748B] hover:text-[#123B35]'
                }`}
              >
                {st === 'ALL' ? 'All' : st.replace(/_/g, ' ')}
              </button>
            )
          )}
        </div>
      </div>

      {/* Inline Pre-Allocation Edit Modal */}
      {editingBatch && (
        <form
          onSubmit={handleEditSave}
          className="rounded-2xl bg-white border border-[#123B35] p-5 flex flex-wrap items-end gap-4"
        >
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-[#123B35] mb-1">
              Edit Food Item ({editingBatch.batch_code})
            </label>
            <input
              type="text"
              required
              value={editFoodItem}
              onChange={(e) => setEditFoodItem(e.target.value)}
              className="w-full rounded-xl border border-[#123B35]/20 px-3 py-2 text-sm"
            />
          </div>
          <div className="w-36">
            <label className="block text-xs font-semibold text-[#123B35] mb-1">Portions</label>
            <input
              type="number"
              min={5}
              required
              value={editPortions}
              onChange={(e) => setEditPortions(e.target.value)}
              className="w-full rounded-xl border border-[#123B35]/20 px-3 py-2 text-sm font-mono tabular-nums"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#123B35] text-white text-xs font-semibold"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditingBatch(null)}
              className="px-3 py-2 rounded-xl border border-[#123B35]/20 text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Donations Table */}
      <div className="rounded-2xl bg-white border border-[#123B35]/10 overflow-hidden">
        {visibleBatches.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#64748B]">{t.common.noRecords}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#123B35]/10 bg-[#FFF9EF]/60 text-xs font-semibold text-[#64748B]">
                  <th className="py-3 px-6">Batch Code</th>
                  <th className="py-3 px-4">Food &amp; Packaging</th>
                  <th className="py-3 px-4 text-right">Allocated / Avail</th>
                  <th className="py-3 px-4">Deadlines</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#123B35]/8 text-sm">
                {visibleBatches.map((batch) => {
                  const batchAllocs = allocations.filter((a) => a.donation_batch_id === batch.id);
                  const canEdit =
                    batch.portions_allocated === 0 &&
                    ['SUBMITTED', 'PENDING_INSPECTION'].includes(batch.status);
                  const canCancel =
                    !['DELIVERED', 'CANCELLED', 'INSPECTION_REJECTED'].includes(batch.status) &&
                    (batch.portions_allocated === 0 || profile?.role === 'ADMINISTRATOR');

                  return (
                    <tr key={batch.id} className="hover:bg-[#FFF9EF]/40">
                      <td className="py-4 px-6 align-top">
                        <div className="font-mono text-xs font-bold text-[#123B35]">
                          {batch.batch_code}
                        </div>
                        <div className="mt-1 text-xs text-[#64748B]">{batch.dietary_type}</div>
                      </td>
                      <td className="py-4 px-4 align-top">
                        <div className="font-semibold text-[#123B35]">{batch.food_item}</div>
                        <div className="mt-0.5 text-xs text-[#64748B]">{batch.packaging_details}</div>
                        {batchAllocs.length > 0 && (
                          <div className="mt-1.5 text-xs text-[#123B35]">
                            Split across {batchAllocs.length} allocation(s)
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 align-top text-right font-mono tabular-nums text-xs">
                        <div className="font-bold text-[#123B35]">
                          {batch.portions_allocated} / {batch.portions_available}
                        </div>
                        <div className="text-[#64748B]">
                          {batch.portions_available - batch.portions_allocated} free
                        </div>
                        <div className="mt-1 text-[#64748B]">
                          {batch.temp_celsius !== null ? `${batch.temp_celsius}°C` : 'No temp'}
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top font-mono tabular-nums text-xs text-[#64748B]">
                        <div>Pickup: {new Date(batch.pickup_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div>Consume: {new Date(batch.consume_by_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="py-4 px-4 align-top text-xs">
                        <div className="font-semibold text-[#123B35]">
                          {batch.status.replace(/_/g, ' ')}
                        </div>
                        {batch.cancellation_reason && (
                          <div className="mt-1 text-[#FF795C]">{batch.cancellation_reason}</div>
                        )}
                      </td>
                      <td className="py-4 px-6 align-top text-right">
                        <div className="inline-flex items-center gap-2">
                          {batch.safety_gate_passed && (
                            <Link
                              to={`/mealtrace?token=${encodeURIComponent(batch.qr_token)}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#123B35]/20 text-xs font-semibold text-[#123B35] hover:bg-[#FFF9EF]"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              QR
                            </Link>
                          )}
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingBatch(batch);
                                setEditFoodItem(batch.food_item);
                                setEditPortions(String(batch.portions_available));
                              }}
                              className="p-1.5 rounded-lg border border-[#123B35]/15 text-[#123B35] hover:bg-[#FFF9EF]"
                              title="Edit before allocation"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canCancel && (
                            <button
                              type="button"
                              onClick={() => setCancellingBatch(batch)}
                              className="p-1.5 rounded-lg border border-[#FF795C]/40 text-[#FF795C] hover:bg-[#FF795C]/10"
                              title="Cancel batch with recorded reason"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(cancellingBatch)}
        title={`Cancel Donation ${cancellingBatch?.batch_code ?? ''}`}
        description="Cancelling a donation records an immutable audit trail entry and withdraws it from surplus matching."
        confirmLabel="Cancel Donation"
        destructive
        requireReason
        reasonLabel="Cancellation Reason"
        onCancel={() => setCancellingBatch(null)}
        onConfirm={async (reason) => {
          if (!cancellingBatch) return;
          const res = await cancelDonationBatch(cancellingBatch.id, reason);
          if (res.error) setErrorMsg(res.error);
          setCancellingBatch(null);
        }}
      />
    </div>
  );
};
