// ============================================================================
// Memory Service
// Handles fact management, document storage, and vector search
// ============================================================================

import { SupabaseClient } from '@supabase/supabase-js';
import { logger, LOG_CATEGORIES } from './logger';
import { embed, embedBatch } from './llm';
import { chunkText, countTokens } from './token-counter';
import { PERSONA_ENGINE } from '../lib/constants';
import {
  PersonaFact,
  PersonaFactInsert,
  PersonaDocument,
  PersonaDocumentInsert,
  TradeSetup,
  TradeSetupInsert,
  DocumentSearchResult,
  TradeSearchResult,
  FactCategory,
  DocumentSourceType,
} from '../db/types';
import { callRpc, dbQuery, dbList } from '../db/client';

// ----------------------------------------------------------------------------
// Fact Management (Array Strategy)
// ----------------------------------------------------------------------------

export class FactService {
  constructor(private client: SupabaseClient) {}

  /**
   * Get facts for a persona ordered by importance
   */
  async getFacts(personaId: string, limit: number = 30): Promise<PersonaFact[]> {
    logger.debug(LOG_CATEGORIES.MEMORY, 'Getting facts for persona', { personaId, limit });

    const { data, error } = await dbList<PersonaFact>(() =>
      this.client
        .from('persona_facts')
        .select('*')
        .eq('persona_id', personaId)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('importance', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit)
    );

    if (error) {
      logger.error(LOG_CATEGORIES.MEMORY, 'Failed to get facts', new Error(error));
      return [];
    }

    return data;
  }

  /**
   * Add a new fact
   */
  async addFact(fact: PersonaFactInsert): Promise<PersonaFact | null> {
    logger.debug(LOG_CATEGORIES.MEMORY, 'Adding fact', { personaId: fact.persona_id });

    const { data, error } = await dbQuery<PersonaFact>(() =>
      this.client.from('persona_facts').insert(fact).select().single()
    );

    if (error) {
      logger.error(LOG_CATEGORIES.MEMORY, 'Failed to add fact', new Error(error));
      return null;
    }

    return data;
  }

  /**
   * Update a fact
   */
  async updateFact(
    factId: string,
    updates: Partial<Pick<PersonaFact, 'fact_text' | 'category' | 'importance' | 'is_active'>>
  ): Promise<PersonaFact | null> {
    logger.debug(LOG_CATEGORIES.MEMORY, 'Updating fact', { factId });

    const { data, error } = await dbQuery<PersonaFact>(() =>
      this.client.from('persona_facts').update(updates).eq('id', factId).select().single()
    );

    if (error) {
      logger.error(LOG_CATEGORIES.MEMORY, 'Failed to update fact', new Error(error));
      return null;
    }

    return data;
  }

  /**
   * Soft delete a fact
   */
  async deleteFact(factId: string): Promise<boolean> {
    logger.debug(LOG_CATEGORIES.MEMORY, 'Deleting fact', { factId });

    const { error } = await dbQuery(() =>
      this.client
        .from('persona_facts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', factId)
    );

    if (error) {
      logger.error(LOG_CATEGORIES.MEMORY, 'Failed to delete fact', new Error(error));
      return false;
    }

    return true;
  }

  /**
   * Format facts for injection into context
   */
  formatFactsForContext(facts: PersonaFact[]): string {
    if (facts.length === 0) return '';

    const groupedByCategory = facts.reduce((acc, fact) => {
      const category = fact.category || 'other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(fact.fact_text);
      return acc;
    }, {} as Record<string, string[]>);

    const sections: string[] = [];

    for (const [category, categoryFacts] of Object.entries(groupedByCategory)) {
      const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
      const factsList = categoryFacts.map((f) => `- ${f}`).join('\n');
      sections.push(`${categoryTitle}:\n${factsList}`);
    }

    return sections.join('\n\n');
  }
}

// ----------------------------------------------------------------------------
// Document Management (RAG Strategy)
// ----------------------------------------------------------------------------

export class DocumentService {
  constructor(private client: SupabaseClient) {}

  /**
   * Add a document with automatic chunking and embedding
   */
  async addDocument(
    personaId: string,
    userId: string,
    content: string,
    options: {
      sourceType?: DocumentSourceType;
      sourceUrl?: string;
      sourceMetadata?: Record<string, unknown>;
    } = {}
  ): Promise<PersonaDocument[]> {
    logger.debug(LOG_CATEGORIES.MEMORY, 'Adding document', {
      personaId,
      contentLength: content.length,
    });

    // Chunk the content
    const chunks = chunkText(
      content,
      PERSONA_ENGINE.MAX_CHUNK_TOKENS,
      PERSONA_ENGINE.CHUNK_OVERLAP_TOKENS
    );

    logger.debug(LOG_CATEGORIES.MEMORY, 'Document chunked', {
      chunkCount: chunks.length,
    });

    // Generate embeddings for all chunks
    const embeddings = await embedBatch(chunks);

    // Create document records
    const documents: PersonaDocumentInsert[] = chunks.map((chunk, index) => ({
      persona_id: personaId,
      user_id: userId,
      content: chunk,
      embedding: embeddings[index].embedding,
      source_type: options.sourceType,
      source_url: options.sourceUrl,
      source_metadata: options.sourceMetadata || {},
      chunk_index: index,
    }));

    const { data, error } = await dbList<PersonaDocument>(() =>
      this.client.from('persona_documents').insert(documents).select()
    );

    if (error) {
      logger.error(LOG_CATEGORIES.MEMORY, 'Failed to add documents', new Error(error));
      return [];
    }

    logger.info(LOG_CATEGORIES.MEMORY, 'Documents added', {
      count: data.length,
      personaId,
    });

    return data;
  }

  /**
   * Search documents by vector similarity
   */
  async searchDocuments(
    personaId: string,
    query: string,
    limit: number = 5
  ): Promise<DocumentSearchResult[]> {
    logger.debug(LOG_CATEGORIES.MEMORY, 'Searching documents', {
      personaId,
      queryLength: query.length,
      limit,
    });

    // Generate embedding for query
    const queryEmbedding = await embed(query);

    // Search using RPC function
    const { data, error } = await callRpc<DocumentSearchResult[]>(
      this.client,
      'search_persona_documents',
      {
        p_persona_id: personaId,
        p_embedding: queryEmbedding.embedding,
        p_limit: limit,
      }
    );

    if (error || !data) {
      logger.error(LOG_CATEGORIES.MEMORY, 'Document search failed', new Error(error || 'No data'));
      return [];
    }

    logger.debug(LOG_CATEGORIES.MEMORY, 'Document search complete', {
      resultsCount: data.length,
      topSimilarity: data[0]?.similarity,
    });

    return data;
  }

  /**
   * Get all documents for a persona
   */
  async getDocuments(personaId: string, limit: number = 100): Promise<PersonaDocument[]> {
    const { data, error } = await dbList<PersonaDocument>(() =>
      this.client
        .from('persona_documents')
        .select('id, persona_id, content, source_type, source_url, chunk_index, created_at')
        .eq('persona_id', personaId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limit)
    );

    if (error) {
      logger.error(LOG_CATEGORIES.MEMORY, 'Failed to get documents', new Error(error));
      return [];
    }

    return data;
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    const { error } = await dbQuery(() =>
      this.client
        .from('persona_documents')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', documentId)
    );

    if (error) {
      logger.error(LOG_CATEGORIES.MEMORY, 'Failed to delete document', new Error(error));
      return false;
    }

    return true;
  }

  /**
   * Format search results for injection into context
   */
  formatDocumentsForContext(documents: DocumentSearchResult[]): string {
    if (documents.length === 0) return '';

    return documents
      .map((doc, i) => {
        const source = doc.source_url ? ` (source: ${doc.source_url})` : '';
        return `[${i + 1}]${source}\n${doc.content}`;
      })
      .join('\n\n---\n\n');
  }
}

// ----------------------------------------------------------------------------
// Trade Setup Management (Journal Assistant)
// ----------------------------------------------------------------------------

export class TradeService {
  constructor(private client: SupabaseClient) {}

  /**
   * Add a trade setup with automatic embedding
   */
  async addTradeSetup(setup: TradeSetupInsert): Promise<TradeSetup | null> {
    logger.debug(LOG_CATEGORIES.TRADE, 'Adding trade setup', {
      ticker: setup.ticker,
      setupType: setup.setup_type,
    });

    // Generate embedding for the setup description + thought process
    const textToEmbed = [setup.setup_description, setup.thought_process, setup.entry_reasoning]
      .filter(Boolean)
      .join('\n\n');

    const embeddingResponse = await embed(textToEmbed);

    const { data, error } = await dbQuery<TradeSetup>(() =>
      this.client
        .from('trade_setups')
        .insert({
          ...setup,
          embedding: embeddingResponse.embedding,
        })
        .select()
        .single()
    );

    if (error) {
      logger.error(LOG_CATEGORIES.TRADE, 'Failed to add trade setup', new Error(error));
      return null;
    }

    logger.info(LOG_CATEGORIES.TRADE, 'Trade setup added', { id: data?.id });
    return data;
  }

  /**
   * Update a trade setup
   */
  async updateTradeSetup(
    setupId: string,
    updates: Partial<TradeSetup>
  ): Promise<TradeSetup | null> {
    logger.debug(LOG_CATEGORIES.TRADE, 'Updating trade setup', { setupId });

    // If updating description/thought process, regenerate embedding
    let embeddingUpdate: { embedding?: number[] } = {};
    if (updates.setup_description || updates.thought_process || updates.entry_reasoning) {
      // Get current setup to merge with updates
      const { data: current } = await this.client
        .from('trade_setups')
        .select('setup_description, thought_process, entry_reasoning')
        .eq('id', setupId)
        .single();

      if (current) {
        const textToEmbed = [
          updates.setup_description || current.setup_description,
          updates.thought_process || current.thought_process,
          updates.entry_reasoning || current.entry_reasoning,
        ]
          .filter(Boolean)
          .join('\n\n');

        const embeddingResponse = await embed(textToEmbed);
        embeddingUpdate = { embedding: embeddingResponse.embedding };
      }
    }

    const { data, error } = await dbQuery<TradeSetup>(() =>
      this.client
        .from('trade_setups')
        .update({ ...updates, ...embeddingUpdate })
        .eq('id', setupId)
        .select()
        .single()
    );

    if (error) {
      logger.error(LOG_CATEGORIES.TRADE, 'Failed to update trade setup', new Error(error));
      return null;
    }

    return data;
  }

  /**
   * Find similar trade setups
   */
  async findSimilarSetups(
    userId: string,
    query: string,
    options: {
      limit?: number;
      personaId?: string;
    } = {}
  ): Promise<TradeSearchResult[]> {
    logger.debug(LOG_CATEGORIES.TRADE, 'Searching similar setups', {
      queryLength: query.length,
      limit: options.limit,
    });

    const queryEmbedding = await embed(query);

    const { data, error } = await callRpc<TradeSearchResult[]>(
      this.client,
      'search_trade_setups',
      {
        p_user_id: userId,
        p_embedding: queryEmbedding.embedding,
        p_limit: options.limit || 5,
        p_persona_id: options.personaId || null,
      }
    );

    if (error || !data) {
      logger.error(LOG_CATEGORIES.TRADE, 'Similar setup search failed', new Error(error || 'No data'));
      return [];
    }

    logger.debug(LOG_CATEGORIES.TRADE, 'Similar setup search complete', {
      resultsCount: data.length,
    });

    return data;
  }

  /**
   * Get trade setups for a user
   */
  async getTradeSetups(
    userId: string,
    options: {
      personaId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<TradeSetup[]> {
    let query = this.client
      .from('trade_setups')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('trade_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (options.personaId) {
      query = query.eq('persona_id', options.personaId);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await dbList<TradeSetup>(() => query);

    if (error) {
      logger.error(LOG_CATEGORIES.TRADE, 'Failed to get trade setups', new Error(error));
      return [];
    }

    return data;
  }

  /**
   * Delete a trade setup
   */
  async deleteTradeSetup(setupId: string): Promise<boolean> {
    const { error } = await dbQuery(() =>
      this.client
        .from('trade_setups')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', setupId)
    );

    if (error) {
      logger.error(LOG_CATEGORIES.TRADE, 'Failed to delete trade setup', new Error(error));
      return false;
    }

    return true;
  }

  /**
   * Format trade setups for context injection
   */
  formatTradesForContext(trades: TradeSearchResult[]): string {
    if (trades.length === 0) return '';

    return trades
      .map((trade, i) => {
        const parts = [
          `[Similar Trade ${i + 1}]`,
          trade.ticker ? `Ticker: ${trade.ticker}` : null,
          `Setup: ${trade.setup_description}`,
          trade.thought_process ? `Thinking: ${trade.thought_process}` : null,
          trade.outcome ? `Outcome: ${trade.outcome}${trade.pnl_percent ? ` (${trade.pnl_percent}%)` : ''}` : null,
          trade.outcome_notes ? `Notes: ${trade.outcome_notes}` : null,
        ];

        return parts.filter(Boolean).join('\n');
      })
      .join('\n\n---\n\n');
  }
}

// ----------------------------------------------------------------------------
// Memory Service Factory
// ----------------------------------------------------------------------------

export function createMemoryServices(client: SupabaseClient): {
  facts: FactService;
  documents: DocumentService;
  trades: TradeService;
} {
  return {
    facts: new FactService(client),
    documents: new DocumentService(client),
    trades: new TradeService(client),
  };
}
