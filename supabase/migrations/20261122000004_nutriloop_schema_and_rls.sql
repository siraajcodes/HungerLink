-- ==============================================================================
-- HUNGERLINK + NUTRILOOP — Additive PostgreSQL Schema, RLS, RPCs & Seed Reference
-- Non-destructive migration extending the shared Web + Android Supabase database.
-- Focus: UN SDG 2 (Zero Hunger) — Nutritional Gap Detection & Correction Engine
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Extend donation_batches with optional link to validated food composition
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.food_composition_reference (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_code TEXT NOT NULL UNIQUE,
  food_name TEXT NOT NULL,
  food_category TEXT NOT NULL CHECK (
    food_category IN (
      'CEREALS_GRAINS',
      'PULSES_LEGUMES',
      'DAIRY_PROTEIN',
      'EGG_MEAT_FISH',
      'LEAFY_VEGETABLES',
      'FRUITS_VEGETABLES',
      'NUTS_SEEDS',
      'MIXED_COOKED_MEAL'
    )
  ),
  dietary_type TEXT NOT NULL CHECK (
    dietary_type IN ('VEGETARIAN', 'VEGAN', 'NON_VEGETARIAN', 'EGGETARIAN', 'HALAL', 'JAIN')
  ),
  standard_portion_grams NUMERIC(7,2) NOT NULL CHECK (standard_portion_grams > 0),
  -- All nutrient values stored per 100g edible portion with explicit units
  calories_kcal_per_100g NUMERIC(8,2) NOT NULL CHECK (calories_kcal_per_100g >= 0),
  protein_g_per_100g NUMERIC(7,2) NOT NULL CHECK (protein_g_per_100g >= 0),
  iron_mg_per_100g NUMERIC(7,2) NOT NULL CHECK (iron_mg_per_100g >= 0),
  calcium_mg_per_100g NUMERIC(8,2) NOT NULL CHECK (calcium_mg_per_100g >= 0),
  vitamin_a_mcg_per_100g NUMERIC(8,2) NOT NULL CHECK (vitamin_a_mcg_per_100g >= 0),
  dietary_fibre_g_per_100g NUMERIC(7,2) NOT NULL CHECK (dietary_fibre_g_per_100g >= 0),
  extra_nutrients_per_100g JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_dataset TEXT NOT NULL DEFAULT 'ICMR-NIN IFCT 2017',
  source_reference TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.donation_batches
  ADD COLUMN IF NOT EXISTS food_composition_id UUID REFERENCES public.food_composition_reference(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_donation_batches_food_comp ON public.donation_batches(food_composition_id);

-- ------------------------------------------------------------------------------
-- 2. Admin-configurable Nutrient Dimensions (6 core + extensible custom nutrients)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.nutrient_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutrient_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  adult_daily_rda NUMERIC(10,2) NOT NULL CHECK (adult_daily_rda > 0),
  priority_weight NUMERIC(4,3) NOT NULL DEFAULT 0.150 CHECK (priority_weight > 0 AND priority_weight <= 1),
  source_guideline TEXT NOT NULL DEFAULT 'ICMR-NIN RDA 2020',
  is_core BOOLEAN NOT NULL DEFAULT FALSE,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ------------------------------------------------------------------------------
-- 3. Community Nutrition Profiles (Aggregated Demographic Counts ONLY — NO PII)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_nutrition_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL UNIQUE REFERENCES public.organisations(id) ON DELETE CASCADE,
  children_1_9_count INTEGER NOT NULL DEFAULT 0 CHECK (children_1_9_count >= 0),
  adolescents_10_18_count INTEGER NOT NULL DEFAULT 0 CHECK (adolescents_10_18_count >= 0),
  adults_19_59_count INTEGER NOT NULL DEFAULT 0 CHECK (adults_19_59_count >= 0),
  pregnant_lactating_count INTEGER NOT NULL DEFAULT 0 CHECK (pregnant_lactating_count >= 0),
  elderly_60_plus_count INTEGER NOT NULL DEFAULT 0 CHECK (elderly_60_plus_count >= 0),
  dietary_restriction TEXT NOT NULL DEFAULT 'VEGETARIAN' CHECK (
    dietary_restriction IN ('ANY', 'VEGETARIAN', 'VEGAN', 'NON_VEGETARIAN', 'EGGETARIAN', 'HALAL', 'JAIN')
  ),
  planning_horizon_days INTEGER NOT NULL DEFAULT 1 CHECK (planning_horizon_days BETWEEN 1 AND 14),
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT chk_total_beneficiaries_positive CHECK (
    (children_1_9_count + adolescents_10_18_count + adults_19_59_count + pregnant_lactating_count + elderly_60_plus_count) > 0
  )
);

CREATE INDEX IF NOT EXISTS idx_comm_nutr_profiles_org ON public.community_nutrition_profiles(org_id);

-- ------------------------------------------------------------------------------
-- 4. Community Food Inventory (Strictly Distinguishes Available / Distributed / Consumed)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_food_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  food_composition_id UUID REFERENCES public.food_composition_reference(id) ON DELETE SET NULL,
  custom_food_name TEXT NOT NULL,
  quantity_portions INTEGER NOT NULL CHECK (quantity_portions > 0),
  portion_grams NUMERIC(7,2) NOT NULL DEFAULT 250 CHECK (portion_grams > 0),
  inventory_stage TEXT NOT NULL CHECK (
    inventory_stage IN ('AVAILABLE', 'DISTRIBUTED', 'REPORTED_CONSUMED')
  ),
  source_batch_id UUID REFERENCES public.donation_batches(id) ON DELETE SET NULL,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  is_demo BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_comm_inventory_org_stage ON public.community_food_inventory(org_id, inventory_stage);
CREATE INDEX IF NOT EXISTS idx_comm_inventory_batch ON public.community_food_inventory(source_batch_id);

-- ------------------------------------------------------------------------------
-- 5. Targeted Donation Requests (Requires NGO Approval Before Publishing to Donors)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.targeted_donation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  target_nutrient_key TEXT NOT NULL,
  target_nutrient_label TEXT NOT NULL,
  gap_amount NUMERIC(12,2) NOT NULL CHECK (gap_amount >= 0),
  gap_unit TEXT NOT NULL,
  recommended_food_category TEXT NOT NULL,
  recommended_items TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  requested_portions INTEGER NOT NULL CHECK (requested_portions > 0),
  priority_level TEXT NOT NULL CHECK (priority_level IN ('CRITICAL', 'HIGH', 'MODERATE')),
  reason_summary TEXT NOT NULL,
  dietary_pref TEXT NOT NULL CHECK (
    dietary_pref IN ('ANY', 'VEGETARIAN', 'VEGAN', 'NON_VEGETARIAN', 'EGGETARIAN', 'HALAL', 'JAIN')
  ),
  required_delivery_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT_GENERATED' CHECK (
    status IN ('DRAFT_GENERATED', 'APPROVED_PUBLISHED', 'MATCHED', 'FULFILLED', 'DISMISSED')
  ),
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  linked_meal_request_id UUID REFERENCES public.meal_requests(id) ON DELETE SET NULL,
  matched_batch_id UUID REFERENCES public.donation_batches(id) ON DELETE SET NULL,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_targeted_requests_status ON public.targeted_donation_requests(status);
CREATE INDEX IF NOT EXISTS idx_targeted_requests_org ON public.targeted_donation_requests(org_id);

-- ------------------------------------------------------------------------------
-- 6. Nutritional Impact Snapshots (Before vs. After Redistribution)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.nutritional_impact_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  donation_batch_id UUID REFERENCES public.donation_batches(id) ON DELETE SET NULL,
  portions_confirmed INTEGER NOT NULL CHECK (portions_confirmed >= 0),
  before_adequacy_pct NUMERIC(5,2) NOT NULL,
  after_adequacy_pct NUMERIC(5,2) NOT NULL,
  before_gaps JSONB NOT NULL DEFAULT '{}'::jsonb,
  after_gaps JSONB NOT NULL DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  is_demo BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_nutr_impact_org ON public.nutritional_impact_snapshots(org_id, recorded_at DESC);

-- ------------------------------------------------------------------------------
-- 7. Attach updated_at triggers
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'food_composition_reference',
    'nutrient_configurations',
    'community_nutrition_profiles',
    'targeted_donation_requests'
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
-- 8. Row Level Security (RLS) Across All NutriLoop Tables
-- ------------------------------------------------------------------------------
ALTER TABLE public.food_composition_reference ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrient_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_nutrition_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_food_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.targeted_donation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutritional_impact_snapshots ENABLE ROW LEVEL SECURITY;

-- Reference datasets: readable by authenticated users, writable strictly by administrators
DROP POLICY IF EXISTS "food_comp_select_authenticated" ON public.food_composition_reference;
CREATE POLICY "food_comp_select_authenticated" ON public.food_composition_reference
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "food_comp_admin_manage" ON public.food_composition_reference;
CREATE POLICY "food_comp_admin_manage" ON public.food_composition_reference
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "nutrient_cfg_select_authenticated" ON public.nutrient_configurations;
CREATE POLICY "nutrient_cfg_select_authenticated" ON public.nutrient_configurations
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "nutrient_cfg_admin_manage" ON public.nutrient_configurations;
CREATE POLICY "nutrient_cfg_admin_manage" ON public.nutrient_configurations
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Community nutrition profiles (aggregate only, no beneficiary PII)
DROP POLICY IF EXISTS "comm_profiles_select_scoped" ON public.community_nutrition_profiles;
CREATE POLICY "comm_profiles_select_scoped" ON public.community_nutrition_profiles
  FOR SELECT USING (
    public.is_admin()
    OR public.is_org_member(org_id)
    OR public.current_user_role() = 'FIELD_WORKER'
  );

DROP POLICY IF EXISTS "comm_profiles_write_verified_org_or_admin" ON public.community_nutrition_profiles;
CREATE POLICY "comm_profiles_write_verified_org_or_admin" ON public.community_nutrition_profiles
  FOR ALL USING (
    public.is_admin() OR (public.is_org_member(org_id) AND public.is_verified_org(org_id))
  )
  WITH CHECK (
    public.is_admin() OR (public.is_org_member(org_id) AND public.is_verified_org(org_id))
  );

-- Community food inventory
DROP POLICY IF EXISTS "comm_inventory_select_scoped" ON public.community_food_inventory;
CREATE POLICY "comm_inventory_select_scoped" ON public.community_food_inventory
  FOR SELECT USING (public.is_admin() OR public.is_org_member(org_id));

DROP POLICY IF EXISTS "comm_inventory_insert_verified_org_or_admin" ON public.community_food_inventory;
CREATE POLICY "comm_inventory_insert_verified_org_or_admin" ON public.community_food_inventory
  FOR INSERT WITH CHECK (
    public.is_admin() OR (public.is_org_member(org_id) AND public.is_verified_org(org_id))
  );

-- Targeted donation requests:
-- Drafts visible only to owning NGO + Admin; APPROVED_PUBLISHED visible to verified Donors too
DROP POLICY IF EXISTS "targeted_req_select_scoped" ON public.targeted_donation_requests;
CREATE POLICY "targeted_req_select_scoped" ON public.targeted_donation_requests
  FOR SELECT USING (
    public.is_admin()
    OR public.is_org_member(org_id)
    OR (
      status IN ('APPROVED_PUBLISHED', 'MATCHED')
      AND auth.uid() IS NOT NULL
      AND public.current_user_role() = 'FOOD_DONOR'
    )
  );

DROP POLICY IF EXISTS "targeted_req_insert_org_or_admin" ON public.targeted_donation_requests;
CREATE POLICY "targeted_req_insert_org_or_admin" ON public.targeted_donation_requests
  FOR INSERT WITH CHECK (
    (public.is_admin() OR (public.is_org_member(org_id) AND public.is_verified_org(org_id)))
    AND status = 'DRAFT_GENERATED'
  );

DROP POLICY IF EXISTS "targeted_req_update_org_or_admin" ON public.targeted_donation_requests;
CREATE POLICY "targeted_req_update_org_or_admin" ON public.targeted_donation_requests
  FOR UPDATE USING (public.is_admin() OR public.is_org_member(org_id));

-- Nutritional impact snapshots
DROP POLICY IF EXISTS "nutr_impact_select_scoped" ON public.nutritional_impact_snapshots;
CREATE POLICY "nutr_impact_select_scoped" ON public.nutritional_impact_snapshots
  FOR SELECT USING (public.is_admin() OR public.is_org_member(org_id));

-- ------------------------------------------------------------------------------
-- 9. Trusted RPC: Approve & Publish Targeted Donation Request (Creates Linked Meal Request + Audit)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.approve_targeted_donation_request(
  p_targeted_request_id UUID,
  p_notes TEXT DEFAULT 'Approved by authorised organisation reviewer'
)
RETURNS public.targeted_donation_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.targeted_donation_requests%ROWTYPE;
  v_meal_req_id UUID;
  v_urgency NUMERIC;
BEGIN
  SELECT * INTO v_req
  FROM public.targeted_donation_requests
  WHERE id = p_targeted_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Targeted donation request not found.';
  END IF;

  IF NOT (public.is_admin() OR (public.is_org_member(v_req.org_id) AND public.is_verified_org(v_req.org_id))) THEN
    RAISE EXCEPTION 'Forbidden: Only verified recipient organisation staff or administrators may approve and publish requests.';
  END IF;

  IF v_req.status <> 'DRAFT_GENERATED' THEN
    RAISE EXCEPTION 'Request is already in status %.', v_req.status;
  END IF;

  v_urgency := CASE
    WHEN v_req.priority_level = 'CRITICAL' THEN 0.950
    WHEN v_req.priority_level = 'HIGH' THEN 0.820
    ELSE 0.650
  END;

  INSERT INTO public.meal_requests (
    org_id, submitted_by, portions_needed, dietary_pref, urgency_score,
    intake_channel, required_by, notes, is_demo
  )
  VALUES (
    v_req.org_id,
    auth.uid(),
    v_req.requested_portions,
    v_req.dietary_pref,
    v_urgency,
    'WEB_PORTAL',
    v_req.required_delivery_date,
    'NutriLoop Targeted Request (' || v_req.target_nutrient_label || '): ' || v_req.reason_summary,
    v_req.is_demo
  )
  RETURNING id INTO v_meal_req_id;

  UPDATE public.targeted_donation_requests
  SET status = 'APPROVED_PUBLISHED',
      approved_by = auth.uid(),
      approved_at = timezone('utc', now()),
      linked_meal_request_id = v_meal_req_id
  WHERE id = p_targeted_request_id
  RETURNING * INTO v_req;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(),
    'NUTRILOOP_APPROVE_TARGETED_REQUEST',
    'targeted_donation_requests',
    p_targeted_request_id,
    jsonb_build_object(
      'target_nutrient', v_req.target_nutrient_key,
      'requested_portions', v_req.requested_portions,
      'linked_meal_request_id', v_meal_req_id,
      'notes', p_notes
    )
  );

  RETURN v_req;
END;
$$;

-- ------------------------------------------------------------------------------
-- 10. Seed Core Nutrient Dimensions (ICMR-NIN RDA 2020)
-- ------------------------------------------------------------------------------
INSERT INTO public.nutrient_configurations (nutrient_key, display_name, unit, adult_daily_rda, priority_weight, source_guideline, is_core)
VALUES
  ('calories_kcal', 'Calories (Energy)', 'kcal', 2110, 0.200, 'ICMR-NIN RDA 2020 (Sedentary Adult Ref)', TRUE),
  ('protein_g', 'Protein', 'g', 50, 0.240, 'ICMR-NIN RDA 2020 (0.83g/kg ref)', TRUE),
  ('iron_mg', 'Iron', 'mg', 19, 0.180, 'ICMR-NIN RDA 2020 (Adult Ref)', TRUE),
  ('calcium_mg', 'Calcium', 'mg', 1000, 0.140, 'ICMR-NIN RDA 2020', TRUE),
  ('vitamin_a_mcg', 'Vitamin A (RAE)', 'mcg', 840, 0.120, 'ICMR-NIN RDA 2020', TRUE),
  ('dietary_fibre_g', 'Dietary Fibre', 'g', 30, 0.120, 'ICMR-NIN RDA 2020', TRUE)
ON CONFLICT (nutrient_key) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 11. Enable Realtime on NutriLoop Operational Tables
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE
        public.community_nutrition_profiles,
        public.community_food_inventory,
        public.targeted_donation_requests,
        public.nutritional_impact_snapshots;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END;
$$;
