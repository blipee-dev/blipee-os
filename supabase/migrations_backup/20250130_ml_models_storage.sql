-- ML Models Storage Schema
-- Stores trained ML model metadata and weights

-- Create storage bucket for model files if not exists
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'ml-models',
  'ml-models',
  false,
  false,
  52428800, -- 50MB limit
  ARRAY['application/json', 'application/octet-stream']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Table for ML model metadata
CREATE TABLE IF NOT EXISTS ml_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  model_type TEXT NOT NULL, -- 'lstm', 'arima', 'ensemble'
  model_version INTEGER NOT NULL DEFAULT 1,

  -- Model files in storage
  model_config_path TEXT, -- JSON config in storage
  model_weights_path TEXT, -- Binary weights in storage
  scaler_params JSONB, -- Normalization parameters

  -- Training metadata
  training_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  training_metrics JSONB, -- Loss, accuracy, etc.
  training_data_stats JSONB, -- Mean, std, data points, date range
  trained_by UUID REFERENCES auth.users(id),

  -- Model performance
  validation_metrics JSONB, -- MAE, MAPE, RMSE
  feature_importance JSONB,

  -- Status
  is_active BOOLEAN DEFAULT false,
  is_production BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,

  -- Ensure only one production model per type per org
  UNIQUE(organization_id, model_type, is_production)
    DEFERRABLE INITIALLY DEFERRED
);

-- Index for faster queries
CREATE INDEX idx_ml_models_org_type ON ml_models(organization_id, model_type);
CREATE INDEX idx_ml_models_active ON ml_models(is_active) WHERE is_active = true;
CREATE INDEX idx_ml_models_production ON ml_models(is_production) WHERE is_production = true;

-- Table for training schedules
CREATE TABLE IF NOT EXISTS ml_training_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  model_type TEXT NOT NULL,

  -- Schedule configuration
  schedule_type TEXT NOT NULL DEFAULT 'monthly', -- 'daily', 'weekly', 'monthly'
  day_of_month INTEGER DEFAULT 1, -- 1-31 for monthly
  hour_of_day INTEGER DEFAULT 2, -- 0-23 (2 AM default)
  timezone TEXT DEFAULT 'UTC',

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  last_run_status TEXT, -- 'success', 'failed', 'running'
  last_run_duration_ms INTEGER,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, model_type)
);

-- Table for training history
CREATE TABLE IF NOT EXISTS ml_training_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  model_id UUID REFERENCES ml_models(id) ON DELETE SET NULL,
  model_type TEXT NOT NULL,

  -- Training details
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  status TEXT NOT NULL, -- 'running', 'success', 'failed'

  -- Data used
  data_points INTEGER,
  date_range_start DATE,
  date_range_end DATE,

  -- Results
  metrics JSONB,
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to get latest production model
CREATE OR REPLACE FUNCTION get_production_model(
  p_organization_id UUID,
  p_model_type TEXT
)
RETURNS ml_models AS $$
DECLARE
  v_model ml_models;
BEGIN
  SELECT * INTO v_model
  FROM ml_models
  WHERE organization_id = p_organization_id
    AND model_type = p_model_type
    AND is_production = true
    AND is_active = true
  ORDER BY training_date DESC
  LIMIT 1;

  RETURN v_model;
END;
$$ LANGUAGE plpgsql;

-- Function to promote model to production
CREATE OR REPLACE FUNCTION promote_model_to_production(
  p_model_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_org_id UUID;
  v_model_type TEXT;
BEGIN
  -- Get model info
  SELECT organization_id, model_type
  INTO v_org_id, v_model_type
  FROM ml_models
  WHERE id = p_model_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Model not found';
  END IF;

  -- Demote current production model
  UPDATE ml_models
  SET is_production = false,
      updated_at = NOW()
  WHERE organization_id = v_org_id
    AND model_type = v_model_type
    AND is_production = true;

  -- Promote new model
  UPDATE ml_models
  SET is_production = true,
      is_active = true,
      updated_at = NOW()
  WHERE id = p_model_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_training_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_training_history ENABLE ROW LEVEL SECURITY;

-- Models: Organizations can only see their own models
CREATE POLICY "Organizations can view own ML models"
  ON ml_models FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage ML models"
  ON ml_models FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = ml_models.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

-- Training schedules: Same as models
CREATE POLICY "Organizations can view own training schedules"
  ON ml_training_schedules FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage training schedules"
  ON ml_training_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = ml_training_schedules.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

-- Training history: Read-only for all org members
CREATE POLICY "Organizations can view training history"
  ON ml_training_history FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ml_models_updated_at
  BEFORE UPDATE ON ml_models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ml_training_schedules_updated_at
  BEFORE UPDATE ON ml_training_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Default training schedule for PLMJ (monthly on the 1st at 2 AM)
INSERT INTO ml_training_schedules (
  organization_id,
  model_type,
  schedule_type,
  day_of_month,
  hour_of_day,
  timezone,
  next_run_at
)
SELECT
  id,
  'emissions-forecast',
  'monthly',
  1,
  2,
  'Europe/Lisbon',
  DATE_TRUNC('month', NOW() + INTERVAL '1 month') + INTERVAL '2 hours'
FROM organizations
WHERE name = 'PLMJ'
ON CONFLICT (organization_id, model_type) DO NOTHING;