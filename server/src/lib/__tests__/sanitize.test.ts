// ============================================================================
// Sanitization Tests
// Comprehensive tests for input sanitization utilities
// ============================================================================

import { describe, it, expect } from 'vitest';
import { sanitize, escapeHtml, removeScripts, sanitizeUrl, sanitizeUserContent } from '../sanitize';

describe('sanitize', () => {
  describe('escapeHtml', () => {
    it('should escape HTML entities', () => {
      const input = '<script>alert("xss")</script>';
      const output = escapeHtml(input);
      expect(output).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    it('should escape ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape quotes', () => {
      expect(escapeHtml('He said "hello"')).toBe('He said &quot;hello&quot;');
      expect(escapeHtml("It's working")).toBe('It&#x27;s working');
    });

    it('should handle empty strings', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should handle strings without special characters', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
    });
  });

  describe('removeScripts', () => {
    it('should remove script tags', () => {
      const input = '<div>Hello</div><script>alert("xss")</script><p>World</p>';
      const output = removeScripts(input);
      expect(output).not.toContain('<script');
      expect(output).toContain('<div>Hello</div>');
      expect(output).toContain('<p>World</p>');
    });

    it('should remove multiple script tags', () => {
      const input = '<script>bad1()</script>Hello<script>bad2()</script>';
      const output = removeScripts(input);
      expect(output).toBe('Hello');
    });

    it('should handle script tags with attributes', () => {
      const input = '<script type="text/javascript" src="evil.js">alert("xss")</script>';
      const output = removeScripts(input);
      expect(output).not.toContain('script');
    });

    it('should handle case-insensitive script tags', () => {
      const input = '<SCRIPT>alert("xss")</SCRIPT>';
      const output = removeScripts(input);
      expect(output).not.toContain('SCRIPT');
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow safe HTTP URLs', () => {
      const url = 'http://example.com';
      expect(sanitizeUrl(url)).toBe(url);
    });

    it('should allow safe HTTPS URLs', () => {
      const url = 'https://example.com/path?query=value';
      expect(sanitizeUrl(url)).toBe(url);
    });

    it('should block javascript: URLs', () => {
      const url = 'javascript:alert("xss")';
      expect(sanitizeUrl(url)).toBe('');
    });

    it('should block data: URLs', () => {
      const url = 'data:text/html,<script>alert("xss")</script>';
      expect(sanitizeUrl(url)).toBe('');
    });

    it('should block vbscript: URLs', () => {
      const url = 'vbscript:msgbox("xss")';
      expect(sanitizeUrl(url)).toBe('');
    });

    it('should block file: URLs', () => {
      const url = 'file:///etc/passwd';
      expect(sanitizeUrl(url)).toBe('');
    });

    it('should handle case-insensitive protocols', () => {
      const url = 'JAVASCRIPT:alert("xss")';
      expect(sanitizeUrl(url)).toBe('');
    });

    it('should trim whitespace', () => {
      const url = '  https://example.com  ';
      expect(sanitizeUrl(url)).toBe(url.trim());
    });
  });

  describe('sanitizeUserContent', () => {
    it('should remove all dangerous content', () => {
      const input = '<script>alert("xss")</script><p onclick="bad()">Hello</p>';
      const output = sanitizeUserContent(input);
      expect(output).not.toContain('script');
      expect(output).not.toContain('onclick');
    });

    it('should escape remaining HTML', () => {
      const input = '<div>Hello</div>';
      const output = sanitizeUserContent(input);
      expect(output).toContain('&lt;');
      expect(output).toContain('&gt;');
    });

    it('should handle empty input', () => {
      expect(sanitizeUserContent('')).toBe('');
    });

    it('should preserve plain text', () => {
      const input = 'Hello World!';
      expect(sanitizeUserContent(input)).toBe(input);
    });

    it('should remove iframes', () => {
      const input = '<iframe src="evil.com"></iframe>Hello';
      const output = sanitizeUserContent(input);
      expect(output).not.toContain('iframe');
    });
  });

  describe('sanitize.email', () => {
    it('should lowercase email', () => {
      expect(sanitize.email('Test@Example.COM')).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      expect(sanitize.email('  test@example.com  ')).toBe('test@example.com');
    });
  });

  describe('sanitize.filename', () => {
    it('should remove path components', () => {
      expect(sanitize.filename('/path/to/file.txt')).toBe('file.txt');
      expect(sanitize.filename('..\\..\\file.txt')).toBe('file.txt');
    });

    it('should remove invalid characters', () => {
      const filename = 'file<>:"|?*.txt';
      const result = sanitize.filename(filename);
      expect(result).not.toMatch(/[<>:"|?*]/);
    });

    it('should limit filename length', () => {
      const longName = 'a'.repeat(300) + '.txt';
      const result = sanitize.filename(longName);
      expect(result.length).toBeLessThanOrEqual(255);
    });

    it('should prevent directory traversal', () => {
      expect(sanitize.filename('../../../etc/passwd')).toBe('etcpasswd');
    });
  });

  describe('sanitize.containsSuspicious', () => {
    it('should detect script tags', () => {
      expect(sanitize.containsSuspicious('<script>')).toBe(true);
    });

    it('should detect javascript: protocol', () => {
      expect(sanitize.containsSuspicious('javascript:alert(1)')).toBe(true);
    });

    it('should detect event handlers', () => {
      expect(sanitize.containsSuspicious('<div onclick="bad()">')).toBe(true);
      expect(sanitize.containsSuspicious('<img onerror="bad()">')).toBe(true);
    });

    it('should detect iframes', () => {
      expect(sanitize.containsSuspicious('<iframe src="evil.com">')).toBe(true);
    });

    it('should return false for safe content', () => {
      expect(sanitize.containsSuspicious('Hello World')).toBe(false);
      expect(sanitize.containsSuspicious('<p>Safe paragraph</p>')).toBe(false);
    });
  });
});
