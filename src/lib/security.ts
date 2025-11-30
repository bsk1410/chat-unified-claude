// ============================================================================
// Security Utilities
// Enhanced security functions for input sanitization and validation
// ============================================================================

// ----------------------------------------------------------------------------
// Input Sanitization
// ----------------------------------------------------------------------------

/**
 * Sanitize HTML input to prevent XSS attacks
 * Removes potentially dangerous HTML tags and attributes
 */
export function sanitizeHTML(input: string): string {
  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

  // Remove object and embed tags
  sanitized = sanitized.replace(/<(object|embed)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '');

  return sanitized.trim();
}

/**
 * Sanitize SQL input to prevent SQL injection
 * Note: This is a basic sanitization. Always use parameterized queries!
 */
export function sanitizeSQL(input: string): string {
  // This is just a safety net - Supabase uses parameterized queries
  // but we still sanitize as defense in depth
  return input
    .replace(/'/g, "''") // Escape single quotes
    .replace(/;/g, '') // Remove semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove multi-line comment start
    .replace(/\*\//g, ''); // Remove multi-line comment end
}

/**
 * Sanitize file name to prevent directory traversal
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/\//g, '') // Remove forward slashes
    .replace(/\\/g, '') // Remove backslashes
    .replace(/[<>:"|?*]/g, '') // Remove invalid characters
    .replace(/^\./, '') // Remove leading dot
    .trim();
}

/**
 * Sanitize user input for display
 * More aggressive than sanitizeHTML - strips all HTML
 */
export function sanitizeUserInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
}

// ----------------------------------------------------------------------------
// Content Security
// ----------------------------------------------------------------------------

/**
 * Validate and sanitize URL to prevent open redirect attacks
 */
export function sanitizeURL(url: string, allowedDomains?: string[]): string | null {
  try {
    const parsedURL = new URL(url, window.location.origin);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedURL.protocol)) {
      return null;
    }

    // If allowed domains are specified, check against them
    if (allowedDomains && allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some(domain =>
        parsedURL.hostname === domain || parsedURL.hostname.endsWith('.' + domain)
      );

      if (!isAllowed) {
        return null;
      }
    }

    return parsedURL.toString();
  } catch {
    return null;
  }
}

/**
 * Validate redirect URL to prevent open redirect vulnerabilities
 * Only allows same-origin redirects by default
 */
export function isValidRedirectURL(url: string, allowedPaths?: string[]): boolean {
  try {
    const parsedURL = new URL(url, window.location.origin);

    // Must be same origin
    if (parsedURL.origin !== window.location.origin) {
      return false;
    }

    // If allowed paths are specified, check against them
    if (allowedPaths && allowedPaths.length > 0) {
      return allowedPaths.some(path => parsedURL.pathname.startsWith(path));
    }

    return true;
  } catch {
    return false;
  }
}

// ----------------------------------------------------------------------------
// Rate Limiting (Client-side)
// ----------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Simple client-side rate limiting
 * Prevents abuse of API endpoints
 */
export function isRateLimited(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // No entry or window expired
  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return false;
  }

  // Within window
  if (entry.count >= maxRequests) {
    return true; // Rate limited
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);
  return false;
}

/**
 * Clear rate limit for a key
 */
export function clearRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

// ----------------------------------------------------------------------------
// CSRF Protection
// ----------------------------------------------------------------------------

/**
 * Generate a CSRF token
 * Note: Supabase handles CSRF protection, but this is useful for custom forms
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) return false;

  // Constant-time comparison to prevent timing attacks
  if (token.length !== expectedToken.length) return false;

  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
  }

  return result === 0;
}

// ----------------------------------------------------------------------------
// Sensitive Data Handling
// ----------------------------------------------------------------------------

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars) {
    return '*'.repeat(data.length);
  }

  return data.slice(0, visibleChars) + '*'.repeat(data.length - visibleChars);
}

/**
 * Redact email for display (show first char + domain)
 */
export function redactEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;

  return `${local[0]}${'*'.repeat(Math.max(0, local.length - 1))}@${domain}`;
}

/**
 * Check if string contains potential sensitive data patterns
 */
export function containsSensitivePattern(input: string): boolean {
  const patterns = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email (might be intentional)
    /\b(?:password|passwd|pwd)\s*[:=]\s*\S+/i, // Password in plain text
    /\b(?:api[_-]?key|apikey|access[_-]?token)\s*[:=]\s*\S+/i, // API keys
  ];

  return patterns.some(pattern => pattern.test(input));
}

// ----------------------------------------------------------------------------
// Secure Random Generation
// ----------------------------------------------------------------------------

/**
 * Generate cryptographically secure random string
 */
export function generateSecureRandomString(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate secure random number in range
 */
export function generateSecureRandomNumber(min: number, max: number): number {
  const range = max - min;
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return min + (array[0] % (range + 1));
}

// ----------------------------------------------------------------------------
// Input Validation Helpers
// ----------------------------------------------------------------------------

/**
 * Validate file type against allowed types
 */
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      const prefix = type.slice(0, -2);
      return file.type.startsWith(prefix);
    }
    return file.type === type;
  });
}

/**
 * Validate file size
 */
export function isValidFileSize(file: File, maxSizeBytes: number): boolean {
  return file.size <= maxSizeBytes;
}

/**
 * Comprehensive file validation
 */
export function validateFile(
  file: File,
  options: {
    allowedTypes?: string[];
    maxSize?: number;
    allowedExtensions?: string[];
  }
): { valid: boolean; error?: string } {
  const { allowedTypes, maxSize, allowedExtensions } = options;

  // Check file type
  if (allowedTypes && !isValidFileType(file, allowedTypes)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  // Check file size
  if (maxSize && !isValidFileSize(file, maxSize)) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${maxSize} bytes`,
    };
  }

  // Check file extension
  if (allowedExtensions) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      return {
        valid: false,
        error: `File extension .${ext} is not allowed`,
      };
    }
  }

  return { valid: true };
}

// ----------------------------------------------------------------------------
// Export all security utilities
// ----------------------------------------------------------------------------

export const Security = {
  sanitizeHTML,
  sanitizeSQL,
  sanitizeFileName,
  sanitizeUserInput,
  sanitizeURL,
  isValidRedirectURL,
  isRateLimited,
  clearRateLimit,
  generateCSRFToken,
  validateCSRFToken,
  maskSensitiveData,
  redactEmail,
  containsSensitivePattern,
  generateSecureRandomString,
  generateSecureRandomNumber,
  isValidFileType,
  isValidFileSize,
  validateFile,
};

export default Security;
