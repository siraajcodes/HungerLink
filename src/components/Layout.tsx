import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  Building2,
  ClipboardCheck,
  Database,
  GitMerge,
  HandHeart,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  PackagePlus,
  QrCode,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { UserRole } from '../types/database';

const ALL_ROLES: UserRole[] = [
  'ADMINISTRATOR',
  'FOOD_DONOR',
  'VERIFIED_NGO',
  'COMMUNITY_KITCHEN',
  'DELIVERY_PARTNER',
  'FIELD_WORKER',
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    profile,
    activeOrganisation,
    isDemoMode,
    isSupabaseConfigured,
    exitDemoMode,
    resetDemoScenario,
    switchDemoRole,
    signOut,
    language,
    setLanguage,
    t,
    notifications,
    refreshAllData,
    dataLoading,
    toasts,
    dismissToast,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const role = profile?.role ?? 'FOOD_DONOR';

  const navItems = [
    { to: '/', label: t.nav.dashboard, icon: LayoutDashboard, roles: ALL_ROLES },
    {
      to: '/donations',
      label: t.nav.donations,
      icon: PackagePlus,
      roles: ['FOOD_DONOR', 'ADMINISTRATOR'] as UserRole[],
    },
    {
      to: '/requests',
      label: t.nav.requests,
      icon: HandHeart,
      roles: ['VERIFIED_NGO', 'COMMUNITY_KITCHEN', 'ADMINISTRATOR', 'FIELD_WORKER'] as UserRole[],
    },
    {
      to: '/safety',
      label: t.nav.safety,
      icon: ClipboardCheck,
      roles: ['ADMINISTRATOR', 'FOOD_DONOR', 'VERIFIED_NGO', 'COMMUNITY_KITCHEN'] as UserRole[],
    },
    {
      to: '/matching',
      label: t.nav.matching,
      icon: GitMerge,
      roles: ['ADMINISTRATOR', 'FOOD_DONOR', 'VERIFIED_NGO', 'COMMUNITY_KITCHEN'] as UserRole[],
    },
    {
      to: '/routes',
      label: t.nav.routes,
      icon: Map,
      roles: ['DELIVERY_PARTNER', 'ADMINISTRATOR', 'VERIFIED_NGO', 'COMMUNITY_KITCHEN', 'FOOD_DONOR'] as UserRole[],
    },
    { to: '/mealtrace', label: t.nav.mealtrace, icon: QrCode, roles: ALL_ROLES },
    {
      to: '/field-intake',
      label: t.nav.fieldIntake,
      icon: Smartphone,
      roles: ['FIELD_WORKER', 'ADMINISTRATOR'] as UserRole[],
    },
    { to: '/impact', label: t.nav.impact, icon: BarChart3, roles: ALL_ROLES },
    {
      to: '/admin',
      label: t.nav.admin,
      icon: ShieldCheck,
      roles: ['ADMINISTRATOR'] as UserRole[],
    },
    { to: '/onboarding', label: t.nav.onboarding, icon: Building2, roles: ALL_ROLES },
    { to: '/notifications', label: t.nav.notifications, icon: Bell, roles: ALL_ROLES, badge: unreadCount },
    { to: '/setup', label: t.nav.setup, icon: Database, roles: ALL_ROLES },
  ].filter((item) => item.roles.includes(role));

  const currentNav = navItems.find((item) => item.to === location.pathname) ?? navItems[0];

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-[#123B35] text-white">
      <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
        <Link to="/" className="text-lg font-extrabold font-display tracking-tight text-white whitespace-nowrap">
          HUNGERLINK
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation"
          className="lg:hidden p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role & Active Organisation Summary */}
      {profile && (
        <div className="px-5 py-4 border-b border-white/10">
          <div className="text-sm font-semibold text-white truncate">{profile.full_name}</div>
          <div className="mt-0.5 text-xs text-[#D7F36B] font-medium truncate">
            {t.roles[profile.role]}
          </div>
          {activeOrganisation && (
            <div className="mt-1 text-xs text-white/70 truncate">
              {activeOrganisation.name} · {activeOrganisation.verification_status}
            </div>
          )}

          {/* Demo-only persona switcher to let judges walk through every role end-to-end */}
          {isDemoMode && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <label htmlFor="demo-role-switcher" className="block text-[11px] font-medium text-white/70 mb-1">
                Demo Persona Switcher
              </label>
              <select
                id="demo-role-switcher"
                value={profile.role}
                onChange={(e) => switchDemoRole(e.target.value as UserRole)}
                className="w-full rounded-lg bg-[#0B2723] border border-white/20 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#D7F36B]"
              >
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {t.roles[r]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Primary Navigation */}
      <nav aria-label="Primary workspace navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#D7F36B] text-[#123B35] font-semibold'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </span>
              {item.badge ? (
                <span className="text-xs font-mono tabular-nums font-semibold opacity-90">
                  {item.badge}
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Utilities: Language + Sign Out */}
      <div className="p-4 border-t border-white/10 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-white/70">{t.common.languageLabel}</span>
          <div className="inline-flex rounded-lg bg-[#0B2723] p-0.5 border border-white/15">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                language === 'en' ? 'bg-[#D7F36B] text-[#123B35]' : 'text-white/75 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('ta')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                language === 'ta' ? 'bg-[#D7F36B] text-[#123B35]' : 'text-white/75 hover:text-white'
              }`}
            >
              தமிழ்
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => (isDemoMode ? exitDemoMode() : void signOut())}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-white/20 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{isDemoMode ? t.auth.exitDemoMode : t.auth.signOut}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFF9EF] text-[#123B35] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-72 max-w-[85vw] h-full shadow-2xl">{renderSidebarContent()}</div>
          <div
            className="flex-1 bg-[#0B2723]/50"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Isolated Demo Environment Banner (Strictly separated from live operational data) */}
        {isDemoMode && (
          <div className="bg-[#D7F36B] text-[#123B35] px-4 lg:px-8 py-2.5 border-b border-[#123B35]/15 flex flex-wrap items-center justify-between gap-3 text-xs font-medium">
            <span className="leading-snug">{t.common.demoBanner}</span>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={resetDemoScenario}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#123B35] text-white hover:bg-[#0B2723] transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Demo
              </button>
              <button
                type="button"
                onClick={exitDemoMode}
                className="underline font-semibold hover:opacity-80 whitespace-nowrap"
              >
                {t.auth.exitDemoMode}
              </button>
            </div>
          </div>
        )}

        {/* Top Bar Contract: Contextual Breadcrumb Left, Primary Actions Right */}
        <header className="sticky top-0 z-30 bg-[#FFF9EF]/95 backdrop-blur-sm border-b border-[#123B35]/10 px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-lg border border-[#123B35]/15 text-[#123B35] hover:bg-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-[#64748B] hidden sm:inline whitespace-nowrap">HungerLink</span>
              <span className="text-[#64748B] hidden sm:inline" aria-hidden="true">/</span>
              <h1 className="font-display font-bold text-[#123B35] truncate">
                {currentNav?.label ?? t.nav.dashboard}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <span className="hidden md:inline text-xs text-[#64748B] whitespace-nowrap">
              {isDemoMode
                ? t.common.demoMode
                : isSupabaseConfigured
                ? t.common.liveMode
                : 'Supabase Unconfigured'}
            </span>
            {!isDemoMode && isSupabaseConfigured && (
              <button
                type="button"
                onClick={() => void refreshAllData()}
                disabled={dataLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#123B35]/20 bg-white text-xs font-semibold text-[#123B35] hover:bg-[#F7EFE0] transition-colors whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${dataLoading ? 'animate-spin' : ''}`} />
                {t.common.refresh}
              </button>
            )}
            <Link
              to="/mealtrace"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723] transition-colors whitespace-nowrap"
            >
              <QrCode className="w-3.5 h-3.5" />
              Scan QR
            </Link>
          </div>
        </header>

        {/* Main Workspace Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Accessible Toast Stack */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)]"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-xl border px-4 py-3 shadow-lg flex items-start justify-between gap-3 ${
              toast.tone === 'error'
                ? 'bg-white border-[#FF795C] text-[#123B35]'
                : toast.tone === 'success'
                ? 'bg-[#123B35] border-[#123B35] text-white'
                : 'bg-white border-[#123B35]/20 text-[#123B35]'
            }`}
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold">{toast.title}</div>
              {toast.description && (
                <div
                  className={`mt-0.5 text-xs leading-relaxed ${
                    toast.tone === 'success' ? 'text-white/80' : 'text-[#64748B]'
                  }`}
                >
                  {toast.description}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="opacity-70 hover:opacity-100 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
