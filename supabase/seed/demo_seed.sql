-- ==============================================================================
-- HUNGERLINK 2.0 — Isolated Demonstration Seed Dataset (is_demo = TRUE)
-- NEVER mixes with real operational analytics (views filter is_demo = FALSE).
--
-- Scenario:
--   Wedding Hall A: 100 vegetarian portions available
--   Shelter A: 60 portions requested
--   Community Kitchen B: 30 portions requested
--   Remaining: 10 unallocated portions
-- ==============================================================================

INSERT INTO public.organisations (
  id, name, org_type, address, location_lat, location_lng,
  contact_person, contact_phone, fssai_reg_no, ngo_reg_no,
  verification_status, daily_capacity, is_demo
)
VALUES
  (
    '11111111-1111-4111-8111-111111111101',
    'Wedding Hall A (Demo)',
    'FOOD_DONOR',
    '42 Anna Salai, Guindy, Chennai 600032',
    13.0102, 80.2155,
    'Karthik Sundaram', '+91-98400-10001',
    'FSSAI-TN-12426001001122', NULL,
    'verified', 400, TRUE
  ),
  (
    '11111111-1111-4111-8111-111111111102',
    'Shelter A — Adyar Care Home (Demo)',
    'VERIFIED_NGO',
    '18 Sardar Patel Rd, Adyar, Chennai 600020',
    13.0067, 80.2571,
    'Meenakshi Raman', '+91-98400-10002',
    NULL, 'TN-NGO-2019-00481',
    'verified', 120, TRUE
  ),
  (
    '11111111-1111-4111-8111-111111111103',
    'Community Kitchen B — Velachery (Demo)',
    'COMMUNITY_KITCHEN',
    '75 100-Feet Bypass Rd, Velachery, Chennai 600042',
    12.9815, 80.2180,
    'Aravind Natarajan', '+91-98400-10003',
    'FSSAI-TN-22426008004411', 'TN-CK-2021-00912',
    'verified', 90, TRUE
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.donation_batches (
  id, batch_code, qr_token, donor_id, food_item, food_category, dietary_type,
  portions_available, portions_allocated, prep_time, pickup_deadline, consume_by_time,
  temp_celsius, packaging_details, safety_gate_passed, status,
  pickup_address, pickup_lat, pickup_lng, is_demo
)
VALUES (
  '22222222-2222-4222-8222-222222222201',
  'HL-DEMO-2026-001',
  'demo_opaque_token_7f9a2c4b8e1d6f3a0c5e9b2d4f8a1c3e',
  '11111111-1111-4111-8111-111111111101',
  'Sambar Sadam, Curd Rice & Vegetable Poriyal',
  'COOKED_MEALS',
  'VEGETARIAN',
  100,
  0,
  timezone('utc', now()) - INTERVAL '30 minutes',
  timezone('utc', now()) + INTERVAL '2 hours',
  timezone('utc', now()) + INTERVAL '4 hours',
  64.5,
  '4x Food-grade stainless insulated cambro containers, tamper-sealed',
  TRUE,
  'INSPECTION_PASSED',
  '42 Anna Salai, Guindy, Chennai 600032',
  13.0102, 80.2155,
  TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.meal_requests (
  id, org_id, portions_needed, dietary_pref, urgency_score,
  wait_started_at, intake_channel, required_by, status, notes, is_demo
)
VALUES
  (
    '33333333-3333-4333-8333-333333333301',
    '11111111-1111-4111-8111-111111111102',
    60,
    'VEGETARIAN',
    0.880,
    timezone('utc', now()) - INTERVAL '90 minutes',
    'WEB_PORTAL',
    timezone('utc', now()) + INTERVAL '3 hours',
    'OPEN',
    'Evening hot meal service for 60 residents at Shelter A.',
    TRUE
  ),
  (
    '33333333-3333-4333-8333-333333333302',
    '11111111-1111-4111-8111-111111111103',
    30,
    'VEGETARIAN',
    0.720,
    timezone('utc', now()) - INTERVAL '45 minutes',
    'FIELD_ASSISTED_PHONE',
    timezone('utc', now()) + INTERVAL '3 hours 30 minutes',
    'OPEN',
    'Community Kitchen B dinner counter for daily-wage workers.',
    TRUE
  )
ON CONFLICT (id) DO NOTHING;
