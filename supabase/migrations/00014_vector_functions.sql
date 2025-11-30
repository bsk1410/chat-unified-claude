-- ============================================================================
-- Migration: Vector Search Functions
-- Supabase RPC functions for similarity search
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Search Persona Documents by Vector Similarity
-- ----------------------------------------------------------------------------
create or replace function search_persona_documents(
  p_persona_id uuid,
  p_embedding extensions.vector(1536),
  p_limit int default 5
)
returns table (
  id uuid,
  content text,
  source_type document_source_type,
  source_url text,
  similarity float
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    pd.id,
    pd.content,
    pd.source_type,
    pd.source_url,
    1 - (pd.embedding <=> p_embedding) as similarity
  from persona_documents pd
  where pd.persona_id = p_persona_id
    and pd.deleted_at is null
    and pd.embedding is not null
  order by pd.embedding <=> p_embedding
  limit p_limit;
end;
$$;

comment on function search_persona_documents is 'Search persona documents by vector similarity using cosine distance';

-- ----------------------------------------------------------------------------
-- Search Trade Setups by Vector Similarity
-- ----------------------------------------------------------------------------
create or replace function search_trade_setups(
  p_user_id uuid,
  p_embedding extensions.vector(1536),
  p_limit int default 5,
  p_persona_id uuid default null
)
returns table (
  id uuid,
  ticker text,
  setup_type trade_setup_type,
  setup_description text,
  thought_process text,
  outcome trade_outcome,
  outcome_notes text,
  pnl_percent float,
  trade_date date,
  similarity float
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    ts.id,
    ts.ticker,
    ts.setup_type,
    ts.setup_description,
    ts.thought_process,
    ts.outcome,
    ts.outcome_notes,
    ts.pnl_percent,
    ts.trade_date,
    1 - (ts.embedding <=> p_embedding) as similarity
  from trade_setups ts
  where ts.user_id = p_user_id
    and ts.deleted_at is null
    and ts.embedding is not null
    and (p_persona_id is null or ts.persona_id = p_persona_id)
  order by ts.embedding <=> p_embedding
  limit p_limit;
end;
$$;

comment on function search_trade_setups is 'Search trade setups by vector similarity for finding similar past trades';

-- ----------------------------------------------------------------------------
-- Get Conversation Message Count and Token Total
-- ----------------------------------------------------------------------------
create or replace function get_conversation_stats(p_conversation_id uuid)
returns table (
  message_count bigint,
  total_tokens bigint,
  unsummarized_count bigint,
  unsummarized_tokens bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    count(*)::bigint as message_count,
    coalesce(sum(token_count), 0)::bigint as total_tokens,
    count(*) filter (where not is_summarized)::bigint as unsummarized_count,
    coalesce(sum(token_count) filter (where not is_summarized), 0)::bigint as unsummarized_tokens
  from messages
  where conversation_id = p_conversation_id;
end;
$$;

comment on function get_conversation_stats is 'Get message count and token statistics for a conversation';

-- ----------------------------------------------------------------------------
-- Mark Messages as Summarized
-- ----------------------------------------------------------------------------
create or replace function mark_messages_summarized(
  p_message_ids uuid[],
  p_summary_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update messages
  set
    is_summarized = true,
    included_in_summary_id = p_summary_id
  where id = any(p_message_ids);
end;
$$;

comment on function mark_messages_summarized is 'Mark messages as included in a summary';

-- ----------------------------------------------------------------------------
-- Get Recent Unsummarized Messages
-- ----------------------------------------------------------------------------
create or replace function get_unsummarized_messages(
  p_conversation_id uuid,
  p_limit int default 100
)
returns table (
  id uuid,
  role message_role,
  content text,
  token_count integer,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    m.id,
    m.role,
    m.content,
    m.token_count,
    m.created_at
  from messages m
  where m.conversation_id = p_conversation_id
    and not m.is_summarized
  order by m.created_at asc
  limit p_limit;
end;
$$;

comment on function get_unsummarized_messages is 'Get unsummarized messages for a conversation';

-- ----------------------------------------------------------------------------
-- Get Persona Facts Ordered by Importance
-- ----------------------------------------------------------------------------
create or replace function get_persona_facts_ranked(
  p_persona_id uuid,
  p_limit int default 30
)
returns table (
  id uuid,
  fact_text text,
  category fact_category,
  importance float
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    pf.id,
    pf.fact_text,
    pf.category,
    pf.importance
  from persona_facts pf
  where pf.persona_id = p_persona_id
    and pf.is_active = true
    and pf.deleted_at is null
  order by pf.importance desc, pf.created_at desc
  limit p_limit;
end;
$$;

comment on function get_persona_facts_ranked is 'Get persona facts ordered by importance';

-- ----------------------------------------------------------------------------
-- Cleanup Old Summaries (keep only the latest N per conversation)
-- ----------------------------------------------------------------------------
create or replace function cleanup_old_summaries(
  p_conversation_id uuid,
  p_keep_count int default 5
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from conversation_summaries
  where conversation_id = p_conversation_id
    and id not in (
      select id from conversation_summaries
      where conversation_id = p_conversation_id
      order by created_at desc
      limit p_keep_count
    );
end;
$$;

comment on function cleanup_old_summaries is 'Remove old summaries keeping only the most recent ones';

-- ----------------------------------------------------------------------------
-- Grant Execute Permissions
-- ----------------------------------------------------------------------------
grant execute on function search_persona_documents to authenticated;
grant execute on function search_trade_setups to authenticated;
grant execute on function get_conversation_stats to authenticated;
grant execute on function mark_messages_summarized to authenticated;
grant execute on function get_unsummarized_messages to authenticated;
grant execute on function get_persona_facts_ranked to authenticated;
grant execute on function cleanup_old_summaries to authenticated;
