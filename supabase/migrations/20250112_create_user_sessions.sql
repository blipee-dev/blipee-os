-- Create user_sessions table for tracking user activity
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  session_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_end TIMESTAMPTZ,
  duration_minutes INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_organization_id ON public.user_sessions(organization_id);
CREATE INDEX idx_user_sessions_session_start ON public.user_sessions(session_start);
CREATE INDEX idx_user_sessions_created_at ON public.user_sessions(created_at);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own sessions
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Super admins can view all sessions
CREATE POLICY "Super admins can view all sessions" ON public.user_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.super_admins
      WHERE user_id = auth.uid()
    )
  );

-- System can insert sessions (via service role)
CREATE POLICY "System can manage sessions" ON public.user_sessions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to calculate session duration when ending a session
CREATE OR REPLACE FUNCTION calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.session_end IS NOT NULL AND OLD.session_end IS NULL THEN
    NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.session_end - NEW.session_start)) / 60;
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate duration
CREATE TRIGGER calculate_session_duration_trigger
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_session_duration();

-- Function to get user's average daily time spent
CREATE OR REPLACE FUNCTION get_user_avg_daily_time(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_total_minutes INTEGER;
  v_days_active INTEGER;
BEGIN
  -- Get total minutes from completed sessions
  SELECT COALESCE(SUM(duration_minutes), 0)
  INTO v_total_minutes
  FROM public.user_sessions
  WHERE user_id = p_user_id
    AND duration_minutes IS NOT NULL;

  -- Get number of unique days with sessions
  SELECT COUNT(DISTINCT DATE(session_start))
  INTO v_days_active
  FROM public.user_sessions
  WHERE user_id = p_user_id;

  -- Avoid division by zero
  IF v_days_active = 0 THEN
    RETURN 0;
  END IF;

  -- Return average minutes per day
  RETURN v_total_minutes / v_days_active;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_avg_daily_time TO authenticated;