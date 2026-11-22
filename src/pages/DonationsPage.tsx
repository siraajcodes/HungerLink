import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Download, Edit3, PackagePlus, QrCode, Sprout, XCircle } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useApp } from '../context/AppContext';
import {
  formatBatchStatus,
  formatDietary,
  formatDynamicDemoText,
  formatFoodCategory,
  formatFoodName,
  formatNutrientName,
  formatOrgName,
  tx,
} from '../i18n/helpers';
import { buildCsvDocument } from '../lib/matchingEngine';
import type { DietaryType, DonationBatch } from '../types/database';
import type { TargetedDonationRequest } from '../types/nutriloop';

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
    routes,
    foodCatalog,
    targetedRequests,
    createDonationBatch,
    updateDonationBatch,
    cancelDonationBatch,
    language,
    t,
  } = useApp();

  const [searchParams, setSearchParams] = useSearchParams();

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
  const [foodCompositionId, setFoodCompositionId] = useState<string>('');
  const [linkedTargetedReqId, setLinkedTargetedReqId] = useState<string | null>(null);
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

  const publishedTargetedNeeds = useMemo(
    () => targetedRequests.filter((tr) => tr.status === 'APPROVED_PUBLISHED'),
    [targetedRequests]
  );

  const prefillFromTargetedRequest = (tr: TargetedDonationRequest) => {
    const suggestedName = tr.recommended_items[0] ?? `${tr.target_nutrient_label}-rich prepared meal`;
    const matchedComp = foodCatalog.find(
      (f) => f.food_name.toLowerCase() === suggestedName.toLowerCase()
    );
    setFoodItem(suggestedName);
    setFoodCompositionId(matchedComp?.id ?? '');
    setDietaryType(tr.dietary_pref === 'ANY' ? 'VEGETARIAN' : (tr.dietary_pref as DietaryType));
    setPortionsAvailable(String(Math.min(500, Math.max(10, tr.requested_portions))));
    setLinkedTargetedReqId(tr.id);
    setShowForm(true);
    setErrorMsg(null);
  };

  useEffect(() => {
    const paramId = searchParams.get('targetedRequestId');
    if (paramId) {
      const found = targetedRequests.find(
        (tr) => tr.id === paramId && tr.status === 'APPROVED_PUBLISHED'
      );
      if (found) {
        prefillFromTargetedRequest(found);
      }
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, targetedRequests]);

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
          formatFoodName(b.food_item, language).toLowerCase().includes(q) ||
          b.dietary_type.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [batches, profile, activeOrganisation, statusFilter, searchQuery, language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const chosenDonor = organisations.find((o) => o.id === (donorId || defaultDonorId));
    if (!chosenDonor) {
      setErrorMsg(
        tx(
          language,
          'Select a verified donor organisation before submitting.',
          'சமர்ப்பிக்கும் முன் சரிபார்க்கப்பட்ட தானதாரர் நிறுவனத்தைத் தேர்ந்தெடுக்கவும்.'
        )
      );
      return;
    }

    const prepIso = new Date(prepTime).toISOString();
    const pickupIso = new Date(pickupDeadline).toISOString();
    const consumeIso = new Date(consumeByTime).toISOString();

    if (new Date(consumeIso) <= new Date(prepIso)) {
      setErrorMsg(
        tx(
          language,
          'Consume-by time must be after preparation time.',
          'உட்கொள்ள வேண்டிய நேரம் தயாரிப்பு நேரத்திற்குப் பிறகு இருக்க வேண்டும்.'
        )
      );
      return;
    }
    if (new Date(pickupIso) > new Date(consumeIso)) {
      setErrorMsg(
        tx(
          language,
          'Pickup deadline cannot be later than consume-by time.',
          'சேகரிப்பு கடைசி நேரம் உட்கொள்ளும் நேரத்திற்கு மேல் இருக்கக் கூடாது.'
        )
      );
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
        food_composition_id: foodCompositionId || null,
        targeted_request_id: linkedTargetedReqId,
      });
      if (res.error) setErrorMsg(res.error);
      else {
        setFoodItem('');
        setFoodCompositionId('');
        setLinkedTargetedReqId(null);
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
            {tx(language, 'Surplus Food Donations', 'உபரி உணவு தானங்கள்')}
          </h2>
          <p className="mt-1 text-sm text-[#64748B]">
            {tx(
              language,
              'Share safe surplus meals, check safety status, and track handover to nearby shelters.',
              'பாதுகாப்பான உபரி உணவுகளைப் பகிருங்கள், பாதுகாப்பு நிலையைப் பாருங்கள் மற்றும் காப்பக ஒப்படைப்பைக் கண்காணியுங்கள்.'
            )}
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
            {showForm
              ? tx(language, 'Close Form', 'படிவத்தை மூடு')
              : tx(language, 'Submit Donation', 'உணவு தானம் செய்')}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-[#FF795C] bg-[#FF795C]/10 px-4 py-3 text-xs font-medium text-[#123B35]">
          {errorMsg}
        </div>
      )}

      {/* NutriLoop Published Community Needs — Light, Scannable Strip */}
      {publishedTargetedNeeds.length > 0 && (
        <section className="rounded-2xl bg-white border border-[#123B35]/15 p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-bold font-display text-[#123B35]">
              <Sprout className="w-4 h-4 text-[#123B35]" />
              <span>
                {tx(language, 'Shelters Need These Foods Right Now', 'காப்பகங்களுக்கு இப்போது தேவைப்படும் உணவுகள்')}
              </span>
            </div>
            <Link to="/nutriloop" className="text-xs font-semibold text-[#64748B] hover:text-[#123B35]">
              {tx(language, 'See nutrition details', 'ஊட்டச்சத்து விவரம் பார்')}
            </Link>
          </div>
          <div className="divide-y divide-[#123B35]/8">
            {publishedTargetedNeeds.slice(0, 3).map((need) => {
              const targetOrg = organisations.find((o) => o.id === need.org_id);
              const localizedNutr = formatNutrientName(need.target_nutrient_label, language);
              const localizedIdeas = need.recommended_items
                .slice(0, 2)
                .map((item) => formatFoodName(item, language))
                .join(', ');
              return (
                <div
                  key={need.id}
                  className="py-3 first:pt-1 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#123B35]">
                      {tx(
                        language,
                        `${need.target_nutrient_label}-rich food · ${need.requested_portions} meals`,
                        `${localizedNutr} நிறைந்த உணவு · ${need.requested_portions} உணவுகள்`
                      )}
                    </div>
                    <div className="text-xs text-[#64748B]">
                      {formatOrgName(targetOrg?.name, language) || tx(language, 'Local Shelter', 'உள்ளூர் காப்பகம்')} ·{' '}
                      {tx(language, 'Ideas:', 'பரிந்துரை:')} {localizedIdeas}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => prefillFromTargetedRequest(need)}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-[#D7F36B] text-[#123B35] text-xs font-bold hover:bg-[#C8E655] shrink-0 whitespace-nowrap"
                  >
                    {tx(language, 'Donate This', 'இதைத் தானம் செய்')}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* New Donation Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white border border-[#123B35]/15 p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold font-display text-[#123B35]">
              {tx(language, 'Log Surplus Food Batch', 'உபரி உணவுத் தொகுதியைப் பதிவிடுங்கள்')}
            </h3>
            {linkedTargetedReqId && (
              <div className="text-xs font-semibold text-[#123B35] flex items-center gap-2">
                <span>
                  {tx(language, 'Fulfilling NutriLoop targeted need', 'ஊட்டச்சத்து இலக்குத் தேவையை நிறைவேற்றுகிறது')}
                </span>
                <button
                  type="button"
                  onClick={() => setLinkedTargetedReqId(null)}
                  className="underline text-[#FF795C]"
                >
                  {tx(language, 'Unlink', 'நீக்கு')}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="don-org" className="block text-xs font-semibold text-[#123B35] mb-1">
                {tx(language, 'Verified Donor Organisation *', 'சரிபார்க்கப்பட்ட தானதாரர் நிறுவனம் *')}
              </label>
              <select
                id="don-org"
                required
                value={donorId || defaultDonorId}
                onChange={(e) => setDonorId(e.target.value)}
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm"
              >
                {verifiedDonors.length === 0 && (
                  <option value="">
                    {tx(language, 'No verified donor organisation available', 'சரிபார்க்கப்பட்ட தானதாரர் நிறுவனம் இல்லை')}
                  </option>
                )}
                {verifiedDonors.map((org) => (
                  <option key={org.id} value={org.id}>
                    {formatOrgName(org.name, language)}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="don-item" className="block text-xs font-semibold text-[#123B35] mb-1">
                {tx(language, 'Food Item Description *', 'உணவு விவரம் *')}
              </label>
              <input
                id="don-item"
                type="text"
                required
                value={foodItem}
                onChange={(e) => setFoodItem(e.target.value)}
                placeholder={tx(
                  language,
                  'e.g. Vegetable Biryani, Raita & Boiled Dal',
                  'எ.கா. காய்கறி பிரியாணி, தயிர் பச்சடி & பருப்பு'
                )}
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="don-diet" className="block text-xs font-semibold text-[#123B35] mb-1">
                {tx(language, 'Dietary Classification *', 'உணவு வகை *')}
              </label>
              <select
                id="don-diet"
                value={dietaryType}
                onChange={(e) => setDietaryType(e.target.value as DietaryType)}
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm"
              >
                {(['VEGETARIAN', 'VEGAN', 'JAIN', 'EGGETARIAN', 'HALAL', 'NON_VEGETARIAN'] as DietaryType[]).map(
                  (d) => (
                    <option key={d} value={d}>
                      {formatDietary(d, language)}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label htmlFor="don-portions" className="block text-xs font-semibold text-[#123B35] mb-1">
                {tx(language, 'Available Portions *', 'கிடைக்கும் பங்குகள் *')}
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
                {tx(language, 'Donor-Measured Temp (°C)', 'உணவு வெப்பநிலை (°C)')}
              </label>
              <input
                id="don-temp"
                type="number"
                step="0.1"
                value={tempCelsius}
                onChange={(e) => setTempCelsius(e.target.value)}
                placeholder="64.5"
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm font-mono tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="don-prep" className="block text-xs font-semibold text-[#123B35] mb-1">
                {tx(language, 'Preparation Time *', 'தயாரித்த நேரம் *')}
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
                {tx(language, 'Pickup Deadline *', 'சேகரிப்பு கடைசி நேரம் *')}
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
                {tx(language, 'Consume-By Time *', 'உட்கொள்ள வேண்டிய கடைசி நேரம் *')}
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
                {tx(language, 'Food Category *', 'உணவுப் பிரிவு *')}
              </label>
              <select
                id="don-cat"
                value={foodCategory}
                onChange={(e) => setFoodCategory(e.target.value)}
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm"
              >
                {['COOKED_MEALS', 'CHILLED_MEALS', 'BAKERY_DRY', 'FRESH_PRODUCE'].map((c) => (
                  <option key={c} value={c}>
                    {formatFoodCategory(c, language)}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="don-pack" className="block text-xs font-semibold text-[#123B35] mb-1">
                {tx(language, 'Packaging & Seal Details *', 'பேக்கேஜிங் & முத்திரை விவரம் *')}
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

            <div className="md:col-span-3">
              <label htmlFor="don-comp" className="block text-xs font-semibold text-[#123B35] mb-1">
                {tx(
                  language,
                  'NutriLoop Food Composition Reference (ICMR-NIN / FAO — Optional)',
                  'ஊட்டச்சத்து ஆதார உணவுப் பட்டியல் (ICMR-NIN / FAO — விருப்பத்தேர்வு)'
                )}
              </label>
              <select
                id="don-comp"
                value={foodCompositionId}
                onChange={(e) => {
                  setFoodCompositionId(e.target.value);
                  const found = foodCatalog.find((f) => f.id === e.target.value);
                  if (found && !foodItem.trim()) {
                    setFoodItem(found.food_name);
                  }
                }}
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm"
              >
                <option value="">
                  {tx(
                    language,
                    'Auto-detect or leave unmapped (never fabricates nutrients)',
                    'தானாகக் கண்டறி அல்லது வெறுமையாக விடு'
                  )}
                </option>
                {foodCatalog.map((item) => (
                  <option key={item.id} value={item.id}>
                    {formatFoodName(item.food_name, language)} — {item.protein_g_per_100g}g{' '}
                    {tx(language, 'protein', 'புரதம்')}, {item.iron_mg_per_100g}mg{' '}
                    {tx(language, 'iron', 'இரும்பு')} / 100g ({item.source_dataset})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-xs text-[#64748B]">
              {tx(
                language,
                'Automatic 1-step dispatch: safety check, shelter matching, and delivery driver assignment run immediately on submit.',
                'ஒரே படியில் தானியங்கி அனுப்புதல்: பாதுகாப்பு சோதனை, காப்பகப் பொருத்தம் மற்றும் ஓட்டுநர் ஒதுக்கீடு உடனடியாக நடக்கும்.',
                'स्वचालित 1-चरणीय डिस्पैच: सबमिट करते ही सुरक्षा जाँच, आश्रय मिलान और ड्राइवर असाइनमेंट तुरंत हो जाता है।',
                'ఆటోమేటిక్ 1-స్టెప్ డిస్పాచ్: సమర్పించిన వెంటనే భద్రతా తనిఖీ, ఆశ్రయ సరిపోలిక మరియు డ్రైవర్ కేటాయింపు జరుగుతుంది.'
              )}
            </p>
            <button
              type="submit"
              disabled={submitting || verifiedDonors.length === 0}
              className="px-5 py-2.5 rounded-xl bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723] disabled:opacity-40"
            >
              {submitting
                ? tx(language, 'Submitting...', 'சமர்ப்பிக்கப்படுகிறது...')
                : tx(
                    language,
                    'Share & Auto-Dispatch',
                    'பகிர்ந்து தானாக அனுப்பு',
                    'साझा करें और ऑटो-डिस्पैच करें',
                    'పంచుకొని ఆటో-డిస్పాచ్ చేయండి'
                  )}
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
          {[
            { id: 'ALL', label: tx(language, 'All', 'அனைத்தும்') },
            { id: 'DISPATCHED', label: tx(language, 'Dispatched', 'அனுப்பப்பட்டது', 'डिस्पैच किया गया', 'పంపబడింది') },
            { id: 'INSPECTION_PASSED', label: tx(language, 'Ready', 'தயார்') },
            { id: 'DELIVERED', label: tx(language, 'Delivered', 'வழங்கப்பட்டது') },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                statusFilter === st.id
                  ? 'bg-[#123B35] text-white'
                  : 'text-[#64748B] hover:text-[#123B35]'
              }`}
            >
              {st.label}
            </button>
          ))}
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
              {tx(language, 'Edit Food Item', 'உணவைத் திருத்து')} ({editingBatch.batch_code})
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
            <label className="block text-xs font-semibold text-[#123B35] mb-1">
              {tx(language, 'Portions', 'பங்குகள்')}
            </label>
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
              {t.common.save}
            </button>
            <button
              type="button"
              onClick={() => setEditingBatch(null)}
              className="px-3 py-2 rounded-xl border border-[#123B35]/20 text-xs font-semibold"
            >
              {t.common.cancel}
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
                  <th className="py-3 px-6">{tx(language, 'Batch Code', 'தொகுதி எண்')}</th>
                  <th className="py-3 px-4">{tx(language, 'Food & Packaging', 'உணவு & பேக்கேஜிங்')}</th>
                  <th className="py-3 px-4 text-right">{tx(language, 'Allocated / Avail', 'ஒதுக்கீடு / மொத்தம்')}</th>
                  <th className="py-3 px-4">{tx(language, 'Deadlines', 'காலக்கெடு')}</th>
                  <th className="py-3 px-4">{tx(language, 'Status', 'நிலை')}</th>
                  <th className="py-3 px-6 text-right">{tx(language, 'Actions', 'செயல்கள்')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#123B35]/8 text-sm">
                {visibleBatches.map((batch) => {
                  const batchAllocs = allocations.filter((a) => a.donation_batch_id === batch.id);
                  const assignedRoute = routes.find((r) =>
                    r.stops?.some((s) => s.batch_code === batch.batch_code)
                  );
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
                        <div className="mt-1 text-xs text-[#64748B]">
                          {formatDietary(batch.dietary_type, language)}
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top">
                        <div className="font-semibold text-[#123B35]">
                          {formatFoodName(batch.food_item, language)}
                        </div>
                        <div className="mt-0.5 text-xs text-[#64748B]">
                          {formatDynamicDemoText(batch.packaging_details, language)}
                        </div>
                        {batchAllocs.length > 0 && (
                          <div className="mt-1.5 text-xs text-[#123B35]">
                            {tx(
                              language,
                              `Split across ${batchAllocs.length} allocation(s)`,
                              `${batchAllocs.length} ஒதுக்கீடு(களாக) பிரிக்கப்பட்டது`
                            )}
                            {assignedRoute?.delivery_partner_name && (
                              <span className="text-[#64748B]">
                                {' · '}
                                {tx(language, 'Driver:', 'ஓட்டுநர்:', 'ड्राइवर:', 'డ్రైవర్:')}{' '}
                                {assignedRoute.delivery_partner_name}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 align-top text-right font-mono tabular-nums text-xs">
                        <div className="font-bold text-[#123B35]">
                          {batch.portions_allocated} / {batch.portions_available}
                        </div>
                        <div className="text-[#64748B]">
                          {batch.portions_available - batch.portions_allocated} {tx(language, 'free', 'மீதம்')}
                        </div>
                        <div className="mt-1 text-[#64748B]">
                          {batch.temp_celsius !== null
                            ? `${batch.temp_celsius}°C`
                            : tx(language, 'No temp', 'வெப்பநிலை இல்லை')}
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top font-mono tabular-nums text-xs text-[#64748B]">
                        <div>
                          {tx(language, 'Pickup:', 'சேகரிப்பு:')}{' '}
                          {new Date(batch.pickup_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div>
                          {tx(language, 'Consume:', 'உட்கொள்ள:')}{' '}
                          {new Date(batch.consume_by_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top text-xs">
                        <div className="font-semibold text-[#123B35]">
                          {formatBatchStatus(batch.status, language)}
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
                              title={tx(language, 'Edit before allocation', 'ஒதுக்கீட்டிற்கு முன் திருத்து')}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canCancel && (
                            <button
                              type="button"
                              onClick={() => setCancellingBatch(batch)}
                              className="p-1.5 rounded-lg border border-[#FF795C]/40 text-[#FF795C] hover:bg-[#FF795C]/10"
                              title={tx(language, 'Cancel batch with recorded reason', 'காரணத்துடன் ரத்து செய்')}
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
        title={tx(
          language,
          `Cancel Donation ${cancellingBatch?.batch_code ?? ''}`,
          `தானத்தை ரத்து செய் ${cancellingBatch?.batch_code ?? ''}`
        )}
        description={tx(
          language,
          'Cancelling a donation records an immutable audit trail entry and withdraws it from surplus matching.',
          'தானத்தை ரத்து செய்வது நிரந்தர தணிக்கைப் பதிவில் சேர்க்கப்பட்டு பொருத்தத்திலிருந்து நீக்கப்படும்.'
        )}
        confirmLabel={tx(language, 'Cancel Donation', 'தானத்தை ரத்து செய்')}
        destructive
        requireReason
        reasonLabel={tx(language, 'Cancellation Reason', 'ரத்து செய்வதற்கான காரணம்')}
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
