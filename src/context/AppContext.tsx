import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { createIsolatedDemoDataset, type DemoDataset } from '../data/demoScenario';
import { isSupportedLanguage, translations, type SupportedLanguage, type TranslationDictionary } from '../i18n/translations';
import { translateToastText } from '../i18n/helpers';
import {
  evaluateAutoFoodSafety,
  runAutoMatchForNewRequest,
  runAutoPipelineForBatch,
} from '../lib/autoPipeline';
import { validateSplitAllocationBatch, type ProposedAllocationCandidate } from '../lib/matchingEngine';
import {
  analyzeCommunityNutritionalGaps,
  DEFAULT_NUTRIENT_CONFIGS,
  generateTargetedDonationRequests,
  resolveFoodCompositionForBatch,
  VALIDATED_FOOD_COMPOSITION_TABLE,
} from '../lib/nutriLoopEngine';
import { canPerformAction, type AppActionKey } from '../lib/rbac';
import { getSupabaseClient, supabaseConfigStatus } from '../lib/supabase';
import type {
  Allocation,
  AppNotification,
  AuditLog,
  BatchStatus,
  DeliveryRoute,
  DietaryPreference,
  DietaryType,
  DonationBatch,
  FoodSafetyCheck,
  ImpactRecord,
  Incident,
  IncidentStatus,
  IncidentType,
  InspectionStatus,
  IntakeChannel,
  MealRequest,
  MealTraceEvent,
  MealTraceEventType,
  OrgType,
  Organisation,
  Profile,
  RouteStatus,
  UserRole,
  VerificationStatus,
} from '../types/database';
import type {
  CommunityFoodInventoryRecord,
  CommunityGapAnalysis,
  CommunityNutritionProfile,
  FoodCompositionCategory,
  FoodCompositionItem,
  InventoryStage,
  NutrientConfig,
  NutritionalImpactSnapshot,
  TargetedDonationRequest,
} from '../types/nutriloop';

export interface ToastMessage {
  id: string;
  tone: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface AppContextValue {
  // Mode & connectivity
  isDemoMode: boolean;
  isSupabaseConfigured: boolean;
  missingEnvVars: string[];
  enterDemoMode: (initialRole?: UserRole) => void;
  exitDemoMode: () => void;
  resetDemoScenario: () => void;
  switchDemoRole: (role: UserRole) => void;

  // Auth & Profile
  session: Session | null;
  profile: Profile | null;
  activeOrganisation: Organisation | null;
  authLoading: boolean;
  dataLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (params: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    role: Exclude<UserRole, 'ADMINISTRATOR'>;
    language: SupportedLanguage;
  }) => Promise<{ error: string | null; requiresEmailVerification?: boolean }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  refreshSession: () => Promise<void>;

  // Language
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: TranslationDictionary;

  // Domain Datasets (Strictly either live Supabase or isolated Demo)
  organisations: Organisation[];
  batches: DonationBatch[];
  requests: MealRequest[];
  allocations: Allocation[];
  routes: DeliveryRoute[];
  safetyChecks: FoodSafetyCheck[];
  mealtraceEvents: MealTraceEvent[];
  impactRecords: ImpactRecord[];
  incidents: Incident[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  // NutriLoop Datasets
  foodCatalog: FoodCompositionItem[];
  nutrientConfigs: NutrientConfig[];
  communityProfiles: CommunityNutritionProfile[];
  communityInventory: CommunityFoodInventoryRecord[];
  targetedRequests: TargetedDonationRequest[];
  nutritionalSnapshots: NutritionalImpactSnapshot[];
  communityGapAnalyses: Record<string, CommunityGapAnalysis>;
  refreshAllData: () => Promise<void>;

  // Core Operational Mutations
  registerOrganisation: (payload: {
    name: string;
    org_type: OrgType;
    address: string;
    location_lat: number;
    location_lng: number;
    contact_person: string;
    contact_phone: string;
    fssai_reg_no?: string;
    ngo_reg_no?: string;
    daily_capacity: number;
    verificationFile?: File | null;
  }) => Promise<{ error: string | null }>;
  createDonationBatch: (payload: {
    donor_id: string;
    food_item: string;
    food_category: string;
    dietary_type: DietaryType;
    portions_available: number;
    prep_time: string;
    pickup_deadline: string;
    consume_by_time: string;
    temp_celsius: number | null;
    packaging_details: string;
    pickup_address: string;
    pickup_lat: number;
    pickup_lng: number;
    food_composition_id?: string | null;
    targeted_request_id?: string | null;
  }) => Promise<{ error: string | null }>;
  updateDonationBatch: (
    batchId: string,
    updates: Partial<Pick<DonationBatch, 'food_item' | 'portions_available' | 'packaging_details' | 'pickup_deadline' | 'consume_by_time'>>
  ) => Promise<{ error: string | null }>;
  cancelDonationBatch: (batchId: string, reason: string) => Promise<{ error: string | null }>;
  createMealRequest: (payload: {
    org_id: string;
    portions_needed: number;
    dietary_pref: DietaryPreference;
    urgency_score: number;
    intake_channel: IntakeChannel;
    required_by: string;
    notes?: string;
    idempotency_key?: string;
  }) => Promise<{ error: string | null }>;
  recordFoodSafetyInspection: (payload: {
    donation_batch_id: string;
    inspection_status: InspectionStatus;
    recorded_temp: number | null;
    packaging_condition: string;
    inspection_notes: string;
    rejection_reason: string;
    physical_inspection_confirmed: boolean;
  }) => Promise<{ error: string | null }>;
  proposeSplitAllocations: (
    batchId: string,
    proposals: ProposedAllocationCandidate[]
  ) => Promise<{ error: string | null }>;
  approveAllocation: (allocationId: string, reason: string) => Promise<{ error: string | null }>;
  respondToAllocation: (allocationId: string, decision: 'ACCEPTED' | 'DECLINED') => Promise<{ error: string | null }>;
  assignDeliveryRoute: (payload: {
    allocationIds: string[];
    deliveryPartnerId: string;
    deliveryPartnerName: string;
    estimatedDistance: number;
    estimatedDuration: number;
    vehicleCapacity: number;
    shiftPayoutReference: string;
  }) => Promise<{ error: string | null }>;
  updateRouteStatus: (routeId: string, status: RouteStatus) => Promise<{ error: string | null }>;
  recordMealTraceScan: (payload: {
    qr_token: string;
    event_type: Extract<MealTraceEventType, 'PICKUP_SCANNED' | 'HANDOVER_SCANNED' | 'PORTIONS_CONFIRMED'>;
    recorded_temp?: number | null;
    confirmed_portions?: number | null;
    distribution_area?: string;
    notes?: string;
  }) => Promise<{ error: string | null }>;
  updateOrganisationStatus: (
    orgId: string,
    status: VerificationStatus,
    reason: string
  ) => Promise<{ error: string | null }>;
  updateOrganisationCapacity: (orgId: string, dailyCapacity: number) => Promise<{ error: string | null }>;
  reportIncident: (payload: {
    batch_id: string | null;
    incident_type: IncidentType;
    description: string;
  }) => Promise<{ error: string | null }>;
  updateIncidentStatus: (
    incidentId: string,
    status: IncidentStatus,
    resolutionNotes: string
  ) => Promise<{ error: string | null }>;
  markNotificationRead: (notificationId: string) => Promise<void>;

  // NutriLoop Mutations
  upsertCommunityNutritionProfile: (payload: {
    org_id: string;
    children_1_9_count: number;
    adolescents_10_18_count: number;
    adults_19_59_count: number;
    pregnant_lactating_count: number;
    elderly_60_plus_count: number;
    dietary_restriction: DietaryPreference;
    planning_horizon_days: number;
    notes?: string | null;
  }) => Promise<{ error: string | null }>;
  recordCommunityInventory: (payload: {
    org_id: string;
    food_composition_id: string | null;
    custom_food_name: string;
    quantity_portions: number;
    portion_grams: number;
    inventory_stage: InventoryStage;
    source_batch_id?: string | null;
  }) => Promise<{ error: string | null }>;
  generateTargetedRequestsForOrg: (
    orgId: string,
    requiredDeliveryDateIso?: string
  ) => Promise<{ error: string | null; createdCount: number }>;
  approveTargetedDonationRequest: (
    requestId: string,
    notes?: string
  ) => Promise<{ error: string | null }>;
  dismissTargetedDonationRequest: (
    requestId: string,
    reason: string
  ) => Promise<{ error: string | null }>;
  upsertFoodCompositionItem: (payload: {
    food_code: string;
    food_name: string;
    food_category: FoodCompositionCategory;
    dietary_type: DietaryType;
    standard_portion_grams: number;
    calories_kcal_per_100g: number;
    protein_g_per_100g: number;
    iron_mg_per_100g: number;
    calcium_mg_per_100g: number;
    vitamin_a_mcg_per_100g: number;
    dietary_fibre_g_per_100g: number;
    extra_nutrients_per_100g?: Record<string, number>;
    source_dataset: string;
    source_reference: string;
  }) => Promise<{ error: string | null }>;
  addCustomNutrientConfig: (payload: {
    nutrient_key: string;
    display_name: string;
    unit: string;
    adult_daily_rda: number;
    priority_weight: number;
    source_guideline: string;
  }) => Promise<{ error: string | null }>;

  // Toasts
  toasts: ToastMessage[];
  pushToast: (tone: ToastMessage['tone'], title: string, description?: string) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function makeOpaqueToken(): string {
  const bytes = new Uint8Array(20);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function makeUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `hl-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoRole, setDemoRole] = useState<UserRole>('ADMINISTRATOR');
  const [demoData, setDemoData] = useState<DemoDataset>(() => createIsolatedDemoDataset());

  const [session, setSession] = useState<Session | null>(null);
  const [liveProfile, setLiveProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(supabaseConfigStatus.isConfigured);
  const [dataLoading, setDataLoading] = useState<boolean>(false);

  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const saved = window.localStorage.getItem('hungerlink_lang');
      return isSupportedLanguage(saved) ? saved : 'en';
    } catch {
      return 'en';
    }
  });
  const languageRef = React.useRef<SupportedLanguage>(language);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    languageRef.current = language;
    try {
      window.localStorage.setItem('hungerlink_lang', language);
    } catch {
      // Ignore storage restrictions
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      const pageTitles: Record<SupportedLanguage, string> = {
        en: 'HUNGERLINK — Connecting Every Meal to Someone in Need',
        ta: 'ஹங்கர்லிங்க் — ஒவ்வொரு உணவையும் தேவையுள்ளவரிடம் சேர்க்கும் பாலம்',
        hi: 'हंगरलिंक — हर भोजन को ज़रूरतमंद तक पहुँचाना',
        te: 'హంగర్‌లింక్ — ప్రతి భోజనాన్ని అవసరమైన వారికి చేర్చడం',
      };
      document.title = pageTitles[language];
    }
  }, [language]);

  // Live Supabase state
  const [liveOrgs, setLiveOrgs] = useState<Organisation[]>([]);
  const [liveBatches, setLiveBatches] = useState<DonationBatch[]>([]);
  const [liveRequests, setLiveRequests] = useState<MealRequest[]>([]);
  const [liveAllocations, setLiveAllocations] = useState<Allocation[]>([]);
  const [liveRoutes, setLiveRoutes] = useState<DeliveryRoute[]>([]);
  const [liveSafetyChecks, setLiveSafetyChecks] = useState<FoodSafetyCheck[]>([]);
  const [liveMealTrace, setLiveMealTrace] = useState<MealTraceEvent[]>([]);
  const [liveImpact, setLiveImpact] = useState<ImpactRecord[]>([]);
  const [liveIncidents, setLiveIncidents] = useState<Incident[]>([]);
  const [liveNotifications, setLiveNotifications] = useState<AppNotification[]>([]);
  const [liveAuditLogs, setLiveAuditLogs] = useState<AuditLog[]>([]);
  const [liveMemberOrgId, setLiveMemberOrgId] = useState<string | null>(null);
  // NutriLoop live state
  const [liveFoodCatalog, setLiveFoodCatalog] = useState<FoodCompositionItem[]>(VALIDATED_FOOD_COMPOSITION_TABLE);
  const [liveNutrientConfigs, setLiveNutrientConfigs] = useState<NutrientConfig[]>(DEFAULT_NUTRIENT_CONFIGS);
  const [liveCommunityProfiles, setLiveCommunityProfiles] = useState<CommunityNutritionProfile[]>([]);
  const [liveCommunityInventory, setLiveCommunityInventory] = useState<CommunityFoodInventoryRecord[]>([]);
  const [liveTargetedRequests, setLiveTargetedRequests] = useState<TargetedDonationRequest[]>([]);
  const [liveNutritionalSnapshots, setLiveNutritionalSnapshots] = useState<NutritionalImpactSnapshot[]>([]);

  const pushToast = useCallback((tone: ToastMessage['tone'], title: string, description?: string) => {
    const id = makeUuid();
    const lang = languageRef.current;
    const localizedTitle = translateToastText(title, lang) ?? title;
    const localizedDesc = translateToastText(description, lang);
    setToasts((prev) => [...prev, { id, tone, title: localizedTitle, description: localizedDesc }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const setLanguage = useCallback(
    (lang: SupportedLanguage) => {
      setLanguageState(lang);
      if (!isDemoMode && supabase && liveProfile) {
        void supabase.from('profiles').update({ preferred_language: lang }).eq('id', liveProfile.id);
      }
    },
    [isDemoMode, supabase, liveProfile]
  );

  const loadLiveProfile = useCallback(
    async (userId: string) => {
      if (!supabase) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (data) {
        const typed = data as Profile;
        setLiveProfile(typed);
        if (isSupportedLanguage(typed.preferred_language)) {
          setLanguageState(typed.preferred_language);
        }
      }
      const { data: membership } = await supabase
        .from('organisation_members')
        .select('organisation_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      setLiveMemberOrgId((membership as { organisation_id: string } | null)?.organisation_id ?? null);
    },
    [supabase]
  );

  const refreshAllData = useCallback(async () => {
    if (isDemoMode || !supabase || !session?.user) return;
    setDataLoading(true);
    try {
      const [
        orgsRes,
        batchesRes,
        reqsRes,
        allocsRes,
        routesRes,
        stopsRes,
        safetyRes,
        traceRes,
        impactRes,
        incidentsRes,
        notifRes,
        auditRes,
        foodRefRes,
        nutrCfgRes,
        commProfRes,
        commInvRes,
        targReqRes,
        snapRes,
      ] = await Promise.all([
        supabase.from('organisations').select('*').eq('is_demo', false).order('created_at', { ascending: false }),
        supabase.from('donation_batches').select('*').eq('is_demo', false).order('created_at', { ascending: false }),
        supabase.from('meal_requests').select('*').eq('is_demo', false).order('created_at', { ascending: false }),
        supabase.from('allocations').select('*').eq('is_demo', false).order('created_at', { ascending: false }),
        supabase.from('delivery_routes').select('*').eq('is_demo', false).order('created_at', { ascending: false }),
        supabase.from('delivery_stops').select('*').order('stop_order', { ascending: true }),
        supabase.from('food_safety_checks').select('*').order('inspected_at', { ascending: false }),
        supabase.from('mealtrace_events').select('*').order('created_at', { ascending: true }),
        supabase.from('impact_records').select('*').eq('is_demo', false).order('confirmed_at', { ascending: false }),
        supabase.from('incidents').select('*').order('created_at', { ascending: false }),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('food_composition_reference').select('*').eq('is_active', true).order('food_name', { ascending: true }),
        supabase.from('nutrient_configurations').select('*').order('is_core', { ascending: false }),
        supabase.from('community_nutrition_profiles').select('*').eq('is_demo', false),
        supabase.from('community_food_inventory').select('*').eq('is_demo', false).order('recorded_at', { ascending: false }),
        supabase.from('targeted_donation_requests').select('*').eq('is_demo', false).order('created_at', { ascending: false }),
        supabase.from('nutritional_impact_snapshots').select('*').eq('is_demo', false).order('recorded_at', { ascending: false }),
      ]);

      const stopsByRoute = new Map<string, DeliveryRoute['stops']>();
      for (const s of (stopsRes.data ?? []) as NonNullable<DeliveryRoute['stops']>) {
        const list = stopsByRoute.get(s.route_id) ?? [];
        list.push(s);
        stopsByRoute.set(s.route_id, list);
      }

      setLiveOrgs((orgsRes.data ?? []) as Organisation[]);
      setLiveBatches((batchesRes.data ?? []) as DonationBatch[]);
      setLiveRequests((reqsRes.data ?? []) as MealRequest[]);
      setLiveAllocations((allocsRes.data ?? []) as Allocation[]);
      setLiveRoutes(
        ((routesRes.data ?? []) as DeliveryRoute[]).map((r) => ({
          ...r,
          stops: stopsByRoute.get(r.id) ?? [],
        }))
      );
      setLiveSafetyChecks((safetyRes.data ?? []) as FoodSafetyCheck[]);
      setLiveMealTrace((traceRes.data ?? []) as MealTraceEvent[]);
      setLiveImpact((impactRes.data ?? []) as ImpactRecord[]);
      setLiveIncidents((incidentsRes.data ?? []) as Incident[]);
      setLiveNotifications((notifRes.data ?? []) as AppNotification[]);
      setLiveAuditLogs((auditRes.data ?? []) as AuditLog[]);

      // Reference tables retain ICMR-NIN / FAO-INFOODS validated baseline if migration seed is not yet applied
      const dbFoodRef = (foodRefRes.data ?? []) as FoodCompositionItem[];
      setLiveFoodCatalog(dbFoodRef.length > 0 ? dbFoodRef : VALIDATED_FOOD_COMPOSITION_TABLE);
      const dbNutrCfg = (nutrCfgRes.data ?? []) as NutrientConfig[];
      setLiveNutrientConfigs(dbNutrCfg.length > 0 ? dbNutrCfg : DEFAULT_NUTRIENT_CONFIGS);
      setLiveCommunityProfiles((commProfRes.data ?? []) as CommunityNutritionProfile[]);
      setLiveCommunityInventory((commInvRes.data ?? []) as CommunityFoodInventoryRecord[]);
      setLiveTargetedRequests((targReqRes.data ?? []) as TargetedDonationRequest[]);
      setLiveNutritionalSnapshots((snapRes.data ?? []) as NutritionalImpactSnapshot[]);
    } catch (err) {
      pushToast(
        'error',
        'Unable to refresh Supabase records',
        err instanceof Error ? err.message : 'Check network and RLS policies.'
      );
    } finally {
      setDataLoading(false);
    }
  }, [isDemoMode, supabase, session, pushToast]);

  // Auth lifecycle
  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      if (data.session?.user) {
        void loadLiveProfile(data.session.user.id);
      }
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      if (nextSession?.user) {
        void loadLiveProfile(nextSession.user.id);
      } else {
        setLiveProfile(null);
        setLiveMemberOrgId(null);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase, loadLiveProfile]);

  // Fetch operational data + subscribe to Supabase Realtime when authenticated in live mode
  useEffect(() => {
    if (isDemoMode || !supabase || !session?.user) return;
    void refreshAllData();

    const channel = supabase
      .channel('hungerlink-live-ops')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donation_batches' }, () => {
        void refreshAllData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meal_requests' }, () => {
        void refreshAllData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'allocations' }, () => {
        void refreshAllData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_routes' }, () => {
        void refreshAllData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mealtrace_events' }, () => {
        void refreshAllData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_food_inventory' }, () => {
        void refreshAllData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'targeted_donation_requests' }, () => {
        void refreshAllData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nutritional_impact_snapshots' }, () => {
        void refreshAllData();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const next = payload.new as AppNotification;
        if (next.user_id === session.user.id) {
          pushToast('info', next.title, next.message);
          void refreshAllData();
        }
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isDemoMode, supabase, session, refreshAllData, pushToast]);

  // Demo mode controls
  const enterDemoMode = useCallback(
    (initialRole: UserRole = 'ADMINISTRATOR') => {
      setDemoRole(initialRole);
      setIsDemoMode(true);
      pushToast(
        'info',
        'Isolated Demo Mode Active',
        'Sample records (Wedding Hall A: 100 portions) are strictly separated from live Supabase analytics.'
      );
    },
    [pushToast]
  );

  const exitDemoMode = useCallback(() => {
    setIsDemoMode(false);
  }, []);

  const resetDemoScenario = useCallback(() => {
    setDemoData(createIsolatedDemoDataset());
    pushToast('success', 'Demo Scenario Reset', 'Wedding Hall A (100) / Shelter A (60) / Kitchen B (30) restored.');
  }, [pushToast]);

  const switchDemoRole = useCallback(
    (role: UserRole) => {
      setDemoRole(role);
      pushToast('info', `Demo Persona: ${translations[language].roles[role]}`);
    },
    [language, pushToast]
  );

  // Auth handlers
  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return { error: 'Supabase credentials are not configured.' };
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      setIsDemoMode(false);
      return { error: null };
    },
    [supabase]
  );

  const signUp = useCallback(
    async (params: {
      email: string;
      password: string;
      fullName: string;
      phone: string;
      role: Exclude<UserRole, 'ADMINISTRATOR'>;
      language: SupportedLanguage;
    }) => {
      if (!supabase) return { error: 'Supabase credentials are not configured.' };
      const { data, error } = await supabase.auth.signUp({
        email: params.email,
        password: params.password,
        options: {
          data: {
            full_name: params.fullName,
            phone: params.phone,
            role: params.role,
            preferred_language: params.language,
          },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });
      if (error) return { error: error.message };
      return {
        error: null,
        requiresEmailVerification: !data.session,
      };
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    if (isDemoMode) {
      setIsDemoMode(false);
      return;
    }
    if (supabase) {
      await supabase.auth.signOut();
    }
    setLiveProfile(null);
    setSession(null);
  }, [isDemoMode, supabase]);

  const requestPasswordReset = useCallback(
    async (email: string) => {
      if (!supabase) return { error: 'Supabase credentials are not configured.' };
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      return { error: error ? error.message : null };
    },
    [supabase]
  );

  const refreshSession = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      pushToast('error', 'Session refresh failed', error.message);
      return;
    }
    setSession(data.session ?? null);
    pushToast('success', 'Session refreshed');
  }, [supabase, pushToast]);

  // Active persona & org resolution
  const profile: Profile | null = isDemoMode ? demoData.profiles[demoRole] : liveProfile;
  const organisations = isDemoMode ? demoData.organisations : liveOrgs;
  const batches = isDemoMode ? demoData.batches : liveBatches;
  const requests = isDemoMode ? demoData.requests : liveRequests;
  const allocations = isDemoMode ? demoData.allocations : liveAllocations;
  const routes = isDemoMode ? demoData.routes : liveRoutes;
  const safetyChecks = isDemoMode ? demoData.safetyChecks : liveSafetyChecks;
  const mealtraceEvents = isDemoMode ? demoData.mealtraceEvents : liveMealTrace;
  const impactRecords = isDemoMode ? demoData.impactRecords : liveImpact;
  const incidents = isDemoMode ? demoData.incidents : liveIncidents;
  const notifications = isDemoMode ? demoData.notifications : liveNotifications;
  const auditLogs = isDemoMode ? demoData.auditLogs : liveAuditLogs;
  const foodCatalog = isDemoMode ? demoData.foodCatalog : liveFoodCatalog;
  const nutrientConfigs = isDemoMode ? demoData.nutrientConfigs : liveNutrientConfigs;
  const communityProfiles = isDemoMode ? demoData.communityProfiles : liveCommunityProfiles;
  const communityInventory = isDemoMode ? demoData.communityInventory : liveCommunityInventory;
  const targetedRequests = isDemoMode ? demoData.targetedRequests : liveTargetedRequests;
  const nutritionalSnapshots = isDemoMode ? demoData.nutritionalSnapshots : liveNutritionalSnapshots;

  const communityGapAnalyses = useMemo(() => {
    const map: Record<string, CommunityGapAnalysis> = {};
    for (const cp of communityProfiles) {
      map[cp.org_id] = analyzeCommunityNutritionalGaps({
        profile: cp,
        inventory: communityInventory,
        foodCatalog,
        nutrientConfigs,
      });
    }
    return map;
  }, [communityProfiles, communityInventory, foodCatalog, nutrientConfigs]);

  const activeOrganisation = useMemo(() => {
    if (isDemoMode) {
      if (demoRole === 'FOOD_DONOR') return organisations.find((o) => o.org_type === 'FOOD_DONOR') ?? null;
      if (demoRole === 'VERIFIED_NGO') return organisations.find((o) => o.org_type === 'VERIFIED_NGO' && o.verification_status === 'verified') ?? null;
      if (demoRole === 'COMMUNITY_KITCHEN') return organisations.find((o) => o.org_type === 'COMMUNITY_KITCHEN') ?? null;
      return organisations[0] ?? null;
    }
    if (!liveMemberOrgId) return null;
    return liveOrgs.find((o) => o.id === liveMemberOrgId) ?? null;
  }, [isDemoMode, demoRole, organisations, liveMemberOrgId, liveOrgs]);

  const requireAction = useCallback(
    (action: AppActionKey): string | null => {
      if (!canPerformAction(profile?.role, action)) {
        const deniedMessages: Record<SupportedLanguage, string> = {
          en: 'Permission denied: Your current role is not authorised to perform this action.',
          ta: 'அனுமதி மறுக்கப்பட்டது: உங்கள் தற்போதைய பாத்திரத்திற்கு இந்தச் செயலைச் செய்ய அனுமதி இல்லை.',
          hi: 'अनुमति अस्वीकृत: आपकी वर्तमान भूमिका को यह कार्य करने की अनुमति नहीं है।',
          te: 'అనుమతి నిరాకరించబడింది: మీ ప్రస్తుత పాత్రకు ఈ చర్య చేసే అధికారం లేదు.',
        };
        return deniedMessages[languageRef.current];
      }
      return null;
    },
    [profile]
  );

  // ---------------------------------------------------------------------------
  // Domain Operations (Live Supabase RPC / Table Ops OR Isolated Demo State)
  // ---------------------------------------------------------------------------
  const registerOrganisation: AppContextValue['registerOrganisation'] = useCallback(
    async (payload) => {
      const denied = requireAction('org:register');
      if (denied) return { error: denied };
      if (isDemoMode) {
        const newOrg: Organisation = {
          id: makeUuid(),
          name: `${payload.name} [Demo]`,
          org_type: payload.org_type,
          address: payload.address,
          location_lat: payload.location_lat,
          location_lng: payload.location_lng,
          contact_person: payload.contact_person,
          contact_phone: payload.contact_phone,
          fssai_reg_no: payload.fssai_reg_no || null,
          ngo_reg_no: payload.ngo_reg_no || null,
          verification_status: 'pending',
          verification_doc_path: payload.verificationFile ? `demo/${payload.verificationFile.name}` : null,
          verification_reason: null,
          daily_capacity: payload.daily_capacity,
          is_demo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setDemoData((prev) => ({
          ...prev,
          organisations: [newOrg, ...prev.organisations],
          notifications: [
            {
              id: makeUuid(),
              user_id: prev.profiles.ADMINISTRATOR.id,
              notification_type: 'ORG_PENDING_REVIEW',
              title: 'Organisation Verification Submitted',
              message: `${newOrg.name} is awaiting administrator review.`,
              read_at: null,
              created_at: new Date().toISOString(),
            },
            ...prev.notifications,
          ],
        }));
        pushToast('success', 'Organisation registered (Pending Verification)');
        return { error: null };
      }

      if (!supabase || !session?.user) return { error: 'Not signed in.' };
      let docPath: string | null = null;
      if (payload.verificationFile) {
        const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowed.includes(payload.verificationFile.type)) {
          return { error: 'Verification document must be PDF, JPEG, or PNG.' };
        }
        if (payload.verificationFile.size > 5 * 1024 * 1024) {
          return { error: 'Verification document must be under 5 MB.' };
        }
        const safeName = payload.verificationFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        docPath = `${session.user.id}/${Date.now()}_${safeName}`;
        const { error: uploadErr } = await supabase.storage
          .from('org-verification-docs')
          .upload(docPath, payload.verificationFile, { upsert: false });
        if (uploadErr) return { error: uploadErr.message };
      }

      
const newOrgId = makeUuid();

const { error: orgErr } = await supabase
  .from('organisations')
  .insert({
    id: newOrgId,
    name: payload.name,
    org_type: payload.org_type,
    address: payload.address,
    location_lat: payload.location_lat,
    location_lng: payload.location_lng,
    contact_person: payload.contact_person,
    contact_phone: payload.contact_phone,
    fssai_reg_no: payload.fssai_reg_no || null,
    ngo_reg_no: payload.ngo_reg_no || null,
    daily_capacity: payload.daily_capacity,
    verification_status: 'pending',
    verification_doc_path: docPath,
    is_demo: false,
  });

if (orgErr) return { error: orgErr.message };

// Create the first OWNER membership before retrieving the organisation.
const { error: memberErr } = await supabase
  .from('organisation_members')
  .insert({
    organisation_id: newOrgId,
    user_id: session.user.id,
    membership_role: 'OWNER',
    status: 'active',
  });

if (memberErr) return { error: memberErr.message };

// Now the user is an organisation member and can retrieve the pending organisation.
const { data: createdOrg, error: fetchErr } = await supabase
  .from('organisations')
  .select('*')
  .eq('id', newOrgId)
  .single();

if (fetchErr || !createdOrg) {
  return { error: fetchErr?.message ?? 'Failed to retrieve registered organisation.' };
}

setLiveMemberOrgId((createdOrg as Organisation).id);


      await refreshAllData();
      pushToast('success', 'Organisation registered', 'Your organisation is now pending administrator verification.');
      return { error: null };
    },
    [requireAction, isDemoMode, supabase, session, refreshAllData, pushToast]
  );

  const createDonationBatch: AppContextValue['createDonationBatch'] = useCallback(
    async (payload) => {
      const denied = requireAction('donation:create');
      if (denied) return { error: denied };
      const donor = organisations.find((o) => o.id === payload.donor_id);
      if (!donor || donor.verification_status !== 'verified') {
        return { error: 'Only verified donor organisations may submit food donations.' };
      }
      if (!Number.isInteger(payload.portions_available) || payload.portions_available <= 0) {
        return { error: 'Portions available must be a positive whole number.' };
      }

      // Guard against duplicate matching to an already fulfilled/matched targeted request
      let targetNeed: TargetedDonationRequest | undefined;
      if (payload.targeted_request_id) {
        targetNeed = targetedRequests.find((tr) => tr.id === payload.targeted_request_id);
        if (!targetNeed) {
          return { error: 'Referenced NutriLoop targeted request was not found.' };
        }
        if (targetNeed.status !== 'APPROVED_PUBLISHED') {
          return {
            error: `This targeted request is already ${targetNeed.status.replace(/_/g, ' ')} and cannot accept duplicate fulfilment.`,
          };
        }
      }

      const batchCode = `HL-${isDemoMode ? 'DEMO' : '2026'}-${Math.floor(1000 + Math.random() * 9000)}`;

      if (isDemoMode) {
        const nowIso = new Date().toISOString();
        const newBatch: DonationBatch = {
          id: makeUuid(),
          batch_code: batchCode,
          qr_token: `hl_demo_${makeOpaqueToken()}`,
          donor_id: payload.donor_id,
          created_by: profile?.id ?? null,
          food_item: payload.food_item,
          food_category: payload.food_category,
          dietary_type: payload.dietary_type,
          food_composition_id: payload.food_composition_id ?? null,
          portions_available: payload.portions_available,
          portions_allocated: 0,
          prep_time: payload.prep_time,
          pickup_deadline: payload.pickup_deadline,
          consume_by_time: payload.consume_by_time,
          temp_celsius: payload.temp_celsius,
          packaging_details: payload.packaging_details,
          safety_gate_passed: false,
          status: 'PENDING_INSPECTION',
          cancellation_reason: null,
          pickup_address: payload.pickup_address,
          pickup_lat: payload.pickup_lat,
          pickup_lng: payload.pickup_lng,
          is_demo: true,
          created_at: nowIso,
          updated_at: nowIso,
        };

        // Run full 1-step automatic pipeline: Safety Check -> Smart Match -> Auto-Approve -> Driver Route Dispatch
        const pipeline = runAutoPipelineForBatch({
          batch: newBatch,
          donor,
          requests: demoData.requests,
          organisations: demoData.organisations,
          existingAllocations: demoData.allocations,
          communityGapAnalyses,
          foodCatalog: demoData.foodCatalog,
          deliveryDriver: {
            id: demoData.profiles.DELIVERY_PARTNER.id,
            fullName: demoData.profiles.DELIVERY_PARTNER.full_name,
            vehicleCapacity: 150,
          },
          adminUserId: demoData.profiles.ADMINISTRATOR.id,
          nowIso,
        });

        const addedByReq = new Map<string, number>();
        for (const alloc of pipeline.createdAllocations) {
          addedByReq.set(alloc.meal_request_id, (addedByReq.get(alloc.meal_request_id) ?? 0) + alloc.allocated_portions);
        }

        setDemoData((prev) => {
          const nextAllocations = [...pipeline.createdAllocations, ...prev.allocations];
          const nextRequests = prev.requests.map((r) => {
            if (!addedByReq.has(r.id)) return r;
            const totalAllocatedForReq = nextAllocations
              .filter((a) => a.meal_request_id === r.id && !['DECLINED', 'CANCELLED'].includes(a.status))
              .reduce((s, a) => s + a.allocated_portions, 0);
            return {
              ...r,
              status: (totalAllocatedForReq >= r.portions_needed ? 'ALLOCATED' : 'PARTIALLY_ALLOCATED') as MealRequest['status'],
              updated_at: nowIso,
            };
          });

          return {
            ...prev,
            batches: [pipeline.updatedBatch, ...prev.batches],
            safetyChecks: [pipeline.safetyCheck, ...prev.safetyChecks],
            allocations: nextAllocations,
            requests: nextRequests,
            routes: pipeline.createdRoute ? [pipeline.createdRoute, ...prev.routes] : prev.routes,
            targetedRequests: payload.targeted_request_id
              ? prev.targetedRequests.map((tr) =>
                  tr.id === payload.targeted_request_id
                    ? { ...tr, status: 'MATCHED', matched_batch_id: newBatch.id, updated_at: nowIso }
                    : tr
                )
              : prev.targetedRequests,
            mealtraceEvents: [
              ...prev.mealtraceEvents,
              {
                id: makeUuid(),
                donation_batch_id: newBatch.id,
                event_type: 'DONATION_SUBMITTED',
                actor_id: profile?.id ?? null,
                actor_label: donor.name,
                recorded_temp: payload.temp_celsius,
                confirmed_portions: null,
                event_metadata: {
                  portions_available: payload.portions_available,
                  targeted_request_id: payload.targeted_request_id ?? null,
                },
                created_at: nowIso,
              },
              ...pipeline.traceEvents,
            ],
            auditLogs: [
              ...pipeline.auditLogs,
              ...(payload.targeted_request_id
                ? [
                    {
                      id: makeUuid(),
                      actor_id: profile?.id ?? null,
                      actor_label: profile?.full_name,
                      action: 'TARGETED_REQUEST_RESPONDED',
                      entity_type: 'targeted_donation_requests',
                      entity_id: payload.targeted_request_id,
                      metadata: { batch_id: newBatch.id, batch_code: batchCode },
                      created_at: nowIso,
                    },
                  ]
                : []),
              ...prev.auditLogs,
            ],
            notifications: [...pipeline.notifications, ...prev.notifications],
          };
        });

        if (!pipeline.safetyPassed) {
          pushToast('error', `Auto-Safety Blocked: ${batchCode}`, pipeline.safetyReason);
        } else if (pipeline.createdRoute && pipeline.assignedDriverName) {
          pushToast(
            'success',
            `Auto-Dispatched: ${batchCode}`,
            `Safety verified, matched to ${pipeline.matchedOrgNames.join(', ')}, and driver ${pipeline.assignedDriverName} assigned.`
          );
        } else {
          pushToast(
            'success',
            `Donation ${batchCode} submitted`,
            targetNeed
              ? `Auto-verified safe & linked to NutriLoop ${targetNeed.target_nutrient_label} need. Ready for instant match.`
              : 'Auto-verified safe & QR generated. Will dispatch automatically as soon as a shelter requests meals.'
          );
        }
        return { error: null };
      }

      if (!supabase || !session?.user) return { error: 'Not signed in.' };

      const liveSafetyEval = evaluateAutoFoodSafety({
        food_category: payload.food_category,
        temp_celsius: payload.temp_celsius,
        consume_by_time: payload.consume_by_time,
        pickup_deadline: payload.pickup_deadline,
        packaging_details: payload.packaging_details,
      });

      const { data: insertedBatch, error } = await supabase
        .from('donation_batches')
        .insert({
          batch_code: batchCode,
          donor_id: payload.donor_id,
          created_by: session.user.id,
          food_item: payload.food_item,
          food_category: payload.food_category,
          dietary_type: payload.dietary_type,
          food_composition_id: payload.food_composition_id ?? null,
          portions_available: payload.portions_available,
          prep_time: payload.prep_time,
          pickup_deadline: payload.pickup_deadline,
          consume_by_time: payload.consume_by_time,
          temp_celsius: payload.temp_celsius,
          packaging_details: payload.packaging_details,
          pickup_address: payload.pickup_address,
          pickup_lat: payload.pickup_lat,
          pickup_lng: payload.pickup_lng,
          status: liveSafetyEval.passed ? 'INSPECTION_PASSED' : 'INSPECTION_REJECTED',
          safety_gate_passed: liveSafetyEval.passed,
          is_demo: false,
        })
        .select('id')
        .single();
      if (error) return { error: error.message };

      if (payload.targeted_request_id && insertedBatch?.id) {
        await supabase
          .from('targeted_donation_requests')
          .update({ status: 'MATCHED', matched_batch_id: insertedBatch.id })
          .eq('id', payload.targeted_request_id)
          .eq('status', 'APPROVED_PUBLISHED');
      }

      await refreshAllData();
      if (!liveSafetyEval.passed) {
        pushToast('error', `Auto-Safety Blocked: ${batchCode}`, liveSafetyEval.reason);
      } else {
        pushToast('success', `Donation ${batchCode} submitted`, liveSafetyEval.reason);
      }
      return { error: null };
    },
    [
      requireAction,
      organisations,
      targetedRequests,
      isDemoMode,
      profile,
      demoData,
      communityGapAnalyses,
      supabase,
      session,
      refreshAllData,
      pushToast,
    ]
  );

  const updateDonationBatch: AppContextValue['updateDonationBatch'] = useCallback(
    async (batchId, updates) => {
      const denied = requireAction('donation:manage');
      if (denied) return { error: denied };
      const target = batches.find((b) => b.id === batchId);
      if (!target) return { error: 'Batch not found.' };
      if (target.portions_allocated > 0 || !['SUBMITTED', 'PENDING_INSPECTION'].includes(target.status)) {
        return { error: 'Donations can only be edited before allocation and final inspection.' };
      }
      if (isDemoMode) {
        setDemoData((prev) => ({
          ...prev,
          batches: prev.batches.map((b) =>
            b.id === batchId ? { ...b, ...updates, updated_at: new Date().toISOString() } : b
          ),
        }));
        pushToast('success', 'Donation updated');
        return { error: null };
      }
      if (!supabase) return { error: 'Supabase not configured.' };
      const { error } = await supabase.from('donation_batches').update(updates).eq('id', batchId);
      if (error) return { error: error.message };
      await refreshAllData();
      pushToast('success', 'Donation updated');
      return { error: null };
    },
    [requireAction, batches, isDemoMode, supabase, refreshAllData, pushToast]
  );

  const cancelDonationBatch: AppContextValue['cancelDonationBatch'] = useCallback(
    async (batchId, reason) => {
      const denied = requireAction('donation:manage');
      if (denied) return { error: denied };
      if (!reason.trim() || reason.trim().length < 3) {
        return { error: 'Cancellation reason is mandatory.' };
      }
      const target = batches.find((b) => b.id === batchId);
      if (!target) return { error: 'Batch not found.' };
      if (target.portions_allocated > 0 && profile?.role !== 'ADMINISTRATOR') {
        return { error: 'Allocated batches require coordinator intervention to cancel.' };
      }
      if (isDemoMode) {
        setDemoData((prev) => ({
          ...prev,
          batches: prev.batches.map((b) =>
            b.id === batchId
              ? { ...b, status: 'CANCELLED' as BatchStatus, cancellation_reason: reason.trim(), updated_at: new Date().toISOString() }
              : b
          ),
          auditLogs: [
            {
              id: makeUuid(),
              actor_id: profile?.id ?? null,
              actor_label: profile?.full_name,
              action: 'DONATION_CANCELLED',
              entity_type: 'donation_batches',
              entity_id: batchId,
              metadata: { reason: reason.trim() },
              created_at: new Date().toISOString(),
            },
            ...prev.auditLogs,
          ],
        }));
        pushToast('info', 'Donation cancelled', reason.trim());
        return { error: null };
      }
      if (!supabase) return { error: 'Supabase not configured.' };
      const { error } = await supabase
        .from('donation_batches')
        .update({ status: 'CANCELLED', cancellation_reason: reason.trim() })
        .eq('id', batchId);
      if (error) return { error: error.message };
      await refreshAllData();
      pushToast('info', 'Donation cancelled');
      return { error: null };
    },
    [requireAction, batches, profile, isDemoMode, supabase, refreshAllData, pushToast]
  );

  const createMealRequest: AppContextValue['createMealRequest'] = useCallback(
    async (payload) => {
      const denied = requireAction(payload.intake_channel === 'WEB_PORTAL' ? 'request:create' : 'field:intake');
      if (denied) return { error: denied };
      const org = organisations.find((o) => o.id === payload.org_id);
      if (!org || org.verification_status !== 'verified') {
        return { error: 'Only verified recipient organisations may receive meal requests.' };
      }

      if (isDemoMode) {
        // Idempotency check in Demo Mode mirrors PostgreSQL submit_assisted_request RPC
        if (payload.idempotency_key) {
          const dup = demoData.requests.find((r) => r.idempotency_key === payload.idempotency_key);
          if (dup) {
            return { error: null };
          }
        }
        const nowIso = new Date().toISOString();
        const created: MealRequest = {
          id: makeUuid(),
          org_id: payload.org_id,
          submitted_by: profile?.id ?? null,
          portions_needed: payload.portions_needed,
          portions_fulfilled: 0,
          dietary_pref: payload.dietary_pref,
          urgency_score: payload.urgency_score,
          wait_started_at: nowIso,
          intake_channel: payload.intake_channel,
          required_by: payload.required_by,
          status: 'OPEN',
          idempotency_key: payload.idempotency_key ?? null,
          notes: payload.notes ?? null,
          is_demo: true,
          created_at: nowIso,
          updated_at: nowIso,
        };

        // Immediately match & dispatch if a verified safe surplus batch already has remaining portions
        const autoMatch = runAutoMatchForNewRequest({
          request: created,
          recipientOrg: org,
          batches: demoData.batches,
          organisations: demoData.organisations,
          existingAllocations: demoData.allocations,
          communityGapAnalyses,
          foodCatalog: demoData.foodCatalog,
          deliveryDriver: {
            id: demoData.profiles.DELIVERY_PARTNER.id,
            fullName: demoData.profiles.DELIVERY_PARTNER.full_name,
            vehicleCapacity: 150,
          },
          adminUserId: demoData.profiles.ADMINISTRATOR.id,
          nowIso,
        });

        const finalRequest: MealRequest = autoMatch.createdAllocation
          ? {
              ...created,
              status:
                autoMatch.createdAllocation.allocated_portions >= created.portions_needed
                  ? 'ALLOCATED'
                  : 'PARTIALLY_ALLOCATED',
            }
          : created;

        setDemoData((prev) => ({
          ...prev,
          requests: [finalRequest, ...prev.requests],
          batches: autoMatch.matchedBatch
            ? prev.batches.map((b) => (b.id === autoMatch.matchedBatch!.id ? autoMatch.matchedBatch! : b))
            : prev.batches,
          allocations: autoMatch.createdAllocation
            ? [autoMatch.createdAllocation, ...prev.allocations]
            : prev.allocations,
          routes: autoMatch.createdRoute ? [autoMatch.createdRoute, ...prev.routes] : prev.routes,
          mealtraceEvents: autoMatch.traceEvent
            ? [...prev.mealtraceEvents, autoMatch.traceEvent]
            : prev.mealtraceEvents,
          auditLogs: autoMatch.auditLog ? [autoMatch.auditLog, ...prev.auditLogs] : prev.auditLogs,
        }));

        if (autoMatch.matchedBatch && autoMatch.createdAllocation && autoMatch.createdRoute) {
          pushToast(
            'success',
            `Auto-Dispatched: ${autoMatch.matchedBatch.batch_code}`,
            `Matched ${autoMatch.createdAllocation.allocated_portions} portions for ${org.name} — driver ${autoMatch.createdRoute.delivery_partner_name} assigned.`
          );
        } else {
          pushToast('success', 'Meal request recorded', `${payload.portions_needed} portions for ${org.name}`);
        }
        return { error: null };
      }

      if (!supabase || !session?.user) return { error: 'Not signed in.' };

      if (payload.idempotency_key) {
        const { error } = await supabase.rpc('submit_assisted_request', {
          p_idempotency_key: payload.idempotency_key,
          p_org_id: payload.org_id,
          p_portions_needed: payload.portions_needed,
          p_dietary_pref: payload.dietary_pref,
          p_urgency_score: payload.urgency_score,
          p_intake_channel: payload.intake_channel,
          p_required_by: payload.required_by,
          p_notes: payload.notes ?? null,
        });
        if (error) return { error: error.message };
      } else {
        const { error } = await supabase.from('meal_requests').insert({
          org_id: payload.org_id,
          submitted_by: session.user.id,
          portions_needed: payload.portions_needed,
          dietary_pref: payload.dietary_pref,
          urgency_score: payload.urgency_score,
          intake_channel: payload.intake_channel,
          required_by: payload.required_by,
          notes: payload.notes ?? null,
          is_demo: false,
        });
        if (error) return { error: error.message };
      }

      await refreshAllData();
      pushToast('success', 'Meal request submitted');
      return { error: null };
    },
    [
      requireAction,
      organisations,
      isDemoMode,
      demoData,
      communityGapAnalyses,
      profile,
      supabase,
      session,
      refreshAllData,
      pushToast,
    ]
  );

  const recordFoodSafetyInspection: AppContextValue['recordFoodSafetyInspection'] = useCallback(
    async (payload) => {
      const denied = requireAction('safety:inspect');
      if (denied) return { error: denied };
      if (!profile) return { error: 'Not signed in.' };
      if (payload.inspection_status === 'PASSED' && (!payload.physical_inspection_confirmed || payload.recorded_temp === null)) {
        return { error: 'Physical inspection confirmation and recorded temperature are mandatory to pass.' };
      }
      if (payload.inspection_status === 'REJECTED' && payload.rejection_reason.trim().length < 3) {
        return { error: 'A rejection reason is required when rejecting food.' };
      }

      if (isDemoMode) {
        const nowIso = new Date().toISOString();
        const check: FoodSafetyCheck = {
          id: makeUuid(),
          donation_batch_id: payload.donation_batch_id,
          inspector_id: profile.id,
          inspector_name: profile.full_name,
          inspection_status: payload.inspection_status,
          recorded_temp: payload.recorded_temp,
          packaging_condition: payload.packaging_condition,
          inspection_notes: payload.inspection_notes || null,
          rejection_reason: payload.rejection_reason || null,
          physical_inspection_confirmed: payload.physical_inspection_confirmed,
          inspected_at: nowIso,
        };
        const newEvents: MealTraceEvent[] = [];
        if (payload.inspection_status === 'PASSED' || payload.inspection_status === 'REJECTED') {
          newEvents.push({
            id: makeUuid(),
            donation_batch_id: payload.donation_batch_id,
            event_type: payload.inspection_status === 'PASSED' ? 'INSPECTION_PASSED' : 'INSPECTION_REJECTED',
            actor_id: profile.id,
            actor_label: profile.full_name,
            recorded_temp: payload.recorded_temp,
            confirmed_portions: null,
            event_metadata: { packaging: payload.packaging_condition, rejection_reason: payload.rejection_reason },
            created_at: nowIso,
          });
        }
        if (payload.inspection_status === 'PASSED') {
          newEvents.push({
            id: makeUuid(),
            donation_batch_id: payload.donation_batch_id,
            event_type: 'QR_GENERATED',
            actor_id: profile.id,
            actor_label: 'MealTrace System',
            recorded_temp: null,
            confirmed_portions: null,
            event_metadata: { note: 'Opaque QR token issued after physical inspection' },
            created_at: nowIso,
          });
        }

        setDemoData((prev) => ({
          ...prev,
          safetyChecks: [check, ...prev.safetyChecks],
          batches: prev.batches.map((b) =>
            b.id === payload.donation_batch_id
              ? {
                  ...b,
                  safety_gate_passed: payload.inspection_status === 'PASSED',
                  temp_celsius: payload.recorded_temp ?? b.temp_celsius,
                  status:
                    payload.inspection_status === 'PASSED'
                      ? 'INSPECTION_PASSED'
                      : payload.inspection_status === 'REJECTED'
                      ? 'INSPECTION_REJECTED'
                      : 'PENDING_INSPECTION',
                  updated_at: nowIso,
                }
              : b
          ),
          mealtraceEvents: [...prev.mealtraceEvents, ...newEvents],
          auditLogs: [
            {
              id: makeUuid(),
              actor_id: profile.id,
              actor_label: profile.full_name,
              action: `FOOD_SAFETY_${payload.inspection_status}`,
              entity_type: 'donation_batches',
              entity_id: payload.donation_batch_id,
              metadata: { recorded_temp: payload.recorded_temp, rejection_reason: payload.rejection_reason },
              created_at: nowIso,
            },
            ...prev.auditLogs,
          ],
        }));
        pushToast(
          payload.inspection_status === 'REJECTED' ? 'info' : 'success',
          `Inspection recorded: ${payload.inspection_status}`
        );
        return { error: null };
      }

      if (!supabase) return { error: 'Supabase not configured.' };
      const { error } = await supabase.rpc('record_food_safety_inspection', {
        p_donation_batch_id: payload.donation_batch_id,
        p_inspection_status: payload.inspection_status,
        p_recorded_temp: payload.recorded_temp,
        p_packaging_condition: payload.packaging_condition,
        p_inspection_notes: payload.inspection_notes,
        p_rejection_reason: payload.rejection_reason || null,
        p_physical_confirmed: payload.physical_inspection_confirmed,
      });
      if (error) return { error: error.message };
      await refreshAllData();
      pushToast('success', `Inspection recorded: ${payload.inspection_status}`);
      return { error: null };
    },
    [requireAction, profile, isDemoMode, supabase, refreshAllData, pushToast]
  );

  const proposeSplitAllocations: AppContextValue['proposeSplitAllocations'] = useCallback(
    async (batchId, proposals) => {
      const denied = requireAction('matching:run');
      if (denied) return { error: denied };
      const batch = batches.find((b) => b.id === batchId);
      if (!batch) return { error: 'Donation batch not found.' };
      const check = validateSplitAllocationBatch(
        batch.portions_available,
        batch.portions_allocated,
        proposals
      );
      if (!check.valid) return { error: check.error ?? 'Invalid split allocation.' };

      if (isDemoMode) {
        const nowIso = new Date().toISOString();
        const existingPairKeys = new Set(
          demoData.allocations.map((a) => `${a.donation_batch_id}:${a.meal_request_id}`)
        );
        for (const p of proposals) {
          if (existingPairKeys.has(`${batchId}:${p.meal_request_id}`)) {
            return { error: 'Duplicate allocation prevented: this batch is already matched to that request.' };
          }
        }

        const created: Allocation[] = proposals.map((p) => ({
          id: makeUuid(),
          donation_batch_id: batchId,
          meal_request_id: p.meal_request_id,
          allocated_portions: p.allocated_portions,
          match_score: p.match_score,
          match_explanation: p.match_explanation,
          approved_by_coordinator: null,
          approved_at: null,
          status: 'PROPOSED',
          is_demo: true,
          created_at: nowIso,
          updated_at: nowIso,
        }));

        const addedPortions = proposals.reduce((s, p) => s + p.allocated_portions, 0);

        setDemoData((prev) => ({
          ...prev,
          allocations: [...created, ...prev.allocations],
          batches: prev.batches.map((b) =>
            b.id === batchId
              ? {
                  ...b,
                  portions_allocated: b.portions_allocated + addedPortions,
                  status: 'ALLOCATION_PROPOSED',
                  updated_at: nowIso,
                }
              : b
          ),
          notifications: [
            {
              id: makeUuid(),
              user_id: prev.profiles.ADMINISTRATOR.id,
              notification_type: 'MATCH_PROPOSED',
              title: `Split Allocation Proposed (${addedPortions} portions)`,
              message: `${created.length} recipient allocations proposed for ${batch.batch_code}. Coordinator approval required before dispatch.`,
              read_at: null,
              created_at: nowIso,
            },
            ...prev.notifications,
          ],
          auditLogs: [
            {
              id: makeUuid(),
              actor_id: profile?.id ?? null,
              actor_label: profile?.full_name,
              action: 'PROPOSE_SPLIT_ALLOCATIONS',
              entity_type: 'donation_batches',
              entity_id: batchId,
              metadata: { addedPortions, count: created.length },
              created_at: nowIso,
            },
            ...prev.auditLogs,
          ],
        }));

        pushToast(
          'success',
          `Proposed ${created.length} split allocations`,
          `${addedPortions} portions proposed; ${batch.portions_available - batch.portions_allocated - addedPortions} remaining unallocated.`
        );
        return { error: null };
      }

      if (!supabase) return { error: 'Supabase not configured.' };
      const { error } = await supabase.rpc('propose_split_allocations', {
        p_donation_batch_id: batchId,
        p_proposals: proposals.map((p) => ({
          meal_request_id: p.meal_request_id,
          allocated_portions: p.allocated_portions,
          match_score: p.match_score,
          match_explanation: p.match_explanation,
        })),
      });
      if (error) return { error: error.message };
      await refreshAllData();
      pushToast('success', 'Split allocations proposed via transactional RPC');
      return { error: null };
    },
    [requireAction, batches, isDemoMode, demoData.allocations, profile, supabase, refreshAllData, pushToast]
  );

  const approveAllocation: AppContextValue['approveAllocation'] = useCallback(
    async (allocationId, reason) => {
      const denied = requireAction('matching:approve');
      if (denied) return { error: denied };
      if (!profile) return { error: 'Not signed in.' };
      if (isDemoMode) {
        const nowIso = new Date().toISOString();
        const target = demoData.allocations.find((a) => a.id === allocationId);
        if (!target) return { error: 'Allocation not found.' };
        if (target.status !== 'PROPOSED') return { error: `Allocation is already ${target.status}.` };

        setDemoData((prev) => ({
          ...prev,
          allocations: prev.allocations.map((a) =>
            a.id === allocationId
              ? { ...a, status: 'APPROVED', approved_by_coordinator: profile.id, approved_at: nowIso, updated_at: nowIso }
              : a
          ),
          batches: prev.batches.map((b) =>
            b.id === target.donation_batch_id ? { ...b, status: 'ALLOCATED', updated_at: nowIso } : b
          ),
          mealtraceEvents: [
            ...prev.mealtraceEvents,
            {
              id: makeUuid(),
              donation_batch_id: target.donation_batch_id,
              event_type: 'ALLOCATION_APPROVED',
              actor_id: profile.id,
              actor_label: profile.full_name,
              recorded_temp: null,
              confirmed_portions: target.allocated_portions,
              event_metadata: { allocation_id: allocationId, reason },
              created_at: nowIso,
            },
          ],
          auditLogs: [
            {
              id: makeUuid(),
              actor_id: profile.id,
              actor_label: profile.full_name,
              action: 'APPROVE_ALLOCATION',
              entity_type: 'allocations',
              entity_id: allocationId,
              metadata: { reason },
              created_at: nowIso,
            },
            ...prev.auditLogs,
          ],
        }));
        pushToast('success', 'Allocation approved by coordinator');
        return { error: null };
      }

      if (!supabase) return { error: 'Supabase not configured.' };
      const { error } = await supabase.rpc('approve_allocation', {
        p_allocation_id: allocationId,
        p_reason: reason,
      });
      if (error) return { error: error.message };
      await refreshAllData();
      pushToast('success', 'Allocation approved');
      return { error: null };
    },
    [requireAction, profile, isDemoMode, demoData.allocations, supabase, refreshAllData, pushToast]
  );

  const respondToAllocation: AppContextValue['respondToAllocation'] = useCallback(
    async (allocationId, decision) => {
      const denied = requireAction('allocation:respond');
      if (denied) return { error: denied };
      if (isDemoMode) {
        const nowIso = new Date().toISOString();
        const target = demoData.allocations.find((a) => a.id === allocationId);
        if (!target) return { error: 'Allocation not found.' };
        if (!['PROPOSED', 'APPROVED'].includes(target.status)) {
          return { error: `Duplicate response blocked: allocation is ${target.status}.` };
        }
        setDemoData((prev) => ({
          ...prev,
          allocations: prev.allocations.map((a) =>
            a.id === allocationId ? { ...a, status: decision, updated_at: nowIso } : a
          ),
          batches:
            decision === 'DECLINED'
              ? prev.batches.map((b) =>
                  b.id === target.donation_batch_id
                    ? { ...b, portions_allocated: Math.max(0, b.portions_allocated - target.allocated_portions) }
                    : b
                )
              : prev.batches,
        }));
        pushToast(decision === 'ACCEPTED' ? 'success' : 'info', `Allocation ${decision.toLowerCase()}`);
        return { error: null };
      }

      if (!supabase) return { error: 'Supabase not configured.' };
      const { error } = await supabase.rpc('respond_to_allocation', {
        p_allocation_id: allocationId,
        p_decision: decision,
      });
      if (error) return { error: error.message };
      await refreshAllData();
      pushToast('success', `Allocation ${decision.toLowerCase()}`);
      return { error: null };
    },
    [requireAction, isDemoMode, demoData.allocations, supabase, refreshAllData, pushToast]
  );

  const assignDeliveryRoute: AppContextValue['assignDeliveryRoute'] = useCallback(
    async (payload) => {
      const denied = requireAction('route:plan_dispatch');
      if (denied) return { error: denied };
      if (!profile) return { error: 'Not signed in.' };
      if (payload.allocationIds.length === 0) {
        return { error: 'Select at least one approved/accepted allocation to dispatch.' };
      }

      if (isDemoMode) {
        const nowIso = new Date().toISOString();
        const routeId = makeUuid();
        const chosenAllocs = demoData.allocations.filter((a) => payload.allocationIds.includes(a.id));
        const firstBatch = demoData.batches.find((b) => b.id === chosenAllocs[0]?.donation_batch_id);
        const donorOrg = demoData.organisations.find((o) => o.id === firstBatch?.donor_id);

        const stops: NonNullable<DeliveryRoute['stops']> = [];
        if (firstBatch) {
          stops.push({
            id: makeUuid(),
            route_id: routeId,
            allocation_id: chosenAllocs[0].id,
            stop_order: 1,
            stop_type: 'PICKUP',
            status: 'PENDING',
            arrived_at: null,
            completed_at: null,
            label: donorOrg?.name ?? 'Donor Pickup',
            address: firstBatch.pickup_address,
            lat: firstBatch.pickup_lat,
            lng: firstBatch.pickup_lng,
            portions: chosenAllocs.reduce((s, a) => s + a.allocated_portions, 0),
            batch_code: firstBatch.batch_code,
            qr_token: firstBatch.qr_token,
          });
        }

        chosenAllocs.forEach((alloc, idx) => {
          const req = demoData.requests.find((r) => r.id === alloc.meal_request_id);
          const org = demoData.organisations.find((o) => o.id === req?.org_id);
          const batch = demoData.batches.find((b) => b.id === alloc.donation_batch_id);
          stops.push({
            id: makeUuid(),
            route_id: routeId,
            allocation_id: alloc.id,
            stop_order: idx + 2,
            stop_type: 'DROPOFF',
            status: 'PENDING',
            arrived_at: null,
            completed_at: null,
            label: org?.name ?? 'Recipient Drop-off',
            address: org?.address ?? '',
            lat: org?.location_lat ?? 13.0,
            lng: org?.location_lng ?? 80.22,
            portions: alloc.allocated_portions,
            batch_code: batch?.batch_code,
            qr_token: batch?.qr_token,
          });
        });

        const newRoute: DeliveryRoute = {
          id: routeId,
          delivery_partner_id: payload.deliveryPartnerId,
          delivery_partner_name: payload.deliveryPartnerName,
          route_status: 'ASSIGNED',
          route_polyline: null,
          estimated_duration: payload.estimatedDuration,
          estimated_distance: payload.estimatedDistance,
          vehicle_capacity_portions: payload.vehicleCapacity,
          shift_payout_reference: payload.shiftPayoutReference,
          is_demo: true,
          created_at: nowIso,
          updated_at: nowIso,
          stops,
        };

        setDemoData((prev) => ({
          ...prev,
          routes: [newRoute, ...prev.routes],
          allocations: prev.allocations.map((a) =>
            payload.allocationIds.includes(a.id) ? { ...a, status: 'DISPATCHED', updated_at: nowIso } : a
          ),
          batches: prev.batches.map((b) =>
            b.id === firstBatch?.id ? { ...b, status: 'DISPATCHED', updated_at: nowIso } : b
          ),
          auditLogs: [
            {
              id: makeUuid(),
              actor_id: profile.id,
              actor_label: profile.full_name,
              action: 'DISPATCH_DELIVERY_ROUTE',
              entity_type: 'delivery_routes',
              entity_id: routeId,
              metadata: {
                deliveryPartnerName: payload.deliveryPartnerName,
                allocations: payload.allocationIds,
                shiftPayoutReference: payload.shiftPayoutReference,
              },
              created_at: nowIso,
            },
            ...prev.auditLogs,
          ],
        }));
        pushToast('success', 'Delivery route dispatched', `Assigned to ${payload.deliveryPartnerName}`);
        return { error: null };
      }

      if (!supabase) return { error: 'Supabase not configured.' };
      const { data: createdRoute, error: routeErr } = await supabase
        .from('delivery_routes')
        .insert({
          delivery_partner_id: payload.deliveryPartnerId,
          route_status: 'ASSIGNED',
          estimated_distance: payload.estimatedDistance,
          estimated_duration: payload.estimatedDuration,
          vehicle_capacity_portions: payload.vehicleCapacity,
          shift_payout_reference: payload.shiftPayoutReference,
          is_demo: false,
        })
        .select()
        .single();

      if (routeErr || !createdRoute) return { error: routeErr?.message ?? 'Route creation failed.' };

      const stopRows = [
        {
          route_id: (createdRoute as DeliveryRoute).id,
          allocation_id: payload.allocationIds[0],
          stop_order: 1,
          stop_type: 'PICKUP',
          status: 'PENDING',
        },
        ...payload.allocationIds.map((allocId, idx) => ({
          route_id: (createdRoute as DeliveryRoute).id,
          allocation_id: allocId,
          stop_order: idx + 2,
          stop_type: 'DROPOFF',
          status: 'PENDING',
        })),
      ];
      const { error: stopsErr } = await supabase.from('delivery_stops').insert(stopRows);
      if (stopsErr) return { error: stopsErr.message };

      await supabase
        .from('allocations')
        .update({ status: 'DISPATCHED' })
        .in('id', payload.allocationIds);

      await refreshAllData();
      pushToast('success', 'Delivery route dispatched');
      return { error: null };
    },
    [requireAction, profile, isDemoMode, demoData, supabase, refreshAllData, pushToast]
  );

  const updateRouteStatus: AppContextValue['updateRouteStatus'] = useCallback(
    async (routeId, status) => {
      const denied = requireAction('route:update_status');
      if (denied) return { error: denied };
      if (isDemoMode) {
        const nowIso = new Date().toISOString();
        setDemoData((prev) => ({
          ...prev,
          routes: prev.routes.map((r) =>
            r.id === routeId
              ? {
                  ...r,
                  route_status: status,
                  updated_at: nowIso,
                  stops: r.stops?.map((s) =>
                    status === 'COMPLETED'
                      ? { ...s, status: 'COMPLETED', completed_at: s.completed_at ?? nowIso }
                      : status === 'PICKED_UP' && s.stop_type === 'PICKUP'
                      ? { ...s, status: 'COMPLETED', completed_at: nowIso }
                      : s
                  ),
                }
              : r
          ),
        }));
        pushToast('success', `Route status updated to ${status}`);
        return { error: null };
      }

      if (!supabase) return { error: 'Supabase not configured.' };
      const { error } = await supabase.from('delivery_routes').update({ route_status: status }).eq('id', routeId);
      if (error) return { error: error.message };
      await refreshAllData();
      pushToast('success', `Route updated: ${status}`);
      return { error: null };
    },
    [requireAction, isDemoMode, supabase, refreshAllData, pushToast]
  );

  const recordMealTraceScan: AppContextValue['recordMealTraceScan'] = useCallback(
    async (payload) => {
      const scanAction: AppActionKey =
        payload.event_type === 'PICKUP_SCANNED'
          ? 'mealtrace:scan_pickup'
          : payload.event_type === 'HANDOVER_SCANNED'
          ? 'mealtrace:scan_handover'
          : 'mealtrace:confirm_portions';
      const denied = requireAction(scanAction);
      if (denied) return { error: denied };
      if (isDemoMode) {
        const nowIso = new Date().toISOString();
        const batch = demoData.batches.find((b) => b.qr_token === payload.qr_token);
        if (!batch) return { error: 'Invalid or unrecognised MealTrace QR token.' };

        const event: MealTraceEvent = {
          id: makeUuid(),
          donation_batch_id: batch.id,
          event_type: payload.event_type,
          actor_id: profile?.id ?? null,
          actor_label: profile?.full_name ?? 'Authorised Operator',
          recorded_temp: payload.recorded_temp ?? null,
          confirmed_portions: payload.confirmed_portions ?? null,
          event_metadata: {
            notes: payload.notes ?? '',
            distribution_area: payload.distribution_area ?? '',
          },
          created_at: nowIso,
        };

        setDemoData((prev) => {
          let nextBatches = prev.batches;
          let nextAllocs = prev.allocations;
          let nextReqs = prev.requests;
          let nextImpact = prev.impactRecords;
          let nextRoutes = prev.routes;
          let nextCommunityInv = prev.communityInventory;
          let nextNutritionalSnaps = prev.nutritionalSnapshots;
          let nextTargetedReqs = prev.targetedRequests;

          if (payload.event_type === 'PICKUP_SCANNED') {
            nextBatches = prev.batches.map((b) =>
              b.id === batch.id ? { ...b, status: 'PICKED_UP', updated_at: nowIso } : b
            );
            nextAllocs = prev.allocations.map((a) =>
              a.donation_batch_id === batch.id && a.status === 'DISPATCHED'
                ? { ...a, status: 'PICKED_UP', updated_at: nowIso }
                : a
            );
            nextRoutes = prev.routes.map((r) => ({
              ...r,
              route_status: r.route_status === 'ASSIGNED' || r.route_status === 'ACCEPTED' ? 'PICKED_UP' : r.route_status,
              stops: r.stops?.map((s) =>
                s.stop_type === 'PICKUP' && s.qr_token === payload.qr_token
                  ? { ...s, status: 'COMPLETED', completed_at: nowIso }
                  : s
              ),
            }));
          }

          if (payload.event_type === 'PORTIONS_CONFIRMED' && payload.confirmed_portions && payload.confirmed_portions > 0) {
            const candidateAlloc = prev.allocations.find(
              (a) =>
                a.donation_batch_id === batch.id &&
                a.status !== 'DELIVERED' &&
                a.status !== 'DECLINED' &&
                (profile?.role === 'ADMINISTRATOR' ||
                  prev.requests.find((r) => r.id === a.meal_request_id)?.org_id === activeOrganisation?.id)
            ) ?? prev.allocations.find((a) => a.donation_batch_id === batch.id && a.status !== 'DELIVERED');

            const targetReq = candidateAlloc
              ? prev.requests.find((r) => r.id === candidateAlloc.meal_request_id)
              : undefined;

            if (candidateAlloc && targetReq) {
              nextAllocs = prev.allocations.map((a) =>
                a.id === candidateAlloc.id ? { ...a, status: 'DELIVERED', updated_at: nowIso } : a
              );
              nextReqs = prev.requests.map((r) =>
                r.id === targetReq.id
                  ? {
                      ...r,
                      portions_fulfilled: r.portions_fulfilled + payload.confirmed_portions!,
                      status:
                        r.portions_fulfilled + payload.confirmed_portions! >= r.portions_needed
                          ? 'FULFILLED'
                          : 'PARTIALLY_ALLOCATED',
                      updated_at: nowIso,
                    }
                  : r
              );
              nextImpact = [
                {
                  id: makeUuid(),
                  donation_batch_id: batch.id,
                  organisation_id: targetReq.org_id,
                  portions_delivered: payload.confirmed_portions,
                  distribution_area: payload.distribution_area?.trim() || 'Chennai South Zone',
                  confirmed_at: nowIso,
                  is_demo: true,
                },
                ...prev.impactRecords,
              ];

              // NutriLoop: Automatically ingest verified handover into community inventory & record before/after nutritional impact snapshot
              const commProfile = prev.communityProfiles.find((cp) => cp.org_id === targetReq.org_id);
              const resolvedComp = resolveFoodCompositionForBatch(batch, prev.foodCatalog);
              const addedInvRecord: CommunityFoodInventoryRecord = {
                id: makeUuid(),
                org_id: targetReq.org_id,
                food_composition_id: resolvedComp?.id ?? batch.food_composition_id ?? null,
                custom_food_name: batch.food_item,
                quantity_portions: payload.confirmed_portions,
                portion_grams: resolvedComp?.standard_portion_grams ?? 250,
                inventory_stage: 'AVAILABLE',
                source_batch_id: batch.id,
                recorded_by: profile?.id ?? null,
                recorded_at: nowIso,
                is_demo: true,
              };
              nextCommunityInv = [addedInvRecord, ...prev.communityInventory];

              if (commProfile) {
                const beforeAnalysis = analyzeCommunityNutritionalGaps({
                  profile: commProfile,
                  inventory: prev.communityInventory,
                  foodCatalog: prev.foodCatalog,
                  nutrientConfigs: prev.nutrientConfigs,
                });
                const afterAnalysis = analyzeCommunityNutritionalGaps({
                  profile: commProfile,
                  inventory: nextCommunityInv,
                  foodCatalog: prev.foodCatalog,
                  nutrientConfigs: prev.nutrientConfigs,
                });
                const beforeGaps: Record<string, number> = {};
                const afterGaps: Record<string, number> = {};
                for (const m of beforeAnalysis.nutrients) beforeGaps[m.nutrient_key] = m.gap;
                for (const m of afterAnalysis.nutrients) afterGaps[m.nutrient_key] = m.gap;

                nextNutritionalSnaps = [
                  {
                    id: makeUuid(),
                    org_id: targetReq.org_id,
                    donation_batch_id: batch.id,
                    portions_confirmed: payload.confirmed_portions,
                    before_adequacy_pct: beforeAnalysis.overall_adequacy_pct,
                    after_adequacy_pct: afterAnalysis.overall_adequacy_pct,
                    before_gaps: beforeGaps,
                    after_gaps: afterGaps,
                    recorded_at: nowIso,
                    is_demo: true,
                  },
                  ...prev.nutritionalSnapshots,
                ];
              }

              // Mark any linked targeted donation request as FULFILLED
              nextTargetedReqs = prev.targetedRequests.map((tr) =>
                (tr.matched_batch_id === batch.id || tr.linked_meal_request_id === targetReq.id) &&
                (tr.status === 'MATCHED' || tr.status === 'APPROVED_PUBLISHED')
                  ? { ...tr, status: 'FULFILLED', matched_batch_id: batch.id, updated_at: nowIso }
                  : tr
              );

              const allDelivered = nextAllocs
                .filter((a) => a.donation_batch_id === batch.id && a.status !== 'DECLINED')
                .every((a) => a.status === 'DELIVERED');
              if (allDelivered) {
                nextBatches = prev.batches.map((b) =>
                  b.id === batch.id ? { ...b, status: 'DELIVERED', updated_at: nowIso } : b
                );
                nextRoutes = prev.routes.map((r) => ({
                  ...r,
                  route_status: 'COMPLETED',
                  stops: r.stops?.map((s) => ({ ...s, status: 'COMPLETED', completed_at: s.completed_at ?? nowIso })),
                }));
              }
            }
          }

          return {
            ...prev,
            batches: nextBatches,
            allocations: nextAllocs,
            requests: nextReqs,
            impactRecords: nextImpact,
            routes: nextRoutes,
            communityInventory: nextCommunityInv,
            nutritionalSnapshots: nextNutritionalSnaps,
            targetedRequests: nextTargetedReqs,
            mealtraceEvents: [...prev.mealtraceEvents, event],
          };
        });

        pushToast('success', `MealTrace event logged: ${payload.event_type}`);
        return { error: null };
      }

      if (!supabase) return { error: 'Supabase not configured.' };
      const { error } = await supabase.rpc('record_mealtrace_scan', {
        p_qr_token: payload.qr_token,
        p_event_type: payload.event_type,
        p_recorded_temp: payload.recorded_temp ?? null,
        p_confirmed_portions: payload.confirmed_portions ?? null,
        p_distribution_area: payload.distribution_area ?? null,
        p_notes: payload.notes ?? null,
      });
      if (error) return { error: error.message };
      await refreshAllData();
      pushToast('success', `MealTrace event logged: ${payload.event_type}`);
      return { error: null };
    },
    [requireAction, isDemoMode, demoData.batches, profile, activeOrganisation, supabase, refreshAllData, pushToast]
  );

  const updateOrganisationStatus: AppContextValue['updateOrganisationStatus'] = useCallback(
    async (orgId, status, reason) => {
      const denied = requireAction('admin:verify_org');
      if (denied) return { error: denied };
      if (!profile) return { error: 'Not signed in.' };
      if (reason.trim().length < 3) return { error: 'An explicit audit reason is required.' };

      if (isDemoMode) {
        const nowIso = new Date().toISOString();
        setDemoData((prev) => ({
          ...prev,
          organisations: prev.organisations.map((o) =>
            o.id === orgId
              ? { ...o, verification_status: status, verification_reason: reason.trim(), updated_at: nowIso }
              : o
          ),
          auditLogs: [
            {
              id: makeUuid(),
              actor_id: profile.id,
              actor_label: profile.full_name,
              action: `ORG_STATUS_${status.toUpperCase()}`,
              entity_type: 'organisations',
              entity_id: orgId,
              metadata: { reason: reason.trim() },
              created_at: nowIso,
            },
            ...prev.auditLogs,
          ],
        }));
        pushToast('success', `Organisation marked ${status}`);
        return { error: null };
      }

      if (!supabase) return { error: 'Supabase not configured.' };
      const { error } = await supabase.rpc('admin_update_organisation_status', {
        p_org_id: orgId,
        p_new_status: status,
        p_reason: reason.trim(),
      });
      if (error) return { error: error.message };
      await refreshAllData();
      pushToast('success', `Organisation marked ${status}`);
      return { error: null };
    },
    [requireAction, profile, isDemoMode, supabase, refreshAllData, pushToast]
  );

  const updateOrganisationCapacity: AppContextValue['updateOrganisationCapacity'] = useCallback(
    async (orgId, dailyCapacity) => {
      const denied = requireAction('allocation:respond');
      if (denied) return { error: denied };
      if (!Number.isInteger(dailyCapacity) || dailyCapacity < 0) {
        return { error: 'Daily capacity must be a non-negative integer.' };
      }
      if (isDemoMode) {
        setDemoData((prev) => ({
          ...prev,
          organisations: prev.organisations.map((o) =>
            o.id === orgId ? { ...o, daily_capacity: dailyCapacity, updated_at: new Date().toISOString() } : o
          ),
        }));
        pushToast('success', 'Receiving capacity updated');
        return { error: null };
      }
      if (!supabase) return { error: 'Supabase not configured.' };
      const { error } = await supabase
        .from('organisations')
        .update({ daily_capacity: dailyCapacity })
        .eq('id', orgId);
      if (error) return { error: error.message };
      await refreshAllData();
      pushToast('success', 'Receiving capacity updated');
      return { error: null };
    },
    [requireAction, isDemoMode, supabase, refreshAllData, pushToast]
  );

  const reportIncident: AppContextValue['reportIncident'] = useCallback(
    async (payload) => {
      const denied = requireAction('admin:manage_incidents');
      if (denied) return { error: denied };
      if (isDemoMode) {
        const nowIso = new Date().toISOString();
        setDemoData((prev) => ({
          ...prev,
          incidents: [
            {
              id: makeUuid(),
              batch_id: payload.batch_id,
              reporter_id: profile?.id ?? 'demo-user',
              incident_type: payload.incident_type,
              description: payload.description.trim(),
              status: 'OPEN',
              resolution_notes: null,
              created_at: nowIso,
            },
            ...prev.incidents,
          ],
        }));
        pushToast('info', 'Incident reported for administrator review');
        return { error: null };
      }

      if (!supabase || !session?.user) return { error: 'Not signed in.' };
      const { error } = await supabase.from('incidents').insert({
        batch_id: payload.batch_id,
        reporter_id: session.user.id,
        incident_type: payload.incident_type,
        description: payload.description.trim(),
      });
      if (error) return { error: error.message };
      await refreshAllData();
      pushToast('info', 'Incident logged');
      return { error: null };
    },
    [requireAction, isDemoMode, profile, supabase, session, refreshAllData, pushToast]
  );

  const updateIncidentStatus: AppContextValue['updateIncidentStatus'] = useCallback(
    async (incidentId, status, resolutionNotes) => {
      const denied = requireAction('admin:manage_incidents');
      if (denied) return { error: denied };
      if (!profile) return { error: 'Not signed in.' };
      if (isDemoMode) {
        setDemoData((prev) => ({
          ...prev,
          incidents: prev.incidents.map((inc) =>
            inc.id === incidentId ? { ...inc, status, resolution_notes: resolutionNotes.trim() } : inc
          ),
          auditLogs: [
            {
              id: makeUuid(),
              actor_id: profile.id,
              actor_label: profile.full_name,
              action: `INCIDENT_${status}`,
              entity_type: 'incidents',
              entity_id: incidentId,
              metadata: { resolution_notes: resolutionNotes.trim() },
              created_at: new Date().toISOString(),
            },
            ...prev.auditLogs,
          ],
        }));
        pushToast('success', `Incident updated to ${status}`);
        return { error: null };
      }

      if (!supabase) return { error: 'Supabase not configured.' };
      const { error } = await supabase
        .from('incidents')
        .update({ status, resolution_notes: resolutionNotes.trim() })
        .eq('id', incidentId);
      if (error) return { error: error.message };
      await refreshAllData();
      pushToast('success', `Incident updated to ${status}`);
      return { error: null };
    },
    [requireAction, profile, isDemoMode, supabase, refreshAllData, pushToast]
  );

  const markNotificationRead = useCallback(
    async (notificationId: string) => {
      const nowIso = new Date().toISOString();
      if (isDemoMode) {
        setDemoData((prev) => ({
          ...prev,
          notifications: prev.notifications.map((n) =>
            n.id === notificationId ? { ...n, read_at: nowIso } : n
          ),
        }));
        return;
      }
      if (!supabase) return;
      await supabase.from('notifications').update({ read_at: nowIso }).eq('id', notificationId);
      setLiveNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read_at: nowIso } : n))
      );
    },
    [isDemoMode, supabase]
  );

  // ---------------------------------------------------------------------------
  // NutriLoop Operations (Strict RBAC + Validation + Audit Trail)
  // ---------------------------------------------------------------------------
  const canManageCommunityOrg = useCallback(
    (orgId: string) => {
      if (!profile) return false;
      if (profile.role === 'ADMINISTRATOR') return true;
      if (profile.role === 'VERIFIED_NGO' || profile.role === 'COMMUNITY_KITCHEN') {
        return activeOrganisation?.id === orgId;
      }
      return false;
    },
    [profile, activeOrganisation]
  );

  const upsertCommunityNutritionProfile: AppContextValue['upsertCommunityNutritionProfile'] = useCallback(
    async (payload) => {
      if (!canManageCommunityOrg(payload.org_id)) {
        return { error: 'Forbidden: Only authorised NGO / Community Kitchen members or Administrators may update community nutrition profiles.' };
      }
      const counts = [
        payload.children_1_9_count,
        payload.adolescents_10_18_count,
        payload.adults_19_59_count,
        payload.pregnant_lactating_count,
        payload.elderly_60_plus_count,
      ];
      if (counts.some((c) => !Number.isInteger(c) || c < 0)) {
        return { error: 'All demographic group counts must be non-negative whole numbers.' };
      }
      const total = counts.reduce((s, c) => s + c, 0);
      if (total <= 0) {
        return { error: 'Total beneficiary count must be greater than zero.' };
      }
      if (!Number.isInteger(payload.planning_horizon_days) || payload.planning_horizon_days < 1 || payload.planning_horizon_days > 30) {
        return { error: 'Planning horizon must be between 1 and 30 days.' };
      }

      const nowIso = new Date().toISOString();
      if (isDemoMode) {
        setDemoData((prev) => {
          const existing = prev.communityProfiles.find((p) => p.org_id === payload.org_id);
          const nextProfile: CommunityNutritionProfile = {
            id: existing?.id ?? makeUuid(),
            org_id: payload.org_id,
            children_1_9_count: payload.children_1_9_count,
            adolescents_10_18_count: payload.adolescents_10_18_count,
            adults_19_59_count: payload.adults_19_59_count,
            pregnant_lactating_count: payload.pregnant_lactating_count,
            elderly_60_plus_count: payload.elderly_60_plus_count,
            dietary_restriction: payload.dietary_restriction,
            planning_horizon_days: payload.planning_horizon_days,
            notes: payload.notes ?? null,
            is_demo: true,
            updated_at: nowIso,
          };
          return {
            ...prev,
            communityProfiles: existing
              ? prev.communityProfiles.map((p) => (p.org_id === payload.org_id ? nextProfile : p))
              : [nextProfile, ...prev.communityProfiles],
            auditLogs: [
              {
                id: makeUuid(),
                actor_id: profile?.id ?? null,
                actor_label: profile?.full_name,
                action: 'NUTRILOOP_PROFILE_UPDATED',
                entity_type: 'community_nutrition_profiles',
                entity_id: nextProfile.id,
                metadata: { org_id: payload.org_id, total_beneficiaries: total },
                created_at: nowIso,
              },
              ...prev.auditLogs,
            ],
          };
        });
        pushToast('success', 'Community nutrition profile saved', `${total} aggregate beneficiaries (${payload.planning_horizon_days}-day horizon).`);
        return { error: null };
      }

      if (!supabase) return { error: 'Supabase not configured.' };
      const { error } = await supabase.from('community_nutrition_profiles').upsert(
        {
          org_id: payload.org_id,
          children_1_9_count: payload.children_1_9_count,
          adolescents_10_18_count: payload.adolescents_10_18_count,
          adults_19_59_count: payload.adults_19_59_count,
          pregnant_lactating_count: payload.pregnant_lactating_count,
          elderly_60_plus_count: payload.elderly_60_plus_count,
          dietary_restriction: payload.dietary_restriction,
          planning_horizon_days: payload.planning_horizon_days,
          notes: payload.notes ?? null,
          is_demo: false,
        },
        { onConflict: 'org_id' }
      );
      if (error) return { error: error.message };
      await refreshAllData();
      pushToast('success', 'Community nutrition profile saved');
      return { error: null };
    },
    [canManageCommunityOrg, isDemoMode, profile, supabase, refreshAllData, pushToast]
  );

  const recordCommunityInventory: AppContextValue['recordCommunityInventory'] = useCallback(
    async (payload) => {
      if (!canManageCommunityOrg(payload.org_id)) {
        return { error: 'Forbidden: Only authorised NGO / Community Kitchen members or Administrators may update food inventory.' };
      }
      if (!Number.isFinite(payload.quantity_portions) || payload.quantity_portions <= 0) {
        return { error: 'Quantity (portions) must be greater than zero.' };
      }
      if (!Number.isFinite(payload.portion_grams) || payload.portion_grams <= 0 || payload.portion_grams > 2500) {
        return { error: 'Portion weight must be between 1g and 2500g.' };
      }
      if (!payload.custom_food_name.trim()) {
        return { error: 'Food name is required.' };
      }

      // Guard against reporting more distributed/consumed portions than currently available for the same community
      if (payload.inventory_stage !== 'AVAILABLE') {
        const currentAvail = communityInventory
          .filter((r) => r.org_id === payload.org_id && r.inventory_stage === 'AVAILABLE')
          .reduce((s, r) => s + r.quantity_portions, 0);
        if (currentAvail > 0 && payload.quantity_portions > currentAvail * 3) {
          return {
            error: `Insufficient available inventory (${currentAvail} available portions) to log ${payload.quantity_portions} ${payload.inventory_stage.toLowerCase()} portions.`,
          };
        }
      }

      const nowIso = new Date().toISOString();
      if (isDemoMode) {
        const record: CommunityFoodInventoryRecord = {
          id: makeUuid(),
          org_id: payload.org_id,
          food_composition_id: payload.food_composition_id,
          custom_food_name: payload.custom_food_name.trim(),
          quantity_portions: Math.round(payload.quantity_portions),
          portion_grams: Math.round(payload.portion_grams),
          inventory_stage: payload.inventory_stage,
          source_batch_id: payload.source_batch_id ?? null,
          recorded_by: profile?.id ?? null,
          recorded_at: nowIso,
          is_demo: true,
        };
        setDemoData((prev) => ({
          ...prev,
          communityInventory: [record, ...prev.communityInventory],
        }));
        pushToast(
          'success',
          'Community inventory logged',
          `${record.quantity_portions} portions (${record.inventory_stage.replace(/_/g, ' ')})`
        );
        return { error: null };
      }

      if (!supabase || !session?.user) return { error: 'Not signed in.' };
      const { error } = await supabase.from('community_food_inventory').insert({
        org_id: payload.org_id,
        food_composition_id: payload.food_composition_id,
        custom_food_name: payload.custom_food_name.trim(),
        quantity_portions: Math.round(payload.quantity_portions),
        portion_grams: Math.round(payload.portion_grams),
        inventory_stage: payload.inventory_stage,
        source_batch_id: payload.source_batch_id ?? null,
        recorded_by: session.user.id,
        is_demo: false,
      });
      if (error) return { error: error.message };
      await refreshAllData();
      pushToast('success', 'Community inventory recorded');
      return { error: null };
    },
    [canManageCommunityOrg, communityInventory, isDemoMode, profile, supabase, session, refreshAllData, pushToast]
  );

  const generateTargetedRequestsForOrg: AppContextValue['generateTargetedRequestsForOrg'] = useCallback(
    async (orgId, requiredDeliveryDateIso) => {
      if (!canManageCommunityOrg(orgId)) {
        return {
          error: 'Forbidden: Only authorised NGO / Community Kitchen users or Administrators may generate targeted requests.',
          createdCount: 0,
        };
      }
      const commProfile = communityProfiles.find((p) => p.org_id === orgId);
      const org = organisations.find((o) => o.id === orgId);
      if (!commProfile || !org) {
        return { error: 'Configure the community nutrition profile first before generating targeted requests.', createdCount: 0 };
      }
      const analysis = communityGapAnalyses[orgId];
      if (!analysis || analysis.highest_priority_gaps.length === 0) {
        return { error: 'No significant nutritional gaps (>= 15% deficit) detected for this community.', createdCount: 0 };
      }

      const rawDrafts = generateTargetedDonationRequests({
        analysis,
        profile: commProfile,
        orgName: org.name,
        foodCatalog,
        requiredDeliveryDateIso,
        maxRequests: 3,
      });

      // Avoid duplicating active requests for the same org + target_nutrient_key
      const activeKeys = new Set(
        targetedRequests
          .filter(
            (tr) =>
              tr.org_id === orgId &&
              ['DRAFT_GENERATED', 'APPROVED_PUBLISHED', 'MATCHED'].includes(tr.status)
          )
          .map((tr) => tr.target_nutrient_key)
      );
      const freshDrafts = rawDrafts.filter((d) => !activeKeys.has(d.target_nutrient_key));

      if (freshDrafts.length === 0) {
        return {
          error: 'Active draft or published targeted requests already exist for all top nutritional gaps.',
          createdCount: 0,
        };
      }

      const nowIso = new Date().toISOString();
      if (isDemoMode) {
        const created: TargetedDonationRequest[] = freshDrafts.map((d) => ({
          ...d,
          id: makeUuid(),
          created_at: nowIso,
          updated_at: nowIso,
        }));
        setDemoData((prev) => ({
          ...prev,
          targetedRequests: [...created, ...prev.targetedRequests],
          auditLogs: [
            {
              id: makeUuid(),
              actor_id: profile?.id ?? null,
              actor_label: profile?.full_name,
              action: 'TARGETED_REQUESTS_GENERATED',
              entity_type: 'targeted_donation_requests',
              entity_id: orgId,
              metadata: { count: created.length, nutrients: created.map((c) => c.target_nutrient_key) },
              created_at: nowIso,
            },
            ...prev.auditLogs,
          ],
        }));
        pushToast(
          'success',
          `Generated ${created.length} draft targeted request(s)`,
          'Review and approve each draft before publishing to donors.'
        );
        return { error: null, createdCount: created.length };
      }

      if (!supabase) return { error: 'Supabase not configured.', createdCount: 0 };
      const { error } = await supabase.from('targeted_donation_requests').insert(
        freshDrafts.map((d) => ({
          org_id: d.org_id,
          target_nutrient_key: d.target_nutrient_key,
          target_nutrient_label: d.target_nutrient_label,
          gap_amount: d.gap_amount,
          gap_unit: d.gap_unit,
          recommended_food_category: d.recommended_food_category,
          recommended_items: d.recommended_items,
          requested_portions: d.requested_portions,
          priority_level: d.priority_level,
          reason_summary: d.reason_summary,
          dietary_pref: d.dietary_pref,
          required_delivery_date: d.required_delivery_date,
          status: 'DRAFT_GENERATED',
          is_demo: false,
        }))
      );
      if (error) return { error: error.message, createdCount: 0 };
      await refreshAllData();
      pushToast('success', `Generated ${freshDrafts.length} draft targeted request(s)`);
      return { error: null, createdCount: freshDrafts.length };
    },
    [
      canManageCommunityOrg,
      communityProfiles,
      organisations,
      communityGapAnalyses,
      foodCatalog,
      targetedRequests,
      isDemoMode,
      profile,
      supabase,
      refreshAllData,
      pushToast,
    ]
  );

  const approveTargetedDonationRequest: AppContextValue['approveTargetedDonationRequest'] = useCallback(
    async (requestId, notes) => {
      const target = targetedRequests.find((tr) => tr.id === requestId);
      if (!target) return { error: 'Targeted request not found.' };
      if (!canManageCommunityOrg(target.org_id)) {
        return { error: 'Forbidden: Only authorised NGO / Community Kitchen users or Administrators may approve targeted requests.' };
      }
      if (target.status !== 'DRAFT_GENERATED') {
        return { error: 'Only DRAFT_GENERATED targeted requests may be approved and published.' };
      }

      const nowIso = new Date().toISOString();
      if (isDemoMode) {
        const linkedMealReqId = makeUuid();
        const linkedMealRequest: MealRequest = {
          id: linkedMealReqId,
          org_id: target.org_id,
          submitted_by: profile?.id ?? null,
          portions_needed: target.requested_portions,
          portions_fulfilled: 0,
          dietary_pref: target.dietary_pref,
          urgency_score: target.priority_level === 'CRITICAL' ? 5 : target.priority_level === 'HIGH' ? 4 : 3,
          wait_started_at: nowIso,
          intake_channel: 'WEB_PORTAL',
          required_by: target.required_delivery_date,
          status: 'OPEN',
          idempotency_key: null,
          notes: `[NutriLoop Targeted — ${target.target_nutrient_label}] ${target.reason_summary}${notes ? ` · ${notes}` : ''}`,
          is_demo: true,
          created_at: nowIso,
          updated_at: nowIso,
        };

        setDemoData((prev) => ({
          ...prev,
          requests: [linkedMealRequest, ...prev.requests],
          targetedRequests: prev.targetedRequests.map((tr) =>
            tr.id === requestId
              ? {
                  ...tr,
                  status: 'APPROVED_PUBLISHED',
                  approved_by: profile?.id ?? null,
                  approved_at: nowIso,
                  linked_meal_request_id: linkedMealReqId,
                  updated_at: nowIso,
                }
              : tr
          ),
          auditLogs: [
            {
              id: makeUuid(),
              actor_id: profile?.id ?? null,
              actor_label: profile?.full_name,
              action: 'APPROVE_TARGETED_DONATION_REQUEST',
              entity_type: 'targeted_donation_requests',
              entity_id: requestId,
              metadata: {
                linked_meal_request_id: linkedMealReqId,
                nutrient: target.target_nutrient_key,
                notes: notes ?? '',
              },
              created_at: nowIso,
            },
            ...prev.auditLogs,
          ],
          notifications: [
            {
              id: makeUuid(),
              user_id: prev.profiles.FOOD_DONOR.id,
              notification_type: 'TARGETED_NUTRITION_NEED',
              title: `NutriLoop Request: ${target.target_nutrient_label}`,
              message: `${target.requested_portions} portions (${target.recommended_items.slice(0, 2).join(', ')}) requested to close a ${target.priority_level} nutritional gap.`,
              read_at: null,
              created_at: nowIso,
            },
            ...prev.notifications,
          ],
        }));
        pushToast(
          'success',
          'Targeted request approved & published',
          'Visible to verified food donors and synced into Meal Requests.'
        );
        return { error: null };
      }

      if (!supabase) return { error: 'Supabase not configured.' };
      const { error } = await supabase.rpc('approve_targeted_donation_request', {
        p_request_id: requestId,
        p_notes: notes ?? null,
      });
      if (error) return { error: error.message };
      await refreshAllData();
      pushToast('success', 'Targeted request approved & published');
      return { error: null };
    },
    [targetedRequests, canManageCommunityOrg, isDemoMode, profile, supabase, refreshAllData, pushToast]
  );

  const dismissTargetedDonationRequest: AppContextValue['dismissTargetedDonationRequest'] = useCallback(
    async (requestId, reason) => {
      if (!reason.trim() || reason.trim().length < 3) {
        return { error: 'A dismissal reason is required.' };
      }
      const target = targetedRequests.find((tr) => tr.id === requestId);
      if (!target) return { error: 'Targeted request not found.' };
      if (!canManageCommunityOrg(target.org_id)) {
        return { error: 'Forbidden: Only authorised NGO / Community Kitchen users or Administrators may dismiss targeted requests.' };
      }

      const nowIso = new Date().toISOString();
      if (isDemoMode) {
        setDemoData((prev) => ({
          ...prev,
          targetedRequests: prev.targetedRequests.map((tr) =>
            tr.id === requestId ? { ...tr, status: 'DISMISSED', updated_at: nowIso } : tr
          ),
          auditLogs: [
            {
              id: makeUuid(),
              actor_id: profile?.id ?? null,
              actor_label: profile?.full_name,
              action: 'DISMISS_TARGETED_DONATION_REQUEST',
              entity_type: 'targeted_donation_requests',
              entity_id: requestId,
              metadata: { reason: reason.trim() },
              created_at: nowIso,
            },
            ...prev.auditLogs,
          ],
        }));
        pushToast('info', 'Targeted request dismissed', reason.trim());
        return { error: null };
      }

      if (!supabase) return { error: 'Supabase not configured.' };
      const { error } = await supabase
        .from('targeted_donation_requests')
        .update({ status: 'DISMISSED' })
        .eq('id', requestId);
      if (error) return { error: error.message };
      await refreshAllData();
      pushToast('info', 'Targeted request dismissed');
      return { error: null };
    },
    [targetedRequests, canManageCommunityOrg, isDemoMode, profile, supabase, refreshAllData, pushToast]
  );

  const upsertFoodCompositionItem: AppContextValue['upsertFoodCompositionItem'] = useCallback(
    async (payload) => {
      const denied = requireAction('nutriloop:manage_catalog');
      if (denied) return { error: denied };
      if (!profile) return { error: 'Not signed in.' };
      if (!payload.food_code.trim() || !payload.food_name.trim() || !payload.source_dataset.trim()) {
        return { error: 'Food code, food name, and validated source dataset citation are mandatory.' };
      }
      if (payload.standard_portion_grams <= 0 || payload.calories_kcal_per_100g < 0 || payload.protein_g_per_100g < 0) {
        return { error: 'Nutritional values must be non-negative and portion grams must be positive.' };
      }

      const nowIso = new Date().toISOString();
      if (isDemoMode) {
        const nextItem: FoodCompositionItem = {
          id: makeUuid(),
          food_code: payload.food_code.trim().toUpperCase(),
          food_name: payload.food_name.trim(),
          food_category: payload.food_category,
          dietary_type: payload.dietary_type,
          standard_portion_grams: payload.standard_portion_grams,
          calories_kcal_per_100g: payload.calories_kcal_per_100g,
          protein_g_per_100g: payload.protein_g_per_100g,
          iron_mg_per_100g: payload.iron_mg_per_100g,
          calcium_mg_per_100g: payload.calcium_mg_per_100g,
          vitamin_a_mcg_per_100g: payload.vitamin_a_mcg_per_100g,
          dietary_fibre_g_per_100g: payload.dietary_fibre_g_per_100g,
          extra_nutrients_per_100g: payload.extra_nutrients_per_100g ?? {},
          source_dataset: payload.source_dataset.trim(),
          source_reference: payload.source_reference.trim(),
          is_active: true,
        };
        setDemoData((prev) => {
          const exists = prev.foodCatalog.some((f) => f.food_code === nextItem.food_code);
          return {
            ...prev,
            foodCatalog: exists
              ? prev.foodCatalog.map((f) => (f.food_code === nextItem.food_code ? { ...nextItem, id: f.id } : f))
              : [...prev.foodCatalog, nextItem],
            auditLogs: [
              {
                id: makeUuid(),
                actor_id: profile.id,
                actor_label: profile.full_name,
                action: 'FOOD_COMPOSITION_UPSERTED',
                entity_type: 'food_composition_reference',
                entity_id: nextItem.food_code,
                metadata: { food_name: nextItem.food_name, source: nextItem.source_dataset },
                created_at: nowIso,
              },
              ...prev.auditLogs,
            ],
          };
        });
        pushToast('success', 'Food composition reference saved', `${payload.food_name} (${payload.source_dataset})`);
        return { error: null };
      }

      if (!supabase) return { error: 'Supabase not configured.' };
      const { error } = await supabase.from('food_composition_reference').upsert(
        {
          food_code: payload.food_code.trim().toUpperCase(),
          food_name: payload.food_name.trim(),
          food_category: payload.food_category,
          dietary_type: payload.dietary_type,
          standard_portion_grams: payload.standard_portion_grams,
          calories_kcal_per_100g: payload.calories_kcal_per_100g,
          protein_g_per_100g: payload.protein_g_per_100g,
          iron_mg_per_100g: payload.iron_mg_per_100g,
          calcium_mg_per_100g: payload.calcium_mg_per_100g,
          vitamin_a_mcg_per_100g: payload.vitamin_a_mcg_per_100g,
          dietary_fibre_g_per_100g: payload.dietary_fibre_g_per_100g,
          extra_nutrients_per_100g: payload.extra_nutrients_per_100g ?? {},
          source_dataset: payload.source_dataset.trim(),
          source_reference: payload.source_reference.trim(),
          is_active: true,
        },
        { onConflict: 'food_code' }
      );
      if (error) return { error: error.message };
      await refreshAllData();
      pushToast('success', 'Food composition reference saved');
      return { error: null };
    },
    [requireAction, profile, isDemoMode, supabase, refreshAllData, pushToast]
  );

  const addCustomNutrientConfig: AppContextValue['addCustomNutrientConfig'] = useCallback(
    async (payload) => {
      const denied = requireAction('nutriloop:manage_catalog');
      if (denied) return { error: denied };
      if (!profile) return { error: 'Not signed in.' };
      const cleanKey = payload.nutrient_key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
      if (!cleanKey || !payload.display_name.trim() || !payload.unit.trim()) {
        return { error: 'Nutrient key, display name, and unit are required.' };
      }
      if (payload.adult_daily_rda <= 0 || payload.priority_weight <= 0 || payload.priority_weight > 1) {
        return { error: 'Adult daily RDA must be positive and priority weight must be in (0, 1].' };
      }
      if (nutrientConfigs.some((n) => n.nutrient_key === cleanKey)) {
        return { error: `Nutrient key "${cleanKey}" is already configured.` };
      }

      const nowIso = new Date().toISOString();
      if (isDemoMode) {
        const cfg: NutrientConfig = {
          id: makeUuid(),
          nutrient_key: cleanKey,
          display_name: payload.display_name.trim(),
          unit: payload.unit.trim(),
          adult_daily_rda: payload.adult_daily_rda,
          priority_weight: payload.priority_weight,
          source_guideline: payload.source_guideline.trim() || 'ICMR-NIN RDA 2020',
          is_core: false,
          is_enabled: true,
        };
        setDemoData((prev) => ({
          ...prev,
          nutrientConfigs: [...prev.nutrientConfigs, cfg],
          auditLogs: [
            {
              id: makeUuid(),
              actor_id: profile.id,
              actor_label: profile.full_name,
              action: 'NUTRIENT_CONFIG_ADDED',
              entity_type: 'nutrient_configurations',
              entity_id: cleanKey,
              metadata: { display_name: cfg.display_name, unit: cfg.unit, rda: cfg.adult_daily_rda },
              created_at: nowIso,
            },
            ...prev.auditLogs,
          ],
        }));
        pushToast('success', `Nutrient added: ${cfg.display_name}`, `Adult RDA: ${cfg.adult_daily_rda} ${cfg.unit}`);
        return { error: null };
      }

      if (!supabase) return { error: 'Supabase not configured.' };
      const { error } = await supabase.from('nutrient_configurations').insert({
        nutrient_key: cleanKey,
        display_name: payload.display_name.trim(),
        unit: payload.unit.trim(),
        adult_daily_rda: payload.adult_daily_rda,
        priority_weight: payload.priority_weight,
        source_guideline: payload.source_guideline.trim() || 'ICMR-NIN RDA 2020',
        is_core: false,
        is_enabled: true,
      });
      if (error) return { error: error.message };
      await refreshAllData();
      pushToast('success', `Nutrient added: ${payload.display_name}`);
      return { error: null };
    },
    [requireAction, profile, nutrientConfigs, isDemoMode, supabase, refreshAllData, pushToast]
  );

  const value: AppContextValue = {
    isDemoMode,
    isSupabaseConfigured: supabaseConfigStatus.isConfigured,
    missingEnvVars: supabaseConfigStatus.missingVars,
    enterDemoMode,
    exitDemoMode,
    resetDemoScenario,
    switchDemoRole,
    session,
    profile,
    activeOrganisation,
    authLoading,
    dataLoading,
    signIn,
    signUp,
    signOut,
    requestPasswordReset,
    refreshSession,
    language,
    setLanguage,
    t: translations[language],
    organisations,
    batches,
    requests,
    allocations,
    routes,
    safetyChecks,
    mealtraceEvents,
    impactRecords,
    incidents,
    notifications,
    auditLogs,
    foodCatalog,
    nutrientConfigs,
    communityProfiles,
    communityInventory,
    targetedRequests,
    nutritionalSnapshots,
    communityGapAnalyses,
    refreshAllData,
    registerOrganisation,
    createDonationBatch,
    updateDonationBatch,
    cancelDonationBatch,
    createMealRequest,
    recordFoodSafetyInspection,
    proposeSplitAllocations,
    approveAllocation,
    respondToAllocation,
    assignDeliveryRoute,
    updateRouteStatus,
    recordMealTraceScan,
    updateOrganisationStatus,
    updateOrganisationCapacity,
    reportIncident,
    updateIncidentStatus,
    markNotificationRead,
    upsertCommunityNutritionProfile,
    recordCommunityInventory,
    generateTargetedRequestsForOrg,
    approveTargetedDonationRequest,
    dismissTargetedDonationRequest,
    upsertFoodCompositionItem,
    addCustomNutrientConfig,
    toasts,
    pushToast,
    dismissToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
