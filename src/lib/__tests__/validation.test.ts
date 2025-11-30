// ============================================================================
// Validation Tests
// Tests for enhanced input sanitization and validation schemas
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
  sanitizeInput,
  isValidEmail,
  getPasswordStrength,
  emailSchema,
  passwordSchema,
  loginSchema,
  signupSchema,
} from '../validation';

describe('Validation - Input Sanitization', () => {
  describe('sanitizeInput', () => {
    it('should remove script tags', () => {
      const input = '<script>alert("XSS")</script>Hello';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<script>');
      expect(result).toBe('Hello');
    });

    it('should remove all HTML tags', () => {
      const input = '<div><strong>Hello</strong></div>';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello');
    });

    it('should remove angle brackets', () => {
      const input = 'Hello <World>';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello World');
    });

    it('should remove javascript: protocol', () => {
      const input = 'javascript:alert(1)';
      const result = sanitizeInput(input);
      expect(result).toBe('alert(1)');
    });

    it('should remove event handlers', () => {
      const input = 'onclick="alert(1)"';
      const result = sanitizeInput(input);
      expect(result).not.toContain('onclick');
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello World');
    });

    it('should handle empty string', () => {
      const input = '';
      const result = sanitizeInput(input);
      expect(result).toBe('');
    });

    it('should preserve safe content', () => {
      const input = 'Hello World 123!';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello World 123!');
    });
  });
});

describe('Validation - Email Validation', () => {
  describe('isValidEmail', () => {
    it('should accept valid email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@example.com')).toBe(true);
      expect(isValidEmail('user+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('emailSchema', () => {
    it('should validate and transform valid email', () => {
      const result = emailSchema.safeParse('Test@Example.COM');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });

    it('should trim whitespace', () => {
      const result = emailSchema.safeParse('  test@example.com  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });

    it('should reject invalid email', () => {
      const result = emailSchema.safeParse('notanemail');
      expect(result.success).toBe(false);
    });

    it('should reject email exceeding max length', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = emailSchema.safeParse(longEmail);
      expect(result.success).toBe(false);
    });
  });
});

describe('Validation - Password Validation', () => {
  describe('getPasswordStrength', () => {
    it('should rate strong password correctly', () => {
      const result = getPasswordStrength('StrongP@ss123');
      expect(result.score).toBe(5);
      expect(result.label).toBe('strong');
      expect(result.feedback).toHaveLength(0);
    });

    it('should rate weak password correctly', () => {
      const result = getPasswordStrength('weak');
      expect(result.score).toBeLessThan(5);
      expect(result.label).toBe('weak');
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('should provide feedback for missing criteria', () => {
      const result = getPasswordStrength('nouppercaseornumber');
      expect(result.feedback).toContain('One uppercase letter');
      expect(result.feedback).toContain('One number');
      expect(result.feedback).toContain('One special character');
    });

    it('should check minimum length', () => {
      const result = getPasswordStrength('Ab1!');
      expect(result.feedback).toContain('At least 8 characters');
    });
  });

  describe('passwordSchema', () => {
    it('should accept strong password', () => {
      const result = passwordSchema.safeParse('StrongP@ss123');
      expect(result.success).toBe(true);
    });

    it('should reject password without uppercase', () => {
      const result = passwordSchema.safeParse('weakpass123!');
      expect(result.success).toBe(false);
    });

    it('should reject password without lowercase', () => {
      const result = passwordSchema.safeParse('WEAKPASS123!');
      expect(result.success).toBe(false);
    });

    it('should reject password without number', () => {
      const result = passwordSchema.safeParse('WeakPass!');
      expect(result.success).toBe(false);
    });

    it('should reject password without special character', () => {
      const result = passwordSchema.safeParse('WeakPass123');
      expect(result.success).toBe(false);
    });

    it('should reject password that is too short', () => {
      const result = passwordSchema.safeParse('Wk1!');
      expect(result.success).toBe(false);
    });

    it('should reject password that is too long', () => {
      const result = passwordSchema.safeParse('A1!' + 'a'.repeat(200));
      expect(result.success).toBe(false);
    });
  });
});

describe('Validation - Form Schemas', () => {
  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'anypassword',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing email', () => {
      const result = loginSchema.safeParse({
        password: 'password',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'notanemail',
        password: 'password',
      });
      expect(result.success).toBe(false);
    });

    it('should transform email to lowercase', () => {
      const result = loginSchema.safeParse({
        email: 'Test@Example.COM',
        password: 'password',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });
  });

  describe('signupSchema', () => {
    it('should validate valid signup data', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'StrongP@ss123',
        confirmPassword: 'StrongP@ss123',
        agreeToTerms: true,
      });
      expect(result.success).toBe(true);
    });

    it('should reject mismatched passwords', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'StrongP@ss123',
        confirmPassword: 'DifferentP@ss123',
        agreeToTerms: true,
      });
      expect(result.success).toBe(false);
    });

    it('should reject weak password', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'weak',
        confirmPassword: 'weak',
        agreeToTerms: true,
      });
      expect(result.success).toBe(false);
    });

    it('should reject if terms not agreed', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'StrongP@ss123',
        confirmPassword: 'StrongP@ss123',
        agreeToTerms: false,
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional display name', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'StrongP@ss123',
        confirmPassword: 'StrongP@ss123',
        displayName: 'John Doe',
        agreeToTerms: true,
      });
      expect(result.success).toBe(true);
    });

    it('should sanitize display name', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'StrongP@ss123',
        confirmPassword: 'StrongP@ss123',
        displayName: '  John Doe  ',
        agreeToTerms: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.displayName).toBe('John Doe');
      }
    });
  });
});

describe('Validation - XSS Prevention', () => {
  it('should prevent XSS through script tag injection', () => {
    const malicious = '<script>document.cookie</script>';
    const sanitized = sanitizeInput(malicious);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('document.cookie');
  });

  it('should prevent XSS through image tag with onerror', () => {
    const malicious = '<img src=x onerror="alert(1)">';
    const sanitized = sanitizeInput(malicious);
    expect(sanitized).not.toContain('onerror');
  });

  it('should prevent XSS through javascript: protocol', () => {
    const malicious = 'javascript:alert(document.cookie)';
    const sanitized = sanitizeInput(malicious);
    expect(sanitized).not.toContain('javascript:');
  });

  it('should prevent XSS through event handler attributes', () => {
    const malicious = 'onclick="alert(1)" onmouseover="alert(2)"';
    const sanitized = sanitizeInput(malicious);
    expect(sanitized).not.toContain('onclick');
    expect(sanitized).not.toContain('onmouseover');
  });

  it('should prevent XSS through mixed case variations', () => {
    const malicious = '<ScRiPt>alert(1)</sCrIpT>';
    const sanitized = sanitizeInput(malicious);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized.toLowerCase()).not.toContain('script');
  });
});
