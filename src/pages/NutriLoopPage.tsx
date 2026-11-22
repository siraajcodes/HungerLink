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
  Plus,
  Sparkles,
  Users,
  XCircle,
} from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useApp } from '../context/AppContext';
import { buildCsvDocument } from '../lib/matchingEngine';
import type { DietaryPreference, DietaryType } from '../types/database';
import type {
  FoodCompositionCategory,
  InventoryStage,
  TargetedDonationRequest,
} from '../types/nutriloop';

type NutriLoopTab = 'overview' | 'requests' | 'inventory' | 'more';

const CATEGORY_LABELS: Record<FoodCompositionCategory, string> = {
  CEREALS_GRAINS: 'Grains & Rice',
  PULSES_LEGUMES: 'Dal & Pulses',
  DAIRY_PROTEIN: 'Milk & Paneer',
  EGG_MEAT_FISH: 'Eggs & Fish',
  LEAFY_VEGETABLES: 'Leafy Greens',
  FRUITS_VEGETABLES: 'Fruits & Veg',
  NUTS_SEEDS: 'Nuts & Seeds',
  MIXED_COOKED_MEAL: 'Cooked Meals',
};

export const NutriLoopPage: React.FC = () => {
  const {
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
    isAdmin ||
    ((role === 'VERIFIED_NGO' || role === 'COMMUNITY_KITCHEN') &&
      activeOrganisation?.id === selectedOrgId);

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
    if (role === 'FOOD_DONOR') {
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
        name: n.display_name.replace(' (Energy)', '').replace(' (RAE)', ''),
        Covered: coveredPct,
        Missing: missingPct,
      };
    });
  }, [selectedAnalysis]);

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
      ['Community', 'Nutrient', 'Unit', 'Target', 'Available', 'Distributed', 'Consumed', 'Still Needed', 'Coverage %'],
      selectedAnalysis.nutrients.map((n) => [
        selectedOrg?.name ?? selectedOrgId,
        n.display_name,
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
    { id: 'overview', label: 'Overview' },
    { id: 'requests', label: 'Needed Foods', count: visibleTargetedRequests.length },
    { id: 'inventory', label: 'Food Stock & People' },
    { id: 'more', label: 'Impact & Reference' },
  ];

  return (
    <div className="space-y-6">
      {/* Simple Page Header + Community Picker */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#123B35]">
            Community Nutrition
          </h2>
          <p className="mt-1 text-sm text-[#64748B]">
            See which nutrients a shelter is short on and suggest the right foods for donors to share.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <select
            aria-label="Choose community"
            value={selectedOrgId}
            onChange={(e) => {
              setSelectedOrgId(e.target.value);
              setErrorMsg(null);
            }}
            className="min-h-[44px] rounded-xl border border-[#123B35]/20 bg-white px-3.5 py-2 text-sm font-medium text-[#123B35]"
          >
            {recipientOrgs.length === 0 && <option value="">No shelters yet</option>}
            {recipientOrgs.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>

          {canEditSelectedOrg && (
            <button
              type="button"
              onClick={() => void handleGenerateRequests()}
              disabled={!selectedAnalysis || selectedAnalysis.highest_priority_gaps.length === 0}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#D7F36B] text-[#123B35] text-xs font-bold hover:bg-[#C8E655] disabled:opacity-40 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              Suggest Needed Foods
            </button>
          )}
        </div>
      </div>

      {/* Clean 4-Tab Bar */}
      <div
        role="tablist"
        aria-label="Nutrition sections"
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
                Set up this shelter&rsquo;s people &amp; food stock first
              </h3>
              <p className="text-xs text-[#64748B] max-w-md mx-auto">
                Add how many people eat here and what food is currently in the kitchen to see what nutrients are missing.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#123B35] text-white text-xs font-semibold"
              >
                Add People &amp; Food Stock
              </button>
            </div>
          ) : (
            <>
              {/* 3 Simple Numbers */}
              <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-white border border-[#123B35]/10 p-6">
                  <div className="text-xs font-medium text-[#64748B]">Estimated Nutrition Covered</div>
                  <div className="mt-2 text-3xl font-extrabold font-display tabular-nums text-[#123B35]">
                    {selectedAnalysis.overall_adequacy_pct.toFixed(0)}%
                  </div>
                  <div className="mt-1 text-xs text-[#64748B]">
                    For {selectedAnalysis.total_beneficiaries} people ({selectedAnalysis.planning_horizon_days} day)
                  </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#123B35]/10 p-6">
                  <div className="text-xs font-medium text-[#64748B]">Missing Most Right Now</div>
                  <div className="mt-2 text-2xl font-extrabold font-display text-[#FF795C] truncate">
                    {selectedAnalysis.highest_priority_gaps[0]?.display_name ?? 'All balanced'}
                  </div>
                  <div className="mt-1 text-xs text-[#64748B]">
                    {selectedAnalysis.highest_priority_gaps.length > 0
                      ? `${selectedAnalysis.highest_priority_gaps.length} nutrient(s) need attention`
                      : 'Meets daily reference targets'}
                  </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#123B35]/10 p-6">
                  <div className="text-xs font-medium text-[#64748B]">Food Currently Logged</div>
                  <div className="mt-2 text-3xl font-extrabold font-display tabular-nums text-[#123B35]">
                    {selectedAnalysis.total_portions_available} meals
                  </div>
                  <div className="mt-1 text-xs text-[#64748B]">
                    {selectedAnalysis.total_portions_distributed} distributed · {selectedAnalysis.total_portions_reported_consumed} reported eaten
                  </div>
                </div>
              </section>

              {selectedAnalysis.unmapped_inventory_count > 0 && (
                <div className="rounded-xl bg-white border border-[#FF795C] p-4 flex items-center gap-3 text-xs text-[#123B35]">
                  <AlertTriangle className="w-4 h-4 text-[#FF795C] shrink-0" />
                  <span>
                    {selectedAnalysis.unmapped_inventory_count} logged food item(s) had no reference match and were left out rather than guessed.
                  </span>
                </div>
              )}

              {/* Simple Visual Bar Chart */}
              <section className="rounded-2xl bg-white border border-[#123B35]/10 p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold font-display text-[#123B35]">
                      What&rsquo;s Covered vs. Still Needed
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Dark green shows what is available; coral shows what is still missing.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={exportGapCsv}
                    className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#123B35]/20 text-xs font-semibold text-[#123B35] hover:bg-[#FFF9EF]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download CSV
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
                      <Bar dataKey="Covered" name="Covered" stackId="a" fill="#123B35" />
                      <Bar dataKey="Missing" name="Still Needed" stackId="a" fill="#FF795C" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Simple Nutrient Table with Optional Stage Columns */}
              <section className="rounded-2xl bg-white border border-[#123B35]/10 overflow-hidden">
                <div className="px-6 py-4 border-b border-[#123B35]/10 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-bold font-display text-[#123B35]">Nutrient Summary</h3>
                  <button
                    type="button"
                    onClick={() => setShowAllStages((v) => !v)}
                    className="text-xs font-semibold text-[#64748B] hover:text-[#123B35]"
                  >
                    {showAllStages ? 'Hide extra columns' : 'Show distributed & consumed'}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#123B35]/10 bg-[#FFF9EF]/60 text-xs font-semibold text-[#64748B]">
                        <th className="py-3 px-6">Nutrient</th>
                        <th className="py-3 px-4 text-right">Target</th>
                        <th className="py-3 px-4 text-right">Available</th>
                        {showAllStages && <th className="py-3 px-4 text-right">Distributed</th>}
                        {showAllStages && <th className="py-3 px-4 text-right">Reported Eaten</th>}
                        <th className="py-3 px-6 text-right">Still Needed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#123B35]/8 text-sm">
                      {selectedAnalysis.nutrients.map((n) => (
                        <tr key={n.nutrient_key} className="hover:bg-[#FFF9EF]/40">
                          <td className="py-3.5 px-6 font-medium text-[#123B35]">{n.display_name}</td>
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
                            {n.gap > 0 ? `${n.gap.toLocaleString()} ${n.unit}` : 'Met'}
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
                  <span>How these estimates are calculated (ICMR-NIN &amp; FAO data)</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showMethodDetails ? 'rotate-180' : ''}`}
                  />
                </button>
                {showMethodDetails && (
                  <p className="mt-2.5 text-xs text-[#64748B] leading-relaxed">
                    NutriLoop estimates remaining gaps using <span className="font-mono text-[#123B35]">G(j) = max(0, R(j) - A(j))</span> with demographic-adjusted ICMR-NIN RDA 2020 targets and ICMR-NIN IFCT 2017 / FAO-INFOODS food composition tables. Food stock shows estimated community availability — not proof of individual consumption.
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
          {role !== 'FOOD_DONOR' && draftRequests.length > 0 && (
            <section className="rounded-2xl bg-white border border-[#123B35]/15 overflow-hidden">
              <div className="px-6 py-4 border-b border-[#123B35]/10">
                <h3 className="text-base font-bold font-display text-[#123B35]">
                  Waiting for Your Approval ({draftRequests.length})
                </h3>
                <p className="text-xs text-[#64748B]">
                  Review suggested food requests before sharing them with donors.
                </p>
              </div>
              <div className="divide-y divide-[#123B35]/8">
                {draftRequests.map((tr) => {
                  const org = organisations.find((o) => o.id === tr.org_id);
                  return (
                    <div key={tr.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-[#123B35]">
                          {tr.target_nutrient_label}-rich foods · {tr.requested_portions} meals
                        </div>
                        <div className="text-xs text-[#64748B]">
                          {org?.name ?? 'Shelter'} · Suggested: {tr.recommended_items.slice(0, 2).join(', ')}
                        </div>
                        <p className="text-xs text-[#64748B]">{tr.reason_summary}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setApprovingReq(tr)}
                          className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve &amp; Share
                        </button>
                        <button
                          type="button"
                          onClick={() => setDismissingReq(tr)}
                          className="min-h-[40px] inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-[#123B35]/20 text-xs font-semibold text-[#64748B] hover:text-[#FF795C]"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Dismiss
                        </button>
                      </div>
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
                  Published Community Food Needs ({activeRequests.length})
                </h3>
                <p className="text-xs text-[#64748B]">
                  Donors can respond directly to help fill these nutritional gaps.
                </p>
              </div>
              {canEditSelectedOrg && (
                <button
                  type="button"
                  onClick={() => void handleGenerateRequests()}
                  className="min-h-[38px] px-3.5 py-2 rounded-xl bg-[#D7F36B] text-[#123B35] text-xs font-bold hover:bg-[#C8E655] whitespace-nowrap"
                >
                  Suggest More
                </button>
              )}
            </div>

            {activeRequests.length === 0 ? (
              <div className="p-10 text-center text-sm text-[#64748B]">
                No food requests published yet.
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
                          {tr.target_nutrient_label}-rich foods ·{' '}
                          <span className="font-mono tabular-nums">{tr.requested_portions} meals</span>
                        </div>
                        <div className="text-xs text-[#64748B]">
                          {org?.name ?? 'Shelter'} · {CATEGORY_LABELS[tr.recommended_food_category]} · {tr.dietary_pref.toLowerCase()}
                          {matchedBatch ? ` · Matched (${matchedBatch.batch_code})` : ''}
                        </div>
                        <div className="text-xs text-[#123B35]">
                          Ideas: {tr.recommended_items.slice(0, 3).join(', ')}
                        </div>
                      </div>

                      {tr.status === 'APPROVED_PUBLISHED' && (role === 'FOOD_DONOR' || isAdmin) ? (
                        <Link
                          to={`/donations?targetedRequestId=${encodeURIComponent(tr.id)}`}
                          className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723] shrink-0 whitespace-nowrap"
                        >
                          Donate This
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <span className="text-xs font-medium text-[#64748B] capitalize">
                          {tr.status.replace(/_/g, ' ').toLowerCase()}
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveProfile}
            className="lg:col-span-5 rounded-2xl bg-white border border-[#123B35]/10 p-6 space-y-4"
          >
            <div>
              <h3 className="text-base font-bold font-display text-[#123B35]">People Served Here</h3>
              <p className="mt-0.5 text-xs text-[#64748B]">
                Group counts only (no personal names). Used to estimate daily nutrition needs.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="nl-children" className="block text-xs font-medium text-[#123B35] mb-1">Children (1–9)</label>
                <input
                  id="nl-children"
                  type="number"
                  min={0}
                  disabled={!canEditSelectedOrg}
                  value={childrenCount}
                  onChange={(e) => setChildrenCount(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="nl-adolescents" className="block text-xs font-medium text-[#123B35] mb-1">Teens (10–18)</label>
                <input
                  id="nl-adolescents"
                  type="number"
                  min={0}
                  disabled={!canEditSelectedOrg}
                  value={adolescentsCount}
                  onChange={(e) => setAdolescentsCount(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="nl-adults" className="block text-xs font-medium text-[#123B35] mb-1">Adults (19–59)</label>
                <input
                  id="nl-adults"
                  type="number"
                  min={0}
                  disabled={!canEditSelectedOrg}
                  value={adultsCount}
                  onChange={(e) => setAdultsCount(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="nl-pregnant" className="block text-xs font-medium text-[#123B35] mb-1">Pregnant / Nursing</label>
                <input
                  id="nl-pregnant"
                  type="number"
                  min={0}
                  disabled={!canEditSelectedOrg}
                  value={pregnantCount}
                  onChange={(e) => setPregnantCount(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="nl-elderly" className="block text-xs font-medium text-[#123B35] mb-1">Seniors (60+)</label>
                <input
                  id="nl-elderly"
                  type="number"
                  min={0}
                  disabled={!canEditSelectedOrg}
                  value={elderlyCount}
                  onChange={(e) => setElderlyCount(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="nl-horizon" className="block text-xs font-medium text-[#123B35] mb-1">Days</label>
                <input
                  id="nl-horizon"
                  type="number"
                  min={1}
                  max={30}
                  disabled={!canEditSelectedOrg}
                  value={horizonDays}
                  onChange={(e) => setHorizonDays(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>
            </div>

            <div>
              <label htmlFor="nl-diet" className="block text-xs font-medium text-[#123B35] mb-1">Diet Preference</label>
              <select
                id="nl-diet"
                disabled={!canEditSelectedOrg}
                value={dietaryRestriction}
                onChange={(e) => setDietaryRestriction(e.target.value as DietaryPreference)}
                className="w-full min-h-[44px] rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm"
              >
                <option value="ANY">Any</option>
                <option value="VEGETARIAN">Vegetarian</option>
                <option value="VEGAN">Vegan</option>
                <option value="JAIN">Jain</option>
                <option value="EGGETARIAN">Eggetarian</option>
                <option value="HALAL">Halal</option>
                <option value="NON_VEGETARIAN">Non-Vegetarian</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!canEditSelectedOrg}
              className="w-full min-h-[44px] rounded-xl bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723] disabled:opacity-40"
            >
              Save People Count
            </button>
          </form>

          <div className="lg:col-span-7 space-y-6">
            <form
              onSubmit={handleLogInventory}
              className="rounded-2xl bg-white border border-[#123B35]/10 p-6 space-y-4"
            >
              <h3 className="text-base font-bold font-display text-[#123B35]">Add Food Stock</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label htmlFor="nl-inv-food" className="block text-xs font-medium text-[#123B35] mb-1">Choose Food</label>
                  <select
                    id="nl-inv-food"
                    disabled={!canEditSelectedOrg}
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
                        {item.food_name}
                      </option>
                    ))}
                    <option value="UNMAPPED">Other food (not in table)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="nl-inv-portions" className="block text-xs font-medium text-[#123B35] mb-1">Number of Meals</label>
                  <input
                    id="nl-inv-portions"
                    type="number"
                    min={1}
                    required
                    disabled={!canEditSelectedOrg}
                    value={invPortions}
                    onChange={(e) => setInvPortions(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label htmlFor="nl-inv-stage" className="block text-xs font-medium text-[#123B35] mb-1">Status</label>
                  <select
                    id="nl-inv-stage"
                    disabled={!canEditSelectedOrg}
                    value={invStage}
                    onChange={(e) => setInvStage(e.target.value as InventoryStage)}
                    className="w-full min-h-[44px] rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm"
                  >
                    <option value="AVAILABLE">In Kitchen (Available)</option>
                    <option value="DISTRIBUTED">Handed Out (Distributed)</option>
                    <option value="REPORTED_CONSUMED">Reported Eaten</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={!canEditSelectedOrg}
                className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723] disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
                Save Food Stock
              </button>
            </form>

            <div className="rounded-2xl bg-white border border-[#123B35]/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-[#123B35]/10">
                <h4 className="text-sm font-bold font-display text-[#123B35]">
                  Current Logged Stock ({orgInventory.length})
                </h4>
              </div>
              {orgInventory.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#64748B]">No food logged yet.</div>
              ) : (
                <div className="divide-y divide-[#123B35]/8">
                  {orgInventory.map((rec) => (
                    <div key={rec.id} className="px-6 py-3.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <div className="font-semibold text-[#123B35] truncate">{rec.custom_food_name}</div>
                        <div className="text-[#64748B] capitalize">{rec.inventory_stage.replace(/_/g, ' ').toLowerCase()}</div>
                      </div>
                      <span className="font-mono tabular-nums font-bold text-[#123B35] shrink-0">
                        {rec.quantity_portions} meals
                      </span>
                    </div>
                  ))}
                </div>
              )}
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
                Before &amp; After Delivery Impact ({nutritionalSnapshots.length})
              </h3>
              <p className="text-xs text-[#64748B]">
                Automatically recorded whenever a meal delivery is confirmed via QR scan.
              </p>
            </div>

            {nutritionalSnapshots.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748B]">
                No completed delivery snapshots yet. Confirm a delivery in Scan QR to see nutrition gains here.
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
                          {org?.name ?? 'Community'} · {snap.portions_confirmed} verified meals
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
                Food Nutrition Reference ({foodCatalog.length} foods)
              </h3>
              <p className="text-xs text-[#64748B]">
                Values per 100g cooked serving sourced from ICMR-NIN IFCT 2017 &amp; FAO-INFOODS.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#123B35]/10 bg-[#FFF9EF]/60 text-xs font-semibold text-[#64748B]">
                    <th className="py-2.5 px-6">Food</th>
                    <th className="py-2.5 px-3 text-right">Kcal</th>
                    <th className="py-2.5 px-3 text-right">Protein</th>
                    <th className="py-2.5 px-3 text-right">Iron</th>
                    <th className="py-2.5 px-6">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#123B35]/8 text-xs">
                  {foodCatalog.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 px-6 font-medium text-[#123B35]">{item.food_name}</td>
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
          {isAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <form onSubmit={handleAddFoodItem} className="rounded-2xl bg-white border border-[#123B35]/10 p-6 space-y-3">
                <h4 className="text-sm font-bold font-display text-[#123B35]">Admin: Add Food Entry</h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <input type="text" required placeholder="Code (e.g. IFCT-B009)" value={newFoodCode} onChange={(e) => setNewFoodCode(e.target.value)} className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs font-mono" />
                  <input type="text" required placeholder="Food Name" value={newFoodName} onChange={(e) => setNewFoodName(e.target.value)} className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs" />
                  <select value={newFoodCat} onChange={(e) => setNewFoodCat(e.target.value as FoodCompositionCategory)} className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs">
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                  </select>
                  <select value={newFoodDiet} onChange={(e) => setNewFoodDiet(e.target.value as DietaryType)} className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs">
                    <option value="VEGAN">Vegan</option>
                    <option value="VEGETARIAN">Vegetarian</option>
                    <option value="EGGETARIAN">Eggetarian</option>
                    <option value="NON_VEGETARIAN">Non-Vegetarian</option>
                  </select>
                  <input type="number" required min={10} placeholder="Portion (g)" value={newFoodGrams} onChange={(e) => setNewFoodGrams(e.target.value)} className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs font-mono" />
                  <input type="number" step="0.1" required min={0} placeholder="Calories / 100g" value={newFoodKcal} onChange={(e) => setNewFoodKcal(e.target.value)} className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs font-mono" />
                  <input type="number" step="0.1" required min={0} placeholder="Protein g / 100g" value={newFoodProt} onChange={(e) => setNewFoodProt(e.target.value)} className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs font-mono" />
                  <input type="number" step="0.1" required min={0} placeholder="Iron mg / 100g" value={newFoodIron} onChange={(e) => setNewFoodIron(e.target.value)} className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs font-mono" />
                  <input type="number" step="0.1" required min={0} placeholder="Calcium mg / 100g" value={newFoodCalc} onChange={(e) => setNewFoodCalc(e.target.value)} className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs font-mono" />
                  <input type="number" step="0.1" required min={0} placeholder="Vit A mcg / 100g" value={newFoodVitA} onChange={(e) => setNewFoodVitA(e.target.value)} className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs font-mono" />
                  <input type="number" step="0.1" required min={0} placeholder="Fibre g / 100g" value={newFoodFibre} onChange={(e) => setNewFoodFibre(e.target.value)} className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs font-mono" />
                  <input type="text" required placeholder="Source Dataset" value={newFoodSource} onChange={(e) => setNewFoodSource(e.target.value)} className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs" />
                </div>
                <input type="text" placeholder="Citation Note" value={newFoodRef} onChange={(e) => setNewFoodRef(e.target.value)} className="w-full min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs" />
                <button type="submit" className="min-h-[40px] px-4 py-2 rounded-xl bg-[#123B35] text-white text-xs font-semibold">
                  Save Food Item
                </button>
              </form>

              <form onSubmit={handleAddNutrient} className="rounded-2xl bg-white border border-[#123B35]/10 p-6 space-y-3">
                <h4 className="text-sm font-bold font-display text-[#123B35]">Admin: Add Tracked Nutrient ({nutrientConfigs.length})</h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <input type="text" required placeholder="Key (e.g. vitamin_c_mg)" value={newNutrKey} onChange={(e) => setNewNutrKey(e.target.value)} className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs font-mono" />
                  <input type="text" required placeholder="Name (e.g. Vitamin C)" value={newNutrName} onChange={(e) => setNewNutrName(e.target.value)} className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs" />
                  <input type="text" required placeholder="Unit (mg)" value={newNutrUnit} onChange={(e) => setNewNutrUnit(e.target.value)} className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs font-mono" />
                  <input type="number" step="0.1" required min={0.1} placeholder="Daily RDA" value={newNutrRda} onChange={(e) => setNewNutrRda(e.target.value)} className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs font-mono" />
                  <input type="number" step="0.01" required min={0.01} max={1} placeholder="Weight (0.1)" value={newNutrWeight} onChange={(e) => setNewNutrWeight(e.target.value)} className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs font-mono" />
                  <input type="text" required placeholder="Guideline" value={newNutrGuideline} onChange={(e) => setNewNutrGuideline(e.target.value)} className="min-h-[40px] rounded-lg border border-[#123B35]/20 px-3 text-xs" />
                </div>
                <button type="submit" className="min-h-[40px] px-4 py-2 rounded-xl bg-[#123B35] text-white text-xs font-semibold">
                  Add Nutrient
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(approvingReq)}
        title={`Share ${approvingReq?.target_nutrient_label ?? ''} Request with Donors`}
        description={`This publishes a ${approvingReq?.requested_portions ?? 0}-meal request so verified donors can respond.`}
        confirmLabel="Approve & Share"
        reasonLabel="Optional Note"
        reasonPlaceholder="e.g. Kitchen ready for evening pickup."
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
        title="Dismiss Suggested Request"
        description="This removes the suggestion so it will not be shared with donors."
        confirmLabel="Dismiss"
        destructive
        requireReason
        reasonLabel="Reason"
        reasonPlaceholder="e.g. Already covered by local partner."
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
