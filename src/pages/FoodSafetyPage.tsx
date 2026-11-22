import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardCheck, ShieldAlert, Thermometer } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { InspectionStatus } from '../types/database';

export const FoodSafetyPage: React.FC = () => {
  const { profile, batches, organisations, safetyChecks, recordFoodSafetyInspection, t } = useApp();

  const inspectableBatches = batches.filter(
    (b) => !['DELIVERED', 'CANCELLED', 'EXPIRED'].includes(b.status)
  );
  const [selectedBatchId, setSelectedBatchId] = useState(
    inspectableBatches.find((b) => !b.safety_gate_passed)?.id ?? inspectableBatches[0]?.id ?? ''
  );
  const [inspectionStatus, setInspectionStatus] = useState<InspectionStatus>('PASSED');
  const [recordedTemp, setRecordedTemp] = useState('63.5');
  const [packagingCondition, setPackagingCondition] = useState('INTACT_SEALED');
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [physicalConfirmed, setPhysicalConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedBatch = batches.find((b) => b.id === selectedBatchId) ?? inspectableBatches[0];
  const selectedDonor = organisations.find((o) => o.id === selectedBatch?.donor_id);
  const canInspect = profile?.role === 'ADMINISTRATOR';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;
    setErrorMsg(null);

    if (inspectionStatus === 'PASSED' && !physicalConfirmed) {
      setErrorMsg('Physical inspection confirmation is mandatory before passing a batch.');
      return;
    }

    const tempVal = recordedTemp.trim() === '' ? null : Number(recordedTemp);
    if (inspectionStatus === 'PASSED' && (tempVal === null || !Number.isFinite(tempVal))) {
      setErrorMsg('Fail-closed safety gate: a valid numeric temperature reading is required to pass.');
      return;
    }

    if (inspectionStatus === 'REJECTED' && rejectionReason.trim().length < 3) {
      setErrorMsg('Please specify a clear rejection reason for the FSSAI-aligned inspection record.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await recordFoodSafetyInspection({
        donation_batch_id: selectedBatch.id,
        inspection_status: inspectionStatus,
        recorded_temp: tempVal,
        packaging_condition: packagingCondition,
        inspection_notes: inspectionNotes.trim(),
        rejection_reason: rejectionReason.trim(),
        physical_inspection_confirmed: physicalConfirmed,
      });
      if (res.error) setErrorMsg(res.error);
      else {
        setInspectionNotes('');
        setRejectionReason('');
        setPhysicalConfirmed(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold font-display text-[#123B35]">
          Food Safety Inspection Module
        </h2>
        <p className="mt-1 text-sm text-[#64748B]">
          FSSAI surplus-food aligned inspection ledger. Unsafe or uncertain temperature values fail
          closed and block matching.
        </p>
      </div>

      {/* Mandatory Physical Inspection Disclaimer */}
      <div
        role="note"
        className="rounded-2xl bg-white border border-[#FF795C] p-5 flex items-start gap-3.5"
      >
        <AlertTriangle className="w-5 h-5 text-[#FF795C] shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-[#123B35]">{t.safety.disclaimerTitle}</h3>
          <p className="mt-1 text-xs text-[#64748B] leading-relaxed">{t.safety.disclaimerBody}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Inspection Form */}
        <section className="xl:col-span-7 rounded-2xl bg-white border border-[#123B35]/10 p-6 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold font-display text-[#123B35] flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" />
              {t.safety.recordInspection}
            </h3>
            <span className="text-xs text-[#64748B]">
              Inspector: {profile?.full_name ?? 'Unauthenticated'}
            </span>
          </div>

          {!canInspect && (
            <div className="rounded-xl bg-[#FFF9EF] border border-[#123B35]/15 p-4 text-xs text-[#64748B] flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-[#123B35] shrink-0 mt-0.5" />
              <span>
                Read-only view: Only authorised food-safety inspectors or administrators may record
                final inspection outcomes (enforced in PostgreSQL RPC &amp; RLS).
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl border border-[#FF795C] bg-[#FF795C]/10 px-4 py-3 text-xs font-medium text-[#123B35]">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fs-batch" className="block text-xs font-semibold text-[#123B35] mb-1">
                Select Donation Batch *
              </label>
              <select
                id="fs-batch"
                value={selectedBatch?.id ?? ''}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3.5 py-2.5 text-sm"
              >
                {inspectableBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batch_code} — {b.food_item} ({b.portions_available} portions · {b.status})
                  </option>
                ))}
              </select>
            </div>

            {selectedBatch && (
              <div className="rounded-xl bg-[#FFF9EF] border border-[#123B35]/10 p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="text-[#64748B]">Donor Identity</div>
                  <div className="mt-0.5 font-semibold text-[#123B35]">
                    {selectedDonor?.name ?? 'Verified Donor'}
                  </div>
                  <div className="font-mono text-[11px] text-[#64748B]">
                    {selectedDonor?.fssai_reg_no ?? 'No FSSAI on file'}
                  </div>
                </div>
                <div>
                  <div className="text-[#64748B]">Category &amp; Quantity</div>
                  <div className="mt-0.5 font-semibold text-[#123B35]">
                    {selectedBatch.food_category} · {selectedBatch.portions_available} portions
                  </div>
                  <div className="text-[11px] text-[#64748B]">{selectedBatch.dietary_type}</div>
                </div>
                <div>
                  <div className="text-[#64748B]">Prep / Consume-By</div>
                  <div className="mt-0.5 font-mono text-[11px] text-[#123B35]">
                    Prep: {new Date(selectedBatch.prep_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="font-mono text-[11px] text-[#123B35]">
                    Use by: {new Date(selectedBatch.consume_by_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="fs-temp" className="block text-xs font-semibold text-[#123B35] mb-1">
                  {t.safety.temperatureC} *
                </label>
                <div className="relative">
                  <Thermometer className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="fs-temp"
                    type="number"
                    step="0.1"
                    value={recordedTemp}
                    onChange={(e) => setRecordedTemp(e.target.value)}
                    placeholder="e.g. 64.5"
                    className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 pl-9 pr-3 py-2 text-sm font-mono tabular-nums"
                  />
                </div>
                <p className="mt-1 text-[11px] text-[#64748B]">
                  Hot food target ≥ 60°C; chilled ≤ 5°C.
                </p>
              </div>

              <div>
                <label htmlFor="fs-pack" className="block text-xs font-semibold text-[#123B35] mb-1">
                  {t.safety.packagingCondition} *
                </label>
                <select
                  id="fs-pack"
                  value={packagingCondition}
                  onChange={(e) => setPackagingCondition(e.target.value)}
                  className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm"
                >
                  <option value="INTACT_SEALED">Intact &amp; Tamper-Sealed</option>
                  <option value="INSULATED_CLEAN">Insulated Food-Grade Clean</option>
                  <option value="MINOR_WEAR_ACCEPTABLE">Minor Exterior Wear (Safe)</option>
                  <option value="COMPROMISED_REJECT">Compromised / Unsealed (Reject)</option>
                </select>
              </div>

              <div>
                <label htmlFor="fs-outcome" className="block text-xs font-semibold text-[#123B35] mb-1">
                  {t.safety.outcome} *
                </label>
                <select
                  id="fs-outcome"
                  value={inspectionStatus}
                  onChange={(e) => setInspectionStatus(e.target.value as InspectionStatus)}
                  className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm font-semibold"
                >
                  <option value="PASSED">{t.safety.passed}</option>
                  <option value="REJECTED">{t.safety.rejected}</option>
                  <option value="PENDING_REVIEW">{t.safety.pendingReview}</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="fs-notes" className="block text-xs font-semibold text-[#123B35] mb-1">
                Sensory, Hygiene &amp; Container Inspection Notes
              </label>
              <textarea
                id="fs-notes"
                rows={2}
                value={inspectionNotes}
                onChange={(e) => setInspectionNotes(e.target.value)}
                placeholder="Probe thermometer verified, aroma/appearance fresh, food-grade cambro sealed."
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3.5 py-2 text-sm"
              />
            </div>

            {inspectionStatus === 'REJECTED' && (
              <div>
                <label htmlFor="fs-reject" className="block text-xs font-semibold text-[#FF795C] mb-1">
                  {t.safety.rejectionReason} *
                </label>
                <textarea
                  id="fs-reject"
                  rows={2}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Core temperature 38°C within danger zone; rejected per safety protocol."
                  className="w-full rounded-xl border border-[#FF795C] bg-[#FF795C]/5 px-3.5 py-2 text-sm"
                />
              </div>
            )}

            <label className="flex items-start gap-2.5 text-xs text-[#123B35] cursor-pointer">
              <input
                type="checkbox"
                checked={physicalConfirmed}
                onChange={(e) => setPhysicalConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-[#123B35]/30 accent-[#123B35]"
              />
              <span>{t.safety.physicalConfirmed}</span>
            </label>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!canInspect || submitting || !selectedBatch}
                className="px-5 py-2.5 rounded-xl bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723] disabled:opacity-40"
              >
                {submitting ? 'Recording...' : t.safety.recordInspection}
              </button>
            </div>
          </form>
        </section>

        {/* Historical Inspection Records */}
        <section className="xl:col-span-5 rounded-2xl bg-white border border-[#123B35]/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-[#123B35]/10">
            <h3 className="text-base font-bold font-display text-[#123B35]">
              Inspection Ledger ({safetyChecks.length})
            </h3>
          </div>
          {safetyChecks.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#64748B]">
              No physical food safety inspections recorded yet.
            </div>
          ) : (
            <ul className="divide-y divide-[#123B35]/8">
              {safetyChecks.map((chk) => {
                const batch = batches.find((b) => b.id === chk.donation_batch_id);
                return (
                  <li key={chk.id} className="p-5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-[#123B35]">
                        {batch?.batch_code ?? chk.donation_batch_id.slice(0, 8)}
                      </span>
                      <span
                        className={`text-xs font-bold inline-flex items-center gap-1 ${
                          chk.inspection_status === 'PASSED'
                            ? 'text-[#16A34A]'
                            : chk.inspection_status === 'REJECTED'
                            ? 'text-[#FF795C]'
                            : 'text-[#D97706]'
                        }`}
                      >
                        {chk.inspection_status === 'PASSED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {chk.inspection_status}
                      </span>
                    </div>
                    <div className="text-xs text-[#64748B] font-mono tabular-nums">
                      Temp: {chk.recorded_temp !== null ? `${chk.recorded_temp}°C` : 'Missing'} ·{' '}
                      {chk.packaging_condition} · {new Date(chk.inspected_at).toLocaleString()}
                    </div>
                    {chk.inspection_notes && (
                      <p className="text-xs text-[#123B35]">{chk.inspection_notes}</p>
                    )}
                    {chk.rejection_reason && (
                      <p className="text-xs font-semibold text-[#FF795C]">
                        Rejection: {chk.rejection_reason}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};
