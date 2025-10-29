-- AI Agent Orchestrator
-- Background service state management and job scheduling

-- Agent Jobs Table
-- Tracks all scheduled and executed optimization jobs
CREATE TABLE IF NOT EXISTS public.ai_agent_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Job identification
  job_type TEXT NOT NULL CHECK (job_type IN (
    'pattern_analysis',
    'variant_generation',
    'experiment_creation',
    'experiment_monitoring',
    'full_optimization_cycle'
  )),
  job_name TEXT NOT NULL,

  -- Scheduling
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('once', 'recurring', 'manual')) DEFAULT 'manual',
  cron_expression TEXT, -- For recurring jobs (e.g., '0 9 * * 1' = every Monday 9am)
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,

  -- Execution state
  status TEXT NOT NULL CHECK (status IN (
    'pending',
    'running',
    'completed',
    'failed',
    'cancelled'
  )) DEFAULT 'pending',

  -- Job configuration
  config JSONB DEFAULT '{}'::jsonb, -- Job-specific config (e.g., { "daysToAnalyze": 7 })

  -- Execution tracking
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Results
  result JSONB, -- Job output/results
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for job queries
CREATE INDEX idx_ai_agent_jobs_type ON public.ai_agent_jobs(job_type);
CREATE INDEX idx_ai_agent_jobs_status ON public.ai_agent_jobs(status);
CREATE INDEX idx_ai_agent_jobs_next_run ON public.ai_agent_jobs(next_run_at) WHERE status = 'pending';
CREATE INDEX idx_ai_agent_jobs_schedule ON public.ai_agent_jobs(schedule_type, status);
CREATE INDEX idx_ai_agent_jobs_created ON public.ai_agent_jobs(created_at DESC);

-- Agent Service State Table
-- Tracks the background service itself
CREATE TABLE IF NOT EXISTS public.ai_agent_service_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Service identification
  service_name TEXT NOT NULL DEFAULT 'ai-agent-orchestrator',
  instance_id TEXT NOT NULL, -- Unique instance ID for this process

  -- Service state
  status TEXT NOT NULL CHECK (status IN ('starting', 'running', 'stopping', 'stopped', 'error')) DEFAULT 'stopped',

  -- Process info
  pid INTEGER, -- Process ID
  hostname TEXT, -- Server hostname
  port INTEGER, -- If service exposes a port

  -- Health tracking
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  health_check_interval_ms INTEGER DEFAULT 30000, -- 30 seconds

  -- Statistics
  jobs_completed INTEGER DEFAULT 0,
  jobs_failed INTEGER DEFAULT 0,
  uptime_ms INTEGER DEFAULT 0,

  -- Metadata
  started_at TIMESTAMPTZ DEFAULT NOW(),
  stopped_at TIMESTAMPTZ,
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active service queries
CREATE INDEX idx_ai_service_state_status ON public.ai_agent_service_state(status);
CREATE INDEX idx_ai_service_state_heartbeat ON public.ai_agent_service_state(last_heartbeat DESC);
CREATE UNIQUE INDEX idx_ai_service_state_instance ON public.ai_agent_service_state(instance_id) WHERE status IN ('starting', 'running');

-- Agent Execution Log Table
-- Detailed logs from agent executions
CREATE TABLE IF NOT EXISTS public.ai_agent_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.ai_agent_jobs(id) ON DELETE CASCADE,

  -- Log entry
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')) DEFAULT 'info',
  message TEXT NOT NULL,
  details JSONB,

  -- Timestamp
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for log queries
CREATE INDEX idx_ai_execution_logs_job ON public.ai_agent_execution_logs(job_id, logged_at DESC);
CREATE INDEX idx_ai_execution_logs_level ON public.ai_agent_execution_logs(level, logged_at DESC);
CREATE INDEX idx_ai_execution_logs_time ON public.ai_agent_execution_logs(logged_at DESC);

-- Enable RLS
ALTER TABLE public.ai_agent_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_service_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_execution_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_agent_jobs
CREATE POLICY "Service role can manage all jobs"
  ON public.ai_agent_jobs
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Super admins can view jobs"
  ON public.ai_agent_jobs
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_roles WHERE role = 'super_admin'
    )
  );

-- RLS Policies for ai_agent_service_state
CREATE POLICY "Service role can manage service state"
  ON public.ai_agent_service_state
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Super admins can view service state"
  ON public.ai_agent_service_state
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_roles WHERE role = 'super_admin'
    )
  );

-- RLS Policies for ai_agent_execution_logs
CREATE POLICY "Service role can manage logs"
  ON public.ai_agent_execution_logs
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Super admins can view logs"
  ON public.ai_agent_execution_logs
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_roles WHERE role = 'super_admin'
    )
  );

-- Update triggers
CREATE TRIGGER update_ai_agent_jobs_updated_at
  BEFORE UPDATE ON public.ai_agent_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_service_state_updated_at
  BEFORE UPDATE ON public.ai_agent_service_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get next pending job
CREATE OR REPLACE FUNCTION get_next_pending_job()
RETURNS public.ai_agent_jobs AS $$
DECLARE
  next_job public.ai_agent_jobs;
BEGIN
  -- Get the next job that should run
  SELECT * INTO next_job
  FROM public.ai_agent_jobs
  WHERE status = 'pending'
    AND (next_run_at IS NULL OR next_run_at <= NOW())
  ORDER BY
    CASE WHEN next_run_at IS NULL THEN NOW() ELSE next_run_at END ASC,
    created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED; -- Prevent race conditions

  RETURN next_job;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to schedule recurring job next run
CREATE OR REPLACE FUNCTION schedule_next_run(
  p_job_id UUID,
  p_cron_expression TEXT
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  next_run TIMESTAMPTZ;
BEGIN
  -- Simple cron parser (supports basic weekly patterns)
  -- Format: 'minute hour day month weekday'
  -- Example: '0 9 * * 1' = Every Monday at 9am

  -- For now, just add 7 days for weekly jobs
  -- TODO: Implement full cron expression parser
  next_run := NOW() + INTERVAL '7 days';

  -- Update job
  UPDATE public.ai_agent_jobs
  SET
    next_run_at = next_run,
    status = 'pending'
  WHERE id = p_job_id;

  RETURN next_run;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_agent_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.ai_agent_execution_logs
  WHERE logged_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Default recurring jobs
-- Insert default weekly optimization cycle
INSERT INTO public.ai_agent_jobs (
  job_type,
  job_name,
  schedule_type,
  cron_expression,
  next_run_at,
  config,
  status
) VALUES (
  'full_optimization_cycle',
  'Weekly AI Prompt Optimization',
  'recurring',
  '0 9 * * 1', -- Every Monday at 9am
  NOW() + INTERVAL '7 days', -- First run in 7 days
  '{"daysToAnalyze": 7, "strategy": "moderate", "experimentDuration": 7}'::jsonb,
  'pending'
) ON CONFLICT DO NOTHING;

-- Add comments
COMMENT ON TABLE public.ai_agent_jobs IS 'Scheduled and executed AI optimization jobs';
COMMENT ON TABLE public.ai_agent_service_state IS 'Background AI agent service health and state tracking';
COMMENT ON TABLE public.ai_agent_execution_logs IS 'Detailed execution logs from AI agent jobs';
COMMENT ON FUNCTION get_next_pending_job() IS 'Retrieves the next job that should be executed';
COMMENT ON FUNCTION schedule_next_run(UUID, TEXT) IS 'Schedules the next run time for recurring jobs';
COMMENT ON FUNCTION cleanup_old_agent_logs() IS 'Removes logs older than 30 days';
