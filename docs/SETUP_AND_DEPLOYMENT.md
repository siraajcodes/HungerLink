# HUNGERLINK 2.0 — Setup & Deployment Guide

## 1. Prerequisites
- Node.js 20+
- Existing shared Supabase project (shared with the HungerLink native Android app)
- Supabase CLI (`npm i -g supabase`)
- Vercel account for frontend hosting

## 2. Environment Variables
Copy `.env.example` to `.env` and populate your existing Supabase project credentials:

```env
VITE_SUPABASE_URL="https://<your-project-ref>.supabase.co"
VITE_SUPABASE_ANON_KEY="<your-public-anon-or-publishable-key>"
VITE_OSRM_BASE_URL="https://<your-managed-osrm-server>/route/v1/driving"
VITE_DELIVERY_SAFETY_BUFFER_MINUTES="45"
VITE_APP_PUBLIC_URL="https://hungerlink.yourdomain.org"
```

**Security rule**: Never place `SUPABASE_SERVICE_ROLE_KEY` in any `VITE_*` variable or commit `.env` to Git.

## 3. Applying Database Migrations & Edge Functions
```bash
supabase link --project-ref <YOUR_EXISTING_PROJECT_REF>
supabase db push
supabase functions deploy matching-engine
supabase functions deploy mealtrace-verify
```

`supabase db push` applies both the core HungerLink migrations (`20261121000001`–`20261121000003`) and the additive **NutriLoop** migration (`20261122000004_nutriloop_schema_and_rls.sql`), which creates the 6 RLS-protected NutriLoop tables, seeds the 6 core ICMR-NIN RDA 2020 nutrients, and installs the `approve_targeted_donation_request` RPC.

### Provisioning the Initial Administrator
Because self-registration strictly blocks `ADMINISTRATOR` assignment, promote your authorised administrator account in the Supabase SQL Editor:

```sql
UPDATE public.profiles
SET role = 'ADMINISTRATOR'
WHERE email = 'coordinator@yourdomain.org';
```

### Optional Isolated Demo Seed
```bash
psql "$SUPABASE_DB_URL" -f supabase/seed/demo_seed.sql
```

## 4. Local Development & Testing
```bash
npm install
npm run test
npm run lint
npm run build
npm run dev
```

## 5. Deploying Frontend to Vercel
1. Connect your repository to Vercel.
2. Set Framework Preset to **Vite** (`npm run build`, output directory `dist`).
3. Configure `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_OSRM_BASE_URL`, and `VITE_APP_PUBLIC_URL` in Vercel Project Settings -> Environment Variables.
4. `vercel.json` is included for SPA route rewrites (`/track/:token`, `/matching`, etc.) and security headers.
