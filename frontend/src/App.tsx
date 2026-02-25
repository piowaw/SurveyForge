// App rooting

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { LanguageProvider } from '@/i18n';
import { AuthProvider } from '@/features/auth/AuthContext';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import AccountPage from '@/pages/AccountPage';
import SurveyPage from '@/pages/SurveyPage';
import PublicSurveyPage from '@/pages/PublicSurveyPage';
import AdminPanelPage from '@/pages/AdminPanelPage';
import NotFoundPage from '@/pages/NotFoundPage';
import HomePage from '@/pages/HomePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Landing page */}
            <Route path="/" element={<HomePage />} />

            {/* Auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <AccountPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPanelPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/surveys/:id"
              element={
                <ProtectedRoute>
                  <SurveyPage />
                </ProtectedRoute>
              }
            />
            <Route path="/surveys/:id/results" element={<Navigate to="..?tab=results" replace />} />

            {/* Public survey route */}
            <Route path="/s/:slug" element={<PublicSurveyPage />} />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
