-- ==============================================================================
-- HUNGERLINK 2.0 — Row Level Security (RLS), Privilege Guards & Storage Security
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Security Helper Functions (SECURITY DEFINER, search_path locked)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT role = 'ADMINISTRATOR' FROM public.profiles WHERE id = auth.uid()), FALSE);
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organisation_members
    WHERE organisation_id = p_org_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_verified_org(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organisations
    WHERE id = p_org_id
      AND verification_status = 'verified'
  );
$$;

-- ------------------------------------------------------------------------------
-- 2. Auto-provision Profile on Auth Sign-Up (blocks self-assignment of ADMIN)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role TEXT;
  safe_role TEXT;
BEGIN
  requested_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'FOOD_DONOR');
  -- Strictly forbid self-assigning ADMINISTRATOR on registration
  IF requested_role IN ('FOOD_DONOR', 'VERIFIED_NGO', 'COMMUNITY_KITCHEN', 'DELIVERY_PARTNER', 'FIELD_WORKER') THEN
    safe_role := requested_role;
  ELSE
    safe_role := 'FOOD_DONOR';
  END IF;

  INSERT INTO public.profiles (id, full_name, email, phone, preferred_language, role)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'full_name'), ''), split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data ->> 'phone',
    CASE WHEN NEW.raw_user_meta_data ->> 'preferred_language' = 'ta' THEN 'ta' ELSE 'en' END,
    safe_role
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 3. Anti-Privilege-Escalation Triggers
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden: Only administrators may change user roles.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_escalation();

CREATE OR REPLACE FUNCTION public.prevent_org_verification_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.verification_status IS DISTINCT FROM OLD.verification_status
      OR NEW.verification_reason IS DISTINCT FROM OLD.verification_reason)
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden: Only administrators may modify organisation verification status.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_org_verification_tampering ON public.organisations;
CREATE TRIGGER trg_prevent_org_verification_tampering
  BEFORE UPDATE ON public.organisations
  FOR EACH ROW EXECUTE FUNCTION public.prevent_org_verification_tampering();

-- ------------------------------------------------------------------------------
-- 4. Append-Only Immutability Triggers (mealtrace_events & audit_logs)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_append_only()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Append-only ledger violation: UPDATE and DELETE are prohibited on %.', TG_TABLE_NAME;
END;
$$;

DROP TRIGGER IF EXISTS trg_mealtrace_append_only ON public.mealtrace_events;
CREATE TRIGGER trg_mealtrace_append_only
  BEFORE UPDATE OR DELETE ON public.mealtrace_events
  FOR EACH ROW EXECUTE FUNCTION public.enforce_append_only();

DROP TRIGGER IF EXISTS trg_audit_logs_append_only ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_append_only
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.enforce_append_only();

-- ------------------------------------------------------------------------------
-- 5. Enable Row Level Security Across All Tables
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_safety_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mealtrace_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 6. RLS Policies: profiles
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_self_or_admin" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_self_or_admin" ON public.profiles
  FOR UPDATE USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 7. RLS Policies: organisations
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "orgs_select_authorized" ON public.organisations;
CREATE POLICY "orgs_select_authorized" ON public.organisations
  FOR SELECT USING (
    public.is_admin()
    OR public.is_org_member(id)
    OR (
      verification_status = 'verified'
      AND auth.uid() IS NOT NULL
      AND public.current_user_role() IN ('DELIVERY_PARTNER', 'FIELD_WORKER', 'VERIFIED_NGO', 'COMMUNITY_KITCHEN', 'FOOD_DONOR')
    )
  );

DROP POLICY IF EXISTS "orgs_insert_authenticated" ON public.organisations;
CREATE POLICY "orgs_insert_authenticated" ON public.organisations
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND verification_status = 'pending'
  );

DROP POLICY IF EXISTS "orgs_update_owner_or_admin" ON public.organisations;
CREATE POLICY "orgs_update_owner_or_admin" ON public.organisations
  FOR UPDATE USING (public.is_admin() OR public.is_org_member(id))
  WITH CHECK (public.is_admin() OR public.is_org_member(id));

-- ------------------------------------------------------------------------------
-- 8. RLS Policies: organisation_members
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "org_members_select_own_or_admin" ON public.organisation_members;
CREATE POLICY "org_members_select_own_or_admin" ON public.organisation_members
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin() OR public.is_org_member(organisation_id));

DROP POLICY IF EXISTS "org_members_insert_owner_bootstrap_or_admin" ON public.organisation_members;
CREATE POLICY "org_members_insert_owner_bootstrap_or_admin" ON public.organisation_members
  FOR INSERT WITH CHECK (
    public.is_admin()
    OR (
      user_id = auth.uid()
      AND membership_role = 'OWNER'
      AND NOT EXISTS (
        SELECT 1 FROM public.organisation_members existing
        WHERE existing.organisation_id = organisation_members.organisation_id
      )
    )
  );

DROP POLICY IF EXISTS "org_members_manage_admin" ON public.organisation_members;
CREATE POLICY "org_members_manage_admin" ON public.organisation_members
  FOR UPDATE USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 9. RLS Policies: donation_batches
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "batches_select_scoped" ON public.donation_batches;
CREATE POLICY "batches_select_scoped" ON public.donation_batches
  FOR SELECT USING (
    public.is_admin()
    OR public.is_org_member(donor_id)
    OR EXISTS (
      SELECT 1
      FROM public.allocations a
      JOIN public.meal_requests mr ON mr.id = a.meal_request_id
      WHERE a.donation_batch_id = donation_batches.id
        AND public.is_org_member(mr.org_id)
    )
    OR EXISTS (
      SELECT 1
      FROM public.allocations a
      JOIN public.delivery_stops ds ON ds.allocation_id = a.id
      JOIN public.delivery_routes dr ON dr.id = ds.route_id
      WHERE a.donation_batch_id = donation_batches.id
        AND dr.delivery_partner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "batches_insert_verified_donor" ON public.donation_batches;
CREATE POLICY "batches_insert_verified_donor" ON public.donation_batches
  FOR INSERT WITH CHECK (
    (public.is_org_member(donor_id) AND public.is_verified_org(donor_id))
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "batches_update_donor_before_allocation_or_admin" ON public.donation_batches;
CREATE POLICY "batches_update_donor_before_allocation_or_admin" ON public.donation_batches
  FOR UPDATE USING (
    public.is_admin()
    OR (
      public.is_org_member(donor_id)
      AND status IN ('SUBMITTED', 'PENDING_INSPECTION')
      AND portions_allocated = 0
    )
  );

-- ------------------------------------------------------------------------------
-- 10. RLS Policies: meal_requests
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "requests_select_scoped" ON public.meal_requests;
CREATE POLICY "requests_select_scoped" ON public.meal_requests
  FOR SELECT USING (
    public.is_admin()
    OR public.is_org_member(org_id)
    OR (public.current_user_role() = 'FIELD_WORKER' AND submitted_by = auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.allocations a
      JOIN public.delivery_stops ds ON ds.allocation_id = a.id
      JOIN public.delivery_routes dr ON dr.id = ds.route_id
      WHERE a.meal_request_id = meal_requests.id
        AND dr.delivery_partner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "requests_insert_verified_recipient_or_field_worker" ON public.meal_requests;
CREATE POLICY "requests_insert_verified_recipient_or_field_worker" ON public.meal_requests
  FOR INSERT WITH CHECK (
    public.is_admin()
    OR (public.is_org_member(org_id) AND public.is_verified_org(org_id))
    OR (public.current_user_role() = 'FIELD_WORKER' AND public.is_verified_org(org_id) AND submitted_by = auth.uid())
  );

DROP POLICY IF EXISTS "requests_update_scoped" ON public.meal_requests;
CREATE POLICY "requests_update_scoped" ON public.meal_requests
  FOR UPDATE USING (public.is_admin() OR public.is_org_member(org_id));

-- ------------------------------------------------------------------------------
-- 11. RLS Policies: allocations
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "allocations_select_scoped" ON public.allocations;
CREATE POLICY "allocations_select_scoped" ON public.allocations
  FOR SELECT USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.donation_batches db
      WHERE db.id = allocations.donation_batch_id AND public.is_org_member(db.donor_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.meal_requests mr
      WHERE mr.id = allocations.meal_request_id AND public.is_org_member(mr.org_id)
    )
    OR EXISTS (
      SELECT 1
      FROM public.delivery_stops ds
      JOIN public.delivery_routes dr ON dr.id = ds.route_id
      WHERE ds.allocation_id = allocations.id AND dr.delivery_partner_id = auth.uid()
    )
  );

-- Mutations on allocations must occur via trusted SECURITY DEFINER RPCs or Admin
DROP POLICY IF EXISTS "allocations_admin_write" ON public.allocations;
CREATE POLICY "allocations_admin_write" ON public.allocations
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 12. RLS Policies: delivery_routes & delivery_stops
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "routes_select_assigned_or_admin" ON public.delivery_routes;
CREATE POLICY "routes_select_assigned_or_admin" ON public.delivery_routes
  FOR SELECT USING (
    public.is_admin()
    OR delivery_partner_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.delivery_stops ds
      JOIN public.allocations a ON a.id = ds.allocation_id
      JOIN public.meal_requests mr ON mr.id = a.meal_request_id
      WHERE ds.route_id = delivery_routes.id AND public.is_org_member(mr.org_id)
    )
    OR EXISTS (
      SELECT 1
      FROM public.delivery_stops ds
      JOIN public.allocations a ON a.id = ds.allocation_id
      JOIN public.donation_batches db ON db.id = a.donation_batch_id
      WHERE ds.route_id = delivery_routes.id AND public.is_org_member(db.donor_id)
    )
  );

DROP POLICY IF EXISTS "routes_update_assigned_partner_or_admin" ON public.delivery_routes;
CREATE POLICY "routes_update_assigned_partner_or_admin" ON public.delivery_routes
  FOR UPDATE USING (public.is_admin() OR delivery_partner_id = auth.uid());

DROP POLICY IF EXISTS "stops_select_scoped" ON public.delivery_stops;
CREATE POLICY "stops_select_scoped" ON public.delivery_stops
  FOR SELECT USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.delivery_routes dr
      WHERE dr.id = delivery_stops.route_id AND dr.delivery_partner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.allocations a
      JOIN public.meal_requests mr ON mr.id = a.meal_request_id
      WHERE a.id = delivery_stops.allocation_id AND public.is_org_member(mr.org_id)
    )
  );

DROP POLICY IF EXISTS "stops_update_assigned_partner_or_admin" ON public.delivery_stops;
CREATE POLICY "stops_update_assigned_partner_or_admin" ON public.delivery_stops
  FOR UPDATE USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.delivery_routes dr
      WHERE dr.id = delivery_stops.route_id AND dr.delivery_partner_id = auth.uid()
    )
  );

-- ------------------------------------------------------------------------------
-- 13. RLS Policies: food_safety_checks
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "safety_select_scoped" ON public.food_safety_checks;
CREATE POLICY "safety_select_scoped" ON public.food_safety_checks
  FOR SELECT USING (
    public.is_admin()
    OR inspector_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.donation_batches db
      WHERE db.id = food_safety_checks.donation_batch_id AND public.is_org_member(db.donor_id)
    )
    OR EXISTS (
      SELECT 1
      FROM public.allocations a
      JOIN public.meal_requests mr ON mr.id = a.meal_request_id
      WHERE a.donation_batch_id = food_safety_checks.donation_batch_id AND public.is_org_member(mr.org_id)
    )
  );

-- Final inspection records are inserted via trusted RPC (inspector/admin verified)
DROP POLICY IF EXISTS "safety_insert_admin_only_direct" ON public.food_safety_checks;
CREATE POLICY "safety_insert_admin_only_direct" ON public.food_safety_checks
  FOR INSERT WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 14. RLS Policies: mealtrace_events (Append-only, RPC-mediated inserts)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "mealtrace_select_scoped" ON public.mealtrace_events;
CREATE POLICY "mealtrace_select_scoped" ON public.mealtrace_events
  FOR SELECT USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.donation_batches db
      WHERE db.id = mealtrace_events.donation_batch_id AND public.is_org_member(db.donor_id)
    )
    OR EXISTS (
      SELECT 1
      FROM public.allocations a
      JOIN public.meal_requests mr ON mr.id = a.meal_request_id
      WHERE a.donation_batch_id = mealtrace_events.donation_batch_id AND public.is_org_member(mr.org_id)
    )
    OR EXISTS (
      SELECT 1
      FROM public.allocations a
      JOIN public.delivery_stops ds ON ds.allocation_id = a.id
      JOIN public.delivery_routes dr ON dr.id = ds.route_id
      WHERE a.donation_batch_id = mealtrace_events.donation_batch_id AND dr.delivery_partner_id = auth.uid()
    )
  );

-- Normal users cannot insert arbitrary mealtrace events directly; use record_mealtrace_scan RPC
DROP POLICY IF EXISTS "mealtrace_insert_admin_only_direct" ON public.mealtrace_events;
CREATE POLICY "mealtrace_insert_admin_only_direct" ON public.mealtrace_events
  FOR INSERT WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 15. RLS Policies: impact_records, incidents, notifications, audit_logs
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "impact_select_scoped" ON public.impact_records;
CREATE POLICY "impact_select_scoped" ON public.impact_records
  FOR SELECT USING (
    public.is_admin()
    OR public.is_org_member(organisation_id)
    OR EXISTS (
      SELECT 1 FROM public.donation_batches db
      WHERE db.id = impact_records.donation_batch_id AND public.is_org_member(db.donor_id)
    )
  );

DROP POLICY IF EXISTS "incidents_select_reporter_or_admin" ON public.incidents;
CREATE POLICY "incidents_select_reporter_or_admin" ON public.incidents
  FOR SELECT USING (public.is_admin() OR reporter_id = auth.uid());

DROP POLICY IF EXISTS "incidents_insert_authenticated" ON public.incidents;
CREATE POLICY "incidents_insert_authenticated" ON public.incidents
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND reporter_id = auth.uid());

DROP POLICY IF EXISTS "incidents_update_admin" ON public.incidents;
CREATE POLICY "incidents_update_admin" ON public.incidents
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "notifications_update_own_read" ON public.notifications;
CREATE POLICY "notifications_update_own_read" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "audit_logs_select_admin_only" ON public.audit_logs;
CREATE POLICY "audit_logs_select_admin_only" ON public.audit_logs
  FOR SELECT USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 16. Private Storage Bucket for Organisation Verification Documents
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'org-verification-docs',
  'org-verification-docs',
  FALSE,
  5242880,
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "org_docs_upload_own_folder" ON storage.objects;
CREATE POLICY "org_docs_upload_own_folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'org-verification-docs'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "org_docs_read_owner_or_admin" ON storage.objects;
CREATE POLICY "org_docs_read_owner_or_admin" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'org-verification-docs'
    AND (
      public.is_admin()
      OR (storage.foldername(name))[1] = auth.uid()::text
    )
  );
