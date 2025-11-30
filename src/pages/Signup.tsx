// ============================================================================
// Signup Page
// ============================================================================

import { AuthLayout } from '@/components/layout';
import { SignupForm } from '@/components/auth';

export function Signup() {
  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  );
}

export default Signup;
