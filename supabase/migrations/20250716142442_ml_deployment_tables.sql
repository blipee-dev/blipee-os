-- ML Model Deployment Tables
-- Supports production ML model versioning, deployment, and monitoring

-- Drop existing objects if they exist to ensure clean migration
DROP TABLE IF EXISTS ml_deployment_events CASCADE;
DROP TABLE IF EXISTS ml_deployment_metrics CASCADE;
DROP TABLE IF EXISTS ml_ab_tests CASCADE;
DROP TABLE IF EXISTS ml_deployments CASCADE;
DROP TABLE IF EXISTS ml_model_versions CASCADE;
DROP TABLE IF EXISTS ml_model_metadata CASCADE;

-- =====================================================
-- 1. ML MODEL VERSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS ml_model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  framework VARCHAR(50) NOT NULL CHECK (framework IN ('tensorflow', 'pytorch', 'onnx', 'sklearn')),
  artifacts JSONB NOT NULL, -- {modelPath, weightsPath, configPath, preprocessorPath}
  metadata JSONB, -- {createdBy, description, metrics, tags, datasetVersion, trainingConfig}
  status VARCHAR(50) NOT NULL CHECK (status IN ('training', 'validating', 'ready', 'deployed', 'deprecated', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(model_id, version)
);

-- =====================================================
-- 2. ML DEPLOYMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS ml_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version_id UUID NOT NULL REFERENCES ml_model_versions(id) ON DELETE CASCADE,
  environment VARCHAR(50) NOT NULL CHECK (environment IN ('dev', 'staging', 'production')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'deploying', 'active', 'failed', 'terminated')),
  endpoint VARCHAR(500),
  replicas INTEGER DEFAULT 1,
  configuration JSONB, -- Deployment configuration
  metrics JSONB, -- {requestCount, errorRate, avgLatency, lastUpdated}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. ML A/B TESTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS ml_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id VARCHAR(255) NOT NULL,
  version_a VARCHAR(50) NOT NULL,
  version_b VARCHAR(50) NOT NULL,
  traffic_split DECIMAL(3,2) NOT NULL CHECK (traffic_split >= 0 AND traffic_split <= 1),
  duration VARCHAR(50) NOT NULL,
  success_metrics TEXT[],
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')),
  results JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- =====================================================
-- 4. ML DEPLOYMENT METRICS TABLE (Time-series)
-- =====================================================

CREATE TABLE IF NOT EXISTS ml_deployment_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_id UUID NOT NULL REFERENCES ml_deployments(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  metric_type VARCHAR(50) NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  value DECIMAL,
  metadata JSONB
);

-- =====================================================
-- 5. ML MODEL METADATA TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS ml_model_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id VARCHAR(255) NOT NULL UNIQUE,
  model_name VARCHAR(255) NOT NULL,
  model_type VARCHAR(100) NOT NULL,
  description TEXT,
  input_schema JSONB NOT NULL,
  output_schema JSONB NOT NULL,
  requirements JSONB,
  performance JSONB,
  tags TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. ML DEPLOYMENT EVENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS ml_deployment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_id UUID NOT NULL REFERENCES ml_deployments(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  user_id UUID REFERENCES auth.users(id),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_ml_model_versions_model ON ml_model_versions(model_id);
CREATE INDEX IF NOT EXISTS idx_ml_model_versions_status ON ml_model_versions(status);
CREATE INDEX IF NOT EXISTS idx_ml_deployments_version ON ml_deployments(model_version_id);
CREATE INDEX IF NOT EXISTS idx_ml_deployments_env ON ml_deployments(environment);
CREATE INDEX IF NOT EXISTS idx_ml_deployments_status ON ml_deployments(status);
CREATE INDEX IF NOT EXISTS idx_ml_ab_tests_model ON ml_ab_tests(model_id);
CREATE INDEX IF NOT EXISTS idx_ml_ab_tests_status ON ml_ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_ml_deployment_events_deployment ON ml_deployment_events(deployment_id);
CREATE INDEX IF NOT EXISTS idx_deployment_metrics_lookup ON ml_deployment_metrics(deployment_id, timestamp DESC);

-- =====================================================
-- 8. ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE ml_model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_deployment_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_model_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_deployment_events ENABLE ROW LEVEL SECURITY;

-- Model versions: Read by all authenticated, write by ML engineers
CREATE POLICY "Authenticated users can view model versions"
  ON ml_model_versions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage model versions"
  ON ml_model_versions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.role IN ('account_owner', 'admin', 'sustainability_lead')
    )
  );

-- Deployments: Same as model versions
CREATE POLICY "Authenticated users can view deployments"
  ON ml_deployments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage deployments"
  ON ml_deployments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.role IN ('account_owner', 'admin', 'sustainability_lead')
    )
  );

-- A/B tests: Restricted to admins
CREATE POLICY "Admins can manage A/B tests"
  ON ml_ab_tests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.role IN ('account_owner', 'admin', 'sustainability_lead')
    )
  );

-- Metrics: Read-only for all authenticated
CREATE POLICY "Authenticated users can view metrics"
  ON ml_deployment_metrics FOR SELECT
  TO authenticated
  USING (true);

-- System can insert metrics
CREATE POLICY "System can insert metrics"
  ON ml_deployment_metrics FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Model metadata: Same as model versions
CREATE POLICY "Authenticated users can view model metadata"
  ON ml_model_metadata FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage model metadata"
  ON ml_model_metadata FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.role IN ('account_owner', 'admin', 'sustainability_lead')
    )
  );

-- Deployment events: View all, write restricted
CREATE POLICY "Authenticated users can view deployment events"
  ON ml_deployment_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System and admins can create events"
  ON ml_deployment_events FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.role IN ('account_owner', 'admin', 'sustainability_lead')
    )
  );

-- =====================================================
-- 9. FUNCTIONS FOR ML OPERATIONS
-- =====================================================

-- Function to update deployment metrics
CREATE OR REPLACE FUNCTION update_deployment_metrics(
  p_deployment_id UUID,
  p_request_count INTEGER,
  p_error_count INTEGER,
  p_avg_latency DECIMAL
) RETURNS VOID AS $$
BEGIN
  UPDATE ml_deployments
  SET 
    metrics = jsonb_build_object(
      'requestCount', COALESCE((metrics->>'requestCount')::INTEGER, 0) + p_request_count,
      'errorRate', CASE 
        WHEN p_request_count > 0 THEN p_error_count::DECIMAL / p_request_count
        ELSE 0
      END,
      'avgLatency', p_avg_latency,
      'lastUpdated', NOW()
    ),
    updated_at = NOW()
  WHERE id = p_deployment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record deployment event
CREATE OR REPLACE FUNCTION record_deployment_event(
  p_deployment_id UUID,
  p_event_type VARCHAR(50),
  p_event_data JSONB,
  p_user_id UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO ml_deployment_events (
    deployment_id,
    event_type,
    event_data,
    user_id,
    timestamp
  ) VALUES (
    p_deployment_id,
    p_event_type,
    p_event_data,
    p_user_id,
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. TRIGGERS
-- =====================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_ml_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ml_model_versions_updated_at 
  BEFORE UPDATE ON ml_model_versions
  FOR EACH ROW EXECUTE FUNCTION update_ml_updated_at();

CREATE TRIGGER update_ml_deployments_updated_at 
  BEFORE UPDATE ON ml_deployments
  FOR EACH ROW EXECUTE FUNCTION update_ml_updated_at();

CREATE TRIGGER update_ml_model_metadata_updated_at 
  BEFORE UPDATE ON ml_model_metadata
  FOR EACH ROW EXECUTE FUNCTION update_ml_updated_at();

-- Record deployment status changes
CREATE OR REPLACE FUNCTION record_deployment_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM record_deployment_event(
      NEW.id,
      'status_changed',
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deployment_status_change_trigger
  AFTER UPDATE ON ml_deployments
  FOR EACH ROW EXECUTE FUNCTION record_deployment_status_change();