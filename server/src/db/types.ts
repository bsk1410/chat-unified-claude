// ============================================================================
// Database Types - Persona Engine
// Type definitions matching the Supabase database schema
// ============================================================================

// ----------------------------------------------------------------------------
// Base Types
// ----------------------------------------------------------------------------
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UUID = string;

// ----------------------------------------------------------------------------
// Personas
// ----------------------------------------------------------------------------
export type PersonaType = 'simulated_person' | 'journal_assistant' | 'companion' | 'custom';
export type MemoryStrategy = 'array' | 'rag' | 'hybrid';

export interface Persona {
  id: UUID;
  user_id: UUID;
  name: string;
  type: PersonaType;
  avatar_url: string | null;
  system_prompt: string;
  voice_notes: string | null;
  memory_strategy: MemoryStrategy;
  max_context_tokens: number;
  summarization_threshold: number;
  memory_retrieval_count: number;
  source_data: Json;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PersonaInsert {
  user_id: UUID;
  name: string;
  type: PersonaType;
  avatar_url?: string | null;
  system_prompt: string;
  voice_notes?: string | null;
  memory_strategy?: MemoryStrategy;
  max_context_tokens?: number;
  summarization_threshold?: number;
  memory_retrieval_count?: number;
  source_data?: Json;
  is_active?: boolean;
}

export interface PersonaUpdate {
  name?: string;
  type?: PersonaType;
  avatar_url?: string | null;
  system_prompt?: string;
  voice_notes?: string | null;
  memory_strategy?: MemoryStrategy;
  max_context_tokens?: number;
  summarization_threshold?: number;
  memory_retrieval_count?: number;
  source_data?: Json;
  is_active?: boolean;
}

// ----------------------------------------------------------------------------
// Conversations
// ----------------------------------------------------------------------------
export interface Conversation {
  id: UUID;
  persona_id: UUID;
  user_id: UUID;
  title: string | null;
  summary: string | null;
  summary_token_count: number;
  metadata: Json;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ConversationInsert {
  persona_id: UUID;
  user_id: UUID;
  title?: string | null;
  metadata?: Json;
}

export interface ConversationUpdate {
  title?: string | null;
  summary?: string | null;
  summary_token_count?: number;
  metadata?: Json;
  is_archived?: boolean;
}

// ----------------------------------------------------------------------------
// Messages
// ----------------------------------------------------------------------------
export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: UUID;
  conversation_id: UUID;
  role: MessageRole;
  content: string;
  token_count: number;
  is_summarized: boolean;
  included_in_summary_id: UUID | null;
  metadata: Json;
  created_at: string;
}

export interface MessageInsert {
  conversation_id: UUID;
  role: MessageRole;
  content: string;
  token_count: number;
  metadata?: Json;
}

export interface MessageUpdate {
  is_summarized?: boolean;
  included_in_summary_id?: UUID | null;
  metadata?: Json;
}

// ----------------------------------------------------------------------------
// Persona Facts (Array Memory Strategy)
// ----------------------------------------------------------------------------
export type FactCategory =
  | 'preference'
  | 'biographical'
  | 'behavioral'
  | 'opinion'
  | 'relationship'
  | 'goal'
  | 'trait'
  | 'other';

export interface PersonaFact {
  id: UUID;
  persona_id: UUID;
  user_id: UUID;
  fact_text: string;
  category: FactCategory | null;
  importance: number;
  source_conversation_id: UUID | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PersonaFactInsert {
  persona_id: UUID;
  user_id: UUID;
  fact_text: string;
  category?: FactCategory | null;
  importance?: number;
  source_conversation_id?: UUID | null;
}

export interface PersonaFactUpdate {
  fact_text?: string;
  category?: FactCategory | null;
  importance?: number;
  is_active?: boolean;
}

// ----------------------------------------------------------------------------
// Persona Documents (RAG Memory Strategy)
// ----------------------------------------------------------------------------
export type DocumentSourceType = 'tweet' | 'article' | 'conversation' | 'manual' | 'import';

export interface PersonaDocument {
  id: UUID;
  persona_id: UUID;
  user_id: UUID;
  content: string;
  embedding: number[] | null; // Vector(1536)
  source_type: DocumentSourceType | null;
  source_url: string | null;
  source_metadata: Json;
  chunk_index: number | null;
  created_at: string;
  deleted_at: string | null;
}

export interface PersonaDocumentInsert {
  persona_id: UUID;
  user_id: UUID;
  content: string;
  embedding?: number[] | null;
  source_type?: DocumentSourceType | null;
  source_url?: string | null;
  source_metadata?: Json;
  chunk_index?: number | null;
}

// ----------------------------------------------------------------------------
// Trade Setups (Journal Assistant)
// ----------------------------------------------------------------------------
export type TradeSetupType =
  | 'breakout'
  | 'reversal'
  | 'continuation'
  | 'range_play'
  | 'momentum'
  | 'mean_reversion'
  | 'gap_fill'
  | 'other';

export type TradeOutcome = 'win' | 'loss' | 'breakeven' | 'pending' | 'skipped';

export type TradeTimeframe = '1m' | '5m' | '15m' | '1h' | '4h' | 'daily' | 'weekly';

export interface TradeSetup {
  id: UUID;
  persona_id: UUID;
  user_id: UUID;
  ticker: string | null;
  setup_type: TradeSetupType | null;
  timeframe: TradeTimeframe | null;
  setup_description: string;
  thought_process: string | null;
  entry_reasoning: string | null;
  risk_notes: string | null;
  outcome: TradeOutcome | null;
  outcome_notes: string | null;
  pnl_percent: number | null;
  embedding: number[] | null;
  tags: string[] | null;
  trade_date: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TradeSetupInsert {
  persona_id: UUID;
  user_id: UUID;
  ticker?: string | null;
  setup_type?: TradeSetupType | null;
  timeframe?: TradeTimeframe | null;
  setup_description: string;
  thought_process?: string | null;
  entry_reasoning?: string | null;
  risk_notes?: string | null;
  outcome?: TradeOutcome | null;
  outcome_notes?: string | null;
  pnl_percent?: number | null;
  tags?: string[] | null;
  trade_date?: string | null;
}

export interface TradeSetupUpdate {
  ticker?: string | null;
  setup_type?: TradeSetupType | null;
  timeframe?: TradeTimeframe | null;
  setup_description?: string;
  thought_process?: string | null;
  entry_reasoning?: string | null;
  risk_notes?: string | null;
  outcome?: TradeOutcome | null;
  outcome_notes?: string | null;
  pnl_percent?: number | null;
  tags?: string[] | null;
  trade_date?: string | null;
}

// ----------------------------------------------------------------------------
// Conversation Summaries
// ----------------------------------------------------------------------------
export interface ConversationSummary {
  id: UUID;
  conversation_id: UUID;
  summary_text: string;
  token_count: number;
  messages_summarized: UUID[];
  message_range_start: string | null;
  message_range_end: string | null;
  created_at: string;
}

export interface ConversationSummaryInsert {
  conversation_id: UUID;
  summary_text: string;
  token_count: number;
  messages_summarized: UUID[];
  message_range_start?: string | null;
  message_range_end?: string | null;
}

// ----------------------------------------------------------------------------
// Vector Search Results
// ----------------------------------------------------------------------------
export interface DocumentSearchResult {
  id: UUID;
  content: string;
  similarity: number;
  source_type?: DocumentSourceType | null;
  source_url?: string | null;
}

export interface TradeSearchResult {
  id: UUID;
  setup_description: string;
  thought_process: string | null;
  outcome: TradeOutcome | null;
  outcome_notes: string | null;
  pnl_percent: number | null;
  similarity: number;
}

// ----------------------------------------------------------------------------
// API Response Types
// ----------------------------------------------------------------------------
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ChatResponse {
  message: Message;
  conversation_id: UUID;
  token_usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface StreamChunk {
  type: 'chunk' | 'done' | 'error';
  content?: string;
  message_id?: UUID;
  error?: string;
}

// ----------------------------------------------------------------------------
// Context Assembly Types
// ----------------------------------------------------------------------------
export interface AssembledContext {
  systemPrompt: string;
  messages: Array<{
    role: MessageRole;
    content: string;
  }>;
  injectedMemories: string;
  totalTokens: number;
  wasTruncated: boolean;
  summarizationTriggered: boolean;
}

// ----------------------------------------------------------------------------
// Import Types
// ----------------------------------------------------------------------------
export interface ImportResult {
  success: boolean;
  documentsCreated: number;
  totalChunks: number;
  errors: string[];
}

export interface ImportProgress {
  status: 'pending' | 'processing' | 'complete' | 'error';
  progress: number;
  message: string;
  result?: ImportResult;
}
