// ============================================================================
// Input Sanitization Utilities
// Prevents XSS and other injection attacks
// ============================================================================

// ----------------------------------------------------------------------------
// HTML Entity Encoding
// ----------------------------------------------------------------------------

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"'/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Unescape HTML entities
 */
export function unescapeHtml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

// ----------------------------------------------------------------------------
// Script Tag Removal
// ----------------------------------------------------------------------------

/**
 * Remove all script tags from text
 */
export function removeScripts(text: string): string {
  return text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

/**
 * Remove potentially dangerous HTML tags
 */
export function removeDangerousTags(text: string): string {
  const dangerousTags = [
    'script',
    'iframe',
    'object',
    'embed',
    'link',
    'style',
    'form',
    'input',
    'button',
  ];

  let sanitized = text;
  dangerousTags.forEach((tag) => {
    const regex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, 'gi');
    sanitized = sanitized.replace(regex, '');
    // Also remove self-closing tags
    const selfClosingRegex = new RegExp(`<${tag}[^>]*/>`, 'gi');
    sanitized = sanitized.replace(selfClosingRegex, '');
  });

  return sanitized;
}

// ----------------------------------------------------------------------------
// Event Handler Removal
// ----------------------------------------------------------------------------

/**
 * Remove event handler attributes (onclick, onload, etc.)
 */
export function removeEventHandlers(text: string): string {
  return text.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
}

// ----------------------------------------------------------------------------
// URL Sanitization
// ----------------------------------------------------------------------------

/**
 * Sanitize URLs to prevent javascript: and data: URIs
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      return '';
    }
  }

  return url;
}

// ----------------------------------------------------------------------------
// SQL Injection Prevention
// ----------------------------------------------------------------------------

/**
 * Escape single quotes for SQL (though you should use parameterized queries)
 */
export function escapeSql(text: string): string {
  return text.replace(/'/g, "''");
}

// ----------------------------------------------------------------------------
// Comprehensive Sanitization
// ----------------------------------------------------------------------------

/**
 * Apply all sanitization measures
 * Use this for user-generated content that will be displayed
 */
export function sanitizeUserContent(text: string): string {
  if (!text) return '';

  let sanitized = text;

  // Remove scripts and dangerous tags
  sanitized = removeScripts(sanitized);
  sanitized = removeDangerousTags(sanitized);

  // Remove event handlers
  sanitized = removeEventHandlers(sanitized);

  // Escape HTML entities
  sanitized = escapeHtml(sanitized);

  return sanitized;
}

/**
 * Sanitize text that should allow basic formatting
 * Preserves newlines and basic structure
 */
export function sanitizeWithFormatting(text: string): string {
  if (!text) return '';

  let sanitized = text;

  // Remove scripts and dangerous tags
  sanitized = removeScripts(sanitized);
  sanitized = removeDangerousTags(sanitized);

  // Remove event handlers
  sanitized = removeEventHandlers(sanitized);

  // Don't escape HTML entities for this variant
  // But do validate any URLs in the text

  return sanitized;
}

// ----------------------------------------------------------------------------
// Validation Helpers
// ----------------------------------------------------------------------------

/**
 * Check if text contains suspicious patterns
 */
export function containsSuspiciousContent(text: string): boolean {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:text\/html/i,
    /on\w+\s*=/i, // Event handlers
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(text));
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string {
  // Basic email sanitization
  return email.trim().toLowerCase();
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components and dangerous characters
  return filename
    .replace(/^.*[/\\]/, '') // Remove path
    .replace(/[<>:"|?*]/g, '') // Remove invalid filename chars
    .replace(/\.\./g, '') // Remove parent directory references
    .substring(0, 255); // Limit length
}

// ----------------------------------------------------------------------------
// Export convenience object
// ----------------------------------------------------------------------------

export const sanitize = {
  html: escapeHtml,
  unescapeHtml,
  removeScripts,
  removeDangerousTags,
  removeEventHandlers,
  url: sanitizeUrl,
  sql: escapeSql,
  userContent: sanitizeUserContent,
  withFormatting: sanitizeWithFormatting,
  email: sanitizeEmail,
  filename: sanitizeFilename,
  containsSuspicious: containsSuspiciousContent,
};
