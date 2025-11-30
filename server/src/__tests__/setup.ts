// ============================================================================
// Test Setup
// Global test configuration and setup
// ============================================================================

import { beforeAll, afterAll, beforeEach } from 'vitest';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.OPENAI_API_KEY = 'sk-test-key';
process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';

// Global setup
beforeAll(() => {
  // Setup that runs once before all tests
  console.log('Starting test suite...');
});

// Global teardown
afterAll(() => {
  // Cleanup that runs once after all tests
  console.log('Test suite completed');
});

// Reset state before each test
beforeEach(() => {
  // Clear any cached modules or state if needed
});
