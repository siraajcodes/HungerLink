import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  ClipboardCheck,
  Database,
  GitMerge,
  HandHeart,
  Home,
  LogOut,
  Map,
  Menu,
  PackagePlus,
  QrCode,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sprout,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { tx } from '../i18n/helpers';
import { LANGUAGE_OPTIONS } from '../i18n/translations';
import { ROUTE_ROLES, type AppRouteKey } from '../lib/rbac';
import type { UserRole } from '../types/database';

const ALL_ROLES: UserRole[] = [
  'ADMINISTRATOR',
  'FOOD_DONOR',
  'VERIFIED_NGO',
  'COMMUNITY_KITCHEN',
  'DELIVERY_PARTNER',
  'FIELD_WORKER',
];

interface NavItem {
  key: AppRouteKey;
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  badge?: number;
  group: 'primary' | 'more';
}

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    profile,
    isDemoMode,
    exitDemoMode,
    resetDemoScenario,
    switchDemoRole,
    signOut,
    language,
    setLanguage,
    t,
    notifications,
    toasts,
    dismissToast,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const role = profile?.role ?? 'FOOD_DONOR';

  const rawNavItems: NavItem[] = [
    { key: 'dashboard', to: '/', label: t.nav.dashboard, icon: Home, roles: ROUTE_ROLES.dashboard, group: 'primary' },
    {
      key: 'donations',
      to: '/donations',
      label: t.nav.donations,
      icon: PackagePlus,
      roles: ROUTE_ROLES.donations,
      group: 'primary',
    },
    {
      key: 'requests',
      to: '/requests',
      label: t.nav.requests,
      icon: HandHeart,
      roles: ROUTE_ROLES.requests,
      group: 'primary',
    },
    {
      key: 'fieldIntake',
      to: '/field-intake',
      label: t.nav.fieldIntake,
      icon: Smartphone,
      roles: ROUTE_ROLES.fieldIntake,
      group: role === 'FIELD_WORKER' ? 'primary' : 'more',
    },
    {
      key: 'nutriloop',
      to: '/nutriloop',
      label: t.nav.nutriloop,
      icon: Sprout,
      roles: ROUTE_ROLES.nutriloop,
      group: 'primary',
    },
    {
      key: 'routes',
      to: '/routes',
      label: t.nav.routes,
      icon: Map,
      roles: ROUTE_ROLES.routes,
      group: 'primary',
    },
    {
      key: 'mealtrace',
      to: '/mealtrace',
      label: t.nav.mealtrace,
      icon: QrCode,
      roles: ROUTE_ROLES.mealtrace,
      group: 'primary',
    },
    // Secondary / Operational & Admin Tools (strictly filtered by role)
    {
      key: 'safety',
      to: '/safety',
      label: t.nav.safety,
      icon: ClipboardCheck,
      roles: ROUTE_ROLES.safety,
      group: 'more',
    },
    {
      key: 'matching',
      to: '/matching',
      label: t.nav.matching,
      icon: GitMerge,
      roles: ROUTE_ROLES.matching,
      group: 'more',
    },
    { key: 'impact', to: '/impact', label: t.nav.impact, icon: BarChart3, roles: ROUTE_ROLES.impact, group: 'more' },
    { key: 'notifications', to: '/notifications', label: t.nav.notifications, icon: Bell, roles: ROUTE_ROLES.notifications, badge: unreadCount, group: 'more' },
    { key: 'onboarding', to: '/onboarding', label: t.nav.onboarding, icon: Building2, roles: ROUTE_ROLES.onboarding, group: 'more' },
    { key: 'admin', to: '/admin', label: t.nav.admin, icon: ShieldCheck, roles: ROUTE_ROLES.admin, group: 'more' },
    { key: 'setup', to: '/setup', label: t.nav.setup, icon: Database, roles: ROUTE_ROLES.setup, group: 'more' },
  ];

  const allNavItems = rawNavItems.filter((item) => item.roles.includes(role));

  const topCta = (() => {
    if (role === 'VERIFIED_NGO' || role === 'COMMUNITY_KITCHEN') {
      return { to: '/requests', label: tx(language, 'Request Meals', 'உணவு கோரிக்கை') };
    }
    if (role === 'DELIVERY_PARTNER') {
      return { to: '/routes', label: tx(language, 'Deliveries', 'விநியோகங்கள்') };
    }
    if (role === 'FIELD_WORKER') {
      return { to: '/field-intake', label: t.nav.fieldIntake };
    }
    return { to: '/donations', label: tx(language, 'Donate Food', 'உணவு தானம்') };
  })();

  const primaryNav = allNavItems.filter((item) => item.group === 'primary');
  const moreNav = allNavItems.filter((item) => item.group === 'more');

  const isMoreRouteActive = moreNav.some((item) => item.to === location.pathname);
  const [moreOpen, setMoreOpen] = useState(isMoreRouteActive);

  const currentNav = allNavItems.find((item) => item.to === location.pathname) ?? primaryNav[0];

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-[#123B35] text-white">
      <div className="px-6 h-16 border-b border-white/10 flex items-center justify-between">
        <Link to="/" className="text-lg font-extrabold font-display tracking-tight text-white whitespace-nowrap">
          {t.brand}
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          aria-label={tx(language, 'Close navigation', 'வழிசெலுத்தலை மூடு')}
          className="lg:hidden min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Primary Simple Navigation */}
      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
        {primaryNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#D7F36B] text-[#123B35] font-semibold'
                    : 'text-white/85 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}

        {/* Collapsible Secondary Tools */}
        {moreNav.length > 0 && (
          <div className="pt-4 mt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              className="w-full flex items-center justify-between px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              <span>{tx(language, 'More tools', 'மேலும் கருவிகள்')}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {moreOpen && (
              <div className="mt-1 space-y-1">
                {moreNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between gap-3 px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-white/15 text-white font-semibold'
                            : 'text-white/75 hover:text-white hover:bg-white/10'
                        }`
                      }
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <Icon className="w-4 h-4 shrink-0 opacity-85" />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {item.badge ? (
                        <span className="text-[11px] font-mono tabular-nums font-semibold text-[#D7F36B]">
                          {item.badge}
                        </span>
                      ) : null}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Quiet Account & Utilities Footer */}
      <div className="p-4 border-t border-white/10 space-y-3">
        {profile && (
          <div className="px-1">
            <div className="text-xs font-semibold text-white truncate">{profile.full_name}</div>
            <div className="text-[11px] text-white/65 truncate">{t.roles[profile.role]}</div>
          </div>
        )}

        {isDemoMode && profile && (
          <div>
            <label htmlFor="demo-role-switcher" className="sr-only">
              {tx(language, 'Switch Demo Role', 'மாதிரிப் பாத்திரத்தை மாற்றவும்')}
            </label>
            <select
              id="demo-role-switcher"
              value={profile.role}
              onChange={(e) => switchDemoRole(e.target.value as UserRole)}
              className="w-full min-h-[38px] rounded-lg bg-[#0B2723] border border-white/20 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#D7F36B]"
            >
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {tx(language, 'View as:', 'பாத்திரம்:')} {t.roles[r]}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <div
            role="group"
            aria-label={tx(language, 'Language selector', 'மொழித் தேர்வு', 'भाषा चुनें', 'భాష ఎంపిక')}
            className="grid grid-cols-4 gap-0.5 rounded-lg bg-[#0B2723] p-0.5 border border-white/15"
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                type="button"
                onClick={() => setLanguage(opt.code)}
                className={`px-1 py-1 text-[11px] font-semibold rounded-md transition-colors truncate ${
                  language === opt.code
                    ? 'bg-[#D7F36B] text-[#123B35]'
                    : 'text-white/75 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => (isDemoMode ? exitDemoMode() : void signOut())}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/85 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isDemoMode ? tx(language, 'Exit', 'வெளியேறு') : t.auth.signOut}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFF9EF] text-[#123B35] flex overflow-x-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-60 shrink-0 sticky top-0 h-screen">
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

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Minimal Demo Notice Bar */}
        {isDemoMode && (
          <div className="bg-[#D7F36B]/85 text-[#123B35] px-4 lg:px-10 py-2 border-b border-[#123B35]/10 flex items-center justify-between gap-3 text-xs">
            <span className="font-medium truncate">
              {tx(language, 'Demo mode — sample data only', 'மாதிரி முறை — மாதிரித் தரவு மட்டுமே')}
            </span>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={resetDemoScenario}
                className="inline-flex items-center gap-1 font-semibold hover:underline whitespace-nowrap"
              >
                <RotateCcw className="w-3 h-3" />
                {tx(language, 'Reset', 'மீட்டமை')}
              </button>
              <button
                type="button"
                onClick={exitDemoMode}
                className="font-semibold hover:underline whitespace-nowrap"
              >
                {tx(language, 'Exit', 'வெளியேறு')}
              </button>
            </div>
          </div>
        )}

        {/* Calm Top Bar */}
        <header className="sticky top-0 z-30 bg-[#FFF9EF]/95 backdrop-blur-sm border-b border-[#123B35]/10 px-4 lg:px-10 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label={tx(language, 'Open navigation menu', 'வழிசெலுத்தல் பட்டியலைத் திற')}
              className="lg:hidden min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-[#123B35]/15 text-[#123B35] hover:bg-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-display font-bold text-base sm:text-lg text-[#123B35] truncate">
              {currentNav?.label ?? tx(language, 'Home', 'முகப்பு')}
            </h1>
          </div>

          <Link
            to={topCta.to}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723] transition-colors whitespace-nowrap shrink-0"
          >
            {topCta.label}
          </Link>
        </header>

        {/* Airy Workspace Container */}
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 max-w-[1160px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Accessible Toast Notifications */}
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
