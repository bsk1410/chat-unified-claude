// ============================================================================
// Admin Routes
// Settings and usage statistics
// ============================================================================

import { Hono } from 'hono';
import { getUserSupabase } from '../middleware/auth';
import { logger, LOG_CATEGORIES } from '../services/logger';
import { PERSONA_ENGINE, LLM, RATE_LIMIT } from '../lib/constants';

// ----------------------------------------------------------------------------
// Router
// ----------------------------------------------------------------------------

const admin = new Hono();

// ----------------------------------------------------------------------------
// GET /admin/settings - Get current settings
// ----------------------------------------------------------------------------

admin.get('/settings', async (c) => {
  // Return current configuration
  return c.json({
    data: {
      persona_engine: {
        max_context_tokens: PERSONA_ENGINE.MAX_CONTEXT_TOKENS,
        reserve_for_response: PERSONA_ENGINE.RESERVE_FOR_RESPONSE,
        summarization_threshold: PERSONA_ENGINE.SUMMARIZATION_THRESHOLD,
        memory_retrieval_count: PERSONA_ENGINE.MEMORY_RETRIEVAL_COUNT,
        max_facts_per_persona: PERSONA_ENGINE.MAX_FACTS_PER_PERSONA,
        max_chunk_tokens: PERSONA_ENGINE.MAX_CHUNK_TOKENS,
        persona_types: PERSONA_ENGINE.PERSONA_TYPES,
        memory_strategies: PERSONA_ENGINE.MEMORY_STRATEGIES,
      },
      llm: {
        default_provider: LLM.DEFAULT_PROVIDER,
        providers: LLM.PROVIDERS,
        openai_chat_model: LLM.OPENAI.CHAT_MODEL,
        openai_embedding_model: LLM.OPENAI.EMBEDDING_MODEL,
        anthropic_chat_model: LLM.ANTHROPIC.CHAT_MODEL,
        default_max_tokens: LLM.DEFAULT_MAX_TOKENS,
        default_temperature: LLM.DEFAULT_TEMPERATURE,
      },
      rate_limit: {
        requests_per_window: RATE_LIMIT.REQUESTS_PER_WINDOW,
        window_ms: RATE_LIMIT.WINDOW_MS,
      },
    },
  });
});

// ----------------------------------------------------------------------------
// GET /admin/usage - Get usage statistics
// ----------------------------------------------------------------------------

admin.get('/usage', async (c) => {
  const userId = c.get('userId');
  const supabase = getUserSupabase(c);

  // Get counts
  const [personasResult, conversationsResult, messagesResult, documentsResult, tradesResult] = await Promise.all([
    supabase
      .from('personas')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null),
    supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null),
    supabase
      .from('messages')
      .select('id, token_count', { count: 'exact' })
      .eq('conversation_id', (await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .is('deleted_at', null)).data?.map(c => c.id) || []),
    supabase
      .from('persona_documents')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null),
    supabase
      .from('trade_setups')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null),
  ]);

  // Calculate total tokens from messages
  let totalTokens = 0;
  if (messagesResult.data) {
    totalTokens = messagesResult.data.reduce((sum, msg) => sum + (msg.token_count || 0), 0);
  }

  return c.json({
    data: {
      personas: personasResult.count || 0,
      conversations: conversationsResult.count || 0,
      messages: messagesResult.count || 0,
      documents: documentsResult.count || 0,
      trade_setups: tradesResult.count || 0,
      total_tokens_used: totalTokens,
    },
  });
});

// ----------------------------------------------------------------------------
// GET /admin/logs - Get recent logs (for debug UI)
// ----------------------------------------------------------------------------

admin.get('/logs', async (c) => {
  const query = new URL(c.req.url).searchParams;
  const level = query.get('level') as 'debug' | 'info' | 'warn' | 'error' | undefined;
  const category = query.get('category') || undefined;
  const limit = parseInt(query.get('limit') || '100', 10);

  const logs = logger.getLogs({
    level,
    category,
    limit,
  });

  return c.json({ data: logs });
});

// ----------------------------------------------------------------------------
// POST /admin/logs/clear - Clear logs
// ----------------------------------------------------------------------------

admin.post('/logs/clear', async (c) => {
  logger.clearLogs();
  return c.json({ message: 'Logs cleared' });
});

// ----------------------------------------------------------------------------
// GET /admin/logs/export - Export logs as JSON
// ----------------------------------------------------------------------------

admin.get('/logs/export', async (c) => {
  const logs = logger.exportLogs();

  c.header('Content-Type', 'application/json');
  c.header('Content-Disposition', `attachment; filename="logs-${Date.now()}.json"`);

  return c.body(logs);
});

export default admin;
