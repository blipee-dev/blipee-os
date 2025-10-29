-- Add A/B Testing Tables for Prompt Optimization
-- These tables enable experimentation with different AI prompt variants

-- Prompt Versions Table
CREATE TABLE IF NOT EXISTS public.ai_prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  prompt_content TEXT NOT NULL,
  system_prompt TEXT,
  model_config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- A/B Experiments Table
CREATE TABLE IF NOT EXISTS public.ai_ab_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  variants JSONB NOT NULL, -- Array of {id, promptVersionId, trafficPercentage}
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'stopped', 'completed')),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  winner_variant_id UUID,
  confidence_level NUMERIC(5,2),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_ai_prompt_versions_active ON public.ai_prompt_versions(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_prompt_versions_default ON public.ai_prompt_versions(is_default);
CREATE INDEX IF NOT EXISTS idx_ai_ab_experiments_status ON public.ai_ab_experiments(status);
CREATE INDEX IF NOT EXISTS idx_ai_ab_experiments_dates ON public.ai_ab_experiments(start_date, end_date);

-- Add RLS policies
ALTER TABLE public.ai_prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_ab_experiments ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
DROP POLICY IF EXISTS "Allow read access to ai_prompt_versions" ON public.ai_prompt_versions;
CREATE POLICY "Allow read access to ai_prompt_versions"
  ON public.ai_prompt_versions
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admin to manage prompt versions
DROP POLICY IF EXISTS "Allow admin to manage ai_prompt_versions" ON public.ai_prompt_versions;
CREATE POLICY "Allow admin to manage ai_prompt_versions"
  ON public.ai_prompt_versions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow read access to experiments
DROP POLICY IF EXISTS "Allow read access to ai_ab_experiments" ON public.ai_ab_experiments;
CREATE POLICY "Allow read access to ai_ab_experiments"
  ON public.ai_ab_experiments
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admin to manage experiments
DROP POLICY IF EXISTS "Allow admin to manage ai_ab_experiments" ON public.ai_ab_experiments;
CREATE POLICY "Allow admin to manage ai_ab_experiments"
  ON public.ai_ab_experiments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_ai_prompt_versions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_ai_ab_experiments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ai_prompt_versions_updated_at ON public.ai_prompt_versions;
CREATE TRIGGER trigger_update_ai_prompt_versions_updated_at
  BEFORE UPDATE ON public.ai_prompt_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_prompt_versions_updated_at();

DROP TRIGGER IF EXISTS trigger_update_ai_ab_experiments_updated_at ON public.ai_ab_experiments;
CREATE TRIGGER trigger_update_ai_ab_experiments_updated_at
  BEFORE UPDATE ON public.ai_ab_experiments
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_ab_experiments_updated_at();
