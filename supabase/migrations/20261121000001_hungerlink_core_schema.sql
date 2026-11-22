-- ==============================================================================
-- HUNGERLINK 2.0 — Core PostgreSQL Schema Migration (Non-Destructive / Additive)
-- Compatible with shared Web + Native Android Supabase backend.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. Helper Trigger Function: updated_at
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------------------------
-- 2. profiles
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) >= 2),
  email TEXT NOT NULL,
  phone TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'ta')),
  role TEXT NOT NULL DEFAULT 'FOOD_DONOR' CHECK (
    role IN (
      'FOOD_DONOR',
      'VERIFIED_NGO',
      'COMMUNITY_KITCHEN',
      'DELIVERY_PARTNER',
      'ADMINISTRATOR',
      'FIELD_WORKER'
    )
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ------------------------------------------------------------------------------
-- 3. organisations
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  org_type TEXT NOT NULL CHECK (
    org_type IN ('FOOD_DONOR', 'VERIFIED_NGO', 'COMMUNITY_KITCHEN', 'DELIVERY_PARTNER')
  ),
  address TEXT NOT NULL,
  location_lat DOUBLE PRECISION NOT NULL CHECK (location_lat BETWEEN -90 AND 90),
  location_lng DOUBLE PRECISION NOT NULL CHECK (location_lng BETWEEN -180 AND 180),
  contact_person TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  fssai_reg_no TEXT,
  ngo_reg_no TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    verification_status IN ('pending', 'verified', 'rejected', 'suspended')
  ),
  verification_doc_path TEXT,
  verification_reason TEXT,
  daily_capacity INTEGER NOT NULL DEFAULT 0 CHECK (daily_capacity >= 0),
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_organisations_status ON public.organisations(verification_status);
CREATE INDEX IF NOT EXISTS idx_organisations_type ON public.organisations(org_type);
CREATE INDEX IF NOT EXISTS idx_organisations_demo ON public.organisations(is_demo);

-- ------------------------------------------------------------------------------
-- 4. organisation_members
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organisation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  membership_role TEXT NOT NULL CHECK (
    membership_role IN ('OWNER', 'MANAGER', 'COORDINATOR', 'STAFF', 'INSPECTOR', 'FIELD_AGENT')
  ),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (organisation_id, user_id, membership_role)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organisation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organisation_members(organisation_id);

-- ------------------------------------------------------------------------------
-- 5. donation_batches
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.donation_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_code TEXT NOT NULL UNIQUE,
  qr_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  donor_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE RESTRICT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  food_item TEXT NOT NULL,
  food_category TEXT NOT NULL DEFAULT 'COOKED_MEALS',
  dietary_type TEXT NOT NULL CHECK (
    dietary_type IN ('VEGETARIAN', 'VEGAN', 'NON_VEGETARIAN', 'EGGETARIAN', 'HALAL', 'JAIN')
  ),
  portions_available INTEGER NOT NULL CHECK (portions_available > 0),
  portions_allocated INTEGER NOT NULL DEFAULT 0 CHECK (portions_allocated >= 0),
  prep_time TIMESTAMPTZ NOT NULL,
  pickup_deadline TIMESTAMPTZ NOT NULL,
  consume_by_time TIMESTAMPTZ NOT NULL,
  temp_celsius NUMERIC(5,2),
  packaging_details TEXT NOT NULL,
  safety_gate_passed BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (
    status IN (
      'SUBMITTED',
      'PENDING_INSPECTION',
      'INSPECTION_PASSED',
      'INSPECTION_REJECTED',
      'ALLOCATION_PROPOSED',
      'ALLOCATED',
      'DISPATCHED',
      'PICKED_UP',
      'DELIVERED',
      'CANCELLED',
      'EXPIRED'
    )
  ),
  cancellation_reason TEXT,
  pickup_address TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION NOT NULL CHECK (pickup_lat BETWEEN -90 AND 90),
  pickup_lng DOUBLE PRECISION NOT NULL CHECK (pickup_lng BETWEEN -180 AND 180),
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT chk_batch_time_order CHECK (consume_by_time > prep_time AND pickup_deadline <= consume_by_time),
  CONSTRAINT chk_portions_bound CHECK (portions_allocated <= portions_available)
);

CREATE INDEX IF NOT EXISTS idx_donation_batches_donor ON public.donation_batches(donor_id);
CREATE INDEX IF NOT EXISTS idx_donation_batches_status ON public.donation_batches(status);
CREATE INDEX IF NOT EXISTS idx_donation_batches_qr_token ON public.donation_batches(qr_token);
CREATE INDEX IF NOT EXISTS idx_donation_batches_demo ON public.donation_batches(is_demo);

-- ------------------------------------------------------------------------------
-- 6. meal_requests
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.meal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE RESTRICT,
  submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  portions_needed INTEGER NOT NULL CHECK (portions_needed > 0),
  portions_fulfilled INTEGER NOT NULL DEFAULT 0 CHECK (portions_fulfilled >= 0),
  dietary_pref TEXT NOT NULL CHECK (
    dietary_pref IN ('ANY', 'VEGETARIAN', 'VEGAN', 'NON_VEGETARIAN', 'EGGETARIAN', 'HALAL', 'JAIN')
  ),
  urgency_score NUMERIC(4,3) NOT NULL DEFAULT 0.500 CHECK (urgency_score >= 0 AND urgency_score <= 1),
  wait_started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  intake_channel TEXT NOT NULL DEFAULT 'WEB_PORTAL' CHECK (
    intake_channel IN ('WEB_PORTAL', 'ANDROID_APP', 'FIELD_ASSISTED_PHONE', 'FIELD_ASSISTED_WALKIN', 'FIELD_ASSISTED_OUTREACH')
  ),
  required_by TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (
    status IN ('OPEN', 'PARTIALLY_ALLOCATED', 'ALLOCATED', 'FULFILLED', 'CANCELLED', 'EXPIRED')
  ),
  idempotency_key UUID UNIQUE,
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_meal_requests_org ON public.meal_requests(org_id);
CREATE INDEX IF NOT EXISTS idx_meal_requests_status ON public.meal_requests(status);
CREATE INDEX IF NOT EXISTS idx_meal_requests_demo ON public.meal_requests(is_demo);

-- ------------------------------------------------------------------------------
-- 7. allocations
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_batch_id UUID NOT NULL REFERENCES public.donation_batches(id) ON DELETE CASCADE,
  meal_request_id UUID NOT NULL REFERENCES public.meal_requests(id) ON DELETE CASCADE,
  allocated_portions INTEGER NOT NULL CHECK (allocated_portions > 0),
  match_score NUMERIC(5,4) NOT NULL CHECK (match_score >= 0 AND match_score <= 1),
  match_explanation JSONB NOT NULL DEFAULT '{}'::jsonb,
  approved_by_coordinator UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'PROPOSED' CHECK (
    status IN (
      'PROPOSED',
      'APPROVED',
      'ACCEPTED',
      'DECLINED',
      'DISPATCHED',
      'PICKED_UP',
      'DELIVERED',
      'CANCELLED'
    )
  ),
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (donation_batch_id, meal_request_id)
);

CREATE INDEX IF NOT EXISTS idx_allocations_batch ON public.allocations(donation_batch_id);
CREATE INDEX IF NOT EXISTS idx_allocations_request ON public.allocations(meal_request_id);
CREATE INDEX IF NOT EXISTS idx_allocations_status ON public.allocations(status);

-- ------------------------------------------------------------------------------
-- 8. delivery_routes
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.delivery_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_partner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  route_status TEXT NOT NULL DEFAULT 'ASSIGNED' CHECK (
    route_status IN ('ASSIGNED', 'ACCEPTED', 'REJECTED', 'EN_ROUTE_PICKUP', 'PICKED_UP', 'EN_ROUTE_DROPOFF', 'COMPLETED', 'CANCELLED')
  ),
  route_polyline TEXT,
  estimated_duration INTEGER NOT NULL DEFAULT 0 CHECK (estimated_duration >= 0),
  estimated_distance NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (estimated_distance >= 0),
  vehicle_capacity_portions INTEGER NOT NULL DEFAULT 120 CHECK (vehicle_capacity_portions > 0),
  shift_payout_reference TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_delivery_routes_partner ON public.delivery_routes(delivery_partner_id);
CREATE INDEX IF NOT EXISTS idx_delivery_routes_status ON public.delivery_routes(route_status);

-- ------------------------------------------------------------------------------
-- 9. delivery_stops
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.delivery_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.delivery_routes(id) ON DELETE CASCADE,
  allocation_id UUID NOT NULL REFERENCES public.allocations(id) ON DELETE CASCADE,
  stop_order INTEGER NOT NULL CHECK (stop_order >= 1),
  stop_type TEXT NOT NULL CHECK (stop_type IN ('PICKUP', 'DROPOFF')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (
    status IN ('PENDING', 'ARRIVED', 'COMPLETED', 'SKIPPED', 'FAILED')
  ),
  arrived_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE (route_id, stop_order)
);

CREATE INDEX IF NOT EXISTS idx_delivery_stops_route ON public.delivery_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_delivery_stops_allocation ON public.delivery_stops(allocation_id);

-- ------------------------------------------------------------------------------
-- 10. food_safety_checks
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.food_safety_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_batch_id UUID NOT NULL REFERENCES public.donation_batches(id) ON DELETE CASCADE,
  inspector_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  inspection_status TEXT NOT NULL CHECK (
    inspection_status IN ('PASSED', 'REJECTED', 'PENDING_REVIEW')
  ),
  recorded_temp NUMERIC(5,2),
  packaging_condition TEXT NOT NULL DEFAULT 'INTACT_SEALED',
  inspection_notes TEXT,
  rejection_reason TEXT,
  physical_inspection_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  inspected_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_food_safety_batch ON public.food_safety_checks(donation_batch_id);
CREATE INDEX IF NOT EXISTS idx_food_safety_status ON public.food_safety_checks(inspection_status);

-- ------------------------------------------------------------------------------
-- 11. mealtrace_events (APPEND-ONLY)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mealtrace_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_batch_id UUID NOT NULL REFERENCES public.donation_batches(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'DONATION_SUBMITTED',
      'INSPECTION_PASSED',
      'INSPECTION_REJECTED',
      'QR_GENERATED',
      'ALLOCATION_APPROVED',
      'PICKUP_SCANNED',
      'HANDOVER_SCANNED',
      'PORTIONS_CONFIRMED',
      'INCIDENT_REPORTED'
    )
  ),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recorded_temp NUMERIC(5,2),
  confirmed_portions INTEGER CHECK (confirmed_portions IS NULL OR confirmed_portions >= 0),
  event_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_mealtrace_batch ON public.mealtrace_events(donation_batch_id, created_at);

-- ------------------------------------------------------------------------------
-- 12. impact_records
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.impact_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_batch_id UUID NOT NULL REFERENCES public.donation_batches(id) ON DELETE RESTRICT,
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE RESTRICT,
  portions_delivered INTEGER NOT NULL CHECK (portions_delivered >= 0),
  distribution_area TEXT NOT NULL,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  is_demo BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_impact_records_org ON public.impact_records(organisation_id);
CREATE INDEX IF NOT EXISTS idx_impact_records_confirmed ON public.impact_records(confirmed_at);
CREATE INDEX IF NOT EXISTS idx_impact_records_demo ON public.impact_records(is_demo);

-- ------------------------------------------------------------------------------
-- 13. incidents
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.donation_batches(id) ON DELETE SET NULL,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  incident_type TEXT NOT NULL CHECK (
    incident_type IN (
      'TEMP_DEVIATION',
      'PACKAGING_DAMAGE',
      'DELIVERY_DELAY',
      'QUANTITY_DISCREPANCY',
      'ACCESS_ISSUE',
      'SAFETY_CONCERN',
      'OTHER'
    )
  ),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED')),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_batch ON public.incidents(batch_id);

-- ------------------------------------------------------------------------------
-- 14. notifications
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read_at);

-- ------------------------------------------------------------------------------
-- 15. audit_logs (APPEND-ONLY)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ------------------------------------------------------------------------------
-- 16. Attach updated_at Triggers
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'profiles', 'organisations', 'donation_batches',
    'meal_requests', 'allocations', 'delivery_routes'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%I;', tbl, tbl);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- ------------------------------------------------------------------------------
-- 17. Enable Realtime on Operational Tables
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE
        public.donation_batches,
        public.meal_requests,
        public.allocations,
        public.delivery_routes,
        public.delivery_stops,
        public.mealtrace_events,
        public.notifications,
        public.incidents;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END;
$$;
