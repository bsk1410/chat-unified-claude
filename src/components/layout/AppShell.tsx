// ============================================================================
// App Shell Component
// Main layout wrapper with navigation and footer
// ============================================================================

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Navigation } from './Navigation';
import { Footer } from './Footer';

interface AppShellProps {
  children: ReactNode;
  className?: string;
  showNavigation?: boolean;
  showFooter?: boolean;
  navigationVariant?: 'default' | 'minimal';
  fullWidth?: boolean;
  centered?: boolean;
}

/**
 * Main application shell with navigation and footer
 */
export function AppShell({
  children,
  className,
  showNavigation = true,
  showFooter = true,
  navigationVariant = 'default',
  fullWidth = false,
  centered = false,
}: AppShellProps) {
  return (
    <div className="relative min-h-screen flex flex-col bg-background">
      {showNavigation && <Navigation variant={navigationVariant} />}

      <main
        className={cn(
          'flex-1',
          !fullWidth && 'container',
          centered && 'flex items-center justify-center',
          className
        )}
      >
        {children}
      </main>

      {showFooter && <Footer />}
    </div>
  );
}

/**
 * Auth layout - centered content with minimal navigation
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/30">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-primary/5 to-transparent rounded-full blur-3xl" />
      </div>

      <main className="relative flex-1 flex items-center justify-center p-4">
        {children}
      </main>

      <Footer variant="minimal" />
    </div>
  );
}

/**
 * Dashboard layout - navigation with sidebar space
 */
export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      showNavigation
      showFooter={false}
      navigationVariant="default"
      className="py-8"
    >
      {children}
    </AppShell>
  );
}

/**
 * Landing layout - full-width with navigation
 */
export function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      showNavigation
      showFooter
      navigationVariant="minimal"
      fullWidth
    >
      {children}
    </AppShell>
  );
}

export default AppShell;
