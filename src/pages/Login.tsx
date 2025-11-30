// ============================================================================
// Login Page
// ============================================================================

import { AuthLayout } from '@/components/layout';
import { LoginForm } from '@/components/auth';

export function Login() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}

export default Login;
