-- ============================================================================
-- Migration: Messages Table
-- Stores individual messages in conversations
-- ============================================================================

-- Create message role enum
create type message_role as enum ('user', 'assistant', 'system');

-- Create messages table
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,

  -- Message content
  role message_role not null,
  content text not null,
  token_count integer not null,

  -- For context management
  is_summarized boolean default false,
  included_in_summary_id uuid, -- reference to which summary batch included this

  -- Metadata
  metadata jsonb default '{}', -- tool calls, citations, etc.

  -- Standard columns (messages are immutable, no updated_at)
  created_at timestamptz default now() not null
);

-- Add comments
comment on table public.messages is 'Chat messages within conversations';
comment on column public.messages.token_count is 'Number of tokens in the message content';
comment on column public.messages.is_summarized is 'Whether this message has been included in a summary';
comment on column public.messages.included_in_summary_id is 'ID of the summary that includes this message';

-- Create indexes
create index idx_messages_conversation_id on public.messages(conversation_id);
create index idx_messages_created on public.messages(created_at);
create index idx_messages_conversation_created on public.messages(conversation_id, created_at);
create index idx_messages_summarized on public.messages(is_summarized) where is_summarized = false;

-- Apply RLS
alter table public.messages enable row level security;

-- RLS policies - access through conversation ownership
create policy "Users can view messages in own conversations"
  on public.messages for select
  using (
    conversation_id in (
      select id from public.conversations where user_id = auth.uid()
    )
  );

create policy "Users can create messages in own conversations"
  on public.messages for insert
  with check (
    conversation_id in (
      select id from public.conversations where user_id = auth.uid()
    )
  );

create policy "Users can update messages in own conversations"
  on public.messages for update
  using (
    conversation_id in (
      select id from public.conversations where user_id = auth.uid()
    )
  );

create policy "Users can delete messages in own conversations"
  on public.messages for delete
  using (
    conversation_id in (
      select id from public.conversations where user_id = auth.uid()
    )
  );

-- No audit trigger for messages (too many writes, use conversation audit instead)
