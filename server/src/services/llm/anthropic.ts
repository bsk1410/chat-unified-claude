// ============================================================================
// Anthropic LLM Provider
// Implementation of LLMProvider interface for Anthropic Claude
// ============================================================================

import Anthropic from '@anthropic-ai/sdk';
import { ENV, LLM } from '../../lib/constants';
import { logger, LOG_CATEGORIES } from '../logger';
import { countTokens } from '../token-counter';
import {
  LLMProvider,
  ChatMessage,
  ChatResponse,
  LLMOptions,
  StreamOptions,
  EmbeddingResponse,
  calculateCost,
} from './types';

// ----------------------------------------------------------------------------
// Anthropic Provider Class
// ----------------------------------------------------------------------------

export class AnthropicProvider implements LLMProvider {
  name = 'anthropic';
  private client: Anthropic;

  constructor(apiKey?: string) {
    const key = apiKey || ENV.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error('Anthropic API key not configured');
    }

    this.client = new Anthropic({ apiKey: key });
    logger.debug(LOG_CATEGORIES.LLM, 'Anthropic provider initialized');
  }

  /**
   * Convert messages to Anthropic format
   * Anthropic uses a separate system parameter
   */
  private formatMessages(messages: ChatMessage[]): {
    system: string | undefined;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  } {
    let system: string | undefined;
    const formattedMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        // Combine system messages
        system = system ? `${system}\n\n${msg.content}` : msg.content;
      } else {
        formattedMessages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    // Anthropic requires alternating user/assistant messages
    // Ensure messages start with user
    if (formattedMessages.length > 0 && formattedMessages[0].role === 'assistant') {
      formattedMessages.unshift({ role: 'user', content: '[Conversation continues]' });
    }

    return { system, messages: formattedMessages };
  }

  /**
   * Generate a chat completion
   */
  async chat(messages: ChatMessage[], options?: LLMOptions): Promise<ChatResponse> {
    const model = options?.model || LLM.ANTHROPIC.CHAT_MODEL;
    const maxTokens = options?.maxTokens || LLM.DEFAULT_MAX_TOKENS;
    const temperature = options?.temperature ?? LLM.DEFAULT_TEMPERATURE;

    const { system, messages: formattedMessages } = this.formatMessages(messages);

    logger.debug(LOG_CATEGORIES.LLM, 'Anthropic chat request', {
      model,
      messageCount: formattedMessages.length,
      hasSystem: !!system,
      maxTokens,
    });

    try {
      const startTime = performance.now();

      const response = await this.client.messages.create({
        model,
        max_tokens: maxTokens,
        system,
        messages: formattedMessages,
        temperature,
        top_p: options?.topP,
        stop_sequences: options?.stop,
      });

      const duration = Math.round(performance.now() - startTime);

      // Extract text content
      const textContent = response.content.find((block) => block.type === 'text');
      const content = textContent?.type === 'text' ? textContent.text : '';

      const result: ChatResponse = {
        content,
        model: response.model,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        finishReason: response.stop_reason || 'unknown',
      };

      const cost = calculateCost(model, result.usage.promptTokens, result.usage.completionTokens);

      logger.info(LOG_CATEGORIES.LLM, 'Anthropic chat complete', {
        model: result.model,
        tokens: result.usage.totalTokens,
        cost: `$${cost.toFixed(4)}`,
        duration: `${duration}ms`,
      });

      return result;
    } catch (error) {
      logger.error(LOG_CATEGORIES.LLM, 'Anthropic chat error', error as Error);
      throw error;
    }
  }

  /**
   * Generate a streaming chat completion
   */
  async *chatStream(
    messages: ChatMessage[],
    options?: StreamOptions
  ): AsyncGenerator<string, void, unknown> {
    const model = options?.model || LLM.ANTHROPIC.CHAT_MODEL;
    const maxTokens = options?.maxTokens || LLM.DEFAULT_MAX_TOKENS;
    const temperature = options?.temperature ?? LLM.DEFAULT_TEMPERATURE;

    const { system, messages: formattedMessages } = this.formatMessages(messages);

    logger.debug(LOG_CATEGORIES.LLM, 'Anthropic stream request', {
      model,
      messageCount: formattedMessages.length,
    });

    try {
      const stream = await this.client.messages.stream({
        model,
        max_tokens: maxTokens,
        system,
        messages: formattedMessages,
        temperature,
        top_p: options?.topP,
        stop_sequences: options?.stop,
      });

      let fullResponse = '';

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          const content = event.delta.text;
          if (content) {
            fullResponse += content;
            options?.onChunk?.(content);
            yield content;
          }
        }
      }

      options?.onComplete?.(fullResponse);

      logger.info(LOG_CATEGORIES.LLM, 'Anthropic stream complete', {
        model,
        responseLength: fullResponse.length,
      });
    } catch (error) {
      logger.error(LOG_CATEGORIES.LLM, 'Anthropic stream error', error as Error);
      options?.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Generate embeddings for text
   * Note: Anthropic does not provide embeddings, so we throw an error
   * Use OpenAI for embeddings instead
   */
  async embed(): Promise<EmbeddingResponse> {
    throw new Error('Anthropic does not provide embeddings. Use OpenAI provider for embeddings.');
  }

  /**
   * Generate embeddings for multiple texts
   */
  async embedBatch(): Promise<EmbeddingResponse[]> {
    throw new Error('Anthropic does not provide embeddings. Use OpenAI provider for embeddings.');
  }

  /**
   * Count tokens in text
   * Note: Using tiktoken approximation for Claude
   */
  countTokens(text: string): number {
    // Claude uses a similar tokenizer to GPT models
    return countTokens(text, 'claude-3');
  }
}
