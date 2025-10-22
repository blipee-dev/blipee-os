-- Create sessions table for session-based authentication
-- This replaces large JWT cookies with small session ID cookies

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT,

  -- Ensure token is unique and indexed for fast lookups
  CONSTRAINT sessions_token_unique UNIQUE (session_token)
);

-- Indexes for fast lookups
CREATE INDEX idx_sessions_token ON public.sessions(session_token);
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON public.sessions(expires_at);

-- RLS Policies
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Admin can manage all sessions
CREATE POLICY "Service role can manage sessions"
  ON public.sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
  ON public.sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own sessions (logout)
CREATE POLICY "Users can delete own sessions"
  ON public.sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.sessions
  WHERE expires_at < NOW();
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.cleanup_expired_sessions() TO service_role;

COMMENT ON TABLE public.sessions IS 'Stores user sessions with session tokens for authentication';
COMMENT ON COLUMN public.sessions.session_token IS 'Cryptographically secure random token stored in cookie';
COMMENT ON COLUMN public.sessions.expires_at IS 'Session expiration timestamp';
COMMENT ON COLUMN public.sessions.last_active_at IS 'Last time session was used';
