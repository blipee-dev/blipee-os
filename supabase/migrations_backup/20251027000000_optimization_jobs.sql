-- Optimization Jobs Table
-- For managing AI prompt optimization background jobs

CREATE TABLE IF NOT EXISTS optimization_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL CHECK (job_type IN (
    'pattern_analysis',
    'variant_generation',
    'experiment_creation',
    'experiment_monitoring',
    'full_cycle'
  )),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  priority INTEGER DEFAULT 0,

  created_by UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  params JSONB DEFAULT '{}'::jsonb,
  result JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Track attempts for retries
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_optimization_jobs_status ON optimization_jobs(status);
CREATE INDEX IF NOT EXISTS idx_optimization_jobs_type ON optimization_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_optimization_jobs_created_at ON optimization_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_optimization_jobs_org ON optimization_jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_optimization_jobs_pending ON optimization_jobs(status, created_at) WHERE status = 'pending';

-- Enable Row Level Security
ALTER TABLE optimization_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all jobs"
  ON optimization_jobs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('account_owner', 'admin')
    )
  );

CREATE POLICY "System can manage jobs"
  ON optimization_jobs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can create jobs"
  ON optimization_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('account_owner', 'admin')
    )
  );

-- Comments
COMMENT ON TABLE optimization_jobs IS 'Background jobs for AI prompt optimization worker';
COMMENT ON COLUMN optimization_jobs.job_type IS 'Type of optimization job to run';
COMMENT ON COLUMN optimization_jobs.status IS 'Current status: pending, running, completed, failed';
COMMENT ON COLUMN optimization_jobs.priority IS 'Higher number = higher priority';
COMMENT ON COLUMN optimization_jobs.params IS 'Job-specific parameters (e.g., days to analyze, strategy)';
COMMENT ON COLUMN optimization_jobs.result IS 'Job execution results';

-- Function to create a job
CREATE OR REPLACE FUNCTION create_optimization_job(
  p_job_type TEXT,
  p_params JSONB DEFAULT '{}'::jsonb,
  p_priority INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
BEGIN
  INSERT INTO optimization_jobs (
    job_type,
    params,
    priority,
    created_by
  ) VALUES (
    p_job_type,
    p_params,
    p_priority,
    auth.uid()
  )
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_optimization_job TO authenticated;

-- Function to get job status
CREATE OR REPLACE FUNCTION get_optimization_job_status(p_job_id UUID)
RETURNS TABLE (
  id UUID,
  job_type TEXT,
  status TEXT,
  result JSONB,
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.id,
    j.job_type,
    j.status,
    j.result,
    j.created_at,
    j.completed_at
  FROM optimization_jobs j
  WHERE j.id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_optimization_job_status TO authenticated;

-- Function to cleanup old completed jobs (auto-called via cron)
CREATE OR REPLACE FUNCTION cleanup_old_optimization_jobs()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM optimization_jobs
  WHERE status IN ('completed', 'failed')
  AND completed_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_optimization_jobs IS 'Delete optimization jobs older than 30 days';
