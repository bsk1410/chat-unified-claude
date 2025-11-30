-- ============================================================================
-- Migration: Conversation Summaries Table
-- Stores summaries for context window management
-- ============================================================================

-- Create conversation_summaries table
create table public.conversation_summaries (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,

  -- Summary content
  summary_text text not null,
  token_count integer not null,

  -- Messages included in this summary
  messages_summarized uuid[], -- array of message IDs included
  message_range_start timestamptz,
  message_range_end timestamptz,

  -- Standard columns
  created_at timestamptz default now() not null
);

-- Add comments
comment on table public.conversation_summaries is 'Summaries of conversation segments for context management';
comment on column public.conversation_summaries.messages_summarized is 'Array of message IDs that were summarized';
comment on column public.conversation_summaries.message_range_start is 'Timestamp of earliest message in summary';
comment on column public.conversation_summaries.message_range_end is 'Timestamp of latest message in summary';

-- Create indexes
create index idx_conversation_summaries_conversation_id on public.conversation_summaries(conversation_id);
create index idx_conversation_summaries_created on public.conversation_summaries(created_at desc);

-- Apply RLS
alter table public.conversation_summaries enable row level security;

-- RLS policies - access through conversation ownership
create policy "Users can view summaries for own conversations"
  on public.conversation_summaries for select
  using (
    conversation_id in (
      select id from public.conversations where user_id = auth.uid()
    )
  );

create policy "Users can create summaries for own conversations"
  on public.conversation_summaries for insert
  with check (
    conversation_id in (
      select id from public.conversations where user_id = auth.uid()
    )
  );

create policy "Users can delete summaries for own conversations"
  on public.conversation_summaries for delete
  using (
    conversation_id in (
      select id from public.conversations where user_id = auth.uid()
    )
  );
