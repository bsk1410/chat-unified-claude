// ============================================================================
// Type Exports
// Central export file for all application types
// ============================================================================

// Database types
export * from './database';

// Re-export Supabase types for convenience
export type { User, Session, AuthError, Provider } from '@supabase/supabase-js';

// ----------------------------------------------------------------------------
// Application Types
// ----------------------------------------------------------------------------

/**
 * Theme options
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Authentication state
 */
export interface AuthState {
  user: import('@supabase/supabase-js').User | null;
  session: import('@supabase/supabase-js').Session | null;
  loading: boolean;
  initialized: boolean;
}

/**
 * User preferences
 */
export interface UserPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  marketing_emails: boolean;
  weekly_digest: boolean;
}

/**
 * Navigation item
 */
export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  disabled?: boolean;
  external?: boolean;
  children?: NavItem[];
}

/**
 * Breadcrumb item
 */
export interface BreadcrumbItem {
  title: string;
  href?: string;
}

/**
 * Toast notification
 */
export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Form field error
 */
export interface FieldError {
  field: string;
  message: string;
}

/**
 * Generic async state
 */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * File upload state
 */
export interface FileUploadState {
  file: File | null;
  progress: number;
  uploading: boolean;
  error: string | null;
  url: string | null;
}

// ----------------------------------------------------------------------------
// Component Props Types
// ----------------------------------------------------------------------------

/**
 * Common props for components that can have children
 */
export interface PropsWithChildren {
  children?: React.ReactNode;
}

/**
 * Common props for components that can have className
 */
export interface PropsWithClassName {
  className?: string;
}

/**
 * Common props for page components
 */
export interface PageProps extends PropsWithChildren, PropsWithClassName {
  title?: string;
  description?: string;
}

// ----------------------------------------------------------------------------
// Utility Types
// ----------------------------------------------------------------------------

/**
 * Make some properties required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make all properties optional except for specified keys
 */
export type OptionalExcept<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<T, K>;

/**
 * Extract the resolved type of a Promise
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * Non-nullable type
 */
export type NonNull<T> = T extends null | undefined ? never : T;
