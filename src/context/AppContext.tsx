import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { createIsolatedDemoDataset, type DemoDataset } from '../data/demoScenario';
import { translations, type SupportedLanguage, type TranslationDictionary } from '../i18n/translations';
import { validateSplitAllocationBatch, type ProposedAllocationCandidate } from '../lib/matchingEngine';
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

  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

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

  const pushToast = useCallback((tone: ToastMessage['tone'], title: string, description?: string) => {
    const id = makeUuid();
    setToasts((prev) => [...prev, { id, tone, title, description }]);
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
        if (typed.preferred_language === 'ta' || typed.preferred_language === 'en') {
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

  // ---------------------------------------------------------------------------
  // Domain Operations (Live Supabase RPC / Table Ops OR Isolated Demo State)
  // ---------------------------------------------------------------------------
  const registerOrganisation: AppContextValue['registerOrganisation'] = useCallback(
    async (payload) => {
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

      const { data: createdOrg, error: orgErr } = await supabase
        .from('organisations')
        .insert({
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
        })
        .select()
        .single();

      if (orgErr || !createdOrg) return { error: orgErr?.message ?? 'Failed to register organisation.' };

      const { error: memberErr } = await supabase.from('organisation_members').insert({
        organisation_id: (createdOrg as Organisation).id,
        user_id: session.user.id,
        membership_role: 'OWNER',
        status: 'active',
      });
      if (memberErr) return { error: memberErr.message };

      setLiveMemberOrgId((createdOrg as Organisation).id);
      await refreshAllData();
      pushToast('success', 'Organisation registered', 'Your organisation is now pending administrator verification.');
      return { error: null };
    },
    [isDemoMode, supabase, session, refreshAllData, pushToast]
  );

  const createDonationBatch: AppContextValue['createDonationBatch'] = useCallback(
    async (payload) => {
      const donor = organisations.find((o) => o.id === payload.donor_id);
      if (!donor || donor.verification_status !== 'verified') {
        return { error: 'Only verified donor organisations may submit food donations.' };
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
        setDemoData((prev) => ({
          ...prev,
          batches: [newBatch, ...prev.batches],
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
              event_metadata: { portions_available: payload.portions_available },
              created_at: nowIso,
            },
          ],
          notifications: [
            {
              id: makeUuid(),
              user_id: prev.profiles.ADMINISTRATOR.id,
              notification_type: 'NEW_DONATION',
              title: `New Donation ${batchCode}`,
              message: `${donor.name} offered ${payload.portions_available} portions (${payload.food_item}). Awaiting physical inspection.`,
              read_at: null,
              created_at: nowIso,
            },
            ...prev.notifications,
          ],
        }));
        pushToast('success', `Donation ${batchCode} submitted`, 'Physical food-safety inspection required before matching.');
        return { error: null };
      }

      if (!supabase || !session?.user) return { error: 'Not signed in.' };
      const { error } = await supabase.from('donation_batches').insert({
        batch_code: batchCode,
        donor_id: payload.donor_id,
        created_by: session.user.id,
        food_item: payload.food_item,
        food_category: payload.food_category,
        dietary_type: payload.dietary_type,
        portions_available: payload.portions_available,
        prep_time: payload.prep_time,
        pickup_deadline: payload.pickup_deadline,
        consume_by_time: payload.consume_by_time,
        temp_celsius: payload.temp_celsius,
        packaging_details: payload.packaging_details,
        pickup_address: payload.pickup_address,
        pickup_lat: payload.pickup_lat,
        pickup_lng: payload.pickup_lng,
        status: 'PENDING_INSPECTION',
        safety_gate_passed: false,
        is_demo: false,
      });
      if (error) return { error: error.message };
      await refreshAllData();
      pushToast('success', `Donation ${batchCode} submitted`);
      return { error: null };
    },
    [organisations, isDemoMode, profile, supabase, session, refreshAllData, pushToast]
  );

  const updateDonationBatch: AppContextValue['updateDonationBatch'] = useCallback(
    async (batchId, updates) => {
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
    [batches, isDemoMode, supabase, refreshAllData, pushToast]
  );

  const cancelDonationBatch: AppContextValue['cancelDonationBatch'] = useCallback(
    async (batchId, reason) => {
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
    [batches, profile, isDemoMode, supabase, refreshAllData, pushToast]
  );

  const createMealRequest: AppContextValue['createMealRequest'] = useCallback(
    async (payload) => {
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
        setDemoData((prev) => ({
          ...prev,
          requests: [created, ...prev.requests],
        }));
        pushToast('success', 'Meal request recorded', `${payload.portions_needed} portions for ${org.name}`);
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
    [organisations, isDemoMode, demoData.requests, profile, supabase, session, refreshAllData, pushToast]
  );

  const recordFoodSafetyInspection: AppContextValue['recordFoodSafetyInspection'] = useCallback(
    async (payload) => {
      if (profile?.role !== 'ADMINISTRATOR') {
        return { error: 'Only authorised food-safety inspectors or administrators may record final outcomes.' };
      }
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
    [profile, isDemoMode, supabase, refreshAllData, pushToast]
  );

  const proposeSplitAllocations: AppContextValue['proposeSplitAllocations'] = useCallback(
    async (batchId, proposals) => {
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
    [batches, isDemoMode, demoData.allocations, profile, supabase, refreshAllData, pushToast]
  );

  const approveAllocation: AppContextValue['approveAllocation'] = useCallback(
    async (allocationId, reason) => {
      if (profile?.role !== 'ADMINISTRATOR') {
        return { error: 'Only coordinators/administrators may approve allocations.' };
      }
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
    [profile, isDemoMode, demoData.allocations, supabase, refreshAllData, pushToast]
  );

  const respondToAllocation: AppContextValue['respondToAllocation'] = useCallback(
    async (allocationId, decision) => {
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
    [isDemoMode, demoData.allocations, supabase, refreshAllData, pushToast]
  );

  const assignDeliveryRoute: AppContextValue['assignDeliveryRoute'] = useCallback(
    async (payload) => {
      if (profile?.role !== 'ADMINISTRATOR') {
        return { error: 'Only administrators may dispatch delivery routes.' };
      }
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
    [profile, isDemoMode, demoData, supabase, refreshAllData, pushToast]
  );

  const updateRouteStatus: AppContextValue['updateRouteStatus'] = useCallback(
    async (routeId, status) => {
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
    [isDemoMode, supabase, refreshAllData, pushToast]
  );

  const recordMealTraceScan: AppContextValue['recordMealTraceScan'] = useCallback(
    async (payload) => {
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
    [isDemoMode, demoData.batches, profile, activeOrganisation, supabase, refreshAllData, pushToast]
  );

  const updateOrganisationStatus: AppContextValue['updateOrganisationStatus'] = useCallback(
    async (orgId, status, reason) => {
      if (profile?.role !== 'ADMINISTRATOR') {
        return { error: 'Forbidden: Only administrators can modify organisation verification status.' };
      }
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
    [profile, isDemoMode, supabase, refreshAllData, pushToast]
  );

  const updateOrganisationCapacity: AppContextValue['updateOrganisationCapacity'] = useCallback(
    async (orgId, dailyCapacity) => {
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
    [isDemoMode, supabase, refreshAllData, pushToast]
  );

  const reportIncident: AppContextValue['reportIncident'] = useCallback(
    async (payload) => {
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
    [isDemoMode, profile, supabase, session, refreshAllData, pushToast]
  );

  const updateIncidentStatus: AppContextValue['updateIncidentStatus'] = useCallback(
    async (incidentId, status, resolutionNotes) => {
      if (profile?.role !== 'ADMINISTRATOR') return { error: 'Administrator access required.' };
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
    [profile, isDemoMode, supabase, refreshAllData, pushToast]
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
