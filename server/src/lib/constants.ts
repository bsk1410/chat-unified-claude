// ============================================================================
// Server Constants - Persona Engine
// All backend constants centralized here for maintainability
// ============================================================================

// ----------------------------------------------------------------------------
// Environment
// ----------------------------------------------------------------------------
export const ENV = {
  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',

  // LLM Providers
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',

  // Server
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_DEVELOPMENT: process.env.NODE_ENV !== 'production',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',

  // Optional: External integrations
  TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN || '',
} as const;

// ----------------------------------------------------------------------------
// Application Info
// ----------------------------------------------------------------------------
export const APP = {
  NAME: 'Persona Engine',
  VERSION: '1.0.0',
  API_VERSION: 'v1',
  API_PREFIX: '/api/v1',
} as const;

// ----------------------------------------------------------------------------
// Persona Engine Configuration
// ----------------------------------------------------------------------------
export const PERSONA_ENGINE = {
  // Token Limits
  MAX_CONTEXT_TOKENS: 32000,
  RESERVE_FOR_RESPONSE: 4000,
  SUMMARIZATION_THRESHOLD: 0.8, // Trigger summarization at 80% of budget

  // Memory Configuration
  MEMORY_RETRIEVAL_COUNT: 5, // Default number of documents to retrieve
  MAX_FACTS_PER_PERSONA: 100,
  MAX_CHUNK_TOKENS: 500, // Max tokens per document chunk
  CHUNK_OVERLAP_TOKENS: 50, // Overlap between chunks

  // Persona Types
  PERSONA_TYPES: ['simulated_person', 'journal_assistant', 'companion', 'custom'] as const,
  MEMORY_STRATEGIES: ['array', 'rag', 'hybrid'] as const,

  // Default values for new personas
  DEFAULT_MAX_CONTEXT_TOKENS: 32000,
  DEFAULT_SUMMARIZATION_THRESHOLD: 0.8,
  DEFAULT_MEMORY_RETRIEVAL_COUNT: 5,
  DEFAULT_MEMORY_STRATEGY: 'array' as const,
} as const;

// ----------------------------------------------------------------------------
// LLM Configuration
// ----------------------------------------------------------------------------
export const LLM = {
  // Provider selection
  DEFAULT_PROVIDER: 'openai' as const,
  PROVIDERS: ['openai', 'anthropic'] as const,

  // OpenAI Models
  OPENAI: {
    CHAT_MODEL: 'gpt-4-turbo',
    CHAT_MODEL_FAST: 'gpt-4o-mini',
    EMBEDDING_MODEL: 'text-embedding-3-small',
    EMBEDDING_DIMENSIONS: 1536,
  },

  // Anthropic Models
  ANTHROPIC: {
    CHAT_MODEL: 'claude-3-5-sonnet-20241022',
    CHAT_MODEL_FAST: 'claude-3-5-haiku-20241022',
  },

  // Generation settings
  DEFAULT_MAX_TOKENS: 2000,
  DEFAULT_TEMPERATURE: 0.7,

  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  RETRY_MULTIPLIER: 2,
} as const;

// ----------------------------------------------------------------------------
// Message Roles
// ----------------------------------------------------------------------------
export const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
} as const;

// ----------------------------------------------------------------------------
// Trade Setup Configuration (for journal_assistant)
// ----------------------------------------------------------------------------
export const TRADE_CONFIG = {
  SETUP_TYPES: [
    'breakout',
    'reversal',
    'continuation',
    'range_play',
    'momentum',
    'mean_reversion',
    'gap_fill',
    'other',
  ] as const,

  OUTCOMES: ['win', 'loss', 'breakeven', 'pending', 'skipped'] as const,

  TIMEFRAMES: ['1m', '5m', '15m', '1h', '4h', 'daily', 'weekly'] as const,
} as const;

// ----------------------------------------------------------------------------
// Fact Categories (for array memory strategy)
// ----------------------------------------------------------------------------
export const FACT_CATEGORIES = [
  'preference',
  'biographical',
  'behavioral',
  'opinion',
  'relationship',
  'goal',
  'trait',
  'other',
] as const;

// ----------------------------------------------------------------------------
// Document Source Types (for RAG strategy)
// ----------------------------------------------------------------------------
export const DOCUMENT_SOURCE_TYPES = [
  'tweet',
  'article',
  'conversation',
  'manual',
  'import',
] as const;

// ----------------------------------------------------------------------------
// Logging Configuration
// ----------------------------------------------------------------------------
export const LOGGING = {
  LEVELS: ['debug', 'info', 'warn', 'error'] as const,
  DEFAULT_LEVEL: 'debug' as const,
  LOG_RETENTION_COUNT: 1000, // Max logs to keep in memory for UI
  INCLUDE_TIMESTAMPS: true,
  INCLUDE_REQUEST_ID: true,
} as const;

export type LogLevel = typeof LOGGING.LEVELS[number];

// ----------------------------------------------------------------------------
// Rate Limiting
// ----------------------------------------------------------------------------
export const RATE_LIMIT = {
  REQUESTS_PER_WINDOW: 60,
  WINDOW_MS: 60000, // 1 minute
  SKIP_SUCCESSFUL_REQUESTS: false,
} as const;

// ----------------------------------------------------------------------------
// CORS Configuration
// ----------------------------------------------------------------------------
export const CORS = {
  ALLOWED_ORIGINS: ENV.IS_DEVELOPMENT
    ? ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173']
    : [], // Add production origins
  ALLOWED_METHODS: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Request-ID'],
  EXPOSE_HEADERS: ['X-Request-ID', 'X-RateLimit-Remaining'],
  MAX_AGE: 86400, // 24 hours
} as const;

// ----------------------------------------------------------------------------
// Error Messages
// ----------------------------------------------------------------------------
export const ERROR_MESSAGES = {
  // Auth
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',
  INVALID_TOKEN: 'Invalid or expired token',

  // Validation
  INVALID_REQUEST: 'Invalid request data',
  MISSING_FIELD: 'Required field missing',

  // Resources
  PERSONA_NOT_FOUND: 'Persona not found',
  CONVERSATION_NOT_FOUND: 'Conversation not found',
  MESSAGE_NOT_FOUND: 'Message not found',
  FACT_NOT_FOUND: 'Fact not found',
  DOCUMENT_NOT_FOUND: 'Document not found',
  TRADE_NOT_FOUND: 'Trade setup not found',

  // Operations
  CONTEXT_TOO_LARGE: 'Message context exceeds token limit',
  EMBEDDING_FAILED: 'Failed to generate embedding',
  LLM_ERROR: 'Language model error',

  // Generic
  INTERNAL_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  RATE_LIMITED: 'Too many requests, please slow down',
} as const;

// ----------------------------------------------------------------------------
// Success Messages
// ----------------------------------------------------------------------------
export const SUCCESS_MESSAGES = {
  PERSONA_CREATED: 'Persona created successfully',
  PERSONA_UPDATED: 'Persona updated successfully',
  PERSONA_DELETED: 'Persona deleted successfully',
  CONVERSATION_CREATED: 'Conversation created successfully',
  CONVERSATION_ARCHIVED: 'Conversation archived successfully',
  FACT_ADDED: 'Fact added successfully',
  DOCUMENT_ADDED: 'Document added successfully',
  IMPORT_STARTED: 'Import started',
  SUMMARIZATION_COMPLETE: 'Summarization complete',
} as const;

// ----------------------------------------------------------------------------
// Type Exports
// ----------------------------------------------------------------------------
export type PersonaType = typeof PERSONA_ENGINE.PERSONA_TYPES[number];
export type MemoryStrategy = typeof PERSONA_ENGINE.MEMORY_STRATEGIES[number];
export type LLMProvider = typeof LLM.PROVIDERS[number];
export type TradeSetupType = typeof TRADE_CONFIG.SETUP_TYPES[number];
export type TradeOutcome = typeof TRADE_CONFIG.OUTCOMES[number];
export type TradeTimeframe = typeof TRADE_CONFIG.TIMEFRAMES[number];
export type FactCategory = typeof FACT_CATEGORIES[number];
export type DocumentSourceType = typeof DOCUMENT_SOURCE_TYPES[number];
