// ============================================================================
// Context Builder Service
// Assembles context for LLM calls based on persona type
// ============================================================================

import { SupabaseClient } from '@supabase/supabase-js';
import { logger, LOG_CATEGORIES } from './logger';
import { countTokens, estimateContextTokens } from './token-counter';
import { createMemoryServices, FactService, DocumentService, TradeService } from './memory';
import { PERSONA_ENGINE } from '../lib/constants';
import { Persona, Conversation, Message, AssembledContext, MessageRole } from '../db/types';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface ContextBuilderConfig {
  maxTokens: number;
  reserveForResponse: number;
  summarizationThreshold: number;
}

interface ContextMessage {
  role: MessageRole;
  content: string;
}

// ----------------------------------------------------------------------------
// Context Builder Class
// ----------------------------------------------------------------------------

export class ContextBuilder {
  private config: ContextBuilderConfig;
  private facts: FactService;
  private documents: DocumentService;
  private trades: TradeService;

  constructor(
    private client: SupabaseClient,
    config?: Partial<ContextBuilderConfig>
  ) {
    this.config = {
      maxTokens: config?.maxTokens || PERSONA_ENGINE.MAX_CONTEXT_TOKENS,
      reserveForResponse: config?.reserveForResponse || PERSONA_ENGINE.RESERVE_FOR_RESPONSE,
      summarizationThreshold: config?.summarizationThreshold || PERSONA_ENGINE.SUMMARIZATION_THRESHOLD,
    };

    const services = createMemoryServices(client);
    this.facts = services.facts;
    this.documents = services.documents;
    this.trades = services.trades;
  }

  /**
   * Build context based on persona type
   */
  async build(
    persona: Persona,
    conversation: Conversation,
    newUserMessage: string,
    recentMessages: Message[]
  ): Promise<AssembledContext> {
    const endTimer = logger.time(LOG_CATEGORIES.CONTEXT, 'Context assembly');

    try {
      // Calculate available token budget
      const maxAvailable = this.config.maxTokens - this.config.reserveForResponse;

      // Build context based on persona type
      let context: AssembledContext;

      switch (persona.type) {
        case 'simulated_person':
          context = await this.buildSimulatedPersonContext(
            persona,
            conversation,
            newUserMessage,
            recentMessages,
            maxAvailable
          );
          break;

        case 'journal_assistant':
          context = await this.buildJournalContext(
            persona,
            conversation,
            newUserMessage,
            recentMessages,
            maxAvailable
          );
          break;

        case 'companion':
          context = await this.buildCompanionContext(
            persona,
            conversation,
            newUserMessage,
            recentMessages,
            maxAvailable
          );
          break;

        case 'custom':
        default:
          context = await this.buildCustomContext(
            persona,
            conversation,
            newUserMessage,
            recentMessages,
            maxAvailable
          );
      }

      // Check if summarization should be triggered
      const summarizationTriggered = this.shouldTriggerSummarization(
        context.totalTokens,
        maxAvailable
      );

      context.summarizationTriggered = summarizationTriggered;

      logger.info(LOG_CATEGORIES.CONTEXT, 'Context assembled', {
        personaType: persona.type,
        totalTokens: context.totalTokens,
        messageCount: context.messages.length,
        wasTruncated: context.wasTruncated,
        summarizationTriggered,
      });

      endTimer();
      return context;
    } catch (error) {
      endTimer();
      throw error;
    }
  }

  /**
   * Build context for simulated_person type
   * Uses RAG to retrieve relevant content from the person's writings
   */
  private async buildSimulatedPersonContext(
    persona: Persona,
    conversation: Conversation,
    newUserMessage: string,
    recentMessages: Message[],
    maxTokens: number
  ): Promise<AssembledContext> {
    logger.debug(LOG_CATEGORIES.CONTEXT, 'Building simulated_person context');

    // Extract bio and pinned content from source_data
    const sourceData = persona.source_data as Record<string, unknown>;
    const bio = (sourceData?.bio as string) || '';
    const pinnedContent = (sourceData?.pinned_content as string) || '';

    // Search for relevant documents
    const relevantDocs = await this.documents.searchDocuments(
      persona.id,
      newUserMessage,
      persona.memory_retrieval_count
    );

    const docsContent = this.documents.formatDocumentsForContext(relevantDocs);

    // Build system prompt
    const systemPrompt = this.buildSimulatedPersonSystemPrompt(
      persona,
      bio,
      pinnedContent,
      docsContent
    );

    // Assemble messages within token budget
    return this.assembleMessages(
      systemPrompt,
      '',
      recentMessages,
      newUserMessage,
      maxTokens
    );
  }

  /**
   * Build context for journal_assistant type
   * Retrieves similar past trades for pattern recognition
   */
  private async buildJournalContext(
    persona: Persona,
    conversation: Conversation,
    newUserMessage: string,
    recentMessages: Message[],
    maxTokens: number
  ): Promise<AssembledContext> {
    logger.debug(LOG_CATEGORIES.CONTEXT, 'Building journal_assistant context');

    // Get user's trading rules/facts
    const tradingRules = await this.facts.getFacts(persona.id);
    const rulesContent = this.facts.formatFactsForContext(tradingRules);

    // Find similar past setups
    const similarSetups = await this.trades.findSimilarSetups(
      persona.user_id,
      newUserMessage,
      {
        limit: persona.memory_retrieval_count,
        personaId: persona.id,
      }
    );

    const setupsContent = this.trades.formatTradesForContext(similarSetups);

    // Build system prompt
    const systemPrompt = this.buildJournalSystemPrompt(
      persona,
      rulesContent,
      setupsContent
    );

    return this.assembleMessages(
      systemPrompt,
      '',
      recentMessages,
      newUserMessage,
      maxTokens
    );
  }

  /**
   * Build context for companion type
   * Uses simple array strategy with facts
   */
  private async buildCompanionContext(
    persona: Persona,
    conversation: Conversation,
    newUserMessage: string,
    recentMessages: Message[],
    maxTokens: number
  ): Promise<AssembledContext> {
    logger.debug(LOG_CATEGORIES.CONTEXT, 'Building companion context');

    // Get all facts
    const facts = await this.facts.getFacts(persona.id, 50);
    const factsContent = this.facts.formatFactsForContext(facts);

    // Use conversation summary if available
    const summary = conversation.summary || '';

    // Build system prompt
    const systemPrompt = this.buildCompanionSystemPrompt(
      persona,
      factsContent,
      summary
    );

    return this.assembleMessages(
      systemPrompt,
      '',
      recentMessages,
      newUserMessage,
      maxTokens
    );
  }

  /**
   * Build context for custom type
   * Uses hybrid strategy based on persona config
   */
  private async buildCustomContext(
    persona: Persona,
    conversation: Conversation,
    newUserMessage: string,
    recentMessages: Message[],
    maxTokens: number
  ): Promise<AssembledContext> {
    logger.debug(LOG_CATEGORIES.CONTEXT, 'Building custom context');

    let memoryContent = '';

    // Get memory based on strategy
    switch (persona.memory_strategy) {
      case 'array': {
        const facts = await this.facts.getFacts(persona.id);
        memoryContent = this.facts.formatFactsForContext(facts);
        break;
      }

      case 'rag': {
        const docs = await this.documents.searchDocuments(
          persona.id,
          newUserMessage,
          persona.memory_retrieval_count
        );
        memoryContent = this.documents.formatDocumentsForContext(docs);
        break;
      }

      case 'hybrid': {
        const facts = await this.facts.getFacts(persona.id, 20);
        const docs = await this.documents.searchDocuments(
          persona.id,
          newUserMessage,
          persona.memory_retrieval_count
        );

        const factsContent = this.facts.formatFactsForContext(facts);
        const docsContent = this.documents.formatDocumentsForContext(docs);

        memoryContent = factsContent
          ? `Known facts:\n${factsContent}\n\nRelevant context:\n${docsContent}`
          : docsContent;
        break;
      }
    }

    // Build system prompt with custom prompt and memory
    const systemPrompt = `${persona.system_prompt}

${persona.voice_notes ? `\nStyle guidance: ${persona.voice_notes}` : ''}

${memoryContent ? `\nContext:\n${memoryContent}` : ''}`;

    return this.assembleMessages(
      systemPrompt,
      conversation.summary || '',
      recentMessages,
      newUserMessage,
      maxTokens
    );
  }

  // ----------------------------------------------------------------------------
  // System Prompt Builders
  // ----------------------------------------------------------------------------

  private buildSimulatedPersonSystemPrompt(
    persona: Persona,
    bio: string,
    pinnedContent: string,
    relevantContent: string
  ): string {
    return `You are ${persona.name}. Respond exactly as they would based on their writing style and opinions.

${bio ? `Background:\n${bio}` : ''}

${pinnedContent ? `Key content:\n${pinnedContent}` : ''}

${relevantContent ? `Relevant posts/writings:\n${relevantContent}` : ''}

${persona.voice_notes ? `Style notes: ${persona.voice_notes}` : ''}

Stay in character at all times. Match their tone, vocabulary, opinions, and perspective. If you don't know something they would know, stay in character and respond as they would - they might deflect, give their opinion, or acknowledge uncertainty in their characteristic way.

${persona.system_prompt}`;
  }

  private buildJournalSystemPrompt(
    persona: Persona,
    tradingRules: string,
    similarSetups: string
  ): string {
    return `${persona.system_prompt}

You are a trading journal assistant helping the user reflect on their trades and improve decision-making.

${tradingRules ? `User's trading rules and preferences:\n${tradingRules}` : ''}

${similarSetups ? `Similar setups from their history:\n${similarSetups}` : ''}

${persona.voice_notes ? `Style: ${persona.voice_notes}` : ''}

Help them:
- Recognize patterns in their trading
- Stay disciplined to their rules
- Learn from past trades
- Identify emotional vs rational decisions
- Improve their process

Be direct, practical, and constructive. Reference their past trades when relevant.`;
  }

  private buildCompanionSystemPrompt(
    persona: Persona,
    facts: string,
    summary: string
  ): string {
    return `${persona.system_prompt}

${facts ? `What you know about this person:\n${facts}` : ''}

${summary ? `Previous conversation context:\n${summary}` : ''}

${persona.voice_notes ? `Your personality: ${persona.voice_notes}` : ''}

Remember to be warm, supportive, and engaging. Reference what you know about them naturally in conversation.`;
  }

  // ----------------------------------------------------------------------------
  // Message Assembly
  // ----------------------------------------------------------------------------

  private async assembleMessages(
    systemPrompt: string,
    conversationSummary: string,
    recentMessages: Message[],
    newUserMessage: string,
    maxTokens: number
  ): Promise<AssembledContext> {
    // Calculate token budget
    const systemTokens = countTokens(systemPrompt);
    const summaryTokens = conversationSummary ? countTokens(conversationSummary) : 0;
    const newMessageTokens = countTokens(newUserMessage);

    // Tokens available for history
    let availableForHistory = maxTokens - systemTokens - summaryTokens - newMessageTokens - 100; // 100 for overhead

    if (availableForHistory < 0) {
      // System prompt itself is too large, truncate it
      logger.warn(LOG_CATEGORIES.CONTEXT, 'System prompt exceeds budget, truncating');
      availableForHistory = 1000; // Minimum for some history
    }

    // Assemble messages from most recent, going backward
    const messages: ContextMessage[] = [];
    let historyTokens = 0;
    let wasTruncated = false;

    // Add messages from most recent to oldest
    for (let i = recentMessages.length - 1; i >= 0; i--) {
      const msg = recentMessages[i];
      const msgTokens = msg.token_count;

      if (historyTokens + msgTokens > availableForHistory) {
        wasTruncated = true;
        break;
      }

      messages.unshift({
        role: msg.role as MessageRole,
        content: msg.content,
      });
      historyTokens += msgTokens;
    }

    // Add conversation summary if we truncated and have a summary
    const injectedMemories = conversationSummary && wasTruncated
      ? `[Conversation summary: ${conversationSummary}]`
      : '';

    // Calculate total tokens
    const totalTokens = systemTokens + summaryTokens + historyTokens + newMessageTokens;

    return {
      systemPrompt,
      messages,
      injectedMemories,
      totalTokens,
      wasTruncated,
      summarizationTriggered: false, // Set by caller
    };
  }

  /**
   * Check if summarization should be triggered
   */
  private shouldTriggerSummarization(
    currentTokens: number,
    maxTokens: number
  ): boolean {
    const threshold = maxTokens * this.config.summarizationThreshold;
    return currentTokens >= threshold;
  }

  /**
   * Preview context without new message (for debugging)
   */
  async preview(
    persona: Persona,
    conversation: Conversation,
    recentMessages: Message[]
  ): Promise<{
    systemPromptTokens: number;
    historyTokens: number;
    totalTokens: number;
    messageCount: number;
    memoryType: string;
  }> {
    const fakeMessage = 'Preview query for context estimation';
    const context = await this.build(persona, conversation, fakeMessage, recentMessages);

    return {
      systemPromptTokens: countTokens(context.systemPrompt),
      historyTokens: context.messages.reduce((sum, m) => sum + countTokens(m.content), 0),
      totalTokens: context.totalTokens,
      messageCount: context.messages.length,
      memoryType: persona.memory_strategy,
    };
  }
}

// ----------------------------------------------------------------------------
// Factory Function
// ----------------------------------------------------------------------------

export function createContextBuilder(
  client: SupabaseClient,
  config?: Partial<ContextBuilderConfig>
): ContextBuilder {
  return new ContextBuilder(client, config);
}
