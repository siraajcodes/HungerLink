import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  KeyRound,
  Lock,
  Mail,
  Play,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { UserRole } from '../types/database';

type AuthMode = 'signin' | 'register' | 'reset';

const REGISTRABLE_ROLES: Array<Exclude<UserRole, 'ADMINISTRATOR'>> = [
  'FOOD_DONOR',
  'VERIFIED_NGO',
  'COMMUNITY_KITCHEN',
  'DELIVERY_PARTNER',
  'FIELD_WORKER',
];

export const AuthPage: React.FC = () => {
  const {
    isSupabaseConfigured,
    missingEnvVars,
    signIn,
    signUp,
    requestPasswordReset,
    enterDemoMode,
    language,
    setLanguage,
    t,
  } = useApp();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Exclude<UserRole, 'ADMINISTRATOR'>>('FOOD_DONOR');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setSubmitting(true);

    try {
      if (mode === 'signin') {
        const res = await signIn(email.trim(), password);
        if (res.error) setErrorMsg(res.error);
      } else if (mode === 'register') {
        if (password.length < 8) {
          setErrorMsg('Password must be at least 8 characters long.');
          return;
        }
        const res = await signUp({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          phone: phone.trim(),
          role,
          language,
        });
        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.requiresEmailVerification) {
          setInfoMsg(
            'Account created. Please check your inbox and verify your email address before signing in.'
          );
          setMode('signin');
        }
      } else {
        const res = await requestPasswordReset(email.trim());
        if (res.error) setErrorMsg(res.error);
        else setInfoMsg('Password recovery instructions sent to your email address.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9EF] text-[#123B35] flex flex-col">
      {/* Clean 3-Zone Top Bar */}
      <header className="border-b border-[#123B35]/10 bg-[#FFF9EF] px-6 lg:px-12 h-16 flex items-center justify-between gap-8">
        <span className="text-lg font-extrabold font-display tracking-tight text-[#123B35] whitespace-nowrap shrink-0">
          HUNGERLINK
        </span>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#64748B]">
          <Link to="/track/hl_demo_opaque_7f9a2c4b8e1d6f3a0c5e9b2d4f8a1c3e" className="hover:text-[#123B35] whitespace-nowrap">
            MealTrace Lookup
          </Link>
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
            className="hover:text-[#123B35] whitespace-nowrap"
          >
            {language === 'en' ? 'தமிழ்' : 'English'}
          </button>
        </nav>

        <button
          type="button"
          onClick={() => enterDemoMode('ADMINISTRATOR')}
          className="px-4 py-2 rounded-lg bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723] transition-colors whitespace-nowrap shrink-0"
        >
          {t.auth.enterDemoMode}
        </button>
      </header>

      {/* Main Split Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 max-w-[1440px] w-full mx-auto">
        {/* Left Editorial / Mission Column */}
        <section className="lg:col-span-6 p-8 sm:p-12 lg:p-16 flex flex-col justify-between bg-[#123B35] text-white">
          <div>
            <p className="text-xs font-medium tracking-wide text-[#D7F36B]">
              Surplus Food Rescue &amp; Traceability Network
            </p>
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-[42px] font-extrabold font-display leading-[1.12] text-white max-w-xl">
              {t.tagline}
            </h1>
            <p className="mt-5 text-sm sm:text-base text-white/80 leading-relaxed max-w-xl">
              HUNGERLINK 2.0 coordinates verified food donors, FSSAI-aligned physical safety
              inspections, deterministic split-batch matching, RescueRoute logistics, and
              append-only MealTrace QR handovers on one shared Supabase backend for Web and Android.
            </p>

            {/* Clear Non-Negotiable Architecture Status */}
            <div className="mt-10 pt-8 border-t border-white/15 space-y-5">
              <div className="flex items-start gap-3.5">
                <Database className="w-5 h-5 text-[#D7F36B] shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-sm font-semibold text-white">Shared Supabase System of Record</h2>
                  <p className="mt-1 text-xs text-white/75 leading-relaxed">
                    PostgreSQL Row Level Security, transactional split-allocation RPCs, Supabase
                    Realtime updates, and private storage shared seamlessly with the native Android client.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <ShieldCheck className="w-5 h-5 text-[#D7F36B] shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-sm font-semibold text-white">Fail-Closed Food Safety &amp; RBAC</h2>
                  <p className="mt-1 text-xs text-white/75 leading-relaxed">
                    Only verified organisations participate in allocations. Uninspected or
                    temperature-missing batches fail closed. Administrator privileges can never be self-assigned.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Isolated Demo Launch Card */}
          <div className="mt-10 rounded-2xl bg-[#0B2723] border border-white/15 p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold font-display text-[#D7F36B]">
                Isolated Demonstration Environment
              </h2>
              <span className="text-xs font-mono text-white/70">is_demo = true</span>
            </div>
            <p className="mt-2 text-xs text-white/80 leading-relaxed">
              Experience the complete workflow immediately with the isolated judging scenario:
              Wedding Hall A (100 vegetarian portions) split across Shelter A (60 portions) and
              Community Kitchen B (30 portions), leaving 10 unallocated. Strictly separated from live operational analytics.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => enterDemoMode('ADMINISTRATOR')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D7F36B] text-[#123B35] text-xs font-bold hover:bg-[#C8E655] transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                Open Demo as Coordinator
              </button>
              <button
                type="button"
                onClick={() => enterDemoMode('FOOD_DONOR')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-white/25 text-white text-xs font-semibold hover:bg-white/10 transition-colors"
              >
                Donor View
              </button>
              <button
                type="button"
                onClick={() => enterDemoMode('DELIVERY_PARTNER')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-white/25 text-white text-xs font-semibold hover:bg-white/10 transition-colors"
              >
                Delivery View
              </button>
            </div>
          </div>
        </section>

        {/* Right Live Supabase Auth Column */}
        <section className="lg:col-span-6 p-6 sm:p-12 lg:p-16 flex items-center justify-center">
          <div className="w-full max-w-md space-y-6">
            {/* Explicit Missing Supabase Credentials Diagnostic (Never silently faked) */}
            {!isSupabaseConfigured && (
              <div
                role="alert"
                className="rounded-2xl border border-[#FF795C] bg-white p-5 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#FF795C] shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-sm font-bold text-[#123B35]">
                      Supabase Credentials Required for Live Mode
                    </h2>
                    <p className="mt-1 text-xs text-[#64748B] leading-relaxed">
                      HungerLink never replaces Supabase with a fake backend. Configure these
                      environment variables to connect to your shared Web + Android Supabase project:
                    </p>
                  </div>
                </div>
                <div className="rounded-xl bg-[#FFF9EF] border border-[#123B35]/10 p-3 font-mono text-xs text-[#123B35] space-y-1">
                  {missingEnvVars.map((envVar) => (
                    <div key={envVar}>Missing: {envVar}</div>
                  ))}
                </div>
                <p className="text-xs text-[#64748B]">
                  Add them to <span className="font-mono">.env</span> or Vercel environment variables,
                  apply migrations in <span className="font-mono">supabase/migrations/</span>, or launch
                  the explicitly isolated Demo Mode to test the workflow now.
                </p>
              </div>
            )}

            {/* Auth Card */}
            <div className="rounded-2xl bg-white border border-[#123B35]/12 p-6 sm:p-8">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-[#FFF9EF] border border-[#123B35]/10 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                    mode === 'signin'
                      ? 'bg-[#123B35] text-white'
                      : 'text-[#64748B] hover:text-[#123B35]'
                  }`}
                >
                  {t.auth.signIn}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                    mode === 'register'
                      ? 'bg-[#123B35] text-white'
                      : 'text-[#64748B] hover:text-[#123B35]'
                  }`}
                >
                  {t.auth.register}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('reset');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                    mode === 'reset'
                      ? 'bg-[#123B35] text-white'
                      : 'text-[#64748B] hover:text-[#123B35]'
                  }`}
                >
                  Recovery
                </button>
              </div>

              <h2 className="text-xl font-bold font-display text-[#123B35]">
                {mode === 'signin'
                  ? t.auth.signIn
                  : mode === 'register'
                  ? t.auth.register
                  : t.auth.resetPassword}
              </h2>
              <p className="mt-1 text-xs text-[#64748B]">
                {mode === 'signin'
                  ? 'Authenticate with your Supabase HungerLink account.'
                  : mode === 'register'
                  ? 'Self-registration is restricted to operational roles; administrators are provisioned securely in the database.'
                  : 'We will send a secure Supabase password recovery link to your email.'}
              </p>

              {errorMsg && (
                <div className="mt-4 rounded-xl border border-[#FF795C] bg-[#FF795C]/10 px-3.5 py-2.5 text-xs text-[#123B35] font-medium">
                  {errorMsg}
                </div>
              )}

              {infoMsg && (
                <div className="mt-4 rounded-xl border border-[#123B35]/20 bg-[#D7F36B]/30 px-3.5 py-2.5 text-xs text-[#123B35] font-medium flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{infoMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {mode === 'register' && (
                  <>
                    <div>
                      <label htmlFor="auth-fullname" className="block text-xs font-semibold text-[#123B35] mb-1">
                        {t.auth.fullName}
                      </label>
                      <input
                        id="auth-fullname"
                        type="text"
                        required
                        minLength={2}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Anitha Krishnan"
                        className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3.5 py-2.5 text-sm text-[#123B35] focus:outline-none focus:border-[#123B35]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="auth-phone" className="block text-xs font-semibold text-[#123B35] mb-1">
                          {t.auth.phone}
                        </label>
                        <input
                          id="auth-phone"
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91-98400-00000"
                          className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3.5 py-2.5 text-sm text-[#123B35] focus:outline-none focus:border-[#123B35]"
                        />
                      </div>

                      <div>
                        <label htmlFor="auth-role" className="block text-xs font-semibold text-[#123B35] mb-1">
                          {t.auth.role}
                        </label>
                        <select
                          id="auth-role"
                          value={role}
                          onChange={(e) => setRole(e.target.value as Exclude<UserRole, 'ADMINISTRATOR'>)}
                          className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2.5 text-sm text-[#123B35] focus:outline-none focus:border-[#123B35]"
                        >
                          {REGISTRABLE_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {t.roles[r]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="auth-email" className="block text-xs font-semibold text-[#123B35] mb-1">
                    {t.auth.email}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@organisation.org"
                      className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 pl-10 pr-3.5 py-2.5 text-sm text-[#123B35] focus:outline-none focus:border-[#123B35]"
                    />
                  </div>
                </div>

                {mode !== 'reset' && (
                  <div>
                    <label htmlFor="auth-password" className="block text-xs font-semibold text-[#123B35] mb-1">
                      {t.auth.password}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="auth-password"
                        type="password"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 pl-10 pr-3.5 py-2.5 text-sm text-[#123B35] focus:outline-none focus:border-[#123B35]"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !isSupabaseConfigured}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#123B35] text-white text-sm font-semibold hover:bg-[#0B2723] transition-colors disabled:opacity-40"
                >
                  {mode === 'register' ? (
                    <UserPlus className="w-4 h-4" />
                  ) : mode === 'reset' ? (
                    <KeyRound className="w-4 h-4" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  <span>
                    {submitting
                      ? 'Connecting to Supabase...'
                      : mode === 'signin'
                      ? t.auth.signIn
                      : mode === 'register'
                      ? t.auth.register
                      : t.auth.sendResetLink}
                  </span>
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
