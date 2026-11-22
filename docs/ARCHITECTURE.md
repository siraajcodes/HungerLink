# HUNGERLINK 2.0 — System Architecture

## 1. Cross-Platform Shared Supabase Backbone
HUNGERLINK 2.0 Web (React + TypeScript + Vite) and the separate native Android application share **one single Supabase project** as the sole system of record:

- **PostgreSQL Database**: 14 normalized operational tables with UUID primary keys, strict CHECK constraints, foreign keys, indexes, and non-destructive additive migrations (`supabase/migrations/`).
- **Supabase Auth**: Email/password registration, email verification, password reset, persistent sessions, and JWT refresh shared between Web and Android.
- **Row Level Security (RLS) & Database Triggers**: Enforces organisation scoping, role permissions, anti-privilege-escalation (users cannot promote themselves to `ADMINISTRATOR` or self-verify their organisation), and append-only immutability on `mealtrace_events` and `audit_logs`.
- **PostgreSQL Transactional RPCs**: Concurrency-safe `SELECT ... FOR UPDATE` row locking prevents double allocation, over-allocation, and duplicate acceptance across simultaneous Web and Android requests.
- **Supabase Realtime**: Broadcasts live updates on `donation_batches`, `meal_requests`, `allocations`, `delivery_routes`, `delivery_stops`, `mealtrace_events`, `notifications`, and `incidents`.
- **Supabase Storage**: Private `org-verification-docs` bucket stores FSSAI and NGO registration files with owner + administrator RLS policies.
- **Supabase Edge Functions**:
  - `matching-engine`: Deterministic surplus matching (`S = 0.35L + 0.30U + 0.20Q + 0.15T`) with fail-closed hard eligibility gates.
  - `mealtrace-verify`: Rate-limited opaque QR token lookup returning strictly sanitized non-PII traceability timelines.

## 2. Smart Surplus Matching Engine
Hard eligibility gates fail closed if:
1. Donor organisation is not `verified`.
2. Recipient organisation is not `verified`.
3. `safety_gate_passed` is false or `temp_celsius` is null/missing.
4. `pickup_deadline` or `consume_by_time` has elapsed.
5. Estimated delivery exceeds `consume_by_time - safety_buffer_minutes`.
6. Dietary classification conflicts.
7. Receiving organisation daily capacity or delivery vehicle capacity is insufficient.

Scoring formula: `S = 0.35L + 0.30U + 0.20Q + 0.15T`, storing factor scores, total score, explanation, algorithm version, and calculation timestamp in `allocations.match_explanation`.

## 3. RescueRoute & MealTrace QR
- **RescueRoute**: Leaflet + OpenStreetMap client integrated with configurable OSRM routing (`VITE_OSRM_BASE_URL`). Falls back gracefully to road-adjusted geodesic estimation (1.28x Haversine) when no OSRM endpoint is configured or reachable.
- **MealTrace**: Uses opaque random tokens (`qr_token`), never encoding private recipient details. Browser camera scanning runs locally using `navigator.mediaDevices.getUserMedia` + `jsQR`.

## 4. Isolated Demonstration Mode
Demo records are tagged with `is_demo = true`. Verified database views (`v_impact_ledger_summary`, `v_admin_dashboard_metrics`) and live client queries explicitly filter `is_demo = false` so demo scenarios never contaminate operational analytics.

## 5. NUTRILOOP — Nutritional Gap Detection & Correction Engine (UN SDG 2)
NutriLoop extends the existing HungerLink schema and matching pipeline via additive migration `20261122000004_nutriloop_schema_and_rls.sql`:

- **New Tables (all RLS-protected & Realtime-enabled)**:
  - `food_composition_reference` (validated per-100g edible values citing ICMR-NIN IFCT 2017 & FAO/INFOODS).
  - `nutrient_configurations` (6 core ICMR-NIN RDA 2020 nutrients + admin-configurable micronutrients).
  - `community_nutrition_profiles` (strictly aggregate demographic counts — zero personal beneficiary PII).
  - `community_food_inventory` (distinguishes `AVAILABLE`, `DISTRIBUTED`, and `REPORTED_CONSUMED` stages).
  - `targeted_donation_requests` (draft -> NGO review/approval via `approve_targeted_donation_request` RPC -> published to donors -> matched -> fulfilled).
  - `nutritional_impact_snapshots` (before vs. after redistribution adequacy and per-nutrient gap closure records).
- **Gap Equation**: `G(j) = max(0, R(j) - A(j))` where `R(j)` is scaled by age/physiological multipliers (children 1–9, adolescents 10–18, adults 19–59, pregnant/lactating, elderly 60+) over the community's planning horizon.
- **Nutrition-Aware Matching**: Fail-closed food safety and eligibility gates ALWAYS execute first. Only eligible, safety-passed batches receive the nutrition-aware composite score `S = 0.25L + 0.20U + 0.15Q + 0.15T + 0.25N` (falling back to the standard `0.35L + 0.30U + 0.20Q + 0.15T` formula when NutriLoop mode is off or no community profile exists).

