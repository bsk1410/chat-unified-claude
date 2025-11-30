-- ============================================================================
-- Migration: Persona Facts Table
-- Simple facts storage for array memory strategy
-- ============================================================================

-- Create fact category enum
create type fact_category as enum (
  'preference',
  'biographical',
  'behavioral',
  'opinion',
  'relationship',
  'goal',
  'trait',
  'other'
);

-- Create persona_facts table
create table public.persona_facts (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid references public.personas(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,

  -- Fact content
  fact_text text not null,
  category fact_category,
  importance float default 0.5 check (importance >= 0 and importance <= 1),

  -- Source tracking
  source_conversation_id uuid references public.conversations(id) on delete set null,

  -- Status
  is_active boolean default true,

  -- Standard columns
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  deleted_at timestamptz
);

-- Add comments
comment on table public.persona_facts is 'Simple facts about personas for array memory strategy';
comment on column public.persona_facts.importance is 'Importance score from 0-1 for prioritizing facts in context';
comment on column public.persona_facts.source_conversation_id is 'Conversation where this fact was extracted from';

-- Create indexes
create index idx_persona_facts_persona_id on public.persona_facts(persona_id);
create index idx_persona_facts_user_id on public.persona_facts(user_id);
create index idx_persona_facts_category on public.persona_facts(category);
create index idx_persona_facts_importance on public.persona_facts(importance desc);
create index idx_persona_facts_active on public.persona_facts(is_active) where is_active = true;
create index idx_persona_facts_deleted on public.persona_facts(deleted_at) where deleted_at is null;

-- Apply RLS
alter table public.persona_facts enable row level security;

-- RLS policies - access through persona ownership
create policy "Users can view facts for own personas"
  on public.persona_facts for select
  using (auth.uid() = user_id);

create policy "Users can create facts for own personas"
  on public.persona_facts for insert
  with check (
    auth.uid() = user_id and
    persona_id in (select id from public.personas where user_id = auth.uid())
  );

create policy "Users can update facts for own personas"
  on public.persona_facts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete facts for own personas"
  on public.persona_facts for delete
  using (auth.uid() = user_id);

-- Apply triggers
select apply_updated_at_trigger('persona_facts');

-- Create view for active facts
create view public.persona_facts_active as
select * from public.persona_facts where deleted_at is null and is_active = true;

comment on view public.persona_facts_active is 'View of active, non-deleted facts';
