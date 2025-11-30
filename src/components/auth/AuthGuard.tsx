// ============================================================================
// Auth Guard Component
// Protects routes that require authentication
// ============================================================================

import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { useAuth } from '@/hooks';
import { ROUTES } from '@/lib/constants';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
}

/**
 * Loading spinner component
 */
function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Auth Guard - protects routes that require authentication
 *
 * Usage:
 * ```tsx
 * <AuthGuard>
 *   <ProtectedPage />
 * </AuthGuard>
 * ```
 */
export function AuthGuard({
  children,
  fallback,
  requireAuth = true,
}: AuthGuardProps) {
  const { user, loading, initialized } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading || !initialized) {
    return fallback ?? <LoadingScreen />;
  }

  // If auth is required and user is not authenticated, redirect to login
  if (requireAuth && !user) {
    return (
      <Navigate
        to={ROUTES.LOGIN}
        state={{ from: location }}
        replace
      />
    );
  }

  // If auth is NOT required (public route) and user IS authenticated,
  // redirect to dashboard (e.g., logged in user visiting login page)
  if (!requireAuth && user) {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
    return (
      <Navigate
        to={from || ROUTES.DASHBOARD}
        replace
      />
    );
  }

  return <>{children}</>;
}

/**
 * Public Route Guard - redirects authenticated users away from public pages
 *
 * Usage:
 * ```tsx
 * <PublicRoute>
 *   <LoginPage />
 * </PublicRoute>
 * ```
 */
export function PublicRoute({ children }: { children: ReactNode }) {
  return <AuthGuard requireAuth={false}>{children}</AuthGuard>;
}

/**
 * Protected Route Guard - requires authentication
 *
 * Usage:
 * ```tsx
 * <ProtectedRoute>
 *   <DashboardPage />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <AuthGuard requireAuth fallback={fallback}>
      {children}
    </AuthGuard>
  );
}

export default AuthGuard;
