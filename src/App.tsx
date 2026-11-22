import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { AppProvider, useApp } from './context/AppContext';
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

const AppRoutes: React.FC = () => {
  const { session, isDemoMode, authLoading, language } = useApp();
  const isAuthorizedSession = isDemoMode || Boolean(session?.user);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFF9EF] text-[#123B35] flex items-center justify-center">
        <div className="text-sm font-medium text-[#64748B]">
          {language === 'ta' ? 'அமர்வு ஏற்றப்படுகிறது...' : 'Restoring Supabase session...'}
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
                <Route path="/donations" element={<DonationsPage />} />
                <Route path="/requests" element={<RequestsPage />} />
                <Route path="/safety" element={<FoodSafetyPage />} />
                <Route path="/matching" element={<MatchingPage />} />
                <Route path="/routes" element={<RescueRoutePage />} />
                <Route path="/mealtrace" element={<MealTracePage />} />
                <Route path="/field-intake" element={<FieldIntakePage />} />
                <Route path="/impact" element={<ImpactLedgerPage />} />
                <Route path="/nutriloop" element={<NutriLoopPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/setup" element={<SetupGuidePage />} />
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
