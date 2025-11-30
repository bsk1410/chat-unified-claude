-- ============================================================================
-- Migration: Persona Documents Table
-- Document storage with vector embeddings for RAG memory strategy
-- ============================================================================

-- Create document source type enum
create type document_source_type as enum ('tweet', 'article', 'conversation', 'manual', 'import');

-- Create persona_documents table
create table public.persona_documents (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid references public.personas(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,

  -- Content
  content text not null,
  embedding extensions.vector(1536), -- OpenAI text-embedding-3-small dimensions

  -- Source tracking
  source_type document_source_type,
  source_url text,
  source_metadata jsonb default '{}',

  -- For multi-chunk documents
  chunk_index integer,

  -- Standard columns
  created_at timestamptz default now() not null,
  deleted_at timestamptz
);

-- Add comments
comment on table public.persona_documents is 'Documents with embeddings for RAG memory strategy';
comment on column public.persona_documents.embedding is '1536-dimensional vector from text-embedding-3-small';
comment on column public.persona_documents.chunk_index is 'Index when document is split into multiple chunks';

-- Create indexes
create index idx_persona_documents_persona_id on public.persona_documents(persona_id);
create index idx_persona_documents_user_id on public.persona_documents(user_id);
create index idx_persona_documents_source_type on public.persona_documents(source_type);
create index idx_persona_documents_deleted on public.persona_documents(deleted_at) where deleted_at is null;

-- Create vector index for similarity search (IVFFlat for better performance on larger datasets)
-- Note: This index works best with at least 1000 rows. For smaller datasets, it will still work
-- but may not provide optimal performance. Consider using HNSW for smaller datasets.
create index idx_persona_documents_embedding on public.persona_documents
  using ivfflat (embedding extensions.vector_cosine_ops)
  with (lists = 100);

-- Apply RLS
alter table public.persona_documents enable row level security;

-- RLS policies
create policy "Users can view documents for own personas"
  on public.persona_documents for select
  using (auth.uid() = user_id);

create policy "Users can create documents for own personas"
  on public.persona_documents for insert
  with check (
    auth.uid() = user_id and
    persona_id in (select id from public.personas where user_id = auth.uid())
  );

create policy "Users can update documents for own personas"
  on public.persona_documents for update
  using (auth.uid() = user_id);

create policy "Users can delete documents for own personas"
  on public.persona_documents for delete
  using (auth.uid() = user_id);

-- Create view for active documents
create view public.persona_documents_active as
select * from public.persona_documents where deleted_at is null;

comment on view public.persona_documents_active is 'View of non-deleted documents';
