// ============================================================================
// Summarization Service
// Handles conversation summarization for context window management
// ============================================================================

import { SupabaseClient } from '@supabase/supabase-js';
import { logger, LOG_CATEGORIES } from './logger';
import { chat } from './llm';
import { countTokens } from './token-counter';
import { PERSONA_ENGINE } from '../lib/constants';
import {
  Persona,
  Conversation,
  Message,
  ConversationSummary,
  ConversationSummaryInsert,
} from '../db/types';
import { dbQuery, callRpc } from '../db/client';

// ----------------------------------------------------------------------------
// Summarization Service Class
// ----------------------------------------------------------------------------

export class SummarizationService {
  constructor(private client: SupabaseClient) {}

  /**
   * Check if a conversation should be summarized
   */
  async shouldSummarize(
    conversation: Conversation,
    persona: Persona
  ): Promise<boolean> {
    // Get current token stats
    const { data: stats } = await callRpc<{
      message_count: number;
      total_tokens: number;
      unsummarized_count: number;
      unsummarized_tokens: number;
    }>(this.client, 'get_conversation_stats', {
      p_conversation_id: conversation.id,
    });

    if (!stats) return false;

    const maxTokens = persona.max_context_tokens || PERSONA_ENGINE.MAX_CONTEXT_TOKENS;
    const threshold = persona.summarization_threshold || PERSONA_ENGINE.SUMMARIZATION_THRESHOLD;

    // Calculate if we're approaching the limit
    const usageRatio = stats.unsummarized_tokens / maxTokens;

    logger.debug(LOG_CATEGORIES.SUMMARIZATION, 'Summarization check', {
      conversationId: conversation.id,
      unsummarizedTokens: stats.unsummarized_tokens,
      maxTokens,
      threshold,
      usageRatio: usageRatio.toFixed(2),
    });

    return usageRatio >= threshold;
  }

  /**
   * Summarize unsummarized messages in a conversation
   */
  async summarize(
    conversation: Conversation,
    persona: Persona
  ): Promise<ConversationSummary | null> {
    const endTimer = logger.time(LOG_CATEGORIES.SUMMARIZATION, 'Conversation summarization');

    try {
      // Get unsummarized messages
      const { data: messages } = await callRpc<Array<{
        id: string;
        role: string;
        content: string;
        token_count: number;
        created_at: string;
      }>>(this.client, 'get_unsummarized_messages', {
        p_conversation_id: conversation.id,
        p_limit: 100,
      });

      if (!messages || messages.length === 0) {
        logger.debug(LOG_CATEGORIES.SUMMARIZATION, 'No messages to summarize');
        return null;
      }

      logger.debug(LOG_CATEGORIES.SUMMARIZATION, 'Summarizing messages', {
        count: messages.length,
        conversationId: conversation.id,
      });

      // Build summarization prompt based on persona type
      const summaryPrompt = this.buildSummarizationPrompt(
        messages as Message[],
        persona,
        conversation.summary
      );

      // Generate summary using LLM
      const summaryResponse = await chat([
        { role: 'system', content: this.getSummarizationSystemPrompt(persona) },
        { role: 'user', content: summaryPrompt },
      ], {
        maxTokens: 1000,
        temperature: 0.3, // Lower temperature for more consistent summaries
      });

      const summaryText = summaryResponse.content;
      const tokenCount = countTokens(summaryText);

      // Save summary
      const messageIds = messages.map((m) => m.id);
      const messageRangeStart = messages[0].created_at;
      const messageRangeEnd = messages[messages.length - 1].created_at;

      const summaryInsert: ConversationSummaryInsert = {
        conversation_id: conversation.id,
        summary_text: summaryText,
        token_count: tokenCount,
        messages_summarized: messageIds,
        message_range_start: messageRangeStart,
        message_range_end: messageRangeEnd,
      };

      const { data: summary, error } = await dbQuery<ConversationSummary>(() =>
        this.client
          .from('conversation_summaries')
          .insert(summaryInsert)
          .select()
          .single()
      );

      if (error || !summary) {
        logger.error(LOG_CATEGORIES.SUMMARIZATION, 'Failed to save summary', new Error(error || 'No data'));
        return null;
      }

      // Mark messages as summarized
      await callRpc(this.client, 'mark_messages_summarized', {
        p_message_ids: messageIds,
        p_summary_id: summary.id,
      });

      // Update conversation's rolling summary
      const newSummary = conversation.summary
        ? await this.mergeWithExistingSummary(conversation.summary, summaryText, persona)
        : summaryText;

      await this.client
        .from('conversations')
        .update({
          summary: newSummary,
          summary_token_count: countTokens(newSummary),
        })
        .eq('id', conversation.id);

      // Cleanup old summaries
      await callRpc(this.client, 'cleanup_old_summaries', {
        p_conversation_id: conversation.id,
        p_keep_count: 5,
      });

      logger.info(LOG_CATEGORIES.SUMMARIZATION, 'Summarization complete', {
        summaryId: summary.id,
        messagesIncluded: messageIds.length,
        summaryTokens: tokenCount,
      });

      endTimer();
      return summary;
    } catch (error) {
      endTimer();
      logger.error(LOG_CATEGORIES.SUMMARIZATION, 'Summarization failed', error as Error);
      throw error;
    }
  }

  /**
   * Build the summarization prompt based on persona type
   */
  private buildSummarizationPrompt(
    messages: Message[],
    persona: Persona,
    existingSummary?: string | null
  ): string {
    const messageHistory = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    let contextInfo = '';
    if (existingSummary) {
      contextInfo = `Previous summary:\n${existingSummary}\n\n`;
    }

    let focusAreas = '';
    switch (persona.type) {
      case 'simulated_person':
        focusAreas = `
Focus on preserving:
- Key topics discussed
- User's questions and interests
- Character's opinions expressed
- Any commitments or promises made`;
        break;

      case 'journal_assistant':
        focusAreas = `
Focus on preserving:
- Trade setups discussed
- User's reasoning and thought process
- Lessons learned or patterns identified
- Action items or commitments
- Emotional state during trades`;
        break;

      case 'companion':
        focusAreas = `
Focus on preserving:
- Key facts learned about the user
- Emotional context and tone
- Topics they care about
- Any plans or goals mentioned
- Relationship dynamics`;
        break;

      default:
        focusAreas = `
Focus on preserving:
- Key decisions and conclusions
- Important facts shared
- User preferences revealed
- Action items or next steps`;
    }

    return `${contextInfo}Conversation to summarize:
${messageHistory}

${focusAreas}

Create a concise summary that captures the essential information from this conversation.`;
  }

  /**
   * Get the system prompt for summarization
   */
  private getSummarizationSystemPrompt(persona: Persona): string {
    return `You are a conversation summarizer. Your job is to create concise, information-dense summaries of conversations.

Guidelines:
1. Preserve key facts, decisions, and context
2. Maintain the emotional tone when relevant
3. Keep the summary under 500 words
4. Use bullet points for clarity when listing multiple items
5. Focus on information that would be useful for continuing the conversation later
6. Do not add your own opinions or conclusions

Context: This conversation is with a "${persona.type}" persona named "${persona.name}".`;
  }

  /**
   * Merge a new summary with an existing one
   */
  private async mergeWithExistingSummary(
    existingSummary: string,
    newSummary: string,
    persona: Persona
  ): Promise<string> {
    const mergeResponse = await chat([
      {
        role: 'system',
        content: `You merge conversation summaries into a single, coherent summary. Keep the result concise (under 600 words) while preserving all important information. The conversation is with a "${persona.type}" persona.`,
      },
      {
        role: 'user',
        content: `Merge these summaries into one:

Previous summary:
${existingSummary}

New summary:
${newSummary}

Create a unified summary that captures all important information from both.`,
      },
    ], {
      maxTokens: 800,
      temperature: 0.3,
    });

    return mergeResponse.content;
  }

  /**
   * Get all summaries for a conversation
   */
  async getSummaries(conversationId: string): Promise<ConversationSummary[]> {
    const { data, error } = await this.client
      .from('conversation_summaries')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error(LOG_CATEGORIES.SUMMARIZATION, 'Failed to get summaries', new Error(error.message));
      return [];
    }

    return data || [];
  }

  /**
   * Trigger manual summarization (admin feature)
   */
  async triggerManualSummarization(
    conversationId: string
  ): Promise<ConversationSummary | null> {
    // Get conversation and persona
    const { data: conversation } = await this.client
      .from('conversations')
      .select('*, personas(*)')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      logger.error(LOG_CATEGORIES.SUMMARIZATION, 'Conversation not found');
      return null;
    }

    const persona = conversation.personas as unknown as Persona;
    return this.summarize(conversation, persona);
  }
}

// ----------------------------------------------------------------------------
// Factory Function
// ----------------------------------------------------------------------------

export function createSummarizationService(client: SupabaseClient): SummarizationService {
  return new SummarizationService(client);
}
