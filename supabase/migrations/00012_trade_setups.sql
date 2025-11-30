-- ============================================================================
-- Migration: Trade Setups Table
-- Trading journal entries for journal_assistant persona type
-- ============================================================================

-- Create trade-specific enums
create type trade_setup_type as enum (
  'breakout',
  'reversal',
  'continuation',
  'range_play',
  'momentum',
  'mean_reversion',
  'gap_fill',
  'other'
);

create type trade_outcome as enum ('win', 'loss', 'breakeven', 'pending', 'skipped');

create type trade_timeframe as enum ('1m', '5m', '15m', '1h', '4h', 'daily', 'weekly');

-- Create trade_setups table
create table public.trade_setups (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid references public.personas(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,

  -- Setup details
  ticker text,
  setup_type trade_setup_type,
  timeframe trade_timeframe,
  setup_description text not null,

  -- User's analysis
  thought_process text,
  entry_reasoning text,
  risk_notes text,

  -- Outcome
  outcome trade_outcome,
  outcome_notes text,
  pnl_percent float,

  -- For similarity search
  embedding extensions.vector(1536),
  tags text[],

  -- Trade date
  trade_date date,

  -- Standard columns
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  deleted_at timestamptz
);

-- Add comments
comment on table public.trade_setups is 'Trading journal entries for pattern recognition and decision support';
comment on column public.trade_setups.embedding is 'Vector embedding of setup description for similarity search';
comment on column public.trade_setups.thought_process is 'User reasoning and analysis during the trade';
comment on column public.trade_setups.pnl_percent is 'Profit/loss percentage for the trade';

-- Create indexes
create index idx_trade_setups_persona_id on public.trade_setups(persona_id);
create index idx_trade_setups_user_id on public.trade_setups(user_id);
create index idx_trade_setups_ticker on public.trade_setups(ticker);
create index idx_trade_setups_setup_type on public.trade_setups(setup_type);
create index idx_trade_setups_outcome on public.trade_setups(outcome);
create index idx_trade_setups_trade_date on public.trade_setups(trade_date desc);
create index idx_trade_setups_deleted on public.trade_setups(deleted_at) where deleted_at is null;
create index idx_trade_setups_tags on public.trade_setups using gin(tags);

-- Create vector index for similarity search
create index idx_trade_setups_embedding on public.trade_setups
  using ivfflat (embedding extensions.vector_cosine_ops)
  with (lists = 100);

-- Apply RLS
alter table public.trade_setups enable row level security;

-- RLS policies
create policy "Users can view own trade setups"
  on public.trade_setups for select
  using (auth.uid() = user_id);

create policy "Users can create own trade setups"
  on public.trade_setups for insert
  with check (auth.uid() = user_id);

create policy "Users can update own trade setups"
  on public.trade_setups for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own trade setups"
  on public.trade_setups for delete
  using (auth.uid() = user_id);

-- Apply triggers
select apply_updated_at_trigger('trade_setups');

-- Create view for active trade setups
create view public.trade_setups_active as
select * from public.trade_setups where deleted_at is null;

comment on view public.trade_setups_active is 'View of non-deleted trade setups';
