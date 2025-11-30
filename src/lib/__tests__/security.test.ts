// ============================================================================
// Security Utilities Tests
// Comprehensive tests for XSS prevention, file validation, and security helpers
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
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
} from '../security';

describe('Security - HTML Sanitization', () => {
  describe('sanitizeHTML', () => {
    it('should remove script tags', () => {
      const input = '<script>alert("XSS")</script>Hello';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('<script>');
      expect(result).toBe('Hello');
    });

    it('should remove event handlers', () => {
      const input = '<div onclick="alert(1)">Click me</div>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('onclick');
    });

    it('should remove javascript: protocol', () => {
      const input = '<a href="javascript:alert(1)">Link</a>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('javascript:');
    });

    it('should remove iframe tags', () => {
      const input = '<iframe src="evil.com"></iframe>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('<iframe>');
    });

    it('should remove object and embed tags', () => {
      const input = '<object data="evil.swf"></object>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('<object>');
    });

    it('should handle multiple XSS vectors', () => {
      const input = '<img src=x onerror="alert(1)"><script>alert(2)</script>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('<script>');
    });

    it('should preserve safe content', () => {
      const input = 'Hello World';
      const result = sanitizeHTML(input);
      expect(result).toBe('Hello World');
    });
  });

  describe('sanitizeUserInput', () => {
    it('should remove all HTML tags', () => {
      const input = '<div>Hello <strong>World</strong></div>';
      const result = sanitizeUserInput(input);
      expect(result).toBe('Hello World');
    });

    it('should remove angle brackets', () => {
      const input = 'Hello <World>';
      const result = sanitizeUserInput(input);
      expect(result).toBe('Hello World');
    });
  });
});

describe('Security - SQL Sanitization', () => {
  describe('sanitizeSQL', () => {
    it('should escape single quotes', () => {
      const input = "O'Brien";
      const result = sanitizeSQL(input);
      expect(result).toBe("O''Brien");
    });

    it('should remove semicolons', () => {
      const input = 'DROP TABLE users;';
      const result = sanitizeSQL(input);
      expect(result).not.toContain(';');
    });

    it('should remove SQL comments', () => {
      const input = 'admin-- comment';
      const result = sanitizeSQL(input);
      expect(result).not.toContain('--');
    });
  });
});

describe('Security - File Name Sanitization', () => {
  describe('sanitizeFileName', () => {
    it('should remove parent directory references', () => {
      const input = '../../../etc/passwd';
      const result = sanitizeFileName(input);
      expect(result).not.toContain('..');
    });

    it('should remove slashes', () => {
      const input = 'path/to/file.txt';
      const result = sanitizeFileName(input);
      expect(result).not.toContain('/');
    });

    it('should remove backslashes', () => {
      const input = 'path\\to\\file.txt';
      const result = sanitizeFileName(input);
      expect(result).not.toContain('\\');
    });

    it('should remove invalid characters', () => {
      const input = 'file<>:"|?*.txt';
      const result = sanitizeFileName(input);
      expect(result).toBe('file.txt');
    });

    it('should remove leading dot', () => {
      const input = '.hiddenfile';
      const result = sanitizeFileName(input);
      expect(result).toBe('hiddenfile');
    });
  });
});

describe('Security - URL Validation', () => {
  describe('sanitizeURL', () => {
    it('should allow valid HTTP URLs', () => {
      const input = 'http://example.com';
      const result = sanitizeURL(input);
      expect(result).toBe('http://example.com/');
    });

    it('should allow valid HTTPS URLs', () => {
      const input = 'https://example.com';
      const result = sanitizeURL(input);
      expect(result).toBe('https://example.com/');
    });

    it('should reject javascript: protocol', () => {
      const input = 'javascript:alert(1)';
      const result = sanitizeURL(input);
      expect(result).toBeNull();
    });

    it('should reject data: protocol', () => {
      const input = 'data:text/html,<script>alert(1)</script>';
      const result = sanitizeURL(input);
      expect(result).toBeNull();
    });

    it('should validate against allowed domains', () => {
      const input = 'https://example.com';
      const result = sanitizeURL(input, ['example.com']);
      expect(result).toBeTruthy();
    });

    it('should reject URLs not in allowed domains', () => {
      const input = 'https://evil.com';
      const result = sanitizeURL(input, ['example.com']);
      expect(result).toBeNull();
    });
  });

  describe('isValidRedirectURL', () => {
    it('should allow same-origin redirects', () => {
      const result = isValidRedirectURL('/dashboard');
      expect(result).toBe(true);
    });

    it('should reject cross-origin redirects', () => {
      const result = isValidRedirectURL('https://evil.com/phishing');
      expect(result).toBe(false);
    });

    it('should validate against allowed paths', () => {
      const result = isValidRedirectURL('/dashboard', ['/dashboard', '/settings']);
      expect(result).toBe(true);
    });

    it('should reject paths not in allowed list', () => {
      const result = isValidRedirectURL('/admin', ['/dashboard', '/settings']);
      expect(result).toBe(false);
    });
  });
});

describe('Security - Rate Limiting', () => {
  describe('isRateLimited', () => {
    it('should not rate limit first request', () => {
      clearRateLimit('test-endpoint');
      const result = isRateLimited('test-endpoint', 5, 60000);
      expect(result).toBe(false);
    });

    it('should rate limit after max requests', () => {
      clearRateLimit('test-endpoint-2');
      for (let i = 0; i < 5; i++) {
        isRateLimited('test-endpoint-2', 5, 60000);
      }
      const result = isRateLimited('test-endpoint-2', 5, 60000);
      expect(result).toBe(true);
    });

    it('should reset after time window', async () => {
      clearRateLimit('test-endpoint-3');
      for (let i = 0; i < 5; i++) {
        isRateLimited('test-endpoint-3', 5, 100);
      }
      await new Promise(resolve => setTimeout(resolve, 150));
      const result = isRateLimited('test-endpoint-3', 5, 100);
      expect(result).toBe(false);
    });
  });
});

describe('Security - CSRF Protection', () => {
  describe('generateCSRFToken', () => {
    it('should generate a token', () => {
      const token = generateCSRFToken();
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
    });

    it('should generate unique tokens', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      expect(token1).not.toBe(token2);
    });

    it('should generate tokens of correct length', () => {
      const token = generateCSRFToken();
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
    });
  });

  describe('validateCSRFToken', () => {
    it('should validate matching tokens', () => {
      const token = generateCSRFToken();
      const result = validateCSRFToken(token, token);
      expect(result).toBe(true);
    });

    it('should reject non-matching tokens', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      const result = validateCSRFToken(token1, token2);
      expect(result).toBe(false);
    });

    it('should reject empty tokens', () => {
      const result = validateCSRFToken('', 'token');
      expect(result).toBe(false);
    });

    it('should use constant-time comparison', () => {
      const token = 'a'.repeat(64);
      const wrong1 = 'b'.repeat(64);
      const wrong2 = 'a'.repeat(63) + 'b';

      const result1 = validateCSRFToken(token, wrong1);
      const result2 = validateCSRFToken(token, wrong2);

      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });
  });
});

describe('Security - Sensitive Data Handling', () => {
  describe('maskSensitiveData', () => {
    it('should mask most of the data', () => {
      const data = '1234567890';
      const result = maskSensitiveData(data);
      expect(result).toBe('1234******');
    });

    it('should mask short data completely', () => {
      const data = '123';
      const result = maskSensitiveData(data, 4);
      expect(result).toBe('***');
    });

    it('should respect visible chars parameter', () => {
      const data = 'secretdata';
      const result = maskSensitiveData(data, 2);
      expect(result).toBe('se********');
    });
  });

  describe('redactEmail', () => {
    it('should redact email address', () => {
      const email = 'john.doe@example.com';
      const result = redactEmail(email);
      expect(result).toBe('j*******@example.com');
    });

    it('should handle single char local part', () => {
      const email = 'a@example.com';
      const result = redactEmail(email);
      expect(result).toBe('a@example.com');
    });
  });

  describe('containsSensitivePattern', () => {
    it('should detect SSN pattern', () => {
      const input = 'My SSN is 123-45-6789';
      const result = containsSensitivePattern(input);
      expect(result).toBe(true);
    });

    it('should detect credit card pattern', () => {
      const input = 'Card: 1234 5678 9012 3456';
      const result = containsSensitivePattern(input);
      expect(result).toBe(true);
    });

    it('should detect password in plain text', () => {
      const input = 'password=mySecret123';
      const result = containsSensitivePattern(input);
      expect(result).toBe(true);
    });

    it('should detect API keys', () => {
      const input = 'api_key=sk_test_1234567890';
      const result = containsSensitivePattern(input);
      expect(result).toBe(true);
    });

    it('should return false for safe content', () => {
      const input = 'Hello World';
      const result = containsSensitivePattern(input);
      expect(result).toBe(false);
    });
  });
});

describe('Security - Secure Random Generation', () => {
  describe('generateSecureRandomString', () => {
    it('should generate a random string', () => {
      const str = generateSecureRandomString();
      expect(str).toBeTruthy();
      expect(typeof str).toBe('string');
    });

    it('should generate strings of specified length', () => {
      const str = generateSecureRandomString(16);
      expect(str.length).toBe(32); // 16 bytes = 32 hex chars
    });

    it('should generate unique strings', () => {
      const str1 = generateSecureRandomString();
      const str2 = generateSecureRandomString();
      expect(str1).not.toBe(str2);
    });
  });

  describe('generateSecureRandomNumber', () => {
    it('should generate a number in range', () => {
      const num = generateSecureRandomNumber(1, 10);
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(10);
    });

    it('should handle single value range', () => {
      const num = generateSecureRandomNumber(5, 5);
      expect(num).toBe(5);
    });
  });
});

describe('Security - File Validation', () => {
  describe('isValidFileType', () => {
    it('should validate exact MIME type match', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const result = isValidFileType(file, ['image/jpeg', 'image/png']);
      expect(result).toBe(true);
    });

    it('should validate wildcard MIME type', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const result = isValidFileType(file, ['image/*']);
      expect(result).toBe(true);
    });

    it('should reject invalid MIME type', () => {
      const file = new File([''], 'test.exe', { type: 'application/x-msdownload' });
      const result = isValidFileType(file, ['image/*']);
      expect(result).toBe(false);
    });
  });

  describe('isValidFileSize', () => {
    it('should accept file within size limit', () => {
      const file = new File(['a'.repeat(1000)], 'test.txt');
      const result = isValidFileSize(file, 2000);
      expect(result).toBe(true);
    });

    it('should reject file exceeding size limit', () => {
      const file = new File(['a'.repeat(2000)], 'test.txt');
      const result = isValidFileSize(file, 1000);
      expect(result).toBe(false);
    });
  });

  describe('validateFile', () => {
    it('should validate all criteria when valid', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const result = validateFile(file, {
        allowedTypes: ['image/jpeg'],
        maxSize: 5 * 1024 * 1024,
        allowedExtensions: ['jpg', 'jpeg'],
      });
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should fail on invalid type', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      const result = validateFile(file, {
        allowedTypes: ['image/jpeg'],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    it('should fail on invalid size', () => {
      const file = new File(['a'.repeat(2000)], 'test.jpg', { type: 'image/jpeg' });
      const result = validateFile(file, {
        maxSize: 1000,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum');
    });

    it('should fail on invalid extension', () => {
      const file = new File([''], 'test.exe', { type: 'application/x-msdownload' });
      const result = validateFile(file, {
        allowedExtensions: ['jpg', 'png'],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });
  });
});
