// ============================================================================
// Validation Schemas
// Zod schemas for form validation and data sanitization
// ============================================================================

import { z } from 'zod';
import { AUTH, VALIDATION } from './constants';

// ----------------------------------------------------------------------------
// Base Schemas
// ----------------------------------------------------------------------------

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(VALIDATION.EMAIL_MAX_LENGTH, `Email must be less than ${VALIDATION.EMAIL_MAX_LENGTH} characters`)
  .transform((email) => email.toLowerCase().trim());

/**
 * Password validation schema with requirements
 */
export const passwordSchema = z
  .string()
  .min(AUTH.PASSWORD_MIN_LENGTH, `Password must be at least ${AUTH.PASSWORD_MIN_LENGTH} characters`)
  .max(AUTH.PASSWORD_MAX_LENGTH, `Password must be less than ${AUTH.PASSWORD_MAX_LENGTH} characters`)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/**
 * Simple password schema (for login - less strict)
 */
export const simplePasswordSchema = z
  .string()
  .min(1, 'Password is required');

/**
 * UUID schema
 */
export const uuidSchema = z.string().uuid('Invalid ID format');

/**
 * Display name schema
 */
export const displayNameSchema = z
  .string()
  .min(VALIDATION.DISPLAY_NAME_MIN_LENGTH, `Name must be at least ${VALIDATION.DISPLAY_NAME_MIN_LENGTH} characters`)
  .max(VALIDATION.DISPLAY_NAME_MAX_LENGTH, `Name must be less than ${VALIDATION.DISPLAY_NAME_MAX_LENGTH} characters`)
  .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name can only contain letters, numbers, spaces, hyphens, and underscores')
  .transform((name) => name.trim());

/**
 * Optional display name schema
 */
export const optionalDisplayNameSchema = displayNameSchema.optional().or(z.literal(''));

/**
 * Bio schema
 */
export const bioSchema = z
  .string()
  .max(VALIDATION.BIO_MAX_LENGTH, `Bio must be less than ${VALIDATION.BIO_MAX_LENGTH} characters`)
  .optional()
  .transform((bio) => bio?.trim());

/**
 * URL schema
 */
export const urlSchema = z
  .string()
  .url('Please enter a valid URL')
  .optional()
  .or(z.literal(''));

/**
 * Timezone schema
 */
export const timezoneSchema = z
  .string()
  .regex(/^[A-Za-z_]+\/[A-Za-z_]+$|^UTC$/, 'Invalid timezone format')
  .default('UTC');

// ----------------------------------------------------------------------------
// Auth Schemas
// ----------------------------------------------------------------------------

/**
 * Login form schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: simplePasswordSchema,
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Signup form schema
 */
export const signupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    displayName: optionalDisplayNameSchema,
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type SignupFormData = z.infer<typeof signupSchema>;

/**
 * Forgot password form schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Reset password form schema
 */
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/**
 * Change password form schema
 */
export const changePasswordSchema = z
  .object({
    currentPassword: simplePasswordSchema,
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords don't match",
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// ----------------------------------------------------------------------------
// Profile Schemas
// ----------------------------------------------------------------------------

/**
 * Update profile form schema
 */
export const updateProfileSchema = z.object({
  displayName: displayNameSchema,
  fullName: z.string().max(100, 'Name must be less than 100 characters').optional(),
  bio: bioSchema,
  website: urlSchema,
  timezone: timezoneSchema,
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

/**
 * User preferences schema
 */
export const userPreferencesSchema = z.object({
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(false),
  marketingEmails: z.boolean().default(false),
  weeklyDigest: z.boolean().default(true),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  locale: z.string().default('en'),
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;

// ----------------------------------------------------------------------------
// Utility Functions
// ----------------------------------------------------------------------------

/**
 * Sanitize string input - Enhanced version to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

/**
 * Check password strength
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= AUTH.PASSWORD_MIN_LENGTH) {
    score += 1;
  } else {
    feedback.push(`At least ${AUTH.PASSWORD_MIN_LENGTH} characters`);
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One uppercase letter');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One lowercase letter');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One number');
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One special character');
  }

  const labels: Record<number, 'weak' | 'fair' | 'good' | 'strong'> = {
    0: 'weak',
    1: 'weak',
    2: 'fair',
    3: 'fair',
    4: 'good',
    5: 'strong',
  };

  return {
    score,
    label: labels[score] || 'weak',
    feedback,
  };
}

/**
 * Format validation errors for display
 */
export function formatZodErrors(
  errors: z.ZodError
): Record<string, string> {
  const formatted: Record<string, string> = {};

  errors.errors.forEach((error) => {
    const path = error.path.join('.');
    if (!formatted[path]) {
      formatted[path] = error.message;
    }
  });

  return formatted;
}

/**
 * Safe parse with error extraction
 */
export function safeParse<T extends z.ZodSchema>(
  schema: T,
  data: unknown
): {
  success: boolean;
  data?: z.infer<T>;
  errors?: Record<string, string>;
} {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: formatZodErrors(result.error),
  };
}
