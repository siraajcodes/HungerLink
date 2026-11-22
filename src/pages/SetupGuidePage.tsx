import React from 'react';
import { CheckCircle2, Database, ShieldCheck, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { tx } from '../i18n/helpers';
import { supabaseConfigStatus } from '../lib/supabase';

export const SetupGuidePage: React.FC = () => {
  const { language, isDemoMode, enterDemoMode, exitDemoMode } = useApp();

  const checks = [
    {
      name: 'VITE_SUPABASE_URL',
      ok: supabaseConfigStatus.urlPresent,
      detail: tx(
        language,
        'Shared Supabase project URL (Web + Native Android)',
        'பகிரப்பட்ட Supabase திட்ட URL (இணையம் + Android)'
      ),
    },
    {
      name: 'VITE_SUPABASE_ANON_KEY',
      ok: supabaseConfigStatus.anonKeyPresent,
      detail: tx(
        language,
        'Public anon or sb_publishable key (never service_role)',
        'பொது anon அல்லது sb_publishable திறவுகோல் (service_role பயன்படுத்த வேண்டாம்)'
      ),
    },
    {
      name: 'VITE_OSRM_BASE_URL (Optional)',
      ok: supabaseConfigStatus.osrmConfigured,
      detail: supabaseConfigStatus.osrmConfigured
        ? tx(
            language,
            `Connected: ${supabaseConfigStatus.osrmBaseUrl}`,
            `இணைக்கப்பட்டது: ${supabaseConfigStatus.osrmBaseUrl}`
          )
        : tx(
            language,
            'Not set — RescueRoute gracefully falls back to geodesic road estimation',
            'அமைக்கப்படவில்லை — RescueRoute புவியியல் சாலை மதிப்பீட்டைத் தானாகப் பயன்படுத்தும்'
          ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold font-display text-[#123B35]">
          {tx(
            language,
            'Shared Supabase Backend & Deployment Diagnostics',
            'பகிரப்பட்ட Supabase பின்தளம் & நிறுவல் பரிசோதனை'
          )}
        </h2>
        <p className="mt-1 text-sm text-[#64748B]">
          {tx(
            language,
            'HUNGERLINK 2.0 Web and the separate Native Android client connect to the exact same Supabase PostgreSQL, Auth, RLS, Realtime, Storage, and Edge Function backend.',
            'ஹங்கர்லிங்க் 2.0 இணையதளமும் தனி Android செயலியும் ஒரே Supabase PostgreSQL, Auth, RLS, Realtime, Storage மற்றும் Edge Function பின்தளத்துடன் இணைகின்றன.'
          )}
        </p>
      </div>

      {/* Live Environment Variable Check */}
      <section className="rounded-2xl bg-white border border-[#123B35]/10 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold font-display text-[#123B35] flex items-center gap-2">
            <Database className="w-4 h-4" />
            {tx(language, 'Environment Configuration Status', 'சூழல் அமைப்பு நிலை')}
          </h3>
          <button
            type="button"
            onClick={() => (isDemoMode ? exitDemoMode() : enterDemoMode('ADMINISTRATOR'))}
            className="px-3.5 py-1.5 rounded-lg bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723]"
          >
            {isDemoMode
              ? tx(language, 'Exit Demo Mode', 'மாதிரிப் பயன்முறையிலிருந்து வெளியேறு')
              : tx(language, 'Switch to Isolated Demo Mode', 'தனிமைப்படுத்தப்பட்ட மாதிரிப் பயன்முறைக்கு மாறு')}
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
                {chk.ok
                  ? tx(language, 'Configured', 'அமைக்கப்பட்டது')
                  : tx(language, 'Missing', 'இல்லை')}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Migration & Edge Function Checklist */}
      <section className="rounded-2xl bg-white border border-[#123B35]/10 p-6 space-y-4">
        <h3 className="text-base font-bold font-display text-[#123B35] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          {tx(
            language,
            'Supabase Migration & Edge Function Deployment',
            'Supabase தரவுத்தள மாற்றம் & Edge Function நிறுவல்'
          )}
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
