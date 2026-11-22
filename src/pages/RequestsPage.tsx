import React, { useMemo, useState } from 'react';
import { Check, HandHeart, Plus, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatAllocationStatus,
  formatDietary,
  formatDynamicDemoText,
  formatFoodName,
  formatIntakeChannel,
  formatOrgName,
  formatRequestStatus,
  tx,
} from '../i18n/helpers';
import { canPerformAction } from '../lib/rbac';
import type { DietaryPreference } from '../types/database';

function toLocalDateTimeInput(offsetMinutes: number): string {
  const dt = new Date(Date.now() + offsetMinutes * 60_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(
    dt.getMinutes()
  )}`;
}

export const RequestsPage: React.FC = () => {
  const {
    profile,
    activeOrganisation,
    organisations,
    requests,
    allocations,
    batches,
    createMealRequest,
    respondToAllocation,
    recordMealTraceScan,
    language,
    t,
  } = useApp();

  const canCreateRequest = canPerformAction(profile?.role, 'request:create');
  const canRespondAlloc = canPerformAction(profile?.role, 'allocation:respond');
  const canConfirmPortions = canPerformAction(profile?.role, 'mealtrace:confirm_portions');

  const verifiedRecipients = organisations.filter(
    (o) =>
      (o.org_type === 'VERIFIED_NGO' || o.org_type === 'COMMUNITY_KITCHEN') &&
      o.verification_status === 'verified'
  );

  const defaultOrgId =
    activeOrganisation &&
    (activeOrganisation.org_type === 'VERIFIED_NGO' ||
      activeOrganisation.org_type === 'COMMUNITY_KITCHEN')
      ? activeOrganisation.id
      : verifiedRecipients[0]?.id ?? '';

  const [showForm, setShowForm] = useState(false);
  const [orgId, setOrgId] = useState(defaultOrgId);
  const [portionsNeeded, setPortionsNeeded] = useState('50');
  const [dietaryPref, setDietaryPref] = useState<DietaryPreference>('VEGETARIAN');
  const [urgencyScore, setUrgencyScore] = useState('0.80');
  const [requiredBy, setRequiredBy] = useState(() => toLocalDateTimeInput(180));
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Handover confirmation form
  const [confirmingAllocId, setConfirmingAllocId] = useState<string | null>(null);
  const [confirmedPortions, setConfirmedPortions] = useState('');
  const [distributionArea, setDistributionArea] = useState('');
  const [receivedTemp, setReceivedTemp] = useState('61.5');

  const visibleRequests = useMemo(() => {
    if (
      (profile?.role === 'VERIFIED_NGO' || profile?.role === 'COMMUNITY_KITCHEN') &&
      activeOrganisation
    ) {
      return requests.filter((r) => r.org_id === activeOrganisation.id);
    }
    return requests;
  }, [requests, profile, activeOrganisation]);

  const visibleAllocations = useMemo(() => {
    const reqIds = new Set(visibleRequests.map((r) => r.id));
    return allocations.filter((a) => reqIds.has(a.meal_request_id));
  }, [allocations, visibleRequests]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const chosenOrg = orgId || defaultOrgId;
    if (!chosenOrg) {
      setErrorMsg(
        tx(
          language,
          'Select a verified NGO or Community Kitchen.',
          'சரிபார்க்கப்பட்ட தன்னார்வ நிறுவனம் அல்லது சமூக சமையலறையைத் தேர்ந்தெடுக்கவும்.'
        )
      );
      return;
    }
    const res = await createMealRequest({
      org_id: chosenOrg,
      portions_needed: Number(portionsNeeded),
      dietary_pref: dietaryPref,
      urgency_score: Number(urgencyScore),
      intake_channel: 'WEB_PORTAL',
      required_by: new Date(requiredBy).toISOString(),
      notes: notes.trim() || undefined,
    });
    if (res.error) setErrorMsg(res.error);
    else {
      setNotes('');
      setShowForm(false);
    }
  };

  const handleConfirmHandover = async (e: React.FormEvent, qrToken: string) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = await recordMealTraceScan({
      qr_token: qrToken,
      event_type: 'PORTIONS_CONFIRMED',
      recorded_temp: receivedTemp ? Number(receivedTemp) : null,
      confirmed_portions: Number(confirmedPortions),
      distribution_area:
        distributionArea.trim() ||
        activeOrganisation?.address ||
        tx(language, 'Verified Community Site', 'சரிபார்க்கப்பட்ட சமூக மையம்'),
      notes: 'Receiving organisation confirmed actual portions upon physical handover',
    });
    if (res.error) setErrorMsg(res.error);
    else setConfirmingAllocId(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold font-display text-[#123B35]">
            {tx(language, 'Meal Requests & Receiving Confirmations', 'உணவு கோரிக்கைகள் & பெறுதல் உறுதிப்படுத்தல்')}
          </h2>
          <p className="mt-1 text-sm text-[#64748B]">
            {tx(
              language,
              'Log how many meals your shelter needs—available safe surplus is matched and assigned to a driver automatically.',
              'உங்கள் காப்பகத்திற்குத் தேவையான உணவுகளைப் பதிவு செய்யுங்கள்—பாதுகாப்பான உபரி உணவு தானாகப் பொருத்தப்பட்டு ஓட்டுநருக்கு ஒதுக்கப்படும்.',
              'अपने आश्रय के लिए ज़रूरी भोजन दर्ज करें—उपलब्ध सुरक्षित अधिशेष भोजन अपने आप मिलान होकर ड्राइवर को सौंप दिया जाएगा।',
              'మీ ఆశ్రయానికి అవసరమైన భోజనాలను నమోదు చేయండి—అందుబాటులో ఉన్న సురక్షిత మిగులు ఆహారం స్వయంచాలకంగా సరిపోల్చబడి డ్రైవర్‌కు కేటాయించబడుతుంది.'
            )}
          </p>
        </div>
        {canCreateRequest && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723]"
          >
            <Plus className="w-4 h-4" />
            {showForm
              ? tx(language, 'Close Form', 'படிவத்தை மூடு')
              : tx(language, 'New Meal Request', 'புதிய உணவு கோரிக்கை')}
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-[#FF795C] bg-[#FF795C]/10 px-4 py-3 text-xs font-medium text-[#123B35]">
          {errorMsg}
        </div>
      )}

      {showForm && canCreateRequest && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl bg-white border border-[#123B35]/15 p-6 space-y-5"
        >
          <h3 className="text-base font-bold font-display text-[#123B35]">
            {tx(language, 'Submit Meal Request', 'உணவு கோரிக்கையைச் சமர்ப்பி')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="req-org" className="block text-xs font-semibold text-[#123B35] mb-1">
                {tx(language, 'Verified Recipient Organisation *', 'சரிபார்க்கப்பட்ட பெறும் நிறுவனம் *')}
              </label>
              <select
                id="req-org"
                required
                value={orgId || defaultOrgId}
                onChange={(e) => setOrgId(e.target.value)}
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm"
              >
                {verifiedRecipients.map((o) => (
                  <option key={o.id} value={o.id}>
                    {formatOrgName(o.name, language)} ({tx(language, 'Cap', 'திறன்')}: {o.daily_capacity})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="req-portions" className="block text-xs font-semibold text-[#123B35] mb-1">
                {tx(language, 'Portions Needed *', 'தேவையான பங்குகள் *')}
              </label>
              <input
                id="req-portions"
                type="number"
                min={5}
                max={2000}
                required
                value={portionsNeeded}
                onChange={(e) => setPortionsNeeded(e.target.value)}
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm font-mono tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="req-diet" className="block text-xs font-semibold text-[#123B35] mb-1">
                {tx(language, 'Dietary Requirement *', 'உணவு விருப்பம் *')}
              </label>
              <select
                id="req-diet"
                value={dietaryPref}
                onChange={(e) => setDietaryPref(e.target.value as DietaryPreference)}
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm"
              >
                {(['VEGETARIAN', 'ANY', 'VEGAN', 'JAIN', 'HALAL', 'EGGETARIAN', 'NON_VEGETARIAN'] as DietaryPreference[]).map(
                  (d) => (
                    <option key={d} value={d}>
                      {formatDietary(d, language)}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label htmlFor="req-urgency" className="block text-xs font-semibold text-[#123B35] mb-1">
                {tx(language, 'Urgency Score (0.10 – 1.00) *', 'அவசர அளவு (0.10 – 1.00) *')}
              </label>
              <input
                id="req-urgency"
                type="number"
                min={0.1}
                max={1}
                step={0.05}
                required
                value={urgencyScore}
                onChange={(e) => setUrgencyScore(e.target.value)}
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm font-mono tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="req-by" className="block text-xs font-semibold text-[#123B35] mb-1">
                {tx(language, 'Required By *', 'தேவைப்படும் நேரம் *')}
              </label>
              <input
                id="req-by"
                type="datetime-local"
                required
                value={requiredBy}
                onChange={(e) => setRequiredBy(e.target.value)}
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm font-mono"
              />
            </div>

            <div>
              <label htmlFor="req-notes" className="block text-xs font-semibold text-[#123B35] mb-1">
                {tx(language, 'Service Context / Notes', 'குறிப்புகள்')}
              </label>
              <input
                id="req-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={tx(language, 'e.g. Evening shelter dinner service', 'எ.கா. மாலை காப்பக இரவு உணவு')}
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723]"
            >
              {tx(language, 'Submit Request', 'கோரிக்கையைச் சமர்ப்பி')}
            </button>
          </div>
        </form>
      )}

      {/* Proposed & Incoming Allocations */}
      <section className="rounded-2xl bg-white border border-[#123B35]/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#123B35]/10">
          <h3 className="text-base font-bold font-display text-[#123B35]">
            {tx(language, 'Allocated Donations & Handover Confirmation', 'ஒதுக்கப்பட்ட உணவுகள் & ஒப்படைப்பு உறுதிப்படுத்தல்')}
          </h3>
          <p className="text-xs text-[#64748B]">
            {tx(
              language,
              'Accept or decline coordinator-approved matches, and confirm actual delivered portions when food arrives.',
              'அங்கீகரிக்கப்பட்ட உணவு ஒதுக்கீடுகளை ஏற்கவும் அல்லது மறுக்கவும்; உணவு வந்தவுடன் பெறப்பட்ட அளவை உறுதிப்படுத்தவும்.'
            )}
          </p>
        </div>

        {visibleAllocations.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#64748B]">
            {tx(
              language,
              'No surplus allocations have been proposed for these requests yet.',
              'இந்தக் கோரிக்கைகளுக்கு இதுவரை உணவு ஒதுக்கீடுகள் எதுவும் முன்மொழியப்படவில்லை.'
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#123B35]/8">
            {visibleAllocations.map((alloc) => {
              const batch = batches.find((b) => b.id === alloc.donation_batch_id);
              const req = requests.find((r) => r.id === alloc.meal_request_id);
              const recipientOrg = organisations.find((o) => o.id === req?.org_id);
              const canRespond = canRespondAlloc && (alloc.status === 'PROPOSED' || alloc.status === 'APPROVED');
              const canConfirmDelivery =
                canConfirmPortions &&
                (alloc.status === 'DISPATCHED' ||
                  alloc.status === 'PICKED_UP' ||
                  alloc.status === 'ACCEPTED' ||
                  alloc.status === 'APPROVED');

              return (
                <div key={alloc.id} className="p-6 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold text-[#123B35]">
                        {batch ? formatFoodName(batch.food_item, language) : tx(language, 'Surplus Batch', 'உபரி உணவுத் தொகுதி')} ·{' '}
                        <span className="font-mono">
                          {alloc.allocated_portions} {t.common.portions}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-[#64748B]">
                        {tx(language, 'Recipient:', 'பெறுநர்:')}{' '}
                        {formatOrgName(recipientOrg?.name, language) || tx(language, 'Verified Org', 'சரிபார்க்கப்பட்ட நிறுவனம்')} ·{' '}
                        {tx(language, 'Batch', 'தொகுதி')} <span className="font-mono">{batch?.batch_code}</span> ·{' '}
                        {tx(language, 'Match', 'பொருத்தம்')}{' '}
                        <span className="font-mono">{(alloc.match_score * 100).toFixed(1)}%</span> ·{' '}
                        {tx(language, 'Status:', 'நிலை:')}{' '}
                        <span className="font-semibold text-[#123B35]">
                          {formatAllocationStatus(alloc.status, language)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {canRespond && (
                        <>
                          <button
                            type="button"
                            onClick={() => void respondToAllocation(alloc.id, 'ACCEPTED')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723]"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {tx(language, 'Accept', 'ஏற்றுக்கொள்')}
                          </button>
                          <button
                            type="button"
                            onClick={() => void respondToAllocation(alloc.id, 'DECLINED')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#FF795C] text-[#FF795C] text-xs font-semibold hover:bg-[#FF795C]/10"
                          >
                            <X className="w-3.5 h-3.5" />
                            {tx(language, 'Decline', 'மறுக்கவும்')}
                          </button>
                        </>
                      )}
                      {canConfirmDelivery && batch && (
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmingAllocId(alloc.id);
                            setConfirmedPortions(String(alloc.allocated_portions));
                            setDistributionArea(recipientOrg?.address ?? '');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D7F36B] text-[#123B35] text-xs font-bold hover:bg-[#C8E655]"
                        >
                          <HandHeart className="w-3.5 h-3.5" />
                          {tx(language, 'Confirm Received Portions', 'பெறப்பட்ட பங்குகளை உறுதிப்படுத்து')}
                        </button>
                      )}
                    </div>
                  </div>

                  {confirmingAllocId === alloc.id && batch && (
                    <form
                      onSubmit={(e) => handleConfirmHandover(e, batch.qr_token)}
                      className="rounded-xl bg-[#FFF9EF] border border-[#123B35]/15 p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
                    >
                      <div>
                        <label className="block text-xs font-semibold text-[#123B35] mb-1">
                          {tx(language, 'Actual Portions Received *', 'உண்மையில் பெறப்பட்ட பங்குகள் *')}
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={alloc.allocated_portions + 20}
                          required
                          value={confirmedPortions}
                          onChange={(e) => setConfirmedPortions(e.target.value)}
                          className="w-full rounded-lg border border-[#123B35]/20 bg-white px-3 py-1.5 text-sm font-mono tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#123B35] mb-1">
                          {tx(language, 'Handover Temp (°C)', 'ஒப்படைப்பு வெப்பநிலை (°C)')}
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={receivedTemp}
                          onChange={(e) => setReceivedTemp(e.target.value)}
                          className="w-full rounded-lg border border-[#123B35]/20 bg-white px-3 py-1.5 text-sm font-mono tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#123B35] mb-1">
                          {tx(language, 'Distribution Area *', 'விநியோகப் பகுதி *')}
                        </label>
                        <input
                          type="text"
                          required
                          value={distributionArea}
                          onChange={(e) => setDistributionArea(e.target.value)}
                          className="w-full rounded-lg border border-[#123B35]/20 bg-white px-3 py-1.5 text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          className="flex-1 px-3 py-2 rounded-lg bg-[#123B35] text-white text-xs font-semibold"
                        >
                          {tx(language, 'Confirm Delivery', 'உறுதிப்படுத்து')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingAllocId(null)}
                          className="px-2.5 py-2 rounded-lg border border-[#123B35]/20 text-xs font-semibold"
                        >
                          {t.common.cancel}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Meal Requests Table */}
      <section className="rounded-2xl bg-white border border-[#123B35]/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#123B35]/10">
          <h3 className="text-base font-bold font-display text-[#123B35]">
            {tx(language, 'Meal Request Ledger', 'உணவு கோரிக்கை பட்டியல்')}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#123B35]/10 bg-[#FFF9EF]/60 text-xs font-semibold text-[#64748B]">
                <th className="py-3 px-6">{tx(language, 'Organisation', 'நிறுவனம்')}</th>
                <th className="py-3 px-4">{tx(language, 'Dietary & Channel', 'உணவு & வழி')}</th>
                <th className="py-3 px-4 text-right">{tx(language, 'Fulfilled / Needed', 'கிடைத்தது / தேவை')}</th>
                <th className="py-3 px-4 text-right">{tx(language, 'Urgency', 'அவசரம்')}</th>
                <th className="py-3 px-6">{tx(language, 'Status', 'நிலை')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#123B35]/8 text-sm">
              {visibleRequests.map((req) => {
                const org = organisations.find((o) => o.id === req.org_id);
                return (
                  <tr key={req.id} className="hover:bg-[#FFF9EF]/40">
                    <td className="py-3.5 px-6">
                      <div className="font-semibold text-[#123B35]">
                        {formatOrgName(org?.name, language) || tx(language, 'Verified Org', 'சரிபார்க்கப்பட்ட நிறுவனம்')}
                      </div>
                      {req.notes && (
                        <div className="text-xs text-[#64748B]">
                          {formatDynamicDemoText(req.notes, language)}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#64748B]">
                      {formatDietary(req.dietary_pref, language)} · {formatIntakeChannel(req.intake_channel, language)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs font-semibold text-[#123B35]">
                      {req.portions_fulfilled} / {req.portions_needed}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs text-[#123B35]">
                      {(req.urgency_score * 100).toFixed(0)}%
                    </td>
                    <td className="py-3.5 px-6 text-xs font-semibold text-[#123B35]">
                      {formatRequestStatus(req.status, language)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
