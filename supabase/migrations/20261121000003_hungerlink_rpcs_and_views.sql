-- ==============================================================================
-- HUNGERLINK 2.0 — Concurrency-Safe RPC Functions & Verified Analytics Views
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Concurrency-Safe Split-Batch Allocation Proposal
--    Uses row-level locking (FOR UPDATE) to prevent double/over-allocation.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.propose_split_allocations(
  p_donation_batch_id UUID,
  p_proposals JSONB
)
RETURNS SETOF public.allocations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch public.donation_batches%ROWTYPE;
  v_item JSONB;
  v_request public.meal_requests%ROWTYPE;
  v_alloc_portions INTEGER;
  v_running_total INTEGER;
  v_inserted public.allocations%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden: Only authorised coordinators/administrators may propose allocations.';
  END IF;

  -- Lock donation batch row exclusively for this transaction
  SELECT * INTO v_batch
  FROM public.donation_batches
  WHERE id = p_donation_batch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Donation batch not found.';
  END IF;

  IF NOT v_batch.safety_gate_passed THEN
    RAISE EXCEPTION 'Safety gate failed: Batch % has not passed physical food safety inspection.', v_batch.batch_code;
  END IF;

  IF NOT public.is_verified_org(v_batch.donor_id) THEN
    RAISE EXCEPTION 'Donor organisation is not verified.';
  END IF;

  IF v_batch.pickup_deadline <= timezone('utc', now()) THEN
    RAISE EXCEPTION 'Pickup deadline has already passed for batch %.', v_batch.batch_code;
  END IF;

  v_running_total := v_batch.portions_allocated;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_proposals)
  LOOP
    v_alloc_portions := (v_item ->> 'allocated_portions')::INTEGER;
    IF v_alloc_portions <= 0 THEN
      RAISE EXCEPTION 'Allocated portions must be positive.';
    END IF;

    SELECT * INTO v_request
    FROM public.meal_requests
    WHERE id = (v_item ->> 'meal_request_id')::UUID
    FOR UPDATE;

    IF NOT FOUND OR v_request.status NOT IN ('OPEN', 'PARTIALLY_ALLOCATED') THEN
      RAISE EXCEPTION 'Meal request is not open for allocation.';
    END IF;

    IF NOT public.is_verified_org(v_request.org_id) THEN
      RAISE EXCEPTION 'Recipient organisation is not verified.';
    END IF;

    IF v_running_total + v_alloc_portions > v_batch.portions_available THEN
      RAISE EXCEPTION 'Over-allocation prevented: requested % exceeds remaining % portions.',
        v_alloc_portions, (v_batch.portions_available - v_running_total);
    END IF;

    INSERT INTO public.allocations (
      donation_batch_id,
      meal_request_id,
      allocated_portions,
      match_score,
      match_explanation,
      status,
      is_demo
    )
    VALUES (
      p_donation_batch_id,
      v_request.id,
      v_alloc_portions,
      COALESCE((v_item ->> 'match_score')::NUMERIC, 0),
      COALESCE(v_item -> 'match_explanation', '{}'::jsonb),
      'PROPOSED',
      v_batch.is_demo
    )
    RETURNING * INTO v_inserted;

    v_running_total := v_running_total + v_alloc_portions;
    RETURN NEXT v_inserted;
  END LOOP;

  UPDATE public.donation_batches
  SET portions_allocated = v_running_total,
      status = CASE WHEN status = 'INSPECTION_PASSED' THEN 'ALLOCATION_PROPOSED' ELSE status END
  WHERE id = p_donation_batch_id;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(),
    'PROPOSE_SPLIT_ALLOCATIONS',
    'donation_batches',
    p_donation_batch_id,
    jsonb_build_object('total_allocated', v_running_total, 'proposals', p_proposals)
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 2. Coordinator Approval of Proposed Allocation
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.approve_allocation(
  p_allocation_id UUID,
  p_reason TEXT DEFAULT 'Coordinator verified match & capacity'
)
RETURNS public.allocations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alloc public.allocations%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden: Only administrators/coordinators can approve allocations.';
  END IF;

  SELECT * INTO v_alloc
  FROM public.allocations
  WHERE id = p_allocation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Allocation not found.';
  END IF;

  IF v_alloc.status <> 'PROPOSED' THEN
    RAISE EXCEPTION 'Invalid state transition: Allocation is currently %.', v_alloc.status;
  END IF;

  UPDATE public.allocations
  SET status = 'APPROVED',
      approved_by_coordinator = auth.uid(),
      approved_at = timezone('utc', now())
  WHERE id = p_allocation_id
  RETURNING * INTO v_alloc;

  UPDATE public.donation_batches
  SET status = 'ALLOCATED'
  WHERE id = v_alloc.donation_batch_id
    AND status IN ('INSPECTION_PASSED', 'ALLOCATION_PROPOSED');

  INSERT INTO public.mealtrace_events (donation_batch_id, event_type, actor_id, event_metadata)
  VALUES (
    v_alloc.donation_batch_id,
    'ALLOCATION_APPROVED',
    auth.uid(),
    jsonb_build_object('allocation_id', p_allocation_id, 'allocated_portions', v_alloc.allocated_portions, 'reason', p_reason)
  );

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), 'APPROVE_ALLOCATION', 'allocations', p_allocation_id, jsonb_build_object('reason', p_reason));

  RETURN v_alloc;
END;
$$;

-- ------------------------------------------------------------------------------
-- 3. NGO / Community Kitchen Accept or Decline Allocation
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.respond_to_allocation(
  p_allocation_id UUID,
  p_decision TEXT
)
RETURNS public.allocations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alloc public.allocations%ROWTYPE;
  v_req public.meal_requests%ROWTYPE;
BEGIN
  IF p_decision NOT IN ('ACCEPTED', 'DECLINED') THEN
    RAISE EXCEPTION 'Decision must be ACCEPTED or DECLINED.';
  END IF;

  SELECT * INTO v_alloc FROM public.allocations WHERE id = p_allocation_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Allocation not found.';
  END IF;

  SELECT * INTO v_req FROM public.meal_requests WHERE id = v_alloc.meal_request_id FOR UPDATE;
  IF NOT (public.is_org_member(v_req.org_id) OR public.is_admin()) THEN
    RAISE EXCEPTION 'Forbidden: Only authorised recipient organisation members may respond.';
  END IF;

  IF v_alloc.status NOT IN ('PROPOSED', 'APPROVED') THEN
    RAISE EXCEPTION 'Duplicate or invalid response: Allocation is already %.', v_alloc.status;
  END IF;

  UPDATE public.allocations
  SET status = p_decision
  WHERE id = p_allocation_id
  RETURNING * INTO v_alloc;

  -- If declined, safely release portions back to donation_batches
  IF p_decision = 'DECLINED' THEN
    UPDATE public.donation_batches
    SET portions_allocated = GREATEST(0, portions_allocated - v_alloc.allocated_portions)
    WHERE id = v_alloc.donation_batch_id;
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), 'RESPOND_ALLOCATION_' || p_decision, 'allocations', p_allocation_id, '{}'::jsonb);

  RETURN v_alloc;
END;
$$;

-- ------------------------------------------------------------------------------
-- 4. Food Safety Inspection Recording (Authorised Inspector / Admin Only)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_food_safety_inspection(
  p_donation_batch_id UUID,
  p_inspection_status TEXT,
  p_recorded_temp NUMERIC,
  p_packaging_condition TEXT,
  p_inspection_notes TEXT,
  p_rejection_reason TEXT,
  p_physical_confirmed BOOLEAN
)
RETURNS public.food_safety_checks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_check public.food_safety_checks%ROWTYPE;
  v_is_inspector BOOLEAN;
BEGIN
  v_is_inspector := public.is_admin() OR EXISTS (
    SELECT 1 FROM public.organisation_members
    WHERE user_id = auth.uid() AND membership_role = 'INSPECTOR' AND status = 'active'
  );

  IF NOT v_is_inspector THEN
    RAISE EXCEPTION 'Forbidden: Only authorised food safety inspectors or administrators can record final outcomes.';
  END IF;

  IF p_inspection_status = 'PASSED' AND (NOT p_physical_confirmed OR p_recorded_temp IS NULL) THEN
    RAISE EXCEPTION 'Safety gate fail-closed: Physical inspection confirmation and temperature reading are mandatory to pass.';
  END IF;

  IF p_inspection_status = 'REJECTED' AND (p_rejection_reason IS NULL OR char_length(trim(p_rejection_reason)) < 3) THEN
    RAISE EXCEPTION 'A rejection reason is required when rejecting a donation batch.';
  END IF;

  INSERT INTO public.food_safety_checks (
    donation_batch_id, inspector_id, inspection_status, recorded_temp,
    packaging_condition, inspection_notes, rejection_reason, physical_inspection_confirmed
  )
  VALUES (
    p_donation_batch_id, auth.uid(), p_inspection_status, p_recorded_temp,
    p_packaging_condition, p_inspection_notes, p_rejection_reason, p_physical_confirmed
  )
  RETURNING * INTO v_check;

  UPDATE public.donation_batches
  SET safety_gate_passed = (p_inspection_status = 'PASSED'),
      temp_celsius = COALESCE(p_recorded_temp, temp_celsius),
      status = CASE
        WHEN p_inspection_status = 'PASSED' THEN 'INSPECTION_PASSED'
        WHEN p_inspection_status = 'REJECTED' THEN 'INSPECTION_REJECTED'
        ELSE 'PENDING_INSPECTION'
      END,
      qr_token = COALESCE(qr_token, encode(gen_random_bytes(24), 'hex'))
  WHERE id = p_donation_batch_id;

  IF p_inspection_status IN ('PASSED', 'REJECTED') THEN
    INSERT INTO public.mealtrace_events (donation_batch_id, event_type, actor_id, recorded_temp, event_metadata)
    VALUES (
      p_donation_batch_id,
      CASE WHEN p_inspection_status = 'PASSED' THEN 'INSPECTION_PASSED' ELSE 'INSPECTION_REJECTED' END,
      auth.uid(),
      p_recorded_temp,
      jsonb_build_object('packaging_condition', p_packaging_condition, 'rejection_reason', p_rejection_reason)
    );
  END IF;

  IF p_inspection_status = 'PASSED' THEN
    INSERT INTO public.mealtrace_events (donation_batch_id, event_type, actor_id, event_metadata)
    VALUES (
      p_donation_batch_id,
      'QR_GENERATED',
      auth.uid(),
      jsonb_build_object('note', 'Opaque traceability token issued following physical inspection')
    );
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(),
    'FOOD_SAFETY_' || p_inspection_status,
    'donation_batches',
    p_donation_batch_id,
    jsonb_build_object('recorded_temp', p_recorded_temp, 'rejection_reason', p_rejection_reason)
  );

  RETURN v_check;
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. MealTrace QR Scan & Handover Confirmation (Append-Only + Impact Update)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_mealtrace_scan(
  p_qr_token TEXT,
  p_event_type TEXT,
  p_recorded_temp NUMERIC DEFAULT NULL,
  p_confirmed_portions INTEGER DEFAULT NULL,
  p_distribution_area TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.mealtrace_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch public.donation_batches%ROWTYPE;
  v_event public.mealtrace_events%ROWTYPE;
  v_alloc public.allocations%ROWTYPE;
  v_req public.meal_requests%ROWTYPE;
  v_authorized BOOLEAN := FALSE;
BEGIN
  IF p_event_type NOT IN ('PICKUP_SCANNED', 'HANDOVER_SCANNED', 'PORTIONS_CONFIRMED') THEN
    RAISE EXCEPTION 'Unsupported MealTrace scan event type.';
  END IF;

  SELECT * INTO v_batch FROM public.donation_batches WHERE qr_token = p_qr_token FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or unknown MealTrace QR token.';
  END IF;

  -- Enforce strict role & assignment authorization
  IF public.is_admin() THEN
    v_authorized := TRUE;
  ELSIF p_event_type = 'PICKUP_SCANNED' THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.allocations a
      JOIN public.delivery_stops ds ON ds.allocation_id = a.id
      JOIN public.delivery_routes dr ON dr.id = ds.route_id
      WHERE a.donation_batch_id = v_batch.id AND dr.delivery_partner_id = auth.uid()
    ) INTO v_authorized;
  ELSIF p_event_type IN ('HANDOVER_SCANNED', 'PORTIONS_CONFIRMED') THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.allocations a
      JOIN public.meal_requests mr ON mr.id = a.meal_request_id
      WHERE a.donation_batch_id = v_batch.id AND public.is_org_member(mr.org_id)
    ) INTO v_authorized;
  END IF;

  IF NOT v_authorized THEN
    RAISE EXCEPTION 'Forbidden: You are not authorised to record % for this batch.', p_event_type;
  END IF;

  INSERT INTO public.mealtrace_events (
    donation_batch_id, event_type, actor_id, recorded_temp, confirmed_portions, event_metadata
  )
  VALUES (
    v_batch.id, p_event_type, auth.uid(), p_recorded_temp, p_confirmed_portions,
    jsonb_build_object('notes', p_notes, 'distribution_area', p_distribution_area)
  )
  RETURNING * INTO v_event;

  IF p_event_type = 'PICKUP_SCANNED' THEN
    UPDATE public.donation_batches SET status = 'PICKED_UP' WHERE id = v_batch.id;
  ELSIF p_event_type = 'PORTIONS_CONFIRMED' AND p_confirmed_portions IS NOT NULL THEN
    -- Locate matching recipient allocation for this actor (or first active for admin)
    SELECT a.* INTO v_alloc
    FROM public.allocations a
    JOIN public.meal_requests mr ON mr.id = a.meal_request_id
    WHERE a.donation_batch_id = v_batch.id
      AND (public.is_org_member(mr.org_id) OR public.is_admin())
    LIMIT 1;

    IF FOUND THEN
      SELECT * INTO v_req FROM public.meal_requests WHERE id = v_alloc.meal_request_id FOR UPDATE;

      UPDATE public.allocations SET status = 'DELIVERED' WHERE id = v_alloc.id;
      UPDATE public.meal_requests
      SET portions_fulfilled = portions_fulfilled + p_confirmed_portions,
          status = CASE
            WHEN portions_fulfilled + p_confirmed_portions >= portions_needed THEN 'FULFILLED'
            ELSE 'PARTIALLY_ALLOCATED'
          END
      WHERE id = v_req.id;

      INSERT INTO public.impact_records (
        donation_batch_id, organisation_id, portions_delivered, distribution_area, is_demo
      )
      VALUES (
        v_batch.id, v_req.org_id, p_confirmed_portions,
        COALESCE(NULLIF(trim(p_distribution_area), ''), 'Verified Community Distribution'),
        v_batch.is_demo
      );

      UPDATE public.donation_batches SET status = 'DELIVERED' WHERE id = v_batch.id;
    END IF;
  END IF;

  RETURN v_event;
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. Admin Organisation Verification / Suspension with Audit Trail
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_update_organisation_status(
  p_org_id UUID,
  p_new_status TEXT,
  p_reason TEXT
)
RETURNS public.organisations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org public.organisations%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden: Administrator role required.';
  END IF;

  IF p_new_status NOT IN ('pending', 'verified', 'rejected', 'suspended') THEN
    RAISE EXCEPTION 'Invalid verification status.';
  END IF;

  IF p_reason IS NULL OR char_length(trim(p_reason)) < 3 THEN
    RAISE EXCEPTION 'An explicit audit reason is required for organisation status changes.';
  END IF;

  UPDATE public.organisations
  SET verification_status = p_new_status,
      verification_reason = p_reason
  WHERE id = p_org_id
  RETURNING * INTO v_org;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(),
    'ORG_STATUS_' || upper(p_new_status),
    'organisations',
    p_org_id,
    jsonb_build_object('reason', p_reason)
  );

  RETURN v_org;
END;
$$;

-- ------------------------------------------------------------------------------
-- 7. Idempotent Assisted Field Worker Request Submission (Offline Queue Safe)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_assisted_request(
  p_idempotency_key UUID,
  p_org_id UUID,
  p_portions_needed INTEGER,
  p_dietary_pref TEXT,
  p_urgency_score NUMERIC,
  p_intake_channel TEXT,
  p_required_by TIMESTAMPTZ,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.meal_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing public.meal_requests%ROWTYPE;
  v_created public.meal_requests%ROWTYPE;
BEGIN
  IF public.current_user_role() NOT IN ('FIELD_WORKER', 'ADMINISTRATOR', 'VERIFIED_NGO', 'COMMUNITY_KITCHEN') THEN
    RAISE EXCEPTION 'Forbidden: Role not permitted to submit assisted requests.';
  END IF;

  IF NOT public.is_verified_org(p_org_id) THEN
    RAISE EXCEPTION 'Target organisation is not verified.';
  END IF;

  -- Idempotency check: safely return existing record instead of creating duplicates
  SELECT * INTO v_existing FROM public.meal_requests WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    RETURN v_existing;
  END IF;

  INSERT INTO public.meal_requests (
    org_id, submitted_by, portions_needed, dietary_pref, urgency_score,
    intake_channel, required_by, notes, idempotency_key
  )
  VALUES (
    p_org_id, auth.uid(), p_portions_needed, p_dietary_pref, p_urgency_score,
    p_intake_channel, p_required_by, p_notes, p_idempotency_key
  )
  RETURNING * INTO v_created;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(),
    'ASSISTED_REQUEST_SYNCED',
    'meal_requests',
    v_created.id,
    jsonb_build_object('idempotency_key', p_idempotency_key, 'intake_channel', p_intake_channel)
  );

  RETURN v_created;
END;
$$;

-- ------------------------------------------------------------------------------
-- 8. Verified Operational Analytics Views (STRICTLY EXCLUDE is_demo = true)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_impact_ledger_summary AS
SELECT
  COALESCE(SUM(db.portions_available), 0) AS meals_offered,
  COALESCE(SUM(db.portions_allocated), 0) AS meals_allocated,
  COALESCE((SELECT SUM(ir.portions_delivered) FROM public.impact_records ir WHERE ir.is_demo = FALSE), 0) AS meals_delivered,
  COALESCE(SUM(CASE WHEN db.status = 'INSPECTION_REJECTED' THEN db.portions_available ELSE 0 END), 0) AS meals_rejected,
  COALESCE(SUM(GREATEST(0, db.portions_available - db.portions_allocated)), 0) AS unallocated_portions,
  COUNT(DISTINCT db.donor_id) FILTER (WHERE db.status <> 'CANCELLED') AS active_donors,
  COALESCE((SELECT COUNT(DISTINCT ir.organisation_id) FROM public.impact_records ir WHERE ir.is_demo = FALSE), 0) AS recipient_orgs_served,
  COALESCE((SELECT COUNT(*) FROM public.delivery_routes dr WHERE dr.is_demo = FALSE AND dr.route_status = 'COMPLETED'), 0) AS completed_shifts
FROM public.donation_batches db
WHERE db.is_demo = FALSE;

CREATE OR REPLACE VIEW public.v_admin_dashboard_metrics AS
SELECT
  (SELECT COUNT(*) FROM public.organisations WHERE is_demo = FALSE) AS total_organisations,
  (SELECT COUNT(*) FROM public.organisations WHERE is_demo = FALSE AND verification_status = 'pending') AS pending_verifications,
  (SELECT COUNT(*) FROM public.donation_batches WHERE is_demo = FALSE AND status NOT IN ('DELIVERED', 'CANCELLED', 'EXPIRED', 'INSPECTION_REJECTED')) AS active_donations,
  (SELECT COUNT(*) FROM public.meal_requests WHERE is_demo = FALSE AND status IN ('OPEN', 'PARTIALLY_ALLOCATED')) AS active_requests,
  (SELECT COUNT(*) FROM public.allocations WHERE is_demo = FALSE AND status = 'PROPOSED') AS proposed_allocations,
  (SELECT COUNT(*) FROM public.delivery_routes WHERE is_demo = FALSE AND route_status IN ('ASSIGNED', 'ACCEPTED', 'EN_ROUTE_PICKUP', 'PICKED_UP', 'EN_ROUTE_DROPOFF')) AS deliveries_in_progress,
  (SELECT COUNT(*) FROM public.donation_batches WHERE is_demo = FALSE AND status = 'INSPECTION_REJECTED') AS rejected_donations,
  COALESCE((SELECT SUM(portions_delivered) FROM public.impact_records WHERE is_demo = FALSE), 0) AS confirmed_meals_delivered,
  (SELECT COUNT(*) FROM public.incidents WHERE status IN ('OPEN', 'INVESTIGATING')) AS open_incidents;
