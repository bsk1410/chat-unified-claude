// ============================================================================
// Rate Limiting Tests
// Tests for rate limiting middleware
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { rateLimiter, rateLimitStore } from '../rate-limit';

describe('Rate Limiter Middleware', () => {
  let app: Hono;

  beforeEach(() => {
    // Reset the rate limit store before each test
    rateLimitStore.reset('test-user');
    rateLimitStore.reset('test-ip');

    // Create a fresh app instance
    app = new Hono();
  });

  describe('Basic Rate Limiting', () => {
    it('should allow requests under the limit', async () => {
      app.use('*', rateLimiter({ windowMs: 60000, maxRequests: 5 }));
      app.get('/test', (c) => c.json({ success: true }));

      // Make 5 requests (at the limit)
      for (let i = 0; i < 5; i++) {
        const res = await app.request('/test');
        expect(res.status).toBe(200);
      }
    });

    it('should block requests over the limit', async () => {
      app.use('*', rateLimiter({ windowMs: 60000, maxRequests: 3 }));
      app.get('/test', (c) => c.json({ success: true }));

      // Make 3 allowed requests
      for (let i = 0; i < 3; i++) {
        const res = await app.request('/test');
        expect(res.status).toBe(200);
      }

      // 4th request should be blocked
      const res = await app.request('/test');
      expect(res.status).toBe(429);

      const body = await res.json();
      expect(body.error).toBeDefined();
      expect(body.error.code).toBe('RATE_LIMITED');
    });

    it('should include rate limit headers', async () => {
      app.use('*', rateLimiter({ windowMs: 60000, maxRequests: 10 }));
      app.get('/test', (c) => c.json({ success: true }));

      const res = await app.request('/test');

      expect(res.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(res.headers.get('X-RateLimit-Remaining')).toBe('9');
      expect(res.headers.get('X-RateLimit-Reset')).toBeTruthy();
    });

    it('should decrement remaining count with each request', async () => {
      app.use('*', rateLimiter({ windowMs: 60000, maxRequests: 5 }));
      app.get('/test', (c) => c.json({ success: true }));

      const res1 = await app.request('/test');
      expect(res1.headers.get('X-RateLimit-Remaining')).toBe('4');

      const res2 = await app.request('/test');
      expect(res2.headers.get('X-RateLimit-Remaining')).toBe('3');

      const res3 = await app.request('/test');
      expect(res3.headers.get('X-RateLimit-Remaining')).toBe('2');
    });
  });

  describe('Custom Key Generator', () => {
    it('should use custom key generator', async () => {
      const keyGen = vi.fn((c) => `custom:${c.req.header('X-User-ID')}`);

      app.use('*', rateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        keyGenerator: keyGen,
      }));
      app.get('/test', (c) => c.json({ success: true }));

      await app.request('/test', {
        headers: { 'X-User-ID': 'user123' },
      });

      expect(keyGen).toHaveBeenCalled();
    });

    it('should track limits per user independently', async () => {
      app.use('*', rateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        keyGenerator: (c) => `user:${c.req.header('X-User-ID')}`,
      }));
      app.get('/test', (c) => c.json({ success: true }));

      // User 1 makes 2 requests
      await app.request('/test', { headers: { 'X-User-ID': 'user1' } });
      await app.request('/test', { headers: { 'X-User-ID': 'user1' } });

      // User 1's 3rd request should fail
      const res1 = await app.request('/test', { headers: { 'X-User-ID': 'user1' } });
      expect(res1.status).toBe(429);

      // User 2's first request should succeed
      const res2 = await app.request('/test', { headers: { 'X-User-ID': 'user2' } });
      expect(res2.status).toBe(200);
    });
  });

  describe('Skip Successful Requests', () => {
    it('should not count successful requests when skipSuccessfulRequests is true', async () => {
      app.use('*', rateLimiter({
        windowMs: 60000,
        maxRequests: 3,
        skipSuccessfulRequests: true,
      }));
      app.get('/test', (c) => c.json({ success: true }));

      // Make 5 successful requests
      for (let i = 0; i < 5; i++) {
        const res = await app.request('/test');
        expect(res.status).toBe(200);
      }

      // All should succeed because successful requests aren't counted
    });

    it('should count failed requests when skipSuccessfulRequests is true', async () => {
      app.use('*', rateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        skipSuccessfulRequests: true,
      }));
      app.get('/test', (c) => c.json({ error: 'error' }, 400));

      // Make 2 failed requests
      await app.request('/test');
      await app.request('/test');

      // 3rd failed request should be rate limited
      const res = await app.request('/test');
      expect(res.status).toBe(429);
    });
  });

  describe('Window Expiry', () => {
    it('should reset count after window expires', async () => {
      const windowMs = 100; // 100ms window for fast testing
      app.use('*', rateLimiter({ windowMs, maxRequests: 2 }));
      app.get('/test', (c) => c.json({ success: true }));

      // Make 2 requests (at limit)
      await app.request('/test');
      await app.request('/test');

      // 3rd request should fail
      let res = await app.request('/test');
      expect(res.status).toBe(429);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, windowMs + 10));

      // Next request should succeed
      res = await app.request('/test');
      expect(res.status).toBe(200);
    });
  });

  describe('Custom Handler', () => {
    it('should use custom handler when limit exceeded', async () => {
      const customHandler = vi.fn((c, resetAt) => {
        return c.json({ custom: 'error', resetAt }, 429);
      });

      app.use('*', rateLimiter({
        windowMs: 60000,
        maxRequests: 1,
        handler: customHandler,
      }));
      app.get('/test', (c) => c.json({ success: true }));

      // First request succeeds
      await app.request('/test');

      // Second request triggers custom handler
      const res = await app.request('/test');
      expect(res.status).toBe(429);
      expect(customHandler).toHaveBeenCalled();

      const body = await res.json();
      expect(body.custom).toBe('error');
    });
  });
});
