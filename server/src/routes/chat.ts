// ============================================================================
// Chat Routes
// Core chat endpoints with streaming support
// ============================================================================

import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { getUserSupabase } from '../middleware/auth';
import { logger, LOG_CATEGORIES } from '../services/logger';
import { parseBody, chatRequestSchema } from '../lib/validation';
import { NotFoundError, ValidationError } from '../middleware/error-handler';
import { ERROR_MESSAGES } from '../lib/constants';
import { createContextBuilder } from '../services/context-builder';
import { createSummarizationService } from '../services/summarization';
import { chat, chatStream, ChatMessage } from '../services/llm';
import { countTokens } from '../services/token-counter';
import type { Message, MessageInsert, Persona, Conversation } from '../db/types';

// ----------------------------------------------------------------------------
// Router
// ----------------------------------------------------------------------------

const chatRouter = new Hono();

// ----------------------------------------------------------------------------
// POST /chat - Send message and get response
// ----------------------------------------------------------------------------

chatRouter.post('/', async (c) => {
  const userId = c.get('userId');
  const supabase = getUserSupabase(c);
  const body = await c.req.json();

  // Validate input
  const parsed = parseBody(chatRequestSchema, body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error);
  }

  const { conversation_id, persona_id, message, metadata } = parsed.data;

  // Get or create conversation
  let conversation: Conversation;
  let persona: Persona;

  if (conversation_id) {
    // Get existing conversation
    const { data: conv } = await supabase
      .from('conversations')
      .select('*, personas(*)')
      .eq('id', conversation_id)
      .is('deleted_at', null)
      .single();

    if (!conv) {
      throw new NotFoundError(ERROR_MESSAGES.CONVERSATION_NOT_FOUND);
    }

    conversation = conv;
    persona = conv.personas as unknown as Persona;
  } else if (persona_id) {
    // Get persona
    const { data: p } = await supabase
      .from('personas')
      .select('*')
      .eq('id', persona_id)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (!p) {
      throw new NotFoundError(ERROR_MESSAGES.PERSONA_NOT_FOUND);
    }

    persona = p;

    // Create new conversation
    const { data: conv, error } = await supabase
      .from('conversations')
      .insert({
        persona_id: persona_id,
        user_id: userId,
        title: `Chat with ${persona.name}`,
      })
      .select()
      .single();

    if (error || !conv) {
      throw new Error('Failed to create conversation');
    }

    conversation = conv;
  } else {
    throw new ValidationError('Either conversation_id or persona_id is required');
  }

  logger.debug(LOG_CATEGORIES.CHAT, 'Processing chat request', {
    conversationId: conversation.id,
    personaId: persona.id,
    messageLength: message.length,
  });

  // Get recent messages
  const { data: recentMessages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: true })
    .limit(100);

  // Build context
  const contextBuilder = createContextBuilder(supabase, {
    maxTokens: persona.max_context_tokens,
    summarizationThreshold: persona.summarization_threshold,
  });

  const context = await contextBuilder.build(
    persona,
    conversation,
    message,
    recentMessages || []
  );

  // Save user message
  const userMessageTokens = countTokens(message);
  const userMessageInsert: MessageInsert = {
    conversation_id: conversation.id,
    role: 'user',
    content: message,
    token_count: userMessageTokens,
    metadata: metadata,
  };

  const { data: savedUserMessage, error: userMsgError } = await supabase
    .from('messages')
    .insert(userMessageInsert)
    .select()
    .single();

  if (userMsgError) {
    throw new Error('Failed to save user message');
  }

  // Prepare messages for LLM
  const llmMessages: ChatMessage[] = [
    { role: 'system', content: context.systemPrompt },
    ...context.messages,
    { role: 'user', content: message },
  ];

  // Generate response
  const response = await chat(llmMessages, {
    maxTokens: 2000,
  });

  // Save assistant message
  const assistantMessageInsert: MessageInsert = {
    conversation_id: conversation.id,
    role: 'assistant',
    content: response.content,
    token_count: response.usage.completionTokens,
    metadata: {
      model: response.model,
      usage: response.usage,
    },
  };

  const { data: savedAssistantMessage, error: assistantMsgError } = await supabase
    .from('messages')
    .insert(assistantMessageInsert)
    .select()
    .single();

  if (assistantMsgError) {
    logger.error(LOG_CATEGORIES.CHAT, 'Failed to save assistant message', new Error(assistantMsgError.message));
  }

  // Update conversation timestamp
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversation.id);

  // Check if summarization should be triggered
  if (context.summarizationTriggered) {
    logger.info(LOG_CATEGORIES.CHAT, 'Triggering background summarization');
    // Run summarization in background (don't await)
    const summarizer = createSummarizationService(supabase);
    summarizer.summarize(conversation, persona).catch((err) => {
      logger.error(LOG_CATEGORIES.SUMMARIZATION, 'Background summarization failed', err);
    });
  }

  logger.info(LOG_CATEGORIES.CHAT, 'Chat response generated', {
    conversationId: conversation.id,
    tokens: response.usage.totalTokens,
  });

  return c.json({
    message: savedAssistantMessage,
    conversation_id: conversation.id,
    token_usage: response.usage,
  });
});

// ----------------------------------------------------------------------------
// POST /chat/stream - Send message and stream response (SSE)
// ----------------------------------------------------------------------------

chatRouter.post('/stream', async (c) => {
  const userId = c.get('userId');
  const supabase = getUserSupabase(c);
  const body = await c.req.json();

  // Validate input
  const parsed = parseBody(chatRequestSchema, body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error);
  }

  const { conversation_id, persona_id, message, metadata } = parsed.data;

  // Get or create conversation (same as non-streaming)
  let conversation: Conversation;
  let persona: Persona;

  if (conversation_id) {
    const { data: conv } = await supabase
      .from('conversations')
      .select('*, personas(*)')
      .eq('id', conversation_id)
      .is('deleted_at', null)
      .single();

    if (!conv) {
      throw new NotFoundError(ERROR_MESSAGES.CONVERSATION_NOT_FOUND);
    }

    conversation = conv;
    persona = conv.personas as unknown as Persona;
  } else if (persona_id) {
    const { data: p } = await supabase
      .from('personas')
      .select('*')
      .eq('id', persona_id)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (!p) {
      throw new NotFoundError(ERROR_MESSAGES.PERSONA_NOT_FOUND);
    }

    persona = p;

    const { data: conv, error } = await supabase
      .from('conversations')
      .insert({
        persona_id: persona_id,
        user_id: userId,
        title: `Chat with ${persona.name}`,
      })
      .select()
      .single();

    if (error || !conv) {
      throw new Error('Failed to create conversation');
    }

    conversation = conv;
  } else {
    throw new ValidationError('Either conversation_id or persona_id is required');
  }

  // Get recent messages
  const { data: recentMessages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: true })
    .limit(100);

  // Build context
  const contextBuilder = createContextBuilder(supabase, {
    maxTokens: persona.max_context_tokens,
    summarizationThreshold: persona.summarization_threshold,
  });

  const context = await contextBuilder.build(
    persona,
    conversation,
    message,
    recentMessages || []
  );

  // Save user message
  const userMessageTokens = countTokens(message);
  await supabase
    .from('messages')
    .insert({
      conversation_id: conversation.id,
      role: 'user',
      content: message,
      token_count: userMessageTokens,
      metadata: metadata,
    });

  // Prepare messages for LLM
  const llmMessages: ChatMessage[] = [
    { role: 'system', content: context.systemPrompt },
    ...context.messages,
    { role: 'user', content: message },
  ];

  // Stream response
  return streamSSE(c, async (stream) => {
    let fullResponse = '';

    try {
      // Send conversation ID first
      await stream.writeSSE({
        data: JSON.stringify({
          type: 'start',
          conversation_id: conversation.id,
        }),
      });

      // Stream chunks
      for await (const chunk of chatStream(llmMessages, { maxTokens: 2000 })) {
        fullResponse += chunk;
        await stream.writeSSE({
          data: JSON.stringify({
            type: 'chunk',
            content: chunk,
          }),
        });
      }

      // Save complete message
      const tokenCount = countTokens(fullResponse);
      const { data: savedMessage } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          role: 'assistant',
          content: fullResponse,
          token_count: tokenCount,
        })
        .select()
        .single();

      // Update conversation
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversation.id);

      // Send completion
      await stream.writeSSE({
        data: JSON.stringify({
          type: 'done',
          message_id: savedMessage?.id,
          token_count: tokenCount,
        }),
      });

      logger.info(LOG_CATEGORIES.CHAT, 'Stream complete', {
        conversationId: conversation.id,
        responseLength: fullResponse.length,
      });

      // Background summarization check
      if (context.summarizationTriggered) {
        const summarizer = createSummarizationService(supabase);
        summarizer.summarize(conversation, persona).catch((err) => {
          logger.error(LOG_CATEGORIES.SUMMARIZATION, 'Background summarization failed', err);
        });
      }
    } catch (error) {
      logger.error(LOG_CATEGORIES.CHAT, 'Stream error', error as Error);
      await stream.writeSSE({
        data: JSON.stringify({
          type: 'error',
          error: (error as Error).message,
        }),
      });
    }
  });
});

export default chatRouter;
