// ============================================================================
// Validation Schemas - Persona Engine
// Zod schemas for request validation
// ============================================================================

import { z } from 'zod';
import { PERSONA_ENGINE, TRADE_CONFIG, FACT_CATEGORIES, DOCUMENT_SOURCE_TYPES } from './constants';

// ----------------------------------------------------------------------------
// Base Schemas
// ----------------------------------------------------------------------------

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// ----------------------------------------------------------------------------
// Persona Schemas
// ----------------------------------------------------------------------------

export const personaTypeSchema = z.enum(PERSONA_ENGINE.PERSONA_TYPES);
export const memoryStrategySchema = z.enum(PERSONA_ENGINE.MEMORY_STRATEGIES);

export const createPersonaSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  type: personaTypeSchema,
  avatar_url: z.string().url().nullable().optional(),
  system_prompt: z.string().min(10, 'System prompt must be at least 10 characters'),
  voice_notes: z.string().max(2000).nullable().optional(),
  memory_strategy: memoryStrategySchema.default('array'),
  max_context_tokens: z.number().int().min(1000).max(128000).default(PERSONA_ENGINE.DEFAULT_MAX_CONTEXT_TOKENS),
  summarization_threshold: z.number().min(0.1).max(1).default(PERSONA_ENGINE.DEFAULT_SUMMARIZATION_THRESHOLD),
  memory_retrieval_count: z.number().int().min(1).max(20).default(PERSONA_ENGINE.DEFAULT_MEMORY_RETRIEVAL_COUNT),
  source_data: z.record(z.unknown()).default({}),
});

export const updatePersonaSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: personaTypeSchema.optional(),
  avatar_url: z.string().url().nullable().optional(),
  system_prompt: z.string().min(10).optional(),
  voice_notes: z.string().max(2000).nullable().optional(),
  memory_strategy: memoryStrategySchema.optional(),
  max_context_tokens: z.number().int().min(1000).max(128000).optional(),
  summarization_threshold: z.number().min(0.1).max(1).optional(),
  memory_retrieval_count: z.number().int().min(1).max(20).optional(),
  source_data: z.record(z.unknown()).optional(),
  is_active: z.boolean().optional(),
});

export type CreatePersonaInput = z.infer<typeof createPersonaSchema>;
export type UpdatePersonaInput = z.infer<typeof updatePersonaSchema>;

// ----------------------------------------------------------------------------
// Conversation Schemas
// ----------------------------------------------------------------------------

export const createConversationSchema = z.object({
  persona_id: uuidSchema,
  title: z.string().max(200).nullable().optional(),
  metadata: z.record(z.unknown()).default({}),
});

export const updateConversationSchema = z.object({
  title: z.string().max(200).nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
  is_archived: z.boolean().optional(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;

// ----------------------------------------------------------------------------
// Chat Schemas
// ----------------------------------------------------------------------------

export const chatRequestSchema = z.object({
  conversation_id: uuidSchema.optional(),
  persona_id: uuidSchema.optional(),
  message: z.string().min(1, 'Message cannot be empty').max(32000, 'Message too long'),
  metadata: z.record(z.unknown()).default({}),
}).refine(
  (data) => data.conversation_id || data.persona_id,
  { message: 'Either conversation_id or persona_id must be provided' }
);

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;

// ----------------------------------------------------------------------------
// Fact Schemas
// ----------------------------------------------------------------------------

export const factCategorySchema = z.enum(FACT_CATEGORIES);

export const createFactSchema = z.object({
  fact_text: z.string().min(3, 'Fact too short').max(500, 'Fact too long'),
  category: factCategorySchema.nullable().optional(),
  importance: z.number().min(0).max(1).default(0.5),
  source_conversation_id: uuidSchema.nullable().optional(),
});

export const updateFactSchema = z.object({
  fact_text: z.string().min(3).max(500).optional(),
  category: factCategorySchema.nullable().optional(),
  importance: z.number().min(0).max(1).optional(),
  is_active: z.boolean().optional(),
});

export type CreateFactInput = z.infer<typeof createFactSchema>;
export type UpdateFactInput = z.infer<typeof updateFactSchema>;

// ----------------------------------------------------------------------------
// Document Schemas
// ----------------------------------------------------------------------------

export const documentSourceTypeSchema = z.enum(DOCUMENT_SOURCE_TYPES);

export const createDocumentSchema = z.object({
  content: z.string().min(10, 'Content too short').max(50000, 'Content too long'),
  source_type: documentSourceTypeSchema.nullable().optional(),
  source_url: z.string().url().nullable().optional(),
  source_metadata: z.record(z.unknown()).default({}),
});

export const searchDocumentsSchema = z.object({
  query: z.string().min(3, 'Query too short').max(1000, 'Query too long'),
  limit: z.number().int().min(1).max(20).default(5),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type SearchDocumentsInput = z.infer<typeof searchDocumentsSchema>;

// ----------------------------------------------------------------------------
// Trade Setup Schemas
// ----------------------------------------------------------------------------

export const tradeSetupTypeSchema = z.enum(TRADE_CONFIG.SETUP_TYPES);
export const tradeOutcomeSchema = z.enum(TRADE_CONFIG.OUTCOMES);
export const tradeTimeframeSchema = z.enum(TRADE_CONFIG.TIMEFRAMES);

export const createTradeSetupSchema = z.object({
  persona_id: uuidSchema,
  ticker: z.string().max(20).nullable().optional(),
  setup_type: tradeSetupTypeSchema.nullable().optional(),
  timeframe: tradeTimeframeSchema.nullable().optional(),
  setup_description: z.string().min(10, 'Description too short').max(5000, 'Description too long'),
  thought_process: z.string().max(5000).nullable().optional(),
  entry_reasoning: z.string().max(2000).nullable().optional(),
  risk_notes: z.string().max(2000).nullable().optional(),
  outcome: tradeOutcomeSchema.nullable().optional(),
  outcome_notes: z.string().max(2000).nullable().optional(),
  pnl_percent: z.number().nullable().optional(),
  tags: z.array(z.string().max(50)).max(10).nullable().optional(),
  trade_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').nullable().optional(),
});

export const updateTradeSetupSchema = z.object({
  ticker: z.string().max(20).nullable().optional(),
  setup_type: tradeSetupTypeSchema.nullable().optional(),
  timeframe: tradeTimeframeSchema.nullable().optional(),
  setup_description: z.string().min(10).max(5000).optional(),
  thought_process: z.string().max(5000).nullable().optional(),
  entry_reasoning: z.string().max(2000).nullable().optional(),
  risk_notes: z.string().max(2000).nullable().optional(),
  outcome: tradeOutcomeSchema.nullable().optional(),
  outcome_notes: z.string().max(2000).nullable().optional(),
  pnl_percent: z.number().nullable().optional(),
  tags: z.array(z.string().max(50)).max(10).nullable().optional(),
  trade_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

export const searchSimilarTradesSchema = z.object({
  query: z.string().min(3).max(1000),
  limit: z.number().int().min(1).max(20).default(5),
  persona_id: uuidSchema.optional(),
});

export type CreateTradeSetupInput = z.infer<typeof createTradeSetupSchema>;
export type UpdateTradeSetupInput = z.infer<typeof updateTradeSetupSchema>;
export type SearchSimilarTradesInput = z.infer<typeof searchSimilarTradesSchema>;

// ----------------------------------------------------------------------------
// Import Schemas
// ----------------------------------------------------------------------------

export const importTextSchema = z.object({
  content: z.string().min(10).max(500000, 'Content too large'),
  source_type: documentSourceTypeSchema.default('manual'),
  source_url: z.string().url().nullable().optional(),
  source_metadata: z.record(z.unknown()).default({}),
});

export const importUrlSchema = z.object({
  url: z.string().url('Invalid URL'),
  source_metadata: z.record(z.unknown()).default({}),
});

export type ImportTextInput = z.infer<typeof importTextSchema>;
export type ImportUrlInput = z.infer<typeof importUrlSchema>;

// ----------------------------------------------------------------------------
// Admin Schemas
// ----------------------------------------------------------------------------

export const updateSettingsSchema = z.object({
  default_max_context_tokens: z.number().int().min(1000).max(128000).optional(),
  default_summarization_threshold: z.number().min(0.1).max(1).optional(),
  default_memory_retrieval_count: z.number().int().min(1).max(20).optional(),
  rate_limit_requests: z.number().int().min(1).optional(),
  rate_limit_window_ms: z.number().int().min(1000).optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

// ----------------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------------

/**
 * Safely parse request body with Zod schema
 */
export function parseBody<T extends z.ZodSchema>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
  return { success: false, error: errors.join('; ') };
}

/**
 * Parse query parameters
 */
export function parseQuery<T extends z.ZodSchema>(
  schema: T,
  params: URLSearchParams
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const obj: Record<string, string> = {};
  params.forEach((value, key) => {
    obj[key] = value;
  });
  return parseBody(schema, obj);
}
