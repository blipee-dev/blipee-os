-- Migration: Schema migrations tracking table
-- Date: 2025-08-28
-- Description: Create table for tracking database migrations

-- Create schema migrations table
CREATE TABLE IF NOT EXISTS public.schema_migrations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version BIGINT NOT NULL UNIQUE,
  checksum TEXT NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  executed_by UUID REFERENCES auth.users(id),
  execution_time_ms INTEGER,
  status TEXT DEFAULT 'applied' CHECK (status IN ('pending', 'applied', 'failed', 'rolled_back')),
  error_message TEXT,
  rollback_sql TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_migrations_version ON public.schema_migrations(version);
CREATE INDEX IF NOT EXISTS idx_migrations_status ON public.schema_migrations(status);
CREATE INDEX IF NOT EXISTS idx_migrations_applied ON public.schema_migrations(applied_at DESC);

-- Enable RLS
ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;

-- Only admins can view migrations
CREATE POLICY "Admins can view migrations" ON public.schema_migrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND role = 'account_owner'
    )
  );

-- Service role can manage migrations
CREATE POLICY "Service role can manage migrations" ON public.schema_migrations
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant permissions
GRANT SELECT ON public.schema_migrations TO authenticated;
GRANT ALL ON public.schema_migrations TO service_role;

-- Add comment
COMMENT ON TABLE public.schema_migrations IS 'Tracks all database migrations with execution history and status';