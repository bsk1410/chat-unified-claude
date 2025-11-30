// ============================================================================
// Trade Routes
// Trading journal management for journal_assistant personas
// ============================================================================

import { Hono } from 'hono';
import { getUserSupabase } from '../middleware/auth';
import { logger, LOG_CATEGORIES } from '../services/logger';
import { parseBody, parseQuery, paginationSchema } from '../lib/validation';
import { createTradeSetupSchema, updateTradeSetupSchema, searchSimilarTradesSchema } from '../lib/validation';
import { NotFoundError, ValidationError } from '../middleware/error-handler';
import { ERROR_MESSAGES } from '../lib/constants';
import { createMemoryServices } from '../services/memory';

// ----------------------------------------------------------------------------
// Router
// ----------------------------------------------------------------------------

const trades = new Hono();

// ----------------------------------------------------------------------------
// GET /trades - List trade setups
// ----------------------------------------------------------------------------

trades.get('/', async (c) => {
  const userId = c.get('userId');
  const supabase = getUserSupabase(c);

  // Parse query params
  const query = new URL(c.req.url).searchParams;
  const personaId = query.get('persona_id');

  const paginationResult = parseQuery(paginationSchema, query);
  const { page, pageSize } = paginationResult.success
    ? paginationResult.data
    : { page: 1, pageSize: 20 };

  const { trades: tradeService } = createMemoryServices(supabase);
  const data = await tradeService.getTradeSetups(userId, {
    personaId: personaId || undefined,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  return c.json({
    data,
    pagination: {
      page,
      pageSize,
    },
  });
});

// ----------------------------------------------------------------------------
// POST /trades - Create trade setup
// ----------------------------------------------------------------------------

trades.post('/', async (c) => {
  const userId = c.get('userId');
  const supabase = getUserSupabase(c);
  const body = await c.req.json();

  // Validate input
  const parsed = parseBody(createTradeSetupSchema, body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error);
  }

  // Verify persona exists and is journal_assistant type
  const { data: persona } = await supabase
    .from('personas')
    .select('id, type')
    .eq('id', parsed.data.persona_id)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  if (!persona) {
    throw new NotFoundError(ERROR_MESSAGES.PERSONA_NOT_FOUND);
  }

  if (persona.type !== 'journal_assistant') {
    throw new ValidationError('Trade setups can only be added to journal_assistant personas');
  }

  const { trades: tradeService } = createMemoryServices(supabase);
  const setup = await tradeService.addTradeSetup({
    ...parsed.data,
    user_id: userId,
  });

  if (!setup) {
    throw new Error('Failed to create trade setup');
  }

  logger.info(LOG_CATEGORIES.TRADE, 'Trade setup created', { setupId: setup.id });

  return c.json({
    message: 'Trade setup created',
    data: setup,
  }, 201);
});

// ----------------------------------------------------------------------------
// GET /trades/:id - Get trade setup
// ----------------------------------------------------------------------------

trades.get('/:id', async (c) => {
  const setupId = c.req.param('id');
  const supabase = getUserSupabase(c);

  const { data, error } = await supabase
    .from('trade_setups')
    .select('*')
    .eq('id', setupId)
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    throw new NotFoundError(ERROR_MESSAGES.TRADE_NOT_FOUND);
  }

  return c.json({ data });
});

// ----------------------------------------------------------------------------
// PATCH /trades/:id - Update trade setup
// ----------------------------------------------------------------------------

trades.patch('/:id', async (c) => {
  const setupId = c.req.param('id');
  const supabase = getUserSupabase(c);
  const body = await c.req.json();

  // Validate input
  const parsed = parseBody(updateTradeSetupSchema, body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error);
  }

  const { trades: tradeService } = createMemoryServices(supabase);
  const setup = await tradeService.updateTradeSetup(setupId, parsed.data);

  if (!setup) {
    throw new NotFoundError(ERROR_MESSAGES.TRADE_NOT_FOUND);
  }

  logger.info(LOG_CATEGORIES.TRADE, 'Trade setup updated', { setupId });

  return c.json({
    message: 'Trade setup updated',
    data: setup,
  });
});

// ----------------------------------------------------------------------------
// DELETE /trades/:id - Delete trade setup
// ----------------------------------------------------------------------------

trades.delete('/:id', async (c) => {
  const setupId = c.req.param('id');
  const supabase = getUserSupabase(c);

  const { trades: tradeService } = createMemoryServices(supabase);
  const success = await tradeService.deleteTradeSetup(setupId);

  if (!success) {
    throw new NotFoundError(ERROR_MESSAGES.TRADE_NOT_FOUND);
  }

  logger.info(LOG_CATEGORIES.TRADE, 'Trade setup deleted', { setupId });

  return c.json({ message: 'Trade setup deleted' });
});

// ----------------------------------------------------------------------------
// POST /trades/similar - Find similar setups
// ----------------------------------------------------------------------------

trades.post('/similar', async (c) => {
  const userId = c.get('userId');
  const supabase = getUserSupabase(c);
  const body = await c.req.json();

  // Validate input
  const parsed = parseBody(searchSimilarTradesSchema, body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error);
  }

  const { trades: tradeService } = createMemoryServices(supabase);
  const results = await tradeService.findSimilarSetups(userId, parsed.data.query, {
    limit: parsed.data.limit,
    personaId: parsed.data.persona_id,
  });

  return c.json({ data: results });
});

export default trades;
