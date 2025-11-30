// ============================================================================
// LLM Service Index
// Factory and exports for LLM providers
// ============================================================================

import { LLM, LLMProvider as LLMProviderType, ENV } from '../../lib/constants';
import { logger, LOG_CATEGORIES } from '../logger';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { LLMProvider, ChatMessage, ChatResponse, LLMOptions, StreamOptions, EmbeddingResponse, EmbeddingOptions } from './types';

// Re-export types
export * from './types';

// ----------------------------------------------------------------------------
// Provider Cache
// ----------------------------------------------------------------------------

const providerCache: Map<string, LLMProvider> = new Map();

// ----------------------------------------------------------------------------
// Provider Factory
// ----------------------------------------------------------------------------

/**
 * Get an LLM provider instance
 */
export function getLLMProvider(providerName?: LLMProviderType): LLMProvider {
  const name = providerName || LLM.DEFAULT_PROVIDER;

  // Check cache
  if (providerCache.has(name)) {
    return providerCache.get(name)!;
  }

  // Create provider
  let provider: LLMProvider;

  switch (name) {
    case 'openai':
      provider = new OpenAIProvider();
      break;
    case 'anthropic':
      provider = new AnthropicProvider();
      break;
    default:
      throw new Error(`Unknown LLM provider: ${name}`);
  }

  // Cache and return
  providerCache.set(name, provider);
  logger.debug(LOG_CATEGORIES.LLM, `LLM provider created: ${name}`);

  return provider;
}

/**
 * Get the OpenAI provider (for embeddings)
 */
export function getEmbeddingProvider(): LLMProvider {
  // Always use OpenAI for embeddings (Anthropic doesn't provide them)
  return getLLMProvider('openai');
}

// ----------------------------------------------------------------------------
// LLM Service Class
// High-level service with retry logic and provider fallback
// ----------------------------------------------------------------------------

class LLMService {
  private defaultProvider: LLMProviderType;

  constructor() {
    this.defaultProvider = LLM.DEFAULT_PROVIDER;
  }

  /**
   * Set the default provider
   */
  setDefaultProvider(provider: LLMProviderType): void {
    this.defaultProvider = provider;
    logger.info(LOG_CATEGORIES.LLM, `Default LLM provider set to: ${provider}`);
  }

  /**
   * Generate a chat completion with retry logic
   */
  async chat(
    messages: ChatMessage[],
    options?: LLMOptions & { provider?: LLMProviderType }
  ): Promise<ChatResponse> {
    const providerName = options?.provider || this.defaultProvider;
    const provider = getLLMProvider(providerName);

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= LLM.MAX_RETRIES; attempt++) {
      try {
        return await provider.chat(messages, options);
      } catch (error) {
        lastError = error as Error;
        logger.warn(LOG_CATEGORIES.LLM, `Chat attempt ${attempt} failed`, {
          provider: providerName,
          error: lastError.message,
        });

        if (attempt < LLM.MAX_RETRIES) {
          const delay = LLM.RETRY_DELAY_MS * Math.pow(LLM.RETRY_MULTIPLIER, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Generate a streaming chat completion
   */
  async *chatStream(
    messages: ChatMessage[],
    options?: StreamOptions & { provider?: LLMProviderType }
  ): AsyncGenerator<string, void, unknown> {
    const providerName = options?.provider || this.defaultProvider;
    const provider = getLLMProvider(providerName);

    yield* provider.chatStream(messages, options);
  }

  /**
   * Generate embeddings with retry logic
   */
  async embed(text: string, options?: EmbeddingOptions): Promise<EmbeddingResponse> {
    const provider = getEmbeddingProvider();

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= LLM.MAX_RETRIES; attempt++) {
      try {
        return await provider.embed(text, options);
      } catch (error) {
        lastError = error as Error;
        logger.warn(LOG_CATEGORIES.EMBEDDING, `Embedding attempt ${attempt} failed`, {
          error: lastError.message,
        });

        if (attempt < LLM.MAX_RETRIES) {
          const delay = LLM.RETRY_DELAY_MS * Math.pow(LLM.RETRY_MULTIPLIER, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Generate embeddings for multiple texts
   */
  async embedBatch(texts: string[], options?: EmbeddingOptions): Promise<EmbeddingResponse[]> {
    const provider = getEmbeddingProvider();
    return provider.embedBatch(texts, options);
  }

  /**
   * Count tokens
   */
  countTokens(text: string, model?: string): number {
    const provider = getLLMProvider();
    return provider.countTokens(text, model);
  }

  /**
   * Check if a provider is available
   */
  isProviderAvailable(providerName: LLMProviderType): boolean {
    switch (providerName) {
      case 'openai':
        return !!ENV.OPENAI_API_KEY;
      case 'anthropic':
        return !!ENV.ANTHROPIC_API_KEY;
      default:
        return false;
    }
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): LLMProviderType[] {
    return LLM.PROVIDERS.filter((p) => this.isProviderAvailable(p));
  }
}

// ----------------------------------------------------------------------------
// Singleton Instance
// ----------------------------------------------------------------------------

export const llmService = new LLMService();

// ----------------------------------------------------------------------------
// Convenience Functions
// ----------------------------------------------------------------------------

/**
 * Quick chat function
 */
export async function chat(
  messages: ChatMessage[],
  options?: LLMOptions & { provider?: LLMProviderType }
): Promise<ChatResponse> {
  return llmService.chat(messages, options);
}

/**
 * Quick streaming chat function
 */
export async function* chatStream(
  messages: ChatMessage[],
  options?: StreamOptions & { provider?: LLMProviderType }
): AsyncGenerator<string, void, unknown> {
  yield* llmService.chatStream(messages, options);
}

/**
 * Quick embed function
 */
export async function embed(text: string, options?: EmbeddingOptions): Promise<EmbeddingResponse> {
  return llmService.embed(text, options);
}

/**
 * Quick batch embed function
 */
export async function embedBatch(texts: string[], options?: EmbeddingOptions): Promise<EmbeddingResponse[]> {
  return llmService.embedBatch(texts, options);
}
