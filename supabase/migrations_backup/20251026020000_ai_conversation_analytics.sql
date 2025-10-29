-- AI Conversation Analytics
-- Tracks conversation performance metrics for ML-based prompt optimization

CREATE TABLE IF NOT EXISTS public.ai_conversation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Message context
  message_id TEXT NOT NULL,
  user_message TEXT NOT NULL,
  assistant_response TEXT,

  -- Performance metrics
  response_time_ms INTEGER,
  total_tokens INTEGER,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,

  -- Tool usage tracking
  tools_called JSONB DEFAULT '[]'::jsonb, -- Array of {name, success, error, execution_time_ms}
  tool_success_rate DECIMAL(5,2), -- Percentage of successful tool calls
  clarifying_questions_asked INTEGER DEFAULT 0,

  -- User feedback
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5), -- 1-5 stars
  user_feedback TEXT,
  helpful BOOLEAN, -- Thumbs up/down

  -- Context awareness
  page_context TEXT, -- Which page user was on (/sustainability, /settings, etc.)
  conversation_length INTEGER, -- Number of messages in conversation at this point

  -- Outcome tracking
  task_completed BOOLEAN,
  required_followup BOOLEAN, -- Did user have to ask again?
  error_occurred BOOLEAN,
  error_message TEXT,

  -- Prompt version tracking
  prompt_version TEXT NOT NULL DEFAULT 'v1.0',
  model_id TEXT NOT NULL,

  -- A/B testing
  experiment_id UUID, -- For A/B tests
  variant_id TEXT, -- Which prompt variant was used

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX idx_ai_analytics_conversation ON public.ai_conversation_analytics(conversation_id);
CREATE INDEX idx_ai_analytics_user ON public.ai_conversation_analytics(user_id);
CREATE INDEX idx_ai_analytics_org ON public.ai_conversation_analytics(organization_id);
CREATE INDEX idx_ai_analytics_created ON public.ai_conversation_analytics(created_at DESC);
CREATE INDEX idx_ai_analytics_rating ON public.ai_conversation_analytics(user_rating);
CREATE INDEX idx_ai_analytics_helpful ON public.ai_conversation_analytics(helpful);
CREATE INDEX idx_ai_analytics_prompt_version ON public.ai_conversation_analytics(prompt_version);
CREATE INDEX idx_ai_analytics_experiment ON public.ai_conversation_analytics(experiment_id, variant_id);
CREATE INDEX idx_ai_analytics_page_context ON public.ai_conversation_analytics(page_context);

-- GIN index for JSONB tool usage queries
CREATE INDEX idx_ai_analytics_tools_called ON public.ai_conversation_analytics USING GIN(tools_called);

-- Enable RLS
ALTER TABLE public.ai_conversation_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own analytics"
  ON public.ai_conversation_analytics
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all analytics"
  ON public.ai_conversation_analytics
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Prompt Versions Table
-- Tracks different versions of system prompts for A/B testing
CREATE TABLE IF NOT EXISTS public.ai_prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_name TEXT UNIQUE NOT NULL,
  prompt_text TEXT NOT NULL,

  -- Metadata
  description TEXT,
  created_by UUID REFERENCES auth.users(id),

  -- Performance metrics (aggregated from analytics)
  avg_rating DECIMAL(3,2),
  total_conversations INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),
  avg_response_time_ms INTEGER,

  -- Status
  is_active BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure only one default
  CONSTRAINT only_one_default EXCLUDE (is_default WITH =) WHERE (is_default = true)
);

-- Index for active prompt queries
CREATE INDEX idx_prompt_versions_active ON public.ai_prompt_versions(is_active);
CREATE INDEX idx_prompt_versions_default ON public.ai_prompt_versions(is_default);

-- Enable RLS
ALTER TABLE public.ai_prompt_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active prompts"
  ON public.ai_prompt_versions
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role can manage prompts"
  ON public.ai_prompt_versions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- A/B Test Experiments Table
CREATE TABLE IF NOT EXISTS public.ai_ab_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,

  -- Experiment configuration
  variants JSONB NOT NULL, -- Array of {id, prompt_version_id, traffic_percentage}
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,

  -- Status
  status TEXT CHECK (status IN ('draft', 'running', 'completed', 'stopped')) DEFAULT 'draft',

  -- Results (calculated from analytics)
  winner_variant_id TEXT,
  confidence_level DECIMAL(5,2),

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active experiments
CREATE INDEX idx_ab_experiments_status ON public.ai_ab_experiments(status);

-- Enable RLS
ALTER TABLE public.ai_ab_experiments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role can manage experiments"
  ON public.ai_ab_experiments
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Pattern Analysis Cache Table
-- Stores ML-generated insights about conversation patterns
CREATE TABLE IF NOT EXISTS public.ai_pattern_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Pattern metadata
  pattern_type TEXT NOT NULL, -- 'failed_query', 'tool_selection_error', 'clarification_needed', etc.
  pattern_description TEXT NOT NULL,

  -- Pattern data
  example_queries TEXT[], -- Sample queries that match this pattern
  frequency INTEGER DEFAULT 1, -- How often this pattern occurs

  -- ML-generated suggestions
  suggested_prompt_improvements TEXT,
  confidence_score DECIMAL(5,2),

  -- Date range analyzed
  analyzed_from TIMESTAMPTZ NOT NULL,
  analyzed_to TIMESTAMPTZ NOT NULL,

  -- Status
  is_actionable BOOLEAN DEFAULT true,
  is_resolved BOOLEAN DEFAULT false,
  resolved_in_version TEXT REFERENCES public.ai_prompt_versions(version_name),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for pattern queries
CREATE INDEX idx_pattern_insights_type ON public.ai_pattern_insights(pattern_type);
CREATE INDEX idx_pattern_insights_frequency ON public.ai_pattern_insights(frequency DESC);
CREATE INDEX idx_pattern_insights_actionable ON public.ai_pattern_insights(is_actionable);

-- Enable RLS
ALTER TABLE public.ai_pattern_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role can manage pattern insights"
  ON public.ai_pattern_insights
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_conversation_analytics_updated_at
  BEFORE UPDATE ON public.ai_conversation_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_prompt_versions_updated_at
  BEFORE UPDATE ON public.ai_prompt_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_ab_experiments_updated_at
  BEFORE UPDATE ON public.ai_ab_experiments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_pattern_insights_updated_at
  BEFORE UPDATE ON public.ai_pattern_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.ai_conversation_analytics IS 'Tracks performance metrics for each AI conversation for ML-based optimization';
COMMENT ON TABLE public.ai_prompt_versions IS 'Stores different versions of system prompts for A/B testing and versioning';
COMMENT ON TABLE public.ai_ab_experiments IS 'Manages A/B testing experiments for prompt optimization';
COMMENT ON TABLE public.ai_pattern_insights IS 'Stores ML-generated insights about conversation patterns for continuous improvement';
