// ============================================================================
// Persona Engine Types
// Frontend type definitions for the persona engine
// ============================================================================

import type { PersonaType, MemoryStrategy, TradeSetupType, TradeOutcome, TradeTimeframe, FactCategory } from '../lib/constants';

// ----------------------------------------------------------------------------
// Persona Types
// ----------------------------------------------------------------------------

export interface Persona {
  id: string;
  user_id: string;
  name: string;
  type: PersonaType;
  avatar_url: string | null;
  system_prompt: string;
  voice_notes: string | null;
  memory_strategy: MemoryStrategy;
  max_context_tokens: number;
  summarization_threshold: number;
  memory_retrieval_count: number;
  source_data: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PersonaCreate {
  name: string;
  type: PersonaType;
  avatar_url?: string | null;
  system_prompt: string;
  voice_notes?: string | null;
  memory_strategy?: MemoryStrategy;
  max_context_tokens?: number;
  summarization_threshold?: number;
  memory_retrieval_count?: number;
  source_data?: Record<string, unknown>;
}

export interface PersonaUpdate extends Partial<PersonaCreate> {
  is_active?: boolean;
}

// ----------------------------------------------------------------------------
// Conversation Types
// ----------------------------------------------------------------------------

export interface Conversation {
  id: string;
  persona_id: string;
  user_id: string;
  title: string | null;
  summary: string | null;
  summary_token_count: number;
  metadata: Record<string, unknown>;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  personas?: Persona;
}

export interface ConversationCreate {
  persona_id: string;
  title?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

// ----------------------------------------------------------------------------
// Message Types
// ----------------------------------------------------------------------------

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  token_count: number;
  is_summarized: boolean;
  included_in_summary_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ----------------------------------------------------------------------------
// Chat Types
// ----------------------------------------------------------------------------

export interface ChatRequest {
  conversation_id?: string;
  persona_id?: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface ChatResponse {
  message: Message;
  conversation_id: string;
  token_usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface StreamChunk {
  type: 'start' | 'chunk' | 'done' | 'error';
  conversation_id?: string;
  content?: string;
  message_id?: string;
  token_count?: number;
  error?: string;
}

// ----------------------------------------------------------------------------
// Fact Types
// ----------------------------------------------------------------------------

export interface PersonaFact {
  id: string;
  persona_id: string;
  user_id: string;
  fact_text: string;
  category: FactCategory | null;
  importance: number;
  source_conversation_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface FactCreate {
  fact_text: string;
  category?: FactCategory | null;
  importance?: number;
  source_conversation_id?: string | null;
}

export interface FactUpdate {
  fact_text?: string;
  category?: FactCategory | null;
  importance?: number;
  is_active?: boolean;
}

// ----------------------------------------------------------------------------
// Document Types
// ----------------------------------------------------------------------------

export interface PersonaDocument {
  id: string;
  persona_id: string;
  user_id: string;
  content: string;
  source_type: string | null;
  source_url: string | null;
  chunk_index: number | null;
  created_at: string;
  deleted_at: string | null;
}

export interface DocumentCreate {
  content: string;
  source_type?: string | null;
  source_url?: string | null;
  source_metadata?: Record<string, unknown>;
}

export interface DocumentSearchResult {
  id: string;
  content: string;
  source_type: string | null;
  source_url: string | null;
  similarity: number;
}

// ----------------------------------------------------------------------------
// Trade Setup Types
// ----------------------------------------------------------------------------

export interface TradeSetup {
  id: string;
  persona_id: string;
  user_id: string;
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
  tags: string[] | null;
  trade_date: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TradeSetupCreate {
  persona_id: string;
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

export type TradeSetupUpdate = Partial<Omit<TradeSetupCreate, 'persona_id'>>;

export interface TradeSearchResult {
  id: string;
  ticker: string | null;
  setup_type: TradeSetupType | null;
  setup_description: string;
  thought_process: string | null;
  outcome: TradeOutcome | null;
  outcome_notes: string | null;
  pnl_percent: number | null;
  trade_date: string | null;
  similarity: number;
}

// ----------------------------------------------------------------------------
// Debug Log Types
// ----------------------------------------------------------------------------

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: unknown;
  requestId?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// ----------------------------------------------------------------------------
// API Response Types
// ----------------------------------------------------------------------------

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: {
    message: string;
    code?: string;
  };
  requestId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total?: number;
    hasMore?: boolean;
  };
}

// ----------------------------------------------------------------------------
// Admin Types
// ----------------------------------------------------------------------------

export interface UsageStats {
  personas: number;
  conversations: number;
  messages: number;
  documents: number;
  trade_setups: number;
  total_tokens_used: number;
}
