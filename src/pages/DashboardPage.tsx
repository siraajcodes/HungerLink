import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, HandHeart, PackagePlus, QrCode, ShieldAlert, Sprout } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatBatchStatus,
  formatDietary,
  formatFoodName,
  formatNutrientName,
  formatOrgName,
  tx,
} from '../i18n/helpers';

export const DashboardPage: React.FC = () => {
  const {
    profile,
    activeOrganisation,
    organisations,
    batches,
    requests,
    routes,
    impactRecords,
    targetedRequests,
    communityGapAnalyses,
    dataLoading,
    language,
  } = useApp();

  const role = profile?.role ?? 'FOOD_DONOR';

  const visibleBatches =
    role === 'FOOD_DONOR' && activeOrganisation
      ? batches.filter((b) => b.donor_id === activeOrganisation.id)
      : batches;

  const activeBatchesCount = visibleBatches.filter(
    (b) => !['DELIVERED', 'CANCELLED', 'EXPIRED', 'INSPECTION_REJECTED'].includes(b.status)
  ).length;

  const confirmedMeals = impactRecords.reduce((sum, r) => sum + r.portions_delivered, 0);
  const openNeedsCount = targetedRequests.filter((tr) => tr.status === 'APPROVED_PUBLISHED').length;
  const openMealRequestsCount = requests.filter(
    (r) => r.status === 'OPEN' || r.status === 'PARTIALLY_ALLOCATED'
  ).length;

  const topGap = Object.values(communityGapAnalyses)
    .flatMap((a) => a.highest_priority_gaps.map((g) => ({ orgId: a.org_id, gap: g })))
    .sort((a, b) => b.gap.deficit_ratio * b.gap.priority_weight - a.gap.deficit_ratio * a.gap.priority_weight)[0];

  const primaryAction = (() => {
    if (role === 'VERIFIED_NGO' || role === 'COMMUNITY_KITCHEN') {
      return { to: '/requests', label: tx(language, 'Request Meals', 'உணவு கோரிக்கை') };
    }
    if (role === 'DELIVERY_PARTNER') {
      return { to: '/routes', label: tx(language, 'View My Deliveries', 'எனது விநியோகங்கள்') };
    }
    if (role === 'FIELD_WORKER') {
      return { to: '/field-intake', label: tx(language, 'Log Community Request', 'சமூக கோரிக்கை பதிவு') };
    }
    return { to: '/donations', label: tx(language, 'Donate Extra Food', 'உணவு தானம் செய்க') };
  })();

  if (dataLoading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((idx) => (
            <div key={idx} className="h-28 rounded-2xl bg-white border border-[#123B35]/10 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-white border border-[#123B35]/10 animate-pulse" />
      </div>
    );
  }

  const firstName = profile?.full_name.split(' ')[0] ?? tx(language, 'Welcome', 'நல்வரவு');

  return (
    <div className="space-y-8">
      {/* Calm Greeting + 1 Clear Action */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#123B35]">
            {tx(language, `Hello, ${firstName}`, `வணக்கம், ${firstName}`)}
          </h2>
          <p className="mt-1 text-sm text-[#64748B]">
            {activeOrganisation
              ? tx(
                  language,
                  `${activeOrganisation.name} · Here is what needs attention today.`,
                  `${formatOrgName(activeOrganisation.name, language)} · இன்று கவனிக்க வேண்டியவை இங்கே.`
                )
              : tx(
                  language,
                  'Here is a simple overview of meals being shared today.',
                  'இன்று பகிரப்படும் உணவுகளின் எளிய சுருக்கம் இங்கே.'
                )}
          </p>
        </div>

        <Link
          to={primaryAction.to}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#123B35] text-white text-sm font-semibold hover:bg-[#0B2723] transition-colors whitespace-nowrap shrink-0"
        >
          <span>{primaryAction.label}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Verification Reminder Only When Needed */}
      {activeOrganisation && activeOrganisation.verification_status !== 'verified' && role !== 'ADMINISTRATOR' && (
        <div className="rounded-2xl bg-white border border-[#FF795C] p-5 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-[#FF795C] shrink-0 mt-0.5" />
          <div className="text-sm text-[#123B35]">
            <strong>{tx(language, 'Account under review.', 'கணக்கு பரிசீலனையில் உள்ளது.')}</strong>{' '}
            {tx(
              language,
              'An administrator will verify your organisation before live donations or requests go out.',
              'நேரடி உணவு தானங்கள் அல்லது கோரிக்கைகள் தொடங்குவதற்கு முன் நிர்வாகி உங்கள் நிறுவனத்தைச் சரிபார்ப்பார்.'
            )}
          </div>
        </div>
      )}

      {/* 3 Simple Numbers (Airy & Scannable) */}
      <section aria-label={tx(language, "Today's summary", 'இன்றைய சுருக்கம்')} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-[#123B35]/10 p-6">
          <div className="text-xs font-medium text-[#64748B]">
            {tx(language, 'Meals Delivered', 'வழங்கப்பட்ட உணவுகள்')}
          </div>
          <div className="mt-2 text-3xl font-extrabold font-display tabular-nums text-[#123B35]">
            {confirmedMeals}
          </div>
          <div className="mt-1 text-xs text-[#64748B]">
            {tx(language, 'Confirmed at handover', 'ஒப்படைப்பில் உறுதிப்படுத்தப்பட்டது')}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-[#123B35]/10 p-6">
          <div className="text-xs font-medium text-[#64748B]">
            {role === 'DELIVERY_PARTNER'
              ? tx(language, 'Active Routes', 'செயலில் உள்ள வழிகள்')
              : tx(language, 'Active Food Batches', 'செயலில் உள்ள உணவுத் தொகுதிகள்')}
          </div>
          <div className="mt-2 text-3xl font-extrabold font-display tabular-nums text-[#123B35]">
            {role === 'DELIVERY_PARTNER'
              ? routes.filter((r) => r.route_status !== 'COMPLETED' && r.route_status !== 'CANCELLED').length
              : activeBatchesCount}
          </div>
          <div className="mt-1 text-xs text-[#64748B]">
            {tx(
              language,
              `${openMealRequestsCount} shelter request(s) open`,
              `${openMealRequestsCount} காப்பகக் கோரிக்கை(கள்) நிலுவையில்`
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-[#123B35]/10 p-6">
          <div className="text-xs font-medium text-[#64748B]">
            {tx(language, 'Nutrition Needs (NutriLoop)', 'ஊட்டச்சத்து தேவைகள்')}
          </div>
          <div className="mt-2 text-3xl font-extrabold font-display tabular-nums text-[#123B35]">
            {openNeedsCount}
          </div>
          <div className="mt-1 text-xs text-[#64748B] truncate">
            {topGap
              ? tx(
                  language,
                  `Most needed: ${topGap.gap.display_name}`,
                  `அதிகம் தேவை: ${formatNutrientName(topGap.gap.display_name, language)}`
                )
              : tx(language, 'All communities tracked', 'அனைத்து சமூகங்களும் கண்காணிக்கப்படுகின்றன')}
          </div>
        </div>
      </section>

      {/* Simple Quick Tasks */}
      <section aria-label={tx(language, 'Quick actions', 'விரைவு செயல்கள்')} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to={role === 'VERIFIED_NGO' || role === 'COMMUNITY_KITCHEN' ? '/requests' : '/donations'}
          className="rounded-2xl bg-white border border-[#123B35]/10 p-5 hover:border-[#123B35]/30 transition-colors flex items-start gap-3.5"
        >
          {role === 'VERIFIED_NGO' || role === 'COMMUNITY_KITCHEN' ? (
            <HandHeart className="w-5 h-5 text-[#123B35] shrink-0 mt-0.5" />
          ) : (
            <PackagePlus className="w-5 h-5 text-[#123B35] shrink-0 mt-0.5" />
          )}
          <div>
            <div className="text-sm font-bold text-[#123B35]">
              {role === 'VERIFIED_NGO' || role === 'COMMUNITY_KITCHEN'
                ? tx(language, 'Request Meals', 'உணவு கோரிக்கை')
                : tx(language, 'Share Extra Food', 'உபரி உணவைப் பகிர்க')}
            </div>
            <p className="mt-1 text-xs text-[#64748B] leading-relaxed">
              {role === 'VERIFIED_NGO' || role === 'COMMUNITY_KITCHEN'
                ? tx(
                    language,
                    'Let nearby donors know how many meals your community needs.',
                    'உங்கள் சமூகத்திற்கு எத்தனை உணவு தேவை என்பதை அருகிலுள்ள தானதாரர்களுக்குத் தெரிவியுங்கள்.'
                  )
                : tx(
                    language,
                    'List fresh surplus meals or respond to a shelter need.',
                    'புதிய உபரி உணவுகளைப் பதிவிடுங்கள் அல்லது காப்பகத் தேவைக்கு உதவுங்கள்.'
                  )}
            </p>
          </div>
        </Link>

        <Link
          to="/nutriloop"
          className="rounded-2xl bg-white border border-[#123B35]/10 p-5 hover:border-[#123B35]/30 transition-colors flex items-start gap-3.5"
        >
          <Sprout className="w-5 h-5 text-[#123B35] shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-[#123B35]">
              {tx(language, 'Check Nutrition Gaps', 'ஊட்டச்சத்து குறைபாடுகளைப் பார்')}
            </div>
            <p className="mt-1 text-xs text-[#64748B] leading-relaxed">
              {tx(
                language,
                'See which nutrients local shelters are missing and what foods help most.',
                'உள்ளூர் காப்பகங்களில் எந்த ஊட்டச்சத்து குறைவாக உள்ளது, எந்த உணவுகள் உதவும் என்பதைப் பாருங்கள்.'
              )}
            </p>
          </div>
        </Link>

        <Link
          to="/mealtrace"
          className="rounded-2xl bg-white border border-[#123B35]/10 p-5 hover:border-[#123B35]/30 transition-colors flex items-start gap-3.5"
        >
          <QrCode className="w-5 h-5 text-[#123B35] shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-[#123B35]">
              {tx(language, 'Scan Meal QR', 'உணவு QR ஸ்கேன் செய்க')}
            </div>
            <p className="mt-1 text-xs text-[#64748B] leading-relaxed">
              {tx(
                language,
                'Confirm pickup or delivery in seconds using your phone camera.',
                'உங்கள் தொலைபேசி கேமரா மூலம் சேகரிப்பு அல்லது விநியோகத்தை நொடிகளில் உறுதிப்படுத்துங்கள்.'
              )}
            </p>
          </div>
        </Link>
      </section>

      {/* Clean, Minimal Recent Food List */}
      <section className="rounded-2xl bg-white border border-[#123B35]/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#123B35]/10 flex items-center justify-between gap-4">
          <h3 className="text-base font-bold font-display text-[#123B35]">
            {tx(language, 'Recent Food Batches', 'சமீபத்திய உணவுத் தொகுதிகள்')}
          </h3>
          <Link to="/donations" className="text-xs font-semibold text-[#123B35] hover:underline">
            {tx(language, 'See all', 'அனைத்தையும் பார்')}
          </Link>
        </div>

        {visibleBatches.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm text-[#64748B]">
              {tx(language, 'No food batches listed yet.', 'இதுவரை உணவுத் தொகுதிகள் எதுவும் பதிவிடப்படவில்லை.')}
            </p>
            <Link
              to="/donations"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#123B35] text-white text-xs font-semibold"
            >
              {tx(language, 'Share First Meal', 'முதல் உணவைப் பகிர்க')}
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#123B35]/8">
            {visibleBatches.slice(0, 5).map((batch) => {
              const donor = organisations.find((o) => o.id === batch.donor_id);
              return (
                <div
                  key={batch.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#FFF9EF]/40 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#123B35] truncate">
                      {formatFoodName(batch.food_item, language)}
                    </div>
                    <div className="mt-0.5 text-xs text-[#64748B]">
                      {formatOrgName(donor?.name, language) || tx(language, 'Verified Donor', 'சரிபார்க்கப்பட்ட தானதாரர்')} ·{' '}
                      {formatDietary(batch.dietary_type, language)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs shrink-0">
                    <span className="font-mono tabular-nums font-semibold text-[#123B35]">
                      {batch.portions_available} {tx(language, 'meals', 'உணவுகள்')}
                    </span>
                    <span className="text-[#64748B]">{formatBatchStatus(batch.status, language)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
