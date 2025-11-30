// ============================================================================
// App Component
// Root application component with providers and routing
// ============================================================================

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { Toaster } from '@/components/ui/sonner';
import { PublicRoute, ProtectedRoute } from '@/components/auth';
import { queryClient } from '@/stores';
import { ROUTES, ENV } from '@/lib/constants';

// Pages
import {
  Landing,
  Login,
  Signup,
  ForgotPasswordPage,
  ResetPasswordPage,
  Dashboard,
  Settings,
  NotFound,
  AuthCallbackPage,
  ChatPage,
  PersonasPage,
} from '@/pages';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path={ROUTES.HOME} element={<Landing />} />

          {/* Auth Routes - redirect to dashboard if already logged in */}
          <Route
            path={ROUTES.LOGIN}
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path={ROUTES.SIGNUP}
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />
          <Route
            path={ROUTES.FORGOT_PASSWORD}
            element={
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            }
          />
          <Route
            path={ROUTES.RESET_PASSWORD}
            element={<ResetPasswordPage />}
          />

          {/* Auth Callback (OAuth & email verification) */}
          <Route
            path={ROUTES.AUTH_CALLBACK}
            element={<AuthCallbackPage />}
          />

          {/* Protected Routes - require authentication */}
          <Route
            path={ROUTES.DASHBOARD}
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.SETTINGS}
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Persona Engine Routes */}
          <Route
            path={ROUTES.CHAT}
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.CHAT_CONVERSATION}
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.PERSONAS}
            element={
              <ProtectedRoute>
                <PersonasPage />
              </ProtectedRoute>
            }
          />

          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>

        {/* Toast Notifications */}
        <Toaster position="bottom-right" richColors closeButton />
      </BrowserRouter>

      {/* React Query Devtools - only in development */}
      {ENV.IS_DEVELOPMENT && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  );
}

export default App;
