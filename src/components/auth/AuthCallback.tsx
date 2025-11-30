// ============================================================================
// Auth Callback Component
// Handles OAuth callback and email verification
// ============================================================================

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/lib/constants';

type CallbackStatus = 'loading' | 'success' | 'error';

export function AuthCallback() {
  const [status, setStatus] = useState<CallbackStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for error in URL params
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          throw new Error(errorDescription || error);
        }

        // Check for auth code
        const code = searchParams.get('code');

        if (code) {
          // Exchange code for session
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            throw exchangeError;
          }
        }

        // Get session to verify authentication
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          throw new Error('No session found');
        }

        // Success! Redirect to dashboard
        setStatus('success');
        setTimeout(() => {
          navigate(ROUTES.DASHBOARD, { replace: true });
        }, 1500);

      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setErrorMessage(
          error instanceof Error ? error.message : 'Authentication failed'
        );
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 text-center p-6">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <div>
              <h1 className="text-xl font-semibold">Completing sign in...</h1>
              <p className="mt-2 text-muted-foreground">
                Please wait while we verify your authentication.
              </p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Sign in successful!</h1>
              <p className="mt-2 text-muted-foreground">
                Redirecting you to your dashboard...
              </p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Authentication failed</h1>
              <p className="mt-2 text-muted-foreground">
                {errorMessage || 'An error occurred during authentication.'}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate(ROUTES.LOGIN, { replace: true })}>
                Try again
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate(ROUTES.HOME, { replace: true })}
              >
                Go home
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AuthCallback;
