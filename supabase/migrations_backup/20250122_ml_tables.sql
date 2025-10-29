-- ML Pipeline Tables
-- Support for real machine learning models and predictions

-- ML Models Registry
CREATE TABLE IF NOT EXISTS ml_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  model_type TEXT NOT NULL,
  architecture TEXT NOT NULL,
  parameters JSONB,
  performance JSONB,
  trained_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ml_models_org ON ml_models(organization_id);
CREATE INDEX IF NOT EXISTS idx_ml_models_type ON ml_models(model_type);

-- ML Model Storage
CREATE TABLE IF NOT EXISTS ml_model_storage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  model_type TEXT NOT NULL,
  model_data JSONB NOT NULL,
  path TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, model_type)
);

CREATE INDEX IF NOT EXISTS idx_ml_storage_org_type ON ml_model_storage(organization_id, model_type);

-- ML Training Logs
CREATE TABLE IF NOT EXISTS ml_training_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  model_type TEXT NOT NULL,
  epoch INTEGER,
  loss FLOAT,
  val_loss FLOAT,
  mae FLOAT,
  val_mae FLOAT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ml_training_org ON ml_training_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_ml_training_timestamp ON ml_training_logs(timestamp DESC);

-- ML Evaluations
CREATE TABLE IF NOT EXISTS ml_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  model_type TEXT NOT NULL,
  metrics JSONB,
  evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ml_eval_org ON ml_evaluations(organization_id);
CREATE INDEX IF NOT EXISTS idx_ml_eval_date ON ml_evaluations(evaluated_at DESC);

-- ML Hyperparameters
CREATE TABLE IF NOT EXISTS ml_hyperparameters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  model_type TEXT NOT NULL,
  best_params JSONB,
  all_results JSONB,
  tuned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ml_hyper_org ON ml_hyperparameters(organization_id);

-- ML Training Cycles
CREATE TABLE IF NOT EXISTS ml_training_cycles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ml_cycles_org ON ml_training_cycles(organization_id);
CREATE INDEX IF NOT EXISTS idx_ml_cycles_completed ON ml_training_cycles(completed_at DESC);

-- ML Predictions
CREATE TABLE IF NOT EXISTS ml_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  model_type TEXT NOT NULL,
  predictions JSONB NOT NULL,
  confidence FLOAT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ml_predictions_org ON ml_predictions(organization_id);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_created ON ml_predictions(created_at DESC);

-- Performance Analyses (for optimizer agent)
CREATE TABLE IF NOT EXISTS performance_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  score FLOAT,
  metrics JSONB,
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_perf_analyses_org ON performance_analyses(organization_id);
CREATE INDEX IF NOT EXISTS idx_perf_analyses_date ON performance_analyses(analyzed_at DESC);

-- Optimization Opportunities
CREATE TABLE IF NOT EXISTS optimization_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  area TEXT,
  description TEXT,
  improvement_potential FLOAT,
  estimated_savings FLOAT,
  complexity TEXT,
  confidence FLOAT,
  actions JSONB,
  status TEXT DEFAULT 'identified',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opt_opportunities_org ON optimization_opportunities(organization_id);
CREATE INDEX IF NOT EXISTS idx_opt_opportunities_status ON optimization_opportunities(status);

-- Applied Optimizations
CREATE TABLE IF NOT EXISTS applied_optimizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES optimization_opportunities(id),
  type TEXT,
  target TEXT,
  original_value JSONB,
  new_value JSONB,
  expected_improvement FLOAT,
  actual_improvement FLOAT,
  status TEXT,
  applied_at TIMESTAMPTZ,
  validated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_applied_opt_org ON applied_optimizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_applied_opt_status ON applied_optimizations(status);

-- Device Health Metrics (for predictive maintenance)
CREATE TABLE IF NOT EXISTS device_health_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID REFERENCES devices(id),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  health_score FLOAT,
  failure_probability FLOAT,
  anomaly_count INTEGER,
  critical_issues INTEGER,
  measured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_health_org ON device_health_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_device_health_device ON device_health_metrics(device_id);
CREATE INDEX IF NOT EXISTS idx_device_health_measured ON device_health_metrics(measured_at DESC);

-- Failure Predictions
CREATE TABLE IF NOT EXISTS failure_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID REFERENCES devices(id),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  probability FLOAT,
  predicted_date TIMESTAMPTZ,
  confidence FLOAT,
  risk_factors JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_failure_pred_org ON failure_predictions(organization_id);
CREATE INDEX IF NOT EXISTS idx_failure_pred_device ON failure_predictions(device_id);

-- Detected Anomalies
CREATE TABLE IF NOT EXISTS detected_anomalies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID REFERENCES devices(id),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT,
  severity TEXT,
  value FLOAT,
  threshold FLOAT,
  deviation FLOAT,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anomalies_org ON detected_anomalies(organization_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_device ON detected_anomalies(device_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_severity ON detected_anomalies(severity);

-- Maintenance Schedules
CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID REFERENCES devices(id),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  scheduled_date TIMESTAMPTZ,
  type TEXT,
  priority TEXT,
  tasks TEXT[],
  estimated_duration FLOAT,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maint_schedules_org ON maintenance_schedules(organization_id);
CREATE INDEX IF NOT EXISTS idx_maint_schedules_device ON maintenance_schedules(device_id);
CREATE INDEX IF NOT EXISTS idx_maint_schedules_date ON maintenance_schedules(scheduled_date);

-- Resource Allocations (for optimizer)
CREATE TABLE IF NOT EXISTS resource_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resource_type TEXT,
  allocated FLOAT,
  used FLOAT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resource_alloc_org ON resource_allocations(organization_id);

-- System Settings (for optimizer)
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key TEXT,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT,
  UNIQUE(organization_id, key)
);

CREATE INDEX IF NOT EXISTS idx_system_settings_org ON system_settings(organization_id);

-- System Schedules (for optimizer)
CREATE TABLE IF NOT EXISTS system_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  system TEXT,
  action TEXT,
  schedule TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_schedules_org ON system_schedules(organization_id);

-- Automations (for optimizer)
CREATE TABLE IF NOT EXISTS automations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  target TEXT,
  type TEXT,
  configuration JSONB,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automations_org ON automations(organization_id);

-- Enable Row Level Security
ALTER TABLE ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_model_storage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_training_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_hyperparameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_training_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE applied_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE failure_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE detected_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organization-level access (example for ml_models)
CREATE POLICY "Organization members can view ML models"
  ON ml_models FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;