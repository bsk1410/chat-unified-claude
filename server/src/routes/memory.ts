// ============================================================================
// Memory Routes
// Facts and documents management for personas
// ============================================================================

import { Hono } from 'hono';
import { getUserSupabase } from '../middleware/auth';
import { logger, LOG_CATEGORIES } from '../services/logger';
import { parseBody } from '../lib/validation';
import { createFactSchema, updateFactSchema, createDocumentSchema, searchDocumentsSchema } from '../lib/validation';
import { NotFoundError, ValidationError } from '../middleware/error-handler';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../lib/constants';
import { createMemoryServices } from '../services/memory';

// ----------------------------------------------------------------------------
// Router
// ----------------------------------------------------------------------------

const memory = new Hono();

// ----------------------------------------------------------------------------
// GET /personas/:id/facts - List facts for persona
// ----------------------------------------------------------------------------

memory.get('/:personaId/facts', async (c) => {
  const personaId = c.req.param('personaId');
  const supabase = getUserSupabase(c);

  // Verify persona exists
  const { data: persona } = await supabase
    .from('personas')
    .select('id')
    .eq('id', personaId)
    .is('deleted_at', null)
    .single();

  if (!persona) {
    throw new NotFoundError(ERROR_MESSAGES.PERSONA_NOT_FOUND);
  }

  const { facts } = createMemoryServices(supabase);
  const data = await facts.getFacts(personaId);

  return c.json({ data });
});

// ----------------------------------------------------------------------------
// POST /personas/:id/facts - Add fact
// ----------------------------------------------------------------------------

memory.post('/:personaId/facts', async (c) => {
  const personaId = c.req.param('personaId');
  const userId = c.get('userId');
  const supabase = getUserSupabase(c);
  const body = await c.req.json();

  // Validate input
  const parsed = parseBody(createFactSchema, body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error);
  }

  // Verify persona exists
  const { data: persona } = await supabase
    .from('personas')
    .select('id')
    .eq('id', personaId)
    .is('deleted_at', null)
    .single();

  if (!persona) {
    throw new NotFoundError(ERROR_MESSAGES.PERSONA_NOT_FOUND);
  }

  const { facts } = createMemoryServices(supabase);
  const fact = await facts.addFact({
    ...parsed.data,
    persona_id: personaId,
    user_id: userId,
  });

  if (!fact) {
    throw new Error('Failed to add fact');
  }

  logger.info(LOG_CATEGORIES.MEMORY, 'Fact added', { factId: fact.id, personaId });

  return c.json({
    message: SUCCESS_MESSAGES.FACT_ADDED,
    data: fact,
  }, 201);
});

// ----------------------------------------------------------------------------
// PATCH /personas/:id/facts/:factId - Update fact
// ----------------------------------------------------------------------------

memory.patch('/:personaId/facts/:factId', async (c) => {
  const factId = c.req.param('factId');
  const supabase = getUserSupabase(c);
  const body = await c.req.json();

  // Validate input
  const parsed = parseBody(updateFactSchema, body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error);
  }

  const { facts } = createMemoryServices(supabase);
  const fact = await facts.updateFact(factId, parsed.data);

  if (!fact) {
    throw new NotFoundError(ERROR_MESSAGES.FACT_NOT_FOUND);
  }

  return c.json({ data: fact });
});

// ----------------------------------------------------------------------------
// DELETE /personas/:id/facts/:factId - Delete fact
// ----------------------------------------------------------------------------

memory.delete('/:personaId/facts/:factId', async (c) => {
  const factId = c.req.param('factId');
  const supabase = getUserSupabase(c);

  const { facts } = createMemoryServices(supabase);
  const success = await facts.deleteFact(factId);

  if (!success) {
    throw new NotFoundError(ERROR_MESSAGES.FACT_NOT_FOUND);
  }

  return c.json({ message: 'Fact deleted' });
});

// ----------------------------------------------------------------------------
// GET /personas/:id/documents - List documents
// ----------------------------------------------------------------------------

memory.get('/:personaId/documents', async (c) => {
  const personaId = c.req.param('personaId');
  const supabase = getUserSupabase(c);

  // Verify persona exists
  const { data: persona } = await supabase
    .from('personas')
    .select('id')
    .eq('id', personaId)
    .is('deleted_at', null)
    .single();

  if (!persona) {
    throw new NotFoundError(ERROR_MESSAGES.PERSONA_NOT_FOUND);
  }

  const { documents } = createMemoryServices(supabase);
  const data = await documents.getDocuments(personaId);

  return c.json({ data });
});

// ----------------------------------------------------------------------------
// POST /personas/:id/documents - Add document
// ----------------------------------------------------------------------------

memory.post('/:personaId/documents', async (c) => {
  const personaId = c.req.param('personaId');
  const userId = c.get('userId');
  const supabase = getUserSupabase(c);
  const body = await c.req.json();

  // Validate input
  const parsed = parseBody(createDocumentSchema, body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error);
  }

  // Verify persona exists
  const { data: persona } = await supabase
    .from('personas')
    .select('id')
    .eq('id', personaId)
    .is('deleted_at', null)
    .single();

  if (!persona) {
    throw new NotFoundError(ERROR_MESSAGES.PERSONA_NOT_FOUND);
  }

  const { documents } = createMemoryServices(supabase);
  const docs = await documents.addDocument(
    personaId,
    userId,
    parsed.data.content,
    {
      sourceType: parsed.data.source_type,
      sourceUrl: parsed.data.source_url,
      sourceMetadata: parsed.data.source_metadata,
    }
  );

  logger.info(LOG_CATEGORIES.MEMORY, 'Documents added', {
    personaId,
    count: docs.length,
  });

  return c.json({
    message: SUCCESS_MESSAGES.DOCUMENT_ADDED,
    data: {
      documentsCreated: docs.length,
    },
  }, 201);
});

// ----------------------------------------------------------------------------
// DELETE /personas/:id/documents/:docId - Delete document
// ----------------------------------------------------------------------------

memory.delete('/:personaId/documents/:docId', async (c) => {
  const docId = c.req.param('docId');
  const supabase = getUserSupabase(c);

  const { documents } = createMemoryServices(supabase);
  const success = await documents.deleteDocument(docId);

  if (!success) {
    throw new NotFoundError(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);
  }

  return c.json({ message: 'Document deleted' });
});

// ----------------------------------------------------------------------------
// POST /personas/:id/documents/search - Semantic search
// ----------------------------------------------------------------------------

memory.post('/:personaId/documents/search', async (c) => {
  const personaId = c.req.param('personaId');
  const supabase = getUserSupabase(c);
  const body = await c.req.json();

  // Validate input
  const parsed = parseBody(searchDocumentsSchema, body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error);
  }

  // Verify persona exists
  const { data: persona } = await supabase
    .from('personas')
    .select('id')
    .eq('id', personaId)
    .is('deleted_at', null)
    .single();

  if (!persona) {
    throw new NotFoundError(ERROR_MESSAGES.PERSONA_NOT_FOUND);
  }

  const { documents } = createMemoryServices(supabase);
  const results = await documents.searchDocuments(
    personaId,
    parsed.data.query,
    parsed.data.limit
  );

  return c.json({ data: results });
});

export default memory;
