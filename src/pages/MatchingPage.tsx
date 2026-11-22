import React, { useMemo, useState } from 'react';
import { CheckCircle2, GitMerge, Play, ShieldAlert, SlidersHorizontal, Sprout } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useApp } from '../context/AppContext';
import {
  formatAllocationStatus,
  formatFoodName,
  formatOrgName,
  tx,
} from '../i18n/helpers';
import {
  DEFAULT_SAFETY_BUFFER_MINUTES,
  runSmartMatchingEngine,
  type MatchingResult,
} from '../lib/matchingEngine';
import { canPerformAction } from '../lib/rbac';
import type { Allocation } from '../types/database';

export const MatchingPage: React.FC = () => {
  const {
    profile,
    batches,
    requests,
    organisations,
    allocations,
    foodCatalog,
    nutrientConfigs,
    communityGapAnalyses,
    proposeSplitAllocations,
    approveAllocation,
    language,
    t,
  } = useApp();

  const candidateBatches = batches.filter(
    (b) => !['DELIVERED', 'CANCELLED', 'EXPIRED'].includes(b.status)
  );
  const [selectedBatchId, setSelectedBatchId] = useState(
    candidateBatches.find((b) => b.safety_gate_passed)?.id ?? candidateBatches[0]?.id ?? ''
  );
  const [deliveryCapacity, setDeliveryCapacity] = useState('120');
  const [safetyBufferMin, setSafetyBufferMin] = useState(String(DEFAULT_SAFETY_BUFFER_MINUTES));
  const [useNutriLoop, setUseNutriLoop] = useState(true);
  const [showWeights, setShowWeights] = useState(false);
  const [result, setResult] = useState<MatchingResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [approvingAlloc, setApprovingAlloc] = useState<Allocation | null>(null);

  const selectedBatch = batches.find((b) => b.id === selectedBatchId) ?? candidateBatches[0];
  const isCoordinator = canPerformAction(profile?.role, 'matching:approve');

  const handleRunEngine = () => {
    setErrorMsg(null);
    if (!selectedBatch) return;
    const donorOrg = organisations.find((o) => o.id === selectedBatch.donor_id);
    const openRequests = requests
      .filter((r) => r.status === 'OPEN' || r.status === 'PARTIALLY_ALLOCATED')
      .map((r) => ({
        request: r,
        recipientOrg: organisations.find((o) => o.id === r.org_id),
      }));

    const hasProfiles = Object.keys(communityGapAnalyses).length > 0;
    const output = runSmartMatchingEngine({
      batch: selectedBatch,
      donorOrg,
      requests: openRequests,
      deliveryCapacityPortions: Math.max(0, Number(deliveryCapacity) || 0),
      safetyBufferMinutes: Math.max(15, Number(safetyBufferMin) || DEFAULT_SAFETY_BUFFER_MINUTES),
      nutritionContext:
        useNutriLoop && hasProfiles
          ? {
              communityAnalysesByOrgId: communityGapAnalyses,
              foodCatalog,
              nutrientConfigs,
            }
          : undefined,
    });
    setResult(output);
  };

  const handlePropose = async () => {
    if (!selectedBatch || !result || result.proposals.length === 0) return;
    setErrorMsg(null);
    const res = await proposeSplitAllocations(selectedBatch.id, result.proposals);
    if (res.error) setErrorMsg(res.error);
    else setResult(null);
  };

  const batchAllocations = useMemo(() => {
    return allocations.filter((a) => !selectedBatch || a.donation_batch_id === selectedBatch.id);
  }, [allocations, selectedBatch]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold font-display text-[#123B35]">
            {tx(language, 'Match Food to Shelters', 'உணவை காப்பகங்களுக்குப் பொருத்துக')}
          </h2>
          <p className="mt-1 text-sm text-[#64748B]">
            {tx(
              language,
              'Checks food safety first, then pairs available meals with the shelters that need them most.',
              'முதலில் உணவுப் பாதுகாப்பைச் சரிபார்த்து, பின்னர் அதிகத் தேவையுள்ள காப்பகங்களுக்கு உணவுகளைப் பொருத்துகிறது.'
            )}
          </p>
        </div>
      </div>

      {/* Matching Configuration Bar */}
      <section className="rounded-2xl bg-white border border-[#123B35]/10 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#123B35]">
            <SlidersHorizontal className="w-4 h-4" />
            {tx(language, 'Matching Settings', 'பொருத்த அமைப்புகள்')}
          </div>
          <label className="inline-flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#123B35]">
            <input
              type="checkbox"
              checked={useNutriLoop}
              onChange={(e) => {
                setUseNutriLoop(e.target.checked);
                setResult(null);
              }}
              className="w-4 h-4 accent-[#123B35]"
            />
            <Sprout className="w-3.5 h-3.5 text-[#123B35]" />
            <span>
              {tx(
                language,
                'NutriLoop Nutrition-Aware Priority (Safety Gate Always Runs First)',
                'ஊட்டச்சத்து முன்னுரிமை (பாதுகாப்புச் சோதனை எப்போதும் முதலில்)'
              )}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-6">
            <label htmlFor="match-batch" className="block text-xs font-semibold text-[#123B35] mb-1">
              {tx(language, 'Target Donation Batch', 'உணவுத் தொகுதி')}
            </label>
            <select
              id="match-batch"
              value={selectedBatch?.id ?? ''}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
                setResult(null);
              }}
              className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3.5 py-2.5 text-sm"
            >
              {candidateBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batch_code} — {formatFoodName(b.food_item, language)} (
                  {b.portions_available - b.portions_allocated} {tx(language, 'free', 'மீதம்')} / {b.portions_available} ·{' '}
                  {b.safety_gate_passed
                    ? tx(language, 'Safety PASSED', 'பாதுகாப்பு தேர்ச்சி')
                    : tx(language, 'Safety NOT PASSED', 'பாதுகாப்பு நிலுவை')}
                  )
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="match-cap" className="block text-xs font-semibold text-[#123B35] mb-1">
              {tx(language, 'Delivery Cap', 'வாகனத் திறன்')}
            </label>
            <input
              id="match-cap"
              type="number"
              min={0}
              max={2000}
              value={deliveryCapacity}
              onChange={(e) => setDeliveryCapacity(e.target.value)}
              className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2.5 text-sm font-mono tabular-nums"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="match-buf" className="block text-xs font-semibold text-[#123B35] mb-1">
              {tx(language, 'Safety Buffer (min)', 'பாதுகாப்பு அவகாசம் (நிமிடம்)')}
            </label>
            <input
              id="match-buf"
              type="number"
              min={15}
              max={180}
              value={safetyBufferMin}
              onChange={(e) => setSafetyBufferMin(e.target.value)}
              className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2.5 text-sm font-mono tabular-nums"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="button"
              disabled={!selectedBatch}
              onClick={handleRunEngine}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723] disabled:opacity-40 whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5" />
              {t.matching.runEngine}
            </button>
          </div>
        </div>
      </section>

      {errorMsg && (
        <div className="rounded-xl border border-[#FF795C] bg-[#FF795C]/10 px-4 py-3 text-xs font-medium text-[#123B35]">
          {errorMsg}
        </div>
      )}

      {/* Matching Engine Output */}
      {result && (
        <section className="rounded-2xl bg-white border border-[#123B35]/15 p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#123B35]/10 pb-4">
            <div>
              <h3 className="text-base font-bold font-display text-[#123B35]">
                {tx(language, 'Split-Batch Proposal & Scoring Audit', 'பகுதி ஒதுக்கீடு முன்மொழிவு & மதிப்பீடு')}
              </h3>
              <p className="mt-0.5 text-xs font-mono text-[#64748B]">
                {result.algorithm_version} · {new Date(result.calculated_at).toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center gap-6 font-mono tabular-nums text-xs">
              <div>
                <span className="text-[#64748B]">{tx(language, 'Available:', 'கிடைப்பது:')} </span>
                <strong className="text-[#123B35]">{result.portions_available}</strong>
              </div>
              <div>
                <span className="text-[#64748B]">{tx(language, 'Proposed:', 'முன்மொழிவு:')} </span>
                <strong className="text-[#123B35]">{result.total_proposed}</strong>
              </div>
              <div>
                <span className="text-[#64748B]">{t.matching.unallocatedRemaining}: </span>
                <strong className="text-[#123B35]">{result.remaining_unallocated}</strong>
              </div>
            </div>
          </div>

          {result.batch_hard_errors.length > 0 && (
            <div className="rounded-xl border border-[#FF795C] bg-[#FF795C]/10 p-4 space-y-1">
              <div className="text-xs font-bold text-[#123B35] flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#FF795C]" />
                {tx(
                  language,
                  'Batch Blocked by Fail-Closed Hard Eligibility Gate',
                  'பாதுகாப்பு மற்றும் தகுதி நிபந்தனையால் உணவுத் தொகுதி தடுக்கப்பட்டது'
                )}
              </div>
              <ul className="list-disc pl-5 text-xs text-[#123B35] space-y-0.5">
                {result.batch_hard_errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {result.proposals.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowWeights((v) => !v)}
                  className="text-xs font-semibold text-[#64748B] hover:text-[#123B35]"
                >
                  {showWeights
                    ? tx(language, 'Hide score weights', 'மதிப்பெண் விவரத்தை மறை')
                    : tx(language, 'Show score breakdown (L/U/Q/T/N)', 'மதிப்பெண் விவரத்தைக் காட்டு (L/U/Q/T/N)')}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#123B35]/10 text-xs font-semibold text-[#64748B]">
                      <th className="py-2.5 pr-4">{tx(language, 'Shelter / Community', 'காப்பகம் / சமூகம்')}</th>
                      <th className="py-2.5 px-3 text-right">{tx(language, 'Meals', 'உணவுகள்')}</th>
                      {showWeights && (
                        <>
                          <th className="py-2.5 px-3 text-right">
                            L ({result.proposals[0]?.match_explanation.nutrition_mode ? '0.25' : '0.35'})
                          </th>
                          <th className="py-2.5 px-3 text-right">
                            U ({result.proposals[0]?.match_explanation.nutrition_mode ? '0.20' : '0.30'})
                          </th>
                          <th className="py-2.5 px-3 text-right">
                            Q ({result.proposals[0]?.match_explanation.nutrition_mode ? '0.15' : '0.20'})
                          </th>
                          <th className="py-2.5 px-3 text-right">T (0.15)</th>
                          {result.proposals[0]?.match_explanation.nutrition_mode && (
                            <th className="py-2.5 px-3 text-right text-[#123B35]">N (0.25)</th>
                          )}
                        </>
                      )}
                      <th className="py-2.5 pl-3 text-right">{tx(language, 'Match', 'பொருத்தம்')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#123B35]/8 text-sm">
                    {result.proposals.map((prop) => (
                      <tr key={prop.meal_request_id}>
                        <td className="py-3 pr-4">
                          <div className="font-semibold text-[#123B35]">
                            {formatOrgName(prop.org_name, language)}
                          </div>
                          <div className="text-xs text-[#64748B]">
                            {prop.match_explanation.summary}
                          </div>
                          {prop.match_explanation.nutrition_summary && (
                            <div className="mt-1 text-xs font-medium text-[#123B35]">
                              {tx(language, 'Nutrition:', 'ஊட்டச்சத்து:')} {prop.match_explanation.nutrition_summary}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-xs font-bold text-[#123B35]">
                          {prop.allocated_portions} / {prop.portions_needed}
                        </td>
                        {showWeights && (
                          <>
                            <td className="py-3 px-3 text-right font-mono tabular-nums text-xs text-[#64748B]">
                              {prop.match_explanation.L.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono tabular-nums text-xs text-[#64748B]">
                              {prop.match_explanation.U.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono tabular-nums text-xs text-[#64748B]">
                              {prop.match_explanation.Q.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono tabular-nums text-xs text-[#64748B]">
                              {prop.match_explanation.T.toFixed(2)}
                            </td>
                            {result.proposals[0]?.match_explanation.nutrition_mode && (
                              <td className="py-3 px-3 text-right font-mono tabular-nums text-xs font-bold text-[#123B35]">
                                {(prop.match_explanation.N ?? 0).toFixed(2)}
                              </td>
                            )}
                          </>
                        )}
                        <td className="py-3 pl-3 text-right font-mono tabular-nums text-sm font-extrabold text-[#123B35]">
                          {(prop.match_score * 100).toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <p className="text-xs text-[#64748B]">
                  {tx(
                    language,
                    'Allocations execute safely and still require Coordinator approval before dispatch.',
                    'ஒதுக்கீடுகள் பாதுகாப்பாகச் சேமிக்கப்பட்டு அனுப்புவதற்கு முன் ஒருங்கிணைப்பாளர் ஒப்புதல் தேவை.'
                  )}
                </p>
                <button
                  type="button"
                  disabled={!isCoordinator}
                  onClick={() => void handlePropose()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D7F36B] text-[#123B35] text-xs font-bold hover:bg-[#C8E655] disabled:opacity-40"
                >
                  <GitMerge className="w-4 h-4" />
                  {t.matching.proposeAllocations} ({result.total_proposed} {t.common.portions})
                </button>
              </div>
            </div>
          )}

          {result.rejected_candidates.length > 0 && (
            <div className="pt-4 border-t border-[#123B35]/10">
              <h4 className="text-xs font-bold text-[#64748B] mb-2">
                {t.matching.hardGateBlocked} ({result.rejected_candidates.length})
              </h4>
              <ul className="space-y-2">
                {result.rejected_candidates.map((rej) => (
                  <li key={rej.meal_request_id} className="text-xs text-[#64748B]">
                    <span className="font-semibold text-[#123B35]">
                      {formatOrgName(rej.org_name, language)}:
                    </span>{' '}
                    {rej.reasons.join(' · ')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Existing Allocations & Coordinator Approval Table */}
      <section className="rounded-2xl bg-white border border-[#123B35]/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#123B35]/10">
          <h3 className="text-base font-bold font-display text-[#123B35]">
            {tx(language, 'Recorded Allocations & Coordinator Approvals', 'பதிவு செய்யப்பட்ட ஒதுக்கீடுகள் & ஒப்புதல்கள்')} ({batchAllocations.length})
          </h3>
          <p className="text-xs text-[#64748B]">
            {tx(
              language,
              'Review match explanations and approve final allocations before delivery dispatch.',
              'பொருத்த விவரங்களைப் பரிசீலித்து விநியோகத்திற்கு முன் ஒதுக்கீடுகளை அங்கீகரிக்கவும்.'
            )}
          </p>
        </div>

        {batchAllocations.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#64748B]">
            {tx(
              language,
              `No allocations recorded for the selected batch yet. Click "${t.matching.runEngine}" above to compute candidates.`,
              `இந்த உணவுத் தொகுதிக்கு இதுவரை ஒதுக்கீடு இல்லை. மேலே உள்ள "${t.matching.runEngine}" பொத்தானை அழுத்தவும்.`
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#123B35]/8">
            {batchAllocations.map((alloc) => {
              const req = requests.find((r) => r.id === alloc.meal_request_id);
              const org = organisations.find((o) => o.id === req?.org_id);
              const exp = alloc.match_explanation;

              return (
                <div key={alloc.id} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-[#123B35]">
                      {formatOrgName(org?.name, language) || tx(language, 'Verified Recipient', 'சரிபார்க்கப்பட்ட பெறுநர்')} ·{' '}
                      <span className="font-mono">
                        {alloc.allocated_portions} {t.common.portions}
                      </span>
                    </div>
                    <div className="text-xs text-[#64748B] font-mono tabular-nums">
                      {tx(language, 'Score', 'மதிப்பெண்')} {(alloc.match_score * 100).toFixed(1)}% (L={exp?.L?.toFixed(2) ?? '—'}, U=
                      {exp?.U?.toFixed(2) ?? '—'}, Q={exp?.Q?.toFixed(2) ?? '—'}, T=
                      {exp?.T?.toFixed(2) ?? '—'}
                      {exp?.nutrition_mode ? `, N=${(exp.N ?? 0).toFixed(2)}` : ''}) ·{' '}
                      {exp?.algorithm_version ?? 'v2.0'}
                    </div>
                    {exp?.summary && <div className="text-xs text-[#64748B]">{exp.summary}</div>}
                    {exp?.nutrition_summary && (
                      <div className="text-xs font-medium text-[#123B35]">
                        {tx(language, 'Nutrition:', 'ஊட்டச்சத்து:')} {exp.nutrition_summary}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-bold text-[#123B35]">
                      {formatAllocationStatus(alloc.status, language)}
                    </span>
                    {alloc.status === 'PROPOSED' && isCoordinator && (
                      <button
                        type="button"
                        onClick={() => setApprovingAlloc(alloc)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723]"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t.matching.approveDispatch}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(approvingAlloc)}
        title={tx(language, 'Approve Allocation for Dispatch', 'விநியோகத்திற்கு ஒதுக்கீட்டை அங்கீகரி')}
        description={tx(
          language,
          `Confirm coordinator approval for ${approvingAlloc?.allocated_portions ?? 0} portions. This logs an immutable audit entry.`,
          `${approvingAlloc?.allocated_portions ?? 0} பங்குகளுக்கான ஒருங்கிணைப்பாளர் ஒப்புதலை உறுதிப்படுத்தவும்.`
        )}
        confirmLabel={t.matching.approveDispatch}
        requireReason
        reasonLabel={tx(language, 'Coordinator Verification Note', 'ஒருங்கிணைப்பாளர் சரிபார்ப்புக் குறிப்பு')}
        reasonPlaceholder={tx(
          language,
          'e.g. Verified receiving window and delivery capacity.',
          'எ.கா. பெறுதல் நேரமும் விநியோகத் திறனும் சரிபார்க்கப்பட்டது.'
        )}
        onCancel={() => setApprovingAlloc(null)}
        onConfirm={async (reason) => {
          if (!approvingAlloc) return;
          const res = await approveAllocation(approvingAlloc.id, reason);
          if (res.error) setErrorMsg(res.error);
          setApprovingAlloc(null);
        }}
      />
    </div>
  );
};
