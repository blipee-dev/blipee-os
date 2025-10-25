-- Agent Learning Insights Table
-- Stores learning insights from all V2 agents

CREATE TABLE IF NOT EXISTS public.agent_learning_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  learning_type TEXT NOT NULL,
  insight TEXT NOT NULL,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_agent_learning_insights_agent_name
  ON public.agent_learning_insights(agent_name);

CREATE INDEX IF NOT EXISTS idx_agent_learning_insights_learning_type
  ON public.agent_learning_insights(learning_type);

CREATE INDEX IF NOT EXISTS idx_agent_learning_insights_created_at
  ON public.agent_learning_insights(created_at DESC);

-- RLS Policies (allow authenticated users to read/write)
ALTER TABLE public.agent_learning_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read agent learning insights"
  ON public.agent_learning_insights
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert agent learning insights"
  ON public.agent_learning_insights
  FOR INSERT
  WITH CHECK (true);

-- Comment
COMMENT ON TABLE public.agent_learning_insights IS 'Stores learning insights and feedback from all V2 autonomous agents';
