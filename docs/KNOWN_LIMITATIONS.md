# HUNGERLINK 2.0 — Known Limitations & Operational Prerequisites

1. **Missing Supabase Environment Variables in Fresh Workspace**:
   - Live Supabase authentication, Realtime subscriptions, Storage uploads, and PostgreSQL RPC calls require `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to be configured for your existing shared Supabase project. Until configured, live auth stays transparently disabled and judges can test the full workflow via the explicitly isolated Demonstration Mode.

2. **Managed OSRM Routing Endpoint**:
   - HUNGERLINK intentionally does not hardcode a public demo OSRM server as a production SLA. When `VITE_OSRM_BASE_URL` is unset or unreachable, RescueRoute falls back gracefully to road-adjusted geodesic estimation (1.28x Haversine distance) and surfaces an explicit provider notice.

3. **Edge Function Rate Limiting Scope**:
   - The included `mealtrace-verify` Edge Function uses per-isolate sliding-window rate limiting. For high-volume multi-region production traffic, front the endpoint with Cloudflare / Upstash Redis or Supabase API gateway rate limiting.

4. **Physical Food Safety Governance**:
   - Digital safety checks and MealTrace QR logs provide chain-of-custody accountability aligned with FSSAI surplus food record fields. They never substitute for qualified physical inspection on site and do not grant regulatory certification.

5. **Offline Queue Storage Scope**:
   - The Field Worker offline queue uses browser `localStorage` strictly for pending non-PII assisted request drafts with UUID idempotency keys. Clearing browser site data before syncing will remove unsynced local drafts.

6. **NutriLoop Estimation vs. Individual Consumption**:
   - NutriLoop estimates community-level nutritional availability using ICMR-NIN IFCT 2017 / FAO-INFOODS food composition tables and demographic-adjusted ICMR-NIN RDA 2020 requirements. Community food inventory availability does **not** prove individual dietary intake or clinical nutrition outcomes. Unmapped food items are transparently excluded rather than fabricated.

