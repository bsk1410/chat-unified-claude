// ============================================================================
// Token Counter Service
// Accurate token counting using tiktoken
// ============================================================================

import { encodingForModel, getEncoding, Tiktoken } from 'js-tiktoken';
import { logger, LOG_CATEGORIES } from './logger';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type ModelEncoding = 'cl100k_base' | 'o200k_base' | 'p50k_base';

interface TokenCountCache {
  text: string;
  count: number;
  encoding: ModelEncoding;
}

// ----------------------------------------------------------------------------
// Token Counter Class
// ----------------------------------------------------------------------------

class TokenCounter {
  private encoders: Map<ModelEncoding, Tiktoken> = new Map();
  private cache: Map<string, TokenCountCache> = new Map();
  private maxCacheSize = 1000;
  private defaultEncoding: ModelEncoding = 'cl100k_base';

  constructor() {
    // Pre-initialize the default encoder
    this.getEncoder(this.defaultEncoding);
  }

  /**
   * Get or create an encoder for a specific encoding
   */
  private getEncoder(encoding: ModelEncoding): Tiktoken {
    let encoder = this.encoders.get(encoding);

    if (!encoder) {
      try {
        encoder = getEncoding(encoding);
        this.encoders.set(encoding, encoder);
        logger.debug(LOG_CATEGORIES.LLM, `Initialized encoder: ${encoding}`);
      } catch (error) {
        logger.error(LOG_CATEGORIES.LLM, `Failed to initialize encoder: ${encoding}`, error as Error);
        throw error;
      }
    }

    return encoder;
  }

  /**
   * Get the appropriate encoding for a model
   */
  private getEncodingForModel(model: string): ModelEncoding {
    // GPT-4, GPT-3.5-turbo, text-embedding-3-*, etc.
    if (
      model.includes('gpt-4') ||
      model.includes('gpt-3.5') ||
      model.includes('text-embedding')
    ) {
      return 'cl100k_base';
    }

    // GPT-4o models use o200k_base
    if (model.includes('gpt-4o') || model.includes('o1')) {
      return 'o200k_base';
    }

    // Claude models - use cl100k_base as approximation
    if (model.includes('claude')) {
      return 'cl100k_base';
    }

    // Default
    return this.defaultEncoding;
  }

  /**
   * Generate a cache key
   */
  private getCacheKey(text: string, encoding: ModelEncoding): string {
    // Use first 100 chars + length + encoding as key for quick lookups
    return `${text.slice(0, 100)}_${text.length}_${encoding}`;
  }

  /**
   * Count tokens in text
   */
  count(text: string, model?: string): number {
    if (!text) return 0;

    const encoding = model ? this.getEncodingForModel(model) : this.defaultEncoding;
    const cacheKey = this.getCacheKey(text, encoding);

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && cached.text === text && cached.encoding === encoding) {
      return cached.count;
    }

    // Count tokens
    const encoder = this.getEncoder(encoding);
    const tokens = encoder.encode(text);
    const count = tokens.length;

    // Update cache
    if (this.cache.size >= this.maxCacheSize) {
      // Remove oldest entries (first 10%)
      const keysToDelete = Array.from(this.cache.keys()).slice(0, this.maxCacheSize / 10);
      keysToDelete.forEach((key) => this.cache.delete(key));
    }

    this.cache.set(cacheKey, { text, count, encoding });

    return count;
  }

  /**
   * Count tokens in an array of messages (chat format)
   */
  countMessages(
    messages: Array<{ role: string; content: string }>,
    model?: string
  ): number {
    // Base tokens for message formatting (varies by model, using approximation)
    const tokensPerMessage = 4; // <im_start>, role, \n, content, <im_end>
    const tokensPerName = 1;

    let total = 0;

    for (const message of messages) {
      total += tokensPerMessage;
      total += this.count(message.role, model);
      total += this.count(message.content, model);
    }

    // Add base tokens for reply priming
    total += 3;

    return total;
  }

  /**
   * Estimate tokens for a chat context (system + messages)
   */
  estimateContextTokens(
    systemPrompt: string,
    messages: Array<{ role: string; content: string }>,
    model?: string
  ): number {
    const systemTokens = this.count(systemPrompt, model) + 4; // system message formatting
    const messageTokens = this.countMessages(messages, model);
    return systemTokens + messageTokens;
  }

  /**
   * Truncate text to fit within a token limit
   */
  truncateToTokens(text: string, maxTokens: number, model?: string): string {
    const encoding = model ? this.getEncodingForModel(model) : this.defaultEncoding;
    const encoder = this.getEncoder(encoding);

    const tokens = encoder.encode(text);

    if (tokens.length <= maxTokens) {
      return text;
    }

    // Truncate and decode
    const truncatedTokens = tokens.slice(0, maxTokens);
    return encoder.decode(truncatedTokens);
  }

  /**
   * Split text into chunks of approximately equal token counts
   */
  chunkByTokens(
    text: string,
    maxTokensPerChunk: number,
    overlapTokens: number = 0,
    model?: string
  ): string[] {
    const encoding = model ? this.getEncodingForModel(model) : this.defaultEncoding;
    const encoder = this.getEncoder(encoding);

    const tokens = encoder.encode(text);
    const chunks: string[] = [];

    let start = 0;
    while (start < tokens.length) {
      const end = Math.min(start + maxTokensPerChunk, tokens.length);
      const chunkTokens = tokens.slice(start, end);
      chunks.push(encoder.decode(chunkTokens));

      // Move start, accounting for overlap
      start = end - overlapTokens;
      if (start >= tokens.length || end === tokens.length) break;
    }

    return chunks;
  }

  /**
   * Clear the token count cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.debug(LOG_CATEGORIES.LLM, 'Token count cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
    };
  }
}

// ----------------------------------------------------------------------------
// Singleton Instance
// ----------------------------------------------------------------------------

export const tokenCounter = new TokenCounter();

// ----------------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------------

/**
 * Quick token count function
 */
export function countTokens(text: string, model?: string): number {
  return tokenCounter.count(text, model);
}

/**
 * Count tokens in chat messages
 */
export function countMessageTokens(
  messages: Array<{ role: string; content: string }>,
  model?: string
): number {
  return tokenCounter.countMessages(messages, model);
}

/**
 * Estimate full context token count
 */
export function estimateContextTokens(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  model?: string
): number {
  return tokenCounter.estimateContextTokens(systemPrompt, messages, model);
}

/**
 * Chunk text by tokens
 */
export function chunkText(
  text: string,
  maxTokensPerChunk: number,
  overlapTokens: number = 0,
  model?: string
): string[] {
  return tokenCounter.chunkByTokens(text, maxTokensPerChunk, overlapTokens, model);
}
