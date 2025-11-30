// ============================================================================
// OpenAI LLM Provider
// Implementation of LLMProvider interface for OpenAI
// ============================================================================

import OpenAI from 'openai';
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
  EmbeddingOptions,
  calculateCost,
} from './types';

// ----------------------------------------------------------------------------
// OpenAI Provider Class
// ----------------------------------------------------------------------------

export class OpenAIProvider implements LLMProvider {
  name = 'openai';
  private client: OpenAI;

  constructor(apiKey?: string) {
    const key = apiKey || ENV.OPENAI_API_KEY;
    if (!key) {
      throw new Error('OpenAI API key not configured');
    }

    this.client = new OpenAI({ apiKey: key });
    logger.debug(LOG_CATEGORIES.LLM, 'OpenAI provider initialized');
  }

  /**
   * Generate a chat completion
   */
  async chat(messages: ChatMessage[], options?: LLMOptions): Promise<ChatResponse> {
    const model = options?.model || LLM.OPENAI.CHAT_MODEL;
    const maxTokens = options?.maxTokens || LLM.DEFAULT_MAX_TOKENS;
    const temperature = options?.temperature ?? LLM.DEFAULT_TEMPERATURE;

    logger.debug(LOG_CATEGORIES.LLM, 'OpenAI chat request', {
      model,
      messageCount: messages.length,
      maxTokens,
    });

    try {
      const startTime = performance.now();

      const response = await this.client.chat.completions.create({
        model,
        messages: messages.map((m) => ({
          role: m.role as 'system' | 'user' | 'assistant',
          content: m.content,
        })),
        max_tokens: maxTokens,
        temperature,
        top_p: options?.topP,
        stop: options?.stop,
        presence_penalty: options?.presencePenalty,
        frequency_penalty: options?.frequencyPenalty,
      });

      const duration = Math.round(performance.now() - startTime);
      const choice = response.choices[0];
      const usage = response.usage;

      const result: ChatResponse = {
        content: choice.message.content || '',
        model: response.model,
        usage: {
          promptTokens: usage?.prompt_tokens || 0,
          completionTokens: usage?.completion_tokens || 0,
          totalTokens: usage?.total_tokens || 0,
        },
        finishReason: choice.finish_reason || 'unknown',
      };

      const cost = calculateCost(model, result.usage.promptTokens, result.usage.completionTokens);

      logger.info(LOG_CATEGORIES.LLM, 'OpenAI chat complete', {
        model: result.model,
        tokens: result.usage.totalTokens,
        cost: `$${cost.toFixed(4)}`,
        duration: `${duration}ms`,
      });

      return result;
    } catch (error) {
      logger.error(LOG_CATEGORIES.LLM, 'OpenAI chat error', error as Error);
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
    const model = options?.model || LLM.OPENAI.CHAT_MODEL;
    const maxTokens = options?.maxTokens || LLM.DEFAULT_MAX_TOKENS;
    const temperature = options?.temperature ?? LLM.DEFAULT_TEMPERATURE;

    logger.debug(LOG_CATEGORIES.LLM, 'OpenAI stream request', {
      model,
      messageCount: messages.length,
    });

    try {
      const stream = await this.client.chat.completions.create({
        model,
        messages: messages.map((m) => ({
          role: m.role as 'system' | 'user' | 'assistant',
          content: m.content,
        })),
        max_tokens: maxTokens,
        temperature,
        top_p: options?.topP,
        stop: options?.stop,
        stream: true,
      });

      let fullResponse = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          options?.onChunk?.(content);
          yield content;
        }
      }

      options?.onComplete?.(fullResponse);

      logger.info(LOG_CATEGORIES.LLM, 'OpenAI stream complete', {
        model,
        responseLength: fullResponse.length,
      });
    } catch (error) {
      logger.error(LOG_CATEGORIES.LLM, 'OpenAI stream error', error as Error);
      options?.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Generate embeddings for text
   */
  async embed(text: string, options?: EmbeddingOptions): Promise<EmbeddingResponse> {
    const model = options?.model || LLM.OPENAI.EMBEDDING_MODEL;
    const dimensions = options?.dimensions || LLM.OPENAI.EMBEDDING_DIMENSIONS;

    logger.debug(LOG_CATEGORIES.EMBEDDING, 'OpenAI embedding request', {
      model,
      textLength: text.length,
      dimensions,
    });

    try {
      const response = await this.client.embeddings.create({
        model,
        input: text,
        dimensions,
      });

      const result: EmbeddingResponse = {
        embedding: response.data[0].embedding,
        model: response.model,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          totalTokens: response.usage.total_tokens,
        },
      };

      logger.debug(LOG_CATEGORIES.EMBEDDING, 'OpenAI embedding complete', {
        model: result.model,
        tokens: result.usage.totalTokens,
      });

      return result;
    } catch (error) {
      logger.error(LOG_CATEGORIES.EMBEDDING, 'OpenAI embedding error', error as Error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts (batch)
   */
  async embedBatch(texts: string[], options?: EmbeddingOptions): Promise<EmbeddingResponse[]> {
    const model = options?.model || LLM.OPENAI.EMBEDDING_MODEL;
    const dimensions = options?.dimensions || LLM.OPENAI.EMBEDDING_DIMENSIONS;

    logger.debug(LOG_CATEGORIES.EMBEDDING, 'OpenAI batch embedding request', {
      model,
      count: texts.length,
    });

    try {
      const response = await this.client.embeddings.create({
        model,
        input: texts,
        dimensions,
      });

      const results: EmbeddingResponse[] = response.data.map((item) => ({
        embedding: item.embedding,
        model: response.model,
        usage: {
          promptTokens: Math.round(response.usage.prompt_tokens / texts.length),
          totalTokens: Math.round(response.usage.total_tokens / texts.length),
        },
      }));

      logger.debug(LOG_CATEGORIES.EMBEDDING, 'OpenAI batch embedding complete', {
        model,
        count: results.length,
        totalTokens: response.usage.total_tokens,
      });

      return results;
    } catch (error) {
      logger.error(LOG_CATEGORIES.EMBEDDING, 'OpenAI batch embedding error', error as Error);
      throw error;
    }
  }

  /**
   * Count tokens in text
   */
  countTokens(text: string, model?: string): number {
    return countTokens(text, model || LLM.OPENAI.CHAT_MODEL);
  }
}
