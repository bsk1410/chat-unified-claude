// ============================================================================
// Conversations Routes
// CRUD operations for conversations
// ============================================================================

import { Hono } from 'hono';
import { getUserSupabase } from '../middleware/auth';
import { logger, LOG_CATEGORIES } from '../services/logger';
import { parseBody, parseQuery, paginationSchema, createConversationSchema } from '../lib/validation';
import { NotFoundError, ValidationError } from '../middleware/error-handler';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../lib/constants';
import type { Persona } from '../db/types';

// ----------------------------------------------------------------------------
// Router
// ----------------------------------------------------------------------------

const conversations = new Hono();

// ----------------------------------------------------------------------------
// GET /conversations - List conversations
// ----------------------------------------------------------------------------

conversations.get('/', async (c) => {
  const userId = c.get('userId');
  const supabase = getUserSupabase(c);

  // Parse query params
  const query = new URL(c.req.url).searchParams;
  const personaId = query.get('persona_id');
  const archived = query.get('archived') === 'true';

  const paginationResult = parseQuery(paginationSchema, query);
  const { page, pageSize } = paginationResult.success
    ? paginationResult.data
    : { page: 1, pageSize: 20 };

  // Build query
  let dbQuery = supabase
    .from('conversations')
    .select('*, personas(id, name, type, avatar_url)', { count: 'exact' })
    .eq('user_id', userId)
    .is('deleted_at', null)
    .eq('is_archived', archived)
    .order('updated_at', { ascending: false });

  if (personaId) {
    dbQuery = dbQuery.eq('persona_id', personaId);
  }

  // Pagination
  const start = (page - 1) * pageSize;
  dbQuery = dbQuery.range(start, start + pageSize - 1);

  const { data, error, count } = await dbQuery;

  if (error) {
    logger.error(LOG_CATEGORIES.API, 'Failed to list conversations', new Error(error.message));
    throw new Error(error.message);
  }

  return c.json({
    data,
    pagination: {
      page,
      pageSize,
      total: count || 0,
      hasMore: (count || 0) > start + pageSize,
    },
  });
});

// ----------------------------------------------------------------------------
// POST /conversations - Create conversation
// ----------------------------------------------------------------------------

conversations.post('/', async (c) => {
  const userId = c.get('userId');
  const supabase = getUserSupabase(c);
  const body = await c.req.json();

  // Validate input
  const parsed = parseBody(createConversationSchema, body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error);
  }

  // Verify persona exists and belongs to user
  const { data: persona } = await supabase
    .from('personas')
    .select('id, name')
    .eq('id', parsed.data.persona_id)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  if (!persona) {
    throw new NotFoundError(ERROR_MESSAGES.PERSONA_NOT_FOUND);
  }

  // Create conversation
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      ...parsed.data,
      user_id: userId,
      title: parsed.data.title || `Chat with ${persona.name}`,
    })
    .select('*, personas(id, name, type, avatar_url)')
    .single();

  if (error) {
    logger.error(LOG_CATEGORIES.API, 'Failed to create conversation', new Error(error.message));
    throw new Error(error.message);
  }

  logger.info(LOG_CATEGORIES.API, 'Conversation created', { conversationId: data.id });

  return c.json({
    message: SUCCESS_MESSAGES.CONVERSATION_CREATED,
    data,
  }, 201);
});

// ----------------------------------------------------------------------------
// GET /conversations/:id - Get conversation with messages
// ----------------------------------------------------------------------------

conversations.get('/:id', async (c) => {
  const conversationId = c.req.param('id');
  const supabase = getUserSupabase(c);

  // Parse query params for message limit
  const query = new URL(c.req.url).searchParams;
  const messageLimit = parseInt(query.get('message_limit') || '50', 10);

  // Get conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('*, personas(*)')
    .eq('id', conversationId)
    .is('deleted_at', null)
    .single();

  if (convError || !conversation) {
    throw new NotFoundError(ERROR_MESSAGES.CONVERSATION_NOT_FOUND);
  }

  // Get recent messages
  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(messageLimit);

  if (msgError) {
    logger.error(LOG_CATEGORIES.API, 'Failed to get messages', new Error(msgError.message));
    throw new Error(msgError.message);
  }

  // Reverse to get chronological order
  const orderedMessages = messages?.reverse() || [];

  return c.json({
    data: {
      ...conversation,
      messages: orderedMessages,
    },
  });
});

// ----------------------------------------------------------------------------
// DELETE /conversations/:id - Delete conversation
// ----------------------------------------------------------------------------

conversations.delete('/:id', async (c) => {
  const conversationId = c.req.param('id');
  const supabase = getUserSupabase(c);

  // Check if exists
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .is('deleted_at', null)
    .single();

  if (!existing) {
    throw new NotFoundError(ERROR_MESSAGES.CONVERSATION_NOT_FOUND);
  }

  // Soft delete
  const { error } = await supabase
    .from('conversations')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', conversationId);

  if (error) {
    logger.error(LOG_CATEGORIES.API, 'Failed to delete conversation', new Error(error.message));
    throw new Error(error.message);
  }

  logger.info(LOG_CATEGORIES.API, 'Conversation deleted', { conversationId });

  return c.json({ message: 'Conversation deleted' });
});

// ----------------------------------------------------------------------------
// POST /conversations/:id/archive - Archive conversation
// ----------------------------------------------------------------------------

conversations.post('/:id/archive', async (c) => {
  const conversationId = c.req.param('id');
  const supabase = getUserSupabase(c);

  const { data, error } = await supabase
    .from('conversations')
    .update({ is_archived: true })
    .eq('id', conversationId)
    .is('deleted_at', null)
    .select()
    .single();

  if (error || !data) {
    throw new NotFoundError(ERROR_MESSAGES.CONVERSATION_NOT_FOUND);
  }

  logger.info(LOG_CATEGORIES.API, 'Conversation archived', { conversationId });

  return c.json({
    message: SUCCESS_MESSAGES.CONVERSATION_ARCHIVED,
    data,
  });
});

// ----------------------------------------------------------------------------
// POST /conversations/:id/summarize - Trigger manual summarization
// ----------------------------------------------------------------------------

conversations.post('/:id/summarize', async (c) => {
  const conversationId = c.req.param('id');
  const supabase = getUserSupabase(c);

  // Get conversation with persona
  const { data: conversation } = await supabase
    .from('conversations')
    .select('*, personas(*)')
    .eq('id', conversationId)
    .is('deleted_at', null)
    .single();

  if (!conversation) {
    throw new NotFoundError(ERROR_MESSAGES.CONVERSATION_NOT_FOUND);
  }

  // Trigger summarization
  const { createSummarizationService } = await import('../services/summarization');
  const summarizer = createSummarizationService(supabase);

  const summary = await summarizer.summarize(
    conversation,
    conversation.personas as Persona
  );

  if (!summary) {
    return c.json({ message: 'No messages to summarize' });
  }

  logger.info(LOG_CATEGORIES.API, 'Summarization triggered', {
    conversationId,
    summaryId: summary.id,
  });

  return c.json({
    message: SUCCESS_MESSAGES.SUMMARIZATION_COMPLETE,
    data: summary,
  });
});

// ----------------------------------------------------------------------------
// GET /conversations/:id/context - Preview assembled context
// ----------------------------------------------------------------------------

conversations.get('/:id/context', async (c) => {
  const conversationId = c.req.param('id');
  const supabase = getUserSupabase(c);

  // Get conversation with persona
  const { data: conversation } = await supabase
    .from('conversations')
    .select('*, personas(*)')
    .eq('id', conversationId)
    .is('deleted_at', null)
    .single();

  if (!conversation) {
    throw new NotFoundError(ERROR_MESSAGES.CONVERSATION_NOT_FOUND);
  }

  // Get recent messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(100);

  // Preview context
  const { createContextBuilder } = await import('../services/context-builder');
  const contextBuilder = createContextBuilder(supabase);

  const preview = await contextBuilder.preview(
    conversation.personas as Persona,
    conversation,
    messages || []
  );

  return c.json({ data: preview });
});

export default conversations;
