import React from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { AppProvider, useApp } from './context/AppContext';
import { tx } from './i18n/helpers';
import { canAccessRoute, type AppRouteKey } from './lib/rbac';
import { AdminPage } from './pages/AdminPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { DonationsPage } from './pages/DonationsPage';
import { FieldIntakePage } from './pages/FieldIntakePage';
import { FoodSafetyPage } from './pages/FoodSafetyPage';
import { ImpactLedgerPage } from './pages/ImpactLedgerPage';
import { MatchingPage } from './pages/MatchingPage';
import { MealTracePage } from './pages/MealTracePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { NutriLoopPage } from './pages/NutriLoopPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { RequestsPage } from './pages/RequestsPage';
import { RescueRoutePage } from './pages/RescueRoutePage';
import { SetupGuidePage } from './pages/SetupGuidePage';

const RoleGuard: React.FC<{ routeKey: AppRouteKey; children: React.ReactNode }> = ({
  routeKey,
  children,
}) => {
  const { profile, language, t } = useApp();
  const role = profile?.role;

  if (!canAccessRoute(role, routeKey)) {
    return (
      <div className="max-w-lg mx-auto my-12 rounded-2xl bg-white border border-[#FF795C] p-8 space-y-4">
        <div className="flex items-center gap-2.5 text-[#FF795C]">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <h2 className="text-lg font-bold font-display text-[#123B35]">
            {tx(language, 'Access Limited for Your Role', 'உங்கள் பொறுப்பிற்கு இந்தப் பகுதி அனுமதிக்கப்படவில்லை')}
          </h2>
        </div>
        <p className="text-sm text-[#64748B] leading-relaxed">
          {tx(
            language,
            `Your current role (${role ? t.roles[role] : 'Guest'}) does not have permission to use this section. Access is enforced both in the interface and by database Row Level Security.`,
            `உங்கள் தற்போதைய பொறுப்பு (${role ? t.roles[role] : 'விருந்தினர்'}) இந்தப் பகுதியைப் பயன்படுத்த அனுமதி பெறவில்லை. அணுகல் கட்டுப்பாடு இணையதளத்திலும் தரவுத்தளத்திலும் கண்டிப்பாக அமல்படுத்தப்படுகிறது.`
          )}
        </p>
        <div>
          <Link
            to="/"
            className="inline-flex items-center justify-center min-h-[42px] px-4 py-2 rounded-xl bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723]"
          >
            {tx(language, 'Back to Home', 'முகப்புக்குத் திரும்பு')}
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { session, isDemoMode, authLoading, language } = useApp();
  const isAuthorizedSession = isDemoMode || Boolean(session?.user);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFF9EF] text-[#123B35] flex items-center justify-center">
        <div className="text-sm font-medium text-[#64748B]">
          {tx(
            language,
            'Restoring Supabase session...',
            'அமர்வு ஏற்றப்படுகிறது...',
            'सत्र लोड हो रहा है...',
            'సెషన్ లోడ్ అవుతోంది...'
          )}
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public / Non-PII MealTrace QR Verification Route */}
      <Route path="/track/:token" element={<MealTracePage publicView />} />

      {!isAuthorizedSession ? (
        <>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={<AuthPage />} />
        </>
      ) : (
        <Route
          path="*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route
                  path="/donations"
                  element={
                    <RoleGuard routeKey="donations">
                      <DonationsPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/requests"
                  element={
                    <RoleGuard routeKey="requests">
                      <RequestsPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/safety"
                  element={
                    <RoleGuard routeKey="safety">
                      <FoodSafetyPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/matching"
                  element={
                    <RoleGuard routeKey="matching">
                      <MatchingPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/routes"
                  element={
                    <RoleGuard routeKey="routes">
                      <RescueRoutePage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/mealtrace"
                  element={
                    <RoleGuard routeKey="mealtrace">
                      <MealTracePage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/field-intake"
                  element={
                    <RoleGuard routeKey="fieldIntake">
                      <FieldIntakePage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/impact"
                  element={
                    <RoleGuard routeKey="impact">
                      <ImpactLedgerPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/nutriloop"
                  element={
                    <RoleGuard routeKey="nutriloop">
                      <NutriLoopPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <RoleGuard routeKey="admin">
                      <AdminPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/onboarding"
                  element={
                    <RoleGuard routeKey="onboarding">
                      <OnboardingPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <RoleGuard routeKey="notifications">
                      <NotificationsPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/setup"
                  element={
                    <RoleGuard routeKey="setup">
                      <SetupGuidePage />
                    </RoleGuard>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          }
        />
      )}
    </Routes>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
