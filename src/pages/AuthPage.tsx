import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ChevronDown, Lock, Mail, Play } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { tx } from '../i18n/helpers';
import { LANGUAGE_OPTIONS } from '../i18n/translations';
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
  const [showSetupDetails, setShowSetupDetails] = useState(false);

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
          setErrorMsg(
            tx(
              language,
              'Password must be at least 8 characters long.',
              'கடவுச்சொல் குறைந்தது 8 எழுத்துகள் நீளம் இருக்க வேண்டும்.'
            )
          );
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
            tx(
              language,
              'Account created. Check your email to confirm your address before signing in.',
              'கணக்கு உருவாக்கப்பட்டது. உள்நுழைவதற்கு முன் உங்கள் மின்னஞ்சலைச் சரிபார்க்கவும்.'
            )
          );
          setMode('signin');
        }
      } else {
        const res = await requestPasswordReset(email.trim());
        if (res.error) setErrorMsg(res.error);
        else {
          setInfoMsg(
            tx(
              language,
              'Password reset link sent to your email.',
              'கடவுச்சொல் மீட்டமைப்பு இணைப்பு உங்கள் மின்னஞ்சலுக்கு அனுப்பப்பட்டது.'
            )
          );
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9EF] text-[#123B35] flex flex-col">
      {/* Clean 3-Zone Header */}
      <header className="border-b border-[#123B35]/10 px-6 lg:px-12 h-16 flex items-center justify-between gap-6">
        <span className="text-lg font-extrabold font-display tracking-tight text-[#123B35] whitespace-nowrap shrink-0">
          {t.brand}
        </span>

        <nav className="flex items-center gap-4 sm:gap-6 text-sm font-medium text-[#64748B]">
          <Link
            to="/track/hl_demo_opaque_7f9a2c4b8e1d6f3a0c5e9b2d4f8a1c3e"
            className="hidden sm:inline hover:text-[#123B35] whitespace-nowrap"
          >
            {tx(language, 'Track a Meal', 'உணவைக் கண்காணி')}
          </Link>
          <div className="inline-flex rounded-lg bg-white p-0.5 border border-[#123B35]/15">
            {LANGUAGE_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                type="button"
                onClick={() => setLanguage(opt.code)}
                className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                  language === opt.code
                    ? 'bg-[#123B35] text-white'
                    : 'text-[#64748B] hover:text-[#123B35]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </nav>

        <button
          type="button"
          onClick={() => enterDemoMode('ADMINISTRATOR')}
          className="min-h-[40px] px-4 py-2 rounded-xl bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723] transition-colors whitespace-nowrap shrink-0"
        >
          {tx(language, 'Try Demo', 'மாதிரியைப் பார்')}
        </button>
      </header>

      {/* Calm, Minimal 2-Column Layout */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left: Simple Human Explanation */}
        <section className="lg:col-span-6 space-y-6">
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display leading-[1.15] text-[#123B35]">
            {tx(
              language,
              'Share extra food with people who need it today.',
              'மீதமுள்ள உணவை இன்று தேவையுள்ளவர்களுடன் பகிர்ந்து கொள்ளுங்கள்.'
            )}
          </h1>
          <p className="text-base text-[#64748B] leading-relaxed max-w-lg">
            {tx(
              language,
              'HungerLink connects food donors, local shelters, and delivery volunteers—and helps every community receive the nutrients they are missing.',
              'ஹங்கர்லிங்க் உணவு தானதாரர்கள், உள்ளூர் காப்பகங்கள் மற்றும் விநியோகத் தன்னார்வலர்களை இணைத்து, ஒவ்வொரு சமூகத்திற்கும் தேவையான ஊட்டச்சத்து உணவு சேர உதவுகிறது.'
            )}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => enterDemoMode('ADMINISTRATOR')}
              className="min-h-[46px] inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#D7F36B] text-[#123B35] text-sm font-bold hover:bg-[#C8E655] transition-colors"
            >
              <Play className="w-4 h-4" />
              {tx(language, 'Try Interactive Demo', 'ஊடாடும் மாதிரியை முயற்சிக்கவும்')}
            </button>
            <button
              type="button"
              onClick={() => enterDemoMode('FOOD_DONOR')}
              className="min-h-[46px] px-4 py-3 rounded-xl border border-[#123B35]/20 text-sm font-semibold text-[#123B35] hover:bg-white transition-colors"
            >
              {tx(language, 'Try as Donor', 'தானதாரராக முயற்சி')}
            </button>
          </div>

          <div className="pt-6 border-t border-[#123B35]/10 grid grid-cols-3 gap-4 text-xs text-[#64748B]">
            <div>
              <div className="font-bold text-[#123B35]">{tx(language, '1. Share', '1. பகிர்க')}</div>
              <p className="mt-1">
                {tx(language, 'Post safe surplus meals in minutes.', 'பாதுகாப்பான உபரி உணவைச் சில நிமிடங்களில் பதிவிடுங்கள்.')}
              </p>
            </div>
            <div>
              <div className="font-bold text-[#123B35]">
                {tx(language, '2. Auto-Dispatch', '2. தானியங்கி அனுப்புதல்', '2. ऑटो-डिस्पैच', '2. ఆటో-డిస్పాచ్')}
              </div>
              <p className="mt-1">
                {tx(
                  language,
                  'Safety check, shelter matching, and driver dispatch run automatically.',
                  'பாதுகாப்பு சோதனை, காப்பகப் பொருத்தம் மற்றும் ஓட்டுநர் ஒதுக்கீடு தானாகவே நடக்கும்.',
                  'सुरक्षा जाँच, आश्रय मिलान और ड्राइवर असाइनमेंट अपने आप होते हैं।',
                  'భద్రతా తనిఖీ, ఆశ్రయ సరిపోలిక మరియు డ్రైవర్ కేటాయింపు స్వయంచాలకంగా జరుగుతాయి.'
                )}
              </p>
            </div>
            <div>
              <div className="font-bold text-[#123B35]">{tx(language, '3. Deliver', '3. வழங்குக')}</div>
              <p className="mt-1">
                {tx(language, 'Confirm handover with a quick QR scan.', 'விரைவான QR ஸ்கேன் மூலம் ஒப்படைப்பை உறுதிப்படுத்துங்கள்.')}
              </p>
            </div>
          </div>
        </section>

        {/* Right: Simple Sign-In Card */}
        <section className="lg:col-span-6 w-full max-w-md mx-auto space-y-4">
          <div className="rounded-2xl bg-white border border-[#123B35]/12 p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#FFF9EF] border border-[#123B35]/10">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                }}
                className={`flex-1 min-h-[38px] text-xs font-semibold rounded-lg transition-colors ${
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
                className={`flex-1 min-h-[38px] text-xs font-semibold rounded-lg transition-colors ${
                  mode === 'register'
                    ? 'bg-[#123B35] text-white'
                    : 'text-[#64748B] hover:text-[#123B35]'
                }`}
              >
                {t.auth.register}
              </button>
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-[#FF795C] bg-[#FF795C]/10 px-3.5 py-2.5 text-xs text-[#123B35] font-medium">
                {errorMsg}
              </div>
            )}

            {infoMsg && (
              <div className="rounded-xl border border-[#123B35]/20 bg-[#D7F36B]/30 px-3.5 py-2.5 text-xs text-[#123B35] font-medium flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{infoMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                      placeholder={tx(language, 'Your full name', 'உங்கள் முழுப் பெயர்')}
                      className="w-full min-h-[44px] rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3.5 py-2.5 text-sm"
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
                        className="w-full min-h-[44px] rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3.5 py-2.5 text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="auth-role" className="block text-xs font-semibold text-[#123B35] mb-1">
                        {tx(language, 'I am joining as', 'எனது பொறுப்பு')}
                      </label>
                      <select
                        id="auth-role"
                        value={role}
                        onChange={(e) => setRole(e.target.value as Exclude<UserRole, 'ADMINISTRATOR'>)}
                        className="w-full min-h-[44px] rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2.5 text-sm"
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
                    placeholder="you@example.com"
                    className="w-full min-h-[44px] rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 pl-10 pr-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              {mode !== 'reset' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="auth-password" className="block text-xs font-semibold text-[#123B35]">
                      {t.auth.password}
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => setMode('reset')}
                        className="text-xs text-[#64748B] hover:text-[#123B35]"
                      >
                        {tx(language, 'Forgot?', 'மறந்துவிட்டதா?')}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-password"
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={tx(language, 'At least 8 characters', 'குறைந்தது 8 எழுத்துகள்')}
                      className="w-full min-h-[44px] rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 pl-10 pr-3.5 py-2.5 text-sm"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !isSupabaseConfigured}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#123B35] text-white text-sm font-semibold hover:bg-[#0B2723] transition-colors disabled:opacity-40"
              >
                <span>
                  {submitting
                    ? tx(language, 'Please wait...', 'காத்திருக்கவும்...')
                    : mode === 'register'
                    ? t.auth.register
                    : mode === 'reset'
                    ? t.auth.sendResetLink
                    : t.auth.signIn}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {mode === 'reset' && (
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="w-full text-center text-xs text-[#64748B] hover:text-[#123B35]"
                >
                  {tx(language, 'Back to Sign In', 'உள்நுழைவுக்குத் திரும்பு')}
                </button>
              )}
            </form>

            {/* Quiet, Expandable Live-Backend Notice */}
            {!isSupabaseConfigured && (
              <div className="pt-3 border-t border-[#123B35]/10">
                <button
                  type="button"
                  onClick={() => setShowSetupDetails((v) => !v)}
                  className="w-full flex items-center justify-between text-xs text-[#64748B] hover:text-[#123B35]"
                >
                  <span>
                    {tx(
                      language,
                      'Live login needs Supabase setup · Use Demo Mode above',
                      'நேரடி உள்நுழைவுக்கு தரவுத்தள அமைப்பு தேவை · மேலே உள்ள மாதிரியைப் பயன்படுத்துங்கள்'
                    )}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform ${showSetupDetails ? 'rotate-180' : ''}`}
                  />
                </button>
                {showSetupDetails && (
                  <div className="mt-2.5 rounded-xl bg-[#FFF9EF] border border-[#123B35]/10 p-3 font-mono text-[11px] text-[#123B35] space-y-1">
                    {missingEnvVars.map((envVar) => (
                      <div key={envVar}>
                        {tx(language, 'Missing:', 'இல்லை:')} {envVar}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
