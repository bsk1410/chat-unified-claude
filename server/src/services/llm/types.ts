// ============================================================================
// LLM Service Types
// Shared types for LLM providers
// ============================================================================

// ----------------------------------------------------------------------------
// Message Types
// ----------------------------------------------------------------------------

export type MessageRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: MessageRole;
  content: string;
}

// ----------------------------------------------------------------------------
// Options Types
// ----------------------------------------------------------------------------

export interface LLMOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stop?: string[];
  presencePenalty?: number;
  frequencyPenalty?: number;
}

export interface EmbeddingOptions {
  model?: string;
  dimensions?: number;
}

export interface StreamOptions extends LLMOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}

// ----------------------------------------------------------------------------
// Response Types
// ----------------------------------------------------------------------------

export interface ChatResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

// ----------------------------------------------------------------------------
// Provider Interface
// ----------------------------------------------------------------------------

export interface LLMProvider {
  name: string;

  /**
   * Generate a chat completion
   */
  chat(messages: ChatMessage[], options?: LLMOptions): Promise<ChatResponse>;

  /**
   * Generate a streaming chat completion
   */
  chatStream(
    messages: ChatMessage[],
    options?: StreamOptions
  ): AsyncGenerator<string, void, unknown>;

  /**
   * Generate embeddings for text
   */
  embed(text: string, options?: EmbeddingOptions): Promise<EmbeddingResponse>;

  /**
   * Generate embeddings for multiple texts (batch)
   */
  embedBatch(texts: string[], options?: EmbeddingOptions): Promise<EmbeddingResponse[]>;

  /**
   * Count tokens in text (provider-specific implementation)
   */
  countTokens(text: string, model?: string): number;
}

// ----------------------------------------------------------------------------
// Cost Tracking
// ----------------------------------------------------------------------------

export interface UsageRecord {
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  timestamp: string;
  operation: 'chat' | 'embedding';
}

// Model pricing per 1M tokens (approximate, update as needed)
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI
  'gpt-4-turbo': { input: 10, output: 30 },
  'gpt-4-turbo-preview': { input: 10, output: 30 },
  'gpt-4o': { input: 5, output: 15 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  'text-embedding-3-small': { input: 0.02, output: 0 },
  'text-embedding-3-large': { input: 0.13, output: 0 },

  // Anthropic
  'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
  'claude-3-5-haiku-20241022': { input: 1, output: 5 },
  'claude-3-opus-20240229': { input: 15, output: 75 },
};

export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;

  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;

  return inputCost + outputCost;
}
