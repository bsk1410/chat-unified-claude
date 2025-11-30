-- ============================================================================
-- Migration: Conversations Table
-- Stores conversation sessions between users and personas
-- ============================================================================

-- Create conversations table
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid references public.personas(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,

  -- Conversation info
  title text,
  summary text, -- rolling summary of conversation
  summary_token_count integer default 0,

  -- Metadata
  metadata jsonb default '{}',
  is_archived boolean default false,

  -- Standard columns
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  deleted_at timestamptz
);

-- Add comments
comment on table public.conversations is 'Chat conversation sessions';
comment on column public.conversations.summary is 'Rolling summary of the conversation for context management';
comment on column public.conversations.summary_token_count is 'Token count of the current summary';

-- Create indexes
create index idx_conversations_persona_id on public.conversations(persona_id);
create index idx_conversations_user_id on public.conversations(user_id);
create index idx_conversations_archived on public.conversations(is_archived);
create index idx_conversations_created on public.conversations(created_at desc);
create index idx_conversations_deleted on public.conversations(deleted_at) where deleted_at is null;

-- Apply RLS
alter table public.conversations enable row level security;

-- RLS policies
create policy "Users can view own conversations"
  on public.conversations for select
  using (auth.uid() = user_id);

create policy "Users can create own conversations"
  on public.conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own conversations"
  on public.conversations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own conversations"
  on public.conversations for delete
  using (auth.uid() = user_id);

-- Apply triggers
select apply_updated_at_trigger('conversations');
select apply_audit_trigger('conversations');

-- Create view for active conversations
create view public.conversations_active as
select * from public.conversations where deleted_at is null;

comment on view public.conversations_active is 'View of non-deleted conversations';
