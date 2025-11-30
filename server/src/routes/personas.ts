// ============================================================================
// Personas Routes
// CRUD operations for personas
// ============================================================================

import { Hono } from 'hono';
import { getUserSupabase } from '../middleware/auth';
import { logger, LOG_CATEGORIES } from '../services/logger';
import { parseBody } from '../lib/validation';
import { createPersonaSchema, updatePersonaSchema } from '../lib/validation';
import { NotFoundError, ValidationError } from '../middleware/error-handler';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../lib/constants';
import type { PersonaInsert } from '../db/types';

// ----------------------------------------------------------------------------
// Router
// ----------------------------------------------------------------------------

const personas = new Hono();

// ----------------------------------------------------------------------------
// GET /personas - List user's personas
// ----------------------------------------------------------------------------

personas.get('/', async (c) => {
  const userId = c.get('userId');
  const supabase = getUserSupabase(c);

  const { data, error } = await supabase
    .from('personas')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error(LOG_CATEGORIES.API, 'Failed to list personas', new Error(error.message));
    throw new Error(error.message);
  }

  return c.json({ data });
});

// ----------------------------------------------------------------------------
// POST /personas - Create persona
// ----------------------------------------------------------------------------

personas.post('/', async (c) => {
  const userId = c.get('userId');
  const supabase = getUserSupabase(c);
  const body = await c.req.json();

  // Validate input
  const parsed = parseBody(createPersonaSchema, body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error);
  }

  const personaData: PersonaInsert = {
    ...parsed.data,
    user_id: userId,
  };

  const { data, error } = await supabase
    .from('personas')
    .insert(personaData)
    .select()
    .single();

  if (error) {
    logger.error(LOG_CATEGORIES.API, 'Failed to create persona', new Error(error.message));
    throw new Error(error.message);
  }

  logger.info(LOG_CATEGORIES.API, 'Persona created', { personaId: data.id });

  return c.json({
    message: SUCCESS_MESSAGES.PERSONA_CREATED,
    data,
  }, 201);
});

// ----------------------------------------------------------------------------
// GET /personas/:id - Get persona details
// ----------------------------------------------------------------------------

personas.get('/:id', async (c) => {
  const personaId = c.req.param('id');
  const supabase = getUserSupabase(c);

  const { data, error } = await supabase
    .from('personas')
    .select('*')
    .eq('id', personaId)
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    throw new NotFoundError(ERROR_MESSAGES.PERSONA_NOT_FOUND);
  }

  return c.json({ data });
});

// ----------------------------------------------------------------------------
// PATCH /personas/:id - Update persona
// ----------------------------------------------------------------------------

personas.patch('/:id', async (c) => {
  const personaId = c.req.param('id');
  const supabase = getUserSupabase(c);
  const body = await c.req.json();

  // Validate input
  const parsed = parseBody(updatePersonaSchema, body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error);
  }

  // Check if persona exists
  const { data: existing } = await supabase
    .from('personas')
    .select('id')
    .eq('id', personaId)
    .is('deleted_at', null)
    .single();

  if (!existing) {
    throw new NotFoundError(ERROR_MESSAGES.PERSONA_NOT_FOUND);
  }

  const { data, error } = await supabase
    .from('personas')
    .update(parsed.data)
    .eq('id', personaId)
    .select()
    .single();

  if (error) {
    logger.error(LOG_CATEGORIES.API, 'Failed to update persona', new Error(error.message));
    throw new Error(error.message);
  }

  logger.info(LOG_CATEGORIES.API, 'Persona updated', { personaId });

  return c.json({
    message: SUCCESS_MESSAGES.PERSONA_UPDATED,
    data,
  });
});

// ----------------------------------------------------------------------------
// DELETE /personas/:id - Soft delete persona
// ----------------------------------------------------------------------------

personas.delete('/:id', async (c) => {
  const personaId = c.req.param('id');
  const supabase = getUserSupabase(c);

  // Check if persona exists
  const { data: existing } = await supabase
    .from('personas')
    .select('id')
    .eq('id', personaId)
    .is('deleted_at', null)
    .single();

  if (!existing) {
    throw new NotFoundError(ERROR_MESSAGES.PERSONA_NOT_FOUND);
  }

  // Soft delete
  const { error } = await supabase
    .from('personas')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', personaId);

  if (error) {
    logger.error(LOG_CATEGORIES.API, 'Failed to delete persona', new Error(error.message));
    throw new Error(error.message);
  }

  logger.info(LOG_CATEGORIES.API, 'Persona deleted', { personaId });

  return c.json({ message: SUCCESS_MESSAGES.PERSONA_DELETED });
});

// ----------------------------------------------------------------------------
// POST /personas/:id/import - Import source data
// ----------------------------------------------------------------------------

personas.post('/:id/import', async (c) => {
  const personaId = c.req.param('id');
  const userId = c.get('userId');
  const supabase = getUserSupabase(c);
  const body = await c.req.json();

  // Check if persona exists and is simulated_person type
  const { data: persona } = await supabase
    .from('personas')
    .select('*')
    .eq('id', personaId)
    .is('deleted_at', null)
    .single();

  if (!persona) {
    throw new NotFoundError(ERROR_MESSAGES.PERSONA_NOT_FOUND);
  }

  // Import based on type
  const { content, source_type, source_url, source_metadata } = body;

  if (!content || typeof content !== 'string') {
    throw new ValidationError('Content is required');
  }

  // Import as documents
  const { createMemoryServices } = await import('../services/memory');
  const { documents } = createMemoryServices(supabase);

  const imported = await documents.addDocument(personaId, userId, content, {
    sourceType: source_type || 'import',
    sourceUrl: source_url,
    sourceMetadata: source_metadata || {},
  });

  logger.info(LOG_CATEGORIES.API, 'Content imported', {
    personaId,
    documentCount: imported.length,
  });

  return c.json({
    message: SUCCESS_MESSAGES.IMPORT_STARTED,
    data: {
      documentsCreated: imported.length,
      totalChunks: imported.length,
    },
  });
});

export default personas;
