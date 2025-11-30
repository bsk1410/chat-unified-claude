// ============================================================================
// Reset Password Page
// ============================================================================

import { AuthLayout } from '@/components/layout';
import { ResetPassword } from '@/components/auth';

export function ResetPasswordPage() {
  return (
    <AuthLayout>
      <ResetPassword />
    </AuthLayout>
  );
}

export default ResetPasswordPage;
