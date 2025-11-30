-- ============================================================================
-- Migration: Personas Table
-- Core table for storing persona configurations
-- ============================================================================

-- Create persona type enum
create type persona_type as enum ('simulated_person', 'journal_assistant', 'companion', 'custom');
create type memory_strategy as enum ('array', 'rag', 'hybrid');

-- Create personas table
create table public.personas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,

  -- Identity
  name text not null,
  type persona_type not null,
  avatar_url text,

  -- Behavior
  system_prompt text not null,
  voice_notes text, -- style guidance: tone, vocabulary, quirks

  -- Memory configuration
  memory_strategy memory_strategy not null default 'array',
  max_context_tokens integer default 32000,
  summarization_threshold float default 0.8,
  memory_retrieval_count integer default 5,

  -- Metadata
  source_data jsonb default '{}', -- for simulated_person: profile URLs, scrape metadata
  is_active boolean default true,

  -- Standard columns
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  deleted_at timestamptz
);

-- Add comments
comment on table public.personas is 'Persona configurations for the chat engine';
comment on column public.personas.type is 'Type of persona: simulated_person, journal_assistant, companion, or custom';
comment on column public.personas.memory_strategy is 'How memory is stored and retrieved: array (simple facts), rag (vector search), or hybrid';
comment on column public.personas.source_data is 'Source data for persona creation, e.g., Twitter profile info for simulated_person';

-- Create indexes
create index idx_personas_user_id on public.personas(user_id);
create index idx_personas_type on public.personas(type);
create index idx_personas_active on public.personas(is_active) where is_active = true;
create index idx_personas_deleted on public.personas(deleted_at) where deleted_at is null;

-- Apply RLS and triggers
alter table public.personas enable row level security;

-- RLS policies - users can only access their own personas
create policy "Users can view own personas"
  on public.personas for select
  using (auth.uid() = user_id);

create policy "Users can create own personas"
  on public.personas for insert
  with check (auth.uid() = user_id);

create policy "Users can update own personas"
  on public.personas for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own personas"
  on public.personas for delete
  using (auth.uid() = user_id);

-- Apply updated_at trigger
select apply_updated_at_trigger('personas');

-- Apply audit trigger
select apply_audit_trigger('personas');

-- Create view for active personas
create view public.personas_active as
select * from public.personas where deleted_at is null and is_active = true;

comment on view public.personas_active is 'View of active, non-deleted personas';
