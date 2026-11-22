import React from 'react';
import { CheckCircle2, Database, ShieldCheck, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabaseConfigStatus } from '../lib/supabase';

export const SetupGuidePage: React.FC = () => {
  const { isDemoMode, enterDemoMode, exitDemoMode } = useApp();

  const checks = [
    {
      name: 'VITE_SUPABASE_URL',
      ok: supabaseConfigStatus.urlPresent,
      detail: 'Shared Supabase project URL (Web + Native Android)',
    },
    {
      name: 'VITE_SUPABASE_ANON_KEY',
      ok: supabaseConfigStatus.anonKeyPresent,
      detail: 'Public anon or sb_publishable key (never service_role)',
    },
    {
      name: 'VITE_OSRM_BASE_URL (Optional)',
      ok: supabaseConfigStatus.osrmConfigured,
      detail: supabaseConfigStatus.osrmConfigured
        ? `Connected: ${supabaseConfigStatus.osrmBaseUrl}`
        : 'Not set — RescueRoute gracefully falls back to geodesic road estimation',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold font-display text-[#123B35]">
          Shared Supabase Backend &amp; Deployment Diagnostics
        </h2>
        <p className="mt-1 text-sm text-[#64748B]">
          HUNGERLINK 2.0 Web and the separate Native Android client connect to the exact same
          Supabase PostgreSQL, Auth, RLS, Realtime, Storage, and Edge Function backend.
        </p>
      </div>

      {/* Live Environment Variable Check */}
      <section className="rounded-2xl bg-white border border-[#123B35]/10 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold font-display text-[#123B35] flex items-center gap-2">
            <Database className="w-4 h-4" />
            Environment Configuration Status
          </h3>
          <button
            type="button"
            onClick={() => (isDemoMode ? exitDemoMode() : enterDemoMode('ADMINISTRATOR'))}
            className="px-3.5 py-1.5 rounded-lg bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723]"
          >
            {isDemoMode ? 'Exit Demo Mode' : 'Switch to Isolated Demo Mode'}
          </button>
        </div>

        <ul className="divide-y divide-[#123B35]/8">
          {checks.map((chk) => (
            <li key={chk.name} className="py-3 flex items-center justify-between gap-4 text-xs">
              <div>
                <div className="font-mono font-bold text-[#123B35]">{chk.name}</div>
                <div className="text-[#64748B]">{chk.detail}</div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 font-semibold shrink-0 ${
                  chk.ok ? 'text-[#16A34A]' : 'text-[#FF795C]'
                }`}
              >
                {chk.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {chk.ok ? 'Configured' : 'Missing'}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Migration & Edge Function Checklist */}
      <section className="rounded-2xl bg-white border border-[#123B35]/10 p-6 space-y-4">
        <h3 className="text-base font-bold font-display text-[#123B35] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          Supabase Migration &amp; Edge Function Deployment
        </h3>
        <pre className="rounded-xl bg-[#0B2723] text-[#FFF9EF] p-4 text-xs font-mono overflow-x-auto leading-relaxed">
{`# 1. Link to your existing shared HungerLink Supabase project
supabase link --project-ref <YOUR_EXISTING_PROJECT_REF>

# 2. Apply non-destructive core schema, RLS, security triggers, RPCs & views
supabase db push

# 3. Deploy Edge Functions (matching engine + opaque QR verification)
supabase functions deploy matching-engine
supabase functions deploy mealtrace-verify

# 4. Optional: Seed isolated demo records (is_demo = TRUE)
psql "$SUPABASE_DB_URL" -f supabase/seed/demo_seed.sql`}
        </pre>
      </section>
    </div>
  );
};
