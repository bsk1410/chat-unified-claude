// ============================================================================
// 404 Not Found Page
// ============================================================================

import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/layout';
import { ROUTES } from '@/lib/constants';

export function NotFound() {
  return (
    <AppShell showNavigation={false} showFooter={false} centered>
      <div className="text-center space-y-6 px-4">
        {/* 404 Illustration */}
        <div className="relative">
          <div className="text-[12rem] font-bold text-muted/20 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl">
              <span role="img" aria-label="confused face">
                🤔
              </span>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Page not found</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Sorry, we couldn't find the page you're looking for. Perhaps you've
            mistyped the URL or the page has been moved.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button asChild>
            <Link to={ROUTES.HOME}>
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

export default NotFound;
