-- ============================================================================
-- Migration: 00001_extensions.sql
-- Description: Enable required PostgreSQL extensions
-- ============================================================================

-- UUID generation support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Full-text search (optional but useful for search features)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
