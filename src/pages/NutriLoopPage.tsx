import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Download,
  Lock,
  Plus,
  Sparkles,
  Users,
  XCircle,
} from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useApp } from '../context/AppContext';
import {
  formatDietary,
  formatFoodName,
  formatInventoryStage,
  formatNutriCategory,
  formatNutrientName,
  formatOrgName,
  formatTargetedStatus,
  tx,
} from '../i18n/helpers';
import { buildCsvDocument } from '../lib/matchingEngine';
import { canPerformAction } from '../lib/rbac';
import type { DietaryPreference, DietaryType } from '../types/database';
import type {
  FoodCompositionCategory,
  InventoryStage,
  TargetedDonationRequest,
} from '../types/nutriloop';

type NutriLoopTab = 'overview' | 'requests' | 'inventory' | 'more';

const FOOD_CATEGORIES: FoodCompositionCategory[] = [
  'CEREALS_GRAINS',
  'PULSES_LEGUMES',
  'DAIRY_PROTEIN',
  'EGG_MEAT_FISH',
  'LEAFY_VEGETABLES',
  'FRUITS_VEGETABLES',
  'NUTS_SEEDS',
  'MIXED_COOKED_MEAL',
];

export const NutriLoopPage: React.FC = () => {
  const {
    language,
    profile,
    activeOrganisation,
    organisations,
    batches,
    foodCatalog,
    nutrientConfigs,
    communityProfiles,
    communityInventory,
    targetedRequests,
    nutritionalSnapshots,
    communityGapAnalyses,
    upsertCommunityNutritionProfile,
    recordCommunityInventory,
    generateTargetedRequestsForOrg,
    approveTargetedDonationRequest,
    dismissTargetedDonationRequest,
    upsertFoodCompositionItem,
    addCustomNutrientConfig,
  } = useApp();

  const role = profile?.role ?? 'FOOD_DONOR';
  const isAdmin = role === 'ADMINISTRATOR';
  const canEditProfileRole = canPerformAction(role, 'nutriloop:edit_profile');
  const canGenerateRole = canPerformAction(role, 'nutriloop:generate_requests');
  const canApproveRole = canPerformAction(role, 'nutriloop:approve_requests');
  const canManageCatalog = canPerformAction(role, 'nutriloop:manage_catalog');
  const canDonate = canPerformAction(role, 'donation:create');

  const recipientOrgs = useMemo(
    () =>
      organisations.filter(
        (o) =>
          (o.org_type === 'VERIFIED_NGO' || o.org_type === 'COMMUNITY_KITCHEN') &&
          o.verification_status === 'verified'
      ),
    [organisations]
  );

  const defaultOrgId = useMemo(() => {
    if (
      (role === 'VERIFIED_NGO' || role === 'COMMUNITY_KITCHEN') &&
      activeOrganisation &&
      recipientOrgs.some((o) => o.id === activeOrganisation.id)
    ) {
      return activeOrganisation.id;
    }
    return communityProfiles[0]?.org_id ?? recipientOrgs[0]?.id ?? '';
  }, [role, activeOrganisation, recipientOrgs, communityProfiles]);

  const [selectedOrgId, setSelectedOrgId] = useState(defaultOrgId);
  const [activeTab, setActiveTab] = useState<NutriLoopTab>('overview');
  const [showMethodDetails, setShowMethodDetails] = useState(false);
  const [showAllStages, setShowAllStages] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedOrgId && defaultOrgId) {
      setSelectedOrgId(defaultOrgId);
    }
  }, [selectedOrgId, defaultOrgId]);

  const canEditSelectedOrg =
    canEditProfileRole &&
    (isAdmin ||
      ((role === 'VERIFIED_NGO' || role === 'COMMUNITY_KITCHEN') &&
        activeOrganisation?.id === selectedOrgId));

  const canGenerateForSelectedOrg = canGenerateRole && canEditSelectedOrg;
  const canApproveForOrg = (orgId: string) =>
    canApproveRole &&
    (isAdmin ||
      ((role === 'VERIFIED_NGO' || role === 'COMMUNITY_KITCHEN') &&
        activeOrganisation?.id === orgId));

  const selectedOrg = organisations.find((o) => o.id === selectedOrgId);
  const selectedProfile = communityProfiles.find((p) => p.org_id === selectedOrgId);
  const selectedAnalysis = selectedOrgId ? communityGapAnalyses[selectedOrgId] : undefined;

  // Profile editor state
  const [childrenCount, setChildrenCount] = useState('15');
  const [adolescentsCount, setAdolescentsCount] = useState('10');
  const [adultsCount, setAdultsCount] = useState('25');
  const [pregnantCount, setPregnantCount] = useState('4');
  const [elderlyCount, setElderlyCount] = useState('6');
  const [dietaryRestriction, setDietaryRestriction] = useState<DietaryPreference>('VEGETARIAN');
  const [horizonDays, setHorizonDays] = useState('1');
  const [profileNotes, setProfileNotes] = useState('');

  useEffect(() => {
    if (selectedProfile) {
      setChildrenCount(String(selectedProfile.children_1_9_count));
      setAdolescentsCount(String(selectedProfile.adolescents_10_18_count));
      setAdultsCount(String(selectedProfile.adults_19_59_count));
      setPregnantCount(String(selectedProfile.pregnant_lactating_count));
      setElderlyCount(String(selectedProfile.elderly_60_plus_count));
      setDietaryRestriction(selectedProfile.dietary_restriction);
      setHorizonDays(String(selectedProfile.planning_horizon_days));
      setProfileNotes(selectedProfile.notes ?? '');
    }
  }, [selectedProfile]);

  // Inventory form state
  const [invFoodCompId, setInvFoodCompId] = useState<string>(foodCatalog[0]?.id ?? '');
  const [invCustomName, setInvCustomName] = useState<string>(foodCatalog[0]?.food_name ?? '');
  const [invPortions, setInvPortions] = useState('40');
  const [invGrams, setInvGrams] = useState(String(foodCatalog[0]?.standard_portion_grams ?? 250));
  const [invStage, setInvStage] = useState<InventoryStage>('AVAILABLE');

  // Dialogs
  const [approvingReq, setApprovingReq] = useState<TargetedDonationRequest | null>(null);
  const [dismissingReq, setDismissingReq] = useState<TargetedDonationRequest | null>(null);

  // Admin reference forms
  const [newFoodCode, setNewFoodCode] = useState('');
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodCat, setNewFoodCat] = useState<FoodCompositionCategory>('PULSES_LEGUMES');
  const [newFoodDiet, setNewFoodDiet] = useState<DietaryType>('VEGAN');
  const [newFoodGrams, setNewFoodGrams] = useState('200');
  const [newFoodKcal, setNewFoodKcal] = useState('140');
  const [newFoodProt, setNewFoodProt] = useState('9.2');
  const [newFoodIron, setNewFoodIron] = useState('2.8');
  const [newFoodCalc, setNewFoodCalc] = useState('65');
  const [newFoodVitA, setNewFoodVitA] = useState('25');
  const [newFoodFibre, setNewFoodFibre] = useState('5.1');
  const [newFoodSource, setNewFoodSource] = useState('ICMR-NIN IFCT 2017');
  const [newFoodRef, setNewFoodRef] = useState('');

  const [newNutrKey, setNewNutrKey] = useState('');
  const [newNutrName, setNewNutrName] = useState('');
  const [newNutrUnit, setNewNutrUnit] = useState('mg');
  const [newNutrRda, setNewNutrRda] = useState('80');
  const [newNutrWeight, setNewNutrWeight] = useState('0.10');
  const [newNutrGuideline, setNewNutrGuideline] = useState('ICMR-NIN RDA 2020');

  const orgInventory = useMemo(
    () => communityInventory.filter((r) => r.org_id === selectedOrgId),
    [communityInventory, selectedOrgId]
  );

  const visibleTargetedRequests = useMemo(() => {
    if (role === 'FOOD_DONOR' || role === 'FIELD_WORKER') {
      return targetedRequests.filter((tr) =>
        ['APPROVED_PUBLISHED', 'MATCHED', 'FULFILLED'].includes(tr.status)
      );
    }
    if (selectedOrgId && !isAdmin) {
      return targetedRequests.filter((tr) => tr.org_id === selectedOrgId);
    }
    return targetedRequests;
  }, [targetedRequests, role, selectedOrgId, isAdmin]);

  const draftRequests = visibleTargetedRequests.filter((tr) => tr.status === 'DRAFT_GENERATED');
  const activeRequests = visibleTargetedRequests.filter((tr) => tr.status !== 'DRAFT_GENERATED');

  const chartData = useMemo(() => {
    if (!selectedAnalysis) return [];
    return selectedAnalysis.nutrients.map((n) => {
      const coveredPct = Math.min(100, Math.round(n.adequacy_pct));
      const missingPct = Math.max(0, 100 - coveredPct);
      return {
        name: formatNutrientName(n.display_name, language, true),
        Covered: coveredPct,
        Missing: missingPct,
      };
    });
  }, [selectedAnalysis, language]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!selectedOrgId) return;
    const res = await upsertCommunityNutritionProfile({
      org_id: selectedOrgId,
      children_1_9_count: Number(childrenCount),
      adolescents_10_18_count: Number(adolescentsCount),
      adults_19_59_count: Number(adultsCount),
      pregnant_lactating_count: Number(pregnantCount),
      elderly_60_plus_count: Number(elderlyCount),
      dietary_restriction: dietaryRestriction,
      planning_horizon_days: Number(horizonDays),
      notes: profileNotes.trim() || null,
    });
    if (res.error) setErrorMsg(res.error);
  };

  const handleLogInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!selectedOrgId) return;
    const res = await recordCommunityInventory({
      org_id: selectedOrgId,
      food_composition_id: invFoodCompId === 'UNMAPPED' ? null : invFoodCompId || null,
      custom_food_name: invCustomName,
      quantity_portions: Number(invPortions),
      portion_grams: Number(invGrams),
      inventory_stage: invStage,
    });
    if (res.error) setErrorMsg(res.error);
  };

  const handleGenerateRequests = async () => {
    setErrorMsg(null);
    if (!selectedOrgId) return;
    const res = await generateTargetedRequestsForOrg(selectedOrgId);
    if (res.error) setErrorMsg(res.error);
    else setActiveTab('requests');
  };

  const handleAddFoodItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = await upsertFoodCompositionItem({
      food_code: newFoodCode,
      food_name: newFoodName,
      food_category: newFoodCat,
      dietary_type: newFoodDiet,
      standard_portion_grams: Number(newFoodGrams),
      calories_kcal_per_100g: Number(newFoodKcal),
      protein_g_per_100g: Number(newFoodProt),
      iron_mg_per_100g: Number(newFoodIron),
      calcium_mg_per_100g: Number(newFoodCalc),
      vitamin_a_mcg_per_100g: Number(newFoodVitA),
      dietary_fibre_g_per_100g: Number(newFoodFibre),
      source_dataset: newFoodSource,
      source_reference: newFoodRef || 'Admin verified entry',
    });
    if (res.error) setErrorMsg(res.error);
    else {
      setNewFoodCode('');
      setNewFoodName('');
      setNewFoodRef('');
    }
  };

  const handleAddNutrient = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = await addCustomNutrientConfig({
      nutrient_key: newNutrKey,
      display_name: newNutrName,
      unit: newNutrUnit,
      adult_daily_rda: Number(newNutrRda),
      priority_weight: Number(newNutrWeight),
      source_guideline: newNutrGuideline,
    });
    if (res.error) setErrorMsg(res.error);
    else {
      setNewNutrKey('');
      setNewNutrName('');
    }
  };

  const exportGapCsv = () => {
    if (!selectedAnalysis) return;
    const csv = buildCsvDocument(
      [
        tx(language, 'Community', 'சமூகம்'),
        tx(language, 'Nutrient', 'ஊட்டச்சத்து'),
        tx(language, 'Unit', 'அலகு'),
        tx(language, 'Target', 'இலக்கு'),
        tx(language, 'Available', 'இருப்பு'),
        tx(language, 'Distributed', 'விநியோகம்'),
        tx(language, 'Consumed', 'உட்கொள்ளப்பட்டது'),
        tx(language, 'Still Needed', 'இன்னும் தேவை'),
        tx(language, 'Coverage %', 'நிறைவு %'),
      ],
      selectedAnalysis.nutrients.map((n) => [
        formatOrgName(selectedOrg?.name, language) || selectedOrgId,
        formatNutrientName(n.display_name, language),
        n.unit,
        n.requirement,
        n.available,
        n.distributed,
        n.reported_consumed,
        n.gap,
        n.adequacy_pct,
      ])
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nutriloop-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const tabs: Array<{ id: NutriLoopTab; label: string; count?: number }> = [
    { id: 'overview', label: tx(language, 'Overview', 'கண்ணோட்டம்') },
    {
      id: 'requests',
      label: tx(language, 'Needed Foods', 'தேவையான உணவுகள்'),
      count: visibleTargetedRequests.length,
    },
    { id: 'inventory', label: tx(language, 'Food Stock & People', 'உணவு இருப்பு & மக்கள்') },
    { id: 'more', label: tx(language, 'Impact & Reference', 'தாக்கம் & தரவு') },
  ];

  const coveredBarLabel = tx(language, 'Covered', 'நிறைவானது');
  const missingBarLabel = tx(language, 'Still Needed', 'இன்னும் தேவை');

  return (
    <div className="space-y-6">
      {/* Simple Page Header + Community Picker */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#123B35]">
            {tx(language, 'Community Nutrition', 'சமூக ஊட்டச்சத்து')}
          </h2>
          <p className="mt-1 text-sm text-[#64748B]">
            {tx(
              language,
              'See which nutrients a shelter is short on and suggest the right foods for donors to share.',
              'ஒரு காப்பகத்தில் எந்த ஊட்டச்சத்துக்கள் குறைவாக உள்ளன என்பதைக் கண்டு, தானதாரர்கள் பகிர வேண்டிய சரியான உணவுகளைப் பரிந்துரைக்கவும்.'
            )}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <select
            aria-label={tx(language, 'Choose community', 'சமூகத்தைத் தேர்ந்தெடுக்கவும்')}
            value={selectedOrgId}
            onChange={(e) => {
              setSelectedOrgId(e.target.value);
              setErrorMsg(null);
            }}
            className="min-h-[44px] rounded-xl border border-[#123B35]/20 bg-white px-3.5 py-2 text-sm font-medium text-[#123B35]"
          >
            {recipientOrgs.length === 0 && (
              <option value="">{tx(language, 'No shelters yet', 'இன்னும் காப்பகங்கள் இல்லை')}</option>
            )}
            {recipientOrgs.map((org) => (
              <option key={org.id} value={org.id}>
                {formatOrgName(org.name, language)}
              </option>
            ))}
          </select>

          {canGenerateForSelectedOrg && (
            <button
              type="button"
              onClick={() => void handleGenerateRequests()}
              disabled={!selectedAnalysis || selectedAnalysis.highest_priority_gaps.length === 0}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#D7F36B] text-[#123B35] text-xs font-bold hover:bg-[#C8E655] disabled:opacity-40 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              {tx(language, 'Suggest Needed Foods', 'தேவையான உணவுகளைப் பரிந்துரை')}
            </button>
          )}
        </div>
      </div>

      {/* Clean 4-Tab Bar */}
      <div
        role="tablist"
        aria-label={tx(language, 'Nutrition sections', 'ஊட்டச்சத்து பிரிவுகள்')}
        className="flex items-center gap-1 overflow-x-auto border-b border-[#123B35]/10"
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setActiveTab(tab.id);
                setErrorMsg(null);
              }}
              className={`min-h-[44px] px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
                active
                  ? 'border-[#123B35] text-[#123B35]'
                  : 'border-transparent text-[#64748B] hover:text-[#123B35]'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className="font-mono text-xs opacity-70">{tab.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="rounded-xl border border-[#FF795C] bg-[#FF795C]/10 px-4 py-3 text-xs font-medium text-[#123B35]"
        >
          {errorMsg}
        </div>
      )}

      {/* TAB 1: SIMPLE OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {!selectedAnalysis ? (
            <div className="rounded-2xl bg-white border border-[#123B35]/10 p-10 text-center space-y-3">
              <Users className="w-8 h-8 text-[#64748B] mx-auto" />
              <h3 className="text-base font-bold font-display text-[#123B35]">
                {tx(
                  language,
                  "Set up this shelter's people & food stock first",
                  'முதலில் இந்தக் காப்பகத்தின் மக்கள் எண்ணிக்கை மற்றும் உணவு இருப்பை உள்ளிடவும்'
                )}
              </h3>
              <p className="text-xs text-[#64748B] max-w-md mx-auto">
                {tx(
                  language,
                  'Add how many people eat here and what food is currently in the kitchen to see what nutrients are missing.',
                  'எந்த ஊட்டச்சத்துக்கள் குறைவாக உள்ளன என்பதைக் காண, இங்கு எத்தனை பேர் உணவருந்துகிறார்கள் மற்றும் சமையலறையில் தற்போது என்ன உணவு உள்ளது என்பதைச் சேர்க்கவும்.'
                )}
              </p>
              {canEditSelectedOrg && (
                <button
                  type="button"
                  onClick={() => setActiveTab('inventory')}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#123B35] text-white text-xs font-semibold"
                >
                  {tx(language, 'Add People & Food Stock', 'மக்கள் & உணவு இருப்பைச் சேர்க்கவும்')}
                </button>
              )}
            </div>
          ) : (
            <>
              {/* 3 Simple Numbers */}
              <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-white border border-[#123B35]/10 p-6">
                  <div className="text-xs font-medium text-[#64748B]">
                    {tx(language, 'Estimated Nutrition Covered', 'மதிப்பிடப்பட்ட ஊட்டச்சத்து நிறைவு')}
                  </div>
                  <div className="mt-2 text-3xl font-extrabold font-display tabular-nums text-[#123B35]">
                    {selectedAnalysis.overall_adequacy_pct.toFixed(0)}%
                  </div>
                  <div className="mt-1 text-xs text-[#64748B]">
                    {tx(
                      language,
                      `For ${selectedAnalysis.total_beneficiaries} people (${selectedAnalysis.planning_horizon_days} day)`,
                      `${selectedAnalysis.total_beneficiaries} பேருக்கு (${selectedAnalysis.planning_horizon_days} நாள்)`
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#123B35]/10 p-6">
                  <div className="text-xs font-medium text-[#64748B]">
                    {tx(language, 'Missing Most Right Now', 'தற்போது அதிகம் குறைவானது')}
                  </div>
                  <div className="mt-2 text-2xl font-extrabold font-display text-[#FF795C] truncate">
                    {selectedAnalysis.highest_priority_gaps[0]
                      ? formatNutrientName(selectedAnalysis.highest_priority_gaps[0].display_name, language)
                      : tx(language, 'All balanced', 'அனைத்தும் சமநிலை')}
                  </div>
                  <div className="mt-1 text-xs text-[#64748B]">
                    {selectedAnalysis.highest_priority_gaps.length > 0
                      ? tx(
                          language,
                          `${selectedAnalysis.highest_priority_gaps.length} nutrient(s) need attention`,
                          `${selectedAnalysis.highest_priority_gaps.length} ஊட்டச்சத்துக்களுக்குக் கவனம் தேவை`
                        )
                      : tx(language, 'Meets daily reference targets', 'தினசரி இலக்குகளைப் பூர்த்தி செய்கிறது')}
                  </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#123B35]/10 p-6">
                  <div className="text-xs font-medium text-[#64748B]">
                    {tx(language, 'Food Currently Logged', 'தற்போது பதிவான உணவு')}
                  </div>
                  <div className="mt-2 text-3xl font-extrabold font-display tabular-nums text-[#123B35]">
                    {selectedAnalysis.total_portions_available}{' '}
                    {tx(language, 'meals', 'உணவுகள்')}
                  </div>
                  <div className="mt-1 text-xs text-[#64748B]">
                    {tx(
                      language,
                      `${selectedAnalysis.total_portions_distributed} distributed · ${selectedAnalysis.total_portions_reported_consumed} reported eaten`,
                      `${selectedAnalysis.total_portions_distributed} விநியோகம் · ${selectedAnalysis.total_portions_reported_consumed} உட்கொள்ளப்பட்டவை`
                    )}
                  </div>
                </div>
              </section>

              {selectedAnalysis.unmapped_inventory_count > 0 && (
                <div className="rounded-xl bg-white border border-[#FF795C] p-4 flex items-center gap-3 text-xs text-[#123B35]">
                  <AlertTriangle className="w-4 h-4 text-[#FF795C] shrink-0" />
                  <span>
                    {tx(
                      language,
                      `${selectedAnalysis.unmapped_inventory_count} logged food item(s) had no reference match and were left out rather than guessed.`,
                      `பதிவான ${selectedAnalysis.unmapped_inventory_count} உணவுப் பொருட்களுக்கு தரவுப் பொருத்தம் இல்லாததால், ஊகிக்காமல் தவிர்க்கப்பட்டன.`
                    )}
                  </span>
                </div>
              )}

              {/* Simple Visual Bar Chart */}
              <section className="rounded-2xl bg-white border border-[#123B35]/10 p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold font-display text-[#123B35]">
                      {tx(language, "What's Covered vs. Still Needed", 'நிறைவானது மற்றும் இன்னும் தேவையானது')}
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      {tx(
                        language,
                        'Dark green shows what is available; coral shows what is still missing.',
                        'அடர் பச்சை இருப்பைக் காட்டுகிறது; பவள நிறம் இன்னும் குறைவாக உள்ளதைக் காட்டுகிறது.'
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={exportGapCsv}
                    className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#123B35]/20 text-xs font-semibold text-[#123B35] hover:bg-[#FFF9EF]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {tx(language, 'Download CSV', 'CSV பதிவிறக்கு')}
                  </button>
                </div>

                <div className="w-full h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 12, left: -16, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#123B35' }} />
                      <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: '#64748B' }} />
                      <Tooltip
                        formatter={(value: unknown, name: unknown) => [`${String(value)}%`, String(name)]}
                        contentStyle={{ borderRadius: '12px', borderColor: 'rgba(18,59,53,0.15)', fontSize: '12px' }}
                      />
                      <Bar dataKey="Covered" name={coveredBarLabel} stackId="a" fill="#123B35" />
                      <Bar dataKey="Missing" name={missingBarLabel} stackId="a" fill="#FF795C" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Simple Nutrient Table with Optional Stage Columns */}
              <section className="rounded-2xl bg-white border border-[#123B35]/10 overflow-hidden">
                <div className="px-6 py-4 border-b border-[#123B35]/10 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-bold font-display text-[#123B35]">
                    {tx(language, 'Nutrient Summary', 'ஊட்டச்சத்து சுருக்கம்')}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAllStages((v) => !v)}
                    className="text-xs font-semibold text-[#64748B] hover:text-[#123B35]"
                  >
                    {showAllStages
                      ? tx(language, 'Hide extra columns', 'கூடுதல் நெடுவரிசைகளை மறை')
                      : tx(language, 'Show distributed & consumed', 'விநியோகம் & உட்கொள்ளலைக் காட்டு')}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#123B35]/10 bg-[#FFF9EF]/60 text-xs font-semibold text-[#64748B]">
                        <th className="py-3 px-6">{tx(language, 'Nutrient', 'ஊட்டச்சத்து')}</th>
                        <th className="py-3 px-4 text-right">{tx(language, 'Target', 'இலக்கு')}</th>
                        <th className="py-3 px-4 text-right">{tx(language, 'Available', 'இருப்பு')}</th>
                        {showAllStages && (
                          <th className="py-3 px-4 text-right">{tx(language, 'Distributed', 'விநியோகம்')}</th>
                        )}
                        {showAllStages && (
                          <th className="py-3 px-4 text-right">{tx(language, 'Reported Eaten', 'உட்கொள்ளப்பட்டது')}</th>
                        )}
                        <th className="py-3 px-6 text-right">{tx(language, 'Still Needed', 'இன்னும் தேவை')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#123B35]/8 text-sm">
                      {selectedAnalysis.nutrients.map((n) => (
                        <tr key={n.nutrient_key} className="hover:bg-[#FFF9EF]/40">
                          <td className="py-3.5 px-6 font-medium text-[#123B35]">
                            {formatNutrientName(n.display_name, language)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs text-[#64748B]">
                            {n.requirement.toLocaleString()} {n.unit}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs text-[#123B35]">
                            {n.available.toLocaleString()} {n.unit}
                          </td>
                          {showAllStages && (
                            <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs text-[#64748B]">
                              {n.distributed.toLocaleString()} {n.unit}
                            </td>
                          )}
                          {showAllStages && (
                            <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs text-[#64748B]">
                              {n.reported_consumed.toLocaleString()} {n.unit}
                            </td>
                          )}
                          <td
                            className={`py-3.5 px-6 text-right font-mono tabular-nums text-xs font-bold ${
                              n.deficit_ratio >= 0.3
                                ? 'text-[#FF795C]'
                                : n.gap > 0
                                ? 'text-[#D97706]'
                                : 'text-[#16A34A]'
                            }`}
                          >
                            {n.gap > 0 ? `${n.gap.toLocaleString()} ${n.unit}` : tx(language, 'Met', 'நிறைவு')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Quiet Collapsible Methodology & Honesty Disclosure */}
              <div className="rounded-xl bg-white border border-[#123B35]/10 px-5 py-3.5">
                <button
                  type="button"
                  onClick={() => setShowMethodDetails((v) => !v)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-[#64748B] hover:text-[#123B35]"
                >
                  <span>
                    {tx(
                      language,
                      'How these estimates are calculated (ICMR-NIN & FAO data)',
                      'இந்த மதிப்பீடுகள் எவ்வாறு கணக்கிடப்படுகின்றன (ICMR-NIN & FAO தரவு)'
                    )}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showMethodDetails ? 'rotate-180' : ''}`}
                  />
                </button>
                {showMethodDetails && (
                  <p className="mt-2.5 text-xs text-[#64748B] leading-relaxed">
                    {tx(
                      language,
                      'NutriLoop estimates remaining gaps using G(j) = max(0, R(j) - A(j)) with demographic-adjusted ICMR-NIN RDA 2020 targets and ICMR-NIN IFCT 2017 / FAO-INFOODS food composition tables. Food stock shows estimated community availability — not proof of individual consumption.',
                      'நியூட்ரிலூப் (NutriLoop) ICMR-NIN RDA 2020 வயது அடிப்படையிலான இலக்குகள் மற்றும் ICMR-NIN IFCT 2017 / FAO-INFOODS உணவு ஊட்டச்சத்து அட்டவணைகளைப் பயன்படுத்தி G(j) = max(0, R(j) - A(j)) சூத்திரத்தின் மூலம் பற்றாக்குறையைக் கணக்கிடுகிறது. உணவு இருப்பு என்பது சமூக அளவிலான மதிப்பீடு மட்டுமே — தனிநபர் உட்கொள்ளல் சான்று அல்ல.'
                    )}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: NEEDED FOODS (TARGETED REQUESTS) */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {canApproveRole && draftRequests.length > 0 && (
            <section className="rounded-2xl bg-white border border-[#123B35]/15 overflow-hidden">
              <div className="px-6 py-4 border-b border-[#123B35]/10">
                <h3 className="text-base font-bold font-display text-[#123B35]">
                  {tx(
                    language,
                    `Waiting for Your Approval (${draftRequests.length})`,
                    `உங்கள் அங்கீகாரத்திற்குக் காத்திருப்பவை (${draftRequests.length})`
                  )}
                </h3>
                <p className="text-xs text-[#64748B]">
                  {tx(
                    language,
                    'Review suggested food requests before sharing them with donors.',
                    'தானதாரர்களிடம் பகிர்வதற்கு முன் பரிந்துரைக்கப்பட்ட உணவு கோரிக்கைகளைச் சரிபார்க்கவும்.'
                  )}
                </p>
              </div>
              <div className="divide-y divide-[#123B35]/8">
                {draftRequests.map((tr) => {
                  const org = organisations.find((o) => o.id === tr.org_id);
                  const allowApproveThis = canApproveForOrg(tr.org_id);
                  return (
                    <div key={tr.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-[#123B35]">
                          {tx(
                            language,
                            `${tr.target_nutrient_label}-rich foods · ${tr.requested_portions} meals`,
                            `${formatNutrientName(tr.target_nutrient_label, language)} நிறைந்த உணவுகள் · ${tr.requested_portions} உணவுகள்`
                          )}
                        </div>
                        <div className="text-xs text-[#64748B]">
                          {formatOrgName(org?.name, language) || tx(language, 'Shelter', 'காப்பகம்')} ·{' '}
                          {tx(language, 'Suggested:', 'பரிந்துரை:')}{' '}
                          {tr.recommended_items
                            .slice(0, 2)
                            .map((item) => formatFoodName(item, language))
                            .join(', ')}
                        </div>
                        <p className="text-xs text-[#64748B]">{tr.reason_summary}</p>
                      </div>
                      {allowApproveThis && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setApprovingReq(tr)}
                            className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723]"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {tx(language, 'Approve & Share', 'அங்கீகரித்துப் பகிர்')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDismissingReq(tr)}
                            className="min-h-[40px] inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-[#123B35]/20 text-xs font-semibold text-[#64748B] hover:text-[#FF795C]"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            {tx(language, 'Dismiss', 'தள்ளுபடி')}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="rounded-2xl bg-white border border-[#123B35]/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#123B35]/10 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold font-display text-[#123B35]">
                  {tx(
                    language,
                    `Published Community Food Needs (${activeRequests.length})`,
                    `வெளியிடப்பட்ட சமூக உணவுத் தேவைகள் (${activeRequests.length})`
                  )}
                </h3>
                <p className="text-xs text-[#64748B]">
                  {tx(
                    language,
                    'Donors can respond directly to help fill these nutritional gaps.',
                    'இந்த ஊட்டச்சத்து பற்றாக்குறைகளைப் பூர்த்தி செய்ய தானதாரர்கள் நேரடியாகப் பதிலளிக்கலாம்.'
                  )}
                </p>
              </div>
              {canGenerateForSelectedOrg && (
                <button
                  type="button"
                  onClick={() => void handleGenerateRequests()}
                  className="min-h-[38px] px-3.5 py-2 rounded-xl bg-[#D7F36B] text-[#123B35] text-xs font-bold hover:bg-[#C8E655] whitespace-nowrap"
                >
                  {tx(language, 'Suggest More', 'மேலும் பரிந்துரை')}
                </button>
              )}
            </div>

            {activeRequests.length === 0 ? (
              <div className="p-10 text-center text-sm text-[#64748B]">
                {tx(language, 'No food requests published yet.', 'இன்னும் உணவு கோரிக்கைகள் எதுவும் வெளியிடப்படவில்லை.')}
              </div>
            ) : (
              <div className="divide-y divide-[#123B35]/8">
                {activeRequests.map((tr) => {
                  const org = organisations.find((o) => o.id === tr.org_id);
                  const matchedBatch = tr.matched_batch_id
                    ? batches.find((b) => b.id === tr.matched_batch_id)
                    : null;

                  return (
                    <div key={tr.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-[#123B35]">
                          {tx(
                            language,
                            `${tr.target_nutrient_label}-rich foods · `,
                            `${formatNutrientName(tr.target_nutrient_label, language)} நிறைந்த உணவுகள் · `
                          )}
                          <span className="font-mono tabular-nums">
                            {tr.requested_portions} {tx(language, 'meals', 'உணவுகள்')}
                          </span>
                        </div>
                        <div className="text-xs text-[#64748B]">
                          {formatOrgName(org?.name, language) || tx(language, 'Shelter', 'காப்பகம்')} ·{' '}
                          {formatNutriCategory(tr.recommended_food_category, language)} ·{' '}
                          {formatDietary(tr.dietary_pref, language)}
                          {matchedBatch
                            ? ` · ${tx(language, 'Matched', 'பொருத்தப்பட்டது')} (${matchedBatch.batch_code})`
                            : ''}
                        </div>
                        <div className="text-xs text-[#123B35]">
                          {tx(language, 'Ideas:', 'உணவு யோசனைகள்:')}{' '}
                          {tr.recommended_items
                            .slice(0, 3)
                            .map((item) => formatFoodName(item, language))
                            .join(', ')}
                        </div>
                      </div>

                      {tr.status === 'APPROVED_PUBLISHED' && canDonate ? (
                        <Link
                          to={`/donations?targetedRequestId=${encodeURIComponent(tr.id)}`}
                          className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723] shrink-0 whitespace-nowrap"
                        >
                          {tx(language, 'Donate This', 'இதை தானம் செய்')}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <span className="text-xs font-medium text-[#64748B]">
                          {formatTargetedStatus(tr.status, language)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 3: FOOD STOCK & PEOPLE */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {!canEditSelectedOrg && (
            <div className="rounded-xl bg-[#FFF9EF] border border-[#123B35]/15 px-4 py-3 flex items-center gap-2.5 text-xs text-[#123B35]">
              <Lock className="w-4 h-4 text-[#64748B] shrink-0" />
              <span>
                {tx(
                  language,
                  'View-only access. Only the shelter/kitchen team or an administrator can edit people counts and kitchen stock.',
                  'பார்வையிடும் அனுமதி மட்டுமே. மக்கள் எண்ணிக்கை மற்றும் சமையலறை உணவு இருப்பை அந்தக் காப்பகம்/சமையலறை குழு அல்லது நிர்வாகி மட்டுமே திருத்த முடியும்.'
                )}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleSaveProfile}
              className="lg:col-span-5 rounded-2xl bg-white border border-[#123B35]/10 p-6 space-y-4"
            >
              <div>
                <h3 className="text-base font-bold font-display text-[#123B35]">
                  {tx(language, 'People Served Here', 'இங்கு உணவருந்தும் மக்கள்')}
                </h3>
                <p className="mt-0.5 text-xs text-[#64748B]">
                  {tx(
                    language,
                    'Group counts only (no personal names). Used to estimate daily nutrition needs.',
                    'குழு எண்ணிக்கை மட்டுமே (தனிநபர் பெயர்கள் இல்லை). தினசரி ஊட்டச்சத்து தேவையைக் கணக்கிடப் பயன்படும்.'
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="nl-children" className="block text-xs font-medium text-[#123B35] mb-1">
                    {tx(language, 'Children (1–9)', 'குழந்தைகள் (1–9)')}
                  </label>
                  <input
                    id="nl-children"
                    type="number"
                    min={0}
                    disabled={!canEditSelectedOrg}
                    value={childrenCount}
                    onChange={(e) => setChildrenCount(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm font-mono tabular-nums disabled:opacity-60"
                  />
                </div>
                <div>
                  <label htmlFor="nl-adolescents" className="block text-xs font-medium text-[#123B35] mb-1">
                    {tx(language, 'Teens (10–18)', 'வளரிளம் பருவத்தினர் (10–18)')}
                  </label>
                  <input
                    id="nl-adolescents"
                    type="number"
                    min={0}
                    disabled={!canEditSelectedOrg}
                    value={adolescentsCount}
                    onChange={(e) => setAdolescentsCount(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm font-mono tabular-nums disabled:opacity-60"
                  />
                </div>
                <div>
                  <label htmlFor="nl-adults" className="block text-xs font-medium text-[#123B35] mb-1">
                    {tx(language, 'Adults (19–59)', 'பெரியவர்கள் (19–59)')}
                  </label>
                  <input
                    id="nl-adults"
                    type="number"
                    min={0}
                    disabled={!canEditSelectedOrg}
                    value={adultsCount}
                    onChange={(e) => setAdultsCount(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm font-mono tabular-nums disabled:opacity-60"
                  />
                </div>
                <div>
                  <label htmlFor="nl-pregnant" className="block text-xs font-medium text-[#123B35] mb-1">
                    {tx(language, 'Pregnant / Nursing', 'கர்ப்பிணி / பாலூட்டும் தாய்மார்கள்')}
                  </label>
                  <input
                    id="nl-pregnant"
                    type="number"
                    min={0}
                    disabled={!canEditSelectedOrg}
                    value={pregnantCount}
                    onChange={(e) => setPregnantCount(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm font-mono tabular-nums disabled:opacity-60"
                  />
                </div>
                <div>
                  <label htmlFor="nl-elderly" className="block text-xs font-medium text-[#123B35] mb-1">
                    {tx(language, 'Seniors (60+)', 'மூத்தோர் (60+)')}
                  </label>
                  <input
                    id="nl-elderly"
                    type="number"
                    min={0}
                    disabled={!canEditSelectedOrg}
                    value={elderlyCount}
                    onChange={(e) => setElderlyCount(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm font-mono tabular-nums disabled:opacity-60"
                  />
                </div>
                <div>
                  <label htmlFor="nl-horizon" className="block text-xs font-medium text-[#123B35] mb-1">
                    {tx(language, 'Days', 'நாட்கள்')}
                  </label>
                  <input
                    id="nl-horizon"
                    type="number"
                    min={1}
                    max={30}
                    disabled={!canEditSelectedOrg}
                    value={horizonDays}
                    onChange={(e) => setHorizonDays(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm font-mono tabular-nums disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="nl-diet" className="block text-xs font-medium text-[#123B35] mb-1">
                  {tx(language, 'Diet Preference', 'உணவு விருப்பம்')}
                </label>
                <select
                  id="nl-diet"
                  disabled={!canEditSelectedOrg}
                  value={dietaryRestriction}
                  onChange={(e) => setDietaryRestriction(e.target.value as DietaryPreference)}
                  className="w-full min-h-[44px] rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm disabled:opacity-60"
                >
                  {(['ANY', 'VEGETARIAN', 'VEGAN', 'JAIN', 'EGGETARIAN', 'HALAL', 'NON_VEGETARIAN'] as DietaryPreference[]).map(
                    (diet) => (
                      <option key={diet} value={diet}>
                        {formatDietary(diet, language)}
                      </option>
                    )
                  )}
                </select>
              </div>

              {canEditSelectedOrg && (
                <button
                  type="submit"
                  className="w-full min-h-[44px] rounded-xl bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723]"
                >
                  {tx(language, 'Save People Count', 'மக்கள் எண்ணிக்கையைச் சேமி')}
                </button>
              )}
            </form>

            <div className="lg:col-span-7 space-y-6">
              {canEditSelectedOrg && (
                <form
                  onSubmit={handleLogInventory}
                  className="rounded-2xl bg-white border border-[#123B35]/10 p-6 space-y-4"
                >
                  <h3 className="text-base font-bold font-display text-[#123B35]">
                    {tx(language, 'Add Food Stock', 'உணவு இருப்பைச் சேர்')}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label htmlFor="nl-inv-food" className="block text-xs font-medium text-[#123B35] mb-1">
                        {tx(language, 'Choose Food', 'உணவைத் தேர்ந்தெடு')}
                      </label>
                      <select
                        id="nl-inv-food"
                        value={invFoodCompId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setInvFoodCompId(val);
                          const found = foodCatalog.find((f) => f.id === val);
                          if (found) {
                            setInvCustomName(found.food_name);
                            setInvGrams(String(found.standard_portion_grams));
                          }
                        }}
                        className="w-full min-h-[44px] rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm"
                      >
                        {foodCatalog.map((item) => (
                          <option key={item.id} value={item.id}>
                            {formatFoodName(item.food_name, language)}
                          </option>
                        ))}
                        <option value="UNMAPPED">
                          {tx(language, 'Other food (not in table)', 'மற்ற உணவு (அட்டவணையில் இல்லை)')}
                        </option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="nl-inv-portions" className="block text-xs font-medium text-[#123B35] mb-1">
                        {tx(language, 'Number of Meals', 'உணவுப் பங்குகள்')}
                      </label>
                      <input
                        id="nl-inv-portions"
                        type="number"
                        min={1}
                        required
                        value={invPortions}
                        onChange={(e) => setInvPortions(e.target.value)}
                        className="w-full min-h-[44px] rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm font-mono tabular-nums"
                      />
                    </div>

                    <div>
                      <label htmlFor="nl-inv-stage" className="block text-xs font-medium text-[#123B35] mb-1">
                        {tx(language, 'Status', 'நிலை')}
                      </label>
                      <select
                        id="nl-inv-stage"
                        value={invStage}
                        onChange={(e) => setInvStage(e.target.value as InventoryStage)}
                        className="w-full min-h-[44px] rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm"
                      >
                        <option value="AVAILABLE">{formatInventoryStage('AVAILABLE', language)}</option>
                        <option value="DISTRIBUTED">{formatInventoryStage('DISTRIBUTED', language)}</option>
                        <option value="REPORTED_CONSUMED">{formatInventoryStage('REPORTED_CONSUMED', language)}</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723]"
                  >
                    <Plus className="w-4 h-4" />
                    {tx(language, 'Save Food Stock', 'உணவு இருப்பைச் சேமி')}
                  </button>
                </form>
              )}

              <div className="rounded-2xl bg-white border border-[#123B35]/10 overflow-hidden">
                <div className="px-6 py-4 border-b border-[#123B35]/10">
                  <h4 className="text-sm font-bold font-display text-[#123B35]">
                    {tx(
                      language,
                      `Current Logged Stock (${orgInventory.length})`,
                      `தற்போது பதிவான இருப்பு (${orgInventory.length})`
                    )}
                  </h4>
                </div>
                {orgInventory.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#64748B]">
                    {tx(language, 'No food logged yet.', 'இன்னும் உணவு எதுவும் பதிவாகவில்லை.')}
                  </div>
                ) : (
                  <div className="divide-y divide-[#123B35]/8">
                    {orgInventory.map((rec) => (
                      <div key={rec.id} className="px-6 py-3.5 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <div className="font-semibold text-[#123B35] truncate">
                            {formatFoodName(rec.custom_food_name, language)}
                          </div>
                          <div className="text-[#64748B]">
                            {formatInventoryStage(rec.inventory_stage, language)}
                          </div>
                        </div>
                        <span className="font-mono tabular-nums font-bold text-[#123B35] shrink-0">
                          {rec.quantity_portions} {tx(language, 'meals', 'உணவுகள்')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: IMPACT & REFERENCE DATA */}
      {activeTab === 'more' && (
        <div className="space-y-6">
          {/* Before vs After Impact */}
          <section className="rounded-2xl bg-white border border-[#123B35]/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#123B35]/10">
              <h3 className="text-base font-bold font-display text-[#123B35]">
                {tx(
                  language,
                  `Before & After Delivery Impact (${nutritionalSnapshots.length})`,
                  `விநியோகத்திற்கு முன் & பின் ஊட்டச்சத்து தாக்கம் (${nutritionalSnapshots.length})`
                )}
              </h3>
              <p className="text-xs text-[#64748B]">
                {tx(
                  language,
                  'Automatically recorded whenever a meal delivery is confirmed via QR scan.',
                  'QR ஸ்கேன் மூலம் உணவு விநியோகம் உறுதிசெய்யப்படும்போதெல்லாம் தானாகவே பதிவுசெய்யப்படும்.'
                )}
              </p>
            </div>

            {nutritionalSnapshots.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748B]">
                {tx(
                  language,
                  'No completed delivery snapshots yet. Confirm a delivery in Scan QR to see nutrition gains here.',
                  'இன்னும் நிறைவடைந்த விநியோகப் பதிவுகள் இல்லை. ஊட்டச்சத்து முன்னேற்றத்தைக் காண QR ஸ்கேன் பக்கத்தில் ஒரு விநியோகத்தை உறுதிப்படுத்தவும்.'
                )}
              </div>
            ) : (
              <div className="divide-y divide-[#123B35]/8">
                {nutritionalSnapshots.map((snap) => {
                  const org = organisations.find((o) => o.id === snap.org_id);
                  const delta = Math.round((snap.after_adequacy_pct - snap.before_adequacy_pct) * 10) / 10;
                  return (
                    <div key={snap.id} className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-semibold text-[#123B35]">
                          {formatOrgName(org?.name, language) || tx(language, 'Community', 'சமூகம்')} ·{' '}
                          {snap.portions_confirmed} {tx(language, 'verified meals', 'உறுதிசெய்யப்பட்ட உணவுகள்')}
                        </div>
                        <div className="text-[#64748B]">{new Date(snap.recorded_at).toLocaleString()}</div>
                      </div>
                      <div className="font-mono tabular-nums font-bold text-[#123B35]">
                        {snap.before_adequacy_pct.toFixed(1)}% &rarr; {snap.after_adequacy_pct.toFixed(1)}%{' '}
                        <span className="text-[#16A34A]">(+{delta.toFixed(1)}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Reference Table */}
          <section className="rounded-2xl bg-white border border-[#123B35]/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#123B35]/10">
              <h3 className="text-base font-bold font-display text-[#123B35]">
                {tx(
                  language,
                  `Food Nutrition Reference (${foodCatalog.length} foods)`,
                  `உணவு ஊட்டச்சத்து அட்டவணை (${foodCatalog.length} உணவுகள்)`
                )}
              </h3>
              <p className="text-xs text-[#64748B]">
                {tx(
                  language,
                  'Values per 100g cooked serving sourced from ICMR-NIN IFCT 2017 & FAO-INFOODS.',
                  'ICMR-NIN IFCT 2017 & FAO-INFOODS தரவிலிருந்து சமைத்த 100 கிராம் உணவிற்கான மதிப்புகள்.'
                )}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#123B35]/10 bg-[#FFF9EF]/60 text-xs font-semibold text-[#64748B]">
                    <th className="py-2.5 px-6">{tx(language, 'Food', 'உணவு')}</th>
                    <th className="py-2.5 px-3 text-right">{tx(language, 'Kcal', 'கலோரி')}</th>
                    <th className="py-2.5 px-3 text-right">{tx(language, 'Protein', 'புரதம்')}</th>
                    <th className="py-2.5 px-3 text-right">{tx(language, 'Iron', 'இரும்பு')}</th>
                    <th className="py-2.5 px-6">{tx(language, 'Source', 'ஆதாரம்')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#123B35]/8 text-xs">
                  {foodCatalog.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 px-6 font-medium text-[#123B35]">
                        {formatFoodName(item.food_name, language)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">{item.calories_kcal_per_100g}</td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold">{item.protein_g_per_100g}g</td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">{item.iron_mg_per_100g}mg</td>
                      <td className="py-3 px-6 text-[#64748B]">{item.source_dataset}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Admin-only Add Food & Custom Nutrient */}
          {canManageCatalog && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <form onSubmit={handleAddFoodItem} className="rounded-2xl bg-white border border-[#123B35]/10 p-6 space-y-3">
                <h4 className="text-sm font-bold font-display text-[#123B35]">
                  {tx(language, 'Admin: Add Food Entry', 'நிர்வாகி: புதிய உணவைச் சேர்')}
                </h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    required
                    placeholder={tx(language, 'Code (e.g. IFCT-B009)', 'குறியீடு (எ.கா. IFCT-B009)')}
                    value={newFoodCode}
                    onChange={(e) => setNewFoodCode(e.target.value)}
                    className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs font-mono"
                  />
                  <input
                    type="text"
                    required
                    placeholder={tx(language, 'Food Name', 'உணவின் பெயர்')}
                    value={newFoodName}
                    onChange={(e) => setNewFoodName(e.target.value)}
                    className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs"
                  />
                  <select
                    value={newFoodCat}
                    onChange={(e) => setNewFoodCat(e.target.value as FoodCompositionCategory)}
                    className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs"
                  >
                    {FOOD_CATEGORIES.map((k) => (
                      <option key={k} value={k}>
                        {formatNutriCategory(k, language)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newFoodDiet}
                    onChange={(e) => setNewFoodDiet(e.target.value as DietaryType)}
                    className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs"
                  >
                    {(['VEGAN', 'VEGETARIAN', 'EGGETARIAN', 'NON_VEGETARIAN'] as DietaryType[]).map((d) => (
                      <option key={d} value={d}>
                        {formatDietary(d, language)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    required
                    min={10}
                    placeholder={tx(language, 'Portion (g)', 'பங்கு அளவு (கிராம்)')}
                    value={newFoodGrams}
                    onChange={(e) => setNewFoodGrams(e.target.value)}
                    className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs font-mono"
                  />
                  <input
                    type="number"
                    step="0.1"
                    required
                    min={0}
                    placeholder={tx(language, 'Calories / 100g', 'கலோரி / 100g')}
                    value={newFoodKcal}
                    onChange={(e) => setNewFoodKcal(e.target.value)}
                    className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs font-mono"
                  />
                  <input
                    type="number"
                    step="0.1"
                    required
                    min={0}
                    placeholder={tx(language, 'Protein g / 100g', 'புரதம் g / 100g')}
                    value={newFoodProt}
                    onChange={(e) => setNewFoodProt(e.target.value)}
                    className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs font-mono"
                  />
                  <input
                    type="number"
                    step="0.1"
                    required
                    min={0}
                    placeholder={tx(language, 'Iron mg / 100g', 'இரும்பு mg / 100g')}
                    value={newFoodIron}
                    onChange={(e) => setNewFoodIron(e.target.value)}
                    className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs font-mono"
                  />
                  <input
                    type="number"
                    step="0.1"
                    required
                    min={0}
                    placeholder={tx(language, 'Calcium mg / 100g', 'கால்சியம் mg / 100g')}
                    value={newFoodCalc}
                    onChange={(e) => setNewFoodCalc(e.target.value)}
                    className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs font-mono"
                  />
                  <input
                    type="number"
                    step="0.1"
                    required
                    min={0}
                    placeholder={tx(language, 'Vit A mcg / 100g', 'வைட்டமின் A mcg / 100g')}
                    value={newFoodVitA}
                    onChange={(e) => setNewFoodVitA(e.target.value)}
                    className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs font-mono"
                  />
                  <input
                    type="number"
                    step="0.1"
                    required
                    min={0}
                    placeholder={tx(language, 'Fibre g / 100g', 'நார்ச்சத்து g / 100g')}
                    value={newFoodFibre}
                    onChange={(e) => setNewFoodFibre(e.target.value)}
                    className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs font-mono"
                  />
                  <input
                    type="text"
                    required
                    placeholder={tx(language, 'Source Dataset', 'ஆதாரத் தரவுத்தொகுப்பு')}
                    value={newFoodSource}
                    onChange={(e) => setNewFoodSource(e.target.value)}
                    className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs"
                  />
                </div>
                <input
                  type="text"
                  placeholder={tx(language, 'Citation Note', 'குறிப்பு ஆதாரம்')}
                  value={newFoodRef}
                  onChange={(e) => setNewFoodRef(e.target.value)}
                  className="w-full min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs"
                />
                <button type="submit" className="min-h-[40px] px-4 py-2 rounded-xl bg-[#123B35] text-white text-xs font-semibold">
                  {tx(language, 'Save Food Item', 'உணவுப் பொருளைச் சேமி')}
                </button>
              </form>

              <form onSubmit={handleAddNutrient} className="rounded-2xl bg-white border border-[#123B35]/10 p-6 space-y-3">
                <h4 className="text-sm font-bold font-display text-[#123B35]">
                  {tx(
                    language,
                    `Admin: Add Tracked Nutrient (${nutrientConfigs.length})`,
                    `நிர்வாகி: புதிய ஊட்டச்சத்தைச் சேர் (${nutrientConfigs.length})`
                  )}
                </h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    required
                    placeholder={tx(language, 'Key (e.g. vitamin_c_mg)', 'திறவுகோல் (எ.கா. vitamin_c_mg)')}
                    value={newNutrKey}
                    onChange={(e) => setNewNutrKey(e.target.value)}
                    className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs font-mono"
                  />
                  <input
                    type="text"
                    required
                    placeholder={tx(language, 'Name (e.g. Vitamin C)', 'பெயர் (எ.கா. வைட்டமின் C)')}
                    value={newNutrName}
                    onChange={(e) => setNewNutrName(e.target.value)}
                    className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs"
                  />
                  <input
                    type="text"
                    required
                    placeholder={tx(language, 'Unit (mg)', 'அலகு (mg)')}
                    value={newNutrUnit}
                    onChange={(e) => setNewNutrUnit(e.target.value)}
                    className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs font-mono"
                  />
                  <input
                    type="number"
                    step="0.1"
                    required
                    min={0.1}
                    placeholder={tx(language, 'Daily RDA', 'தினசரி RDA')}
                    value={newNutrRda}
                    onChange={(e) => setNewNutrRda(e.target.value)}
                    className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs font-mono"
                  />
                  <input
                    type="number"
                    step="0.01"
                    required
                    min={0.01}
                    max={1}
                    placeholder={tx(language, 'Weight (0.1)', 'முக்கியத்துவம் (0.1)')}
                    value={newNutrWeight}
                    onChange={(e) => setNewNutrWeight(e.target.value)}
                    className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs font-mono"
                  />
                  <input
                    type="text"
                    required
                    placeholder={tx(language, 'Guideline', 'வழிகாட்டுதல்')}
                    value={newNutrGuideline}
                    onChange={(e) => setNewNutrGuideline(e.target.value)}
                    className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs"
                  />
                </div>
                <button type="submit" className="min-h-[40px] px-4 py-2 rounded-xl bg-[#123B35] text-white text-xs font-semibold">
                  {tx(language, 'Add Nutrient', 'ஊட்டச்சத்தைச் சேர்')}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(approvingReq)}
        title={tx(
          language,
          `Share ${approvingReq?.target_nutrient_label ?? ''} Request with Donors`,
          `${formatNutrientName(approvingReq?.target_nutrient_label ?? '', language)} கோரிக்கையை தானதாரர்களிடம் பகிரவும்`
        )}
        description={tx(
          language,
          `This publishes a ${approvingReq?.requested_portions ?? 0}-meal request so verified donors can respond.`,
          `இது சரிபார்க்கப்பட்ட தானதாரர்கள் பதிலளிக்க ${approvingReq?.requested_portions ?? 0} உணவுப் பங்கு கோரிக்கையை வெளியிடும்.`
        )}
        confirmLabel={tx(language, 'Approve & Share', 'அங்கீகரித்துப் பகிர்')}
        reasonLabel={tx(language, 'Optional Note', 'விருப்பக் குறிப்பு')}
        reasonPlaceholder={tx(
          language,
          'e.g. Kitchen ready for evening pickup.',
          'எ.கா. மாலை சேகரிப்பிற்கு சமையலறை தயாராக உள்ளது.'
        )}
        onCancel={() => setApprovingReq(null)}
        onConfirm={async (note) => {
          if (!approvingReq) return;
          const res = await approveTargetedDonationRequest(approvingReq.id, note);
          if (res.error) setErrorMsg(res.error);
          setApprovingReq(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(dismissingReq)}
        title={tx(language, 'Dismiss Suggested Request', 'பரிந்துரைக்கப்பட்ட கோரிக்கையைத் தள்ளுபடி செய்')}
        description={tx(
          language,
          'This removes the suggestion so it will not be shared with donors.',
          'இது பரிந்துரையை நீக்கிவிடும்; தானதாரர்களுடன் பகிரப்படாது.'
        )}
        confirmLabel={tx(language, 'Dismiss', 'தள்ளுபடி செய்')}
        destructive
        requireReason
        reasonLabel={tx(language, 'Reason', 'காரணம்')}
        reasonPlaceholder={tx(
          language,
          'e.g. Already covered by local partner.',
          'எ.கா. உள்ளூர் பங்குதாரரால் ஏற்கனவே வழங்கப்பட்டது.'
        )}
        onCancel={() => setDismissingReq(null)}
        onConfirm={async (reason) => {
          if (!dismissingReq) return;
          const res = await dismissTargetedDonationRequest(dismissingReq.id, reason);
          if (res.error) setErrorMsg(res.error);
          setDismissingReq(null);
        }}
      />
    </div>
  );
};
