// ============================================================================
// Forgot Password Page
// ============================================================================

import { AuthLayout } from '@/components/layout';
import { ForgotPassword } from '@/components/auth';

export function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPassword />
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
